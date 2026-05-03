'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { GoogleIcon } from '@/components/icons/google';
import { createClient } from '@/lib/supabase/client';

interface Props {
  /** Optional ?next=<path> handed to the OAuth callback. */
  next?: string;
  /** Visible label — varies between login and signup contexts. */
  label?: string;
}

/**
 * Triggers Supabase's Google OAuth flow.
 *
 * Flow:
 *   click → Supabase signInWithOAuth → Google consent →
 *   Google redirects → Supabase callback → /auth/callback?code=...
 *   (route handler exchanges code → /admin/dashboard)
 *
 * `redirectTo` must point at our `/auth/callback` route so we get the
 * `code` back on our origin and can finish the handshake server-side.
 */
export function GoogleButton({
  next = '/admin/dashboard',
  label = 'Continue with Google',
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });

    if (error) {
      toast.error(error.message ?? 'Could not start Google sign-in');
      setLoading(false);
    }
    // On success the browser is already navigating away — leave loading on.
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full h-11 gap-3 font-medium"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <GoogleIcon />
      )}
      <span>{label}</span>
    </Button>
  );
}
