-- ════════════════════════════════════════════════════════════════
-- Gitay Gold — Phase 1 Row Level Security
-- Run this SECOND, after 001_schema.sql.
-- ════════════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.projects enable row level security;

-- ────────────────────────────────────────────────────────────────
-- Profiles
-- Any authenticated user can read profiles (so admin UI can show
-- author names). Users can only update their own row.
-- ────────────────────────────────────────────────────────────────
create policy "Profiles viewable by authenticated"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ────────────────────────────────────────────────────────────────
-- Projects
-- Read: anyone (anon + authenticated) may read PUBLISHED projects.
--       Admins additionally see drafts.
-- Write: admin role only (insert / update / delete).
--
-- The `auth.uid() in (select id from profiles where role='admin')`
-- subquery is the canonical pattern — RLS evaluates it per-row at
-- query time, so the role check is cached by Postgres efficiently.
-- ────────────────────────────────────────────────────────────────
create policy "Published projects are public"
  on public.projects for select
  using (
    status = 'published'
    or auth.uid() in (select id from public.profiles where role = 'admin')
  );

create policy "Admins insert projects"
  on public.projects for insert
  with check (
    auth.uid() in (select id from public.profiles where role = 'admin')
  );

create policy "Admins update projects"
  on public.projects for update
  using (
    auth.uid() in (select id from public.profiles where role = 'admin')
  );

create policy "Admins delete projects"
  on public.projects for delete
  using (
    auth.uid() in (select id from public.profiles where role = 'admin')
  );
