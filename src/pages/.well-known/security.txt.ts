import type { APIRoute } from 'astro';
import { links } from '../../lib/site';

// RFC 9116. `Expires` is set a year after each build, so every deploy
// renews it.
export const GET: APIRoute = ({ site }) => {
  const email = links.contact.find((item) => item.id === 'email');
  const expires = new Date();
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);

  const body = [
    email ? `Contact: ${email.href}` : '',
    `Expires: ${expires.toISOString()}`,
    'Preferred-Languages: en',
    `Canonical: ${new URL('/.well-known/security.txt', site).href}`,
    `Policy: ${new URL('/security', site).href}`,
    '',
  ]
    .filter((line, i, all) => line !== '' || i === all.length - 1)
    .join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
