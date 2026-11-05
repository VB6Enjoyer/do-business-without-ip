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

/** The URL readers should follow: the archived copy when we have one, else the original. */
export function footnoteHref(fn: Footnote): string {
  return fn.archiveUrl ?? fn.originalUrl;
}
