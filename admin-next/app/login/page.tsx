import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/login-form';
import { createClient } from '@/lib/supabase/server';
import { LoginErrorBanner } from './error-banner';

export const metadata = { title: 'Sign in — Gitay Gold' };

interface PageProps {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{
    redirect?: string;
    error?: string;
  }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const redirectTo = params.redirect ?? '/admin/dashboard';

  // If they're already signed in, bounce them straight to the dashboard.
  // The role check happens in proxy.ts — viewer accounts will get
  // bounced back here with ?error=not_admin, which we display below.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user && !params.error) {
    redirect(redirectTo);
  }

  return (
    <div className="grid min-h-svh place-items-center px-4 py-10">
      <Card className="w-full max-w-[420px] border-border/60 shadow-2xl shadow-black/5">
        <CardHeader className="space-y-3 text-center">
          <Brand />
          <div className="space-y-1.5">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription className="text-sm">
              Sign in to manage projects on Gitay Gold.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {params.error ? <LoginErrorBanner kind={params.error} /> : null}
          <LoginForm redirectTo={redirectTo} />
        </CardContent>
      </Card>
    </div>
  );
}

function Brand() {
  return (
    <div className="mx-auto inline-flex items-center gap-2">
      <span aria-hidden className="text-[10px] tracking-[0.18em] text-orange-500">
        ◉
      </span>
      <span className="text-sm font-semibold tracking-tight">
        Gitay Gold<span className="text-orange-500">.</span>
      </span>
    </div>
  );
}
