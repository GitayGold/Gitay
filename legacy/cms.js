/* ═══════════════════════════════════════════════════════════════════
   Gitay Gold CMS — Shared Data Layer (LEGACY)
   ───────────────────────────────────────────────────────────────────
   ARCHIVED IN PHASE 3 — replaced by ../cms-api.js (Supabase REST).
   The static site no longer loads this file.
   See ../legacy/README.md for context.
   ═══════════════════════════════════════════════════════════════════ */

const CMS = (() => {
  const KEY = 'gitaygold_cms_v1';

  /* ── Default seed projects ──────────────────────────────────────── */
  const DEFAULTS = [
    {
      id: 'luminary-2025',
      slug: 'luminary-brand-web',
      title: 'Luminary — Full Brand & Web Platform',
      client: 'Luminary',
      date: '2025',
      category: 'branding',
      tags: ['Branding', 'Shopify', 'Motion', 'Web App'],
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&h=1200&fit=crop&q=80',
      heroImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&h=900&fit=crop&q=80',
      shortDesc: 'A complete brand identity and e-commerce platform for a premium lifestyle brand.',
      challenge: 'Luminary came to us with a dated visual identity that no longer reflected their premium positioning. Their existing website was slow, had a 78% bounce rate, and their store was built on an outdated platform that couldn\'t handle their growing product catalog.',
      solution: 'We started from the ground up. A full brand audit led to a refined visual identity system — new typography, refined color palette, and a comprehensive logo suite. We rebuilt their e-commerce platform on Shopify with custom theming, optimized checkout flows, and AI-powered product recommendations.',
      results: 'The new brand and platform launched to critical acclaim. In the first 30 days, conversion rates increased by 340%, bounce rate dropped to 31%, and average order value grew by 85%. The client reported their highest revenue month ever within the first quarter post-launch.',
      kpis: [
        { label: 'Conversion Rate', value: '+340%' },
        { label: 'Bounce Rate', value: '-58%' },
        { label: 'Revenue Month 1', value: '+220%' },
        { label: 'Avg. Order Value', value: '+85%' }
      ],
      blocks: [
        { type: 'text', content: 'The redesign was driven by a core insight: Luminary\'s customers were buying emotion, not just products. Every design decision was made through this lens — what feeling does this create?' },
        { type: 'image', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=700&fit=crop&q=80', caption: 'The new brand identity system across print and digital touchpoints' },
        { type: 'quote', content: 'Gitay Gold didn\'t just build us a website. They built us a revenue machine.', author: 'Ran M., Founder @ Luminary' },
        { type: 'list', items: ['Complete visual identity system with 40+ brand assets', 'Custom Shopify theme with 3D product viewer', 'AI-powered recommendation engine', 'Multi-language support (EN/HE/AR)'] }
      ],
      liveUrl: '#',
      featured: true,
      visible: true,
      createdAt: Date.now() - 86400000 * 30
    },
    {
      id: 'apex-2025',
      slug: 'apex-ai-dashboard',
      title: 'Apex — AI-Powered Dashboard',
      client: 'Apex Commerce',
      date: '2025',
      category: 'web',
      tags: ['React', 'Next.js', 'AI Integration', 'UX Strategy'],
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&q=80',
      heroImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&h=900&fit=crop&q=80',
      shortDesc: 'An AI-powered analytics and management dashboard for a fast-growing e-commerce operator.',
      challenge: 'Apex\'s operations team was drowning in data. They had 7 different tools open at any given time — analytics, inventory, customer service, ads, fulfillment — none talking to each other. Decision-making was slow and reactive.',
      solution: 'We designed and built a unified command center that pulls data from all their tools into a single intelligent dashboard. Using GPT-4 as the reasoning layer, the system surfaces actionable insights automatically and predicts inventory shortfalls up to 14 days in advance.',
      results: 'The dashboard reduced the time spent on daily reporting by 4 hours per day. The AI-powered insights directly contributed to a 28% reduction in stockouts and helped the team identify a $40,000/month ad spend inefficiency they weren\'t aware of.',
      kpis: [
        { label: 'Time Saved Daily', value: '4 hrs' },
        { label: 'Stockout Reduction', value: '-28%' },
        { label: 'Ad Waste Found', value: '$40K/mo' },
        { label: 'Team NPS Score', value: '94' }
      ],
      blocks: [
        { type: 'text', content: 'The challenge wasn\'t just technical — it was behavioral. We needed to build something so intuitive that a team used to managing 7 tools would actually switch to one.' },
        { type: 'image', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=700&fit=crop&q=80', caption: 'The unified command center with real-time AI insights panel' },
        { type: 'quote', content: 'From brief to launch in two weeks. The AI integrations they added are something our competitors will be copying for years.', author: 'Noa S., CEO @ Apex Commerce' }
      ],
      liveUrl: '#',
      featured: true,
      visible: true,
      createdAt: Date.now() - 86400000 * 60
    },
    {
      id: 'ember-2024',
      slug: 'ember-shopify-rebuild',
      title: 'Ember — Shopify Store Rebuild',
      client: 'Ember Group',
      date: '2024',
      category: 'ecommerce',
      tags: ['Shopify', 'Motion Design', 'Conversion', 'Performance'],
      thumbnail: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&h=600&fit=crop&q=80',
      heroImage: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1600&h=900&fit=crop&q=80',
      shortDesc: 'A full Shopify rebuild with motion design and conversion optimization for a lifestyle brand.',
      challenge: 'Ember\'s store was built 4 years prior and had never been optimized. Page load averaged 8.2 seconds, mobile conversion was 0.6%, and their abandoned cart rate was over 80%.',
      solution: 'We rebuilt the entire store on a custom Shopify theme with performance as the primary constraint. Every image is lazy-loaded in next-gen formats. Checkout was streamlined from 6 steps to 2. We added micro-animations that bring the brand to life without sacrificing speed.',
      results: 'Page load dropped to 1.1 seconds (Core Web Vitals: all green). Mobile conversion went from 0.6% to 2.8%. Abandoned cart rate dropped to 52%. The store broke its single-day revenue record 3 weeks after launch.',
      kpis: [
        { label: 'Page Load Time', value: '1.1s' },
        { label: 'Mobile Conversion', value: '+367%' },
        { label: 'Cart Abandonment', value: '-35%' },
        { label: 'Day-1 Revenue', value: '★ Record' }
      ],
      blocks: [
        { type: 'text', content: 'Speed is conversion. Every 100ms improvement in page load time translates to measurable revenue gains. We treated performance as a design constraint, not an afterthought.' },
        { type: 'image', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=700&fit=crop&q=80', caption: 'Product pages with motion design and optimized image delivery' },
        { type: 'list', items: ['Custom Shopify 2.0 theme built from scratch', 'WebP/AVIF image pipeline reducing file sizes by 70%', '2-step checkout with Apple/Google Pay integration', 'Automated abandoned cart email sequences'] }
      ],
      liveUrl: '#',
      featured: true,
      visible: true,
      createdAt: Date.now() - 86400000 * 120
    }
  ];

  /* ── Init (seed defaults on first load) ─────────────────────────── */
  function init() {
    if (!localStorage.getItem(KEY)) {
      localStorage.setItem(KEY, JSON.stringify(DEFAULTS));
    }
  }

  /* ── Read ────────────────────────────────────────────────────────── */
  function getAll() {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  }

  function getVisible() {
    return getAll().filter(p => p.visible !== false);
  }

  function getFeatured(limit = 3) {
    return getVisible()
      .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
      .slice(0, limit);
  }

  function getBySlug(slug) {
    return getAll().find(p => p.slug === slug) || null;
  }

  function getById(id) {
    return getAll().find(p => p.id === id) || null;
  }

  function getRelated(currentId, limit = 2) {
    return getVisible().filter(p => p.id !== currentId).slice(0, limit);
  }

  /* ── Write ───────────────────────────────────────────────────────── */
  function _save(projects) {
    localStorage.setItem(KEY, JSON.stringify(projects));
  }

  function add(data) {
    const projects = getAll();
    const project = {
      featured: false,
      visible: true,
      kpis: [],
      blocks: [],
      tags: [],
      ...data,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      slug: slugify(data.title || 'project'),
      createdAt: Date.now()
    };
    projects.unshift(project);
    _save(projects);
    return project;
  }

  function update(id, data) {
    const projects = getAll();
    const idx = projects.findIndex(p => p.id === id);
    if (idx === -1) return null;
    if (data.title && data.title !== projects[idx].title) {
      data.slug = slugify(data.title);
    }
    projects[idx] = { ...projects[idx], ...data };
    _save(projects);
    return projects[idx];
  }

  function remove(id) {
    _save(getAll().filter(p => p.id !== id));
  }

  /* ── Helpers ─────────────────────────────────────────────────────── */
  function slugify(str) {
    return str.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  const CATEGORIES = {
    web:       'Web Development',
    ecommerce: 'E-Commerce',
    branding:  'Branding',
    ux:        'UX / Product',
    motion:    'Motion & Video',
    ai:        'AI & Automation',
    landing:   'Landing Page'
  };

  return {
    init, getAll, getVisible, getFeatured, getBySlug, getById, getRelated,
    add, update, remove, slugify, CATEGORIES
  };
})();
