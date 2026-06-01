// Direct HTTP calls to Xpoz MCP endpoint (no SDK — works in serverless)

const XPOZ_MCP_URL = 'https://mcp.xpoz.ai/mcp';

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

export const DEFAULT_KEYWORDS = [
  '"Google Business Profile"',
  '"local SEO"',
  'Merchynt',
  '"GBP optimization"',
  '"review management"',
  'BrightLocal OR Whitespark',
];

export const DEFAULT_SUBREDDITS = [
  'localseo',
  'seo',
  'smallbusiness',
  'digital_marketing',
  'marketing',
  'agency',
  'entrepreneur',
];

// MCP JSON-RPC call via HTTP
async function mcpCall(method: string, params: Record<string, unknown>): Promise<unknown> {
  const apiKey = process.env.XPOZ_API_KEY;
  if (!apiKey) {
    throw new Error('XPOZ_API_KEY environment variable is not set');
  }

  // MCP over HTTP: initialize session, then call tool
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'Authorization': `Bearer ${apiKey}`,
  };

  const initRes = await fetch(XPOZ_MCP_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'reddit-rosie', version: '0.6.0' },
      },
    }),
  });

  if (!initRes.ok) {
    const errorBody = await initRes.text().catch(() => '');
    throw new Error(`MCP init failed: ${initRes.status} ${initRes.statusText} ${errorBody}`);
  }

  // Get session header for subsequent calls
  const sessionId = initRes.headers.get('mcp-session-id') || '';

  // Send initialized notification (required by MCP spec)
  await fetch(XPOZ_MCP_URL, {
    method: 'POST',
    headers: {
      ...headers,
      ...(sessionId ? { 'mcp-session-id': sessionId } : {}),
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    }),
  });

  // Call the tool
  const toolRes = await fetch(XPOZ_MCP_URL, {
    method: 'POST',
    headers: {
      ...headers,
      ...(sessionId ? { 'mcp-session-id': sessionId } : {}),
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: method,
        arguments: params,
      },
    }),
  });

  if (!toolRes.ok) {
    const errorText = await toolRes.text();
    throw new Error(`MCP tool call failed: ${toolRes.status} ${errorText}`);
  }

  const result = await toolRes.json();

  if (result.error) {
    throw new Error(`MCP error: ${JSON.stringify(result.error)}`);
  }

  // Extract content from MCP response
  const content = result?.result?.content;
  if (content && Array.isArray(content) && content.length > 0) {
    const textContent = content.find((c: { type: string }) => c.type === 'text');
    if (textContent?.text) {
      return JSON.parse(textContent.text);
    }
  }

  return result?.result;
}

export async function searchRedditPosts(options?: {
  keywords?: string[];
  subreddits?: string[];
  limit?: number;
  time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
}): Promise<RedditPostResult[]> {
  const keywords = options?.keywords ?? DEFAULT_KEYWORDS;
  const subreddits = options?.subreddits ?? DEFAULT_SUBREDDITS;
  const limit = options?.limit ?? 50;
  const time = options?.time ?? 'week';

  const query = keywords.join(' OR ');
  const subredditSet = new Set(subreddits.map(s => s.toLowerCase()));

  const response = await mcpCall('getRedditPostsByKeywords', {
    query,
    sort: 'new',
    time,
    limit: Math.min(limit, 100),
    fields: [
      'id', 'title', 'selftext', 'authorUsername', 'subredditName',
      'score', 'commentsCount', 'createdAtDate', 'permalink', 'url',
    ],
    userPrompt: `Find Reddit posts about local SEO, Google Business Profile, review management, or mentions of Merchynt/Paige/BrightLocal/Whitespark`,
  }) as { results?: Record<string, unknown>[] };

  const allPosts: RedditPostResult[] = [];
  const seenIds = new Set<string>();

  const posts = response?.results ?? [];
  for (const post of posts) {
    const postId = String(post.id ?? '');
    const subredditName = String(post.subredditName ?? '').toLowerCase();

    if (postId && !seenIds.has(postId) && subredditSet.has(subredditName)) {
      seenIds.add(postId);
      allPosts.push({
        id: String(post.id ?? ''),
        title: String(post.title ?? ''),
        selftext: String(post.selftext ?? ''),
        authorUsername: String(post.authorUsername ?? ''),
        subredditName: String(post.subredditName ?? ''),
        score: Number(post.score ?? 0),
        commentsCount: Number(post.commentsCount ?? 0),
        createdAtDate: String(post.createdAtDate ?? ''),
        permalink: String(post.permalink ?? ''),
        url: String(post.url ?? ''),
      });
    }
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
