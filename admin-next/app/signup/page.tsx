import { redirect } from 'next/navigation';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SignupForm } from '@/components/auth/signup-form';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Sign up — Gitay Gold' };

export default async function SignupPage() {
  // Already signed in → skip the form.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect('/admin/dashboard');
  }

  return (
    <div className="grid min-h-svh place-items-center px-4 py-10">
      <Card className="w-full max-w-[460px] border-border/60 shadow-2xl shadow-black/5">
        <CardHeader className="space-y-3 text-center">
          <Brand />
          <div className="space-y-1.5">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Create your account
            </CardTitle>
            <CardDescription className="text-sm">
              Sign up to manage Gitay Gold projects.
              New accounts start as viewers; an existing admin can promote you.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <SignupForm />
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
