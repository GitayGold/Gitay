import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from './types';

/**
 * Session refresh helper — called from `proxy.ts` (Next 16's renamed
 * middleware) on every matched request.
 *
 * What it does:
 * 1. Builds a Supabase server client wired to read/write cookies on the
 *    request/response so the auth SDK can rotate expired access tokens.
 * 2. Calls `getUser()` to *force* the SDK to validate (and, if needed,
 *    refresh) the session. This is the canonical pattern from Supabase's
 *    Next.js docs — you must touch a user-bound API for the cookie
 *    rotation to actually fire.
 * 3. Returns the response (with potentially refreshed cookies set), the
 *    typed client (so the proxy can do role lookups), and the user.
 *
 * The proxy then makes the auth/role decisions — this helper is purely
 * mechanical session plumbing.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          // Mirror cookies onto the incoming request so subsequent
          // reads see the new values inside this single request.
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          // Re-create the response so cookies set on the response object
          // win over Next's default response cookies.
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // CRITICAL: do not remove. Calling getUser() is what triggers the
  // cookie rotation. Replacing this with getSession() will *not* refresh
  // the JWT — it's a known footgun in @supabase/ssr.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, supabase, user };
}
