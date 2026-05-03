# Gitay Gold — Studio Portfolio

A boutique web-agency portfolio + a production-grade admin, sharing one
Supabase backend. Built across three phases:

- **Phase 1** — Supabase foundation (DB schema, RLS, auth, Google OAuth, route protection).
- **Phase 2** — full Next.js admin: projects list, tabbed editor, drag-drop image upload with client-side compression, optimistic UI.
- **Phase 3** — public bridge from the static site to Supabase, legacy retirement, Vercel deploy.

This README is the high-level map. For the deploy-day playbook, see [PHASE_3_DEPLOY.md](PHASE_3_DEPLOY.md).

---

## 1. Architecture

```
                                    ┌──────────────────────────────┐
                                    │   Supabase (single project)  │
                                    │  ─────────────────────────   │
                                    │   Postgres + RLS             │
                                    │   - profiles                 │
                                    │   - projects (jsonb blocks,  │
                                    │       jsonb kpis, status,    │
                                    │       featured, …)           │
                                    │   Auth (email + Google OAuth)│
                                    │   Storage (project-images/)  │
                                    └──────────────┬───────────────┘
                                                   │
            ┌───── anon REST + RLS ────┐           │           ┌── service-role + cookies ──┐
            │  (read published only)   │           │           │  (full CRUD)               │
            ▼                          │           │           ▼                            │
┌────────────────────────────┐         │           │   ┌────────────────────────────────┐  │
│   Static site (Vercel A)   │         │           │   │   Admin app (Vercel B)         │  │
│   gitaygold.com            │◀────────┘           └──▶│   admin.gitaygold.com          │◀─┘
│   ─────────────────────    │                         │   ─────────────────────────    │
│   Plain HTML/CSS/JS        │                         │   Next.js 16 + Turbopack       │
│   GSAP + Three.js          │                         │   shadcn/ui + Tailwind 4       │
│   cms-api.js → Supabase    │                         │   React Hook Form + Zod        │
│   sessionStorage cache     │                         │   Server Actions               │
│   No build step            │                         │   useOptimistic for delete     │
└────────────────────────────┘                         └────────────────────────────────┘
        ▲                                                       ▲
        │                                                       │
        └──── footer "Admin" link (auto-host-detected) ─────────┘
```

**Key invariants:**

- The static site is **read-only** against Supabase, anon-keyed, RLS-restricted to `status='published'`.
- The admin is the **only writer**. RLS lets only `role='admin'` profiles INSERT/UPDATE/DELETE.
- The two front-ends share **zero code** — they share a database. Different frameworks, different deploy targets, different concerns.

---

## 2. Tech stack

### Static site (root /)
- HTML5 / CSS3 / vanilla JS (no bundler)
- **GSAP** + **ScrollTrigger** for scroll-driven motion
- **Three.js** for the hero canvas
- **Inter** + **Fraunces** + **JetBrains Mono** via Google Fonts
- `cms-api.js` reads Supabase via the [REST endpoint](https://docs.postgrest.org/) (anon key, sessionStorage cache, 5-min TTL)
- Local dev server: tiny [server.js](server.js) (Node http) — production runs on Vercel static hosting

### Admin (`admin-next/`)
- **Next.js 16** App Router · Turbopack default · Node.js 20.9+
- **TypeScript** strict
- **Tailwind CSS 4** + **shadcn/ui** (built on `@base-ui/react`)
- **Supabase** via `@supabase/ssr` (browser + server clients)
- **React Hook Form** + **Zod 4** for forms (input = output schemas)
- **Sonner** for toasts · **Framer Motion** for entrance animations · **Lucide** for icons
- **react-dropzone** + **browser-image-compression** for uploads
- **Server Actions** for all mutations
- `proxy.ts` (Next 16 renamed `middleware.ts`) for route protection

### Backend
- **Supabase** Postgres + Auth + Storage
- 3 SQL migrations checked in: schema, RLS, storage policies (`admin-next/supabase/migrations/`)

---

## 3. Local development

You'll have two terminals running.

```bash
# Terminal 1 — static site (port 3000)
cd /Users/gitay/Desktop/Gitay-Gold
node server.js

# Terminal 2 — admin (port 3001, auto-opens with --turbopack)
cd /Users/gitay/Desktop/Gitay-Gold/admin-next
npm run dev
```

| URL | What it is |
|---|---|
| http://localhost:3000 | Static homepage |
| http://localhost:3000/case-study.html#luminary-brand-web | Case-study page |
| http://localhost:3000/admin | 410 Gone (legacy) — redirects you to localhost:3001 |
| http://localhost:3001/login | Admin login |
| http://localhost:3001/admin/dashboard | Admin home (after login) |

### First-time setup (already done in Phases 1-2 — for reference)
1. `cd admin-next && npm install`
2. Copy `admin-next/.env.example` → `admin-next/.env.local`, fill in Supabase URL + anon key.
3. Run the three SQL migrations in Supabase SQL Editor (in order: 001 schema, 002 RLS, 003 storage). See [admin-next/supabase/migrations/](admin-next/supabase/migrations/).
4. Create the `project-images` storage bucket in the Supabase dashboard.
5. Configure Google OAuth in Google Cloud Console + Supabase Auth.
6. Sign up at `localhost:3001/signup` → promote yourself: `update public.profiles set role='admin' where email='YOU';`

Full Phase 1 setup notes live in [admin-next/README.md](admin-next/README.md).

---

## 4. Deploy to production

See [PHASE_3_DEPLOY.md](PHASE_3_DEPLOY.md) for the full step-by-step. TL;DR:

1. Push to GitHub.
2. **Vercel project A** — static site, Root Directory `./`, Framework `Other`, no env vars.
3. **Vercel project B** — admin, Root Directory `admin-next`, Framework auto-detects Next.js, env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Update Supabase Auth → URL Configuration: Site URL + Redirect URLs allow-list.
5. Update Google OAuth → Authorized JavaScript origins.

Subsequent deploys: just `git push origin main`. Both Vercel projects auto-deploy.

---

## 5. How to add a new project (the daily workflow)

1. Open `https://admin.gitaygold.com/admin/projects/new` (or the local equivalent).
2. **Basic info** tab — title, slug (auto-generates), client, year, category, tags, short description.
3. **Media** tab — drag a hero image onto the dropzone, then a thumbnail. Both auto-compress to WebP at ≤85% quality, client-side, before upload to Supabase Storage.
4. **The Story** tab — paragraphs for Challenge / Solution / Results, then add up to 8 KPI rows.
5. **Publishing & SEO** — toggle Featured if it should pin to the top of the public Recent Wins grid.
6. Click **Publish** at the bottom of the page.
7. Wait up to 5 minutes (sessionStorage cache TTL), or hit **Shift-Reload** on the public site — the new project appears in the work grid and at `/case-study/{slug}`.

To unpublish: edit → Publishing tab → flip status to Draft → click "Save changes". Within 5 minutes / a hard reload, it's gone from the public site.

---

## 6. File structure (annotated)

```
Gitay-Gold/
├── index.html                    # Homepage (static)
├── case-study.html               # Project detail page (slug via hash or ?slug=)
├── style.css, case-study.css     # Brand styles
├── script.js                     # Homepage interactions (loading, GSAP, Three.js, work grid)
├── case-study.js                 # Case-study renderer + animations
├── cms-api.js                    # Public Supabase reader (drop-in replacement for legacy cms.js)
├── config.js                     # Public Supabase URL + anon key + admin URL (auto-host)
├── config.example.js             # Template for new contributors
├── server.js                     # Local dev HTTP server (port 3000) + 410 Gone for /admin*
├── vercel.json                   # Static-site Vercel config (cleanUrls, rewrites, redirects, headers)
├── migrate-to-supabase.html      # ONE-OFF tool used in Phase 3 to migrate localStorage data
├── PHASE_3_DEPLOY.md             # Deploy-day runbook (this is the manual one)
├── FINAL_README.md               # ← you are here
│
├── legacy/                       # Archived from Phase 3
│   ├── README.md                 # What's archived + how to revive
│   ├── admin.html, admin.css, admin.js   # Old localStorage admin
│   └── cms.js                    # Old localStorage CMS
│
└── admin-next/                   # The Next.js admin (Vercel project B)
    ├── app/
    │   ├── layout.tsx, page.tsx, globals.css
    │   ├── login/, signup/, auth/callback/
    │   └── admin/
    │       ├── layout.tsx        # Server-side auth + role gate (defense in depth)
    │       ├── actions.ts        # signOutAction
    │       ├── dashboard/        # Stats + recent activity
    │       ├── projects/         # List + new + [id]/edit
    │       ├── inquiries/        # Phase 4 placeholder
    │       └── settings/         # Read-only profile, sign-out, prefs
    ├── components/
    │   ├── admin/                # Sidebar, top bar, project form + cards + image upload
    │   ├── auth/                 # Login/signup/Google buttons
    │   ├── icons/                # GoogleIcon
    │   └── ui/                   # shadcn primitives
    ├── lib/
    │   ├── supabase/             # client/server/middleware + Database type
    │   ├── validation/           # Zod schemas for auth + project
    │   ├── constants/categories.ts
    │   ├── slug.ts               # Slugify helper
    │   └── utils.ts              # cn()
    ├── proxy.ts                  # Next 16 renamed middleware (route protection)
    ├── middleware.ts (none)      # ← intentional: file is `proxy.ts` in Next 16
    ├── supabase/migrations/      # 001 schema, 002 RLS, 003 storage
    └── README.md                 # Phase 1 setup details (env vars, Supabase config)
```

---

## 7. Caching model

| Layer | TTL | Headers |
|---|---|---|
| Static site HTML | 0 (always revalidate) | Vercel default |
| Static site JS / CSS | 10 minutes | `public, max-age=600, must-revalidate` (vercel.json) |
| Static site images / fonts | 1 day | `public, max-age=86400` (vercel.json) |
| `cms-api.js` data | 5 minutes | sessionStorage, per-tab (cms-api.js) |
| Supabase Storage images | 1 year | `cacheControl: 31536000` (set by image-upload.tsx) |
| Admin pages | dynamic | Server-rendered, no cache (default Next 16) |

Why these specific values: HTML and JS shouldn't outlive a typo fix; assets that don't change don't need to be re-fetched. The 5-minute sessionStorage TTL on data is short enough that a publish is usually visible without a hard reload.

---

## 8. Phase 4 ideas (next moves, in rough priority order)

| Track | Items |
|---|---|
| **Inquiries inbox** | Public contact-form Server Action with rate-limit + spam check. New `inquiries` table + RLS. Real triage UI on `/admin/inquiries` replacing the placeholder. Email notifications on new submissions. CSV export. |
| **Block editor** | Drag-to-reorder rich blocks (text · image · quote · list · embed) replacing the free-form Story textareas. Same `blocks jsonb` column already in the schema — just adds a UI for it. |
| **Storage cleanup** | Scheduled function that diffs `projects.{hero_image_url, thumbnail_url, gallery, blocks}` against the `project-images/` bucket and deletes files nothing references. (Today, "replace image" leaves orphans by design.) |
| **Display order drag-and-drop** | `display_order` is already in the schema — just needs a `dnd-kit` integration on the projects list. Optimistic via `useOptimistic`. |
| **Bulk actions** | Multi-select with checkboxes (the shadcn checkbox is already installed). Bulk publish / unpublish / feature / delete. |
| **Profile editing + dark mode** | Editable name + avatar (uploads to a separate `avatars/` bucket). Light/dark theme toggle via `next-themes`. |
| **Schema typing** | Run `supabase gen types typescript` to replace the hand-typed `Database` interface and remove the `as never` casts in `admin-next/app/admin/projects/actions.ts`. |
| **CI / observability** | GitHub Actions running `npm run typecheck` + `npm run build` on every PR. Sentry for client errors. Playwright E2E for the create → edit → delete journey. |
| **Static-site upgrades** | Service worker for offline. Real Open Graph + Twitter Card images per case-study. JSON-LD structured data. RSS feed for new projects. |
| **i18n** | The static site already has Hebrew copy in some places (a leftover from earlier phases). A real RTL toggle + per-locale routing if there's ever a Hebrew audience. |

Each line could be its own batch. Pick the one that hurts most or sparks most joy first.

---

## 9. Troubleshooting

**Static site shows empty work grid in production but works locally**
- Open DevTools Network. If the Supabase fetch returns `[]`, your projects are still drafts → publish them in the admin.
- If the fetch fails with CORS, your Supabase project's CORS allowlist doesn't include the prod origin → Supabase → Settings → API → add origin.

**Admin login OAuth says "redirect_to is not allowed"**
- Supabase → Authentication → URL Configuration → Redirect URLs: add `https://admin.gitaygold.com/**` (with the wildcards).

**Admin builds locally but fails on Vercel**
- Did you set Root Directory to `admin-next` on the Vercel admin project? If it's `./`, Vercel tries to build from the static-site root (no `package.json` there) and fails.

**`SUPABASE_SERVICE_ROLE_KEY` is leaking somewhere**
- It is god-mode for your DB. **Rotate immediately**: Supabase → Settings → API → "Roll service_role key". Update Vercel env vars + your local `admin-next/.env.local`. Audit git history with `git log --all -p | grep -i service_role`.

**Vercel preview deploys' admin link goes to localhost**
- That's by design — see `config.js`'s `__ADMIN_URL__` auto-detect. Previews don't have a paired admin deploy. If you want preview admin too, add a domain mapping for `*.vercel.app` previews in `config.js` (and live with the hostname guessing complexity).

---

## License

Personal portfolio. Ask before reusing.

— Gitay Gold, 2026
