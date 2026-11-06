#!/usr/bin/env node
/**
 * Link checker for the guide's footnotes, glossary links and the sources of "Since 2014" updates.
 *
 * - Footnotes marked `live` must still resolve (2xx after redirects).
 * - Archived copies (web.archive.org) must exist.
 * - Every update source must resolve.
 *
 * Sites that block automated requests (403/429/503 bot walls) are reported as
 * warnings, not failures. Footnotes marked `unverified` or `dead` are not
 * expected to resolve; only their archived copy is checked.
 *
 * Usage: node scripts/check-links.mjs [--no-archive] [lang]
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const checkArchive = !args.includes('--no-archive');
const lang = args.find((a) => !a.startsWith('--')) ?? 'en';
const root = new URL('..', import.meta.url).pathname;
const UA = 'Mozilla/5.0 (compatible; do-business-without-ip link checker)';
const BLOCKED = new Set([401, 403, 429, 503]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const footnotes = JSON.parse(
  readFileSync(join(root, 'src/content/footnotes', `${lang}.json`), 'utf8'),
);
const updatesDir = join(root, 'src/content/updates', lang);
const sources = readdirSync(updatesDir)
  .filter((f) => f.endsWith('.md'))
  .flatMap((file) =>
    [...readFileSync(join(updatesDir, file), 'utf8').matchAll(/^\s+url:\s*'([^']+)'/gm)].map(
      (m) => ({
        file,
        url: m[1],
      }),
    ),
  );

async function probe(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        headers: { 'user-agent': UA },
        signal: AbortSignal.timeout(30000),
      });
      await res.body?.cancel();
      if (res.status === 429 && attempt < 2) {
        await sleep(5000 * (attempt + 1));
        continue;
      }
      return { status: res.status };
    } catch (error) {
      if (attempt === 2) return { status: 0, error: String(error.cause?.code ?? error.message) };
      await sleep(2000);
    }
  }
  return { status: 0, error: 'retries exhausted' };
}

const failures = [];
const warnings = [];

async function check(label, url) {
  const { status, error } = await probe(url);
  const ok = status >= 200 && status < 300;
  const line = `${label}: ${status || error} ${url}`;
  if (ok) console.log(`  ✓ ${line}`);
  else if (BLOCKED.has(status)) {
    console.log(`  ! ${line} (blocked automated check)`);
    warnings.push(line);
  } else {
    console.log(`  ✗ ${line}`);
    failures.push(line);
  }
  await sleep(400);
}

console.log(`Footnotes (${lang})`);
for (const fn of footnotes) {
  if (fn.linkStatus === 'live') await check(`fn ${fn.n} original`, fn.originalUrl);
  if (checkArchive && fn.archiveUrl) await check(`fn ${fn.n} archive`, fn.archiveUrl);
  if (fn.linkStatus !== 'live' && !fn.archiveUrl) {
    console.log(`  ! fn ${fn.n}: ${fn.linkStatus}, no archived copy`);
  }
}

console.log(`\nGlossary (${lang})`);
const glossary = JSON.parse(
  readFileSync(join(root, 'src/content/glossary', `${lang}.json`), 'utf8'),
);
for (const g of glossary) if (g.learnMore) await check(`glossary ${g.id}`, g.learnMore);

console.log(`\nCreators gallery (${lang})`);
const creators = JSON.parse(
  readFileSync(join(root, 'src/content/creators', `${lang}.json`), 'utf8'),
);
for (const c of creators) for (const src of c.sources) await check(`creator ${c.id}`, src.url);

console.log(`\nUpdate sources (${lang})`);
for (const { file, url } of sources) await check(file, url);

console.log(
  `\n${failures.length} failure(s), ${warnings.length} warning(s)` +
    (checkArchive ? '' : ' (archive links skipped)'),
);
if (failures.length) {
  console.log(
    '\nUpdate src/content/footnotes/*.json (linkStatus, linkNote) for any link that has died.',
  );
  process.exit(1);
}
