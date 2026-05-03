'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  Mail,
  Settings,
  LogOut,
  ChevronsUpDown,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOutAction } from '@/app/admin/actions';
import type { Profile } from '@/lib/supabase/types';

interface NavItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  /** Match the route exactly, otherwise allow nested paths to highlight. */
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, exact: true },
  { title: 'Projects', href: '/admin/projects', icon: Briefcase },
  { title: 'Inquiries', href: '/admin/inquiries', icon: Mail, badge: 'Soon' },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
];

interface Props {
  profile: Pick<Profile, 'email' | 'full_name' | 'avatar_url' | 'role'>;
}

/**
 * Persistent left sidebar for the admin shell.
 *
 * Why 'use client': we read `usePathname()` for active-state highlighting.
 * The shadcn `Sidebar` already handles collapse-to-icon mode, mobile Sheet
 * drawer, Cmd/Ctrl+B keyboard shortcut, and persisted open/closed cookie.
 *
 * Why we use `render={<Link/>}`: shadcn's latest sidebar/dropdown components
 * are built on @base-ui/react instead of Radix. The composition pattern
 * changed from `asChild` (with a Slot) to `render={<element/>}`. Same idea —
 * "render this primitive AS that element, merging props" — different API.
 */
export function AdminSidebar({ profile }: Props) {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const initials =
    profile.full_name
      ?.split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() ||
    profile.email.slice(0, 2).toUpperCase();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/admin/dashboard" aria-label="Gitay Gold admin home" />}
            >
              <span
                className="flex aspect-square size-8 items-center justify-center rounded-lg bg-foreground text-background"
                aria-hidden
              >
                <span className="text-[10px] tracking-[0.18em] text-orange-500">◉</span>
              </span>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold tracking-tight">
                  Gitay Gold<span className="text-orange-500">.</span>
                </span>
                <span className="truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Studio admin
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const active = isActive(item);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.title}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {item.badge ? (
                      <SidebarMenuBadge className="bg-orange-500/10 text-orange-500">
                        {item.badge}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[popup-open]:bg-sidebar-accent"
                  />
                }
              >
                <Avatar className="size-8 rounded-lg">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? profile.email} />
                  ) : null}
                  <AvatarFallback className="rounded-lg bg-orange-500/15 text-orange-500 text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-medium">
                    {profile.full_name ?? profile.email.split('@')[0]}
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {profile.email}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-lg"
                side={isMobile ? 'bottom' : 'right'}
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <Avatar className="size-8 rounded-lg">
                      {profile.avatar_url ? (
                        <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? profile.email} />
                      ) : null}
                      <AvatarFallback className="rounded-lg bg-orange-500/15 text-orange-500 text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left leading-tight">
                      <span className="truncate text-sm font-medium">
                        {profile.full_name ?? '—'}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {profile.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="capitalize text-xs text-muted-foreground" disabled>
                  Role · {profile.role}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* signOutAction is a Server Action — using it inside a <form>
                    keeps logout working even with JS disabled and clears the
                    session cookie atomically on the server. */}
                <form action={signOutAction}>
                  <DropdownMenuItem
                    render={
                      <button
                        type="submit"
                        className="w-full cursor-pointer"
                      />
                    }
                  >
                    <LogOut className="size-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
