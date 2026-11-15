import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// The canonical URL of the deployed site. Set SITE_URL in the Vercel project
// settings once the domain is final; until then the Vercel production URL is
// used so canonical links and Open Graph images still resolve.
const site =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:4321');

export default defineConfig({
  site,
  output: 'static',
  adapter: vercel(),
  trailingSlash: 'never',
  compressHTML: true,
  devToolbar: { enabled: false },
  build: {
    // The Content-Security-Policy allows no inline styles or scripts, so
    // everything is emitted as a file.
    inlineStylesheets: 'never',
  },
  vite: {
    build: { assetsInlineLimit: 0 },
  },
  markdown: {
    // Shiki highlights with inline style attributes, which the CSP blocks.
    syntaxHighlight: false,
  },
});
