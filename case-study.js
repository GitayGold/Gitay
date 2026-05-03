/* ═══════════════════════════════════════════════════════════════════
   GITAY GOLD — Case Study Page
   Renderer + scroll animations matching home design language
   ═══════════════════════════════════════════════════════════════════ */

const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, nx: 0, ny: 0 };
document.addEventListener('mousemove', e => {
  mouse.x  = e.clientX;
  mouse.y  = e.clientY;
  mouse.nx = (e.clientX / window.innerWidth  - 0.5) * 2;
  mouse.ny = -(e.clientY / window.innerHeight - 0.5) * 2;
});

function esc(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Cursor ──────────────────────────────────────────────────────── */
function initCursor() {
  const cursor    = document.getElementById('cursor');
  const cursorDot = document.getElementById('cursorDot');
  const label     = document.getElementById('cursorLabel');
  if (!cursor) return;

  let cx = mouse.x, cy = mouse.y;

  document.addEventListener('mousemove', e => {
    cursorDot.style.left = e.clientX + 'px';
    cursorDot.style.top  = e.clientY + 'px';
  });

  (function tick() {
    cx += (mouse.x - cx) * 0.18;
    cy += (mouse.y - cy) * 0.18;
    cursor.style.left = cx + 'px';
    cursor.style.top  = cy + 'px';
    requestAnimationFrame(tick);
  })();

  document.querySelectorAll('[data-cursor]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      document.body.classList.add('cursor-hover');
      const txt = el.getAttribute('data-cursor');
      label.textContent = txt.charAt(0).toUpperCase() + txt.slice(1);
    });
    el.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-hover');
      label.textContent = '';
    });
  });

  const generic = 'a, button, .cs-kpi-card, .cs-related-card, .cs-tag-pill';
  document.querySelectorAll(generic).forEach(el => {
    if (el.hasAttribute('data-cursor')) return;
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

/* ── Noise ───────────────────────────────────────────────────────── */
function initNoise() {
  const canvas = document.getElementById('noiseCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  let f = 0;
  (function draw() {
    f++;
    if (f % 4 === 0) {
      const id = ctx.createImageData(canvas.width, canvas.height);
      for (let i = 0; i < id.data.length; i += 4) {
        const v = Math.random() * 255 | 0;
        id.data[i] = id.data[i+1] = id.data[i+2] = v;
        id.data[i+3] = 255;
      }
      ctx.putImageData(id, 0, 0);
    }
    requestAnimationFrame(draw);
  })();
}

/* ── Render project ──────────────────────────────────────────────── */
function render(p) {
  document.title = `${p.title} — Gitay Gold`;

  // Hero meta
  document.getElementById('csMetaClient').textContent = p.client || '—';
  document.getElementById('csMetaYear').textContent   = p.date   || '—';
  document.getElementById('csMetaCat').textContent    = CMS.CATEGORIES[p.category] || p.category || '—';
  document.getElementById('csMetaStatus').textContent = (p.liveUrl && p.liveUrl !== '#') ? 'Live' : 'In production';

  // Hero title (line-reveal)
  const heroTitleEl = document.getElementById('csHeroTitle');
  heroTitleEl.innerHTML = '';
  const lines = splitTitleByLines(p.title, 3);
  lines.forEach((line, i) => {
    const wrap  = document.createElement('span');
    wrap.className = 'cs-line-reveal';
    const inner = document.createElement('span');
    inner.className = 'cs-line-inner';
    if (i === lines.length - 1 && lines.length > 1) {
      const em = document.createElement('em');
      em.textContent = line;
      inner.appendChild(em);
    } else {
      inner.textContent = line;
    }
    wrap.appendChild(inner);
    heroTitleEl.appendChild(wrap);
  });

  document.getElementById('csHeroDesc').textContent = p.shortDesc || '';

  // Hero image
  if (p.heroImage) {
    const img = document.getElementById('csHeroImage');
    img.src = p.heroImage;
    img.alt = p.title;
  }

  // Hero tags
  const heroTagsEl = document.getElementById('csHeroTags');
  heroTagsEl.innerHTML = (p.tags || []).map(t => `<span class="cs-tag-pill">${esc(t)}</span>`).join('');

  // Info bar
  const tagsHtml = (p.tags || []).map(t => `<span class="cs-tag-pill">${esc(t)}</span>`).join('');
  const liveHtml = (p.liveUrl && p.liveUrl !== '#')
    ? `<div class="cs-info-item"><div class="cs-info-label">Live URL</div><div class="cs-info-value"><a href="${esc(p.liveUrl)}" target="_blank" rel="noopener">${esc(p.liveUrl.replace(/^https?:\/\//, ''))}</a></div></div>`
    : '';
  document.getElementById('csInfoBar').innerHTML = `
    <div class="cs-info-item"><div class="cs-info-label">Client</div><div class="cs-info-value">${esc(p.client || '—')}</div></div>
    <div class="cs-info-item"><div class="cs-info-label">Year / Index</div><div class="cs-info-value">${esc(p.date || '—')} · Vol. ${String((p.id || '').match(/\d+/)?.[0] || '01').padStart(2, '0')}</div></div>
    <div class="cs-info-item"><div class="cs-info-label">Discipline</div><div class="cs-info-value">${esc(CMS.CATEGORIES[p.category] || p.category || '—')}</div></div>
    ${tagsHtml ? `<div class="cs-info-item"><div class="cs-info-label">Stack &amp; Tools</div><div class="cs-info-tags">${tagsHtml}</div></div>` : ''}
    ${liveHtml}
  `;

  // Marquee — repeat tags + key terms
  const marqueeBase = [
    p.client, CMS.CATEGORIES[p.category] || p.category, p.date,
    ...(p.tags || []),
    'Gitay Gold', 'Award-winning craft', 'Hand-built'
  ].filter(Boolean);
  const marqueeItems = [...marqueeBase, ...marqueeBase, ...marqueeBase];
  document.getElementById('csMarqueeInner').innerHTML = marqueeItems.map((m, i) =>
    `<span class="m-word ${i % 3 === 1 ? 'italic' : ''}">${esc(m)}</span><span class="sep">✦</span>`
  ).join('');

  // Story
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

  // Content blocks
  const blocksEl = document.getElementById('csBlocks');
  blocksEl.innerHTML = '';
  (p.blocks || []).forEach(b => {
    const div = document.createElement('div');
    div.className = 'cs-block reveal';

    if (b.type === 'text') {
      div.innerHTML = `<p class="cs-block-text">${esc(b.content)}</p>`;
    }
    if (b.type === 'image') {
      div.innerHTML = `
        <div class="cs-block-image">
          <div class="cs-block-image-clip">
            <img src="${esc(b.url)}" alt="${esc(b.caption || '')}" loading="lazy" />
          </div>
          ${b.caption ? `<p class="cs-block-caption">${esc(b.caption)}</p>` : ''}
        </div>
      `;
    }
    if (b.type === 'quote') {
      div.innerHTML = `
        <blockquote class="cs-block-quote">
          <p class="cs-block-quote-text">${esc(b.content)}</p>
          ${b.author ? `<cite class="cs-block-quote-author">${esc(b.author)}</cite>` : ''}
        </blockquote>
      `;
    }
    if (b.type === 'list') {
      const items = (b.items || []).map(i => `<li>${esc(i)}</li>`).join('');
      div.innerHTML = `<ul class="cs-block-list">${items}</ul>`;
    }

    blocksEl.appendChild(div);
  });

  // Results / KPIs
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

  // CTA
  const liveBtn = document.getElementById('csLiveBtn');
  if (p.liveUrl && p.liveUrl !== '#') {
    liveBtn.href = p.liveUrl;
  } else {
    document.getElementById('csCta').style.display = 'none';
  }

  // Related
  const related = CMS.getRelated(p.id, 2);
  if (related.length) {
    document.getElementById('csRelatedGrid').innerHTML = related.map((r, i) => {
      const idx = String(i + 1).padStart(2, '0');
      return `
      <a href="case-study.html#${encodeURIComponent(r.slug)}" class="cs-related-card" data-cursor="view">
        <div class="cs-related-img-wrap">
          <div class="cs-related-img-clip">
            ${r.thumbnail ? `<img class="cs-related-img" src="${esc(r.thumbnail)}" alt="${esc(r.title)}" loading="lazy" />` : ''}
          </div>
          <div class="cs-related-overlay">
            <span class="cs-related-cat">${esc(CMS.CATEGORIES[r.category] || r.category || '')}</span>
          </div>
        </div>
        <div class="cs-related-meta">
          <span class="cs-related-meta-idx">— ${idx}</span>
          <h3>${esc(r.title)}</h3>
          <span class="cs-related-arrow">View case study <span>↗</span></span>
        </div>
      </a>
    `;
    }).join('');
  } else {
    document.getElementById('csRelated').style.display = 'none';
  }

  // Show
  document.getElementById('csArticle').classList.remove('hidden');
}

/* Split a title into ~N lines on word boundaries */
function splitTitleByLines(title, maxLines = 3) {
  const words = title.split(/\s+/);
  if (words.length <= maxLines) return words;
  const target = Math.ceil(words.length / maxLines);
  const lines = [];
  for (let i = 0; i < words.length; i += target) {
    lines.push(words.slice(i, i + target).join(' '));
  }
  return lines.slice(0, maxLines);
}

/* ── Reveals (line + block) ──────────────────────────────────────── */
function initReveals() {
  if (typeof gsap === 'undefined') {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.transition = 'opacity 0.9s ease, transform 0.9s ease';
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
          if (e.target.classList.contains('cs-line-reveal') || e.target.classList.contains('line-reveal')) {
            e.target.classList.add('is-in');
          }
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal, .line-reveal, .cs-line-reveal, .cs-block, .cs-related-card').forEach(el => obs.observe(el));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Block reveals
  document.querySelectorAll('.reveal').forEach(el => {
    gsap.to(el, {
      opacity: 1, y: 0,
      duration: 1.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });

  // line-reveal sweeps (homepage style)
  document.querySelectorAll('.line-reveal').forEach((line, i) => {
    ScrollTrigger.create({
      trigger: line,
      start: 'top 92%',
      once: true,
      onEnter: () => setTimeout(() => line.classList.add('is-in'), i * 80)
    });
  });

  // Hero title line-reveal — fire shortly after load
  setTimeout(() => {
    document.querySelectorAll('.cs-line-reveal').forEach((line, i) => {
      setTimeout(() => line.classList.add('is-in'), 250 + i * 140);
    });
  }, 120);

  // Image clip reveals (content blocks)
  document.querySelectorAll('.cs-block').forEach(block => {
    if (!block.querySelector('.cs-block-image')) return;
    ScrollTrigger.create({
      trigger: block,
      start: 'top 85%',
      once: true,
      onEnter: () => block.classList.add('is-in')
    });
  });

  // Related image clip reveals
  document.querySelectorAll('.cs-related-card').forEach((card, i) => {
    ScrollTrigger.create({
      trigger: card,
      start: 'top 88%',
      once: true,
      onEnter: () => setTimeout(() => card.classList.add('reveal-in'), i * 120)
    });
  });

  // Section heading parallax
  document.querySelectorAll('.cs-story-heading, .cs-related-title, .cta-title').forEach(el => {
    gsap.to(el, {
      y: -30, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.4 }
    });
  });
}

/* ── KPI counters (extract leading number, animate) ──────────────── */
function initKpiCounters() {
  const cards = document.querySelectorAll('.cs-kpi-card .cs-kpi-value');
  if (!cards.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el  = e.target;
      const raw = el.textContent.trim();
      const m   = raw.match(/^([+\-−]?)([\d,.]+)(.*)$/);
      if (!m) { obs.unobserve(el); return; }

      const sign  = m[1];
      const numS  = m[2];
      const tail  = m[3] || '';
      const target = parseFloat(numS.replace(/,/g, ''));
      const isInt  = !numS.includes('.');

      let start = 0;
      const dur = 1800;
      (function step(ts) {
        if (!start) start = ts;
        const prog = Math.min((ts - start) / dur, 1);
        const ease = 1 - Math.pow(1 - prog, 4);
        const v = ease * target;
        el.textContent = sign + (isInt ? Math.floor(v).toLocaleString() : v.toFixed(1)) + tail;
        if (prog < 1) requestAnimationFrame(step);
        else el.textContent = raw;
      })(performance.now());
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });

  cards.forEach(el => obs.observe(el));
}

/* ── Magnetic ────────────────────────────────────────────────────── */
function initMagnetic() {
  document.querySelectorAll('.btn-magnetic, .cs-nav-back, .btn-back-big').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r  = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width  / 2)) * 0.32;
      const dy = (e.clientY - (r.top  + r.height / 2)) * 0.32;
      btn.style.transition = 'none';
      btn.style.transform  = `translate(${dx}px,${dy}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transition = 'transform 0.6s cubic-bezier(0.23,1,0.32,1)';
      btn.style.transform  = 'translate(0,0)';
    });
  });

  document.querySelectorAll('.cs-kpi-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top  + r.height / 2)) / r.height;
      card.style.transform = `perspective(1100px) rotateX(${-dy * 4}deg) rotateY(${dx * 4}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1100px) rotateX(0) rotateY(0)';
    });
  });
}

/* ── Nav scroll ──────────────────────────────────────────────────── */
function initNav() {
  const nav = document.getElementById('csNav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

/* ── Scroll % rail ──────────────────────────────────────────────── */
function initScrollPct() {
  const el = document.getElementById('scrollPctText');
  if (!el) return;
  const sections = ['Intro', 'Brief', 'Story', 'Results', 'Live', 'Related'];
  let lastIdx = -1;

  window.addEventListener('scroll', () => {
    const max = document.body.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
    const idx = Math.min(sections.length - 1, Math.floor(pct / (100 / sections.length)));
    if (idx !== lastIdx) {
      lastIdx = idx;
      el.textContent = String(idx).padStart(2, '0') + ' — ' + sections[idx];
    }
  }, { passive: true });
}

/* ── Boot ────────────────────────────────────────────────────────── */
/* Phase 3: cms-api.js is async (Supabase fetch). We `await` before
   reading getBySlug. Cursor + noise run synchronously first since they
   don't depend on project data — that way the page chrome shows up
   during the (usually-cached, ~10ms) network wait. */
document.addEventListener('DOMContentLoaded', async () => {
  initCursor();
  initNoise();

  await CMS.init();

  const slug = decodeURIComponent(window.location.hash.slice(1)) ||
               new URLSearchParams(window.location.search).get('slug');

  if (!slug) {
    window.location.replace('index.html#work');
    return;
  }

  const project = CMS.getBySlug(slug);

  if (!project || project.visible === false) {
    document.getElementById('cs404').classList.remove('hidden');
    initMagnetic();
    initNav();
    return;
  }

  render(project);

  // Mount animations after the DOM is populated
  setTimeout(() => {
    initReveals();
    initKpiCounters();
    initMagnetic();
    initNav();
    initScrollPct();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }, 80);
});
