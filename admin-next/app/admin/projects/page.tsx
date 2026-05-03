import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ProjectsFilters } from '@/components/admin/projects/projects-filters';
import { ProjectsGrid } from '@/components/admin/projects/projects-grid';
import { EmptyState } from '@/components/admin/projects/empty-state';
import type { ProjectCardData } from '@/components/admin/projects/project-card';
import { createClient } from '@/lib/supabase/server';
import { CATEGORY_LABELS } from '@/lib/constants/categories';
import type { ProjectCategory, ProjectStatus } from '@/lib/supabase/types';

export const metadata = { title: 'Projects — Gitay Gold Admin' };

interface PageProps {
  // Next 16: searchParams is a Promise.
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    year?: string;
  }>;
}

/* Narrow incoming string params against our enums so a hand-typed URL
   (e.g. ?category=cats) doesn't blow up the query — we just ignore it. */
function parseCategory(v: string | undefined): ProjectCategory | undefined {
  if (!v) return undefined;
  return v in CATEGORY_LABELS ? (v as ProjectCategory) : undefined;
}
function parseStatus(v: string | undefined): ProjectStatus | undefined {
  return v === 'draft' || v === 'published' ? v : undefined;
}
function parseYear(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isInteger(n) && n >= 1990 && n <= 2100 ? n : undefined;
}

export default async function ProjectsListPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? '';
  const category = parseCategory(params.category);
  const status = parseStatus(params.status);
  const year = parseYear(params.year);

  const supabase = await createClient();

  /* ── Build the filtered query ───────────────────────────────────── */
  let query = supabase
    .from('projects')
    .select(
      'id, slug, title, client, year, category, thumbnail_url, hero_image_url, status, featured, updated_at, tags',
    )
    .order('updated_at', { ascending: false });

  if (q) {
    /* Postgres `or` filter: match title, client, OR any tag.
       `tags.cs.{q}` = tags contains the array element q.
       `ilike` is case-insensitive substring match. */
    query = query.or(
      `title.ilike.%${q}%,client.ilike.%${q}%,tags.cs.{${q}}`,
    );
  }
  if (category) query = query.eq('category', category);
  if (status) query = query.eq('status', status);
  if (year) query = query.eq('year', year);

  // .returns<>() pins the row type. With the hand-typed schema the
  // multi-column select otherwise infers as `never` — see Phase 1 notes.
  const { data: projects, error } = await query.returns<ProjectCardData[]>();

  if (error) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Header />
        <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load projects: {error.message}
        </div>
      </div>
    );
  }

  /* ── Distinct years for the year-filter dropdown ────────────────── */
  // A second tiny query so the dropdown reflects the *full dataset* (not
  // just the currently filtered slice). Cheap — only year, no joins.
  const { data: yearRows } = await supabase
    .from('projects')
    .select('year')
    .order('year', { ascending: false })
    .returns<{ year: number }[]>();

  const distinctYears = Array.from(
    new Set((yearRows ?? []).map((r) => r.year)),
  );

  const list = projects ?? [];
  const hasFilters = !!q || !!category || !!status || !!year;
  const hasAnyData = (yearRows?.length ?? 0) > 0 || hasFilters; // do we have data at all?

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Library
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Projects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? `${list.length} of ${yearRows?.length ?? 0} projects`
              : `${list.length} ${list.length === 1 ? 'project' : 'projects'}`}
          </p>
        </div>
        <Button
          render={<Link href="/admin/projects/new" />}
          nativeButton={false}
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">New project</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* Filters — only render if there's data to filter on */}
      {hasAnyData ? (
        <div className="mt-6 rounded-lg border border-border bg-card/50 p-3">
          <ProjectsFilters
            years={distinctYears}
            defaultValues={{
              q,
              category: category ?? '',
              status: status ?? '',
              year: year ? String(year) : '',
            }}
          />
        </div>
      ) : null}

      {/* Body */}
      <div className="mt-6">
        {list.length === 0 ? (
          <EmptyState variant={hasFilters ? 'no-results' : 'no-projects'} />
        ) : (
          <ProjectsGrid projects={list} />
        )}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Library
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Projects
        </h1>
      </div>
      <Button
        render={<Link href="/admin/projects/new" />}
        nativeButton={false}
      >
        <Plus className="size-4" />
        New project
      </Button>
    </div>
  );
}
