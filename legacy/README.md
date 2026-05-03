# Legacy admin (archived in Phase 3)

These files implemented the original portfolio admin:

| File | What it was |
|---|---|
| [admin.html](admin.html) | Password-gated admin SPA (login → dashboard → editor) |
| [admin.css](admin.css) | Its styles |
| [admin.js](admin.js) | Its CRUD logic, written against `localStorage` via `cms.js` |
| [cms.js](cms.js) | Tiny localStorage CMS — seed-defaults, `getAll/add/update/remove/getBySlug`, etc. |

They were **replaced in Phase 3** by:

- [`cms-api.js`](../cms-api.js) — public read layer that fetches from Supabase via the anon REST endpoint (RLS only returns `status='published'` rows).
- [`admin-next/`](../admin-next/) — Next.js 16 admin with Supabase Auth + Postgres + Storage. Visit `https://admin.gitaygold.com` (production) or `http://localhost:3001` (local dev).

## Why are they still here?

- **Archaeology.** This is the only place the original cms.js seed data, password handling, and admin layout live. Useful when comparing how the old vs. new admin handled a feature.
- **Recovery.** If the new admin ever breaks badly, you can temporarily re-wire the static site to the legacy CMS by reverting the script tags in `index.html` and `case-study.html` and copying these files back to the repo root.
- **Costs nothing.** They're not loaded by any active code path; they're just static files in a folder.

## What references them?

Nothing in the active codebase. After Phase 3:

- The static site loads `cms-api.js` (not `cms.js`).
- The static site's footer "Admin" link points at `window.__ADMIN_URL__` (the Next.js admin), not at `admin.html`.
- The local dev server (`server.js`) returns **410 Gone** for `/admin`, `/admin.html`, `/admin.js`, and `/admin.css` — visiting any of those shows a friendly redirect notice. In production, Vercel's `redirects` config bounces them to `https://admin.gitaygold.com`.

## Can I delete them?

Yes, eventually. Wait until you've spent at least one full release cycle on the new admin and confirmed everything you need is in there. Until then, keeping ~50 KB of archived files is cheap insurance.
