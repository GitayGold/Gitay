/**
 * Hand-typed Database type for the @supabase/supabase-js typed client.
 *
 * Why hand-typed (vs `supabase gen types typescript`):
 * - Phase 1 doesn't have the Supabase CLI installed yet.
 * - The schema is small and stable.
 * - In Phase 2 we'll switch to generated types and delete this file.
 *
 * If you change `001_schema.sql`, update this file in the same commit.
 */

export type ProjectCategory =
  | 'web'
  | 'ecommerce'
  | 'branding'
  | 'ux'
  | 'motion'
  | 'ai'
  | 'landing';

export type ProjectStatus = 'draft' | 'published';

export type UserRole = 'admin' | 'viewer';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

/* Discriminated union for the structured `blocks` jsonb column.
   Mirrors the existing static-site cms.js block schema 1:1 so a future
   migration script can copy them across without transformation. */
export interface ProjectBlockText {
  type: 'text';
  content: string;
}
export interface ProjectBlockImage {
  type: 'image';
  url: string;
  caption?: string;
}
export interface ProjectBlockQuote {
  type: 'quote';
  content: string;
  author?: string;
}
export interface ProjectBlockList {
  type: 'list';
  items: string[];
}
export type ProjectBlock =
  | ProjectBlockText
  | ProjectBlockImage
  | ProjectBlockQuote
  | ProjectBlockList;

export interface ProjectKpi {
  label: string;
  value: string;
}

export interface ProjectGalleryItem {
  url: string;
  caption?: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  client: string;
  year: number;
  category: ProjectCategory;
  live_url: string | null;
  tags: string[];
  short_description: string | null;
  hero_image_url: string | null;
  thumbnail_url: string | null;
  gallery: ProjectGalleryItem[];
  blocks: ProjectBlock[];
  kpis: ProjectKpi[];
  the_challenge: string | null;
  the_solution: string | null;
  results: string | null;
  status: ProjectStatus;
  display_order: number;
  featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  created_by: string | null;
}

/**
 * The Database type must conform to @supabase/postgrest-js's GenericSchema:
 * { Tables, Views, Functions } are all required keys (even if empty).
 * Each Table must declare a `Relationships` array (empty here — we have
 * no FK joins exposed to PostgREST in Phase 1).
 *
 * Phase 2 switches to `supabase gen types typescript` which produces this
 * shape automatically.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; email: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      projects: {
        Row: Project;
        Insert: Partial<Project> & {
          slug: string;
          title: string;
          client: string;
          year: number;
          category: ProjectCategory;
        };
        Update: Partial<Project>;
        Relationships: [
          {
            foreignKeyName: 'projects_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      project_category: ProjectCategory;
      project_status: ProjectStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
