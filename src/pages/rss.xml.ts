import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { defaultLang, useStrings } from '../i18n';

/** Feed of editorial additions: "Since 2014" updates and creators-gallery entries. */
export async function GET(context: APIContext) {
  const t = useStrings(defaultLang);
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const plain = (md: string) =>
    md
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_`#>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const updates = (await getCollection('updates', (e) => e.id.startsWith(`${defaultLang}/`))).map(
    (e) => {
      const id = e.id.replace(/^[a-z]+\//, '');
      return {
        title: `${t.rss.updatePrefix}: ${e.data.title}`,
        link: `${base}/guide/#since-${id}`,
        pubDate: e.data.added,
        description: plain(e.body ?? ''),
      };
    },
  );
  const creators = (await getCollection('creators', (e) => e.data.lang === defaultLang)).map(
    (e) => ({
      title: `${t.rss.creatorPrefix}: ${e.data.name}`,
      link: `${base}/creators/#${e.data.slug}`,
      pubDate: e.data.added,
      description: `${e.data.headline} ${e.data.story}`,
    }),
  );

  return rss({
    title: t.rss.title,
    description: t.rss.description,
    site: new URL(`${base}/`, context.site),
    // Links already carry their own slashes; don't append one after #anchors.
    trailingSlash: false,
    items: [...updates, ...creators].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime()),
    customData: `<language>${defaultLang}</language>`,
  });
}
