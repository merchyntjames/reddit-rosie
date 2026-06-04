import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');

  if (!code && !token_hash) {
    return NextResponse.redirect(new URL('/login', url.origin));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (token_hash && type) {
    // OTP/magic link verification
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'magiclink' | 'email',
    });

    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(new URL('/login?error=auth_failed', url.origin));
    }
  } else if (code) {
    // Code exchange
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Code exchange error:', error);
      return NextResponse.redirect(new URL('/login?error=auth_failed', url.origin));
    }
  }

  // Redirect to Queue on success
  return NextResponse.redirect(new URL('/', url.origin));
}
