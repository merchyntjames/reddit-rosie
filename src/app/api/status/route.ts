import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const statuses: Record<string, { status: string; detail?: string }> = {};

  // Check Claude API
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      statuses.claude = { status: 'not_connected', detail: 'API key not configured' };
    } else {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      // Lightweight check — count tokens on a tiny string (minimal cost)
      await anthropic.messages.countTokens({
        model: 'claude-opus-4-6',
        messages: [{ role: 'user', content: 'test' }],
      });
      statuses.claude = { status: 'connected' };
    }
  } catch (err) {
    const message = String(err);
    if (message.includes('credit balance') || message.includes('billing')) {
      statuses.claude = { status: 'needs_attention', detail: 'Low credit balance' };
    } else if (message.includes('authentication') || message.includes('invalid')) {
      statuses.claude = { status: 'not_connected', detail: 'Invalid API key' };
    } else {
      statuses.claude = { status: 'needs_attention', detail: 'API error' };
    }
  }

  // Check last RSS scan
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const supabase = createClient(url, key);
      const { data: lastScan } = await supabase
        .from('scan_history')
        .select('completed_at, status, new_posts')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (lastScan) {
        statuses.rss_scan = {
          status: lastScan.status === 'success' ? 'success' : 'failed',
          detail: lastScan.completed_at,
        };
        statuses.last_scan_time = {
          status: 'ok',
          detail: lastScan.completed_at,
        };
      } else {
        statuses.rss_scan = { status: 'unknown' };
        statuses.last_scan_time = { status: 'ok', detail: 'Never' };
      }
    }
  } catch {
    statuses.rss_scan = { status: 'unknown' };
  }

  return NextResponse.json(statuses);
}
