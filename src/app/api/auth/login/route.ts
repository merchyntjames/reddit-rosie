import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email } = await request.json() as { email: string };

    if (!email || !email.endsWith('@merchynt.com')) {
      return NextResponse.json(
        { error: 'Only @merchynt.com email addresses are allowed.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${new URL(request.url).origin}/api/auth/callback`,
      },
    });

    if (error) {
      // If the domain trigger blocks signup, catch it
      if (error.message.includes('merchynt.com')) {
        return NextResponse.json(
          { error: 'Only @merchynt.com email addresses are allowed.' },
          { status: 400 }
        );
      }
      throw error;
    }

    // Use the standard signInWithOtp for magic link email delivery
    const publicSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
    const { error: otpError } = await publicSupabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/api/auth/callback`,
      },
    });

    if (otpError) throw otpError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to send magic link. Please try again.' },
      { status: 500 }
    );
  }
}
