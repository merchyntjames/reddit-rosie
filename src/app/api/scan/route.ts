import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // RSS fetching across many subreddits can take time

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// --- RSS Parsing (same logic as scripts/fetch-reddit.mjs) ---

async function fetchRSS(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'reddit-rosie/1.3 (social listening tool by Merchynt)' },
  });
  if (!res.ok) return '';
  return res.text();
}

interface RSSPost {
  id: string;
  title: string;
  selftext: string;
  authorUsername: string;
  subredditName: string;
  createdAtDate: string;
  permalink: string;
  url: string;
  searchType?: string;
  searchLabel?: string;
}

function parseAtomFeed(xml: string): RSSPost[] {
  const entries: RSSPost[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const getField = (tag: string) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m ? m[1].trim() : '';
    };
    const getAttr = (tag: string, attr: string) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i'));
      return m ? m[1] : '';
    };

    const authorRaw = getField('name');
    const authorUsername = authorRaw.replace(/^\/u\//, '');
    const contentHtml = getField('content');
    const selftext = contentHtml
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#32;/g, ' ')
      .replace(/<[^>]+>/g, '').replace(/\[link\]/g, '').replace(/\[comments\]/g, '')
      .replace(/submitted by\s+\/u\/\S+/g, '').replace(/\s+/g, ' ').trim();

    const idRaw = getField('id');
    // Skip non-post entries (subreddits, comments, users)
    if (idRaw.startsWith('t5_') || idRaw.startsWith('t1_') || idRaw.startsWith('t2_') || idRaw.startsWith('t4_')) continue;
    const id = idRaw.replace(/^t3_/, '');
    const permalink = getAttr('link', 'href');
    // Skip entries linking to subreddits rather than posts
    if (permalink.match(/^\/r\/[^/]+\/?$/) || permalink.match(/reddit\.com\/r\/[^/]+\/?$/)) continue;
    const subreddit = getAttr('category', 'term');
    const title = getField('title')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'");

    entries.push({
      id, title, selftext, authorUsername,
      subredditName: subreddit,
      createdAtDate: getField('published') || getField('updated'),
      permalink: permalink.replace('https://www.reddit.com', ''),
      url: permalink,
    });
  }
  return entries;
}

// --- Scoring (same as fetch-reddit.mjs) ---

const HIGH_VALUE_TERMS = [
  { term: 'merchynt', weight: 50 },
  { term: 'paige', weight: 40 },
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
  { term: 'google maps', weight: 6 },
  { term: 'local business', weight: 5 },
  { term: 'seo tool', weight: 5 },
  { term: 'agency', weight: 3 },
];

const HIGH_VALUE_SUBS = ['localseo', 'seo', 'smallbusiness'];
const MEDIUM_VALUE_SUBS = ['marketing', 'digital_marketing', 'agency'];

function scorePost(post: RSSPost): { score: number; matchedTerms: string[] } {
  const text = `${post.title} ${post.selftext}`.toLowerCase();
  let score = 0;
  const matchedTerms: string[] = [];

  for (const { term, weight } of HIGH_VALUE_TERMS) {
    if (term === 'paige') {
      if (text.includes('paige') && (text.includes('seo') || text.includes('local') || text.includes('gbp') || text.includes('merchynt'))) {
        score += weight; matchedTerms.push(term);
      }
    } else if (text.includes(term)) {
      score += weight; matchedTerms.push(term);
    }
  }

  for (const { term, weight } of TOPIC_TERMS) {
    if (text.includes(term)) { score += weight; matchedTerms.push(term); }
  }

  const sub = post.subredditName.toLowerCase();
  if (HIGH_VALUE_SUBS.includes(sub)) score += 10;
  else if (MEDIUM_VALUE_SUBS.includes(sub)) score += 5;

  const titleLower = post.title.toLowerCase();
  if (titleLower.includes('?') || titleLower.includes('how') || titleLower.includes('what') || titleLower.includes('best') || titleLower.includes('recommend')) score += 8;
  if (titleLower.includes('help') || titleLower.includes('advice') || titleLower.includes('tips')) score += 5;
  if (titleLower.includes('vs') || titleLower.includes('compare') || titleLower.includes('alternative') || titleLower.includes('tool')) score += 8;
  if (titleLower.includes('[hiring]') || titleLower.includes('[for hire]') || titleLower.includes('i built') || titleLower.includes('i created') || titleLower.includes('we just launched')) score -= 20;
  if (titleLower.includes('hiring') || titleLower.includes('job posting')) score -= 25;

  // Penalize long-form promotional content
  const selftextLen = (post.selftext || '').length;
  if (selftextLen > 5000) score -= 25;
  if (selftextLen > 10000) score -= 25;

  // Penalize branded/company subreddits and user profile posts
  if (sub.startsWith('u/') || sub.startsWith('u_') || sub.includes('byrealgreen') || sub.includes('byworkwave')) score -= 30;

  // Penalize obvious marketing titles
  if (titleLower.includes('proven strategies') || titleLower.includes('complete guide') || titleLower.includes('ultimate guide') || titleLower.includes('schedule a demo') || titleLower.includes('free trial')) score -= 20;

  // Intent analysis
  const bodyLower = (post.selftext || '').toLowerCase();
  // Subreddit announcements / meta posts
  if (titleLower.includes('welcome to r/') || titleLower.includes('introduce yourself') || titleLower.includes('announcement') || titleLower.includes('megathread')) score -= 30;
  // New/tiny subreddits
  if (bodyLower.includes('first wave') || bodyLower.includes('brand new community') || bodyLower.includes('new subreddit')) score -= 25;
  // Listicles
  if (titleLower.match(/^\d+ best/) || titleLower.match(/^top \d+/) || titleLower.match(/^\d+ proven/)) score -= 15;
  // No body text
  if (!post.selftext || post.selftext.length < 50) score -= 10;
  // Product launches
  if (bodyLower.includes('we just launched') || bodyLower.includes('check out our') || bodyLower.includes('beta testers wanted')) score -= 20;
  // Boost genuine questions
  if (bodyLower.includes('any advice') || bodyLower.includes('has anyone') || bodyLower.includes('struggling with') || bodyLower.includes('need help with')) score += 10;
  // Boost tool comparisons
  if (bodyLower.includes('looking for an alternative') || bodyLower.includes('switching from') || bodyLower.includes('which is better') || bodyLower.includes('anyone tried')) score += 10;

  return { score: Math.max(0, Math.min(100, score)), matchedTerms: [...new Set(matchedTerms)] };
}

// --- Default queries ---

const GLOBAL_QUERIES = [
  { query: 'Merchynt', time: 'day', label: 'brand-mention' },
  { query: 'BrightLocal OR Whitespark OR "Moz Local" OR Yext', time: 'day', label: 'competitor' },
  { query: '"Google Business Profile" AND (help OR advice OR recommend OR best)', time: 'day', label: 'high-intent' },
  { query: '"local SEO" AND (tool OR software OR recommend OR alternative)', time: 'day', label: 'high-intent' },
  { query: '"Google reviews" AND (management OR automate OR respond)', time: 'day', label: 'high-intent' },
  { query: '"AI search" AND ("local business" OR "small business" OR "Google Business")', time: 'day', label: 'ai-search' },
];

const DEFAULT_SUBREDDITS = [
  'localseo', 'SEO', 'smallbusiness', 'marketing', 'digital_marketing', 'agency', 'Entrepreneur',
];

// --- Main scan handler ---

export async function POST() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    // Read settings from Supabase
    let minScore = 45;
    let subreddits = DEFAULT_SUBREDDITS;

    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['quality_threshold', 'monitored_subreddits']);

    if (settings) {
      for (const row of settings) {
        if (row.key === 'quality_threshold') minScore = Number(row.value);
        if (row.key === 'monitored_subreddits' && Array.isArray(row.value)) subreddits = row.value;
      }
    }

    const allPosts = new Map<string, RSSPost>();
    let totalQueries = 0;

    // Broad search
    for (const { query, time, label } of GLOBAL_QUERIES) {
      totalQueries++;
      const xml = await fetchRSS(`https://www.reddit.com/search.rss?q=${encodeURIComponent(query)}&sort=new&t=${time}&limit=25`);
      for (const entry of parseAtomFeed(xml)) {
        if (!allPosts.has(entry.id)) {
          entry.searchType = 'broad';
          entry.searchLabel = label;
          allPosts.set(entry.id, entry);
        }
      }
      await new Promise(r => setTimeout(r, 500));
    }

    // Narrow search
    for (const sub of subreddits) {
      totalQueries++;
      const xml = await fetchRSS(`https://www.reddit.com/r/${sub}/search.rss?q=${encodeURIComponent('"Google Business Profile" OR "GBP" OR "local SEO"')}&sort=new&t=day&restrict_sr=1&limit=25`);
      for (const entry of parseAtomFeed(xml)) {
        if (!allPosts.has(entry.id)) {
          entry.searchType = 'narrow';
          entry.searchLabel = 'subreddit-search';
          allPosts.set(entry.id, entry);
        }
      }
      await new Promise(r => setTimeout(r, 500));
    }

    // Score and filter
    const scored = [...allPosts.values()].map(post => {
      const { score, matchedTerms } = scorePost(post);
      return { ...post, relevanceScore: score, matchedKeywords: matchedTerms };
    });
    const qualityPosts = scored.filter(p => p.relevanceScore >= minScore);

    // Deduplicate by title — keep only the highest-scoring version of duplicate titles
    const titleMap = new Map<string, typeof qualityPosts[0]>();
    for (const post of qualityPosts) {
      const titleKey = post.title.toLowerCase().trim();
      const existing = titleMap.get(titleKey);
      if (!existing || post.relevanceScore > existing.relevanceScore) {
        titleMap.set(titleKey, post);
      }
    }
    const dedupedPosts = [...titleMap.values()];

    // Check existing IDs and titles in database
    const { data: existing } = await supabase.from('conversations').select('id, title');
    const existingIds = new Set((existing || []).map(p => p.id));
    const existingTitles = new Set((existing || []).map(p => p.title?.toLowerCase().trim()));
    const newPosts = dedupedPosts.filter(p =>
      !existingIds.has(p.id) && !existingTitles.has(p.title.toLowerCase().trim())
    );

    // Insert new posts
    if (newPosts.length > 0) {
      await supabase.from('conversations').insert(
        newPosts.map(post => ({
          id: post.id,
          subreddit: post.subredditName,
          title: post.title,
          selftext: post.selftext || '',
          author_username: post.authorUsername,
          permalink: post.permalink,
          url: post.url || '',
          relevance_score: post.relevanceScore,
          matched_keywords: post.matchedKeywords,
          search_type: post.searchType || 'narrow',
          search_label: post.searchLabel || '',
          status: 'new',
          discovered_at: post.createdAtDate,
        }))
      );

      // Log discoveries
      await supabase.from('activity_log').insert(
        newPosts.map(post => ({
          action: 'discovered',
          conversation_id: post.id,
          subreddit: post.subredditName,
          post_title: post.title,
          details: `Manual scan. Quality: ${post.relevanceScore}/100`,
        }))
      );
    }

    // Log the scan
    await supabase.from('scan_history').insert({
      source: 'manual-scan',
      total_fetched: allPosts.size,
      total_queries: totalQueries,
      quality_posts: qualityPosts.length,
      filtered_out: scored.length - qualityPosts.length,
      new_posts: newPosts.length,
      status: 'success',
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      totalFetched: allPosts.size,
      qualityPosts: qualityPosts.length,
      newPosts: newPosts.length,
    });
  } catch (error) {
    console.error('Manual scan error:', error);
    return NextResponse.json(
      { error: 'Scan failed', details: String(error) },
      { status: 500 }
    );
  }
}
