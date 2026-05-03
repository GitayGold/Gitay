import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminTopBar } from '@/components/admin/admin-top-bar';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/supabase/types';

/**
 * Admin layout — server component.
 *
 * Defense in depth: `proxy.ts` already gates /admin/* at the edge of every
 * request. We *also* re-verify here because:
 *   1. proxy reads the cookie; this layout does a roundtrip to Supabase
 *      via getUser(), which validates the JWT signature + expiry.
 *   2. If proxy is misconfigured, this layer is the safety net.
 *   3. Future Server Actions in /admin can rely on `user` being fresh.
 *
 * The shell:
 * - SidebarProvider drives the collapse state via a cookie. We read that
 *   cookie here so the initial server render matches the user's last state
 *   and there's no flash of "expanded sidebar" on cold load.
 * - TooltipProvider wraps the tree because shadcn Sidebar uses tooltips for
 *   icon-mode labels (only visible when collapsed).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/dashboard');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, created_at')
    .eq('id', user.id)
    .single<Profile>();

  if (!profile || profile.role !== 'admin') {
    redirect('/?error=not_admin');
  }

  // Restore the collapsed/expanded state from a cookie set by the
  // SidebarProvider client-side. Default to expanded on first visit.
  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <TooltipProvider delay={150}>
      <SidebarProvider defaultOpen={sidebarOpen}>
        <AdminSidebar profile={profile} />
        <SidebarInset>
          <AdminTopBar />
          <div className="flex-1">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
