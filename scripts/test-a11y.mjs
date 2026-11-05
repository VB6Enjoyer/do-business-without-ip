#!/usr/bin/env node
/**
 * Accessibility and behaviour checks against the built site (run `npm run build` first).
 *
 * - axe-core (WCAG 2.2 A/AA) on every page, in light and dark themes, and with
 *   the footnote drawer open
 * - footnote drawer: keyboard open, arrow navigation, Esc, focus return, deep links
 * - archive links for dead footnotes; "Since 2014" updates in the drawer
 * - interactives: covenant demo outcomes, copyright timeline values and readouts
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
    for (const path of ['', 'guide/', 'about/', 'this-page-does-not-exist/']) {
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
    const kicker = () => page.textContent('[data-drawer-kicker]');
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
    check(
      await page.isDisabled('[data-drawer-prev]'),
      '"Previous" is disabled on the first footnote',
    );
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
    check(await page.isDisabled('[data-drawer-next]'), '"Next" is disabled on the last footnote');
    await page.mouse.click(10, 10); // backdrop
    check(!(await page.isVisible('#fn-drawer')), 'clicking the backdrop closes the drawer');

    await page.goto(BASE + 'guide/#fn-12', { waitUntil: 'networkidle' });
    await page.waitForSelector('#fn-drawer[open]');
    check((await kicker())?.includes('12 of 41'), 'deep link #fn-12 opens footnote 12');

    console.log('\nLinks in the drawer');
    await page.goto(BASE + 'guide/#fn-4', { waitUntil: 'networkidle' });
    await page.waitForSelector('#fn-drawer[open]');
    check(
      (await page.getAttribute('[data-fn-link]', 'href'))?.startsWith('https://web.archive.org/'),
      'dead link (footnote 4) points to its archived copy',
    );
    check(await page.isVisible('[data-fn-link-note]'), 'dead link shows an explanatory note');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    check(
      (await page.getAttribute('[data-fn-link]', 'href')) ===
        'http://c4sif.org/2011/03/types-of-intellectual-property/',
      'live link (footnote 2) points to the original',
    );
    check(await page.isVisible('[data-fn-archive]'), 'live link also offers the archived copy');
    await page.keyboard.press('Escape');

    console.log('\nUpdates in the drawer');
    await page.goto(BASE + 'guide/', { waitUntil: 'networkidle' });
    await page.click('#sinceref-tpp');
    await page.waitForSelector('#fn-drawer[open]');
    check((await kicker())?.includes('1 of 6'), 'update marker opens the first update');
    check(
      (await page.textContent('[data-update-body]'))?.includes('CPTPP'),
      'drawer shows the update text',
    );
    check(
      (await page.$$('[data-update-body] .update-sources a')).length > 0,
      'drawer shows the sources of the update',
    );
    check(new URL(page.url()).hash === '#since-tpp', 'URL reflects the open update');
    await page.keyboard.press('ArrowRight');
    check((await kicker())?.includes('2 of 6'), 'ArrowRight moves to the next update');
    await page.keyboard.press('Escape');
    const backToUpdate = await page
      .waitForFunction(() => document.activeElement?.id === 'sinceref-smartphone-wars', null, {
        timeout: 2000,
      })
      .then(() => true)
      .catch(() => false);
    check(backToUpdate, 'focus returns to the marker of the update last shown');
    await page.goto(BASE + 'guide/#since-motorola', { waitUntil: 'networkidle' });
    await page.waitForSelector('#fn-drawer[open]');
    check(
      (await page.textContent('[data-drawer-title]'))?.includes('Motorola'),
      'deep link #since-motorola opens that update',
    );
    await axe(page, 'update drawer open');

    check(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join('; ') : ''}`);
    await ctx.close();
  }

  console.log('\nInteractive: covenant demo');
  {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(BASE + 'guide/', { waitUntil: 'networkidle' });
    const demo = page.locator('#covenant-demo');
    await demo.scrollIntoViewIfNeeded();
    await page.waitForSelector('#covenant-demo astro-island:not([ssr])');
    const paint = demo.getByRole('button', { name: 'Paint my house orange' });
    const result = () => demo.locator('[role="status"]').textContent();

    await paint.click();
    check((await result())?.includes('Painted.'), 'unsigned owner can paint under the covenant');
    await demo.getByRole('button', { name: 'Start over' }).click();
    await demo.getByLabel('I sign the covenant too').check();
    await paint.click();
    check(
      (await result())?.includes('When you signed'),
      'signed owner is vetoed, with consent explained',
    );
    await demo.getByLabel('Patent or copyright').check();
    check((await result())?.trim() === '', 'switching arrangement resets the outcome');
    await paint.click();
    check((await result())?.includes('never agreed'), 'patent holder vetoes without consent');
    check(
      (await demo.locator('[role="img"]').getAttribute('aria-label'))?.includes('vetoed'),
      'neighborhood image describes the outcome',
    );
    await axe(page, 'guide after using the covenant demo');
    check(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join('; ') : ''}`);
    await ctx.close();
  }

  console.log('\nInteractive: copyright timeline');
  {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(BASE + 'guide/', { waitUntil: 'networkidle' });
    const chart = page.locator('#copyright-timeline');
    await chart.scrollIntoViewIfNeeded();
    await page.waitForSelector('#copyright-timeline astro-island:not([ssr])');
    const today = () => chart.locator('.today').textContent();

    check((await today())?.includes('113 years'), 'default author (35, dies at 78): 113 years');
    await chart.getByLabel('Made for hire (by a company)').check();
    check((await today())?.includes('95 years'), 'work made for hire: 95 years');
    check(
      (await chart.locator('input[type="range"]').count()) === 0,
      'age sliders hide for corporate works',
    );
    await chart.getByLabel('By an individual author').check();
    const created = chart.locator('input[type="range"]').first();
    await created.focus();
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
    check((await today())?.includes('108 years'), 'slider by keyboard (created at 40): 108 years');

    await chart.locator('circle.marker').nth(2).focus();
    const tip = await chart.locator('.tooltip').textContent();
    check(
      tip?.includes('56 years') && tip.includes('1909'),
      'focusing a law marker shows its readout (1909: 56 years)',
    );
    const box = await chart.locator('svg').boundingBox();
    await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.5);
    check(
      await chart.locator('.tooltip').isVisible(),
      'hovering the plot shows the crosshair readout',
    );

    await chart.locator('summary').click();
    check((await chart.locator('tbody tr').count()) === 6, 'table view lists all six laws');
    await axe(page, 'guide after using the timeline');
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
    await page.click('#sinceref-tpp');
    check(new URL(page.url()).hash === '#since-tpp', 'update marker jumps to the updates list');
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
