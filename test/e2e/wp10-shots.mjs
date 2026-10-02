// WP10 screenshots at 390 and 1440, plus a horizontal-overflow check.
//   node test/e2e/wp10-shots.mjs http://localhost:4412 <out-dir>
// Screens: home (hero H1, age link, latest card), footer, /classes (and its
// demo form state), contact, journey latest video.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.argv[2] || 'http://localhost:4412';
const out = process.argv[3] || 'screenshots/wp10';
mkdirSync(out, { recursive: true });

const WIDTHS = [390, 1440];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

async function settle() {
  await page.waitForTimeout(1400); // entrance motion is <= 1.2 s
}
async function overflow(name) {
  const wide = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (wide) problems.push(`horizontal overflow: ${name}@${page.viewportSize().width}`);
}
async function full(name, path) {
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: w === 390 ? 844 : 900 });
    await page.goto(`${base}${path}`, { waitUntil: 'load' });
    await settle();
    await overflow(name);
    await page.screenshot({ path: join(out, `${name}-${w}.png`), fullPage: true });
  }
}
async function element(name, path, selector) {
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: w === 390 ? 844 : 900 });
    if (path) await page.goto(`${base}${path}`, { waitUntil: 'load' });
    const el = page.locator(selector).first();
    await el.scrollIntoViewIfNeeded();
    await settle();
    await overflow(name);
    await el.screenshot({ path: join(out, `${name}-${w}.png`) });
  }
}

await full('home', '/');
await element('home-hero', '/', '.quest-hero');
await element('home-latest', '/', '.quest-section--latest');
await element('footer', '/', '.quest-footer');
await full('classes', '/classes');
await full('contact', '/about/contact');

// /classes inquiry in demo: a static server has no API, so the page says so.
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/classes`, { waitUntil: 'load' });
await page.locator('[data-classes-form]').scrollIntoViewIfNeeded();
await settle();
await page.fill('#classes-name', 'Test Grown-up');
await page.fill('#classes-email', 'test@example.com');
await page.fill('#classes-age', '9');
await page.selectOption('#classes-program', { index: 1 });
await page.click('[data-classes-form] [data-submit]');
await page.waitForSelector('[data-classes-form] [data-ok]:not([hidden])');
const okText = await page.textContent('[data-classes-form] [data-ok]');
if (!/Demo: nothing was sent\./.test(okText)) problems.push(`classes form said "${okText}"`);
await settle();
await page.locator('[data-classes-form]').screenshot({ path: join(out, 'classes-form-demo-390.png') });

// Journey latest video needs a demo player.
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/login`);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.reload();
await page.waitForSelector('[data-demo-btn]');
await page.click('[data-demo-btn]');
await page.waitForURL('**/who**');
await page.click('.quest-player-card:has-text("Gatinha")');
await page.waitForURL('**/journey**');
await full('journey', '/journey');
await element('journey-video', '/journey', '.quest-latest');

await browser.close();
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`WP10 SHOTS OK -> ${out}`);
