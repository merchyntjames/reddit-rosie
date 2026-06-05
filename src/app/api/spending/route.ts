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

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all usage from last 30 days
    const { data: usage } = await supabase
      .from('api_usage')
      .select('*')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false });

    const rows = usage || [];

    // Aggregate by time period
    function aggregate(entries: typeof rows) {
      return {
        totalCost: entries.reduce((s, r) => s + Number(r.total_cost), 0),
        inputCost: entries.reduce((s, r) => s + Number(r.input_cost), 0),
        outputCost: entries.reduce((s, r) => s + Number(r.output_cost), 0),
        searchCost: entries.reduce((s, r) => s + Number(r.search_cost), 0),
        inputTokens: entries.reduce((s, r) => s + r.input_tokens, 0),
        outputTokens: entries.reduce((s, r) => s + r.output_tokens, 0),
        webSearches: entries.reduce((s, r) => s + r.web_search_requests, 0),
        apiCalls: entries.length,
      };
    }

    const last24h = aggregate(rows.filter(r => r.created_at >= oneDayAgo));
    const last7d = aggregate(rows.filter(r => r.created_at >= sevenDaysAgo));
    const last30d = aggregate(rows);

    // Breakdown by call type (last 30 days)
    const byCallType: Record<string, { calls: number; cost: number }> = {};
    for (const r of rows) {
      const type = r.call_type.startsWith('draft_personal') ? 'Personal Drafts' :
                   r.call_type === 'draft_corporate' ? 'Corporate Drafts' :
                   r.call_type === 'humanize' ? 'Humanization' :
                   r.call_type === 'reroll' ? 'Re-rolls' : r.call_type;
      if (!byCallType[type]) byCallType[type] = { calls: 0, cost: 0 };
      byCallType[type].calls++;
      byCallType[type].cost += Number(r.total_cost);
    }

    return NextResponse.json({
      last24h,
      last7d,
      last30d,
      byCallType,
    });
  } catch (error) {
    console.error('Spending error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spending data', details: String(error) },
      { status: 500 }
    );
  }
}
