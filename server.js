const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

/* ── 410 Gone for retired legacy admin paths ───────────────────────
   Phase 3 retired admin.html in favor of admin-next/ (Next.js on :3001).
   Returning 410 (rather than 404) signals "this resource intentionally
   went away" to bots and bookmarks. The HTML body is the friendly
   user-facing message. In production, vercel.json redirects these same
   paths to the admin subdomain — this handler is the local-dev
   equivalent.
   ─────────────────────────────────────────────────────────────────── */
const GONE_PATHS = new Set(['/admin', '/admin.html', '/admin.js', '/admin.css']);
const GONE_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" />
<title>The classic admin has moved</title>
<style>
  html, body { margin: 0; height: 100%; }
  body { background:#060606; color:#f0ede8; font:16px/1.5 'Inter', system-ui, sans-serif;
         display:flex; align-items:center; justify-content:center; padding:24px; }
  .wrap { max-width: 480px; text-align: center; }
  h1 { font-size: 1.6rem; font-weight: 700; letter-spacing:-0.02em; margin: 0 0 8px; }
  p  { color:#888375; margin: 0 0 24px; }
  a  { display: inline-flex; align-items: center; gap: 8px;
       padding: 12px 22px; border-radius: 999px;
       background:#f0ede8; color:#060606; font-weight: 600; text-decoration: none;
       transition: background .2s, color .2s; }
  a:hover { background:#ff4d00; color:#f0ede8; }
  code { font-family: ui-monospace, monospace; font-size: 0.85em; opacity: 0.7; }
</style>
</head><body>
  <div class="wrap">
    <h1>The classic admin has moved.</h1>
    <p>It now lives at the Next.js app in <code>admin-next/</code>.<br/>
       Locally: open <code>http://localhost:3001/admin/dashboard</code>.</p>
    <a href="http://localhost:3001/admin/dashboard">Open admin →</a>
  </div>
</body></html>`;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

function send(res, filePath) {
  const ext  = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime, 'Access-Control-Allow-Origin': '*' });
    res.end(data);
  });
}

function tryServe(res, candidates) {
  const next = i => {
    if (i >= candidates.length) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    fs.stat(candidates[i], (err, st) => {
      if (!err && st.isFile()) return send(res, candidates[i]);
      next(i + 1);
    });
  };
  next(0);
}

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0].split('#')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  // Retire the legacy admin paths with a friendly 410.
  if (GONE_PATHS.has(urlPath)) {
    res.writeHead(410, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(GONE_HTML);
    return;
  }

  const base = path.join(ROOT, urlPath);
  // If the request has no extension, also try base.html and base/index.html
  const candidates = path.extname(base)
    ? [base]
    : [base, base + '.html', path.join(base, 'index.html')];

  tryServe(res, candidates);
}).listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
