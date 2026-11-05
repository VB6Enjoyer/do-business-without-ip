import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** The guide itself: one MDX file per top-level section, grouped by language folder. */
const guide = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/guide' }),
  schema: z.object({
    title: z.string(),
    /** Position in the guide (1-based). */
    order: z.number().int().positive(),
    /** Page of the 2014 PDF where the section starts. */
    originalPage: z.number().int().positive(),
  }),
});

/**
 * Footnotes, keyed `<lang>-<n>`. The in-text links (<Ref>) read their URL from
 * here, so this file is the single source of truth for every link in the guide.
 */
const footnotes = defineCollection({
  loader: file('src/content/footnotes/en.json', {
    parser: (text) =>
      (JSON.parse(text) as Array<{ n: number }>).map((fn) => ({
        id: `en-${fn.n}`,
        lang: 'en',
        ...fn,
      })),
  }),
  schema: z.object({
    lang: z.string(),
    n: z.number().int().positive(),
    /** The linked phrase in the text, used as the note's title. */
    label: z.string(),
    /** URL exactly as printed in the 2014 PDF. */
    originalUrl: z.url(),
    /** Wayback Machine snapshot, filled in Phase 3. Preferred over originalUrl when set. */
    archiveUrl: z.url().nullable(),
    /** Editorial "Since 2014" note for this footnote, if any. */
    note: z.string().nullable(),
  }),
});

/** Supporting text: author bio, disclaimer. */
const meta = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/meta' }),
  schema: z.object({
    title: z.string(),
    /** Where the text comes from and how (if at all) it was adapted. */
    source: z.string(),
  }),
});

export const collections = { guide, footnotes, meta };
