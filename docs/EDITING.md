# Editing guide

How to change things on the site without breaking its guarantees. Run the checks at the end before opening a pull request.

## Where things live

| What                                               | Where                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------- |
| The guide's text, one file per section             | `src/content/guide/en/NN-slug.mdx`                                  |
| Footnotes and their links (status, archive, notes) | `src/content/footnotes/en.json`                                     |
| “Since 2014” updates                               | `src/content/updates/en/*.md`                                       |
| Author bio, disclaimer, About page text            | `src/content/meta/en/*.md`                                          |
| Every piece of interface text                      | `src/i18n/en.ts`                                                    |
| Interactives (Svelte)                              | `src/components/interactive/`                                       |
| Colors, type and spacing                           | `src/styles/tokens.css`                                             |
| Social preview image and app icons                 | `public/og/default.png`, `public/icon-*.png` (generated, see below) |

## The author's text

Kinsella's words are reproduced verbatim, and `npm run check:text` fails if any word differs from the 2014 PDF. That is intentional.

- **Typographic slips** (punctuation, spacing, quote marks) may be fixed because the check ignores punctuation. Log every fix in `docs/EDITION.md`.
- **Word-level changes** are not made. Known slips in the original are listed in `docs/EDITION.md` under “Left as in the original.”
- **Components** inside the MDX (`<Ref>`, `<Fn>`, `<PullQuote>`, `<Since2014>` and the interactive tags) add no words, so you can move or add them freely.

## Links and footnotes

Each entry in `src/content/footnotes/en.json` has `originalUrl` (as printed in 2014), `archiveUrl` (Wayback snapshot), `linkStatus` (`live`, `dead` or `unverified`), `checkedOn` and an optional `linkNote`.

- When a link dies, set `linkStatus` to `dead`, add a short `linkNote`, and update `checkedOn`. Readers are then sent to the archived copy automatically.
- The weekly **Link check** workflow (`npm run check:links` locally) reports links that stop working.

## Adding a “Since 2014” update

1. Create `src/content/updates/en/<id>.md` with `title`, `order` and at least one source (`title`, `publisher`, `url`). The schema rejects updates without sources. Write the body in your own words and keep it short.
2. Put `<Since2014 id="<id>" />` right after the sentence it updates.
3. Add a row to the table in `docs/EDITION.md`.

## Images

The site still uses placeholders:

- The home page hero is an `ImagePlaceholder` (`src/pages/index.astro`). Its `subject` describes the intended artwork. Replace it with an image from `src/assets/` using Astro's `<Image />`, and record the image's source and license in `src/assets/CREDITS.md`.
- The social preview image and app icons are rendered from HTML by `scripts/generate-assets.mjs`. Edit that script and run `npm run assets`, or overwrite the PNGs in `public/` with your own (keep 1200×630 for `og/default.png`).

## Interface text

All interface strings, including those of the interactives, are in `src/i18n/en.ts`. Components never hard-code text. The `UIStrings` type means TypeScript flags a missing or misspelled key.

## Moving to a custom domain

1. In `astro.config.mjs`, set `site` to the domain and `base` to `'/'`.
2. Add `public/CNAME` containing the domain.
3. Update the sitemap URL in `public/robots.txt`, the paths in `public/site.webmanifest`, and `SITE` in `scripts/build-epub.mjs`.
4. Update the repository links in `src/lib/links.ts` and `src/content/meta/en/about.md` if the repository moves.

## Checks

```bash
npm run format:check
npm run check
npm run check:text
npm run build
npm run check:epub
npm run test:a11y
npm run check:links
```

`check:links` contacts external sites and is slow, so CI runs it weekly rather than on every pull request.
