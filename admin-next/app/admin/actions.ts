'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Server Action: sign out and bounce to /login.
 *
 * Why a Server Action (vs a client-side `supabase.auth.signOut()` call):
 * - Cookie removal is more reliable when issued from the server.
 * - We can `redirect()` atomically inside the same response.
 * - The form `<form action={signOutAction}>` works without JavaScript.
 */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
