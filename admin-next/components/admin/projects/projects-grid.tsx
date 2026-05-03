'use client';

import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { ProjectCard, type ProjectCardData } from './project-card';
import { ProjectCardMenu } from './project-card-menu';
import {
  deleteProjectAction,
  duplicateProjectAction,
  toggleFeaturedAction,
} from '@/app/admin/projects/actions';

/**
 * Client component that owns the optimistic state for the projects list.
 *
 * Why useOptimistic:
 * - When the user clicks "Delete", they shouldn't have to wait for the
 *   round-trip to see the card disappear. We update the local view
 *   *instantly*, kick off the Server Action in a Transition, then call
 *   `router.refresh()` to reconcile with the real server state. If the
 *   action fails, React automatically reverts the optimistic state when
 *   the transition resolves — no manual rollback to write.
 * - Same for "Toggle Featured": the star flips immediately; the transition
 *   either confirms it (no visible change after refresh) or reverts.
 *
 * The grid is the source of truth for *which* cards exist; the menu in
 * each card is "dumb" and just calls back here.
 *
 * Why we don't optimistically render the duplicated copy:
 * - The new project's `id` and `slug` aren't known until the server returns.
 *   We could synthesize a placeholder, but `router.refresh()` after the
 *   action gives us the real row in one extra round trip. Simpler.
 */
type Action =
  | { type: 'remove'; id: string }
  | { type: 'toggle-featured'; id: string; next: boolean };

interface Props {
  projects: ProjectCardData[];
}

export function ProjectsGrid({ projects }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [optimistic, applyOptimistic] = useOptimistic<
    ProjectCardData[],
    Action
  >(projects, (state, action) => {
    switch (action.type) {
      case 'remove':
        return state.filter((p) => p.id !== action.id);
      case 'toggle-featured':
        return state.map((p) =>
          p.id === action.id ? { ...p, featured: action.next } : p,
        );
    }
  });

  const handleDelete = (project: ProjectCardData) => {
    startTransition(async () => {
      applyOptimistic({ type: 'remove', id: project.id });
      const result = await deleteProjectAction(project.id);
      if (result.ok) {
        toast.success(`Deleted “${project.title}”`);
        router.refresh();
      } else {
        toast.error(result.error);
        // The optimistic state auto-reverts when the transition resolves;
        // no explicit rollback needed.
      }
    });
  };

  const handleToggleFeatured = (project: ProjectCardData) => {
    const next = !project.featured;
    startTransition(async () => {
      applyOptimistic({ type: 'toggle-featured', id: project.id, next });
      const result = await toggleFeaturedAction(project.id, next);
      if (result.ok) {
        toast.success(next ? 'Featured' : 'Unfeatured');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDuplicate = (project: ProjectCardData) => {
    startTransition(async () => {
      const result = await duplicateProjectAction(project.id);
      if (result.ok) {
        toast.success(`Duplicated “${project.title}”`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {optimistic.map((p) => (
        <ProjectCard
          key={p.id}
          project={p}
          action={
            <ProjectCardMenu
              project={p}
              onDelete={() => handleDelete(p)}
              onToggleFeatured={() => handleToggleFeatured(p)}
              onDuplicate={() => handleDuplicate(p)}
              isPending={isPending}
            />
          }
        />
      ))}
    </div>
  );
}
