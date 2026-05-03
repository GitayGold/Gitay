import { ProjectForm } from '@/components/admin/projects/project-form';
import { createProjectAction } from '../actions';

export const metadata = { title: 'New project — Gitay Gold Admin' };

/**
 * /admin/projects/new
 *
 * Server component shell. The form itself is a Client Component because
 * RHF needs the rendering tree.
 *
 * Why we DON'T pass an `onSaved` callback from here:
 * Server Components can pass Server Actions across the boundary (they're
 * serialized as stable references), but they CANNOT pass arbitrary
 * client closures. An inline arrow like `onSaved={(r) => '/foo'}` triggers
 * Next.js's "Event handlers cannot be passed to Client Component props"
 * error. The form already defaults to `/admin/projects` after save —
 * that's the right destination for create. Batch E will customize the
 * post-save destination from inside the (client-side) edit shell.
 */
export default function NewProjectPage() {
  return (
    <ProjectForm
      pageTitle="Create a new project"
      pageEyebrow="Projects · New"
      submitAction={createProjectAction}
      submitLabels={{ saveDraft: 'Save as draft', publish: 'Publish' }}
    />
  );
}
