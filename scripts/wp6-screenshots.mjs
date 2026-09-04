// WP6 screenshots at 1440 and 390. Run against a static server of dist/client.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] || 'http://localhost:4406';
mkdirSync('screenshots/wp6', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

async function shot(name) {
  await page.waitForTimeout(600);
  await page.screenshot({ path: `screenshots/wp6/${name}.png`, fullPage: true });
}

async function both(name) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await shot(`${name}-1440`);
  await page.setViewportSize({ width: 390, height: 844 });
  await shot(`${name}-390`);
  await page.setViewportSize({ width: 1440, height: 900 });
}

await page.goto(`${base}/login`);
await page.click('[data-demo-btn]');
await page.waitForURL('**/who**');

await page.goto(`${base}/family`);
await page.waitForSelector('[data-to-coach]');
await both('family-coach-toggle');
await page.click('[data-to-coach]');
await page.waitForURL('**/coach**');
await page.waitForSelector('.quest-stat-card');
await both('coach-overview');

await page.waitForSelector('.quest-roster-link');
const playerHref = await page.locator('.quest-roster-link').first().getAttribute('href');
await page.goto(playerHref.startsWith('http') ? playerHref : `${base}${playerHref}`);
await page.waitForSelector('[data-stamp]');
await both('coach-player');

await page.goto(`${base}/coach/attendance`);
await page.waitForSelector('[data-grid] .quest-player-card');
await both('coach-attendance');

await page.goto(`${base}/coach/class`);
await page.waitForSelector('[data-grid] .quest-player-card');
await both('coach-class');

await page.goto(`${base}/coach/export`);
await page.waitForSelector('[data-dl]');
await both('coach-export');

await page.goto(`${base}/coach/goal`);
await page.waitForSelector('[data-form]');
await both('coach-goal');

await page.goto(`${base}/family`);
await page.waitForSelector('[data-to-admin]');
await page.click('[data-to-admin]');
await page.waitForURL('**/admin/roles**');
await page.waitForSelector('[data-list] form');
await both('admin-roles');

await page.goto(`${base}/who`);
await page.waitForSelector('.quest-player-card');
await page.click('.quest-player-card:has-text("Gatinha")');
await page.waitForURL('**/journey**');
await page.waitForTimeout(800);
await page.goto(`${base}/desafio`);
await page.waitForSelector('[data-stage]');
await both('desafio');

await page.goto(`${base}/turma`);
await page.waitForSelector('[data-root] .quest-card');
await both('turma');

await page.goto(`${base}/coach/class`);
await page.waitForSelector('[data-grid] .quest-player-card');
await page.locator('[data-grid] .quest-player-card').first().click();
await page.waitForURL('**/journey**');
await page.waitForSelector('[data-class-mode-bar]');
await both('class-mode-journey');

await browser.close();
console.log('WP6 screenshots written to screenshots/wp6/');
