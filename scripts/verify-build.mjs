// Runs after `astro build`. Fails the build if the output would break the
// Content-Security-Policy or if the flag hunt is inconsistent.
//
//   1. No inline <script>, <style>, style="" or on*="" in any page.
//   2. Every script, stylesheet, image, font and icon comes from this origin.
//   3. The policy in vercel.json contains no unsafe-* keyword.
//   4. The flags the site serves match the digests the terminal checks.
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const problems = [];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
}

const files = await walk(dist);
const pages = files.filter((file) => file.endsWith('.html'));

for (const file of pages) {
  const name = relative(dist, file).replaceAll('\\', '/');
  const html = await readFile(file, 'utf8');

  for (const [tag, attrs] of [...html.matchAll(/<script\b([^>]*)>/gi)].map((m) => [m[0], m[1]])) {
    if (!/\bsrc\s*=/.test(attrs)) problems.push(`${name}: inline script ${tag}`);
  }
  if (/<style\b/i.test(html)) problems.push(`${name}: inline <style> element`);

  // Attributes are only checked inside tags, so prose that mentions
  // style="" or onerror= in text does not trip the check.
  for (const [tag] of html.matchAll(/<[a-z][^>]*>/gi)) {
    if (/\sstyle\s*=/i.test(tag)) problems.push(`${name}: inline style attribute in ${tag.slice(0, 80)}`);
    if (/\son[a-z]+\s*=/i.test(tag)) problems.push(`${name}: event-handler attribute in ${tag.slice(0, 80)}`);
    if (/=\s*["']?\s*javascript:/i.test(tag)) problems.push(`${name}: javascript: URL in ${tag.slice(0, 80)}`);

    const resource = tag.match(/^<(script|img|source|link|iframe|video|audio|object|embed)\b/i);
    if (!resource) continue;
    const isAnchorLike = /^<link\b/i.test(tag) && /rel=["']?(canonical|me|alternate)/i.test(tag);
    if (isAnchorLike) continue;
    for (const [, , url] of tag.matchAll(/\s(src|href)=["']?([^"'\s>]+)/gi)) {
      if (/^(https?:)?\/\//i.test(url) || /^data:/i.test(url)) {
        problems.push(`${name}: resource from another origin: ${url}`);
      }
    }
    for (const [, set] of tag.matchAll(/\ssrcset=["']([^"']+)/gi)) {
      if (/(^|,\s*)(https?:)?\/\//i.test(set)) problems.push(`${name}: srcset from another origin`);
    }
  }
}

// Policy
const vercel = JSON.parse(await readFile(join(root, 'vercel.json'), 'utf8'));
const headers = vercel.headers.flatMap((rule) => rule.headers);
const csp = headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
if (!csp) problems.push('vercel.json: no Content-Security-Policy header');
if (/unsafe-(inline|eval|hashes)/.test(csp)) problems.push('vercel.json: policy contains an unsafe-* keyword');
if (!/default-src 'none'/.test(csp)) problems.push("vercel.json: policy should start from default-src 'none'");

// Flags
const sha256 = (text) => createHash('sha256').update(text).digest('hex');
const flagsSource = await readFile(join(root, 'src/scripts/terminal/flags.ts'), 'utf8');
const digest = (id) => flagsSource.match(new RegExp(`${id}: '([0-9a-f]{64})'`))?.[1];
const flagIn = (text) => text.match(/FLAG\{[^}]+\}/)?.[0] ?? '';

const robots = await readFile(join(dist, 'robots.txt'), 'utf8').catch(() => '');
const headerFlag = headers.find((h) => /FLAG\{/.test(h.value))?.value ?? '';
const encoded = flagsSource.match(/atob\('([^']+)'\)/)?.[1] ?? '';

const served = {
  robots: flagIn(robots),
  header: flagIn(headerFlag),
  notes: flagIn(Buffer.from(encoded, 'base64').toString('utf8')),
};
for (const [id, flag] of Object.entries(served)) {
  if (!flag) problems.push(`flag "${id}" is missing from where it should be served`);
  else if (sha256(flag) !== digest(id)) problems.push(`flag "${id}" does not match its digest in flags.ts`);
}
if (new Set(Object.values(served)).size !== 3) problems.push('the three flags must be different');

// The hidden-command flag must not be readable in the page source.
for (const file of pages) {
  const html = await readFile(file, 'utf8');
  if (served.notes && html.includes(served.notes)) {
    problems.push(`${relative(dist, file)}: the hidden-command flag appears in the HTML`);
  }
}

if (problems.length > 0) {
  console.error(`\nverify-build: ${problems.length} problem(s)\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`verify-build: ${pages.length} pages checked, policy and flags consistent.`);
