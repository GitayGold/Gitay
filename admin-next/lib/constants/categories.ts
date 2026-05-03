import type { ProjectCategory } from '@/lib/supabase/types';

/**
 * Single source of truth for category labels.
 *
 * Slugs match the existing static-site cms.js — keep them aligned. If you
 * add a new category here, also:
 *  1. Add it to the `project_category` enum in 001_schema.sql
 *  2. Add it to `ProjectCategory` in lib/supabase/types.ts
 */
export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  web: 'Web Development',
  ecommerce: 'E-Commerce',
  branding: 'Branding',
  ux: 'UX / Product',
  motion: 'Motion & Video',
  ai: 'AI & Automation',
  landing: 'Landing Page',
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({
    value: value as ProjectCategory,
    label,
  }),
);

export function categoryLabel(slug: string | null | undefined): string {
  if (!slug) return '—';
  return CATEGORY_LABELS[slug as ProjectCategory] ?? slug;
}
