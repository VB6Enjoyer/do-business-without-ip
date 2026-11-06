# Contributing

Thanks for helping! The guide and this edition are in the public domain, so contributions are too (see [`LICENSE`](LICENSE)).

## Ways to help

- **Suggest a creator** for the gallery, **report a broken link**, **report an error** or **offer a translation** with the [issue forms](../../issues/new/choose).
- **Fix it yourself** with a pull request. [`docs/EDITING.md`](docs/EDITING.md) explains where everything lives.

## Ground rules

- **Kinsella's text stays verbatim.** `npm run check:text` fails if any word of the guide differs from the 2014 PDF. Typographic slips may be fixed; log them in [`docs/EDITION.md`](docs/EDITION.md).
- **Editorial additions are marked and sourced.** "Since 2014" updates and gallery entries need sources. Write them in your own words and say so when figures are estimates.
- **Accessibility and no tracking.** No third-party scripts or trackers. New interactive pieces need to work by keyboard and pass `npm run test:a11y`.

## Development

See the [README](README.md) for setup. Before opening a pull request:

```bash
npm run format:check
npm run check
npm run check:text
npm run build
npm run check:epub
npm run test:a11y
```

Commits and pull request titles follow [Conventional Commits](https://www.conventionalcommits.org/) (`type(scope): description`, at most 72 characters), which a commit hook enforces.
