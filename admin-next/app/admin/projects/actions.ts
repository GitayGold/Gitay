'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import {
  projectFormSchema,
  type ProjectFormValues,
} from '@/lib/validation/project';
import type { Database, Project } from '@/lib/supabase/types';

type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export type ActionResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; error: string; field?: string };

/**
 * Why Server Actions for every mutation:
 * - Type-safe RPC: the form passes the values object directly, no manual JSON.
 * - We can `revalidatePath` to bust caches atomically with the write.
 * - `<form action={...}>` works without JS for progressive enhancement.
 * - All three layers run in series: RHF/Zod → re-validated Zod here → RLS.
 *
 * The cast-to-`never` on each .insert/.update/.delete payload is the same
 * workaround documented in proxy.ts: postgrest-js's multi-row typings
 * resolve to `never` against our hand-typed Database. Phase 2 polish will
 * swap in `supabase gen types typescript` and these casts will disappear.
 */

/* ──────────────────────────── CREATE ──────────────────────────── */

export async function createProjectAction(
  input: ProjectFormValues,
): Promise<ActionResult> {
  const parsed = projectFormSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      error: first?.message ?? 'Validation failed',
      field: first?.path.join('.'),
    };
  }
  const values = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  const nowIso = new Date().toISOString();

  const insertPayload: ProjectInsert = {
    slug: values.slug,
    title: values.title,
    client: values.client,
    year: values.year,
    category: values.category,
    live_url: values.live_url || null,
    tags: values.tags,
    short_description: values.short_description || null,
    hero_image_url: values.hero_image_url || null,
    thumbnail_url: values.thumbnail_url || null,
    the_challenge: values.the_challenge || null,
    the_solution: values.the_solution || null,
    results: values.results || null,
    kpis: values.kpis,
    status: values.status,
    featured: values.featured,
    display_order: values.display_order,
    seo_title: values.seo_title || null,
    seo_description: values.seo_description || null,
    created_by: user.id,
    // Stamp published_at when shipping straight to live; null for draft.
    published_at: values.status === 'published' ? nowIso : null,
  };

  const { data, error } = (await supabase
    .from('projects')
    .insert(insertPayload as never)
    .select('id, slug')
    .single()) as {
    data: { id: string; slug: string } | null;
    error: { code?: string; message: string } | null;
  };

  if (error) {
    if (error.code === '23505') {
      return {
        ok: false,
        error: 'A project with this slug already exists',
        field: 'slug',
      };
    }
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: false, error: 'Insert succeeded but no row returned' };
  }

  revalidatePath('/admin/projects');
  revalidatePath('/admin/dashboard');
  return { ok: true, id: data.id, slug: data.slug };
}

/* ──────────────────────────── UPDATE ──────────────────────────── */

export async function updateProjectAction(
  id: string,
  input: ProjectFormValues,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing project id' };

  const parsed = projectFormSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      error: first?.message ?? 'Validation failed',
      field: first?.path.join('.'),
    };
  }
  const values = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  /* Read current published_at so we don't reset it on every save.
     Rules:
     - draft on save → published_at stays null
     - published on first time → stamp now()
     - published already → keep the original timestamp */
  const { data: existing } = (await supabase
    .from('projects')
    .select('published_at, status')
    .eq('id', id)
    .single()) as {
    data: { published_at: string | null; status: 'draft' | 'published' } | null;
    error: unknown;
  };

  let publishedAt: string | null = existing?.published_at ?? null;
  if (values.status === 'published' && !publishedAt) {
    publishedAt = new Date().toISOString();
  }
  if (values.status === 'draft') {
    publishedAt = null;
  }

  const updatePayload: ProjectUpdate = {
    slug: values.slug,
    title: values.title,
    client: values.client,
    year: values.year,
    category: values.category,
    live_url: values.live_url || null,
    tags: values.tags,
    short_description: values.short_description || null,
    hero_image_url: values.hero_image_url || null,
    thumbnail_url: values.thumbnail_url || null,
    the_challenge: values.the_challenge || null,
    the_solution: values.the_solution || null,
    results: values.results || null,
    kpis: values.kpis,
    status: values.status,
    featured: values.featured,
    display_order: values.display_order,
    seo_title: values.seo_title || null,
    seo_description: values.seo_description || null,
    published_at: publishedAt,
  };

  const { error } = (await supabase
    .from('projects')
    .update(updatePayload as never)
    .eq('id', id)) as { error: { code?: string; message: string } | null };

  if (error) {
    if (error.code === '23505') {
      return {
        ok: false,
        error: 'A project with this slug already exists',
        field: 'slug',
      };
    }
    return { ok: false, error: error.message };
  }

  // Bust both list view and the edit page (the form also triggers a router.refresh).
  revalidatePath('/admin/projects');
  revalidatePath(`/admin/projects/${id}/edit`);
  revalidatePath('/admin/dashboard');
  return { ok: true, id, slug: values.slug };
}

/* ──────────────────────────── DELETE ──────────────────────────── */

/**
 * Why we don't auto-delete the row's images from Storage:
 * - Storage operations can partially fail mid-flight; rolling back the row
 *   delete after the row is gone is a hassle.
 * - Multiple projects might reference the same image (rare, but possible
 *   if a future "duplicate keeps assets" flow is added).
 * - A single nightly reconciliation utility (Phase 3) is simpler and
 *   strictly more correct: scan rows → list Storage → diff → delete unreferenced.
 *
 * For Phase 2 we accept the orphans. Disk on Supabase Storage is cheap.
 */
export async function deleteProjectAction(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing project id' };

  const supabase = await createClient();

  const { error } = (await supabase
    .from('projects')
    .delete()
    .eq('id', id)) as { error: { message: string } | null };

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/projects');
  revalidatePath('/admin/dashboard');
  return { ok: true, id, slug: '' };
}

/* ────────────────────── TOGGLE FEATURED (one-click) ────────────────────── */

export async function toggleFeaturedAction(
  id: string,
  next: boolean,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing project id' };

  const supabase = await createClient();
  const { error } = (await supabase
    .from('projects')
    .update({ featured: next } as never)
    .eq('id', id)) as { error: { message: string } | null };

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/projects');
  revalidatePath('/admin/dashboard');
  return { ok: true, id, slug: '' };
}

/* ──────────────────────────── DUPLICATE ──────────────────────────── */

/**
 * Linear / Notion convention: append " (Copy)" to the title and produce
 * a fresh slug like `{original-slug}-copy[-N]`. The copy is created as
 * a draft and unfeatured — it's a working copy until the user reviews it.
 *
 * Image URLs are *referenced*, not deep-copied. Both projects point at
 * the same Storage paths. That's the right default: deep-copying assets
 * doubles storage for what's almost always a clone the user will edit.
 */
export async function duplicateProjectAction(
  id: string,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing project id' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  // Read the source row.
  const { data: source, error: readError } = (await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()) as {
    data: Project | null;
    error: { message: string } | null;
  };

  if (readError) return { ok: false, error: readError.message };
  if (!source) return { ok: false, error: 'Project not found' };

  // Find a free slug. We probe the DB instead of trying to be clever with
  // counts so concurrent copies on the same source don't collide.
  const baseSlug = `${source.slug}-copy`.slice(0, 100);
  let attempt = 0;
  let candidate = baseSlug;
  while (attempt < 50) {
    const { data: clash } = (await supabase
      .from('projects')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()) as { data: { id: string } | null };
    if (!clash) break;
    attempt++;
    candidate = `${baseSlug}-${attempt + 1}`.slice(0, 100);
  }

  // Strip non-copyable fields and override the rest.
  const insertPayload: ProjectInsert = {
    slug: candidate,
    title: `${source.title} (Copy)`,
    client: source.client,
    year: source.year,
    category: source.category,
    live_url: source.live_url,
    tags: source.tags,
    short_description: source.short_description,
    hero_image_url: source.hero_image_url,
    thumbnail_url: source.thumbnail_url,
    gallery: source.gallery,
    blocks: source.blocks,
    kpis: source.kpis,
    the_challenge: source.the_challenge,
    the_solution: source.the_solution,
    results: source.results,
    seo_title: source.seo_title,
    seo_description: source.seo_description,
    display_order: source.display_order,
    // Reset working state — the user reviews before publishing.
    status: 'draft',
    featured: false,
    published_at: null,
    created_by: user.id,
  };

  const { data, error } = (await supabase
    .from('projects')
    .insert(insertPayload as never)
    .select('id, slug')
    .single()) as {
    data: { id: string; slug: string } | null;
    error: { message: string } | null;
  };

  if (error) return { ok: false, error: error.message };
  if (!data) {
    return { ok: false, error: 'Insert succeeded but no row returned' };
  }

  revalidatePath('/admin/projects');
  revalidatePath('/admin/dashboard');
  return { ok: true, id: data.id, slug: data.slug };
}
