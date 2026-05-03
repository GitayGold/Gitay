'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

/**
 * Friendly labels for known top-level segments. Anything not listed falls
 * back to a Title-Cased version of the slug ("luminary-brand-web" →
 * "Luminary Brand Web"). Phase 3 will look up project titles by id.
 */
const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  projects: 'Projects',
  inquiries: 'Inquiries',
  settings: 'Settings',
  new: 'New',
  edit: 'Edit',
};

function humanize(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  // UUIDs and ids are noisy in breadcrumbs — show a short label instead.
  if (/^[0-9a-f-]{20,}$/i.test(segment)) return 'Item';
  return segment
    .split('-')
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(' ');
}

interface Crumb {
  href: string;
  label: string;
}

function buildCrumbs(pathname: string): Crumb[] {
  // /admin/projects/abc/edit → ['admin', 'projects', 'abc', 'edit']
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [];
  let acc = '';
  for (const seg of segments) {
    acc += `/${seg}`;
    crumbs.push({ href: acc, label: humanize(seg) });
  }
  return crumbs;
}

/**
 * Sticky top bar that lives inside the admin shell.
 * - Sidebar trigger on the left (also wired to Cmd/Ctrl+B globally).
 * - Vertical separator.
 * - Breadcrumbs derived from the current pathname.
 *
 * Why client-only: we read `usePathname()`. Cheap to render and client-only
 * keeps the layout boundary clean — the rest of the layout stays server-side.
 */
export function AdminTopBar() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <nav aria-label="Breadcrumbs" className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={crumb.href} className="flex min-w-0 items-center gap-1">
              {i > 0 ? (
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
              ) : null}
              {isLast ? (
                <span className="truncate font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="truncate transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
    </header>
  );
}
