import site from '../content/site.json';
import links from '../content/links.json';

export { site, links };

/** Primary navigation. The terminal's `cd` command reads the same list. */
export const nav = [
  { id: 'writeups', label: 'Write-ups', href: '/writeups' },
  { id: 'projects', label: 'Projects', href: '/projects' },
  { id: 'security', label: 'Security', href: '/security' },
  { id: 'contact', label: 'Contact', href: '/#contact' },
] as const;

/** The terminal is its own page, linked from the navigation and the hero. */
export const terminal = { label: 'Terminal', href: '/terminal' } as const;

/** Sections `cd` can jump to: every nav entry plus the home page anchors. */
export const sections: Record<string, string> = {
  '~': '/',
  home: '/',
  ...Object.fromEntries(nav.map((item) => [item.id, item.href])),
  work: '/#work',
  about: '/#about',
  focus: '/#focus',
};
