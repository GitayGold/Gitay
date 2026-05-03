import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth callback handler.
 *
 * Flow:
 *   GoogleButton → supabase.auth.signInWithOAuth({ redirectTo: this URL })
 *   → Supabase redirects browser here with ?code=<one-time>&next=<path>
 *   → exchangeCodeForSession() trades the code for an access+refresh token,
 *     setting the session cookies via the server client's cookie helper.
 *   → Redirect to ?next (defaults to /admin/dashboard).
 *
 * On error → /login?error=auth so the user sees the inline banner.
 *
 * The `next` param is whitelisted to relative paths to prevent open
 * redirects (a classic OAuth-callback CSRF vector).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') ?? '/admin/dashboard';

  // Open-redirect guard: only allow same-origin relative paths.
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//')
    ? nextParam
    : '/admin/dashboard';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
