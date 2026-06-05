import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// GET: Fetch conversations from Supabase
export async function GET(request: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // optional filter

    if (!supabase) {
      // Fallback to static JSON if Supabase is not configured
      return NextResponse.json(
        { error: 'Supabase not configured', fallback: true },
        { status: 503 }
      );
    }

    // Fetch ALL conversations — client-side tabs handle filtering
    // This ensures Dismissed and Completed tabs have data to show
    const query = supabase
      .from('conversations')
      .select('*')
      .order('relevance_score', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Get last scan info
    const { data: lastScan } = await supabase
      .from('scan_history')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    // Fetch all drafts for these conversations
    const conversationIds = (data || []).map(r => r.id);
    const { data: allDrafts } = conversationIds.length > 0
      ? await supabase
          .from('conversation_drafts')
          .select('*')
          .in('conversation_id', conversationIds)
          .order('version', { ascending: false })
      : { data: [] };

    // Group drafts by conversation — latest version only
    const draftsByConversation = new Map<string, typeof allDrafts>();
    for (const draft of allDrafts || []) {
      const existing = draftsByConversation.get(draft.conversation_id) || [];
      // Only keep latest version per draft_type + creator_id
      const key = `${draft.draft_type}-${draft.creator_id || 'corporate'}`;
      if (!existing.some(d => `${d.draft_type}-${d.creator_id || 'corporate'}` === key)) {
        existing.push(draft);
      }
      draftsByConversation.set(draft.conversation_id, existing);
    }

    // Map database columns to frontend format
    const posts = (data || []).map(row => {
      const drafts = draftsByConversation.get(row.id) || [];
      // For backward compat, set corporateDraft/personalDraft from new table
      const corporateDraft = drafts.find(d => d.draft_type === 'corporate')?.content || row.corporate_draft || '';
      const personalDraft = drafts.find(d => d.draft_type === 'personal')?.content || row.personal_draft || '';

      return {
        id: row.id,
        subreddit: `r/${row.subreddit}`,
        postTitle: row.title,
        postSnippet: row.selftext
          ? row.selftext.slice(0, 500).replace(/\n+/g, ' ').trim() + (row.selftext.length > 500 ? '...' : '')
          : '',
        postAuthor: `u/${row.author_username}`,
        postUrl: row.permalink
          ? `https://reddit.com${row.permalink}`
          : `https://reddit.com/r/${row.subreddit}/comments/${row.id}`,
        commentCount: row.comments_count ?? 0,
        upvotes: row.score ?? 0,
        relevanceScore: row.relevance_score,
        matchedKeywords: row.matched_keywords ?? [],
        discoveredAt: row.discovered_at,
        status: row.status,
        corporateDraft,
        personalDraft,
        drafts: drafts.map(d => ({
          draftType: d.draft_type,
          creatorId: d.creator_id,
          creatorName: d.creator_name,
          content: d.content,
          version: d.version,
        })),
      };
    });

    return NextResponse.json({
      posts,
      meta: {
        count: posts.length,
        fetchedAt: lastScan?.completed_at ?? new Date().toISOString(),
        source: 'supabase',
        lastScanStatus: lastScan?.status ?? 'unknown',
      },
    });
  } catch (error) {
    console.error('Supabase fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH: Update conversation status
export async function PATCH(request: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const body = await request.json();
    const { id, status, action } = body as {
      id?: string;
      status?: string;
      action?: 'clear_queue';
    };

    // Bulk action: delete all new/in_progress items from the queue
    if (action === 'clear_queue') {
      // First get the items we're about to delete (for logging)
      const { data: toDelete } = await supabase
        .from('conversations')
        .select('id, title, subreddit')
        .in('status', ['new', 'in_progress']);

      // Delete them
      const { error } = await supabase
        .from('conversations')
        .delete()
        .in('status', ['new', 'in_progress']);

      if (error) throw new Error(error.message);

      // Log the clear action
      if (toDelete && toDelete.length > 0) {
        await supabase.from('activity_log').insert(
          toDelete.map(c => ({
            action: 'cleared',
            conversation_id: c.id,
            subreddit: c.subreddit,
            post_title: c.title,
            details: 'Deleted from queue',
          }))
        );
      }

      const cleared = toDelete;

      return NextResponse.json({
        success: true,
        cleared: cleared?.length ?? 0,
      });
    }

    // Single status update
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing id or status' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('conversations')
      .update({
        status,
        status_changed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw new Error(error.message);

    // Log the action
    const actionLabel = status === 'completed' ? 'completed'
      : status === 'dismissed' ? 'dismissed'
      : status === 'new' ? 'restored'
      : 'updated';

    await supabase.from('activity_log').insert({
      action: actionLabel,
      conversation_id: id,
      details: `Status changed to ${status}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json(
      { error: 'Failed to update status', details: String(error) },
      { status: 500 }
    );
  }
}
