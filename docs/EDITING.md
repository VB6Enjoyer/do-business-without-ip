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

## Summaries and term explainers

- **Summaries:** edit the `summary` list in a section’s frontmatter (1–4 short bullets, in your own words). They show as “The argument in brief” under the section heading.
- **Explaining a new term:** add an entry to `src/content/glossary/en.json` (`id`, `term`, `definition`, optional `learnMore`), then wrap the term’s first appearance in the text with `<Term id="…">…</Term>`. Use each id once, never inside a `<Ref>` link or a pull quote. `check:links` also checks the `learnMore` links.

## Myth cards

Edit `src/content/myths/en.json`. Each card has a `claim`, an `answer` in your own words, a `quote` and the `section` slug it links to. The quote must be the author's exact words: `npm run check:text` fails if it isn't found verbatim in the guide.

## Creators gallery

Add or edit entries in `src/content/creators/en.json`: `name`, `field`, `year` (or `null`), `approach`, a one-line `headline`, a short `story` in your own words, and at least one source. Stick to what the sources support, and say so when figures are estimates. Field and approach labels are in `src/i18n/en.ts` under `creators`.

## Illustrations and images

The illustrations are original line-art SVGs in `src/assets/illustrations/`: `hero.svg` on the home page, and one opener per guide section, named after the section's slug (for example `history.svg`). They are drawn by `scripts/generate-illustrations.py`.

- **Changing a drawing:** edit its function in the script and run `npm run illustrations`. Don't hand-edit the SVGs, because the next run overwrites them.
- **Style rules:** monoline strokes in the accent green, a single orange highlight, `paper` fills that match the page, and ink for anything standing for state power. Colors are the `--ill-*` custom properties in `src/styles/tokens.css`, so every drawing follows the light and dark themes.
- **Placing one:** use `<Illustration name="…" />` (`src/components/Illustration.astro`). It is decorative by default; pass `label` when the image carries meaning, as the home hero does. A section without a matching file simply shows no opener.
- **Photos or other artwork:** put them in `src/assets/`, use Astro's `<Image />`, and record the source and license in `src/assets/CREDITS.md`.

The social preview image and app icons are rendered by `scripts/generate-assets.mjs` from the favicon and the hero illustration. Run `npm run assets` after changing either.

## Interface text

All interface strings, including those of the interactives, are in `src/i18n/en.ts`. Components never hard-code text. The `UIStrings` type means TypeScript flags a missing or misspelled key.

## Sharing, resume reading and the feed

- **Share links** (`src/components/ShareLinks.astro`, URLs in `src/lib/share.ts`) are plain links to each network's share page. No third-party script is loaded, so nothing tracks readers. To add or remove a network, edit `shareTargets`.
- **Resume reading** (`src/lib/resume.ts`) stores the last section read in the reader's own browser (`localStorage`). It is never sent anywhere, and the site sets no cookies.
- **The RSS feed** (`/rss.xml`, `src/pages/rss.xml.ts`) lists "Since 2014" updates and gallery entries by their `added` date. Set `added` on every new entry.

## Archiving

- **Wayback Machine:** after every deploy, `deploy.yml` asks the Internet Archive to snapshot the main pages, the EPUB and the feed. This is best effort and never fails a deploy.
- **Zenodo (citable DOI):** the repository is connected to Zenodo. Publishing a GitHub release (Releases, then Draft a new release, with a tag such as `v1.0.0`) archives that version and mints a DOI. The record's metadata comes from `.zenodo.json`, and GitHub's “Cite this repository” comes from `CITATION.cff`. Keep both in sync. The DOI for all versions is [10.5281/zenodo.23998195](https://doi.org/10.5281/zenodo.23998195); later releases are added to it automatically.

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
