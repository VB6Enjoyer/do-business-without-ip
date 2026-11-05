# Translating the site

The site is English-only for now, but it was built so that a translation means adding files rather than rewriting components. This guide uses Spanish (`es`) as the example.

## Before you start

The guide is CC0, so an existing translation can be used freely, with credit. Search for one first; it may save the whole translation step.

## What is already in place

- **Interface text:** every interface string is in `src/i18n/en.ts`, and components get it through `useStrings(lang)`. A new language is a sibling file with the same shape.
- **Content folders:** content is organised by language folder: `src/content/guide/<lang>/`, `src/content/updates/<lang>/` and `src/content/meta/<lang>/`.
- **Footnotes:** they are keyed `<lang>-<n>`, and the guide page filters every collection by language.
- **Layout:** `BaseLayout` already takes a `lang` prop for `<html lang>`.

## Steps

1. **Interface strings.** Copy `src/i18n/en.ts` to `src/i18n/es.ts`, translate the values, and type it as `UIStrings` (`export const es: UIStrings = { … }`). TypeScript then reports any missing key. Register it in `src/i18n/index.ts` (`languages` and `dictionaries`).
2. **The guide.** Copy `src/content/guide/en/` to `src/content/guide/es/` and translate the prose and the `title` frontmatter. Keep every component tag exactly as it is: `<Ref n={…}>…</Ref>` (translate only the text between the tags), `<Fn n={…} />`, `<PullQuote>` (translate its text), `<Standfirst>`, `<Since2014 id="…" />` and the interactive tags.
3. **Footnotes.** Create `src/content/footnotes/es.json` with the same `n`, URLs and statuses. Keep `label` as the original title of the linked page, which is usually in English, and translate `linkNote`. Then extend the `footnotes` loader in `src/content.config.ts` to read every `src/content/footnotes/*.json` file (it reads only `en.json` today).
4. **Updates and supporting text.** Translate `src/content/updates/en/*.md` and `src/content/meta/en/*.md` into the `es/` folders. Keep the sources as they are.
5. **Routing.** This part isn't built yet:
   - Enable Astro's i18n routing in `astro.config.mjs` (`i18n: { locales: ['en', 'es'], defaultLocale: 'en', routing: { prefixDefaultLocale: false } }`).
   - Move the pages under `src/pages/[lang]/` (or duplicate them under `src/pages/es/`), passing `lang` to `useStrings`, the collection filters and `BaseLayout`.
   - Add `hreflang` alternate links in `BaseLayout`.
   - Add a language switcher to the header that keeps the reader on the same section, since anchors are shared across languages.
6. **EPUB.** `scripts/build-epub.mjs` reads `dist/guide/index.html`. Point it at the translated page as well to produce `do-business-without-ip-es.epub`.

## Checks for a translation

- `npm run check:text` compares the English text with the 2014 PDF. It does not apply to translations.
- A useful replacement for translations is a structure check: each translated section should contain the same `<Fn>`, `<Ref>` and `<Since2014>` markers in the same order as the English one. That check doesn't exist yet. Add it alongside the first translation.
- `npm run test:a11y` should be extended to visit the translated pages (`/es/`, `/es/guide/`, `/es/about/`).
