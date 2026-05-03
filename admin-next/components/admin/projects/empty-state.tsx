import Link from 'next/link';
import { FolderPlus, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface Props {
  /** Switches messaging between "no projects yet" and "no results for filters". */
  variant: 'no-projects' | 'no-results';
  /** When variant=no-results, link the user to clear the filters. */
  onClearHref?: string;
}

/**
 * Empty state with a soft, on-brand illustration (no asset — pure CSS).
 * Two variants:
 * - `no-projects`: first-time, big "Create your first project" CTA
 * - `no-results`:  filters returned nothing, offer to clear them
 */
export function EmptyState({ variant, onClearHref = '/admin/projects' }: Props) {
  if (variant === 'no-projects') {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-20 text-center">
        <Illustration />
        <h2 className="mt-6 text-lg font-semibold tracking-tight">
          No projects yet
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Your portfolio is a blank canvas. Add the first case study and it
          will show up here — and on the public site once you publish it.
        </p>
        <Button
          render={<Link href="/admin/projects/new" />}
          nativeButton={false}
          className="mt-6"
        >
          <Plus className="size-4" />
          Create your first project
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
      <FolderPlus className="size-10 text-muted-foreground/60" aria-hidden />
      <h2 className="mt-4 text-base font-semibold tracking-tight">
        No projects match these filters
      </h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Try widening the search or clearing one of the filters.
      </p>
      <Button
        render={<Link href={onClearHref} />}
        nativeButton={false}
        variant="outline"
        size="sm"
        className="mt-5"
      >
        Clear filters
      </Button>
    </div>
  );
}

/**
 * On-brand decorative illustration. Pure CSS / SVG so we don't ship an asset.
 * The orange dot mirrors the studio mark from the sidebar/logo lockup.
 */
function Illustration() {
  return (
    <div className="relative">
      <div className="size-20 rounded-2xl border border-border bg-background shadow-sm" />
      <div className="absolute -right-3 -top-3 size-12 rounded-xl border border-border bg-card shadow-sm" />
      <div className="absolute -bottom-3 -left-3 size-10 rounded-xl border border-orange-500/40 bg-orange-500/10" />
      <div
        className="absolute -bottom-1 -right-1 size-3 rounded-full bg-orange-500 shadow-[0_0_0_4px_rgba(255,77,0,0.18)]"
        aria-hidden
      />
    </div>
  );
}
