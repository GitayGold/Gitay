/* ═══════════════════════════════════════════════════════════════════
   Gitay Gold — Interactive JS
   Three.js hero + contact scenes, GSAP reveals, card tilt, cursor
   ═══════════════════════════════════════════════════════════════════ */

/* ── Global mouse state ──────────────────────────────────────────── */
const mouse = { x: 0, y: 0, nx: 0, ny: 0 };
document.addEventListener('mousemove', e => {
  mouse.x  = e.clientX;
  mouse.y  = e.clientY;
  mouse.nx = (e.clientX / window.innerWidth  - 0.5) * 2;
  mouse.ny = -(e.clientY / window.innerHeight - 0.5) * 2;
});

/* ── Custom Cursor ───────────────────────────────────────────────── */
function initCursor() {
  const cursor    = document.getElementById('cursor');
  const cursorDot = document.getElementById('cursorDot');
  const trail     = document.getElementById('cursorTrail');
  let cx = 0, cy = 0, tx = 0, ty = 0;

  document.addEventListener('mousemove', e => {
    cursorDot.style.left = e.clientX + 'px';
    cursorDot.style.top  = e.clientY + 'px';
  });

  (function tick() {
    cx += (mouse.x - cx) * 0.10;
    cy += (mouse.y - cy) * 0.10;
    cursor.style.left = cx + 'px';
    cursor.style.top  = cy + 'px';
    tx += (mouse.x - tx) * 0.06;
    ty += (mouse.y - ty) * 0.06;
    trail.style.left = tx + 'px';
    trail.style.top  = ty + 'px';
    requestAnimationFrame(tick);
  })();

  const hoverEls = 'a, button, .work-thumb, .tag, .btn-magnetic, .service-card';
  document.querySelectorAll(hoverEls).forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

/* ── Noise Canvas ────────────────────────────────────────────────── */
function initNoise() {
  const canvas = document.getElementById('noiseCanvas');
  const ctx    = canvas.getContext('2d');
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  let f = 0;
  (function draw() {
    f++;
    if (f % 3 === 0) {
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

  const canvas   = document.getElementById('heroCanvas');
  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 7;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  function wireMat(hex, opacity) {
    return new THREE.MeshBasicMaterial({ color: hex, wireframe: true, transparent: true, opacity });
  }

  /* [geometry, color, opacity, [x,y,z], [rotX,rotY], parallax] */
  const defs = [
    [new THREE.IcosahedronGeometry(2.2, 1),     0xff4d00, 0.13, [ 3.8,  0.8, -2.5], [0.0015, 0.0030], 0.45],
    [new THREE.TorusGeometry(1.6, 0.4, 10, 44), 0xf0ede8, 0.05, [-4.2,  1.8, -3.5], [0.0040, 0.0025], 0.22],
    [new THREE.OctahedronGeometry(1.1),         0xf0ede8, 0.09, [-2.2, -3.0,  0.0], [0.0060, 0.0045], 0.60],
    [new THREE.TetrahedronGeometry(0.9),        0xff4d00, 0.07, [ 4.8, -2.4, -1.0], [0.0035, 0.0070], 0.38],
    [new THREE.IcosahedronGeometry(0.7, 0),     0xf0ede8, 0.10, [ 0.5,  3.4, -0.5], [0.0055, 0.0038], 0.52],
    [new THREE.TorusGeometry(0.7, 0.2, 8, 28),  0xff4d00, 0.08, [-1.0, -1.5,  1.5], [0.0080, 0.0020], 0.30],
  ];

  const shapes = defs.map(([geo, hex, op, pos, rot, par]) => {
    const mesh = new THREE.Mesh(geo, wireMat(hex, op));
    mesh.position.set(...pos);
    scene.add(mesh);
    return { mesh, origX: pos[0], origY: pos[1], rotX: rot[0], rotY: rot[1], par };
  });

  /* Particles */
  const pCount = 900;
  const pPos   = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i*3]   = (Math.random() - 0.5) * 26;
    pPos[i*3+1] = (Math.random() - 0.5) * 26;
    pPos[i*3+2] = (Math.random() - 0.5) * 14;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xf0ede8, size: 0.022, transparent: true, opacity: 0.28 })));

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
      s.mesh.position.x += (s.origX + cx * s.par * 2.2 - s.mesh.position.x) * 0.05;
      s.mesh.position.y += (s.origY + cy * s.par * 1.8 - s.mesh.position.y) * 0.05;
    });

    renderer.domElement.style.opacity = Math.max(0, 1 - (window.scrollY / window.innerHeight) * 1.6);
    renderer.render(scene, camera);
  })();
}

/* ── Three.js Contact Scene ──────────────────────────────────────── */
function initContactScene() {
  if (typeof THREE === 'undefined') return;

  const canvas  = document.getElementById('contactCanvas');
  const section = document.getElementById('contact');
  const w = section.clientWidth;
  const h = section.clientHeight || 600;

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);

  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.9, 0.55, 128, 18),
    new THREE.MeshBasicMaterial({ color: 0xff4d00, wireframe: true, transparent: true, opacity: 0.07 })
  );
  scene.add(knot);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.0, 0.015, 4, 80),
    new THREE.MeshBasicMaterial({ color: 0xf0ede8, transparent: true, opacity: 0.05 })
  );
  scene.add(ring);

  let cx2 = 0, cy2 = 0;

  window.addEventListener('resize', () => {
    const w2 = section.clientWidth;
    const h2 = section.clientHeight || 600;
    camera.aspect = w2 / h2;
    camera.updateProjectionMatrix();
    renderer.setSize(w2, h2);
  });

  (function tick() {
    requestAnimationFrame(tick);
    cx2 += (mouse.nx - cx2) * 0.025;
    cy2 += (mouse.ny - cy2) * 0.025;
    knot.rotation.x += 0.003 + cy2 * 0.015;
    knot.rotation.y += 0.005 + cx2 * 0.015;
    ring.rotation.z += 0.002;
    ring.rotation.x  = cy2 * 0.3;
    renderer.render(scene, camera);
  })();
}

/* ── 3D Card Tilt (works on both work items & service cards) ─────── */
function initCardTilt() {
  document.querySelectorAll('[data-tilt]').forEach(card => {
    const thumb = card.querySelector('.work-thumb');
    const shine = card.querySelector('.work-shine, .card-shine');

    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = (e.clientX - r.left) / r.width  - 0.5;
      const y  = (e.clientY - r.top)  / r.height - 0.5;

      card.style.transition = 'none';
      card.style.transform  = `perspective(900px) rotateX(${-y * 14}deg) rotateY(${x * 14}deg) scale3d(1.02,1.02,1.02)`;

      if (thumb) {
        thumb.style.transition = 'none';
        thumb.style.transform  = 'translateZ(28px)';
      }

      if (shine) {
        const sx = ((e.clientX - r.left) / r.width)  * 100;
        const sy = ((e.clientY - r.top)  / r.height) * 100;
        shine.style.setProperty('--sx', sx + '%');
        shine.style.setProperty('--sy', sy + '%');
      }

      /* Service card radial glow tracks cursor */
      card.style.setProperty('--sx', ((e.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--sy', ((e.clientY - r.top)  / r.height * 100) + '%');
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.7s cubic-bezier(0.23,1,0.32,1)';
      card.style.transform  = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
      if (thumb) {
        thumb.style.transition = 'transform 0.7s cubic-bezier(0.23,1,0.32,1)';
        thumb.style.transform  = 'translateZ(0)';
      }
    });
  });
}

/* ── GSAP Scroll Reveals ─────────────────────────────────────────── */
function initScrollReveals() {
  if (typeof gsap === 'undefined') {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.transition = 'opacity .9s ease, transform .9s ease';
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

  document.querySelectorAll('.reveal').forEach(el => {
    const delay = parseFloat(getComputedStyle(el).getPropertyValue('--delay')) || 0;
    gsap.to(el, {
      opacity: 1, y: 0,
      duration: 1.1, delay,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  /* Parallax section titles */
  document.querySelectorAll('.section-title').forEach(el => {
    gsap.to(el, {
      y: -36, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.5 }
    });
  });

  /* Process line draws on scroll */
  const processLine = document.getElementById('processLine');
  if (processLine) {
    ScrollTrigger.create({
      trigger: '.process-steps',
      start: 'top 72%',
      onEnter: () => { processLine.style.width = '100%'; }
    });
  }
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
      const dur    = 1800;
      (function step(ts) {
        if (!start) start = ts;
        const prog = Math.min((ts - start) / dur, 1);
        const ease = 1 - Math.pow(1 - prog, 3);
        el.innerHTML = Math.floor(ease * target) + sup;
        if (prog < 1) requestAnimationFrame(step);
        else el.innerHTML = target + sup;
      })(performance.now());
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  els.forEach(el => obs.observe(el));
}

/* ── Text Scramble ───────────────────────────────────────────────── */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#';
function scramble(el, final, duration = 750) {
  let t0 = null;
  const len = final.length;
  (function frame(ts) {
    if (!t0) t0 = ts;
    const prog = Math.min((ts - t0) / duration, 1);
    const done = Math.floor(prog * len);
    let out = '';
    for (let i = 0; i < len; i++) {
      if (final[i] === ' ') { out += ' '; continue; }
      out += i < done ? final[i] : CHARS[Math.random() * CHARS.length | 0];
    }
    el.textContent = out;
    if (prog < 1) requestAnimationFrame(frame);
    else el.textContent = final;
  })(performance.now());
}

setTimeout(() => {
  document.querySelectorAll('[data-scramble]').forEach((el, i) => {
    setTimeout(() => scramble(el, el.getAttribute('data-scramble')), i * 200);
  });
}, 1100);

/* ── Magnetic Button ─────────────────────────────────────────────── */
function initMagneticBtn() {
  const btn = document.getElementById('contactBtn');
  if (!btn) return;
  btn.addEventListener('mousemove', e => {
    const r  = btn.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width  / 2)) * 0.38;
    const dy = (e.clientY - (r.top  + r.height / 2)) * 0.38;
    btn.style.transition = 'none';
    btn.style.transform  = `translate(${dx}px,${dy}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transition = 'transform .6s cubic-bezier(.23,1,.32,1)';
    btn.style.transform  = 'translate(0,0)';
  });
}

/* ── Nav Scroll Effect ───────────────────────────────────────────── */
function initNav() {
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      nav.style.padding        = '16px 48px';
      nav.style.background     = 'rgba(6,6,6,0.9)';
      nav.style.backdropFilter = 'blur(24px)';
      nav.style.mixBlendMode   = 'normal';
      nav.style.borderBottom   = '1px solid rgba(240,237,232,0.05)';
    } else {
      nav.style.padding        = '';
      nav.style.background     = '';
      nav.style.backdropFilter = '';
      nav.style.mixBlendMode   = 'difference';
      nav.style.borderBottom   = '';
    }
  }, { passive: true });
}

/* ── Hero Text Parallax on mouse ─────────────────────────────────── */
function initHeroParallax() {
  const title  = document.querySelector('.hero-title');
  const bottom = document.querySelector('.hero-bottom');
  document.addEventListener('mousemove', () => {
    if (title)  title.style.transform  = `translate(${mouse.nx * -10}px,${mouse.ny * -5}px)`;
    if (bottom) bottom.style.transform = `translate(${mouse.nx * -5}px,${mouse.ny * -3}px)`;
  });
}

/* ── Testimonials hover glow ─────────────────────────────────────── */
function initTestimonials() {
  document.querySelectorAll('.testimonial').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = ((e.clientX - r.left) / r.width)  * 100;
      const y  = ((e.clientY - r.top)  / r.height) * 100;
      card.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(255,77,0,0.04) 0%, var(--surface) 60%)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.background = '';
    });
  });
}

/* ── CMS Work Grid ───────────────────────────────────────────────── */
function initWorkGrid() {
  if (typeof CMS === 'undefined') return;
  CMS.init();

  const grid     = document.getElementById('workGrid');
  const projects = CMS.getFeatured(3);
  if (!grid || !projects.length) return;

  grid.innerHTML = projects.map((p, i) => {
    const isLarge = i === 0;
    const delay   = i === 1 ? 'style="--delay:0.15s"' : i === 2 ? 'style="--delay:0.3s"' : '';
    return `
      <div class="work-item ${isLarge ? 'work-item--large' : ''} reveal" ${delay}>
        <div class="work-thumb">
          <img class="work-img"
            src="${p.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&h=1200&fit=crop&q=80'}"
            alt="${escHtml(p.title)}" loading="lazy" />
          <div class="work-overlay"></div>
          <div class="work-thumb-inner">
            <span class="work-year">${escHtml(p.date || '')}</span>
            <a href="case-study.html#${encodeURIComponent(p.slug)}" class="work-hover-label">View Case Study →</a>
          </div>
          <div class="work-shine"></div>
        </div>
        <div class="work-meta">
          <h3>${escHtml(p.title)}</h3>
          <span>${escHtml((p.tags || []).join(', '))}</span>
        </div>
      </div>`;
  }).join('');
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Loading Screen ──────────────────────────────────────────────── */
function initLoading() {
  const screen = document.getElementById('loadingScreen');
  const bar    = document.getElementById('loadingBar');
  const num    = document.getElementById('loadingNum');

  document.body.style.overflow = 'hidden';

  let progress = 0;
  const iv = setInterval(() => {
    progress += Math.random() * 18 + 4;
    if (progress >= 100) {
      progress = 100;
      clearInterval(iv);
      bar.style.width  = '100%';
      num.textContent  = '100';

      setTimeout(() => {
        screen.classList.add('exit');
        setTimeout(() => {
          screen.style.display = 'none';
          document.body.style.overflow = '';
          initWorkGrid();
          initHeroScene();
          initContactScene();
          initCardTilt();
          initScrollReveals();
          initCounters();
          initHeroParallax();
          initMagneticBtn();
          initNav();
          initTestimonials();
        }, 1050);
      }, 300);
    } else {
      bar.style.width  = progress + '%';
      num.textContent  = Math.floor(progress);
    }
  }, 85);
}

/* ── Boot ────────────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initNoise();
  initLoading();
});
