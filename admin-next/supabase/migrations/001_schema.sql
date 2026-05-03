-- ════════════════════════════════════════════════════════════════
-- Gitay Gold — Phase 1 Schema
-- Run this FIRST in Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────────
-- Profiles: extends auth.users with role + display fields.
-- One row per Supabase auth user. Auto-created via trigger below.
-- ────────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text unique not null,
  full_name   text,
  avatar_url  text,
  role        text check (role in ('admin', 'viewer')) default 'viewer',
  created_at  timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────
-- Project category enum.
-- Short slugs match the existing static-site cms.js CATEGORIES so a
-- future Supabase-backed read layer can map 1:1 with no translation.
-- ────────────────────────────────────────────────────────────────
create type project_category as enum (
  'web', 'ecommerce', 'branding', 'ux', 'motion', 'ai', 'landing'
);

-- Status replaces the legacy `visible: boolean` flag with explicit
-- draft/published states. Migration: visible=false → draft.
create type project_status as enum ('draft', 'published');

-- ────────────────────────────────────────────────────────────────
-- Projects table
-- blocks/kpis are jsonb to preserve the existing structured content
-- shape (text/image/quote/list blocks + KPI cards) without forcing
-- a relational schema.
-- ────────────────────────────────────────────────────────────────
create table public.projects (
  id                 uuid default uuid_generate_v4() primary key,
  slug               text unique not null,
  title              text not null,
  client             text not null,
  year               integer not null check (year between 1990 and 2100),
  category           project_category not null,
  live_url           text,
  tags               text[] default '{}',
  short_description  text,
  hero_image_url     text,
  thumbnail_url      text,
  gallery            jsonb default '[]'::jsonb,    -- supplementary images
  blocks             jsonb default '[]'::jsonb,    -- [{type:'text'|'image'|'quote'|'list', ...}]
  kpis               jsonb default '[]'::jsonb,    -- [{label, value}]
  the_challenge      text,
  the_solution       text,
  results            text,
  status             project_status default 'draft',
  display_order      integer default 0,
  featured           boolean default false,
  seo_title          text,
  seo_description    text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now(),
  published_at       timestamptz,
  created_by         uuid references public.profiles(id)
);

-- Indexes for the homepage's hot reads:
-- 1. Filter by status (most common query: published only).
-- 2. Featured projects on homepage (partial index — only true rows).
-- 3. Stable ordering on the work archive.
create index projects_status_idx        on public.projects (status);
create index projects_featured_idx      on public.projects (featured) where featured = true;
create index projects_display_order_idx on public.projects (display_order);

-- ────────────────────────────────────────────────────────────────
-- updated_at trigger
-- ────────────────────────────────────────────────────────────────
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_projects_updated_at
  before update on public.projects
  for each row execute function update_updated_at_column();

-- ────────────────────────────────────────────────────────────────
-- Auto-create profile row when a new auth.users row appears.
-- security definer so it can write to public.profiles regardless
-- of the inserting user's privileges.
-- ────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
