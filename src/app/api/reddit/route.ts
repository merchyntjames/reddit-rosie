import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { scoreRelevance, DEFAULT_KEYWORDS, type RedditPostResult } from '@/lib/xpoz';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Read from static JSON file (refreshed by Claude Code via Xpoz MCP)
    const filePath = path.join(process.cwd(), 'public', 'data', 'conversations.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent) as {
      posts: RedditPostResult[];
      fetchedAt: string;
      source: string;
    };

    // Score and enrich each post
    const enrichedPosts = data.posts.map(post => {
      const relevanceScore = scoreRelevance(post, DEFAULT_KEYWORDS);

      // Extract matched keywords
      const text = `${post.title} ${post.selftext ?? ''}`.toLowerCase();
      const matchedKeywords: string[] = [];
      const keywordLabels = [
        'Google Business Profile', 'local SEO', 'Merchynt', 'Paige',
        'GBP optimization', 'AI local SEO', 'review management',
        'BrightLocal', 'Whitespark', 'GBP', 'Google Maps',
      ];
      for (const kw of keywordLabels) {
        if (text.includes(kw.toLowerCase())) {
          matchedKeywords.push(kw);
        }
      }

      // Create a snippet from selftext (first ~300 chars)
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
        selftext: post.selftext ?? '',
      };
    });

    // Sort by relevance score descending
    enrichedPosts.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({
      posts: enrichedPosts,
      meta: {
        count: enrichedPosts.length,
        fetchedAt: data.fetchedAt,
        source: data.source,
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
