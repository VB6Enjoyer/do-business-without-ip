#!/usr/bin/env node
/**
 * Faithfulness check: compares the words of the guide's MDX source against the
 * reference text extracted from the 2014 PDF (docs/source/reference-2014.txt).
 *
 * Both sides are reduced to a sequence of lowercase word tokens, ignoring
 * punctuation, quote styles, hyphenation and markup. Pull quotes are excluded
 * (they repeat body text). Any inserted, removed or changed word fails the check.
 *
 * Usage: node scripts/check-text.mjs [lang]   (default: en)
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const lang = process.argv[2] ?? 'en';
const root = new URL('..', import.meta.url).pathname;
const guideDir = join(root, 'src/content/guide', lang);
const referenceFile = join(root, 'docs/source/reference-2014.txt');

/** Lowercase word tokens; hyphens and apostrophes vanish, other punctuation splits. */
function tokenize(text) {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[-‐‑'‘’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

function referenceText() {
  return readFileSync(referenceFile, 'utf8')
    .split('\n')
    .filter((line) => !/^\[\[page \d+\]\]$/.test(line))
    .join('\n')
    .replace(/-\n/g, '') // words hyphenated across lines
    .replace(/\n/g, ' ');
}

function mdxText() {
  const files = readdirSync(guideDir)
    .filter((f) => f.endsWith('.mdx'))
    .sort();
  return files
    .map((file) => {
      const src = readFileSync(join(guideDir, file), 'utf8');
      const [, frontmatter, body] = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
      if (body === undefined) throw new Error(`${file}: missing frontmatter`);
      const title = frontmatter.match(/^title:\s*["']?(.*?)["']?$/m)?.[1] ?? '';
      const text = body
        .replace(/<PullQuote[^>]*>[\s\S]*?<\/PullQuote>/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\\([*_{}<>])/g, '$1')
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
      return `${title}\n${text}`;
    })
    .join('\n');
}

/** Myers diff over token arrays; returns a list of [op, token] with op in ' ', '-', '+'. */
function diff(a, b) {
  const n = a.length;
  const m = b.length;
  const max = n + m;
  const offset = max;
  const v = new Int32Array(2 * max + 2);
  const trace = [];
  for (let d = 0; d <= max; d++) {
    trace.push(v.slice());
    for (let k = -d; k <= d; k += 2) {
      let x =
        k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])
          ? v[offset + k + 1]
          : v[offset + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[offset + k] = x;
      if (x >= n && y >= m) return backtrack(trace, a, b, offset);
    }
  }
  return [];
}

function backtrack(trace, a, b, offset) {
  const ops = [];
  let x = a.length;
  let y = b.length;
  for (let d = trace.length - 1; d >= 0; d--) {
    const v = trace[d];
    const k = x - y;
    const prevK = k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1]) ? k + 1 : k - 1;
    const prevX = v[offset + prevK];
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) (ops.push([' ', a[--x]]), y--);
    if (d > 0) {
      if (x === prevX) ops.push(['+', b[--y]]);
      else ops.push(['-', a[--x]]);
    }
  }
  return ops.reverse();
}

const ref = tokenize(referenceText());
const ours = tokenize(mdxText());
const ops = diff(ref, ours);

const problems = [];
ops.forEach(([op], i) => {
  if (op === ' ') return;
  if (problems.length && i - problems.at(-1).end <= 3) problems.at(-1).end = i;
  else problems.push({ start: i, end: i });
});

if (problems.length === 0) {
  console.log(`✓ ${lang}: ${ours.length} words match the 2014 reference text.`);
  process.exit(0);
}

console.error(`✗ ${lang}: ${problems.length} difference(s) from the 2014 reference text:\n`);
for (const { start, end } of problems) {
  const from = Math.max(0, start - 6);
  const to = Math.min(ops.length, end + 7);
  const line = ops
    .slice(from, to)
    .map(([op, tok]) => (op === ' ' ? tok : op === '-' ? `[-${tok}-]` : `{+${tok}+}`))
    .join(' ');
  console.error(`  … ${line} …`);
}
console.error('\n[-word-] is in the PDF but missing here; {+word+} is here but not in the PDF.');
process.exit(1);
