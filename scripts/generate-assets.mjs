#!/usr/bin/env node
/**
 * Renders the social preview image and app icons into public/. They are
 * typographic placeholders until real artwork exists: edit the HTML below
 * (or replace the PNGs) and rerun `npm run assets`.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const root = new URL('..', import.meta.url).pathname;
const pub = join(root, 'public');
const fontDir = join(root, 'node_modules/@fontsource-variable');
const fontUrl = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(fontDir, pkg, 'files', file)).toString('base64')}`;
const serif = fontUrl('source-serif-4', 'source-serif-4-latin-opsz-normal.woff2');
const sans = fontUrl('inter', 'inter-latin-wght-normal.woff2');
// Light-theme colors for the favicon classes and the illustration variables.
const bulb = readFileSync(join(pub, 'favicon.svg'), 'utf8').replace(
  /<style>.*?<\/style>/,
  '<style>.b{stroke:#2f6b3c}.f{stroke:#e2731f}</style>',
);
const hero = readFileSync(join(root, 'src/assets/illustrations/hero.svg'), 'utf8');
const illVars =
  '--ill-ink:#1f1c18;--ill-accent:#2f6b3c;--ill-soft:#e3efd9;--ill-paper:#f8f5ef;--ill-muted:#b9b0a3;--ill-orange:#e2731f';

const baseCss = `
  @font-face { font-family: 'CardSerif'; src: url(${serif}) format('woff2'); font-weight: 200 900; }
  @font-face { font-family: 'CardSans'; src: url(${sans}) format('woff2'); font-weight: 100 900; }
  * { margin: 0; box-sizing: border-box; }
  body { background: #f8f5ef; color: #1f1c18; }
`;

const og = `<!doctype html><html><head><style>${baseCss}
  body { width: 1200px; height: 630px; padding: 88px; display: flex; flex-direction: column;
         justify-content: center; border-left: 14px solid #2f6b3c; }
  .kicker { font: 700 22px 'CardSans'; letter-spacing: .1em; text-transform: uppercase; color: #2f6b3c; }
  h1 { font: 300 76px/1.05 'CardSerif'; letter-spacing: -.015em; margin: 28px 0 24px; }
  h1 b { font-weight: 800; }
  .by { font: italic 400 36px 'CardSerif'; color: #5d5650; }
  .foot { position: absolute; bottom: 64px; left: 102px; font: 600 22px 'CardSans'; color: #5d5650; }
  .art { position: absolute; right: 70px; top: 50%; transform: translateY(-50%); width: 360px; ${illVars} }
  .art svg { display: block; width: 100%; height: auto; }
  h1 { max-width: 700px; }
</style></head><body><div class="art">${hero}</div>
  <p class="kicker">Guide 1.0 · 2014 · Web edition</p>
  <h1>Do Business <b>Without</b><br>Intellectual Property</h1>
  <p class="by">by Stephan Kinsella</p>
  <p class="foot">Free to read, free to share: public domain (CC0)</p>
</body></html>`;

const icon = (size, padding) => `<!doctype html><html><head><style>${baseCss}
  body { width: ${size}px; height: ${size}px; display: grid; place-items: center; background: #f8f5ef; }
  svg { width: ${size - padding * 2}px; height: ${size - padding * 2}px; }
</style></head><body>${bulb}</body></html>`;

mkdirSync(join(pub, 'og'), { recursive: true });
const browser = await chromium.launch();
async function render(html, width, height, file) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(pub, file) });
  await page.close();
  console.log(`wrote public/${file}`);
}
await render(og, 1200, 630, 'og/default.png');
await render(icon(180, 28), 180, 180, 'apple-touch-icon.png');
await render(icon(192, 30), 192, 192, 'icon-192.png');
// Maskable icon: keep the mark inside the central safe zone (80%).
await render(icon(512, 110), 512, 512, 'icon-512.png');
await browser.close();
