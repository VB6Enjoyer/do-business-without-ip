#!/usr/bin/env node
/**
 * Builds an EPUB 3 of the guide from the built site (run after `astro build`).
 *
 * Source: dist/guide/index.html. The EPUB contains the author's text, the
 * notes, the author bio and the disclaimer, plus a short colophon. Web-only
 * additions (interactives, pull quotes, "Since 2014" markers, share buttons)
 * are left out.
 *
 * Output: dist/downloads/do-business-without-ip.epub
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import JSZip from 'jszip';
import { parse } from 'node-html-parser';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const outDir = join(dist, 'downloads');
const outFile = join(outDir, 'do-business-without-ip.epub');

const TITLE = 'Do Business Without Intellectual Property';
const AUTHOR = 'Stephan Kinsella';
// Stable identifier for this edition (a fixed UUID, so updates replace the same book).
const IDENTIFIER = 'urn:uuid:5f0c2b8e-3d7a-4c1e-9b6f-2a8d4e7c1b90';
const SITE = 'https://vb6enjoyer.github.io/do-business-without-ip/';
const ORIGINAL_PDF =
  'https://stephankinsella.com/wp-content/uploads/publications/kinsella-do-business-without-ip-2014.pdf';

const page = parse(readFileSync(join(dist, 'guide/index.html'), 'utf8'));

const escapeXml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Removes web-only elements and attributes, and points footnote markers at notes.xhtml. */
function clean(node) {
  for (const term of node.querySelectorAll('button.term')) term.replaceWith(term.text);
  for (const sel of [
    '[popover]',
    'img',
    'picture',
    '.creators-callout',
    '.pull-quote',
    '.interactive',
    'astro-island',
    'astro-slot',
    '.update-ref',
    'button',
    'script',
    'style',
    'template',
    'link',
  ]) {
    for (const el of node.querySelectorAll(sel)) el.remove();
  }
  for (const a of node.querySelectorAll('sup.fn-ref a')) {
    const n = a.getAttribute('data-fn');
    for (const attr of Object.keys(a.attributes)) a.removeAttribute(attr);
    a.setAttribute('href', `notes.xhtml#fn-${n}`);
    a.setAttribute('id', `fnref-${n}`);
    a.setAttribute('epub:type', 'noteref');
  }
  for (const el of node.querySelectorAll('*')) {
    for (const attr of Object.keys(el.attributes)) {
      if (attr.startsWith('data-') || attr.startsWith('aria-') || attr === 'rel') {
        el.removeAttribute(attr);
      }
      if (attr === 'class') {
        // Keep only the classes the EPUB stylesheet knows.
        const keep = el
          .getAttribute('class')
          .split(/\s+/)
          .filter((c) => ['standfirst', 'fn-ref'].includes(c));
        if (keep.length) el.setAttribute('class', keep.join(' '));
        else el.removeAttribute('class');
      }
    }
  }
  return node;
}

/** HTML → well-formed XHTML: self-close void elements, numeric entities. */
function toXhtml(html) {
  return html
    .replace(/<(br|hr|img|wbr)([^>]*?)\s*\/?>/g, '<$1$2 />')
    .replace(/&nbsp;/g, '&#160;')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const doc = (title, body, { epubType } = {}) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body${epubType ? ` epub:type="${epubType}"` : ''}>
${body}
</body>
</html>
`;

// ---------- Chapters ----------
const chapters = page.querySelectorAll('section.guide-section').map((section, i) => {
  const title = section.querySelector('h2').text.trim();
  section.querySelector('header.section-head')?.remove();
  const body = toXhtml(clean(section).innerHTML);
  const file = `chapter-${String(i + 1).padStart(2, '0')}.xhtml`;
  return {
    file,
    title,
    xhtml: doc(
      title,
      `<section epub:type="chapter">\n<h1>${escapeXml(title)}</h1>\n${body}\n</section>`,
    ),
  };
});

// ---------- Notes ----------
const notesItems = page.querySelectorAll('#notes li').map((li) => {
  const n = li.getAttribute('id').replace('fn-', '');
  const link = li.querySelector('a');
  const href = link.getAttribute('href');
  const label = link.text.trim();
  const original = li.querySelector('.note-url')?.text.trim() ?? href;
  const note = li.querySelector('.note-link-note')?.text.trim();
  return `<li id="fn-${n}" epub:type="endnote" value="${n}">
  <p><a href="${escapeXml(href)}">${escapeXml(label)}</a><br />
  <span class="url">${escapeXml(original)}</span>${note ? `<br />\n  <em>${escapeXml(note)}</em>` : ''}
  <a href="${chapterOf(n)}#fnref-${n}" class="back">↩</a></p>
</li>`;
});

function chapterOf(n) {
  const found = chapters.find((c) => c.xhtml.includes(`id="fnref-${n}"`));
  return found ? found.file : chapters[0].file;
}

const notes = {
  file: 'notes.xhtml',
  title: 'Notes',
  xhtml: doc(
    'Notes',
    `<section epub:type="endnotes">\n<h1>Notes</h1>\n<ol class="notes">\n${notesItems.join('\n')}\n</ol>\n</section>`,
  ),
};

// ---------- Author, disclaimer, colophon ----------
const authorBody = toXhtml(clean(page.querySelector('#author')).innerHTML).replace(
  /<h2[^>]*>(.*?)<\/h2>/,
  '<h1>$1</h1>',
);
const author = {
  file: 'author.xhtml',
  title: 'About the author',
  xhtml: doc('About the author', `<section>\n${authorBody}\n</section>`),
};

const disclaimerBody = toXhtml(clean(page.querySelector('.disclaimer')).innerHTML).replace(
  /<h2[^>]*>(.*?)<\/h2>/,
  '<h1>$1</h1>',
);
const colophon = {
  file: 'colophon.xhtml',
  title: 'About this edition',
  xhtml: doc(
    'About this edition',
    `<section epub:type="colophon">
<h1>About this edition</h1>
<p><em>${TITLE}</em> by ${AUTHOR} was first published as a PDF guide by Liberty.me in July 2014 and released under CC0 (public domain). This EPUB is generated from the unofficial web edition at <a href="${SITE}">${SITE}</a>.</p>
<p>The author’s text is reproduced verbatim; only typographic slips were corrected. Links that no longer work point to archived copies. The web edition’s interactive features and editorial updates are not included here.</p>
<p>Original PDF: <a href="${ORIGINAL_PDF}">${ORIGINAL_PDF}</a></p>
${disclaimerBody.replace('<h1>', '<h2>').replace('</h1>', '</h2>')}
</section>`,
    { epubType: 'backmatter' },
  ),
};

// ---------- Title page ----------
const titlePage = {
  file: 'title.xhtml',
  title: TITLE,
  xhtml: doc(
    TITLE,
    `<section epub:type="titlepage" class="titlepage">
<h1>${TITLE}</h1>
<p class="byline">${AUTHOR}</p>
<p class="edition">Guide 1.0 · July 2014 · Web edition</p>
<p class="rights">Public domain (CC0)</p>
</section>`,
    { epubType: 'frontmatter' },
  ),
};

const spine = [titlePage, ...chapters, notes, author, colophon];

// ---------- Navigation ----------
const nav = doc(
  'Contents',
  `<nav epub:type="toc" id="toc">
<h1>Contents</h1>
<ol>
${spine.map((c) => `  <li><a href="${c.file}">${escapeXml(c.title)}</a></li>`).join('\n')}
</ol>
</nav>
<nav epub:type="landmarks" hidden="">
<ol>
  <li><a epub:type="bodymatter" href="${chapters[0].file}">Start of the guide</a></li>
  <li><a epub:type="endnotes" href="notes.xhtml">Notes</a></li>
</ol>
</nav>`,
);

// ---------- Package ----------
const modified = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="en">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">${IDENTIFIER}</dc:identifier>
    <dc:title>${TITLE}</dc:title>
    <dc:creator>${AUTHOR}</dc:creator>
    <dc:language>en</dc:language>
    <dc:date>2014-07</dc:date>
    <dc:rights>Public domain (CC0 1.0): https://creativecommons.org/publicdomain/zero/1.0/</dc:rights>
    <dc:source>${ORIGINAL_PDF}</dc:source>
    <meta property="dcterms:modified">${modified}</meta>
    <meta name="cover" content="cover-image" />
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />
    <item id="css" href="style.css" media-type="text/css" />
    <item id="cover-image" href="cover.png" media-type="image/png" properties="cover-image" />
${spine.map((c, i) => `    <item id="c${i}" href="${c.file}" media-type="application/xhtml+xml" />`).join('\n')}
  </manifest>
  <spine>
${spine.map((_, i) => `    <itemref idref="c${i}" />`).join('\n')}
  </spine>
</package>
`;

const css = `body { font-family: Georgia, serif; line-height: 1.55; margin: 0 5%; }
h1 { font-size: 1.6em; line-height: 1.2; margin: 1.5em 0 1em; }
h2 { font-size: 1.25em; margin: 1.5em 0 0.75em; }
h3 { font-size: 1.1em; font-variant: small-caps; margin: 1.5em 0 0.5em; }
p { margin: 0 0 0.9em; }
.standfirst { font-weight: bold; }
sup.fn-ref { font-size: 0.7em; line-height: 0; }
sup.fn-ref a { text-decoration: none; }
.notes { font-size: 0.9em; }
.notes .url { font-family: sans-serif; font-size: 0.85em; word-break: break-all; color: #555; }
.back { text-decoration: none; }
.titlepage { text-align: center; margin-top: 30%; }
.titlepage h1 { font-size: 2em; font-weight: normal; }
.byline { font-style: italic; font-size: 1.2em; }
.edition, .rights { font-family: sans-serif; font-size: 0.85em; color: #555; }
`;

const zip = new JSZip();
zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
zip.file(
  'META-INF/container.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" />
  </rootfiles>
</container>
`,
);
zip.file('OEBPS/content.opf', opf);
zip.file('OEBPS/nav.xhtml', nav);
zip.file('OEBPS/style.css', css);
zip.file('OEBPS/cover.png', readFileSync(join(root, 'public/og/default.png')));
for (const c of spine) zip.file(`OEBPS/${c.file}`, c.xhtml);

mkdirSync(outDir, { recursive: true });
const buffer = await zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  mimeType: 'application/epub+zip',
});
writeFileSync(outFile, buffer);
console.log(
  `wrote ${outFile.replace(root, '')} (${(buffer.length / 1024).toFixed(0)} KB, ${chapters.length} chapters, ${notesItems.length} notes)`,
);
