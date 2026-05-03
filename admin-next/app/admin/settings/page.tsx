import { redirect } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { signOutAction } from '../actions';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/supabase/types';

export const metadata = { title: 'Settings — Gitay Gold Admin' };

/**
 * Read-only settings page for Phase 2.
 *
 * Account profile (name / email / avatar) is shown as displayed-only — the
 * row is owned by Supabase Auth + the `handle_new_user` trigger. Editing
 * the profile (full_name, avatar) ships in Phase 3 alongside the inquiry
 * inbox so we can build the form patterns once and reuse them.
 */
export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = (await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, created_at')
    .eq('id', user.id)
    .single()) as { data: Profile | null };

  if (!profile) redirect('/login');

  const initials =
    profile.full_name
      ?.split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || profile.email.slice(0, 2).toUpperCase();

  const memberSince = new Date(profile.created_at).toLocaleDateString(
    undefined,
    { year: 'numeric', month: 'long', day: 'numeric' },
  );

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Settings
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, devices, and admin preferences.
        </p>
      </div>

      <div className="space-y-5">
        {/* ── Profile (read-only) ──────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Profile
              <Badge className="bg-muted text-muted-foreground" variant="secondary">
                Editable in Phase 3
              </Badge>
            </CardTitle>
            <CardDescription>
              Synced from Supabase Auth. Hooked up to a real form in
              Phase&nbsp;3.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-14">
                {profile.avatar_url ? (
                  <AvatarImage
                    src={profile.avatar_url}
                    alt={profile.full_name ?? profile.email}
                  />
                ) : null}
                <AvatarFallback className="bg-orange-500/15 text-base font-semibold text-orange-500">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {profile.full_name ?? '—'}
                </p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
              </div>
              <Badge
                className="capitalize"
                variant={profile.role === 'admin' ? 'default' : 'outline'}
              >
                {profile.role}
              </Badge>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={profile.full_name ?? '—'} />
              <Field label="Email" value={profile.email} />
              <Field label="Role" value={profile.role} capitalize />
              <Field label="Member since" value={memberSince} />
            </div>
          </CardContent>
        </Card>

        {/* ── Account (sign out, sessions) ─────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
            <CardDescription>
              Active sessions and sign-out. Per-device session management
              ships in Phase&nbsp;3.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Row
              title="This device"
              description="You're currently signed in on this browser."
              right={<Badge variant="secondary">Current</Badge>}
            />
            <Row
              title="Sign out from all devices"
              description="Invalidates every active session for your account."
              right={
                <Badge variant="outline" className="text-muted-foreground">
                  Coming soon
                </Badge>
              }
              dimmed
            />
            <Separator />
            <Row
              title="Sign out (this device)"
              description="Clears the session cookie and returns to the login page."
              right={
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
                  >
                    Sign out
                  </button>
                </form>
              }
            />
          </CardContent>
        </Card>

        {/* ── Preferences ──────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferences</CardTitle>
            <CardDescription>
              Visual and behavior preferences for the admin app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Row
              title="Theme"
              description="Currently follows your operating system."
              right={
                <Badge variant="outline" className="text-muted-foreground">
                  Coming soon
                </Badge>
              }
              dimmed
            />
            <Row
              title="Email notifications"
              description="Get notified when a new contact form inquiry comes in."
              right={
                <Badge variant="outline" className="text-muted-foreground">
                  Coming with Phase 3 inbox
                </Badge>
              }
              dimmed
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ──────────────────────────── helpers ──────────────────────────── */

function Field({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </Label>
      <Input
        readOnly
        value={value}
        className={`pointer-events-none cursor-default bg-muted/40 ${capitalize ? 'capitalize' : ''}`}
        tabIndex={-1}
      />
    </div>
  );
}

function Row({
  title,
  description,
  right,
  dimmed,
}: {
  title: string;
  description: string;
  right: React.ReactNode;
  dimmed?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 ${dimmed ? 'opacity-60' : ''}`}
    >
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0 self-center">{right}</div>
    </div>
  );
}
