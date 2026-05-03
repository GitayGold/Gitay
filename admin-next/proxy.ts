import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Next.js 16 renamed `middleware.ts` → `proxy.ts` (and the function from
 * `middleware()` → `proxy()`). The proxy runtime is `nodejs` only — the
 * `edge` runtime is no longer supported here.
 *
 * Responsibilities:
 * 1. Refresh the Supabase session cookie on every request (via updateSession).
 * 2. Allow public auth routes through.
 * 3. Gate `/admin/*`:
 *    - No user        → /login?redirect=<original>
 *    - User, not admin → /?error=not_admin
 *    - Admin           → continue
 *
 * Defense-in-depth: the admin layout *also* re-checks server-side. The
 * proxy is fast but trusts the cookie; the layout calls getUser() which
 * round-trips to Supabase to validate the JWT.
 */

const PUBLIC_PREFIXES = ['/login', '/signup', '/auth/callback'];

export async function proxy(request: NextRequest) {
  const { response, supabase, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  // Always allow public auth routes (and let them through with refreshed
  // cookies, so a logged-in user hitting /login can be redirected away).
  if (PUBLIC_PREFIXES.some((p) => path.startsWith(p))) {
    return response;
  }

  if (path.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', path);
      return NextResponse.redirect(url);
    }

    // Role check. We do this in the proxy so even cached/static admin
    // pages can't be served to non-admin authenticated users.
    // Explicit response shape — postgrest-js's select-string parser
    // returns `never` on multi-column selects with hand-typed schemas.
    // Phase 2 will switch to `supabase gen types`, which fixes this.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<{ role: 'admin' | 'viewer' }>();

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('error', 'not_admin');
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  // Skip Next internals + static asset URLs to avoid wasting work on
  // requests that don't need session handling.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)',
  ],
};
