// Screenshot every player-facing route at 1440 and 390 into screenshots/final/.
// Also flags horizontal overflow. Run against a static server of dist/client:
//   node test/e2e/shots.mjs http://localhost:4407
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const base = process.argv[2] || 'http://localhost:4407';
mkdirSync('screenshots/final', { recursive: true });

const PUBLIC_ROUTES = [
  ['home', '/'],
  ['about', '/about'],
  ['about-educators', '/about/educators'],
  ['about-the-ace', '/about/the-ace'],
  ['about-abada', '/about/abada'],
  ['about-faq', '/about/faq'],
  ['about-contact', '/about/contact'],
  ['graduation', '/graduation'],
  ['graduation-what-is-batizado', '/graduation/what-is-batizado'],
  ['graduation-cordas', '/graduation/cordas'],
  ['graduation-media', '/graduation/media'],
  ['shop', '/shop'],
  ['login', '/login'],
  ['signup', '/signup'],
  ['forgot', '/forgot'],
  ['verify', '/verify'],
  ['privacy', '/privacy'],
  ['batizado', '/batizado'],
];

const PLAYER_ROUTES = [
  ['who', '/who'],
  ['journey', '/journey'],
  ['learn-movements', '/learn/movements'],
  ['learn-music', '/learn/music'],
  ['learn-culture', '/learn/culture'],
  ['learn-graduation', '/learn/graduation'],
  ['lesson-video', '/learn/movements/ginga-basics'],
  ['lesson-reading', '/learn/movements/roda-etiquette'],
  ['lesson-drill', '/learn/movements/esquiva-cocorinha'],
  ['lesson-quiz', '/learn/music/music-quiz'],
  ['me', '/me'],
  ['desafio', '/desafio'],
  ['turma', '/turma'],
];

const FAMILY_ROUTES = [
  ['family', '/family'],
  ['family-player-new', '/family/players/new'],
  ['family-player-edit', '/family/players/edit?player=player-maya'],
  ['family-report', '/family/report?player=player-maya'],
];

const COACH_ROUTES = [
  ['coach', '/coach'],
  ['coach-player', '/coach/player?id=player-maya'],
  ['coach-attendance', '/coach/attendance'],
  ['coach-class', '/coach/class'],
  ['coach-export', '/coach/export'],
  ['coach-goal', '/coach/goal'],
  ['admin-roles', '/admin/roles'],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const overflows = [];
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

async function overflowName(name) {
  const wide = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (wide) overflows.push(`${name}@${page.viewportSize().width}`);
}

async function shot(name) {
  await page.waitForTimeout(450);
  await overflowName(name);
  await page.screenshot({ path: `screenshots/final/${name}.png`, fullPage: true });
}

async function both(name, path) {
  await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  await page.setViewportSize({ width: 1440, height: 900 });
  await shot(`${name}-1440`);
  await page.setViewportSize({ width: 390, height: 844 });
  await shot(`${name}-390`);
  await page.setViewportSize({ width: 1440, height: 900 });
}

async function passGrownUp() {
  const overlay = page.locator('.quest-grownup');
  try {
    await overlay.waitFor({ timeout: 1500 });
  } catch {
    return;
  }
  const text = await overlay.locator('.quest-grownup__body').textContent();
  const m = String(text).match(/(\d+)\s*\+\s*(\d+)/);
  if (!m) return;
  await overlay.locator('#quest-grownup-answer').fill(String(Number(m[1]) + Number(m[2])));
  await overlay.locator('button[type=submit]').click();
  await overlay.waitFor({ state: 'detached' });
}

for (const [name, path] of PUBLIC_ROUTES) {
  await both(name, path);
}

await page.goto(`${base}/login`);
await page.evaluate(() => {
  localStorage.clear();
  sessionStorage.clear();
});
await page.reload();
await page.waitForSelector('[data-demo-btn]');
await page.click('[data-demo-btn]');
await page.waitForURL('**/who**');
await page.waitForSelector('.quest-player-card:has-text("Gatinha")');
await page.click('.quest-player-card:has-text("Gatinha")');
await page.waitForURL('**/journey**');
await page.waitForFunction(() => document.querySelector('[data-bind="xp"]')?.textContent !== '');

for (const [name, path] of PLAYER_ROUTES) {
  await both(name, path);
}

await page.goto(`${base}/who`);
await page.click('.quest-player-card:has-text("Tubarão")');
await page.waitForURL('**/journey**');
await page.waitForTimeout(800);
await page.setViewportSize({ width: 1440, height: 900 });
await shot('journey-new-player-1440');
await page.setViewportSize({ width: 390, height: 844 });
await shot('journey-new-player-390');
await page.setViewportSize({ width: 1440, height: 900 });

await page.goto(`${base}/who`);
await page.click('[data-grownups]');
await passGrownUp();
await page.waitForURL('**/family**');

for (const [name, path] of FAMILY_ROUTES) {
  await both(name, path);
  await passGrownUp();
}

await page.goto(`${base}/family`);
await page.waitForSelector('[data-to-coach]');
await page.click('[data-to-coach]');
await page.waitForURL('**/coach**');
await page.waitForSelector('.quest-stat-card, [data-empty-programs]');

for (const [name, path] of COACH_ROUTES) {
  await both(name, path);
}

await page.goto(`${base}/coach/class`);
await page.waitForSelector('[data-grid] .quest-player-card');
await page.locator('[data-grid] .quest-player-card').first().click();
await page.waitForURL('**/journey**');
await page.waitForSelector('[data-class-mode-bar]');
await page.setViewportSize({ width: 1440, height: 900 });
await shot('class-mode-journey-1440');
await page.setViewportSize({ width: 390, height: 844 });
await shot('class-mode-journey-390');
await page.setViewportSize({ width: 1440, height: 900 });
await page.click('[data-end-class]');
await page.waitForURL('**/coach/class**');

await page.goto(`${base}/family`);
await page.waitForSelector('[data-to-coach]');

// Static dist cannot import /src. Patch the demo db instead.
await page.evaluate(() => {
  const db = JSON.parse(localStorage.getItem('pc.demo.v1') || '{}');
  if (db.account) {
    db.account.role = 'coach';
    db.account.programs = [];
    localStorage.setItem('pc.demo.v1', JSON.stringify(db));
  }
});
await page.goto(`${base}/coach`);
await page.waitForSelector('[data-empty-programs], .quest-stat-card');
await page.setViewportSize({ width: 1440, height: 900 });
await shot('coach-no-program-1440');
await page.setViewportSize({ width: 390, height: 844 });
await shot('coach-no-program-390');

await page.evaluate(() => {
  const db = JSON.parse(localStorage.getItem('pc.demo.v1') || '{}');
  if (db.account) {
    db.account.role = 'guardian';
    db.account.programs = [];
    db.players = [];
    localStorage.setItem('pc.demo.v1', JSON.stringify(db));
  }
  sessionStorage.removeItem('pc.activePlayer');
});
await page.goto(`${base}/who`);
await page.waitForSelector('[data-empty]');
await page.setViewportSize({ width: 1440, height: 900 });
await shot('who-no-players-1440');
await page.setViewportSize({ width: 390, height: 844 });
await shot('who-no-players-390');
await page.goto(`${base}/family`);
await page.waitForSelector('[data-empty]');
await page.setViewportSize({ width: 1440, height: 900 });
await shot('family-no-players-1440');
await page.setViewportSize({ width: 390, height: 844 });
await shot('family-no-players-390');

await browser.close();

const report = { overflows, errors: [...new Set(errors)] };
writeFileSync('screenshots/final/_overflow.json', JSON.stringify(report, null, 2));
console.log(`shots written to screenshots/final/ · overflow flags: ${overflows.length} · pageerrors: ${report.errors.length}`);
if (overflows.length) {
  console.error('horizontal overflow:', overflows.join(', '));
  process.exit(1);
}
