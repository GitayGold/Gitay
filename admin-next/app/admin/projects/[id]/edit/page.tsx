import { notFound } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import type { Project } from '@/lib/supabase/types';
import { EditProjectClient } from './edit-client';

interface PageProps {
  // Next 16: params is a Promise.
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = (await supabase
    .from('projects')
    .select('title')
    .eq('id', id)
    .maybeSingle()) as { data: { title: string } | null };
  return { title: data ? `Edit: ${data.title} — Gitay Gold` : 'Edit project' };
}

/**
 * /admin/projects/[id]/edit
 *
 * Server-side fetch of the project + render the (client) form wrapper.
 *
 * RLS edge case: an authenticated viewer (not admin) hitting this URL is
 * already redirected by `proxy.ts`. Anyone who *does* reach this handler
 * is verified admin; the `select('*')` policy lets admins see drafts.
 *
 * Bad ID handling:
 * - UUID strings that don't match any row → `data` is null → notFound().
 * - Non-UUID strings (e.g., the URL was hand-mangled) → Postgres returns
 *   an "invalid input syntax for type uuid" error. We treat that as 404
 *   too, since from the user's perspective it's the same outcome.
 */
export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: project, error } = (await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle()) as {
    data: Project | null;
    error: { code?: string; message: string } | null;
  };

  // 22P02 = invalid_text_representation (e.g., bad UUID). Treat as 404.
  if (error && error.code !== '22P02') {
    throw new Error(error.message);
  }
  if (!project) {
    notFound();
  }

  return <EditProjectClient project={project} />;
}
