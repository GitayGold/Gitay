import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Briefcase,
  CircleDot,
  ImageOff,
  Plus,
  Send,
  Star,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { categoryLabel } from '@/lib/constants/categories';
import type { Profile, Project } from '@/lib/supabase/types';
import { DashboardShell } from './dashboard-shell';

export const metadata = { title: 'Dashboard — Gitay Gold Admin' };

type RecentRow = Pick<
  Project,
  | 'id'
  | 'title'
  | 'client'
  | 'category'
  | 'thumbnail_url'
  | 'hero_image_url'
  | 'status'
  | 'updated_at'
>;

/**
 * Real dashboard for Phase 2.
 *
 * We fan out four COUNT queries + one recent-activity SELECT in parallel.
 * Why count queries with `head: true`:
 *  - Postgres returns just the count header, no rows. Cheapest possible
 *    way to know "how many drafts do I have" without paying for the data.
 *  - Each filtered count is independent of the others, so Promise.all
 *    parallelizes them server-side.
 *
 * RLS lets admins see drafts, so the counts here reflect TOTAL projects
 * (not just published). Public anon users would see only published.
 */
export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profileResult, totalRes, draftRes, publishedRes, featuredRes, recentRes] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, role, created_at')
        .eq('id', user.id)
        .single(),
      supabase.from('projects').select('id', { count: 'exact', head: true }),
      supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'draft'),
      supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published'),
      supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('featured', true),
      supabase
        .from('projects')
        .select(
          'id, title, client, category, thumbnail_url, hero_image_url, status, updated_at',
        )
        .order('updated_at', { ascending: false })
        .limit(5),
    ]);

  const profile = profileResult.data as Profile | null;
  if (!profile) redirect('/login');

  const total = totalRes.count ?? 0;
  const drafts = draftRes.count ?? 0;
  const published = publishedRes.count ?? 0;
  const featured = featuredRes.count ?? 0;
  const recent = (recentRes.data ?? []) as RecentRow[];

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        {/* ── Header ───────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome,{' '}
              <span className="font-serif font-light italic text-orange-500">
                {profile.full_name?.split(' ')[0] ?? 'admin'}.
              </span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Here&apos;s where your portfolio stands today.
            </p>
          </div>
          <Button
            render={<Link href="/admin/projects/new" />}
            nativeButton={false}
          >
            <Plus className="size-4" />
            New project
          </Button>
        </div>

        {/* ── Stat cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Total projects"
            value={total}
            icon={<Briefcase className="size-4" />}
            href="/admin/projects"
          />
          <StatCard
            label="Drafts"
            value={drafts}
            icon={<CircleDot className="size-4 text-muted-foreground" />}
            href="/admin/projects?status=draft"
          />
          <StatCard
            label="Published"
            value={published}
            icon={<Send className="size-4 text-emerald-500" />}
            href="/admin/projects?status=published"
            valueClassName="text-emerald-600 dark:text-emerald-500"
          />
          <StatCard
            label="Featured"
            value={featured}
            icon={<Star className="size-4 text-orange-500" />}
            href="/admin/projects"
            valueClassName="text-orange-500"
          />
        </div>

        {/* ── Recent activity ──────────────────────────────────── */}
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-end justify-between gap-2">
            <div>
              <CardTitle className="text-base">Recent activity</CardTitle>
              <CardDescription>
                The five projects you (or any admin) edited last.
              </CardDescription>
            </div>
            <Link
              href="/admin/projects"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              See all →
            </Link>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                No projects yet.{' '}
                <Link
                  href="/admin/projects/new"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Create your first one
                </Link>
                .
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {recent.map((p) => {
                  const thumb = p.thumbnail_url ?? p.hero_image_url;
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/admin/projects/${p.id}/edit`}
                        className="group flex items-center gap-3 px-1 py-2.5 transition-colors hover:bg-muted/40 rounded-md"
                      >
                        <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb}
                              alt=""
                              className="size-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-muted-foreground/50">
                              <ImageOff className="size-4" aria-hidden />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {p.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {p.client} · {categoryLabel(p.category)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {p.status === 'published' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-emerald-500">
                              <span
                                aria-hidden
                                className="size-1.5 rounded-full bg-emerald-500"
                              />
                              Live
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                              Draft
                            </span>
                          )}
                          <span className="hidden sm:inline font-mono text-[11px] tabular-nums text-muted-foreground">
                            {relativeDate(p.updated_at)}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

/* ──────────────────────────── helpers ──────────────────────────── */

function StatCard({
  label,
  value,
  icon,
  href,
  valueClassName,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  valueClassName?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] uppercase tracking-[0.16em]">{label}</span>
        {icon}
      </div>
      <div
        className={`mt-3 text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl ${valueClassName ?? ''}`}
      >
        {value.toLocaleString()}
      </div>
    </Link>
  );
}

function relativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 14) return `${day}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year:
      new Date(iso).getFullYear() === new Date().getFullYear()
        ? undefined
        : 'numeric',
  });
}
