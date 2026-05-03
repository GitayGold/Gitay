/* ═══════════════════════════════════════════════════════════════════
   Gitay Gold — Admin Panel JS
   ───────────────────────────────────────────────────────────────────
   ARCHIVED IN PHASE 3 — do not load from the live site.
   Active admin lives at ../admin-next/ (Next.js + Supabase).
   Production: https://admin.gitaygold.com  ·  Local: http://localhost:3001
   See ../legacy/README.md for context.
   ═══════════════════════════════════════════════════════════════════ */

const ADMIN_PASS    = '123456';
const SESSION_KEY   = 'gg_admin_session';

/* ── Auth ────────────────────────────────────────────────────────── */
function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === 'ok';
}
function login(pass) {
  if (pass === ADMIN_PASS) {
    sessionStorage.setItem(SESSION_KEY, 'ok');
    return true;
  }
  return false;
}
function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  showView('login');
}

/* ── Views ───────────────────────────────────────────────────────── */
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  const map = { login: 'viewLogin', dashboard: 'viewDashboard', editor: 'viewEditor' };
  document.getElementById(map[name]).classList.remove('hidden');
}

/* ── Dashboard ───────────────────────────────────────────────────── */
function renderDashboard() {
  const projects = CMS.getAll();
  const tbody    = document.getElementById('projectsTableBody');
  const empty    = document.getElementById('emptyState');
  const count    = document.getElementById('projectCount');

  count.textContent = `${projects.length} project${projects.length !== 1 ? 's' : ''}`;

  if (!projects.length) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tbody.innerHTML = projects.map(p => `
    <tr>
      <td>
        <div class="project-name">${esc(p.title)}</div>
        <div class="project-slug">${esc(p.slug)}</div>
      </td>
      <td>${esc(p.client || '—')}</td>
      <td><span class="category-pill">${esc(CMS.CATEGORIES[p.category] || p.category || '—')}</span></td>
      <td>${esc(p.date || '—')}</td>
      <td>
        <span class="status-dot ${p.visible !== false ? 'status-dot--on' : 'status-dot--off'}"></span>
        ${p.visible !== false ? 'Live' : 'Hidden'}
        ${p.featured ? ' · ⭐' : ''}
      </td>
      <td>
        <div class="table-actions">
          <a href="case-study.html#${encodeURIComponent(p.slug)}" target="_blank" class="preview-link">Preview ↗</a>
          <button class="btn-icon btn-icon--edit" title="Edit" onclick="openEditor('${p.id}')">✏</button>
          <button class="btn-icon" title="Delete" onclick="confirmDelete('${p.id}', '${esc(p.title)}')">✕</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function confirmDelete(id, title) {
  if (confirm(`Delete "${title}"?\nThis cannot be undone.`)) {
    CMS.remove(id);
    renderDashboard();
  }
}

/* ── Editor state ────────────────────────────────────────────────── */
let editingId = null;

function openEditor(id = null) {
  editingId = id;
  const form  = document.getElementById('editorForm');
  const title = document.getElementById('editorTitleBar');

  form.reset();
  document.getElementById('kpiList').innerHTML    = '';
  document.getElementById('blocksList').innerHTML = '';
  document.getElementById('heroPreview').classList.remove('show');
  document.getElementById('thumbPreview').classList.remove('show');

  if (id) {
    const p = CMS.getById(id);
    if (!p) return;
    title.textContent = p.title;
    fillForm(form, p);
  } else {
    title.textContent = 'New Project';
    setVal(form, 'visible', true);
    setVal(form, 'featured', false);
  }

  showView('editor');
  window.scrollTo(0, 0);
}

function fillForm(form, p) {
  setVal(form, 'title',     p.title      || '');
  setVal(form, 'client',    p.client     || '');
  setVal(form, 'date',      p.date       || '');
  setVal(form, 'category',  p.category   || 'web');
  setVal(form, 'tagsRaw',   (p.tags || []).join(', '));
  setVal(form, 'shortDesc', p.shortDesc  || '');
  setVal(form, 'heroImage', p.heroImage  || '');
  setVal(form, 'thumbnail', p.thumbnail  || '');
  setVal(form, 'liveUrl',   p.liveUrl    || '');
  setVal(form, 'challenge', p.challenge  || '');
  setVal(form, 'solution',  p.solution   || '');
  setVal(form, 'results',   p.results    || '');
  setVal(form, 'featured',  !!p.featured);
  setVal(form, 'visible',   p.visible !== false);

  updatePreview('heroImage', 'heroPreview');
  updatePreview('thumbnail', 'thumbPreview');

  (p.kpis   || []).forEach(k => addKpiRow(k.label, k.value));
  (p.blocks || []).forEach(b => addBlock(b.type, b));
}

/* ── Save ────────────────────────────────────────────────────────── */
function saveProject() {
  const form = document.getElementById('editorForm');
  const title = form.querySelector('[name="title"]').value.trim();
  if (!title) {
    alert('Project title is required.');
    form.querySelector('[name="title"]').focus();
    return;
  }

  const data = {
    title,
    client:    form.querySelector('[name="client"]').value.trim(),
    date:      form.querySelector('[name="date"]').value.trim(),
    category:  form.querySelector('[name="category"]').value,
    tags:      form.querySelector('[name="tagsRaw"]').value.split(',').map(t => t.trim()).filter(Boolean),
    shortDesc: form.querySelector('[name="shortDesc"]').value.trim(),
    heroImage: form.querySelector('[name="heroImage"]').value.trim(),
    thumbnail: form.querySelector('[name="thumbnail"]').value.trim(),
    liveUrl:   form.querySelector('[name="liveUrl"]').value.trim(),
    challenge: form.querySelector('[name="challenge"]').value.trim(),
    solution:  form.querySelector('[name="solution"]').value.trim(),
    results:   form.querySelector('[name="results"]').value.trim(),
    featured:  form.querySelector('[name="featured"]').checked,
    visible:   form.querySelector('[name="visible"]').checked,
    kpis:      collectKpis(),
    blocks:    collectBlocks()
  };

  if (editingId) {
    CMS.update(editingId, data);
  } else {
    CMS.add(data);
  }

  renderDashboard();
  showView('dashboard');
}

/* ── KPI rows ────────────────────────────────────────────────────── */
function addKpiRow(label = '', value = '') {
  const list = document.getElementById('kpiList');
  const row  = document.createElement('div');
  row.className = 'kpi-row';
  row.innerHTML = `
    <input type="text" placeholder="Label (e.g. Conversion Rate)" value="${esc(label)}" data-kpi-label />
    <input type="text" placeholder="Value (e.g. +340%)" value="${esc(value)}" data-kpi-value />
    <button type="button" class="btn-icon" onclick="this.closest('.kpi-row').remove()">✕</button>
  `;
  list.appendChild(row);
}

function collectKpis() {
  return [...document.querySelectorAll('.kpi-row')].map(row => ({
    label: row.querySelector('[data-kpi-label]').value.trim(),
    value: row.querySelector('[data-kpi-value]').value.trim()
  })).filter(k => k.label || k.value);
}

/* ── Content blocks ──────────────────────────────────────────────── */
function addBlock(type, data = {}) {
  const list  = document.getElementById('blocksList');
  const block = document.createElement('div');
  block.className = 'block-item';
  block.dataset.type = type;

  const labels = { text: 'Text Block', image: 'Image Block', quote: 'Quote Block', list: 'List Block' };

  let fields = '';
  if (type === 'text') {
    fields = `<textarea placeholder="Write your paragraph here…" data-block-content rows="5">${esc(data.content || '')}</textarea>`;
  }
  if (type === 'image') {
    fields = `
      <input type="url" placeholder="Image URL" data-block-url value="${esc(data.url || '')}" />
      <input type="text" placeholder="Caption (optional)" data-block-caption value="${esc(data.caption || '')}" />
    `;
  }
  if (type === 'quote') {
    fields = `
      <textarea placeholder="Quote text…" data-block-content rows="3">${esc(data.content || '')}</textarea>
      <input type="text" placeholder="Author / Attribution" data-block-author value="${esc(data.author || '')}" />
    `;
  }
  if (type === 'list') {
    const raw = Array.isArray(data.items) ? data.items.join('\n') : (data.items || '');
    fields = `<textarea placeholder="One item per line…" data-block-items rows="5">${esc(raw)}</textarea>`;
  }

  block.innerHTML = `
    <div class="block-header">
      <span class="block-type-tag">${labels[type] || type}</span>
      <button type="button" class="btn-icon" onclick="this.closest('.block-item').remove()">✕</button>
    </div>
    <div class="block-fields">${fields}</div>
  `;
  list.appendChild(block);
}

function collectBlocks() {
  return [...document.querySelectorAll('.block-item')].map(el => {
    const type = el.dataset.type;
    if (type === 'text')  return { type, content: el.querySelector('[data-block-content]').value.trim() };
    if (type === 'image') return { type, url: el.querySelector('[data-block-url]').value.trim(), caption: el.querySelector('[data-block-caption]').value.trim() };
    if (type === 'quote') return { type, content: el.querySelector('[data-block-content]').value.trim(), author: el.querySelector('[data-block-author]').value.trim() };
    if (type === 'list')  return { type, items: el.querySelector('[data-block-items]').value.split('\n').map(s => s.trim()).filter(Boolean) };
    return null;
  }).filter(Boolean);
}

/* ── Image previews ──────────────────────────────────────────────── */
function updatePreview(inputName, previewId) {
  const input   = document.querySelector(`[name="${inputName}"]`);
  const preview = document.getElementById(previewId);
  const url     = input?.value.trim();
  if (url) {
    preview.innerHTML = `<img src="${url}" alt="" onerror="this.parentElement.classList.remove('show')" />`;
    preview.classList.add('show');
  } else {
    preview.classList.remove('show');
  }
}

/* ── Helpers ─────────────────────────────────────────────────────── */
function setVal(form, name, value) {
  const el = form.querySelector(`[name="${name}"]`);
  if (!el) return;
  if (el.type === 'checkbox') el.checked = !!value;
  else el.value = value;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

/* ── Boot ────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  CMS.init();

  /* Route on load */
  if (isLoggedIn()) {
    renderDashboard();
    showView('dashboard');
  } else {
    showView('login');
  }

  /* Login form */
  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const pass  = document.getElementById('loginPassword').value;
    const error = document.getElementById('loginError');
    if (login(pass)) {
      error.classList.remove('show');
      renderDashboard();
      showView('dashboard');
    } else {
      error.classList.add('show');
      document.getElementById('loginPassword').value = '';
      document.getElementById('loginPassword').focus();
    }
  });

  /* Logout */
  document.getElementById('logoutBtn').addEventListener('click', logout);

  /* New project */
  document.getElementById('newProjectBtn').addEventListener('click', () => openEditor(null));

  /* Editor back / cancel / save */
  document.getElementById('editorBackBtn').addEventListener('click', () => {
    renderDashboard();
    showView('dashboard');
  });
  document.getElementById('editorCancelBtn').addEventListener('click', () => {
    renderDashboard();
    showView('dashboard');
  });
  document.getElementById('editorSaveBtn').addEventListener('click', saveProject);

  /* Add KPI */
  document.getElementById('addKpiBtn').addEventListener('click', () => addKpiRow());

  /* Add blocks */
  document.querySelectorAll('[data-add-block]').forEach(btn => {
    btn.addEventListener('click', () => addBlock(btn.dataset.addBlock));
  });

  /* Image URL preview on blur */
  ['heroImage', 'thumbnail'].forEach(name => {
    const idMap = { heroImage: 'heroPreview', thumbnail: 'thumbPreview' };
    document.querySelector(`[name="${name}"]`)?.addEventListener('input', () => {
      updatePreview(name, idMap[name]);
    });
  });
});
