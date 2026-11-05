import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { defaultLang, type Lang } from '../i18n';

export type Footnote = CollectionEntry<'footnotes'>['data'];

export async function getFootnote(n: number, lang: Lang = defaultLang): Promise<Footnote> {
  const entry = await getEntry('footnotes', `${lang}-${n}`);
  if (!entry) throw new Error(`Footnote ${n} (${lang}) is referenced but not defined`);
  return entry.data;
}

export async function getFootnotes(lang: Lang = defaultLang): Promise<Footnote[]> {
  const all = await getCollection('footnotes', (e) => e.data.lang === lang);
  return all.map((e) => e.data).sort((a, b) => a.n - b.n);
}

/** The URL readers should follow: the original while it is live, otherwise the archived copy. */
export function footnoteHref(fn: Footnote): string {
  if (fn.linkStatus === 'live') return fn.originalUrl;
  return fn.archiveUrl ?? fn.originalUrl;
}

/** True when readers are sent to the Wayback Machine instead of the original. */
export function usesArchive(fn: Footnote): boolean {
  return footnoteHref(fn) !== fn.originalUrl;
}
