const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

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

  const base = path.join(ROOT, urlPath);
  // If the request has no extension, also try base.html and base/index.html
  const candidates = path.extname(base)
    ? [base]
    : [base, base + '.html', path.join(base, 'index.html')];

  tryServe(res, candidates);
}).listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
