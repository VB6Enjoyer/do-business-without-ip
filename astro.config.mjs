// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';

// GitHub Pages project site. When a custom domain is set up, change `site`
// to it and set `base` to '/'.
export default defineConfig({
  site: 'https://vb6enjoyer.github.io',
  base: '/do-business-without-ip',
  trailingSlash: 'always',
  integrations: [mdx(), svelte(), sitemap({ filter: (page) => !page.includes('/404') })],
});
