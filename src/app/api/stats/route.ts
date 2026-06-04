import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const supabase = createClient(url, key);

    // Total conversations tracked in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: totalTracked30d } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .gte('first_seen_at', thirtyDaysAgo);

    // Total conversations marked as completed (all time)
    const { count: totalResponded } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    return NextResponse.json({
      totalTracked30d: totalTracked30d ?? 0,
      totalResponded: totalResponded ?? 0,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: String(error) },
      { status: 500 }
    );
  }
}
