/**
 * English UI strings. Every piece of interface text lives here (not in
 * components) so adding a language later means adding a sibling file.
 */
export const en = {
  site: {
    title: 'Do Business Without Intellectual Property',
    shortTitle: 'Do Business Without IP',
    description:
      'A modern, accessible web edition of Stephan Kinsella’s 2014 guide on how individuals and businesses can thrive without relying on patents and copyright.',
    author: 'Stephan Kinsella',
  },
  a11y: {
    skipToContent: 'Skip to content',
    mainNav: 'Main',
  },
  theme: {
    toLight: 'Switch to light theme',
    toDark: 'Switch to dark theme',
  },
  nav: {
    home: 'Home',
    guide: 'Read the guide',
    about: 'About this edition',
  },
  home: {
    kicker: 'Guide 1.0 · July 2014 · Web edition',
    byline: 'by Stephan Kinsella',
    lede: 'Why patents and copyright are incompatible with a free market, and what entrepreneurs and creators can do about it today.',
    startReading: 'Start reading',
    readingTime: 'About a 30-minute read',
  },
  guide: {
    title: 'The guide',
    contents: 'Contents',
    notes: 'Notes',
    footnoteLabel: 'Footnote {n}',
    backToText: 'Back to the text for footnote {n}',
    since2014: 'Since 2014',
    aboutAuthor: 'About the author',
    originalPage: 'Page {n} of the original',
  },
  footer: {
    license:
      'The original guide was released by Stephan Kinsella under CC0. This web edition is unofficial and is also dedicated to the public domain.',
    originalPdf: 'Original PDF (2014)',
    source: 'Source code',
  },
  placeholder: {
    label: 'Image placeholder',
  },
} as const;

export type UIStrings = typeof en;
