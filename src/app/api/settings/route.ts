import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// GET: Fetch all settings
export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const { data, error } = await supabase
      .from('settings')
      .select('key, value');

    if (error) throw new Error(error.message);

    // Convert array of {key, value} into a flat object
    const settings: Record<string, unknown> = {};
    for (const row of data ?? []) {
      settings[row.key] = row.value;
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH: Update one or more settings
export async function PATCH(request: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const body = await request.json() as Record<string, unknown>;

    // Upsert each key-value pair
    for (const [key, value] of Object.entries(body)) {
      const { error } = await supabase
        .from('settings')
        .upsert(
          { key, value: JSON.parse(JSON.stringify(value)), updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (error) {
        console.error(`Failed to update setting "${key}":`, error.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', details: String(error) },
      { status: 500 }
    );
  }
}
