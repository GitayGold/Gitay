import { TriangleAlert } from 'lucide-react';

const MESSAGES: Record<string, { title: string; body: string }> = {
  not_admin: {
    title: 'Admin access required',
    body: 'Your account is not an admin yet. Ask the studio owner to grant access.',
  },
  auth: {
    title: 'Sign-in failed',
    body: 'We could not complete the OAuth handshake. Please try again.',
  },
};

interface Props {
  kind: string;
}

/**
 * Inline banner shown above the login form when a redirect carries an
 * `?error=...` param. Pure presentation, no client JS needed.
 */
export function LoginErrorBanner({ kind }: Props) {
  const msg = MESSAGES[kind];
  if (!msg) return null;

  return (
    <div className="mb-5 flex gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
      <div>
        <p className="font-medium text-foreground">{msg.title}</p>
        <p className="text-muted-foreground">{msg.body}</p>
      </div>
    </div>
  );
}
