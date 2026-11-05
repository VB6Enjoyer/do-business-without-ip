#!/usr/bin/env node
/**
 * Accessibility and behaviour checks against the built site (run `npm run build` first).
 *
 * - axe-core (WCAG 2.2 A/AA) on every page, in light and dark themes, and with
 *   the footnote drawer open
 * - footnote drawer: keyboard open, arrow navigation, Esc, focus return, deep links
 * - no-JS fallback: footnote markers jump to the notes list
 * - mobile contents bar opens and closes after following a link
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const PORT = 4329;
const BASE = `http://localhost:${PORT}/do-business-without-ip/`;
const failures = [];

function check(condition, message) {
  if (condition) console.log(`  ✓ ${message}`);
  else {
    console.log(`  ✗ ${message}`);
    failures.push(message);
  }
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Preview server did not start');
}

async function axe(page, label) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  check(violations.length === 0, `axe: no violations (${label})`);
  for (const v of violations) {
    console.log(`      ${v.id} (${v.impact}): ${v.help}`);
    for (const node of v.nodes.slice(0, 3)) console.log(`        ${node.target.join(' ')}`);
  }
}

// `astro preview` runs as a background daemon; make sure none is left over.
const stopPreview = () =>
  new Promise((resolve) =>
    spawn('npx', ['astro', 'preview', 'stop'], { stdio: 'ignore' }).on('exit', resolve),
  );
await stopPreview();
const server = spawn('npx', ['astro', 'preview', '--port', String(PORT)], { stdio: 'ignore' });
let browser;
try {
  await waitForServer();
  browser = await chromium.launch();

  for (const scheme of ['light', 'dark']) {
    console.log(`\naxe (${scheme})`);
    const ctx = await browser.newContext({ colorScheme: scheme, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    for (const path of ['', 'guide/', 'this-page-does-not-exist/']) {
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      await axe(page, `/${path || ''} ${scheme}`);
    }
    await page.goto(BASE + 'guide/', { waitUntil: 'networkidle' });
    await page.click('#fnref-1');
    await page.waitForSelector('#fn-drawer[open]');
    await axe(page, `drawer open, ${scheme}`);
    await ctx.close();
  }

  console.log('\nFootnote drawer (keyboard)');
  {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(BASE + 'guide/', { waitUntil: 'networkidle' });
    await page.focus('#fnref-1');
    await page.keyboard.press('Enter');
    await page.waitForSelector('#fn-drawer[open]');
    const kicker = () => page.textContent('[data-fn-kicker]');
    check(
      (await kicker())?.includes('1 of 41'),
      'Enter on marker 1 opens the drawer at footnote 1',
    );
    check(
      await page.evaluate(() =>
        document.getElementById('fn-drawer').contains(document.activeElement),
      ),
      'focus moves into the drawer',
    );
    check(new URL(page.url()).hash === '#fn-1', 'URL reflects the open footnote (#fn-1)');
    await page.keyboard.press('ArrowRight');
    check((await kicker())?.includes('2 of 41'), 'ArrowRight moves to footnote 2');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    check((await kicker())?.includes('1 of 41'), 'ArrowLeft stops at footnote 1');
    check(await page.isDisabled('[data-fn-prev]'), '"Previous" is disabled on the first footnote');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');
    check(!(await page.isVisible('#fn-drawer')), 'Esc closes the drawer');
    // The dialog's close event is dispatched asynchronously.
    const settled = await page
      .waitForFunction(() => document.activeElement?.id === 'fnref-2', null, { timeout: 2000 })
      .then(() => true)
      .catch(() => false);
    check(settled, 'focus returns to the marker of the footnote last shown');
    check(new URL(page.url()).hash === '', 'URL hash is cleared on close');

    await page.click('#fnref-41');
    await page.waitForSelector('#fn-drawer[open]');
    check(await page.isDisabled('[data-fn-next]'), '"Next" is disabled on the last footnote');
    await page.mouse.click(10, 10); // backdrop
    check(!(await page.isVisible('#fn-drawer')), 'clicking the backdrop closes the drawer');

    await page.goto(BASE + 'guide/#fn-12', { waitUntil: 'networkidle' });
    await page.waitForSelector('#fn-drawer[open]');
    check((await kicker())?.includes('12 of 41'), 'deep link #fn-12 opens footnote 12');
    check(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join('; ') : ''}`);
    await ctx.close();
  }

  console.log('\nWithout JavaScript');
  {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(BASE + 'guide/');
    await page.click('#fnref-3');
    check(new URL(page.url()).hash === '#fn-3', 'marker jumps to the notes list');
    check(!(await page.isVisible('#fn-drawer')), 'drawer stays closed');
    await ctx.close();
  }

  console.log('\nMobile contents bar');
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(BASE + 'guide/', { waitUntil: 'networkidle' });
    check(await page.isVisible('.toc-mobile summary'), 'contents bar is visible');
    check(!(await page.isVisible('.guide-toc')), 'sidebar is hidden');
    await page.click('.toc-mobile summary');
    await page.click('.toc-mobile a[href="#history"]');
    check(!(await page.$eval('.toc-mobile', (d) => d.open)), 'bar closes after following a link');
    await page.waitForTimeout(200);
    check(
      (await page.textContent('[data-toc-current]'))?.includes('History'),
      'bar shows the current section',
    );
    check(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      'no horizontal scrolling at 390px',
    );
    await ctx.close();
  }
} finally {
  await browser?.close();
  server.kill();
  await stopPreview();
}

if (failures.length) {
  console.log(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll checks passed.');
