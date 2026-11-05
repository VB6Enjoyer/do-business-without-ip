# Development roadmap

A modern, accessible web edition of Stephan Kinsella's *Do Business Without
Intellectual Property* (Liberty.me Guide 1.0, July 2014). Kinsella released the
original under CC0 (page 2 of the PDF).

We work one phase at a time. Each phase ends with something deployed and
reviewable, and nothing moves to the next phase until the current one is
signed off.

---

## Guiding decisions

| Topic | Decision |
| --- | --- |
| Framework | **Astro** (static output, zero JS by default) with **TypeScript** |
| Interactive pieces | **Svelte 5** islands, loaded only where used. Small UI behavior (drawer, theme toggle) in plain TS |
| Hosting | **GitHub Pages**, deployed by GitHub Actions on push to `main` |
| URL | `https://vb6enjoyer.github.io/do-business-without-ip/` until a custom domain is chosen (Astro `site` + `base` config) |
| Original text | Kinsella's words stay verbatim. Only typographic fixes (PDF hyphenation, spacing, smart quotes) |
| Modernization | Kept in a separate layer: replacement links plus clearly marked "Since 2014" notes |
| Footnotes | Open in an accessible **drawer**, not at the bottom of the page. Without JS they fall back to a normal endnotes list |
| Images | **Placeholders only** for now. A placeholder component records the intended size and subject so real assets can be dropped in later |
| Branding | No Liberty.me logos or stock imagery from the PDF. Presented as an unofficial edition with a link to the original |
| i18n | English only for now, but **built i18n-ready** from day one (see "Future: translations") |
| Commits | Conventional Commits, enforced by the existing commitlint + husky setup |

---

## Phase 0: Foundation

Goal: an empty but real site, deployed.

- Scaffold Astro + TypeScript (strict). Add the Svelte integration
- Prettier (+ Astro and Svelte plugins), `astro check` and npm scripts: `dev`, `build`, `preview`, `check`, `format`
- GitHub Actions:
  - `ci.yml`: install, check, build on every PR
  - `deploy.yml`: build and publish to GitHub Pages on push to `main`
- Base layout: `<html lang>`, meta and Open Graph defaults, skip link, header/footer shell
- Design tokens as CSS custom properties: color, type scale, spacing. Light and dark themes (follow the OS setting, plus a manual toggle saved per visitor)
- `ImagePlaceholder.astro` component (aspect ratio, label, intended subject)
- UI-strings dictionary (`src/i18n/en.ts`) so no interface text is hardcoded in components

**Done when:** the Pages URL serves the shell in both themes, and CI is green.

## Phase 1: Content extraction

Goal: the full guide as structured, faithful source content.

- Extract the text with `pdftotext -layout`, then clean it up: rejoin hyphenated words, remove page numbers and running headers, restore paragraphs
- Restore emphasis (bold and italic runs) and inline links by checking against the rendered pages
- Split the text into MDX files, one per section, in an `en/` folder:
  `src/content/guide/en/01-introduction.mdx` … `13-publishing-and-copyright.mdx`, with the subsections (Music, Inventing, Dying, Patents) nested as in the original
- Components used inside the content:
  - `<PullQuote side="left|right">`: the margin call-outs from the PDF
  - `<Fn n={12} />`: the footnote reference
  - `<Since2014 id="...">`: the modernization note slot (empty for now)
- Footnote data: `src/content/footnotes/en.json` with 41 entries:
  `{ n, label, originalUrl, archiveUrl: null, note: null }`
- Author bio and the original disclaimer captured as content. The disclaimer is adapted to drop the Liberty.me references
- Faithfulness check: a script that compares a normalized word sequence of the MDX against the PDF text and reports any differences

**Done when:** the whole guide renders as plain, unstyled pages and the faithfulness check shows only the intended typographic fixes.

## Phase 2: Reading experience

Goal: a pleasant, accessible reading experience on any device.

- Typography: serif body text with a comfortable line length, and a display face for headings
- Layout: pull quotes in the margin on wide screens and inline on narrow ones. Drop cap on the introduction
- **Footnote drawer**
  - A footnote reference is a `<button>` that opens a drawer showing the note's label, link(s) and any "Since 2014" note
  - Side panel on desktop, bottom sheet on mobile
  - Focus moves into the drawer and back to the reference on close. Esc, the close button and backdrop click all close it. `aria-controls` / `aria-expanded` are wired up
  - Arrows to step to the previous or next footnote without closing
  - Deep link `#fn-12` opens the drawer to that note
  - Without JS: references are plain anchors to an endnotes list
- Sticky table of contents with scrollspy (collapses to a menu on mobile), and a reading progress bar
- Print stylesheet: footnotes print as endnotes, URLs shown
- Accessibility pass: axe via Playwright in CI, keyboard-only walkthrough, `prefers-reduced-motion`

**Done when:** the guide is fully readable with keyboard only, axe reports no violations, and Lighthouse accessibility scores 100.

## Phase 3: Links and modernization

Goal: every link works, and the 2014 context is updated without touching the original text.

- Fill `archiveUrl` for each footnote using the Wayback Machine availability API, picking the snapshot nearest to July 2014. Where the original still resolves, prefer it, and record which one we chose
- Link checker (e.g. lychee) in CI, run on a schedule
- Write the "Since 2014" notes. Candidate topics, each to be researched and sourced:
  - what came after SOPA/PIPA
  - what became of the TPP and its IP chapter
  - how the Apple–Samsung patent wars ended
  - what became of Twitter's patent pledge
  - Megaupload / Kim Dotcom
  - newer examples of creators who thrive without IP
- Show notes as small markers in the text that open in the same drawer, so the original text stays uninterrupted
- "About this edition" page: provenance, CC0 statement, what changed and why, a link to the original PDF, and credits

**Done when:** the link checker passes and every editorial addition is visibly marked as such.

## Phase 4: Interactives I (core argument)

- **Neighborhood covenant demo** ("IP versus property rights"): a grid of 100 homes where you try to paint yours orange. Mode A is a covenant you agreed to. Mode B is a patent/copyright holder you never contracted with. It shows the "negative servitude" argument directly
- **Copyright term timeline** ("History" + "Dying without IP"):
  - US terms over time: 1790 (14+14), 1831 (28+14), 1909 (28+28), 1976 (life+50), 1998 (life+70 / 95)
  - Markers for the Statute of Monopolies (1624) and the Statute of Anne (1710)
  - Designed so other countries can be added later

Both must work with keyboard and screen readers, show an accessible text alternative and respect reduced motion.

## Phase 5: Interactives II (practical tools)

- **"To IP or Not to IP" self-check:** Kinsella's six questions as a reflection tool that points readers to the relevant sections (music, inventing, publishing, patents). It has no scoring and no "right answers"
- **Pre-sale calculator:** the Rowling thought experiment, with sliders for audience size, conversion rate, price and number of sequels
- **"Release your work" tool:** pick CC0 or CC-BY, get the badge and the text to paste. Optional defensive-only patent pledge text modeled on Twitter's
- **Share a quote:** one click to copy any pull quote as text or as a generated card image

## Phase 6: Polish and launch

- SEO: titles, descriptions, sitemap, `robots.txt`, canonical URLs. Open Graph images (placeholders until assets arrive)
- Favicon and app icons (placeholders), 404 page
- Performance budget: Lighthouse at least 95 across the board, minimal JS on the reading page
- Optional: EPUB export generated from the same MDX source
- README with local setup, content-editing guide and how to add a translation

---

## Future: translations

English first. The groundwork above keeps translations cheap later:

- Content lives under `src/content/guide/<lang>/`, footnotes under `src/content/footnotes/<lang>.json`, UI strings under `src/i18n/<lang>.ts`
- Turn on Astro's built-in i18n routing: `/` (en, default) and `/es/`, etc., with `hreflang` links
- Language switcher in the header that keeps you on the same section when switching
- **Spanish first.** Before translating, check whether a translation already exists (CC0 means we can use one freely, with credit)
- Interactives get their strings from the dictionary, so they translate with the rest

## Future: assets and a 2026 edition

- Replace placeholders with original, AI-generated or royalty-free images. Track each asset's source and license in `src/assets/CREDITS.md`
- If Kinsella writes a 2026 revision, add it as a second edition beside the 2014 text, which stays available, with a version switcher. The "Since 2014" notes become raw material for that rewrite
