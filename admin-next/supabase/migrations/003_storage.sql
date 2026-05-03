-- ════════════════════════════════════════════════════════════════
-- Gitay Gold — Phase 1 Storage Policies
-- Run this THIRD, AFTER you have created the `project-images`
-- bucket in the Supabase Dashboard (Storage → New bucket).
--
-- Bucket configuration to set in the Dashboard:
--   Name:               project-images
--   Public:             ✓ (so the static site can <img src=...>)
--   File size limit:    5 MB
--   Allowed MIME types: image/jpeg, image/png, image/webp, image/avif
-- ════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- Public read on the bucket (anyone can GET image URLs).
-- This is required because the public-facing static site embeds
-- images via plain <img> tags with the public URL.
-- ────────────────────────────────────────────────────────────────
create policy "Public read project images"
  on storage.objects for select
  using (bucket_id = 'project-images');

-- ────────────────────────────────────────────────────────────────
-- Admin-only write/update/delete.
-- Same role-check pattern as projects RLS.
-- ────────────────────────────────────────────────────────────────
create policy "Admins upload project images"
  on storage.objects for insert
  with check (
    bucket_id = 'project-images'
    and auth.uid() in (select id from public.profiles where role = 'admin')
  );

create policy "Admins update project images"
  on storage.objects for update
  using (
    bucket_id = 'project-images'
    and auth.uid() in (select id from public.profiles where role = 'admin')
  );

create policy "Admins delete project images"
  on storage.objects for delete
  using (
    bucket_id = 'project-images'
    and auth.uid() in (select id from public.profiles where role = 'admin')
  );
