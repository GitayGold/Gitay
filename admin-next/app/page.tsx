import { redirect } from 'next/navigation';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

/**
 * Public root.
 * - If logged in & admin → /admin/dashboard.
 * - If logged in & viewer → show "no admin access" card (set by proxy).
 * - If logged out → /login.
 */
export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !params.error) {
    redirect('/login');
  }

  // Authenticated path: check role and route accordingly.
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<{ role: 'admin' | 'viewer' }>();

    if (profile?.role === 'admin' && !params.error) {
      redirect('/admin/dashboard');
    }
  }

  return (
    <div className="grid min-h-svh place-items-center px-4 py-10">
      <Card className="w-full max-w-[460px] border-border/60 shadow-2xl shadow-black/5">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {params.error === 'not_admin'
              ? 'No admin access'
              : 'Gitay Gold Admin'}
          </CardTitle>
          <CardDescription>
            {params.error === 'not_admin'
              ? 'Your account is signed in but not yet an admin. Ask the studio owner to grant access, then refresh.'
              : 'Sign in to manage projects.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-center text-sm">
          <a
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-5 text-background transition-opacity hover:opacity-90"
          >
            Go to sign-in
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
