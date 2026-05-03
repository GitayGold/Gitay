import { z } from 'zod';

import { CATEGORY_LABELS } from '@/lib/constants/categories';
import { SLUG_REGEX } from '@/lib/slug';
import type { ProjectCategory } from '@/lib/supabase/types';

/**
 * Zod schemas used by both the React Hook Form client validation and the
 * `createProjectAction` Server Action. Validate twice — defense in depth:
 * the form prevents bad input from reaching the network; the action
 * prevents bad data from reaching the DB even if the form is bypassed.
 *
 * Why no `.default()` / `z.coerce` here:
 * RHF v7 + @hookform/resolvers v5 typed the resolver as
 *   `Resolver<input<T>, ctx, output<T>>`
 * so `.default('')` makes input optional but output required, which
 * mismatches RHF's defaultValues type. We keep the schema's input and
 * output identical (string-or-empty, number-or-zero) and supply empty
 * sentinels via `PROJECT_FORM_DEFAULTS`.
 */

const CATEGORY_VALUES = Object.keys(CATEGORY_LABELS) as [
  ProjectCategory,
  ...ProjectCategory[],
];

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), {
    message: 'Must start with http:// or https://',
  });

export const kpiSchema = z.object({
  label: z.string().trim().min(1, 'Label required').max(40),
  value: z.string().trim().min(1, 'Value required').max(40),
});
export type KpiInput = z.infer<typeof kpiSchema>;

const CURRENT_YEAR = new Date().getFullYear();

export const projectFormSchema = z.object({
  // ── Basic ──────────────────────────────────────────────────────
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(160, 'Keep it under 160 characters'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug is too short')
    .max(100, 'Slug is too long')
    .regex(SLUG_REGEX, 'Lowercase letters, numbers and hyphens only'),
  client: z.string().trim().min(1, 'Client is required').max(80),
  year: z
    .number({ message: 'Year is required' })
    .int('Whole numbers only')
    .min(1990, 'Year must be 1990 or later')
    .max(2100, 'Year must be 2100 or earlier'),
  category: z.enum(CATEGORY_VALUES, { message: 'Pick a category' }),
  live_url: optionalUrl,
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  short_description: z.string().trim().max(200, '200 characters max'),

  // ── Media (Batch D) ────────────────────────────────────────────
  // Empty = no image. Otherwise must be a real URL — populated from
  // Supabase Storage's getPublicUrl by the ImageUpload component.
  hero_image_url: optionalUrl,
  thumbnail_url: optionalUrl,

  // ── Story ──────────────────────────────────────────────────────
  the_challenge: z.string().trim(),
  the_solution: z.string().trim(),
  results: z.string().trim(),
  kpis: z.array(kpiSchema).max(8, 'Eight KPIs is plenty'),

  // ── Publishing & SEO ───────────────────────────────────────────
  status: z.enum(['draft', 'published']),
  featured: z.boolean(),
  display_order: z.number({ message: 'Order must be a number' }).int(),
  seo_title: z.string().trim().max(160),
  seo_description: z.string().trim().max(220),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

/** Empty sentinels used by RHF as defaultValues. The schema also accepts
 *  these (empty string, 0, [], false) — input type matches output type. */
export const PROJECT_FORM_DEFAULTS: ProjectFormValues = {
  title: '',
  slug: '',
  client: '',
  year: CURRENT_YEAR,
  category: 'web',
  live_url: '',
  tags: [],
  short_description: '',
  hero_image_url: '',
  thumbnail_url: '',
  the_challenge: '',
  the_solution: '',
  results: '',
  kpis: [],
  status: 'draft',
  featured: false,
  display_order: 0,
  seo_title: '',
  seo_description: '',
};
