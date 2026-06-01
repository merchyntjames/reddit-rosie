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
  const limit = options?.limit ?? 10;
  const time = options?.time ?? 'week';

  const query = keywords.join(' OR ');
  const allPosts: RedditPostResult[] = [];
  const seenIds = new Set<string>();

  // Query across all subreddits in batches to conserve credits
  // Group subreddits into a single query using the subreddit filter
  for (const subreddit of subreddits) {
    try {
      const results = await client.reddit.searchPosts(query, {
        subreddit,
        sort: 'new',
        time,
        limit: Math.min(limit, 25),
        fields: [
          'id', 'title', 'selftext', 'authorUsername', 'subredditName',
          'score', 'commentsCount', 'createdAtDate', 'permalink', 'url',
        ],
      });

      if (results?.data) {
        const posts = Array.isArray(results.data) ? results.data : [];
        for (const post of posts) {
          const postId = String(post.id ?? '');
          if (postId && !seenIds.has(postId)) {
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
    } catch (error) {
      console.error(`Error fetching from r/${subreddit}:`, error);
      // Continue with other subreddits even if one fails
    }
  }

  // Sort by recency
  allPosts.sort((a, b) =>
    new Date(b.createdAtDate).getTime() - new Date(a.createdAtDate).getTime()
  );

  return allPosts.slice(0, limit * subreddits.length);
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
