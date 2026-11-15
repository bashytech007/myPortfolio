// Checks every text/background pair used by the design against WCAG AA.
// Usage: node scripts/contrast.mjs
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');

function tokens(block) {
  const out = {};
  for (const m of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)) out[m[1]] = m[2];
  return out;
}

const dark = tokens(css.slice(css.indexOf('/* Dark theme'), css.indexOf(":root[data-theme='light']")));
const lightStart = css.indexOf(":root[data-theme='light']");
const light = tokens(css.slice(lightStart, css.indexOf('}', lightStart)));

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const f = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [foreground, background, minimum ratio]
const pairs = [
  ['text', 'bg', 4.5], ['text', 'surface', 4.5], ['text', 'surface-2', 4.5],
  ['text', 'bg-alt', 4.5],
  // Secondary text is held well above the 4.5 minimum.
  ['muted', 'bg', 7], ['muted', 'bg-alt', 7], ['muted', 'surface', 7], ['muted', 'surface-2', 7],
  ['accent', 'bg-alt', 4.5],
  ['accent', 'bg', 4.5], ['accent', 'surface', 4.5], ['accent', 'surface-2', 4.5],
  ['accent-hover', 'bg', 4.5], ['accent-hover', 'surface', 4.5],
  ['on-accent', 'accent', 4.5], ['on-accent', 'accent-hover', 4.5],
  ['border-strong', 'bg', 1.5],
];

let failed = false;
for (const [name, theme] of [['dark', dark], ['light', light]]) {
  console.log(`\n${name}`);
  for (const [fg, bg, min] of pairs) {
    const r = ratio(theme[fg], theme[bg]);
    const ok = r >= min;
    if (!ok) failed = true;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${fg} on ${bg}: ${r.toFixed(2)} (min ${min})`);
  }
}
process.exit(failed ? 1 : 0);
