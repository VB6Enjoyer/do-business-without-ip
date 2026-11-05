# Edition notes

How this web edition's text relates to the original: _Do Business Without
Intellectual Property_, Stephan Kinsella, Liberty.me Guide 1.0, July 2014
(released under CC0). Original PDF:
<https://stephankinsella.com/wp-content/uploads/publications/kinsella-do-business-without-ip-2014.pdf>

## Principle

The author's words are reproduced verbatim. Anything editorial is either
listed below (typographic fixes) or visibly marked in the site as an addition
("Since 2014" notes, archived links).

`npm run check:text` enforces this: it compares every word of
`src/content/guide/<lang>/*.mdx` against `docs/source/reference-2014.txt`, which
is generated from the PDF by `scripts/extract-reference.py`. CI fails on any
inserted, removed or changed word.

## Source structure

| Content                                             | Location                           |
| --------------------------------------------------- | ---------------------------------- |
| Guide sections (one file per top-level section)     | `src/content/guide/en/NN-slug.mdx` |
| Footnotes (41), the single source of every link URL | `src/content/footnotes/en.json`    |
| Author bio (page 22) and disclaimer (page 2)        | `src/content/meta/en/`             |
| Reference text for the faithfulness check           | `docs/source/reference-2014.txt`   |

In the MDX, the following components are used:

- `<Ref n={…}>`: a linked phrase; its URL comes from footnote _n_
- `<Fn n={…} />`: a footnote marker
- `<PullQuote side="left|right">`: a margin call-out from the original layout, repeating body text
- `<Standfirst>`: the introduction's opening paragraphs, set in bold in the original
- `<Since2014 id="…" />`: a marker for an editorial update (see below)

## Typographic fixes

These change punctuation or spacing only, never words.

| Section                             | Original (2014 PDF)                                               | This edition                                                                                           |
| ----------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| History of Patent and Copyright Law | `…of 1624¹⁰).Copyright law…`                                      | `…of 1624¹⁰). Copyright law…` (missing space)                                                          |
| History of Patent and Copyright Law | `Let‘s Make Copyright Opt-OUT`                                    | `Let’s Make Copyright Opt-OUT` (apostrophe)                                                            |
| History of Patent and Copyright Law | `ongoing “smartphone“ wars`                                       | `ongoing “smartphone” wars` (closing quote)                                                            |
| Why Does IP Persist?                | `in particular— defend`                                           | `in particular—defend` (stray space after dash)                                                        |
| First, Do No Harm                   | `…to cope with it, so long as it exists`                          | `…so long as it exists.` (missing period)                                                              |
| Publishing and Copyright            | `“Innovations that Thrive without IP”` and the two items after it | quotation marks moved outside the links and bold dropped, to match how every other linked title is set |

Other changes that come from converting the layout, not from editing:

- Words hyphenated at line ends in the PDF are rejoined (only _co-owners_ is a real hyphen).
- Headings set in all capitals in the PDF are written in title case. The capitals were a typographic style.
- The drop cap in the introduction is plain text. Styling it is a design concern.
- Footnote 35's URL is wrapped across two lines in the PDF's footnote list with a doubled hyphen. The in-text link's URL (single hyphen) is used.

## Adapted text

- **Disclaimer:** references to the original publisher (Liberty.me) are replaced with "the editors of this web edition." The original publisher is not involved with this site.
- Liberty.me branding, the cover stock photo, the author photo and the closing Liberty.me promotion are not reproduced.

## Left as in the original

Possible slips in the 2014 text that are kept verbatim because they involve words, not punctuation:

- _Intellectual Property Is Contrary to Free Markets…_: "uses various excuses to do this this: terrorism…" (doubled "this")
- _To IP or Not to IP_: "millions of dollars, on legal fees" (comma)
- _IP, Innovation, and Freedom_: "the Stationer’s Company" (historically the _Stationers’_ Company)

Whether to correct these is the author's call (or a future 2026 edition's).

## Links

Each footnote records the result of the last link check:

| Field         | Meaning                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------- |
| `originalUrl` | The URL exactly as printed in 2014                                                        |
| `archiveUrl`  | Wayback Machine snapshot closest to July 2014 (`null` if none exists)                     |
| `linkStatus`  | `live` (still resolves), `dead` (gone) or `unverified` (the site blocks automated checks) |
| `checkedOn`   | Date of the last check                                                                    |
| `linkNote`    | Shown in the drawer and notes list when the archive is used, explaining why               |

Readers follow the original while it is `live`. Otherwise they get the archived copy. The drawer always shows the 2014 URL, and offers the archived copy as a secondary link for live pages.

Status as of the first check (2026-11-05): 31 live, 4 dead (footnotes 3, 4, 27, 40), 6 unverified (the five mises.org links and Amazon). Footnote 3 has no archived copy.

`npm run check:links` rechecks every live link, every archived copy and every update source. A scheduled workflow (`.github/workflows/links.yml`) runs it every Monday. When a link dies, set its `linkStatus` to `dead` and add a `linkNote`.

## “Since 2014” updates

Short editorial notes on examples in the text that have moved on since 2014. Rules:

- Written for this edition, never presented as the author’s words. They are marked “Since 2014” in the text and listed under “Updates since 2014.”
- Each cites at least one source (enforced by the content schema).
- Each is anchored after the sentence it updates with `<Since2014 id="…" />`. The marker adds no words, so `check:text` still passes.

| Update                                            | Anchored in                                        |
| ------------------------------------------------- | -------------------------------------------------- |
| The TPP’s IP chapter was shelved                  | Intellectual Property Is Contrary to Free Markets… |
| The Apple–Samsung “smartphone wars” ended in 2018 | History of Patent and Copyright Law                |
| Kim Dotcom is still fighting extradition          | Intellectual Property Is Contrary to Free Markets… |
| Google sold Motorola but kept the patents         | Examples of IP Contrarianism                       |
| “Eat More Kale” won its trademark                 | IP, Innovation, and Freedom                        |
| Defensive patent pools took off                   | Patents                                            |

The Kim Dotcom update describes the case as of July 2026 and should be revisited.

## Interactives

Two interactive figures sit inside the guide. Each is framed and labelled "Interactive · added in this edition", is hidden in print, and adds no words to the author's text, so `check:text` still passes.

| Interactive                                                                                                                                                                                                                                                                     | Placed after                                                 | Source                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| **Who gets a veto over your house?** Kinsella's neighborhood example: try painting your house orange under a covenant you choose whether to sign, then under a patent you never agreed to.                                                                                      | The end of _IP Versus Property Rights_                       | `src/components/interactive/CovenantDemo.svelte`                                            |
| **How long does copyright last?** The maximum US copyright term by year from 1790, with the Statute of Anne for comparison. Sliders set the author's age at creation and death (terms since 1978 depend on the author's life). There is a corporate-work mode and a table view. | The first paragraph of _Dying without Intellectual Property_ | `src/components/interactive/CopyrightTimeline.svelte`, data in `src/lib/copyright-terms.ts` |

The timeline is simplified: renewals are counted as always made, and the interim extensions of 1962–1974 are left out. Both simplifications are stated under the chart. Source: U.S. Copyright Office, Circular 15A. The patent holder in the covenant demo ("OrangeCo Holdings") is fictional and labelled as such.
