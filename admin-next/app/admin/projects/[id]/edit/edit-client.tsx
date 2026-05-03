'use client';

import { ProjectForm } from '@/components/admin/projects/project-form';
import { updateProjectAction } from '../../actions';
import type { Project } from '@/lib/supabase/types';
import type { ProjectFormValues } from '@/lib/validation/project';

interface Props {
  project: Project;
}

/**
 * Thin client wrapper around the form for the edit flow.
 *
 * Why this is a Client Component (and not the page itself):
 * - The form needs `'use client'` for RHF.
 * - The page should stay server-side so we can `await` the Supabase fetch
 *   without prop-drilling the hydration data through a `useEffect`.
 * - Server Components can't pass closures to client components, so this
 *   wrapper builds the bound `submitAction` and `onSaved` closures
 *   client-side from the project's id.
 */
export function EditProjectClient({ project }: Props) {
  // Map the DB row (nullable strings everywhere) onto the form's value
  // shape (everything is a non-null string / number / array). RHF will
  // merge these onto PROJECT_FORM_DEFAULTS via `defaultValues`.
  const defaults: Partial<ProjectFormValues> = {
    title: project.title,
    slug: project.slug,
    client: project.client,
    year: project.year,
    category: project.category,
    live_url: project.live_url ?? '',
    tags: project.tags ?? [],
    short_description: project.short_description ?? '',
    hero_image_url: project.hero_image_url ?? '',
    thumbnail_url: project.thumbnail_url ?? '',
    the_challenge: project.the_challenge ?? '',
    the_solution: project.the_solution ?? '',
    results: project.results ?? '',
    kpis: project.kpis ?? [],
    status: project.status,
    featured: project.featured,
    display_order: project.display_order,
    seo_title: project.seo_title ?? '',
    seo_description: project.seo_description ?? '',
  };

  return (
    <ProjectForm
      pageTitle={project.title}
      pageEyebrow={`Projects · Edit · ${project.status === 'published' ? 'Live' : 'Draft'}`}
      defaultValues={defaults}
      submitAction={(values) => updateProjectAction(project.id, values)}
      submitLabels={
        project.status === 'published'
          ? { saveDraft: 'Unpublish (save as draft)', publish: 'Update' }
          : { saveDraft: 'Save changes', publish: 'Publish' }
      }
      // Stay on the edit page after save. The form will router.refresh()
      // so the freshly-saved data flows back from the server.
      onSaved={() => null}
    />
  );
}
