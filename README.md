# Do Business Without Intellectual Property: web edition

A modern, accessible web edition of Stephan Kinsella's guide _Do Business Without
Intellectual Property_ (Liberty.me Guide 1.0, July 2014), which the author released
under [CC0](https://creativecommons.org/publicdomain/zero/1.0/). This edition is
unofficial and is also dedicated to the public domain (see [`LICENSE`](LICENSE)).

- Original PDF: <https://stephankinsella.com/wp-content/uploads/publications/kinsella-do-business-without-ip-2014.pdf>
- Roadmap: [`docs/ROADMAP.md`](docs/ROADMAP.md)
- Edition notes (what was changed from the PDF, and why): [`docs/EDITION.md`](docs/EDITION.md)

## Stack

[Astro](https://astro.build) (static output) + TypeScript, with Svelte islands for the
interactive pieces. Deployed to GitHub Pages.

## Development

Requires Node 22.23.4 or newer.

```bash
npm install
npm run dev        # http://localhost:4321/do-business-without-ip/
npm run check      # type-check .astro/.ts files
npm run check:text # verify the guide text against the 2014 original
npm run format     # Prettier
npm run build      # static site in dist/
npm run preview    # serve dist/
```

## Project layout

```
src/
  components/   UI pieces (Header, Footer, ThemeToggle, ImagePlaceholder)
    guide/      Components used inside the guide's MDX (Ref, Fn, PullQuote, …)
  content/      The guide (MDX per section), footnotes, author bio, disclaimer
  i18n/         UI strings per language; no interface text lives in components
  layouts/      Page shell (meta tags, theme bootstrap, skip link)
  lib/          Small helpers (base-path links, theme, external links)
  pages/        Routes
  styles/       Design tokens (light/dark) and global styles
```

All internal links go through `withBase()` (`src/lib/paths.ts`) so the site works under
the GitHub Pages sub-path today and at a custom domain later (change `site` and `base`
in `astro.config.mjs`).

Images are `ImagePlaceholder` components for now. Each one records the intended
subject and aspect ratio of the final asset.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and
publishes it to GitHub Pages. One-time setup: **Settings → Pages → Build and
deployment → Source: GitHub Actions**.

## Commits

Conventional Commits, enforced by commitlint via a husky `commit-msg` hook.
