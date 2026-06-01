import { NextResponse } from 'next/server';
import {
  searchRedditPosts,
  scoreRelevance,
  DEFAULT_KEYWORDS,
  DEFAULT_SUBREDDITS,
} from '@/lib/xpoz';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const time = (searchParams.get('time') ?? 'week') as 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    const posts = await searchRedditPosts({
      keywords: DEFAULT_KEYWORDS,
      subreddits: DEFAULT_SUBREDDITS,
      limit,
      time,
    });

    // Score and enrich each post
    const enrichedPosts = posts.map(post => {
      const relevanceScore = scoreRelevance(post, DEFAULT_KEYWORDS);

      // Extract matched keywords
      const text = `${post.title} ${post.selftext}`.toLowerCase();
      const matchedKeywords: string[] = [];
      const keywordLabels = [
        'Google Business Profile', 'local SEO', 'Merchynt', 'Paige',
        'GBP optimization', 'AI local SEO', 'review management',
        'BrightLocal', 'Whitespark',
      ];
      for (const kw of keywordLabels) {
        if (text.includes(kw.toLowerCase())) {
          matchedKeywords.push(kw);
        }
      }

      // Create a snippet from selftext (first ~200 chars)
      const snippet = post.selftext
        ? post.selftext.slice(0, 300).replace(/\n+/g, ' ').trim() + (post.selftext.length > 300 ? '...' : '')
        : '';

      return {
        id: post.id,
        subreddit: `r/${post.subredditName}`,
        postTitle: post.title,
        postSnippet: snippet,
        postAuthor: `u/${post.authorUsername}`,
        postUrl: post.permalink
          ? `https://reddit.com${post.permalink}`
          : `https://reddit.com/r/${post.subredditName}/comments/${post.id}`,
        commentCount: post.commentsCount,
        upvotes: post.score,
        relevanceScore,
        matchedKeywords,
        discoveredAt: post.createdAtDate,
        status: 'new' as const,
        selftext: post.selftext,
      };
    });

    // Sort by relevance score descending
    enrichedPosts.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({
      posts: enrichedPosts,
      meta: {
        count: enrichedPosts.length,
        fetchedAt: new Date().toISOString(),
        subreddits: DEFAULT_SUBREDDITS,
        keywords: DEFAULT_KEYWORDS,
        timeRange: time,
      },
    });
  } catch (error) {
    console.error('Reddit API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Reddit data', details: String(error) },
      { status: 500 }
    );
  }
}
