import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${new URL('/sitemap.xml', site).href}`,
    '',
    '# You read robots.txt before anything else. Good habit.',
    '# It is a request to crawlers, not a lock on a door.',
    '# FLAG{r0b0ts_txt_is_n0t_acc3ss_c0ntrol}',
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
