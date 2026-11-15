// Serves the production build from dist/ with the response headers from
// vercel.json, so the Content-Security-Policy can be tested locally before
// deploying. `astro preview` is not available with the Vercel adapter.
//
// Usage: npm run build && npm run preview   (PORT=4321 by default)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT ?? 4321);

const vercel = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
const headerRules = (vercel.headers ?? []).map((rule) => ({
  pattern: new RegExp(`^${rule.source}$`),
  headers: rule.headers,
}));

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};
const compressible = new Set(['.html', '.css', '.js', '.json', '.xml', '.txt', '.svg']);

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

/** Map a URL path to a file inside dist/, the way Vercel serves the build. */
async function resolve(pathname) {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, '');
  const base = join(root, safe);
  if (base !== root.slice(0, -1) && !base.startsWith(root)) return null; // path traversal
  for (const candidate of [base, `${base}.html`, join(base, 'index.html')]) {
    if (candidate.startsWith(root) && (await isFile(candidate))) return candidate;
  }
  return null;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  let { pathname } = url;

  for (const rule of headerRules) {
    if (!rule.pattern.test(pathname)) continue;
    for (const { key, value } of rule.headers) res.setHeader(key, value);
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  // trailingSlash: 'never'
  if (pathname.length > 1 && pathname.endsWith('/')) {
    res.writeHead(308, { Location: pathname.replace(/\/+$/, '') + url.search }).end();
    return;
  }

  let status = 200;
  let file = null;
  try {
    file = await resolve(pathname);
  } catch {
    file = null;
  }
  if (!file) {
    status = 404;
    file = join(root, '404.html');
    if (!(await isFile(file))) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }
  }

  const ext = extname(file).toLowerCase();
  let body = await readFile(file);
  res.setHeader('Content-Type', types[ext] ?? 'application/octet-stream');
  res.setHeader(
    'Cache-Control',
    pathname.startsWith('/_astro/')
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=0, must-revalidate',
  );

  if (compressible.has(ext)) {
    const accepts = String(req.headers['accept-encoding'] ?? '');
    res.setHeader('Vary', 'Accept-Encoding');
    if (/\bbr\b/.test(accepts)) {
      body = brotliCompressSync(body);
      res.setHeader('Content-Encoding', 'br');
    } else if (/\bgzip\b/.test(accepts)) {
      body = gzipSync(body);
      res.setHeader('Content-Encoding', 'gzip');
    }
  }

  res.setHeader('Content-Length', body.length);
  res.writeHead(status);
  res.end(req.method === 'HEAD' ? undefined : body);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Preview with vercel.json headers: http://localhost:${port}`);
  if (!root.endsWith(sep)) console.warn('Unexpected dist path:', root);
});
