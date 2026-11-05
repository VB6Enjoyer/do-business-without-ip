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
    about: 'About',
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
    readingProgress: 'Reading progress',
    updates: 'Updates since 2014',
    updatesIntro:
      'Editorial notes added in this web edition. They are not part of the original text, and each one cites its sources.',
    sources: 'Sources',
    archivedCopy: 'archived copy',
    backToUpdate: 'Back to the text for “{title}”',
  },
  drawer: {
    kicker: 'Footnote {n} of {total}',
    close: 'Close footnote',
    previous: 'Previous',
    next: 'Next',
    previousLabel: 'Previous footnote',
    nextLabel: 'Next footnote',
    openLink: 'Open the linked page',
    openArchived: 'Open the archived copy ({year})',
    archivedCopy: 'Archived copy ({year})',
    checkedOn: 'Link checked on {date}.',
    updateKicker: 'Since 2014 · {n} of {total}',
    closeUpdate: 'Close update',
    previousUpdateLabel: 'Previous update',
    nextUpdateLabel: 'Next update',
    keyboardHintUpdates: 'Use ← and → to move between updates, Esc to close.',
    originalUrl: 'URL as printed in 2014',
    keyboardHint: 'Use ← and → to move between footnotes, Esc to close.',
  },
  interactive: {
    badge: 'Interactive · added in this edition',
    covenant: {
      title: 'Who gets a veto over your house?',
      intro:
        'The neighborhood example from the text, as a toy. You own the highlighted house. Try painting it orange under each arrangement.',
      modeLabel: 'Arrangement',
      modeCovenant: 'Restrictive covenant',
      modeIp: 'Patent or copyright',
      covenantInfo:
        'Your 99 neighbors have signed a covenant: no orange houses without everyone’s permission. Whether you sign is up to you.',
      signLabel: 'I sign the covenant too',
      ipInfo:
        'A company you have never dealt with holds a patent on painting houses orange. Nobody in the neighborhood signed anything.',
      holder: 'OrangeCo Holdings',
      holderPatent: 'Patent on “a method of coloring a dwelling orange” (fictional)',
      paint: 'Paint my house orange',
      reset: 'Start over',
      gridLabel: 'A neighborhood of 100 houses. Yours is in the middle, outlined. Status: {status}',
      statusIdle: 'your house is unpainted',
      statusPainted: 'your house is orange',
      statusVetoed: 'your paint job was vetoed',
      legendYou: 'Your house',
      legendSigned: 'Signed the covenant',
      legendBurdened: 'Burdened by the patent',
      resultSignedVetoed:
        'Vetoed. When you signed, you gave your neighbors this veto in exchange for the same say over their houses. Their right comes from your consent.',
      resultUnsignedPainted:
        'Painted. You never joined the covenant, so it doesn’t bind you, and your neighbors can’t stop you.',
      resultIpVetoed:
        'Vetoed. The patent holder never asked you and you never agreed, but the state will enforce their veto over your own house, paint and brush.',
      ipNote:
        'Every house in the neighborhood carries the same burden. In effect, the state has made the patent holder a partial owner of all of them.',
    },
    timeline: {
      title: 'How long does copyright last?',
      intro:
        'The longest a work could stay under copyright in the United States, under the law in force each year. The British Statute of Anne is shown for comparison.',
      kindLabel: 'Kind of work',
      kindAuthor: 'By an individual author',
      kindHire: 'Made for hire (by a company)',
      ageAtCreation: 'Author’s age when the work is created',
      ageAtDeath: 'Age at which the author dies',
      years: '{n} years',
      yearsShort: '{n} yrs',
      today: 'today',
      axisLabel: 'Years of protection',
      chartLabel:
        'Line chart of the maximum US copyright term from 1790 to today. It rises from {first} years in 1790 to {last} years today.',
      inForce: 'In force {from}–{to}',
      inForceSince: 'In force since {from}',
      todayResult:
        'Under today’s law, a work created this year stays under copyright for {n} years, until about {year}.',
      tableToggle: 'Show the data as a table',
      colYear: 'From',
      colLaw: 'Law',
      colRule: 'Rule',
      colTerm: 'Maximum term',
      laws: {
        '1710': { name: 'Statute of Anne (Britain)', rule: '14 years, renewable once for 14 more' },
        '1790': { name: 'Copyright Act of 1790', rule: '14 years, renewable once for 14 more' },
        '1831': { name: 'Copyright Act of 1831', rule: '28 years, renewable once for 14 more' },
        '1909': { name: 'Copyright Act of 1909', rule: '28 years, renewable once for 28 more' },
        '1978': {
          name: 'Copyright Act of 1976 (in force 1978)',
          rule: 'The author’s life plus 50 years; 75 years for works made for hire',
        },
        '1998': {
          name: 'Copyright Term Extension Act of 1998',
          rule: 'The author’s life plus 70 years; 95 years for works made for hire',
        },
      },
      note: 'Simplified: renewals are counted as if always made, and the temporary extensions passed between 1962 and 1974 are left out. Since 1978 an individual author’s term depends on how long they live, which the sliders control.',
      sourcePrefix: 'Source:',
      sourceName: 'U.S. Copyright Office, Circular 15A: Duration of Copyright',
      sourceUrl: 'https://www.copyright.gov/circs/circ15a.pdf',
    },
  },
  about: {
    linkStats: 'Link status',
    live: 'Original page still works',
    archived: 'Served from an archived copy',
    lastChecked: 'Last checked {date}.',
    updatesList: 'Updates in this edition',
    originalPdf: 'Read the original 2014 PDF',
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
