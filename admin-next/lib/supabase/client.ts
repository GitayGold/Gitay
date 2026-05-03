import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

/**
 * Browser-side Supabase client.
 *
 * Use in Client Components ('use client') for:
 * - signInWithPassword / signUp / signInWithOAuth (auth UI)
 * - any query that should run from the browser with the user's cookie session
 *
 * Anon key is safe to ship to the browser — RLS policies enforce access.
 *
 * Why @supabase/ssr (vs the deprecated @supabase/auth-helpers-nextjs):
 * the helpers package is end-of-life. @supabase/ssr is the official
 * cookie-aware client and the only one that works correctly with the
 * App Router's request lifecycle.
 */
export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
