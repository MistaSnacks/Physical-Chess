// Demo smoke: sign in → who → add player → each lesson type → rewards →
// module cleared → level up → /me → report CSV → coach → class mode → export.
// Also replays a queued outbox event. Keep printing SMOKE OK.
// Run: node test/e2e/demo-smoke.mjs <baseUrl>
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] || 'http://localhost:4407';
mkdirSync('screenshots', { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => {
  if (m.type() !== 'error') return;
  const t = m.text();
  if (/compute-pressure is not allowed/i.test(t)) return;
  errors.push('console: ' + t);
});

const shot = (n) => page.screenshot({ path: `screenshots/smoke-${n}.png` });

async function passGrownUp() {
  const overlay = page.locator('.quest-grownup');
  try {
    await overlay.waitFor({ timeout: 2000 });
  } catch {
    return;
  }
  const text = await overlay.locator('.quest-grownup__body').textContent();
  const m = String(text).match(/(\d+)\s*\+\s*(\d+)/);
  if (!m) throw new Error('grown-up gate missing math: ' + text);
  await overlay.locator('#quest-grownup-answer').fill(String(Number(m[1]) + Number(m[2])));
  await overlay.locator('button[type=submit]').click();
  await overlay.waitFor({ state: 'detached' });
}

async function withClock(fn) {
  await page.clock.install();
  try {
    await fn();
  } finally {
    if (typeof page.clock.uninstall === 'function') await page.clock.uninstall();
    else if (page.clock.resume) await page.clock.resume();
  }
}

async function completeVideo(path) {
  await withClock(async () => {
    await page.goto(`${base}${path}`);
    await page.waitForSelector('[data-complete]');
    await page.clock.fastForward(61000);
    await page.locator('[data-complete]').click();
    await page.waitForSelector('[data-finished]:not([hidden])');
  });
}

async function completeReading(path) {
  await page.goto(`${base}${path}`);
  await page.waitForSelector('[data-check-choice]');
  await page.locator('[data-check-choice][data-correct="true"]').click();
  await page.waitForSelector('[data-finished]:not([hidden])');
}

async function completeDrill(path) {
  await withClock(async () => {
    await page.goto(`${base}${path}`);
    await page.waitForSelector('[data-drill-toggle]');
    const seconds = Number(await page.locator('[data-drill-timer]').getAttribute('data-seconds')) || 60;
    await page.locator('[data-drill-toggle]').click();
    await page.clock.fastForward((seconds + 2) * 1000);
    await page.locator('[data-rate="3"]').click();
    await page.waitForSelector('[data-finished]:not([hidden])');
  });
}

async function completeQuiz(path) {
  await page.goto(`${base}${path}`);
  await page.waitForSelector('[data-quiz]');
  await page.locator('[data-lesson-stage]:not([inert])').waitFor();
  const questionCount = await page.locator('[data-quiz-question]').count();
  for (let i = 0; i < questionCount; i++) {
    const q = page.locator(`[data-quiz-question][data-question-index="${i}"]`);
    await q.locator('[data-quiz-choice][data-is-correct="true"]').click();
    await q.locator('[data-quiz-next]').click();
  }
  await page.waitForSelector('[data-finished]:not([hidden])');
}

async function completeDesafio() {
  await page.goto(`${base}/desafio`);
  await page.waitForSelector('[data-stage]');
  if (await page.locator('.quest-done__title').count()) return;
  if (await page.locator('[data-reveal]').count()) {
    await page.locator('[data-reveal]').click();
    await page.locator('[data-ok]').first().click();
  } else if (await page.locator('[data-start]').count()) {
    await withClock(async () => {
      await page.locator('[data-start]').click();
      await page.clock.fastForward(35000);
      await page.locator('[data-done]').click();
    });
  } else if (await page.locator('[data-v]').count()) {
    await page.locator('[data-v="true"]').click();
    if (await page.locator('[data-wrong]:not([hidden])').count()) {
      await page.locator('[data-v="false"]').click();
    }
  } else if (await page.locator('[data-pool] [data-i]').count()) {
    const n = await page.locator('[data-pool] [data-i]').count();
    for (let i = 0; i < n; i++) {
      await page.locator(`[data-pool] [data-i="${i}"]`).click();
    }
  } else if (await page.locator('[data-choice]').count()) {
    const n = await page.locator('[data-choice]').count();
    for (let i = 0; i < n; i++) {
      await page.locator('[data-choice]').nth(i).click();
      if (await page.locator('.quest-done__title').count()) break;
    }
  }
  await page.waitForSelector('.quest-done__title');
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

await page.goto(`${base}/`);
await page.waitForSelector('.skip-link');
const skipHref = await page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').first().getAttribute('href');
if (skipHref !== '#main') fail('skip-to-content is not the first focusable: ' + skipHref);

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
await shot('who');

// Outbox replay: queue a Leo lesson, then open his map so flushOutbox writes it.
await page.evaluate(() => {
  const ev = {
    clientEventId: 'qa-outbox-replay',
    playerId: 'player-leo',
    accountId: 'acct-demo',
    type: 'lesson.video.done',
    moduleId: 'movements',
    lessonId: 'ginga-basics',
    payload: {},
    xp: 20,
    stars: 1,
    occurredAt: new Date().toISOString(),
    source: 'app',
  };
  localStorage.setItem('pc.outbox', JSON.stringify([ev]));
});
await page.click('.quest-player-card:has-text("Tubarão")');
await page.waitForURL('**/journey**');
await page.waitForFunction(() => document.querySelector('[data-bind="xp"]')?.textContent !== '');
const outboxReplayed = await page.evaluate(() => {
  const db = JSON.parse(localStorage.getItem('pc.demo.v1') || '{}');
  const box = JSON.parse(localStorage.getItem('pc.outbox') || '[]');
  return {
    inLedger: (db.events || []).some((e) => e.clientEventId === 'qa-outbox-replay'),
    leftover: box.length,
  };
});
if (!outboxReplayed.inLedger || outboxReplayed.leftover) {
  fail('outbox did not replay: ' + JSON.stringify(outboxReplayed));
}

await page.goto(`${base}/who`);
await page.waitForSelector('[data-grownups]');
await page.click('[data-grownups]');
await passGrownUp();
await page.waitForURL('**/family**');
await page.click('[data-add-player]');
await page.waitForURL('**/family/players/new**');
await page.fill('#firstName', 'Nico');
await page.fill('#apelido', 'Sabiá');
await page.fill('#inviteCode', 'BUSHWICK');
await page.click('button[type=submit]');
await page.waitForURL('**/journey**');
await page.waitForFunction(() => document.querySelector('[data-bind="xp"]')?.textContent !== '');

await completeVideo('/learn/movements/ginga-basics');
await shot('lesson-video');

await page.goto(`${base}/who`);
await page.click('.quest-player-card:has-text("Gatinha")');
await page.waitForURL('**/journey**');
await page.waitForFunction(() => document.querySelector('[data-bind="xp"]')?.textContent !== '');
const xp1 = Number(await page.textContent('[data-bind="xp"]'));
const name = await page.textContent('[data-bind="player.apelido"]');
await shot('journey');

await page.emulateMedia({ reducedMotion: 'reduce' });
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('[data-bind="xp"]')?.textContent !== '');
const hiddenEnter = await page.evaluate(
  () => [...document.querySelectorAll('[data-quest-enter]')].filter((el) => el.getAttribute('data-quest-enter') !== 'true').length
);
if (hiddenEnter) fail('reduced-motion left ' + hiddenEnter + ' entrance nodes hidden');
await page.emulateMedia({ reducedMotion: null });
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('[data-bind="xp"]')?.textContent !== '');

await completeReading('/learn/movements/roda-etiquette');
await shot('lesson-reading');
await completeDrill('/learn/movements/kick-combo');
await shot('lesson-drill');

await completeVideo('/learn/music/pandeiro-atabaque');
await completeReading('/learn/music/agogo-reco-reco');
await completeDrill('/learn/music/sing-the-roda');
await completeQuiz('/learn/music/music-quiz');
await shot('quiz-done');
const moduleKicker = await page.locator('[data-cleared-kicker]').textContent();
if (!/module cleared/i.test(moduleKicker || '')) fail('expected module cleared after music quiz, got: ' + moduleKicker);

await page.goto(`${base}/journey`);
await page.waitForFunction(() => document.querySelector('[data-bind="xp"]')?.textContent !== '');
const xp2 = Number(await page.textContent('[data-bind="xp"]'));
const weeks = await page.textContent('[data-bind="streak.weeks"]');
const patches = await page.textContent('[data-bind="patches.length"]');
const level = Number(await page.textContent('[data-bind="level.level"]'));
if (!(xp2 > xp1)) fail(`XP did not increase (${xp1} → ${xp2})`);
if (!(level >= 4)) fail(`expected Maya level ≥ 4 after music clear, got ${level}`);

await completeDesafio();
await shot('desafio');

await page.goto(`${base}/me`);
await page.waitForSelector('[data-hud]');
await shot('me');

await page.goto(`${base}/family`);
await passGrownUp();
await page.waitForSelector('.quest-family-card__report');
await page.locator('.quest-family-card:has-text("Gatinha") .quest-family-card__report').click();
await page.waitForURL('**/family/report**');
await page.waitForSelector('[data-csv]');
const [csvDownload] = await Promise.all([
  page.waitForEvent('download'),
  page.click('[data-csv]'),
]);
const csvName = csvDownload.suggestedFilename();
if (!/\.csv$/i.test(csvName)) fail('report card did not download a CSV: ' + csvName);
await shot('report');

await page.goto(`${base}/family`);
await page.waitForSelector('[data-to-coach]');
await page.click('[data-to-coach]');
await page.waitForURL('**/coach**');
await page.waitForSelector('.quest-stat-card, [data-empty-programs]');
if (await page.locator('[data-empty-programs]').count()) fail('demo coach should have programs assigned');
await page.waitForFunction(() => {
  const el = document.querySelector('.quest-stat-card');
  return !!(el && getComputedStyle(el).opacity !== '0');
});
await shot('coach');

await page.goto(`${base}/coach/class`);
await page.waitForSelector('[data-grid] .quest-player-card');
await page.locator('[data-grid] .quest-player-card').first().click();
await page.waitForURL('**/journey**');
await page.waitForSelector('[data-class-mode-bar]');
await shot('class-mode');
await page.click('[data-end-class]');
await page.waitForURL('**/coach/class**');

await page.goto(`${base}/coach/export`);
await page.waitForSelector('[data-dl]');
const [exportDownload] = await Promise.all([
  page.waitForEvent('download'),
  page.click('[data-dl="program:players:csv"]'),
]);
if (!/\.csv$/i.test(exportDownload.suggestedFilename())) fail('coach export did not download a CSV');

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/who`);
await page.waitForTimeout(600);
await shot('who-mobile');

await browser.close();

const summary = { name, xp1, xp2, weeks, patches, level, csvName, errors };
console.log(JSON.stringify(summary, null, 1));
if (errors.length) {
  console.error('page errors');
  process.exit(1);
}
console.log('SMOKE OK');
