# Gitay Gold — Admin (Phase 1)

A Next.js 16 admin app for the Gitay Gold portfolio. Phase 1 is the
**foundation**: Supabase auth, database schema, storage, route
protection, and a placeholder dashboard. The full project editor
arrives in Phase 2.

The static site (homepage + case-study pages) keeps running unchanged
on port `:3000` via the project's existing Node server. This admin
app runs on port `:3001`.

---

## Stack

- **Next.js 16** App Router (Turbopack default; `proxy.ts` instead of `middleware.ts`)
- **TypeScript** (strict)
- **Tailwind CSS 4** + **shadcn/ui**
- **Supabase** (Auth · Postgres · Storage) via `@supabase/ssr`
- **React Hook Form** + **Zod 4** for forms
- **Sonner** for toasts
- **Framer Motion** for entrance animations
- **Lucide** icons

---

## Prerequisites

- Node.js **20.9+** (Next 16 requires it)
- A Supabase project (any region)
- A Google Cloud OAuth client for "Continue with Google"

---

## Setup

### 1. Install

```bash
cd admin-next
npm install
```

### 2. Database & Storage in Supabase

Run the SQL files in this order in **Supabase Dashboard → SQL Editor**:

| Order | File | Purpose |
|---|---|---|
| 1 | [`supabase/migrations/001_schema.sql`](supabase/migrations/001_schema.sql) | Tables, enums, triggers, indexes |
| 2 | [`supabase/migrations/002_rls.sql`](supabase/migrations/002_rls.sql) | Row Level Security policies |
| 3 | [`supabase/migrations/003_storage.sql`](supabase/migrations/003_storage.sql) | Storage bucket policies (run AFTER step 2.1 below) |

Then in **Supabase Dashboard → Storage**:

2.1. Create a bucket:
- **Name:** `project-images`
- **Public bucket:** ✓ on
- **File size limit:** `5 MB`
- **Allowed MIME types:** `image/jpeg, image/png, image/webp, image/avif`

### 3. Google OAuth

**Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID** (Web application):

- **Authorized JavaScript origins:** `http://localhost:3001`
- **Authorized redirect URIs:** `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`

Then in **Supabase Dashboard → Authentication → Providers → Google**:

- Enable
- Paste the **Client ID** and **Client Secret**
- Save

In **Supabase → Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3001`
- **Redirect URLs:** add `http://localhost:3001/**`

### 4. Environment variables

Copy `.env.example` to `.env.local` and fill in the two `NEXT_PUBLIC_*` values from
**Supabase → Project Settings → API**:

```bash
cp .env.example .env.local
# then edit .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

The `SUPABASE_SERVICE_ROLE_KEY` line stays commented for now. Phase 2's Server Actions will need it.

### 5. Run

```bash
npm run dev          # http://localhost:3001
```

Sign up at **`/signup`**, then promote yourself to admin. In **Supabase → SQL Editor**:

```sql
update public.profiles
set role = 'admin'
where email = 'YOUR_EMAIL_HERE';
```

Reload `/admin/dashboard` — you should see the welcome card with your name + role.

---

## Verify it works (Phase 1 checklist)

- [ ] `npm run typecheck` passes (zero errors).
- [ ] `npm run build` completes.
- [ ] `npm run dev` boots on `:3001`.
- [ ] `http://localhost:3001/admin/dashboard` redirects to `/login?redirect=/admin/dashboard` while signed out.
- [ ] Email signup creates a row in `public.profiles` with `role = 'viewer'`.
- [ ] `http://localhost:3001/admin/dashboard` as a viewer redirects to `/?error=not_admin`.
- [ ] After the `update profiles set role='admin'` SQL, the dashboard renders.
- [ ] Google OAuth completes and lands on `/admin/dashboard` (after admin promotion).
- [ ] Logout returns to `/login` and clears the session cookie.

---

## ⚠️ Production deploy notes

When the admin app is deployed (e.g., to `https://admin.gitaygold.com` on Vercel),
Supabase tokens issued for `localhost` will not work for the prod domain and
vice-versa. Five places must be updated:

| Where | What to set | Example |
|---|---|---|
| **Google Cloud Console** → Credentials → OAuth client → Authorized JavaScript origins | Add the prod origin (keep `http://localhost:3001` for local dev) | `https://admin.gitaygold.com` |
| **Google Cloud Console** → Credentials → OAuth client → Authorized redirect URIs | Stays the same — the Supabase callback always points to your project ref. Verify it is still `https://<ref>.supabase.co/auth/v1/callback`. | unchanged |
| **Supabase** → Authentication → URL Configuration → Site URL | Prod admin domain. Used for email-confirmation redirect + OAuth post-auth redirect. | `https://admin.gitaygold.com` |
| **Supabase** → Authentication → URL Configuration → Redirect URLs (allow-list) | Add the prod origin so Supabase accepts redirects to it. | `https://admin.gitaygold.com/**` |
| **Vercel** → Project → Settings → Environment Variables | `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for `Production` (and `Preview`). In Phase 2, also `SUPABASE_SERVICE_ROLE_KEY` (server-only, **never** prefix with `NEXT_PUBLIC_`). | — |

### Common pitfalls

- **Missing the prod URL in the Redirect URLs allow-list** → OAuth completes but Supabase refuses the redirect with `redirect_to is not allowed`.
- **Site URL still set to `localhost`** → email-confirmation links land on `localhost` in production and break for real users.
- **Exposing the service-role key to the browser** → it's a master key that bypasses RLS. Never prefix with `NEXT_PUBLIC_`. Only consume it inside Server Actions / Route Handlers / proxy.

---

## Project structure

```
admin-next/
├── app/
│   ├── layout.tsx                  ← global layout + Sonner Toaster
│   ├── page.tsx                    ← public root: redirects to /login or /admin
│   ├── login/                      ← /login page + inline error banner
│   ├── signup/                     ← /signup page
│   ├── auth/callback/route.ts      ← OAuth code exchange
│   └── admin/
│       ├── layout.tsx              ← server-side auth + role gate (defense in depth)
│       ├── actions.ts              ← signOutAction (Server Action)
│       └── dashboard/page.tsx      ← Phase 1 placeholder
├── components/
│   ├── ui/                         ← shadcn primitives
│   ├── auth/
│   │   ├── login-form.tsx          ← RHF + Zod
│   │   ├── signup-form.tsx         ← RHF + Zod + password strength
│   │   ├── google-button.tsx       ← OAuth trigger
│   │   └── password-strength.tsx   ← visual indicator
│   └── icons/google.tsx            ← Google "G" mark
├── lib/
│   ├── supabase/
│   │   ├── client.ts               ← createBrowserClient (Client Components)
│   │   ├── server.ts               ← createServerClient (Server Components / Actions)
│   │   ├── middleware.ts           ← updateSession() helper called by proxy
│   │   └── types.ts                ← Profile, Project, enums
│   ├── validation/auth.ts          ← Zod schemas + password scorer
│   └── utils.ts                    ← shadcn `cn()`
├── proxy.ts                        ← Next 16 renamed middleware (route protection)
├── supabase/migrations/            ← 001_schema, 002_rls, 003_storage SQL
├── .env.example                    ← committed template
└── .env.local                      ← gitignored (your secrets)
```

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on `:3001` (Turbopack default in Next 16) |
| `npm run build` | Production build |
| `npm run start` | Run the production build on `:3001` |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` — strict type check |

---

## Roadmap

### Phase 1 — *this release* ✓
- Supabase clients (browser / server / proxy helper)
- Database schema (`profiles`, `projects` with `blocks` + `kpis` jsonb)
- RLS policies (published projects public; admin-only writes)
- Storage bucket + policies
- Login / Signup / Google OAuth
- `/auth/callback` route handler
- `proxy.ts` route protection
- Placeholder dashboard

### Phase 2 — *next*
- Project list / search / filter
- Project editor: title, client, year, category, tags, hero image, thumbnail, gallery, blocks (text/image/quote/list), KPIs, SEO
- Image upload to `project-images` Storage bucket
- Draft → Published flow
- Display order drag-and-drop
- Server Actions using `SUPABASE_SERVICE_ROLE_KEY`

### Phase 3 — *static-site bridge*
- `cms-api.js` shim that mirrors the legacy `cms.js` API but reads from Supabase REST
- One-time migration script (legacy `localStorage` → Supabase)
- Repoint `index.html` and `case-study.html` to the new shim
- Retire `admin.html`, `admin.js`, `admin.css`, and the legacy `cms.js`

---

## Why these specific choices?

- **`@supabase/ssr` (not `@supabase/auth-helpers-nextjs`)** — the helpers package is deprecated. `@supabase/ssr` is the official, cookie-aware SSR client.
- **`proxy.ts` (not `middleware.ts`)** — Next 16 deprecated the `middleware` filename. The runtime is now `nodejs` (the `edge` runtime is no longer supported here).
- **`await cookies()`** — Next 16 made all request-time APIs async. Calling `cookies()` synchronously will throw at runtime.
- **Defense in depth** — both `proxy.ts` *and* `app/admin/layout.tsx` re-verify auth + role. The proxy is fast (cookie read), the layout calls `getUser()` which round-trips to Supabase to validate the JWT.
- **`blocks` + `kpis` as `jsonb`** — preserves the structured content shape from the legacy `cms.js` so a future Phase 3 migration can copy data 1:1 without transformation.
- **Short category slugs** (`web`, `ecommerce`, …) — match the existing static-site enum so the future Supabase-backed read layer needs no slug translation.
