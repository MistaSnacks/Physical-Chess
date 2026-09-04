// Desktop Lighthouse on /journey with a demo session.
// Seeds a Chromium profile via Playwright, then lets Lighthouse launch the
// same binary against that profile so localStorage survives navigation.
import { chromium } from 'playwright';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const base = process.argv[2] || 'http://localhost:4407';
const dir = mkdtempSync(join(tmpdir(), 'pc-lh-journey-'));
const chromePath = chromium.executablePath();

const context = await chromium.launchPersistentContext(dir, {
  headless: true,
  executablePath: chromePath,
  viewport: { width: 1350, height: 940 },
  args: ['--disable-gpu'],
});
const page = context.pages()[0] || await context.newPage();
await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
  localStorage.clear();
  sessionStorage.clear();
});
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-demo-btn]');
await page.click('[data-demo-btn]');
await page.waitForURL('**/who**');
await page.click('.quest-player-card:has-text("Gatinha")');
await page.waitForURL('**/journey**');
await page.waitForFunction(() => document.querySelector('[data-bind="xp"]')?.textContent !== '');
await context.close();

const r = spawnSync(
  'npx',
  [
    '--yes',
    'lighthouse@12',
    `${base}/journey`,
    `--chrome-path=${chromePath}`,
    '--disable-storage-reset',
    '--only-categories=performance,accessibility',
    '--preset=desktop',
    `--chrome-flags=--user-data-dir=${dir} --headless=new --disable-gpu --window-size=1350,940 --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding`,
    '--output=json',
    '--output-path=screenshots/final/lh-journey-desktop.json',
    '--quiet',
  ],
  { stdio: 'inherit', cwd: process.cwd() }
);

process.exit(r.status ?? 1);
