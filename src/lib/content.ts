import { getCollection, type CollectionEntry } from 'astro:content';
import { SHOW_DRAFTS } from 'astro:env/server';

export type Project = CollectionEntry<'projects'>;
export type Writeup = CollectionEntry<'writeups'>;

/** Drafts are visible while developing, and in a build only when asked for. */
export const showDrafts: boolean = import.meta.env.DEV || SHOW_DRAFTS;

/** Every write-up uses these sections, in this order, as its `##` headings. */
export const WRITEUP_SECTIONS = ['Context', 'Threat model', 'Finding', 'Impact', 'Fix'] as const;

export async function getProjects(): Promise<Project[]> {
  const entries = await getCollection('projects', ({ data }) => showDrafts || !data.draft);
  return entries.sort((a, b) => a.data.order - b.data.order);
}

export async function getWriteups(): Promise<Writeup[]> {
  const entries = await getCollection('writeups', ({ data }) => showDrafts || !data.draft);
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(date: Date): string {
  return dateFormat.format(date);
}

/** True for links that leave the site. */
export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}
