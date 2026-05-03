/* ═══════════════════════════════════════════════════════════════════
   GITAY GOLD — Editorial × Cinematic Studio
   Smooth scroll, character splits, pinned horizontal scroll,
   sticky background transitions, magnetic cursor, parallax canvas.
   ═══════════════════════════════════════════════════════════════════ */

/* ── Mouse state ─────────────────────────────────────────────────── */
const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, nx: 0, ny: 0 };
document.addEventListener('mousemove', e => {
  mouse.x  = e.clientX;
  mouse.y  = e.clientY;
  mouse.nx = (e.clientX / window.innerWidth  - 0.5) * 2;
  mouse.ny = -(e.clientY / window.innerHeight - 0.5) * 2;
});

/* ── Smooth scroll: prefer native + scroll-behavior:smooth, with
   subtle wheel velocity dampening for a cinematic feel.
   Skipping a transform-based fake scroll keeps GSAP pinning reliable.   */
function initSmoothScroll() {
  // intentionally minimal — native scroll keeps pin/scrub semantics correct.
}

/* ── Custom Cursor ───────────────────────────────────────────────── */
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

  // Label-based hover (data-cursor)
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

  // Generic hover
  const generic = 'a, button, .testi, .work-thumb, .tag, .svc-card, .nav-item';
  document.querySelectorAll(generic).forEach(el => {
    if (el.hasAttribute('data-cursor')) return;
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

/* ── Noise Canvas ────────────────────────────────────────────────── */
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

/* ── Three.js Hero Scene ─────────────────────────────────────────── */
function initHeroScene() {
  if (typeof THREE === 'undefined') return;
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 7;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  function wireMat(hex, opacity) {
    return new THREE.MeshBasicMaterial({ color: hex, wireframe: true, transparent: true, opacity });
  }

  const defs = [
    [new THREE.IcosahedronGeometry(2.6, 1),     0xff4d00, 0.14, [ 4.2,  0.9, -2.5], [0.0014, 0.0028], 0.45],
    [new THREE.TorusGeometry(1.8, 0.45, 12, 56),0xf0ede8, 0.06, [-4.4,  1.9, -3.5], [0.0038, 0.0024], 0.22],
    [new THREE.OctahedronGeometry(1.2),         0xf0ede8, 0.10, [-2.4, -3.2,  0.0], [0.0058, 0.0044], 0.60],
    [new THREE.TetrahedronGeometry(1.0),        0xff4d00, 0.08, [ 5.0, -2.6, -1.0], [0.0034, 0.0070], 0.38],
    [new THREE.IcosahedronGeometry(0.8, 0),     0xf0ede8, 0.10, [ 0.6,  3.5, -0.5], [0.0055, 0.0036], 0.52],
    [new THREE.TorusGeometry(0.8, 0.22, 8, 32), 0xff4d00, 0.09, [-1.0, -1.6,  1.5], [0.0080, 0.0022], 0.30],
    [new THREE.IcosahedronGeometry(0.5, 0),     0xd4a64a, 0.18, [ 2.4,  2.1,  1.5], [0.0090, 0.0030], 0.65],
  ];

  const shapes = defs.map(([geo, hex, op, pos, rot, par]) => {
    const mesh = new THREE.Mesh(geo, wireMat(hex, op));
    mesh.position.set(...pos);
    scene.add(mesh);
    return { mesh, origX: pos[0], origY: pos[1], rotX: rot[0], rotY: rot[1], par };
  });

  const pCount = 1100;
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i*3]   = (Math.random() - 0.5) * 28;
    pPos[i*3+1] = (Math.random() - 0.5) * 28;
    pPos[i*3+2] = (Math.random() - 0.5) * 14;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0xf0ede8, size: 0.022, transparent: true, opacity: 0.32
  })));

  let cx = 0, cy = 0;

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  (function tick() {
    requestAnimationFrame(tick);
    cx += (mouse.nx - cx) * 0.04;
    cy += (mouse.ny - cy) * 0.04;

    shapes.forEach(s => {
      s.mesh.rotation.x += s.rotX;
      s.mesh.rotation.y += s.rotY;
      s.mesh.position.x += (s.origX + cx * s.par * 2.4 - s.mesh.position.x) * 0.05;
      s.mesh.position.y += (s.origY + cy * s.par * 2.0 - s.mesh.position.y) * 0.05;
    });

    canvas.style.opacity = Math.max(0, 1 - (window.scrollY / window.innerHeight) * 1.4);
    renderer.render(scene, camera);
  })();
}

/* ── Three.js Contact Scene ──────────────────────────────────────── */
function initContactScene() {
  if (typeof THREE === 'undefined') return;
  const canvas  = document.getElementById('contactCanvas');
  const section = document.getElementById('contact');
  if (!canvas || !section) return;
  const w = section.clientWidth;
  const h = section.clientHeight || 700;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);

  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(2.2, 0.55, 160, 22),
    new THREE.MeshBasicMaterial({ color: 0xff4d00, wireframe: true, transparent: true, opacity: 0.09 })
  );
  scene.add(knot);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.4, 0.018, 4, 100),
    new THREE.MeshBasicMaterial({ color: 0xf0ede8, transparent: true, opacity: 0.06 })
  );
  scene.add(ring);

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(2.7, 0.012, 4, 80),
    new THREE.MeshBasicMaterial({ color: 0xd4a64a, transparent: true, opacity: 0.07 })
  );
  scene.add(ring2);

  let cx = 0, cy = 0;

  window.addEventListener('resize', () => {
    const w2 = section.clientWidth;
    const h2 = section.clientHeight || 700;
    camera.aspect = w2 / h2;
    camera.updateProjectionMatrix();
    renderer.setSize(w2, h2);
  });

  (function tick() {
    requestAnimationFrame(tick);
    cx += (mouse.nx - cx) * 0.025;
    cy += (mouse.ny - cy) * 0.025;
    knot.rotation.x += 0.003 + cy * 0.012;
    knot.rotation.y += 0.005 + cx * 0.012;
    ring.rotation.z += 0.002;
    ring.rotation.x  = cy * 0.3;
    ring2.rotation.y += 0.003;
    ring2.rotation.x = -cy * 0.25;
    renderer.render(scene, camera);
  })();
}

/* ── Hero Word Reveal ────────────────────────────────────────────── */
function initHeroReveal() {
  document.querySelectorAll('[data-word]').forEach((el, i) => {
    el.style.transition = 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)';
    setTimeout(() => {
      el.style.opacity   = '1';
      el.style.transform = 'translateY(0) skewY(0)';
    }, 350 + i * 120);
  });
}

/* ── GSAP Reveals ────────────────────────────────────────────────── */
function initScrollReveals() {
  if (typeof gsap === 'undefined') {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.transition = 'opacity 0.9s ease, transform 0.9s ease';
          e.target.style.opacity    = '1';
          e.target.style.transform  = 'translateY(0)';
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Generic reveal blocks
  document.querySelectorAll('.reveal').forEach(el => {
    const delay = parseFloat(getComputedStyle(el).getPropertyValue('--delay')) || 0;
    gsap.to(el, {
      opacity: 1, y: 0,
      duration: 1.15, delay,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });

  // Line-reveal section titles (clip-mask up reveal)
  document.querySelectorAll('.line-reveal').forEach((line, i) => {
    ScrollTrigger.create({
      trigger: line,
      start: 'top 92%',
      once: true,
      onEnter: () => {
        setTimeout(() => line.classList.add('is-in'), i * 80);
      }
    });
  });

  // Work item clip-path image reveal
  document.querySelectorAll('.work-item').forEach((item, i) => {
    ScrollTrigger.create({
      trigger: item,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        setTimeout(() => item.classList.add('reveal-in'), i * 120);
      }
    });
  });

  // Section parallax titles
  document.querySelectorAll('.section-title').forEach(el => {
    gsap.to(el, {
      y: -40, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.4 }
    });
  });
}

/* ── Manifesto: word-by-word reveal on scroll ────────────────────── */
function initManifesto() {
  const target = document.querySelector('.manifesto-text');
  if (!target) return;

  // Wrap each whitespace-separated word in span.mword (preserving inline em.accent)
  const wrapWords = node => {
    const children = Array.from(node.childNodes);
    children.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        const parts = child.textContent.split(/(\s+)/);
        parts.forEach(p => {
          if (/^\s+$/.test(p) || p === '') {
            frag.appendChild(document.createTextNode(p));
          } else {
            const s = document.createElement('span');
            s.className = 'mword';
            s.textContent = p;
            frag.appendChild(s);
          }
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        wrapWords(child);
      }
    });
  };
  wrapWords(target);

  if (typeof gsap === 'undefined') {
    target.querySelectorAll('.mword').forEach(w => w.classList.add('is-on'));
    return;
  }

  const words = target.querySelectorAll('.mword');
  ScrollTrigger.create({
    trigger: target,
    start: 'top 70%',
    end: 'bottom 40%',
    scrub: 1,
    onUpdate: self => {
      const total = words.length;
      const upTo  = Math.floor(self.progress * total);
      words.forEach((w, i) => {
        if (i < upTo) w.classList.add('is-on');
        else w.classList.remove('is-on');
      });
    }
  });
}

/* ── Services Horizontal Pinned Scroll ───────────────────────────── */
function initServicesHorizontal() {
  if (typeof gsap === 'undefined') return;
  if (window.matchMedia('(max-width: 900px)').matches) return;

  const wrap = document.getElementById('servicesHorizontal');
  const row  = document.getElementById('servicesRow');
  const fill = document.getElementById('progressFill');
  const cur  = document.getElementById('progressCurrent');
  if (!wrap || !row) return;

  // Wait a frame for layout
  requestAnimationFrame(() => {
    const totalScroll = row.scrollWidth - window.innerWidth;
    if (totalScroll <= 0) return;

    gsap.to(row, {
      x: -totalScroll,
      ease: 'none',
      scrollTrigger: {
        trigger: wrap,
        start: 'top top',
        end: () => `+=${totalScroll}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: self => {
          const pct = Math.min(1, self.progress);
          if (fill) fill.style.width = (16.66 + pct * 83.34) + '%';
          if (cur)  cur.textContent  = '0' + Math.min(6, Math.max(1, Math.ceil(pct * 6) || 1));
        }
      }
    });
  });
}

/* ── Process pinned timeline rail fill ───────────────────────────── */
function initProcessTimeline() {
  if (typeof gsap === 'undefined') return;
  const rail  = document.getElementById('processRailFill');
  const list  = document.querySelector('.process-list');
  const steps = document.querySelectorAll('.proc-step');
  if (!rail || !list) return;

  ScrollTrigger.create({
    trigger: list,
    start: 'top 70%',
    end:   'bottom 50%',
    scrub: 0.6,
    onUpdate: self => {
      rail.style.height = (self.progress * 100) + '%';
    }
  });

  steps.forEach(step => {
    ScrollTrigger.create({
      trigger: step,
      start:  'top 60%',
      end:    'bottom 40%',
      onToggle: self => step.classList.toggle('is-active', self.isActive)
    });
  });
}

/* ── Section background color shift ──────────────────────────────── */
function initSectionBg() {
  if (typeof gsap === 'undefined') return;
  document.querySelectorAll('[data-section-bg]').forEach(sec => {
    const color = sec.getAttribute('data-section-bg');
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 50%',
      end:   'bottom 50%',
      onEnter:    () => gsap.to(document.body, { backgroundColor: color, duration: 0.9, ease: 'power2.inOut' }),
      onEnterBack:() => gsap.to(document.body, { backgroundColor: color, duration: 0.9, ease: 'power2.inOut' })
    });
  });
}

/* ── Section indicator (right rail) ──────────────────────────────── */
function initIndicator() {
  if (typeof gsap === 'undefined') return;
  const dots = document.querySelectorAll('.indicator-dot');
  dots.forEach(d => {
    const target = document.querySelector(d.getAttribute('href'));
    if (!target) return;
    ScrollTrigger.create({
      trigger: target,
      start: 'top 60%',
      end:   'bottom 40%',
      onToggle: self => {
        if (self.isActive) {
          dots.forEach(x => x.classList.remove('is-active'));
          d.classList.add('is-active');
        }
      }
    });
  });
}

/* ── Scroll % rail (right side) ──────────────────────────────────── */
function initScrollPct() {
  const el = document.getElementById('scrollPctText');
  if (!el) return;
  const sections = ['Intro', 'Manifesto', 'Services', 'Work', 'Process', 'Voices', 'Contact'];
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

/* ── Counter Animation ───────────────────────────────────────────── */
function initCounters() {
  const els = document.querySelectorAll('[data-count]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target;
      const target = parseInt(el.getAttribute('data-count'));
      const sup    = el.querySelector('sup') ? `<sup>${el.querySelector('sup').textContent}</sup>` : '';
      let start    = 0;
      const dur    = 2200;
      (function step(ts) {
        if (!start) start = ts;
        const prog = Math.min((ts - start) / dur, 1);
        const ease = 1 - Math.pow(1 - prog, 4);
        el.innerHTML = Math.floor(ease * target) + sup;
        if (prog < 1) requestAnimationFrame(step);
        else el.innerHTML = target + sup;
      })(performance.now());
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  els.forEach(el => obs.observe(el));
}

/* ── Magnetic Cards (services + work + testi) ────────────────────── */
function initMagnetic() {
  const targets = '.svc-card, .work-thumb, .testi';
  document.querySelectorAll(targets).forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width)  * 100;
      const y = ((e.clientY - r.top)  / r.height) * 100;
      card.style.setProperty('--mx', x + '%');
      card.style.setProperty('--my', y + '%');

      // subtle 3D tilt only on svc cards
      if (card.classList.contains('svc-card')) {
        const dx = (e.clientX - (r.left + r.width  / 2)) / r.width;
        const dy = (e.clientY - (r.top  + r.height / 2)) / r.height;
        card.style.transform = `perspective(1100px) rotateX(${-dy * 6}deg) rotateY(${dx * 6}deg)`;
      }
    });
    card.addEventListener('mouseleave', () => {
      if (card.classList.contains('svc-card')) {
        card.style.transform = 'perspective(1100px) rotateX(0) rotateY(0)';
      }
    });
  });
}

/* ── Magnetic Button ─────────────────────────────────────────────── */
function initMagneticBtn() {
  document.querySelectorAll('.btn-magnetic, .nav-cta').forEach(btn => {
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
}

/* ── Nav scroll effect ───────────────────────────────────────────── */
function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      nav.style.padding        = '14px var(--pad-x, 48px)';
      nav.style.background     = 'rgba(6,6,6,0.85)';
      nav.style.backdropFilter = 'blur(20px)';
      nav.style.mixBlendMode   = 'normal';
      nav.style.borderBottom   = '1px solid rgba(240,237,232,0.06)';
    } else {
      nav.style.padding        = '';
      nav.style.background     = '';
      nav.style.backdropFilter = '';
      nav.style.mixBlendMode   = 'difference';
      nav.style.borderBottom   = '';
    }
  }, { passive: true });
}

/* ── Hero text parallax on mouse ─────────────────────────────────── */
function initHeroParallax() {
  const title  = document.querySelector('.hero-title');
  const bottom = document.querySelector('.hero-bottom');
  document.addEventListener('mousemove', () => {
    if (title)  title.style.transform  = `translate(${mouse.nx * -8}px,${mouse.ny * -4}px)`;
    if (bottom) bottom.style.transform = `translate(${mouse.nx * -4}px,${mouse.ny * -2}px)`;
  });
}

/* ── Testimonials hover gradient ─────────────────────────────────── */
function initTestimonialsHover() {
  document.querySelectorAll('.testi').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width)  * 100;
      const y = ((e.clientY - r.top)  / r.height) * 100;
      card.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(255,77,0,0.05) 0%, var(--surface) 65%)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.background = '';
    });
  });
}

/* ── CMS Work Grid ───────────────────────────────────────────────── */
/* Phase 3: cms-api.js is async (fetches from Supabase). We `await` the
   ready-promise so getFeatured() reads from a populated cache. The rest
   of bootSite() runs in parallel — animations + Three.js don't depend
   on the grid being painted. */
async function initWorkGrid() {
  if (typeof CMS === 'undefined') return;
  await CMS.init();

  const grid     = document.getElementById('workGrid');
  const projects = CMS.getFeatured(3);
  if (!grid || !projects.length) return;

  grid.innerHTML = projects.map((p, i) => {
    const isLarge = i === 0;
    const delay   = i === 1 ? 'style="--delay:0.15s"' : i === 2 ? 'style="--delay:0.3s"' : '';
    const idx     = String(i + 1).padStart(2, '0');
    return `
      <article class="work-item ${isLarge ? 'work-item--large' : ''} reveal" ${delay} data-cursor="view">
        <div class="work-thumb">
          <div class="work-img-wrap">
            <img class="work-img"
              src="${p.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&h=1200&fit=crop&q=80'}"
              alt="${escHtml(p.title)}" loading="lazy" />
          </div>
          <div class="work-overlay"></div>
          <div class="work-thumb-inner">
            <span class="work-year">${escHtml(p.date || '')}</span>
            <a href="case-study.html#${encodeURIComponent(p.slug)}" class="work-hover-label">View Case Study →</a>
          </div>
          <div class="work-shine"></div>
        </div>
        <div class="work-meta">
          <span class="work-index">— ${idx}</span>
          <h3>${escHtml(p.title)}</h3>
          <span class="work-tags">${escHtml((p.tags || []).join(' · '))}</span>
        </div>
      </article>`;
  }).join('');
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Loading Screen ──────────────────────────────────────────────── */
function initLoading() {
  const screen = document.getElementById('loadingScreen');
  const bar    = document.getElementById('loadingBarMini');
  const num    = document.getElementById('loadingNum');
  if (!screen) return;

  document.body.style.overflow = 'hidden';

  let progress = 0;
  const iv = setInterval(() => {
    progress += Math.random() * 16 + 4;
    if (progress >= 100) {
      progress = 100;
      clearInterval(iv);
      bar.style.setProperty('--p', '1');
      num.textContent = '100';

      setTimeout(() => {
        screen.classList.add('exit');
        setTimeout(() => {
          screen.style.display = 'none';
          document.body.style.overflow = '';
          bootSite();
        }, 1100);
      }, 360);
    } else {
      bar.style.setProperty('--p', (progress / 100).toFixed(3));
      num.textContent = String(Math.floor(progress)).padStart(3, '0');
    }
  }, 80);
}

/* ── Boot site after loading ─────────────────────────────────────── */
/* Phase 3: bootSite is now async because initWorkGrid awaits the
   Supabase fetch. We MUST populate the grid before initScrollReveals
   runs — otherwise ScrollTrigger scans the DOM, doesn't see the
   work-items (still in flight), and they stay at opacity:0 forever.
   In practice the await is near-instant: cms-api.js kicks the fetch
   from <head>, so by the time the loading screen finishes its
   ~1.5s exit transition, the data is already in cache. */
async function bootSite() {
  await initWorkGrid();
  initSmoothScroll();
  initHeroScene();
  initContactScene();
  initHeroReveal();
  initScrollReveals();
  initManifesto();
  initServicesHorizontal();
  initProcessTimeline();
  initSectionBg();
  initIndicator();
  initCounters();
  initHeroParallax();
  initMagnetic();
  initMagneticBtn();
  initNav();
  initTestimonialsHover();
  initScrollPct();

  // Refresh ScrollTrigger after everything mounts
  setTimeout(() => {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }, 200);
}

/* ── Boot ────────────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initNoise();
  initLoading();
});
