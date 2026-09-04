// Capture the me-family polish routes at desktop and mobile sizes.
// Run against the static build: node scripts/polish-me-family-shots.mjs http://localhost:4413
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const base = process.argv[2] || 'http://localhost:4413';
const out = 'screenshots/polish/me-family';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
const overflow = [];

page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});

async function capture(name, width) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  // The entrance stagger is capped at 600ms and each reveal lasts 500ms.
  await page.waitForTimeout(1200);
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  if (metrics.scrollWidth > metrics.clientWidth) {
    overflow.push(`${name}-${width}: ${metrics.scrollWidth}px > ${metrics.clientWidth}px`);
  }
  await page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: true });
}

async function captureBoth(name) {
  await capture(name, 1440);
  await capture(name, 390);
}

await page.goto(`${base}/login?demo=1`);
await page.waitForURL('**/who**');
await page.waitForSelector('.quest-player-card:has-text("Gatinha")');
await captureBoth('who');

await page.click('.quest-player-card:has-text("Gatinha")');
await page.waitForURL('**/journey**');
await page.goto(`${base}/me`);
await page.waitForSelector('[data-avatar-editor]');
await captureBoth('me');

await page.evaluate(() => sessionStorage.setItem('pc.grownUp', '1'));
await page.goto(`${base}/family`);
await page.waitForSelector('[data-settings-form]');
await captureBoth('family');

await page.goto(`${base}/family/players/new`);
await page.waitForSelector('[data-player-form]');
await captureBoth('player-new');

await page.goto(`${base}/family/players/edit?player=player-maya`);
await page.waitForSelector('[data-player-form]:not([hidden])');
await captureBoth('player-edit');

await page.goto(`${base}/family/report?player=player-maya`);
await page.waitForSelector('.quest-report__hero');
await captureBoth('report');

const result = { overflow, errors };
writeFileSync(`${out}/_results.json`, `${JSON.stringify(result, null, 2)}\n`);
await browser.close();

if (overflow.length || errors.length) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}
console.log('ME-FAMILY SHOTS OK');
