import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Projects: one Markdown file per build in src/content/projects.
 * `kind` decides which group it appears under on /projects.
 */
const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** One line: what it is or what it achieved. */
      summary: z.string(),
      kind: z.enum(['security', 'development']),
      tags: z.array(z.string()).default([]),
      /** Screenshot, relative to the Markdown file. Shown as a card when set. */
      image: image().optional(),
      imageAlt: z.string().optional(),
      live: z.string().optional(),
      liveLabel: z.string().default('Live site'),
      source: z.string().optional(),
      /** Show on the home page. */
      featured: z.boolean().default(false),
      order: z.number().default(100),
      /** Drafts only appear in `npm run dev` or when SHOW_DRAFTS=true. */
      draft: z.boolean().default(false),
    }),
});

/**
 * Write-ups: one Markdown file per case study in src/content/writeups.
 * The body must use the five template headings (see src/lib/content.ts).
 */
const writeups = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/writeups' }),
  schema: z.object({
    title: z.string(),
    /** One sentence: what was wrong and what it allowed. */
    summary: z.string(),
    date: z.coerce.date(),
    /** What was tested, for example "Web application" or "LLM agent". */
    target: z.string().optional(),
    tags: z.array(z.string()).default([]),
    /** Drafts only appear in `npm run dev` or when SHOW_DRAFTS=true. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects, writeups };
