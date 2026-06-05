#!/usr/bin/env node

/**
 * Reddit RSS Feed Fetcher for Reddit Rosie
 *
 * Fetches posts from target subreddits via Reddit RSS feeds,
 * scores them for relevance to Merchynt's business, and saves
 * the results as a static JSON file for the app to serve.
 *
 * Run manually: node scripts/fetch-reddit.mjs
 * Run via GitHub Actions: .github/workflows/refresh-reddit.yml
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'public', 'data', 'conversations.json');

// Supabase client (uses service_role key for full write access)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (SUPABASE_URL && SUPABASE_SERVICE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

// --- Configuration ---

// BROAD SEARCHES: keyword queries across ALL of Reddit
// These catch conversations in subreddits we'd never think to monitor
// (dentist forums, plumber communities, local city subs, etc.)
const GLOBAL_QUERIES = [
  // Brand monitoring — find every mention anywhere on Reddit
  { query: 'Merchynt', time: 'day', label: 'brand-mention' },
  { query: '"Paige" AND ("local SEO" OR "GBP" OR "Google Business")', time: 'day', label: 'brand-mention' },

  // Competitor monitoring
  { query: 'BrightLocal OR Whitespark OR "Moz Local" OR Yext', time: 'day', label: 'competitor' },
  { query: 'SOCi OR "Vendasta" OR "GoSite"', time: 'day', label: 'competitor' },

  // High-intent keywords across all of Reddit
  { query: '"Google Business Profile" AND (help OR advice OR recommend OR best)', time: 'day', label: 'high-intent' },
  { query: '"local SEO" AND (tool OR software OR recommend OR alternative)', time: 'day', label: 'high-intent' },
  { query: '"Google Maps ranking" AND (how OR improve OR help)', time: 'day', label: 'high-intent' },
  { query: '"Google Maps" AND ("not showing" OR "not ranking" OR "disappeared")', time: 'day', label: 'high-intent' },
  { query: '"Google reviews" AND (management OR automate OR respond OR strategy)', time: 'day', label: 'high-intent' },
  { query: '"reputation management" AND (tool OR software OR agency OR small business)', time: 'day', label: 'high-intent' },
  { query: '"AI search" AND ("local business" OR "small business" OR "Google Business")', time: 'day', label: 'ai-search' },
  { query: '"ChatGPT" AND ("local business" OR "find a" OR "recommend" OR "near me")', time: 'day', label: 'ai-search' },

  // Agency-specific
  { query: '"white label" AND ("local SEO" OR "GBP" OR "Google Business")', time: 'day', label: 'agency' },
  { query: '"agency" AND ("local SEO" OR "GBP management" OR "client retention")', time: 'day', label: 'agency' },
];

// NARROW SEARCHES: within specific SEO/marketing subreddits
const SUBREDDIT_QUERIES = [
  {
    subreddit: 'localseo',
    queries: [
      '"Google Business Profile" OR "GBP" OR "local SEO"',
      '"review management" OR "Google Maps ranking" OR "AI search"',
      '"citation" OR "local pack" OR "map pack"',
    ],
  },
  {
    subreddit: 'SEO',
    queries: [
      '"local SEO" OR "Google Business Profile" OR "Google Maps"',
      '"AI search" OR "GEO" OR "generative engine optimization"',
    ],
  },
  {
    subreddit: 'smallbusiness',
    queries: [
      '"Google Business Profile" OR "Google reviews" OR "local SEO"',
      '"Google Maps" OR "online reviews" OR "local marketing"',
    ],
  },
  {
    subreddit: 'marketing',
    queries: [
      '"local SEO" OR "Google Business" OR "local marketing"',
      '"AI marketing" OR "review management"',
    ],
  },
  {
    subreddit: 'digital_marketing',
    queries: [
      '"local SEO" OR "Google Business" OR "AI search"',
      '"review management" OR "local marketing"',
    ],
  },
  {
    subreddit: 'agency',
    queries: [
      'SEO OR "local marketing" OR "white label"',
      '"client management" OR "agency margins" OR "local SEO"',
    ],
  },
  {
    subreddit: 'Entrepreneur',
    queries: [
      '"local business" OR "Google reviews" OR "small business marketing"',
      '"Google Business" OR "online presence"',
    ],
  },
  // Bonus subreddits for broader coverage
  {
    subreddit: 'webmarketing',
    queries: ['"local SEO" OR "Google Business"'],
  },
  {
    subreddit: 'bigseo',
    queries: ['"local SEO" OR "Google Business Profile" OR "AI search"'],
  },
];

// Brand and competitor terms for relevance scoring
const HIGH_VALUE_TERMS = [
  { term: 'merchynt', weight: 50 },
  { term: 'paige', weight: 40 }, // only in local SEO context
  { term: 'brightlocal', weight: 30 },
  { term: 'whitespark', weight: 30 },
  { term: 'moz local', weight: 25 },
  { term: 'yext', weight: 20 },
];

const TOPIC_TERMS = [
  { term: 'google business profile', weight: 15 },
  { term: 'gbp', weight: 12 },
  { term: 'local seo', weight: 12 },
  { term: 'google maps ranking', weight: 12 },
  { term: 'review management', weight: 10 },
  { term: 'google reviews', weight: 10 },
  { term: 'ai search', weight: 10 },
  { term: 'ai visibility', weight: 10 },
  { term: 'local pack', weight: 8 },
  { term: 'map pack', weight: 8 },
  { term: 'citation', weight: 6 },
  { term: 'local marketing', weight: 6 },
  { term: 'online reviews', weight: 6 },
  { term: 'google maps', weight: 6 },
  { term: 'local business', weight: 5 },
  { term: 'seo tool', weight: 5 },
  { term: 'agency', weight: 3 },
];

// Subreddits where Merchynt has the most authority/relevance
const HIGH_VALUE_SUBREDDITS = ['localseo', 'seo', 'smallbusiness'];
const MEDIUM_VALUE_SUBREDDITS = ['marketing', 'digital_marketing', 'agency'];

// --- RSS Fetching ---

async function fetchRSS(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'reddit-rosie/0.6 (social listening tool by Merchynt)',
    },
  });

  if (!res.ok) {
    console.error(`  RSS fetch failed: ${res.status} ${res.statusText} for ${url}`);
    return '';
  }

  return res.text();
}

function parseAtomFeed(xml) {
  const entries = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];

    const getField = (tag) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m ? m[1].trim() : '';
    };

    const getAttr = (tag, attr) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i'));
      return m ? m[1] : '';
    };

    // Extract author name (format: /u/username)
    const authorRaw = getField('name');
    const authorUsername = authorRaw.replace(/^\/u\//, '');

    // Extract HTML content and convert to plain text
    const contentHtml = getField('content');
    const selftext = contentHtml
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#32;/g, ' ')
      .replace(/<[^>]+>/g, '') // strip HTML tags
      .replace(/\[link\]/g, '')
      .replace(/\[comments\]/g, '')
      .replace(/submitted by\s+\/u\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract post ID (format: t3_xxxxx)
    const idRaw = getField('id');
    const id = idRaw.replace(/^t3_/, '');

    // Extract permalink
    const permalink = getAttr('link', 'href');

    // Extract subreddit
    const subreddit = getAttr('category', 'term');

    const title = getField('title')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    entries.push({
      id,
      title,
      selftext,
      authorUsername,
      subredditName: subreddit,
      createdAtDate: getField('published') || getField('updated'),
      permalink: permalink.replace('https://www.reddit.com', ''),
      url: permalink,
    });
  }

  return entries;
}

// --- Relevance Scoring ---

function scorePost(post) {
  const text = `${post.title} ${post.selftext}`.toLowerCase();
  let score = 0;
  const matchedTerms = [];

  // High-value brand/competitor mentions
  for (const { term, weight } of HIGH_VALUE_TERMS) {
    if (text.includes(term)) {
      // Special case: "paige" needs context (common name)
      if (term === 'paige') {
        if (text.includes('paige') && (text.includes('seo') || text.includes('local') || text.includes('gbp') || text.includes('merchynt'))) {
          score += weight;
          matchedTerms.push(term);
        }
      } else {
        score += weight;
        matchedTerms.push(term);
      }
    }
  }

  // Topic relevance
  for (const { term, weight } of TOPIC_TERMS) {
    if (text.includes(term)) {
      score += weight;
      matchedTerms.push(term);
    }
  }

  // Subreddit relevance boost
  const sub = post.subredditName.toLowerCase();
  if (HIGH_VALUE_SUBREDDITS.includes(sub)) score += 10;
  else if (MEDIUM_VALUE_SUBREDDITS.includes(sub)) score += 5;

  // Engagement quality signals from title
  const titleLower = post.title.toLowerCase();
  // Questions are great engagement opportunities
  if (titleLower.includes('?') || titleLower.includes('how') || titleLower.includes('what') || titleLower.includes('best') || titleLower.includes('recommend')) {
    score += 8;
  }
  // "Help" and "advice" posts are high-intent
  if (titleLower.includes('help') || titleLower.includes('advice') || titleLower.includes('tips') || titleLower.includes('suggestions')) {
    score += 5;
  }
  // Tool comparison/review posts are excellent
  if (titleLower.includes('vs') || titleLower.includes('versus') || titleLower.includes('compare') || titleLower.includes('alternative') || titleLower.includes('tool')) {
    score += 8;
  }

  // Penalize self-promotion and low-value post types
  if (titleLower.includes('[hiring]') || titleLower.includes('[for hire]') ||
      titleLower.includes('[help]') || titleLower.startsWith('we\'re doing free') ||
      titleLower.includes('i built') || titleLower.includes('i created') ||
      titleLower.includes('check out my') || titleLower.includes('launching') ||
      titleLower.includes('i spent') || titleLower.includes('we just launched') ||
      titleLower.includes('shameless plug') || titleLower.includes('self promo')) {
    score -= 20;
  }

  // Penalize hiring/job posts
  if (titleLower.includes('hiring') || titleLower.includes('job posting') ||
      titleLower.includes('looking for') && (titleLower.includes('hire') || titleLower.includes('freelancer'))) {
    score -= 25;
  }

  // Cap at 100
  score = Math.max(0, Math.min(100, score));

  return { score, matchedTerms: [...new Set(matchedTerms)] };
}

// --- Main ---

async function main() {
  console.log('Reddit Rosie - Fetching Reddit conversations via RSS');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('---');

  // Read monitoring config from Supabase if available
  if (supabase) {
    try {
      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['monitored_subreddits', 'monitored_keywords']);

      if (settings) {
        for (const row of settings) {
          if (row.key === 'monitored_subreddits' && Array.isArray(row.value) && row.value.length > 0) {
            // Override the hardcoded subreddit queries with DB values
            // Clear existing and rebuild with DB subreddits
            const dbSubreddits = row.value;
            SUBREDDIT_QUERIES.length = 0;
            for (const sub of dbSubreddits) {
              SUBREDDIT_QUERIES.push({
                subreddit: sub,
                queries: ['"Google Business Profile" OR "GBP" OR "local SEO"'],
              });
            }
            console.log(`Loaded ${dbSubreddits.length} subreddits from database: ${dbSubreddits.join(', ')}`);
          }
          if (row.key === 'monitored_keywords' && Array.isArray(row.value) && row.value.length > 0) {
            console.log(`Loaded ${row.value.length} keywords from database: ${row.value.join(', ')}`);
            // Update the broad search queries with DB keywords
            const kwQuery = row.value.map(kw => `"${kw}"`).join(' OR ');
            // Replace the high-intent global query with the user's keywords
            const highIntentIdx = GLOBAL_QUERIES.findIndex(q => q.label === 'high-intent');
            if (highIntentIdx >= 0) {
              GLOBAL_QUERIES[highIntentIdx] = {
                query: `(${kwQuery}) AND (help OR advice OR recommend OR best)`,
                time: 'day',
                label: 'high-intent',
              };
            }
          }
        }
      }
    } catch (err) {
      console.log('Could not load settings from database, using defaults:', err.message);
    }
  }

  const allPosts = new Map(); // dedup by ID
  let totalFetched = 0;
  let totalQueries = 0;

  // --- PHASE 1: Broad keyword search across ALL of Reddit ---
  console.log('\n=== BROAD SEARCH (all of Reddit) ===');

  for (const { query, time, label } of GLOBAL_QUERIES) {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.reddit.com/search.rss?q=${encodedQuery}&sort=new&t=${time}&limit=25`;

    totalQueries++;
    const xml = await fetchRSS(url);
    const entries = parseAtomFeed(xml);
    console.log(`  [${label}] "${query}" -> ${entries.length} posts`);

    for (const entry of entries) {
      if (!allPosts.has(entry.id)) {
        entry.searchType = 'broad';
        entry.searchLabel = label;
        allPosts.set(entry.id, entry);
        totalFetched++;
      }
    }

    // Be respectful — small delay between requests
    await new Promise(r => setTimeout(r, 1000));
  }

  // --- PHASE 2: Narrow search within specific subreddits ---
  console.log('\n=== NARROW SEARCH (target subreddits) ===');

  for (const { subreddit, queries } of SUBREDDIT_QUERIES) {
    console.log(`\nr/${subreddit}:`);

    for (const query of queries) {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://www.reddit.com/r/${subreddit}/search.rss?q=${encodedQuery}&sort=new&t=week&restrict_sr=1&limit=25`;

      totalQueries++;
      const xml = await fetchRSS(url);
      const entries = parseAtomFeed(xml);
      console.log(`  "${query}" -> ${entries.length} posts`);

      for (const entry of entries) {
        if (!allPosts.has(entry.id)) {
          entry.searchType = 'narrow';
          entry.searchLabel = 'subreddit-search';
          allPosts.set(entry.id, entry);
          totalFetched++;
        }
      }

      // Be respectful — small delay between requests
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\n---`);
  console.log(`Total queries: ${totalQueries}`);
  console.log(`Total unique posts fetched: ${totalFetched}`);

  // Score all posts
  const scoredPosts = [];
  for (const post of allPosts.values()) {
    const { score, matchedTerms } = scorePost(post);
    scoredPosts.push({
      ...post,
      relevanceScore: score,
      matchedKeywords: matchedTerms,
    });
  }

  // Sort by relevance score descending
  scoredPosts.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Read quality threshold from Supabase (or use default of 50)
  let minScore = 40;
  if (supabase) {
    const { data: thresholdSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'quality_threshold')
      .single();
    if (thresholdSetting?.value) {
      minScore = Number(thresholdSetting.value);
      console.log(`Quality threshold from database: ${minScore}`);
    }
  }

  const aboveThreshold = scoredPosts.filter(p => p.relevanceScore >= minScore);

  // Deduplicate by title — keep only the highest-scoring version
  // This catches cross-posts (same content posted to multiple subreddits)
  const titleMap = new Map();
  for (const post of aboveThreshold) {
    const titleKey = post.title.toLowerCase().trim();
    const existing = titleMap.get(titleKey);
    if (!existing || post.relevanceScore > existing.relevanceScore) {
      titleMap.set(titleKey, post);
    }
  }
  const qualityPosts = [...titleMap.values()];
  const titleDupsRemoved = aboveThreshold.length - qualityPosts.length;
  if (titleDupsRemoved > 0) {
    console.log(`Removed ${titleDupsRemoved} title duplicates (cross-posts)`);
  }

  console.log(`Posts with relevance >= ${minScore}: ${qualityPosts.length}`);
  console.log(`Posts filtered out (< 20): ${scoredPosts.length - qualityPosts.length}`);

  // Show top posts for logging
  const broadPosts = qualityPosts.filter(p => p.searchType === 'broad');
  const narrowPosts = qualityPosts.filter(p => p.searchType === 'narrow');
  console.log(`  Broad search (all Reddit): ${broadPosts.length} quality posts`);
  console.log(`  Narrow search (target subs): ${narrowPosts.length} quality posts`);

  // Unique subreddits found via broad search (the interesting ones)
  const broadSubs = [...new Set(broadPosts.map(p => p.subredditName))];
  if (broadSubs.length > 0) {
    console.log(`\nSubreddits discovered via broad search: ${broadSubs.join(', ')}`);
  }

  console.log('\nTop 10 by relevance:');
  for (const post of qualityPosts.slice(0, 10)) {
    const tag = post.searchType === 'broad' ? `BROAD/${post.searchLabel}` : `r/${post.subredditName}`;
    console.log(`  [${post.relevanceScore}] ${tag}: ${post.title.slice(0, 75)}`);
  }

  // --- SAVE TO SUPABASE ---
  let newPostsCount = 0;

  if (supabase) {
    console.log('\n=== SAVING TO SUPABASE ===');

    // Get existing post IDs to avoid duplicates
    const { data: existingPosts } = await supabase
      .from('conversations')
      .select('id, title');
    const existingIds = new Set((existingPosts || []).map(p => p.id));
    const existingTitles = new Set((existingPosts || []).map(p => p.title?.toLowerCase().trim()));

    // Insert only new posts (skip by ID and by title to catch cross-posts)
    const newPosts = qualityPosts.filter(p =>
      !existingIds.has(p.id) && !existingTitles.has(p.title.toLowerCase().trim())
    );
    newPostsCount = newPosts.length;

    if (newPosts.length > 0) {
      const rows = newPosts.map(post => ({
        id: post.id,
        subreddit: post.subredditName,
        title: post.title,
        selftext: post.selftext || '',
        author_username: post.authorUsername,
        permalink: post.permalink,
        url: post.url || '',
        score: 0,  // RSS doesn't provide scores
        comments_count: 0,  // RSS doesn't provide comment counts
        relevance_score: post.relevanceScore,
        matched_keywords: post.matchedKeywords,
        search_type: post.searchType || 'narrow',
        search_label: post.searchLabel || '',
        status: 'new',
        discovered_at: post.createdAtDate,
      }));

      const { error } = await supabase
        .from('conversations')
        .insert(rows);

      if (error) {
        console.error('  Supabase insert error:', error.message);
      } else {
        console.log(`  Inserted ${newPosts.length} new conversations`);
      }
    } else {
      console.log('  No new conversations to insert');
    }

    // Log the scan
    const { error: scanError } = await supabase
      .from('scan_history')
      .insert({
        source: 'reddit-rss',
        total_fetched: totalFetched,
        total_queries: totalQueries,
        quality_posts: qualityPosts.length,
        filtered_out: scoredPosts.length - qualityPosts.length,
        new_posts: newPostsCount,
        status: 'success',
        completed_at: new Date().toISOString(),
      });

    if (scanError) {
      console.error('  Scan history insert error:', scanError.message);
    } else {
      console.log('  Scan history logged');
    }

    // Log activity for new posts
    if (newPosts.length > 0) {
      const activityRows = newPosts.map(post => ({
        action: 'discovered',
        conversation_id: post.id,
        subreddit: post.subredditName,
        post_title: post.title,
        details: `Quality score: ${post.relevanceScore}/100, search: ${post.searchType}`,
      }));

      await supabase.from('activity_log').insert(activityRows);
      console.log(`  Logged ${newPosts.length} discovery events`);
    }
  } else {
    console.log('\n  Supabase not configured — skipping database write');
  }

  // --- SAVE JSON FALLBACK ---
  // Still save the JSON file as a fallback for when Supabase isn't available
  const output = {
    posts: qualityPosts,
    fetchedAt: new Date().toISOString(),
    source: 'reddit-rss',
    stats: {
      totalFetched,
      totalQueries,
      qualityPosts: qualityPosts.length,
      filteredOut: scoredPosts.length - qualityPosts.length,
      newPosts: newPostsCount,
      minRelevanceScore: minScore,
    },
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\nSaved ${qualityPosts.length} posts to JSON fallback`);
  console.log(`New posts this scan: ${newPostsCount}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
