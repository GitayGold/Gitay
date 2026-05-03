'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Copy,
  MoreHorizontal,
  Pencil,
  Star,
  StarOff,
  Trash2,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { ProjectCardData } from './project-card';

interface Props {
  project: ProjectCardData;
  /** Triggers the optimistic-removal flow in the parent grid. */
  onDelete: () => void;
  /** Triggers the optimistic-toggle flow in the parent grid. */
  onToggleFeatured: () => void;
  /** Calls the duplicate Server Action; the parent refreshes the list. */
  onDuplicate: () => void;
  /** True while a destructive action is in flight (disables the dialog button). */
  isPending?: boolean;
}

/**
 * Per-card actions: Edit · Duplicate · Toggle Featured · Delete.
 *
 * Why this lives in a separate file:
 * - The card itself is a server-renderable layout; this is the only
 *   client-side island it needs.
 * - All the destructive logic (state machine + optimistic mutations) is
 *   delegated to the parent `ProjectsGrid` via callbacks. Keeping the menu
 *   "dumb" makes the optimistic flow easier to reason about — the grid
 *   owns the truth.
 *
 * Click semantics:
 * - The trigger is a button, *not* inside the card's stretched `<Link>` —
 *   it's a sibling overlay (see project-card.tsx). Clicking it doesn't
 *   navigate; it only opens the dropdown.
 * - The Edit option uses a real `<Link>` (rendered into the menu item)
 *   so middle-click / Cmd-click "open in new tab" works as expected.
 */
export function ProjectCardMenu({
  project,
  onDelete,
  onToggleFeatured,
  onDuplicate,
  isPending = false,
}: Props) {
  // Confirmation dialog open state — kept local so the dropdown can close
  // first (Base UI insists on its own focus management).
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              size="icon-sm"
              variant="secondary"
              className="size-7 rounded-md border border-border/60 bg-background/80 backdrop-blur-sm shadow-sm"
              aria-label={`Actions for ${project.title}`}
            />
          }
        >
          <MoreHorizontal className="size-3.5" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={6} className="w-44">
          <DropdownMenuItem
            render={<Link href={`/admin/projects/${project.id}/edit`} />}
          >
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="size-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleFeatured}>
            {project.featured ? (
              <>
                <StarOff className="size-4" />
                Unfeature
              </>
            ) : (
              <>
                <Star className="size-4" />
                Feature
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <span className="font-semibold text-foreground">
                &ldquo;{project.title}&rdquo;
              </span>
              . The project page goes offline immediately and the action
              cannot be undone. (Image files in Storage are kept until the
              cleanup utility runs.)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                setConfirmOpen(false);
                onDelete();
              }}
            >
              <Trash2 className="size-4" />
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
