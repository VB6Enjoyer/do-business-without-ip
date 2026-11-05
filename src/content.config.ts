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
    /** Wayback Machine snapshot nearest July 2014, or null when none exists. */
    archiveUrl: z.url().nullable(),
    /**
     * Result of the last link check: `live` (original resolves), `dead` (gone),
     * `unverified` (the site blocks automated checks). Readers are sent to the
     * original only when it is live; otherwise to the archived copy.
     */
    linkStatus: z.enum(['live', 'dead', 'unverified']),
    /** Date of the last link check (YYYY-MM-DD). */
    checkedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** Short editorial remark about the link itself (e.g. why the archive is used). */
    linkNote: z.string().nullable(),
  }),
});

/**
 * "Since 2014" editorial updates. Each is anchored in the text with
 * <Since2014 id="…" /> and must cite its sources.
 */
const updates = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/updates' }),
  schema: z.object({
    title: z.string(),
    /** Display order; should follow the order of the markers in the guide. */
    order: z.number().int().positive(),
    sources: z.array(z.object({ title: z.string(), publisher: z.string(), url: z.url() })).min(1),
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

export const collections = { guide, footnotes, updates, meta };
