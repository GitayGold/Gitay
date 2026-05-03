/* ═══════════════════════════════════════════════════════════════════
   Gitay Gold — Static-site config template
   ═══════════════════════════════════════════════════════════════════

   Copy this file to `config.js` and fill in the values from
   Supabase → Project Settings → API.

   ─── Why these values are safe to commit ──────────────────────────
   The anon key is *designed* to be exposed to the browser. It carries
   only the `anon` Postgres role, which Row Level Security (RLS)
   restricts to `status = 'published'` rows on the `projects` table.
   See admin-next/supabase/migrations/002_rls.sql for the policy.

   The URL is also public — it's the address of the REST endpoint
   browsers will hit anyway.

   The service-role key, however, is NEVER exposed here. It only
   lives in admin-next/.env.local (gitignored) and Vercel project
   settings for the admin app.

   ─── How this file is loaded ──────────────────────────────────────
   `index.html` and `case-study.html` include this file BEFORE
   `cms-api.js` so the latter can read `window.__SUPABASE__` at
   module-init time. Same for `window.__ADMIN_URL__`, used by the
   footer "Admin" link.
   ─────────────────────────────────────────────────────────────────── */

window.__SUPABASE__ = {
  url:     'https://YOUR_PROJECT_REF.supabase.co',
  anonKey: 'YOUR_ANON_PUBLIC_KEY',
};

/* The admin app's home — used to set the footer "Admin" link href.
   The shipped config.js uses a tiny host-detection function so the same
   file works in dev and prod. You can either copy that pattern or
   hard-code a single URL here for simpler setups. */
window.__ADMIN_URL__ = (() => {
  const host = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';
  if (host === 'YOUR_DOMAIN.com' || host === 'www.YOUR_DOMAIN.com') {
    return 'https://admin.YOUR_DOMAIN.com';
  }
  return 'http://localhost:3001';
})();
