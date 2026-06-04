#!/usr/bin/env node

/**
 * Reddit Rosie — Biweekly Feedback Analysis
 *
 * Queries Supabase for dismiss feedback and training submissions,
 * analyzes patterns, and generates a recommendations report.
 *
 * Runs via Claude Code Routine (server-side, no local dependencies).
 * Uses Supabase REST API directly — no MCP or OAuth needed.
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run manually: node scripts/analyze-feedback.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// --- Supabase REST API helper ---

async function supabaseQuery(table, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase query failed: ${res.status} ${err}`);
  }
  return res.json();
}

// --- Main ---

async function main() {
  const now = new Date();
  const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
  const dateStr = now.toISOString().slice(0, 10);

  console.log('Reddit Rosie — Feedback Analysis');
  console.log(`Date: ${dateStr}`);
  console.log(`Analyzing data from ${fourteenDaysAgo.slice(0, 10)} to ${dateStr}`);
  console.log('---');

  // --- Fetch dismiss feedback ---
  const dismissals = await supabaseQuery(
    'dismiss_feedback',
    `select=*,conversations(subreddit,title,relevance_score,search_type)&created_at=gte.${fourteenDaysAgo}&order=created_at.desc`
  );

  // --- Fetch training submissions ---
  const trainings = await supabaseQuery(
    'training_submissions',
    `select=*,conversations(subreddit,title)&created_at=gte.${fourteenDaysAgo}&order=created_at.desc`
  );

  // --- Fetch conversation stats for context ---
  const totalConversations = await supabaseQuery(
    'conversations',
    `select=id&first_seen_at=gte.${fourteenDaysAgo}`
  );
  const completedConversations = await supabaseQuery(
    'conversations',
    `select=id&status=eq.completed&first_seen_at=gte.${fourteenDaysAgo}`
  );

  console.log(`Dismiss feedback entries: ${dismissals.length}`);
  console.log(`Training submissions: ${trainings.length}`);
  console.log(`Total conversations (14d): ${totalConversations.length}`);
  console.log(`Completed conversations (14d): ${completedConversations.length}`);

  // --- Analyze dismiss patterns ---
  const reasonCounts = {};
  const subredditDismissals = {};
  const searchTypeDismissals = { broad: 0, narrow: 0 };
  let dismissedScoreSum = 0;
  let dismissedScoreCount = 0;

  for (const d of dismissals) {
    // Count reasons
    reasonCounts[d.reason] = (reasonCounts[d.reason] || 0) + 1;

    // Count by subreddit
    const sub = d.conversations?.subreddit || 'unknown';
    subredditDismissals[sub] = (subredditDismissals[sub] || 0) + 1;

    // Count by search type
    const st = d.conversations?.search_type || 'unknown';
    if (st === 'broad') searchTypeDismissals.broad++;
    else if (st === 'narrow') searchTypeDismissals.narrow++;

    // Quality score stats
    const score = d.conversations?.relevance_score;
    if (score != null) {
      dismissedScoreSum += score;
      dismissedScoreCount++;
    }
  }

  const avgDismissedScore = dismissedScoreCount > 0
    ? Math.round(dismissedScoreSum / dismissedScoreCount)
    : 'N/A';

  // Sort reasons by count
  const sortedReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1]);

  // Sort subreddits by dismissal count
  const sortedSubreddits = Object.entries(subredditDismissals)
    .sort((a, b) => b[1] - a[1]);

  // Custom feedback text
  const customFeedback = dismissals
    .filter(d => d.custom_feedback)
    .map(d => `- "${d.custom_feedback}" (reason: ${d.reason}, sub: ${d.conversations?.subreddit || '?'})`);

  // --- Analyze training submissions ---
  const trainingsByType = { corporate: 0, personal: 0 };
  const trainingDetails = [];

  for (const t of trainings) {
    trainingsByType[t.draft_type] = (trainingsByType[t.draft_type] || 0) + 1;

    const originalLen = (t.original_draft || '').length;
    const rewrittenLen = (t.rewritten_draft || '').length;
    const lenChange = rewrittenLen - originalLen;
    const lenChangePercent = originalLen > 0 ? Math.round((lenChange / originalLen) * 100) : 0;

    trainingDetails.push({
      draftType: t.draft_type,
      creatorId: t.creator_id,
      subreddit: t.conversations?.subreddit || '?',
      title: t.conversations?.title || '?',
      originalLen,
      rewrittenLen,
      lenChangePercent,
    });
  }

  const avgLenChange = trainingDetails.length > 0
    ? Math.round(trainingDetails.reduce((s, t) => s + t.lenChangePercent, 0) / trainingDetails.length)
    : 0;

  // --- Build report ---

  const reasonLabels = {
    wrong_topic: 'Wrong topic',
    too_promotional: 'Too promotional',
    too_basic: 'Too basic',
    wrong_audience: 'Wrong audience',
    already_answered: 'Already answered',
    low_engagement: 'Low engagement',
    other: 'Other',
  };

  let report = `# Reddit Rosie — Feedback Analysis Report
**Date range:** ${fourteenDaysAgo.slice(0, 10)} to ${dateStr}
**Generated:** ${now.toISOString()}

---

## Summary
- **${dismissals.length}** dismiss feedback entries analyzed
- **${trainings.length}** training submissions analyzed
- **${totalConversations.length}** total conversations surfaced in period
- **${completedConversations.length}** conversations marked complete
- **Dismiss rate:** ${totalConversations.length > 0 ? Math.round((dismissals.length / totalConversations.length) * 100) : 0}%

---

## Dismiss Feedback Patterns
`;

  if (dismissals.length === 0) {
    report += '\nNo dismiss feedback recorded in this period.\n';
  } else {
    report += '\n### Top reasons for dismissal\n';
    for (const [reason, count] of sortedReasons) {
      const pct = Math.round((count / dismissals.length) * 100);
      report += `${sortedReasons.indexOf([reason, count]) + 1}. **${reasonLabels[reason] || reason}** — ${count} occurrences (${pct}%)\n`;
    }
    // Fix numbering
    report = report.replace(/NaN\./g, '');
    let num = 1;
    for (const [reason, count] of sortedReasons) {
      const pct = Math.round((count / dismissals.length) * 100);
      report = report.replace(
        `**${reasonLabels[reason] || reason}** — ${count} occurrences (${pct}%)`,
        `**${reasonLabels[reason] || reason}** — ${count} occurrences (${pct}%)`
      );
      num++;
    }

    report += `\n### Subreddits with highest dismiss rates\n`;
    for (const [sub, count] of sortedSubreddits.slice(0, 10)) {
      report += `- **r/${sub}**: ${count} dismissals\n`;
    }

    report += `\n### Search type breakdown\n`;
    report += `- Broad search dismissals: ${searchTypeDismissals.broad}\n`;
    report += `- Narrow search dismissals: ${searchTypeDismissals.narrow}\n`;

    report += `\n### Quality score of dismissed posts\n`;
    report += `- Average quality score of dismissed posts: **${avgDismissedScore}**\n`;

    if (customFeedback.length > 0) {
      report += `\n### Custom feedback from users\n`;
      for (const fb of customFeedback) {
        report += `${fb}\n`;
      }
    }
  }

  report += `\n---\n\n## Training Submission Insights\n`;

  if (trainings.length === 0) {
    report += '\nNo training submissions recorded in this period.\n';
  } else {
    report += `\n### Overview\n`;
    report += `- Corporate draft rewrites: ${trainingsByType.corporate || 0}\n`;
    report += `- Personal draft rewrites: ${trainingsByType.personal || 0}\n`;
    report += `- Average length change: **${avgLenChange > 0 ? '+' : ''}${avgLenChange}%** (${avgLenChange < 0 ? 'humans write shorter' : avgLenChange > 0 ? 'humans write longer' : 'same length'})\n`;

    report += `\n### Individual submissions\n`;
    for (const t of trainingDetails) {
      report += `- **${t.draftType}** draft for r/${t.subreddit}: "${t.title.slice(0, 60)}..." — length change: ${t.lenChangePercent > 0 ? '+' : ''}${t.lenChangePercent}%\n`;
    }

    report += `\n### NOTE: Detailed text comparison\n`;
    report += `The full original and rewritten drafts are stored in the training_submissions table.\n`;
    report += `For a detailed diff analysis, query: SELECT original_draft, rewritten_draft FROM training_submissions WHERE created_at >= '${fourteenDaysAgo}'\n`;
  }

  report += `\n---\n\n## Recommendations\n\n`;
  report += `*Review these recommendations and decide which to implement. No changes are made automatically.*\n\n`;

  // Auto-generate recommendations based on data
  const recommendations = [];

  if (sortedReasons.length > 0 && sortedReasons[0][1] >= 3) {
    const topReason = reasonLabels[sortedReasons[0][0]] || sortedReasons[0][0];
    recommendations.push(`**Scoring:** The top dismiss reason is "${topReason}" (${sortedReasons[0][1]} times). Consider adjusting quality scoring weights to better filter these posts.`);
  }

  if (sortedSubreddits.length > 0 && sortedSubreddits[0][1] >= 5) {
    recommendations.push(`**Monitoring:** r/${sortedSubreddits[0][0]} has the most dismissals (${sortedSubreddits[0][1]}). Consider removing it from monitored subreddits or narrowing its keyword queries.`);
  }

  if (avgDismissedScore !== 'N/A' && avgDismissedScore < 60) {
    recommendations.push(`**Quality threshold:** Dismissed posts average a quality score of ${avgDismissedScore}. Consider raising the minimum threshold above this level.`);
  }

  if (avgLenChange < -15) {
    recommendations.push(`**Draft length:** Humans consistently shorten drafts by ${Math.abs(avgLenChange)}%. Consider reducing the target word count in the draft generation prompts.`);
  }

  if (avgLenChange > 15) {
    recommendations.push(`**Draft depth:** Humans consistently expand drafts by ${avgLenChange}%. Consider allowing longer responses in the draft generation prompts.`);
  }

  if (recommendations.length === 0) {
    recommendations.push('No strong patterns detected yet. Continue collecting data for the next review cycle.');
  }

  for (const rec of recommendations) {
    report += `- [ ] ${rec}\n`;
  }

  report += `\n---\n\n*This report was auto-generated by Reddit Rosie's feedback analysis routine. No changes were made to the app.*\n`;

  // --- Save report ---
  const reportsDir = join(__dirname, '..', 'reports');
  mkdirSync(reportsDir, { recursive: true });
  const reportPath = join(reportsDir, `feedback-review-${dateStr}.md`);
  writeFileSync(reportPath, report);

  console.log(`\nReport saved to: ${reportPath}`);
  console.log('\n--- KEY FINDINGS ---');
  if (dismissals.length > 0 && sortedReasons.length > 0) {
    console.log(`Top dismiss reason: ${reasonLabels[sortedReasons[0][0]] || sortedReasons[0][0]} (${sortedReasons[0][1]} times)`);
  }
  if (trainings.length > 0) {
    console.log(`Training submissions: ${trainings.length} (avg length change: ${avgLenChange}%)`);
  }
  for (const rec of recommendations) {
    console.log(`Recommendation: ${rec.replace(/\*\*/g, '')}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
