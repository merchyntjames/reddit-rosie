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

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'public', 'data', 'conversations.json');

// --- Configuration ---

// Subreddits to monitor with per-sub search queries
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

  // Penalize self-promotion posts (less useful to engage with)
  if (titleLower.includes('[hiring]') || titleLower.includes('[help]') || titleLower.startsWith('we\'re doing free') || titleLower.includes('i built')) {
    score -= 15;
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

  const allPosts = new Map(); // dedup by ID
  let totalFetched = 0;
  let totalQueries = 0;

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

  // Filter: only include posts with relevance score >= 20
  const qualityPosts = scoredPosts.filter(p => p.relevanceScore >= 20);

  console.log(`Posts with relevance >= 20: ${qualityPosts.length}`);
  console.log(`Posts filtered out (< 20): ${scoredPosts.length - qualityPosts.length}`);

  // Show top 5 for logging
  console.log('\nTop 5 by relevance:');
  for (const post of qualityPosts.slice(0, 5)) {
    console.log(`  [${post.relevanceScore}] r/${post.subredditName}: ${post.title.slice(0, 80)}`);
  }

  // Save output
  const output = {
    posts: qualityPosts,
    fetchedAt: new Date().toISOString(),
    source: 'reddit-rss',
    stats: {
      totalFetched,
      totalQueries,
      qualityPosts: qualityPosts.length,
      filteredOut: scoredPosts.length - qualityPosts.length,
      minRelevanceScore: 20,
    },
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\nSaved ${qualityPosts.length} posts to ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
