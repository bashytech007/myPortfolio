import type { APIRoute } from 'astro';
import { getWriteups } from '../lib/content';

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);

export const GET: APIRoute = async ({ site }) => {
  const published = (await getWriteups()).filter((entry) => !entry.data.draft);
  const paths = ['/', '/writeups', '/projects', '/security', '/terminal', ...published.map((entry) => `/writeups/${entry.id}`)];

  const urls = paths
    .map((path) => `  <url><loc>${escapeXml(new URL(path, site).href)}</loc></url>`)
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
