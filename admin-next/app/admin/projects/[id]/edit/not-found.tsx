import Link from 'next/link';
import { ArrowLeft, FileQuestion } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Triggered when EditProjectPage calls `notFound()` — the project doesn't
 * exist (or the URL was hand-mangled into an invalid UUID). Renders inside
 * the existing admin shell so the sidebar + top bar stay visible.
 */
export default function ProjectNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-full border border-border bg-muted/40 text-muted-foreground">
        <FileQuestion className="size-6" aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Project not found
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        We couldn&apos;t find a project at this URL. It may have been deleted,
        or the link is wrong.
      </p>
      <Button
        render={<Link href="/admin/projects" />}
        nativeButton={false}
        variant="outline"
        className="mt-6"
      >
        <ArrowLeft className="size-4" />
        Back to projects
      </Button>
    </div>
  );
}
