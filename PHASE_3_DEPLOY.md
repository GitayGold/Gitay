# Phase 3 — Production Deploy Runbook

This is a **manual click-through guide**. Follow it top-to-bottom; each section ends with a verification step. No commands run automatically — everything is on you.

> Why this is a manual runbook: production deploys touch shared infrastructure (DNS, OAuth providers, Supabase Auth config). Walking through it once teaches you what each piece does. After the first deploy, redeploys are a single `git push`.

---

## 0. Pre-flight checklist

Before you start, gather these in one tab each:

- [ ] **GitHub** account, with the Gitay-Gold repo pushed (we'll do this in §1).
- [ ] **Vercel** account, signed in with the same GitHub identity (so it can read the repo). Free tier is plenty.
- [ ] **Supabase** dashboard open at your project's API page (Settings → API). Copy the **Project URL** + **anon public** key. The **service_role** key is needed too (for the admin's env vars), but **never** committed.
- [ ] **Google Cloud Console** open at the OAuth client you set up in Phase 1 (APIs & Services → Credentials → your OAuth 2.0 Client ID).
- [ ] **Domain** ready, if you're using a custom one (`gitaygold.com`). Skipping the custom domain is fine — Vercel gives you a `*.vercel.app` URL out of the box; come back here when you buy the domain.

You'll be touching three providers in this order: **GitHub → Vercel → Supabase + Google**.

---

## 1. Push the code to GitHub

If your repo isn't on GitHub yet, this is the moment.

```bash
cd /Users/gitay/Desktop/Gitay-Gold

# 1a. Make sure no secrets are about to leak.
# admin-next/.env.local is gitignored already; double-check.
git check-ignore admin-next/.env.local && echo "OK: .env.local is gitignored"

# 1b. Stage everything (skip the ignored ones).
git add -A
git status

# 1c. Inspect the diff. Pay attention to: nothing under admin-next/.env.local,
# nothing that looks like a SUPABASE_SERVICE_ROLE_KEY.
git diff --cached | head -60

# 1d. Commit and push.
git commit -m "Phase 3: public bridge + Vercel deploy config"
git remote -v   # confirm 'origin' points at the right GitHub repo
git push origin main
```

> **What's safe to commit publicly:**
> - `config.js` (yes — anon key is RLS-protected, see comments in the file).
> - `admin-next/.env.example` (template only).
> - `migrate-to-supabase.html` (it has no secrets — it asks for the service-role key at runtime; never persists it).
>
> **What is NOT safe to commit:**
> - `admin-next/.env.local` (real keys; already gitignored).
> - The literal value of `SUPABASE_SERVICE_ROLE_KEY` anywhere.

**Verify**: open your repo on github.com. You should see `cms-api.js`, `config.js`, `vercel.json`, the `legacy/` folder, and the `admin-next/` folder. You should NOT see any `.env.local`.

---

## 2. Deploy the static site (Project A)

Why a separate Vercel project: the static site has no build step, no framework. The admin is a Next.js app with TypeScript, Tailwind, and Supabase env vars. Mixing them in one project means weird build configs and cross-pollution. Two Vercel projects = two clean configs, two independent deploy logs, two URLs that share nothing but the GitHub repo.

### 2a. Import the repo

1. Go to **vercel.com/new** → "Import Git Repository" → pick your GitHub repo.
2. Vercel asks for "Configure Project" settings:
   - **Project name**: `gitaygold` (or whatever you want — this becomes `gitaygold.vercel.app`).
   - **Framework Preset**: **Other** (Vercel might auto-suggest something — override to **Other**).
   - **Root Directory**: `./` (the repo root). **Important** — leave it as the root, not `admin-next`.
   - **Build & Output Settings**: leave all blank. There is no build step. Vercel will publish the directory as static.
   - **Environment Variables**: none required for the static site. (`config.js` is committed.)

3. Click **Deploy**.

The first build takes ~30-60 seconds. When it's done, click **Visit** — you should see the homepage.

### 2b. Smoke-test

| Check | What you should see |
|---|---|
| Homepage at `<project>.vercel.app/` | Loading screen → projects appear (the same 3 you migrated) |
| `/case-study/luminary-brand-web` | Pretty URL works thanks to `vercel.json` rewrites |
| `/case-study.html#luminary-brand-web` | Old hash URL still works |
| `/admin` | 307 redirect to `https://admin.gitaygold.com/admin/dashboard` (it'll 404 in this hop because we haven't deployed the admin yet — fine) |
| DevTools Console | No errors. The work-grid fetch hits `*.supabase.co/rest/v1/projects` and returns the published rows |

> **What `vercel.json` does:** declares clean URLs, the case-study rewrite, the legacy `/admin*` redirect to the admin subdomain, cache headers, and a few security headers. It's the only deploy-time config — there's no `package.json` at the root, so Vercel just publishes static files.

### 2c. Add the production domain (optional, do this after §3 if you want both apps on the same brand domain)

1. Vercel project → **Settings → Domains**.
2. Type `gitaygold.com` → Add. Vercel shows you DNS records to set at your registrar (one A record, plus `www` as CNAME or another A).
3. Add the records at your domain registrar (Namecheap / Google Domains / Cloudflare / etc.). Wait 1-30 min for DNS to propagate.
4. Vercel will auto-issue a Let's Encrypt cert once DNS resolves to its IP.

**Verify**: `https://gitaygold.com` shows the static site, with a green padlock.

---

## 3. Deploy the admin (Project B)

A second Vercel project, pointing at the **same GitHub repo** but a **different root directory**.

### 3a. Import (again)

1. **vercel.com/new** → import the same repo → "Configure Project":
   - **Project name**: `gitaygold-admin` (anything you like).
   - **Framework Preset**: Vercel will auto-detect **Next.js** once you point it at the right directory.
   - **Root Directory**: click **Edit** and set to **`admin-next`**. This is the critical step — without it Vercel tries to build from the repo root and fails.
   - **Build & Output Settings**: defaults are fine. Next.js 16 with Turbopack.

2. Open **Environment Variables** (still on the Configure screen):

   Add these for **Production** AND **Preview** (click each scope):

   | Name | Value | Notes |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://mdzfliihqdjqhnqxskzm.supabase.co` | Same as `admin-next/.env.local`. Public — exposed to the browser. |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the long `eyJ...` from Supabase Settings → API | Public — RLS-protected. |
   | `SUPABASE_SERVICE_ROLE_KEY` | the *other* `eyJ...` (service_role) from Supabase Settings → API | **Server-only**. NEVER prefix with `NEXT_PUBLIC_`. Reserved for Phase 4 features but worth setting now so the rotation is one-step. |

   > **Why the `NEXT_PUBLIC_` prefix matters:** Next.js inlines these env vars into the client bundle. The prefix is opt-in: any var without it stays server-only (Server Components, Route Handlers, Server Actions). The service-role key is god-mode for the database — keeping it unprefixed means it can never be reached by browser code. If you accidentally rename it to `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`, your service-role auth becomes public and an attacker can do anything to your DB. Don't.

3. Click **Deploy**. Build takes ~1-2 minutes (Tailwind 4 + shadcn + the whole Next stack).

### 3b. First-deploy smoke-test (without OAuth/Supabase config yet)

| Check | What you should see |
|---|---|
| `<admin-project>.vercel.app/` | Redirects to `/login` (you're not signed in yet) |
| `<admin-project>.vercel.app/login` | The login form renders. |
| Click "Sign in with Google" | Will fail at this point — we haven't added the prod URL to OAuth/Supabase yet. **Stop here**, move to §4. |

### 3c. Add the production domain (recommended)

1. Vercel project → **Settings → Domains** → add `admin.gitaygold.com`.
2. At your registrar, add a CNAME for `admin` → `cname.vercel-dns.com`.
3. Wait for DNS + cert.

**Verify**: `https://admin.gitaygold.com` opens the login page over HTTPS.

---

## 4. Update Supabase Auth URL config

Until you tell Supabase about the new domain, every login attempt from production will fail with `redirect_to is not allowed`.

1. **Supabase Dashboard → Authentication → URL Configuration**.
2. **Site URL**: change from `http://localhost:3001` to:
   ```
   https://admin.gitaygold.com
   ```
   (Or, if you skipped the custom domain in §3c, use the Vercel URL: `https://<admin-project>.vercel.app`.)

3. **Redirect URLs (allow-list)** — click "Add URL" for each:
   ```
   https://admin.gitaygold.com/**
   http://localhost:3001/**
   ```
   (Wildcards matter. The `**` lets Supabase post-OAuth redirect to any path under that origin, including `/auth/callback?code=...&next=/admin/dashboard`.)

4. Save.

> **Why two entries:** keeping `localhost:3001` lets you keep doing `npm run dev` against the SAME Supabase project. Pull the prod URL out only when you decommission local development.
>
> **Why we change Site URL:** Supabase uses it as the base for email-confirmation links and password-reset links. If it points at `localhost:3001` while real users sign up at `admin.gitaygold.com`, their confirm links would 404 in their inbox.

---

## 5. Update Google OAuth client

Same problem on the Google side: the OAuth client only knows about `localhost:3001` as a JavaScript origin. The Supabase callback URL stays the same (it's a Supabase-side endpoint), but the *origin* of the page that triggered the OAuth flow has to be on the allow-list.

1. **Google Cloud Console → APIs & Services → Credentials → your OAuth 2.0 Client ID**.
2. **Authorized JavaScript origins** — add:
   ```
   https://admin.gitaygold.com
   ```
   (Keep `http://localhost:3001` for local dev.)

3. **Authorized redirect URIs** — verify the Supabase callback is still listed:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   (No change needed; Supabase's callback URL doesn't change with your front-end domain. If it's missing, add it now.)

4. Click **Save**. Google says "changes can take 5 minutes to a few hours to propagate" — usually it's instant, occasionally 5-10 min.

> **Wait — three URLs, three different roles:**
> - **JavaScript origins** (Google) = where the OAuth dance starts. The user clicks "Continue with Google" *on this domain*.
> - **Authorized redirect URIs** (Google) = where Google sends the user back with the code. We point this at *Supabase's* callback, not our app's, because Supabase brokers the token exchange.
> - **Site URL + Redirect URLs** (Supabase) = where Supabase sends the user back AFTER it has the session, when our `/auth/callback` route hands them off to `/admin/dashboard`.

---

## 6. Production verification

End-to-end test in this exact order. If anything fails, the failure tells you which step in §4-§5 was missed.

### 6a. Static site

- [ ] `https://gitaygold.com` (or `<project>.vercel.app`) — homepage, projects load, animations smooth.
- [ ] Open DevTools **Network** — see exactly one fetch to `*.supabase.co/rest/v1/projects?select=*&status=eq.published&...`. Headers show `apikey: eyJ...` (anon).
- [ ] Refresh — no second network call. (sessionStorage cache hit.)
- [ ] **Console** — clean. If you see CORS errors, your Supabase project blocks the prod origin — go to Supabase → Settings → API → CORS allowlist and add the prod origin.
- [ ] Click any project card → case-study page renders fully.
- [ ] Hit `https://gitaygold.com/case-study/luminary-brand-web` directly — Vercel rewrites it.
- [ ] Hit `https://gitaygold.com/admin` — 307 to admin subdomain.

### 6b. Admin

- [ ] `https://admin.gitaygold.com` (or `<admin-project>.vercel.app`) — redirects to `/login`.
- [ ] Sign in with email/password (or Google OAuth, after §5 is saved).
- [ ] Lands on `/admin/dashboard` if your account has `role='admin'` in `profiles`. Otherwise lands on `/?error=not_admin` — which is the right behavior.
- [ ] If you accidentally have a viewer-role account, run in Supabase SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'YOUR_EMAIL';
   ```
   Then refresh.
- [ ] Open `/admin/projects` → you see the 3 migrated projects.
- [ ] Edit one (just tweak the title), click **Update** → toast confirms, list shows the new title.

### 6c. Cross-origin sanity

- [ ] On `https://gitaygold.com`, click the footer "Admin" link. It points to `https://admin.gitaygold.com` (the auto-detect in `config.js` is firing).
- [ ] Sign in to admin, edit a project, change its status to `draft`.
- [ ] Hard-reload (`Shift-Reload`) `https://gitaygold.com` — that project is gone from the homepage. Reset its status to `published` to bring it back.

If all of 6a-6c passes, you're shipped. 🚀

---

## 7. Common pitfalls

| Symptom | Likely cause | Fix |
|---|---|---|
| `redirect_to is not allowed` on OAuth callback | Prod URL missing from Supabase **Redirect URLs** allow-list | §4, item 3 |
| Email confirmation links go to localhost | Supabase **Site URL** still set to `localhost:3001` | §4, item 2 |
| `Sign in with Google` instantly errors | Google OAuth **JavaScript origins** doesn't include the prod URL | §5, item 2 |
| Console: `Access to fetch at 'https://...supabase.co...' has been blocked by CORS` | Supabase project's CORS allow-list doesn't include the prod origin (rare with default Supabase config — usually only happens on custom domains) | Supabase → Settings → API → add origin |
| Static site renders but work grid is empty | Network tab shows 200 with `[]` (empty array) — RLS is hiding everything | All your projects are still drafts. Open `/admin/projects/[id]/edit` for one and click Publish. |
| Admin shows "No admin access" card | Your account exists but `profiles.role = 'viewer'` | `update public.profiles set role='admin' where email=...` |
| Vercel build fails with `Cannot find module 'next'` | Root Directory was left as `./` for the admin project | §3a — set Root Directory to `admin-next` |
| `SUPABASE_SERVICE_ROLE_KEY` missing in Vercel | You forgot to add it (Phase 4 will need it) | Vercel → admin project → Settings → Environment Variables |
| Service-role key was accidentally added with `NEXT_PUBLIC_` prefix | You exposed god-mode to the browser. **Rotate it immediately**: Supabase → Settings → API → Roll service_role key. Then re-add to Vercel without the prefix. | — |

---

## 8. After deploy

- **Delete `migrate-to-supabase.html`** — you've already used it. It can stay in the repo; it has no secrets and won't run unless someone gives it the service-role key. But removing it is tidy. `git rm migrate-to-supabase.html && git commit && git push` will trigger a redeploy that drops it from production.
- **Decide on `serve.json`** — superseded by `vercel.json`. You can `git rm` it.
- **Future content updates** — open `https://admin.gitaygold.com/admin/projects/new`, fill in fields, click Publish. The static site picks it up within 5 minutes (sessionStorage TTL) or immediately on a hard reload.
- **Future code updates** — `git push` to the `main` branch on GitHub. Both Vercel projects auto-deploy.

That's it. You shipped a hand-built portfolio + a real admin + a public-read bridge to a typed Postgres backend, all on free-tier infrastructure. 🥇
