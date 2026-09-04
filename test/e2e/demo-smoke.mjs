// Demo smoke: log in (demo) → who → Maya → journey → open next lesson →
// complete it → HUD XP went up → refresh keeps it. Run: node test/e2e/demo-smoke.mjs <baseUrl>
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://localhost:4398';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const shot = (n) => page.screenshot({ path: `screenshots/smoke-${n}.png` });

await page.goto(`${base}/login`);
await page.click('[data-demo-btn]');
await page.waitForURL('**/who**');
await shot('who');
await page.click('.quest-player-card:has-text("Gatinha")');
await page.waitForURL('**/journey**');
await page.waitForFunction(() => document.querySelector('[data-bind="xp"]')?.textContent !== '' );
await page.waitForTimeout(1500);
const xp1 = Number(await page.textContent('[data-bind="xp"]'));
const name = await page.textContent('[data-bind="player.apelido"]');
await shot('journey');

await page.goto(`${base}/learn/movements/au`);
await page.waitForSelector('[data-complete]');
await page.click('[data-complete]');
await page.waitForSelector('[data-finished]:not([hidden])');
await shot('lesson-done');

await page.goto(`${base}/journey`);
await page.waitForTimeout(1500);
const xp2 = Number(await page.textContent('[data-bind="xp"]'));
const weeks = await page.textContent('[data-bind="streak.weeks"]');

await page.goto(`${base}/learn/music/music-quiz`);
await page.click('[data-quiz-choice][data-choice-index="1"]');
await page.click('[data-quiz-next]:visible');
await page.click('[data-question-index="1"] [data-quiz-choice][data-choice-index="2"]');
await page.click('[data-question-index="1"] [data-quiz-next]');
await page.click('[data-question-index="2"] [data-quiz-choice][data-choice-index="0"]');
await page.click('[data-question-index="2"] [data-quiz-next]');
await page.waitForSelector('[data-finished]:not([hidden])');
await shot('quiz-done');
await page.goto(`${base}/journey`);
await page.waitForTimeout(1200);
const xp3 = Number(await page.textContent('[data-bind="xp"]'));
const patches = await page.textContent('[data-bind="patches.length"]');

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/who`);
await page.waitForTimeout(800);
await shot('who-mobile');
await browser.close();

console.log(JSON.stringify({ name, xp1, xp2, xp3, weeks, patches, errors }, null, 1));
if (!(xp2 > xp1 && xp3 > xp2)) { console.error('XP did not increase'); process.exit(1); }
if (errors.length) { console.error('page errors'); process.exit(1); }
console.log('SMOKE OK');
