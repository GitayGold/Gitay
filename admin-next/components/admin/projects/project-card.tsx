import Link from 'next/link';
import type { ReactNode } from 'react';
import { ImageOff, Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { categoryLabel } from '@/lib/constants/categories';
import { cn } from '@/lib/utils';
import type { Project } from '@/lib/supabase/types';

/** Subset of fields the card needs — keeps the list query lean. */
export type ProjectCardData = Pick<
  Project,
  | 'id'
  | 'slug'
  | 'title'
  | 'client'
  | 'year'
  | 'category'
  | 'thumbnail_url'
  | 'hero_image_url'
  | 'status'
  | 'featured'
  | 'updated_at'
>;

interface Props {
  project: ProjectCardData;
  /** Optional action slot rendered top-left as an overlay (e.g., the
   *  three-dot menu trigger). Kept outside of the click target so users
   *  can interact with it without triggering navigation. */
  action?: ReactNode;
}

/**
 * Project card — visual + interactive layout.
 *
 * Composition pattern:
 * - The `<article>` is the layout root. It carries the rounded border,
 *   shadow, and `group` class for hover styles.
 * - A "stretched" `<Link>` covers the whole card area as a click target.
 *   The visual content (thumbnail, badges, meta) and the optional `action`
 *   slot sit on top via z-index so they remain interactive — but clicks
 *   anywhere else on the card navigate to /admin/projects/{id}/edit.
 */
export function ProjectCard({ project, action }: Props) {
  const thumb = project.thumbnail_url ?? project.hero_image_url;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-foreground/20 hover:shadow-lg hover:shadow-black/5 focus-within:border-foreground focus-within:ring-2 focus-within:ring-ring">
      {/* ── Visual content (z-0, below the link) ─────────────────── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground/40">
            <ImageOff className="size-10" aria-hidden />
          </div>
        )}

        {/* Top-right badges (decorative; sit below the link) */}
        <div className="absolute right-2 top-2 flex items-center gap-1.5">
          {project.featured ? (
            <Badge
              className="border border-orange-500/30 bg-orange-500/15 text-orange-500 backdrop-blur-md"
              aria-label="Featured project"
            >
              <Star className="size-2.5 fill-orange-500" aria-hidden />
              Featured
            </Badge>
          ) : null}
          <StatusBadge status={project.status} />
        </div>

        {/* Hover dim overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500',
            'group-hover:opacity-100',
          )}
          aria-hidden
        />
      </div>

      {/* Meta */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate">
            {project.client} · {project.year}
          </span>
          <span className="shrink-0 text-[10px] uppercase tracking-[0.14em]">
            {categoryLabel(project.category)}
          </span>
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight">
          {project.title}
        </h3>
        <p className="mt-auto text-[11px] text-muted-foreground/80">
          Updated{' '}
          {new Date(project.updated_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year:
              new Date(project.updated_at).getFullYear() === new Date().getFullYear()
                ? undefined
                : 'numeric',
          })}
          {project.status === 'draft' ? ' · Draft' : null}
        </p>
      </div>

      {/* ── Stretched click target (z-0; everything else sits above) ─ */}
      <Link
        href={`/admin/projects/${project.id}/edit`}
        aria-label={`Edit ${project.title}`}
        className="absolute inset-0 rounded-xl focus-visible:outline-none"
      />

      {/* ── Action slot (z-10, on hover) ─────────────────────────── */}
      {action ? (
        <div className="absolute left-2 top-2 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
          {action}
        </div>
      ) : null}
    </article>
  );
}

function StatusBadge({ status }: { status: Project['status'] }) {
  if (status === 'published') {
    return (
      <Badge className="border border-emerald-500/30 bg-emerald-500/15 text-emerald-500 backdrop-blur-md">
        <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
        Published
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-border/80 bg-background/70 text-muted-foreground backdrop-blur-md">
      Draft
    </Badge>
  );
}
