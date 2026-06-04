import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const { conversationId, reason, customFeedback } = await request.json() as {
      conversationId: string;
      reason: string;
      customFeedback?: string;
    };

    if (!conversationId || !reason) {
      return NextResponse.json({ error: 'Missing conversationId or reason' }, { status: 400 });
    }

    // Save feedback
    await supabase.from('dismiss_feedback').insert({
      conversation_id: conversationId,
      reason,
      custom_feedback: customFeedback || null,
    });

    // Update conversation status to dismissed
    await supabase
      .from('conversations')
      .update({ status: 'dismissed', status_changed_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Log the action with feedback detail
    const { data: conv } = await supabase
      .from('conversations')
      .select('subreddit, title')
      .eq('id', conversationId)
      .single();

    await supabase.from('activity_log').insert({
      action: 'dismissed',
      conversation_id: conversationId,
      subreddit: conv?.subreddit,
      post_title: conv?.title,
      details: `Reason: ${reason}${customFeedback ? ` — ${customFeedback}` : ''}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Dismiss feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback', details: String(error) },
      { status: 500 }
    );
  }
}
