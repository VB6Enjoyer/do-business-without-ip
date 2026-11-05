# Do Business Without Intellectual Property: web edition

A modern, accessible web edition of Stephan Kinsella's guide _Do Business Without Intellectual Property_ (Liberty.me Guide 1.0, July 2014), which the author released under [CC0](https://creativecommons.org/publicdomain/zero/1.0/). This edition is unofficial and is also dedicated to the public domain (see [`LICENSE`](LICENSE)).

**Live site:** <https://vb6enjoyer.github.io/do-business-without-ip/>

## What's in it

- **The full guide, verbatim.** An automated check compares every word against the original PDF.
- **Footnotes in a drawer.** Each footnote has a link-health record: dead links point to Wayback Machine copies from 2014.
- **“Since 2014” updates.** Short, sourced editorial notes on examples that have moved on, always marked as additions.
- **Interactives:**
  - the neighborhood covenant demo
  - a copyright-term timeline
  - a “to IP or not to IP” self-check
  - the pre-sale calculator
  - a CC0/CC BY notice generator
  - quote cards to share
- **Reading features:** light and dark themes, a print stylesheet, and an EPUB download.
- **Accessibility:** WCAG 2.2 AA, checked with axe on every pull request. Lighthouse scores are 100 across the board.

## Documentation

| Document                                     | What it covers                                                                                |
| -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [`docs/EDITION.md`](docs/EDITION.md)         | How the text relates to the 2014 PDF: every change, the link data and the editorial additions |
| [`docs/EDITING.md`](docs/EDITING.md)         | How to edit content, links, updates, images and interface text, and move to a custom domain   |
| [`docs/TRANSLATING.md`](docs/TRANSLATING.md) | How to add a language (Spanish first)                                                         |
| [`docs/ROADMAP.md`](docs/ROADMAP.md)         | The phased plan this site was built from                                                      |

## Stack

[Astro](https://astro.build) (static output) and TypeScript, with [Svelte](https://svelte.dev) islands for the interactive pieces. Fonts are self-hosted (Source Serif 4, Inter), and there's no tracking. Deployed to GitHub Pages.

## Development

Requires Node 22.23.4 or newer.

```bash
npm install
npm run dev          # http://localhost:4321/do-business-without-ip/
npm run build        # static site + EPUB in dist/
npm run preview      # serve dist/
```

Checks (all of them run in CI, except `check:links`, which runs weekly):

```bash
npm run format:check # Prettier
npm run check        # type-check .astro/.ts files
npm run check:text   # the guide's words still match the 2014 PDF
npm run check:epub   # the generated EPUB is structurally valid (needs a build)
npm run test:a11y    # axe + behaviour tests in a real browser (needs a build)
npm run check:links  # footnote links, archived copies and update sources
```

Other scripts: `npm run format` (Prettier, write) and `npm run assets` (regenerate the social image and icons).

## Project layout

```
src/
  components/      UI pieces (Header, Footer, ThemeToggle, ImagePlaceholder)
    guide/         Used inside the guide's MDX (Ref, Fn, PullQuote, Since2014, drawer, …)
    interactive/   Svelte islands embedded in the guide
  content/         The guide (MDX per section), footnotes, updates, bio, disclaimer, about
  i18n/            Interface strings per language
  layouts/         Page shell (meta tags, theme bootstrap, skip link)
  lib/             Helpers (paths, theme, footnotes, drawer, scrollspy, quote cards, data)
  pages/           Routes: /, /guide/, /about/, 404
  styles/          Design tokens (light/dark), prose and print styles
scripts/           Text check, link check, EPUB build and check, a11y tests, asset generation
docs/              Edition notes, editing and translation guides, roadmap
public/            Static files: favicon, icons, social image, robots.txt, manifest
```

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which checks, builds and publishes the site to GitHub Pages. One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Commits

Conventional Commits, enforced by commitlint through a husky `commit-msg` hook (headers up to 72 characters).
