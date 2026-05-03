import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

/**
 * Server-side Supabase client.
 *
 * Use in:
 * - Server Components (e.g., app/admin/dashboard/page.tsx)
 * - Route Handlers (app/auth/callback/route.ts)
 * - Server Actions (logout, mutations)
 *
 * Next.js 16 made `cookies()` async — it must be awaited. Older Next 14/15
 * code that synchronously called `cookies()` will fail at runtime here.
 *
 * About the empty try/catch in `setAll`:
 * Server Components are not allowed to mutate cookies — that's a Next.js
 * invariant. The session cookie refresh happens in `proxy.ts` (the renamed
 * middleware). If a Server Component triggers a token refresh by calling
 * `getUser()`, the SDK will *try* to write the new cookie here; we swallow
 * the error since the proxy will handle it on the next request.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component ignored — proxy.ts handles refresh.
          }
        },
      },
    },
  );
};
