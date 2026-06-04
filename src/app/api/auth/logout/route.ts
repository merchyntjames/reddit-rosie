import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const url = new URL(request.url);
  // Clear auth cookies by redirecting to login
  const response = NextResponse.redirect(new URL('/login', url.origin));
  // Clear Supabase auth cookies
  response.cookies.delete('sb-jakuypixhizbyacemoxh-auth-token');
  return response;
}
