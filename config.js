/* ═══════════════════════════════════════════════════════════════════
   Gitay Gold — Static-site config (live)
   ═══════════════════════════════════════════════════════════════════

   These values are PUBLIC by design:
   - The Supabase URL is the address browsers hit anyway.
   - The anon key carries only the `anon` Postgres role; RLS restricts
     it to `status='published'` rows on `projects`. See
     admin-next/supabase/migrations/002_rls.sql.

   The service-role key is NOT here — it lives only in
   admin-next/.env.local + the admin Vercel project's env settings.

   ── Loaded BEFORE cms-api.js so window.__SUPABASE__ is available
      at module-init time. The order is set in index.html / case-study.html.

   ── To run multiple environments off one repo, swap the values below
      manually before each deploy, or add a build step that templates
      this file from env vars. The static site has no build step today,
      so the simplest pattern is "edit this file for prod values". */

window.__SUPABASE__ = {
  url:     'https://mdzfliihqdjqhnqxskzm.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kemZsaWlocWRqcWhucXhza3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MDYzNDYsImV4cCI6MjA5MzM4MjM0Nn0.ks_fn0aqpVcneGFtl_KDCeUFEMACmE5RMKpCVAyTrpw',
};

/* Admin app URL — used by the footer "Admin" link in index.html / case-study.html.
   Auto-picked from `location.hostname` so the same config.js works in
   local dev AND on the production Vercel deploy without a manual edit
   between environments. Add new mappings here when you add new domains. */
window.__ADMIN_URL__ = (() => {
  const host = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';
  // Production
  if (host === 'gitaygold.com' || host === 'www.gitaygold.com') {
    return 'https://admin.gitaygold.com';
  }
  // Vercel preview deploys (`<branch>-<hash>.vercel.app`) → no admin
  // counterpart by default. Falling back to localhost gives a clear
  // "you're on a preview" signal when the link breaks.
  // Local dev + everything else
  return 'http://localhost:3001';
})();
