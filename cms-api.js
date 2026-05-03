/* ═══════════════════════════════════════════════════════════════════
   Gitay Gold — Public CMS reader
   Drop-in replacement for cms.js. Reads from Supabase via the anon REST
   endpoint instead of localStorage. RLS only returns published rows for
   anonymous callers, so this layer has no business logic — it just
   fetches, maps shape, and caches.
   ═══════════════════════════════════════════════════════════════════

   Why a separate file (vs editing cms.js):
   - cms.js stays frozen in /legacy/ as a snapshot of the old behavior.
   - The localStorage seed-defaults logic doesn't belong on a network
     reader; cleaner to make it a new file than to refactor in place.
   - Trivial A/B if needed: swap one <script> tag back.

   Why fetch from Supabase (vs a static JSON build):
   - Publishing in the admin should reflect on the public site within
     minutes (the sessionStorage TTL), not require a redeploy.
   - The static site has no build step. A live REST read keeps it that
     way: edit content in the admin, refresh the homepage, see it.

   Why sessionStorage cache (5-min TTL):
   - Saves the round-trip on every internal navigation within a session.
   - Per-tab isolation is the right granularity here — different tabs
     might be hitting different Supabase projects (e.g., a future preview
     env), and sessionStorage doesn't share across tabs.
   - 5 minutes is long enough to feel snappy, short enough that
     publishing is observable without a hard reload most of the time.
   ─────────────────────────────────────────────────────────────────── */

(() => {
  'use strict';

  /* ── Config (read once at module-init from window.__SUPABASE__) ──── */
  const cfg = (typeof window !== 'undefined' && window.__SUPABASE__) || null;
  if (!cfg || !cfg.url || !cfg.anonKey) {
    console.error(
      '[cms-api] Missing Supabase config. Make sure config.js is loaded BEFORE cms-api.js.',
    );
  }

  const SUPABASE_URL = cfg ? cfg.url.replace(/\/$/, '') : '';
  const SUPABASE_KEY = cfg ? cfg.anonKey : '';

  /* ── Cache plumbing ────────────────────────────────────────────── */
  const CACHE_KEY = 'cms_api_cache_v1';
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — see header comment

  /** In-memory store, populated by hydrateFromCache() then by fetchAll().
      All synchronous getters read from here. */
  let store = [];

  /** Promise that resolves when the FIRST fetch completes (success OR
      failure — the page should always render something). Subsequent
      fetches don't reset this. */
  let readyResolve;
  const ready = new Promise((res) => (readyResolve = res));
  let kicked = false;

  /* ── CATEGORIES — identical to legacy cms.js ─────────────────────── */
  const CATEGORIES = {
    web:       'Web Development',
    ecommerce: 'E-Commerce',
    branding:  'Branding',
    ux:        'UX / Product',
    motion:    'Motion & Video',
    ai:        'AI & Automation',
    landing:   'Landing Page',
  };

  /* ── slugify — identical helper, kept so callers that import it work ─ */
  function slugify(str) {
    return String(str ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /* ── Mapping: Supabase row → legacy cms.js shape ──────────────────
     The static site's render code reads camelCase fields (p.thumbnail,
     p.heroImage, p.shortDesc, p.date, etc.). We translate once here so
     script.js / case-study.js don't need any field-name changes. */
  function toLegacy(row) {
    return {
      id:          row.id,                                    // uuid (was base36 — neither parses it)
      slug:        row.slug,
      title:       row.title,
      client:      row.client,
      // year (int) → date (string). The static site renders `p.date`
      // verbatim; an integer would render as "2025" too, but coercing
      // here keeps consumers honest about the type.
      date:        row.year != null ? String(row.year) : '',
      category:    row.category,
      tags:        Array.isArray(row.tags) ? row.tags : [],
      thumbnail:   row.thumbnail_url   || '',
      heroImage:   row.hero_image_url  || '',
      shortDesc:   row.short_description || '',
      challenge:   row.the_challenge   || '',
      solution:    row.the_solution    || '',
      results:     row.results         || '',
      kpis:        Array.isArray(row.kpis)   ? row.kpis   : [],
      blocks:      Array.isArray(row.blocks) ? row.blocks : [],
      liveUrl:     row.live_url || '',
      featured:    !!row.featured,
      // Public anon only sees status='published' rows (RLS), so visible
      // is always true here. Kept for backward compat with case-study.js
      // which checks `project.visible === false` for 404 fallback.
      visible:     row.status === 'published',
      createdAt:   row.created_at ? Date.parse(row.created_at) : Date.now(),
    };
  }

  /* ── sessionStorage hydration (synchronous, runs before fetch) ──── */
  function hydrateFromCache() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return false;
      const { cachedAt, data } = JSON.parse(raw);
      if (typeof cachedAt !== 'number' || !Array.isArray(data)) return false;
      if (Date.now() - cachedAt > CACHE_TTL_MS) return false;
      store = data;
      return true;
    } catch {
      // Cache is corrupt or sessionStorage is blocked — drop it silently.
      try { sessionStorage.removeItem(CACHE_KEY); } catch { /* noop */ }
      return false;
    }
  }

  function writeCache() {
    try {
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ cachedAt: Date.now(), data: store }),
      );
    } catch {
      // sessionStorage may be disabled (private mode on some browsers).
      // It's fine — we just lose the cross-navigation cache.
    }
  }

  /* ── Network read ─────────────────────────────────────────────── */
  async function fetchAll() {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('Supabase config missing');
    }

    // Order: featured first, then by display_order, then most-recently updated.
    // The status=eq.published filter is defense-in-depth — RLS already
    // hides drafts from the anon role.
    const url =
      `${SUPABASE_URL}/rest/v1/projects` +
      '?select=*' +
      '&status=eq.published' +
      '&order=featured.desc,display_order.asc,updated_at.desc';

    const resp = await fetch(url, {
      headers: {
        'apikey':        SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Accept':        'application/json',
      },
      // Default same-origin credentials = 'omit' for cross-origin —
      // we want NO cookies on this read.
    });

    if (!resp.ok) {
      throw new Error(`Supabase ${resp.status}: ${await resp.text().catch(() => '')}`);
    }

    const rows = await resp.json();
    if (!Array.isArray(rows)) {
      throw new Error('Supabase response was not an array');
    }
    return rows.map(toLegacy);
  }

  /** Kick off the initial fetch exactly once. Subsequent calls (e.g.,
      duplicate `CMS.init()` from script.js + case-study.js) reuse the
      same promise. */
  function kickFetch() {
    if (kicked) return ready;
    kicked = true;

    // Optimistically hydrate from sessionStorage so synchronous reads
    // immediately after kickFetch() see something while we revalidate.
    hydrateFromCache();

    fetchAll()
      .then((rows) => {
        store = rows;
        writeCache();
      })
      .catch((err) => {
        // Graceful degradation: keep whatever's in `store` (cached or
        // empty) and let the page render an empty state.
        console.warn('[cms-api] Fetch failed, using cached/empty data:', err);
      })
      .finally(() => readyResolve());

    return ready;
  }

  /* ── Public API ─ same shape as legacy cms.js ─────────────────── */
  const CMS = {
    /** Resolves when the first fetch completes. Always settles. */
    ready,

    /** Backward-compatible name — returns the same `ready` promise so
        `await CMS.init()` works. Idempotent: callable from multiple
        scripts on the same page. */
    init() {
      return kickFetch();
    },

    /** All projects currently in the in-memory store. Anon can only
        see published, so this == getVisible() in practice. */
    getAll() {
      return store.slice();
    },

    getVisible() {
      // Public-facing: every row from Supabase is already published.
      return store.filter((p) => p.visible !== false);
    },

    getFeatured(limit = 3) {
      // The REST query already orders featured.desc — but a re-sort
      // here is cheap and keeps the contract self-evident.
      return store
        .slice()
        .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
        .slice(0, limit);
    },

    getBySlug(slug) {
      return store.find((p) => p.slug === slug) || null;
    },

    /** Kept for parity with cms.js — admin-only callers are gone, but
        nothing breaks if a future caller appears. */
    getById(id) {
      return store.find((p) => p.id === id) || null;
    },

    getRelated(currentId, limit = 2) {
      return store
        .filter((p) => p.id !== currentId && p.visible !== false)
        .slice(0, limit);
    },

    slugify,
    CATEGORIES,
  };

  // Expose globally just like legacy cms.js.
  window.CMS = CMS;

  /* ── Auto-init on script load ────────────────────────────────────
     Mirrors cms.js's behavior of being usable without an explicit
     init(). Existing call sites that DO call init() are still fine
     thanks to idempotency. */
  kickFetch();

  /* ── Update the footer "Admin" link href from window.__ADMIN_URL__
     The footer in index.html / case-study.html marks the link with
     id="adminLink" so this 4-line shim can target it without depending
     on DOMContentLoaded ordering. */
  const setAdminLink = () => {
    const a = document.getElementById('adminLink');
    if (!a) return;
    const url = (typeof window !== 'undefined' && window.__ADMIN_URL__) || '/admin';
    a.setAttribute('href', url);
  };
  if (document.readyState !== 'loading') setAdminLink();
  else document.addEventListener('DOMContentLoaded', setAdminLink);
})();
