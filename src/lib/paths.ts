/**
 * Prefixes a site-relative path with Astro's configured `base`, so links
 * work both on the GitHub Pages project URL and on a future custom domain.
 */
export function withBase(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\//, '');
  return `${base}/${clean}`;
}
