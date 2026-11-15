import site from '../content/site.json';
import links from '../content/links.json';

export { site, links };

/**
 * One entry on the experience timeline. `start` and `end` are "YYYY-MM".
 * An entry with no `end` is a current role and is shown as "Present".
 */
export interface Job {
  role: string;
  org: string;
  start: string;
  end?: string;
}

/** Newest first, in the order written in site.json. */
export const experience: Job[] = site.experience;

/** Roles held now. The hero and the about facts list their organisations. */
export const currentJobs = experience.filter((job) => !job.end);

const monthFormat = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "2025-03" becomes "Mar 2025". */
export function formatMonth(month: string): string {
  return monthFormat.format(new Date(`${month}-01T00:00:00Z`));
}

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
  experience: '/#experience',
  focus: '/#focus',
};
