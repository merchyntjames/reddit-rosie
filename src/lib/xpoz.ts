import { XpozClient } from '@xpoz/xpoz';

let clientInstance: XpozClient | null = null;

export async function getXpozClient(): Promise<XpozClient> {
  if (clientInstance) return clientInstance;

  const apiKey = process.env.XPOZ_API_KEY;
  if (!apiKey) {
    throw new Error('XPOZ_API_KEY environment variable is not set');
  }

  clientInstance = new XpozClient({ apiKey });
  await clientInstance.connect();
  return clientInstance;
}

export interface RedditPostResult {
  id: string;
  title: string;
  selftext: string;
  authorUsername: string;
  subredditName: string;
  score: number;
  commentsCount: number;
  createdAtDate: string;
  permalink: string;
  url: string;
}

// Search keywords across target subreddits
export const DEFAULT_KEYWORDS = [
  '"Google Business Profile"',
  '"local SEO" AND tool',
  'Merchynt',
  'Paige AND "local SEO"',
  '"GBP optimization"',
  '"AI local SEO"',
  '"review management" AND business',
  'BrightLocal OR Whitespark',
];

export const DEFAULT_SUBREDDITS = [
  'LocalSEO',
  'SEO',
  'smallbusiness',
  'digital_marketing',
  'marketing',
  'agency',
  'Entrepreneur',
];

export async function searchRedditPosts(options?: {
  keywords?: string[];
  subreddits?: string[];
  limit?: number;
  time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
}): Promise<RedditPostResult[]> {
  const client = await getXpozClient();
  const keywords = options?.keywords ?? DEFAULT_KEYWORDS;
  const subreddits = options?.subreddits ?? DEFAULT_SUBREDDITS;
  const limit = options?.limit ?? 50;
  const time = options?.time ?? 'week';

  const query = keywords.join(' OR ');
  const seenIds = new Set<string>();

  // Single query across all Reddit — no subreddit filter so we get results
  // from all target subreddits in ONE API call (1 query = 2 credits)
  // Then filter client-side to our target subreddits
  const results = await client.reddit.searchPosts(query, {
    sort: 'new',
    time,
    limit: Math.min(limit, 100),
    fields: [
      'id', 'title', 'selftext', 'authorUsername', 'subredditName',
      'score', 'commentsCount', 'createdAtDate', 'permalink', 'url',
    ],
  });

  const allPosts: RedditPostResult[] = [];
  const subredditSet = new Set(subreddits.map(s => s.toLowerCase()));

  if (results?.data) {
    const posts = Array.isArray(results.data) ? results.data : [];
    for (const post of posts) {
      const postId = String(post.id ?? '');
      const subredditName = String(post.subredditName ?? '').toLowerCase();

      // Filter to target subreddits only
      if (postId && !seenIds.has(postId) && subredditSet.has(subredditName)) {
        seenIds.add(postId);
        allPosts.push({
          id: post.id ?? '',
          title: post.title ?? '',
          selftext: post.selftext ?? '',
          authorUsername: post.authorUsername ?? '',
          subredditName: post.subredditName ?? '',
          score: post.score ?? 0,
          commentsCount: post.commentsCount ?? 0,
          createdAtDate: post.createdAtDate ?? '',
          permalink: post.permalink ?? '',
          url: post.url ?? '',
        });
      }
    }
  }

  // If filtered results are sparse, also do a broad query without subreddit filter
  // to catch posts from our target subs that might appear in general results
  if (allPosts.length < 5) {
    // Keep whatever we found — the broad query already covers all subreddits
  }

  // Sort by recency
  allPosts.sort((a, b) =>
    new Date(b.createdAtDate).getTime() - new Date(a.createdAtDate).getTime()
  );

  return allPosts;
}

// Simple relevance scoring based on keyword matches and engagement
export function scoreRelevance(post: RedditPostResult, keywords: string[]): number {
  const text = `${post.title} ${post.selftext}`.toLowerCase();
  let score = 0;

  // Direct brand mentions are highest relevance
  if (text.includes('merchynt') || text.includes('paige')) {
    score += 40;
  }

  // Keyword matches
  const cleanKeywords = keywords.map(k =>
    k.replace(/"/g, '').replace(/ AND /g, ' ').replace(/ OR /g, ' ').toLowerCase()
  );
  for (const kw of cleanKeywords) {
    const terms = kw.split(' ').filter(t => t.length > 2);
    for (const term of terms) {
      if (text.includes(term)) {
        score += 8;
      }
    }
  }

  // Engagement signals
  if (post.score > 50) score += 10;
  else if (post.score > 20) score += 5;
  else if (post.score > 5) score += 2;

  if (post.commentsCount > 20) score += 10;
  else if (post.commentsCount > 10) score += 5;
  else if (post.commentsCount > 3) score += 2;

  // Cap at 100
  return Math.min(100, score);
}
