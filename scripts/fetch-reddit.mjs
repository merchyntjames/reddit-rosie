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
  { query: 'SAM AND ("sales manager" OR "agency leads" OR "cold calling" OR "Merchynt")', time: 'day', label: 'brand-mention' },

  // Competitor monitoring
  { query: 'BrightLocal OR Whitespark OR "Moz Local" OR Yext', time: 'day', label: 'competitor' },
  { query: 'SOCi OR Vendasta OR GoSite OR Synup', time: 'day', label: 'competitor' },

  // High-intent: GBP management
  { query: '"Google Business Profile" AND (help OR advice OR recommend OR best)', time: 'day', label: 'high-intent' },
  { query: '"Google Business Profile" AND (tool OR software OR automate OR manage)', time: 'day', label: 'high-intent' },
  { query: '"Google Maps" AND ("not showing" OR "not ranking" OR "disappeared" OR "suspended")', time: 'day', label: 'high-intent' },
  { query: '"Google Maps ranking" AND (how OR improve OR help OR increase)', time: 'day', label: 'high-intent' },

  // High-intent: local SEO
  { query: '"local SEO" AND (tool OR software OR recommend OR alternative)', time: 'day', label: 'high-intent' },
  { query: '"local SEO" AND (agency OR freelancer OR service OR pricing)', time: 'day', label: 'high-intent' },
  { query: '"local pack" AND (ranking OR showing OR getting into)', time: 'day', label: 'high-intent' },

  // High-intent: reviews and reputation
  { query: '"Google reviews" AND (management OR automate OR respond OR strategy OR get more)', time: 'day', label: 'high-intent' },
  { query: '"online reviews" AND (strategy OR management OR respond OR reputation)', time: 'day', label: 'high-intent' },
  { query: '"reputation management" AND (tool OR software OR agency OR small business)', time: 'day', label: 'high-intent' },

  // AI search visibility
  { query: '"AI search" AND ("local business" OR "small business" OR "Google Business")', time: 'day', label: 'ai-search' },
  { query: '"ChatGPT" AND ("local business" OR "find a" OR "recommend" OR "near me")', time: 'day', label: 'ai-search' },
  { query: '"Gemini" AND ("local business" OR "recommend" OR "near me" OR "find")', time: 'day', label: 'ai-search' },
  { query: '"AI overview" AND ("local" OR "business" OR "Google")', time: 'day', label: 'ai-search' },
  { query: '"GEO" AND ("local SEO" OR "generative engine" OR "AI optimization")', time: 'day', label: 'ai-search' },

  // Agency-specific
  { query: '"white label" AND ("local SEO" OR "GBP" OR "Google Business")', time: 'day', label: 'agency' },
  { query: '"agency" AND ("local SEO" OR "GBP management" OR "client retention")', time: 'day', label: 'agency' },
  { query: '"agency margins" OR "agency profitability" OR "agency pricing"', time: 'day', label: 'agency' },

  // Sales and lead generation (SAM territory)
  { query: '"cold calling" AND ("agency" OR "SEO" OR "marketing" OR "leads")', time: 'day', label: 'sales' },
  { query: '"sales leads" AND ("local business" OR "SEO" OR "marketing agency")', time: 'day', label: 'sales' },

  // SMB pain points
  { query: '"Google listing" AND (help OR fix OR improve OR optimize)', time: 'day', label: 'smb' },
  { query: '"rank higher" AND ("Google Maps" OR "local" OR "near me")', time: 'day', label: 'smb' },
  { query: '"get more customers" AND ("Google" OR "local" OR "online")', time: 'day', label: 'smb' },
];

// NARROW SEARCHES: within specific subreddits
// Organized by: core SEO → marketing/business → platform-specific → industry verticals
const SUBREDDIT_QUERIES = [
  // --- Core Local SEO ---
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
    subreddit: 'bigseo',
    queries: ['"local SEO" OR "Google Business Profile" OR "AI search"'],
  },
  {
    subreddit: 'TechSEO',
    queries: ['"local SEO" OR "schema" OR "Google Business"'],
  },

  // --- Marketing & Business ---
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
    subreddit: 'DigitalMarketing',
    queries: [
      '"local SEO" OR "Google Business Profile" OR "Google Maps"',
      '"AI search" OR "review management" OR "reputation"',
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
  {
    subreddit: 'growmybusiness',
    queries: ['"Google" OR "SEO" OR "online reviews" OR "local marketing"'],
  },
  {
    subreddit: 'sweatystartup',
    queries: ['"Google" OR "reviews" OR "marketing" OR "customers"'],
  },
  {
    subreddit: 'sales',
    queries: ['"cold calling" OR "lead generation" OR "agency" OR "local business"'],
  },
  {
    subreddit: 'content_marketing',
    queries: ['"local SEO" OR "Google Business" OR "AI content"'],
  },
  {
    subreddit: 'PPC',
    queries: ['"local" OR "Google Maps" OR "local service ads"'],
  },

  // --- Google-specific ---
  {
    subreddit: 'GoogleMyBusiness',
    queries: [
      'optimize OR ranking OR reviews OR suspended OR "not showing"',
      'posts OR photos OR "AI" OR automation',
    ],
  },
  {
    subreddit: 'google',
    queries: ['"Business Profile" OR "Google Maps" OR "local search" OR "reviews"'],
  },
  {
    subreddit: 'GoogleMaps',
    queries: ['ranking OR "not showing" OR listing OR business OR reviews'],
  },
  {
    subreddit: 'GoogleSupport',
    queries: ['"Business Profile" OR "Google Maps" OR reviews OR listing'],
  },

  // --- AI Search ---
  {
    subreddit: 'ChatGPT',
    queries: ['"local business" OR "recommend" OR "near me" OR "find a"'],
  },

  // --- Industry Verticals (SMB owners asking about marketing) ---
  {
    subreddit: 'restaurantowners',
    queries: ['"Google" OR "reviews" OR "marketing" OR "customers"'],
  },
  {
    subreddit: 'SaaS',
    queries: ['"local SEO" OR "Google Business" OR "white label" OR "agency tool"'],
  },
  {
    subreddit: 'ecommerce',
    queries: ['"local SEO" OR "Google Business" OR "Google Maps" OR "local"'],
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
  { term: 'vendasta', weight: 20 },
  { term: 'soci', weight: 20 },
  { term: 'gosite', weight: 20 },
  { term: 'synup', weight: 20 },
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

    // Extract post ID (format: t3_xxxxx for posts)
    const idRaw = getField('id');

    // Skip non-post entries (t5_ = subreddit, t1_ = comment, t2_ = user)
    if (idRaw.startsWith('t5_') || idRaw.startsWith('t1_') || idRaw.startsWith('t2_') || idRaw.startsWith('t4_')) {
      continue;
    }

    const id = idRaw.replace(/^t3_/, '');

    // Extract permalink
    const permalink = getAttr('link', 'href');

    // Skip entries that link to a subreddit rather than a post
    if (permalink.match(/^\/r\/[^/]+\/?$/) || permalink.match(/reddit\.com\/r\/[^/]+\/?$/)) {
      continue;
    }

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

  // Penalize long-form promotional content (blog posts, marketing articles)
  // Real conversations are typically under 3,000 chars. Marketing content is 5,000+
  const selftextLen = (post.selftext || '').length;
  if (selftextLen > 5000) {
    score -= 25; // Likely a blog post or promotional article, not a conversation
  }
  if (selftextLen > 10000) {
    score -= 25; // Almost certainly marketing content — heavy penalty
  }

  // Penalize branded/company subreddits (not real communities)
  // These are subreddits named after a company, used for their own marketing
  const brandedSubPatterns = [
    'byrealgreen', 'byworkwave', 'realgreen',
    'u/', // User profile posts (not community posts)
  ];
  if (brandedSubPatterns.some(p => sub.includes(p)) || sub.startsWith('u/') || sub.startsWith('u_')) {
    score -= 30;
  }

  // Penalize posts with obvious marketing language in the title
  if (titleLower.includes('proven strategies') || titleLower.includes('complete guide') ||
      titleLower.includes('ultimate guide') || titleLower.includes('step-by-step') ||
      titleLower.includes('schedule a demo') || titleLower.includes('free trial') ||
      titleLower.includes('sign up now') || titleLower.includes('download our')) {
    score -= 20;
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

  // Read monitoring config from Supabase — this is the source of truth
  // Settings page writes here, GitHub Action reads here
  let dbSubreddits = null;
  let dbKeywords = null;

  if (supabase) {
    try {
      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['monitored_subreddits', 'monitored_keywords']);

      if (settings) {
        for (const row of settings) {
          if (row.key === 'monitored_subreddits' && Array.isArray(row.value) && row.value.length > 0) {
            dbSubreddits = row.value;
          }
          if (row.key === 'monitored_keywords' && Array.isArray(row.value) && row.value.length > 0) {
            dbKeywords = row.value;
          }
        }
      }
    } catch (err) {
      console.log('Could not load settings from database, using hardcoded defaults:', err.message);
    }
  }

  // Override subreddit queries with DB values
  if (dbSubreddits) {
    SUBREDDIT_QUERIES.length = 0;

    // Build keyword query strings from DB keywords for narrow searches
    // Split into chunks of ~5 keywords per query to stay under RSS URL limits
    const kwList = dbKeywords || ['Google Business Profile', 'local SEO', 'Google Maps', 'online reviews'];
    const kwChunks = [];
    for (let i = 0; i < kwList.length; i += 5) {
      const chunk = kwList.slice(i, i + 5).map(kw => `"${kw}"`).join(' OR ');
      kwChunks.push(chunk);
    }

    for (const sub of dbSubreddits) {
      // Each subreddit gets queries built from the keyword list
      // Use first 2 chunks to avoid too many queries per sub
      const queries = kwChunks.slice(0, 2);
      SUBREDDIT_QUERIES.push({ subreddit: sub, queries });
    }

    console.log(`Loaded ${dbSubreddits.length} subreddits from database`);
    console.log(`Built ${SUBREDDIT_QUERIES.reduce((s, q) => s + q.queries.length, 0)} narrow queries from ${kwList.length} keywords`);
  }

  if (dbKeywords) {
    console.log(`Loaded ${dbKeywords.length} keywords from database`);
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
  let minScore = 45;
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
