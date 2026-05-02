/* ═══════════════════════════════════════════════════════════════════
   Gitay Gold — Case Study Renderer
   ═══════════════════════════════════════════════════════════════════ */

function esc(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function render(p) {
  document.title = `${p.title} — Gitay Gold`;

  /* ── Hero ──────────────────────────────────────────────────────── */
  if (p.heroImage) {
    document.getElementById('csHero').style.backgroundImage = `url(${esc(p.heroImage)})`;
  }

  document.getElementById('csHeroMeta').innerHTML = `
    <span class="cs-hero-pill">${esc(p.client || '')}</span>
    <span class="cs-hero-pill">${esc(p.date || '')}</span>
    ${p.category ? `<span class="cs-hero-pill cs-hero-pill--accent">${esc(CMS.CATEGORIES[p.category] || p.category)}</span>` : ''}
  `;
  document.getElementById('csHeroTitle').textContent = p.title;
  document.getElementById('csHeroDesc').textContent  = p.shortDesc || '';

  /* ── Info Bar ──────────────────────────────────────────────────── */
  const tags = (p.tags || []).map(t => `<span class="cs-tag">${esc(t)}</span>`).join('');
  document.getElementById('csInfoBar').innerHTML = `
    <div class="cs-info-item"><div class="cs-info-label">Client</div><div class="cs-info-value">${esc(p.client || '—')}</div></div>
    <div class="cs-info-item"><div class="cs-info-label">Year</div><div class="cs-info-value">${esc(p.date || '—')}</div></div>
    <div class="cs-info-item"><div class="cs-info-label">Category</div><div class="cs-info-value">${esc(CMS.CATEGORIES[p.category] || p.category || '—')}</div></div>
    ${tags ? `<div class="cs-info-item"><div class="cs-info-label">Stack & Tools</div><div class="cs-info-tags">${tags}</div></div>` : ''}
    ${p.liveUrl && p.liveUrl !== '#' ? `<div class="cs-info-item"><div class="cs-info-label">Live URL</div><div class="cs-info-value"><a href="${esc(p.liveUrl)}" target="_blank" style="color:var(--accent)">${esc(p.liveUrl)}</a></div></div>` : ''}
  `;

  /* ── Story ─────────────────────────────────────────────────────── */
  if (p.challenge) {
    document.getElementById('csChallenge').textContent = p.challenge;
  } else {
    document.getElementById('csChallengeSection').style.display = 'none';
  }

  if (p.solution) {
    document.getElementById('csSolution').textContent = p.solution;
  } else {
    document.getElementById('csSolutionSection').style.display = 'none';
  }

  /* ── Content Blocks ────────────────────────────────────────────── */
  const blocksEl = document.getElementById('csBlocks');
  (p.blocks || []).forEach(b => {
    const div = document.createElement('div');
    div.className = 'cs-block reveal';

    if (b.type === 'text') {
      div.innerHTML = `<p class="cs-block-text">${esc(b.content)}</p>`;
    }
    if (b.type === 'image') {
      div.innerHTML = `
        <div class="cs-block-image">
          <img src="${esc(b.url)}" alt="${esc(b.caption || '')}" loading="lazy" />
          ${b.caption ? `<p class="cs-block-caption">${esc(b.caption)}</p>` : ''}
        </div>
      `;
    }
    if (b.type === 'quote') {
      div.innerHTML = `
        <blockquote class="cs-block-quote">
          <p class="cs-block-quote-text">"${esc(b.content)}"</p>
          ${b.author ? `<cite class="cs-block-quote-author">— ${esc(b.author)}</cite>` : ''}
        </blockquote>
      `;
    }
    if (b.type === 'list') {
      const items = (b.items || []).map(i => `<li>${esc(i)}</li>`).join('');
      div.innerHTML = `<ul class="cs-block-list">${items}</ul>`;
    }

    blocksEl.appendChild(div);
  });

  /* ── KPIs ──────────────────────────────────────────────────────── */
  if (p.results) {
    document.getElementById('csResults').textContent = p.results;
  }
  const kpiGrid = document.getElementById('csKpiGrid');
  if (p.kpis && p.kpis.length) {
    kpiGrid.innerHTML = p.kpis.map(k => `
      <div class="cs-kpi-card">
        <div class="cs-kpi-value">${esc(k.value)}</div>
        <div class="cs-kpi-label">${esc(k.label)}</div>
      </div>
    `).join('');
  } else if (!p.results) {
    document.getElementById('csKpisSection').style.display = 'none';
  }

  /* ── Live URL button ───────────────────────────────────────────── */
  const liveBtn = document.getElementById('csLiveBtn');
  if (p.liveUrl && p.liveUrl !== '#') {
    liveBtn.href = p.liveUrl;
  } else {
    document.getElementById('csCta').style.display = 'none';
  }

  /* ── Related ───────────────────────────────────────────────────── */
  const related = CMS.getRelated(p.id, 2);
  if (related.length) {
    document.getElementById('csRelatedGrid').innerHTML = related.map(r => `
      <a href="case-study.html#${encodeURIComponent(r.slug)}" class="cs-related-card">
        ${r.thumbnail ? `<img class="cs-related-img" src="${esc(r.thumbnail)}" alt="${esc(r.title)}" loading="lazy" />` : ''}
        <div class="cs-related-overlay">
          <div class="cs-related-title">${esc(r.title)}</div>
          <div class="cs-related-cat">${esc(CMS.CATEGORIES[r.category] || r.category || '')}</div>
        </div>
      </a>
    `).join('');
  } else {
    document.getElementById('csRelated').style.display = 'none';
  }

  /* ── Show article ──────────────────────────────────────────────── */
  document.getElementById('csArticle').classList.remove('hidden');
}

/* ── Reveal on scroll ────────────────────────────────────────────── */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ── Nav scroll ──────────────────────────────────────────────────── */
function initNav() {
  const nav = document.getElementById('csNav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

/* ── Boot ────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  CMS.init();

  const slug = decodeURIComponent(window.location.hash.slice(1)) ||
               new URLSearchParams(window.location.search).get('slug');

  if (!slug) {
    window.location.replace('index.html#work');
    return;
  }

  const project = CMS.getBySlug(slug);

  if (!project || project.visible === false) {
    document.getElementById('cs404').classList.remove('hidden');
  } else {
    render(project);
    setTimeout(initReveal, 100);
  }

  initNav();
});
