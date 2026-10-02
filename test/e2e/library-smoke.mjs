// Library smoke (SPEC-v3 WP9 + R10.5). Proves the instructor library has no
// progress side effects and every library page is noindex.
//
// With a remembered child selected and an event waiting in the outbox, open
// ten library entries three ways:
//   A. full page loads (the select:false path in nav.js),
//   B. from /coach through CoachNav (a click the router intercepts),
//   C. from a lesson page (a click the router intercepts).
// Library pages carry no <ClientRouter />, so in B and C Astro's router falls
// back to a full page load; the test asserts that too, because pages visited
// earlier keep `astro:page-load` listeners (e.g. /coach's requireSession)
// that would otherwise run on library pages.
// On every library page no pc.* storage key is written. After each run the
// ledger, XP, outbox (localStorage pc.outbox) and active player are
// unchanged, and back on a player page the same child is still playing.
// Then: phone search for "gin" with no child selected, noindex on every
// library page, nothing in the sitemap, and the Field guide card links.
// Writes no screenshots. Prints LIBRARY OK.
// Run: node test/e2e/library-smoke.mjs <baseUrl>
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://localhost:4411';
const browser = await chromium.launch();
const errors = [];

function fail(msg) {
  console.error('LIBRARY FAIL: ' + msg);
  process.exit(1);
}

function watch(page) {
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/compute-pressure is not allowed/i.test(t)) return;
    errors.push('console: ' + t);
  });
}

// Records every write to a pc.* key (player, outbox, demo ledger, class mode).
const SPY = () => {
  window.__pcWrites = [];
  const proto = Storage.prototype;
  const set = proto.setItem;
  const remove = proto.removeItem;
  const clear = proto.clear;
  const log = (op, key) => {
    if (op === 'clear' || String(key).startsWith('pc.')) window.__pcWrites.push(`${op} ${key ?? ''} @ ${location.pathname}`);
  };
  proto.setItem = function (k, v) { log('set', k); return set.call(this, k, v); };
  proto.removeItem = function (k) { log('remove', k); return remove.call(this, k); };
  proto.clear = function () { log('clear'); return clear.call(this); };
};

async function passGrownUp(page) {
  const overlay = page.locator('.quest-grownup').first();
  try { await overlay.waitFor({ timeout: 4000 }); } catch { return; }
  const text = await overlay.locator('.quest-grownup__body').textContent();
  const m = String(text).match(/(\d+)\s*\+\s*(\d+)/);
  if (!m) fail('grown-up gate missing math: ' + text);
  await overlay.locator('#quest-grownup-answer').fill(String(Number(m[1]) + Number(m[2])));
  await overlay.locator('button[type=submit]').click();
  await overlay.waitFor({ state: 'detached' });
}

async function state(page) {
  return page.evaluate(() => {
    const get = (k) => localStorage.getItem(k);
    const pid = get('pc.activePlayer');
    const db = JSON.parse(get('pc.demo.v1') || '{}');
    const mine = (db.events || []).filter((e) => e.playerId === pid);
    return {
      activeLocal: pid,
      activeSession: sessionStorage.getItem('pc.activePlayer'),
      ledger: mine.map((e) => e.clientEventId).join(','),
      ledgerSize: mine.length,
      xp: mine.reduce((n, e) => n + (Number(e.xp) || 0), 0),
      outbox: get('pc.outbox') || '[]',
      demoDb: get('pc.demo.v1'),
      coachDb: get('pc.coach.demo.v1'),
      classMode: sessionStorage.getItem('pc.classMode'),
    };
  });
}

function sameState(a, b, label) {
  for (const k of Object.keys(a)) {
    if (a[k] !== b[k]) fail(`${label}: ${k} changed (${String(a[k]).slice(0, 80)} → ${String(b[k]).slice(0, 80)})`);
  }
}

async function queuePending(page, id) {
  await page.evaluate((cid) => {
    const pid = localStorage.getItem('pc.activePlayer');
    const ev = {
      clientEventId: cid, playerId: pid, accountId: 'acct-demo', type: 'lesson.video.done',
      moduleId: 'movements', lessonId: 'au', payload: {}, xp: 20, stars: 1,
      occurredAt: new Date().toISOString(), source: 'app',
    };
    localStorage.setItem('pc.outbox', JSON.stringify([ev]));
    window.__pcWrites = [];
  }, id);
}

async function writes(page) {
  return page.evaluate(() => window.__pcWrites || []);
}

// Every library page is a fresh document: wait for nav.js to load the
// session, then require that nothing wrote a pc.* key on this page.
async function noWrites(page, label) {
  await page.waitForSelector('[data-nav-chip]:not([hidden]), [data-nav-login]:not([hidden])');
  await page.waitForTimeout(150);
  const w = await writes(page);
  if (w.length) fail(`${label}: library page wrote storage: ${w.join('; ')}`);
}

// Per-type render checks: answers marked, no lesson engine, no completion UI.
async function checkEntry(page, entry, label) {
  await page.waitForSelector(`[data-library-entry="${entry.id}"]`);
  const info = await page.evaluate(() => ({
    title: document.querySelector('[data-lib-title]')?.textContent?.trim(),
    robots: document.querySelector('meta[name="robots"]')?.getAttribute('content'),
    staff: document.body.hasAttribute('data-staff'),
    engine: document.querySelectorAll('[data-complete], [data-quiz], [data-check-choice], [data-drill-timer], [data-rate], [data-glossary-master], [data-practice-confirm]').length,
    checkAnswers: document.querySelectorAll('[data-lib-check] [data-answer="true"]').length,
    questions: [...document.querySelectorAll('[data-lib-question]')].map((q) => q.querySelectorAll('[data-answer="true"]').length),
    steps: document.querySelectorAll('[data-lib-step]').length,
    speak: document.querySelectorAll('.quest-lib-word [data-readaloud]').length,
    iframe: document.querySelectorAll('.quest-lib-stage iframe').length,
    video: document.querySelectorAll('.quest-lib-stage video[controls]').length,
    instLesson: document.querySelector('[data-lib-instrument-lesson]')?.getAttribute('href'),
  }));
  if (info.title !== entry.title) fail(`${label} ${entry.id}: title "${info.title}" (want "${entry.title}")`);
  if (info.robots !== 'noindex') fail(`${label} ${entry.id}: missing robots noindex`);
  if (!info.staff) fail(`${label} ${entry.id}: body is missing data-staff`);
  if (info.engine) fail(`${label} ${entry.id}: lesson-engine controls on a library page`);
  if (entry.expect === 'reading' && info.checkAnswers !== 1) fail(`${entry.id}: check answer not marked once`);
  if (entry.expect === 'quiz' && (!info.questions.length || info.questions.some((n) => n !== 1))) fail(`${entry.id}: quiz answers not marked: ${info.questions}`);
  if (entry.expect === 'drill' && info.steps < 4) fail(`${entry.id}: drill steps missing`);
  if (entry.expect === 'word' && info.speak !== 1) fail(`${entry.id}: no speak button`);
  if (entry.expect === 'yt' && info.iframe !== 1) fail(`${entry.id}: no YouTube embed`);
  if (entry.expect === 'file' && info.video !== 1) fail(`${entry.id}: no <video controls>`);
  if (entry.expect === 'instrument' && info.instLesson !== entry.lesson) fail(`${entry.id}: lesson link ${info.instLesson}`);
}

const TEN_A = [
  { id: 'lesson:ginga-basics', title: 'Ginga Basics', expect: 'yt' },
  { id: 'lesson:roda-etiquette', title: 'Roda etiquette', expect: 'reading' },
  { id: 'lesson:esquiva-cocorinha', title: 'Esquiva & Cocorinha', expect: 'drill' },
  { id: 'lesson:music-quiz', title: 'Music Boss Quiz', expect: 'quiz' },
  { id: 'glossary:ginga', title: 'Ginga', expect: 'word' },
  { id: 'glossary:au', title: 'Aú', expect: 'word' },
  { id: 'instrument:berimbau', title: 'Berimbau', expect: 'instrument', lesson: '/coach/library/lesson/meet-the-berimbau' },
  { id: 'yt:acb2024', title: 'Abadá Capoeira Brooklyn 2024', expect: 'yt' },
  { id: 'wix:videoProject1', title: 'Video Project 1 (2026 program video)', expect: 'file' },
  { id: 'lesson:portuguese-for-the-roda', title: 'Portuguese for the Roda', expect: 'reading' },
];
const TEN_B = [
  { id: 'lesson:au', title: 'Aú', expect: 'yt' },
  { id: 'lesson:culture-quiz', title: 'Culture Boss Quiz', expect: 'quiz' },
  { id: 'lesson:ginga-workout-10', title: '10-minute Ginga workout', expect: 'drill' },
  { id: 'lesson:meet-the-berimbau', title: 'Meet the Berimbau', expect: 'reading' },
  { id: 'glossary:berimbau', title: 'Berimbau', expect: 'word' },
  { id: 'instrument:atabaque', title: 'Atabaque', expect: 'instrument', lesson: '/coach/library/lesson/pandeiro-atabaque' },
  { id: 'instrument:agogo', title: 'Agogô', expect: 'instrument', lesson: '/coach/library/lesson/agogo-reco-reco' },
  { id: 'yt:batizado2025', title: 'Abadá Capoeira NYC Batizado 2025', expect: 'yt' },
  { id: 'lesson:roda-ready-check', title: 'Roda Ready check', expect: 'quiz' },
  { id: 'lesson:cordas', title: 'Cordas', expect: 'reading' },
];
const hrefOf = (id) => {
  const [type, slug] = id.split(':');
  return `/coach/library/${type}/${slug}`;
};

// ------------------------------------------------------------------ setup
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(SPY);
const page = await context.newPage();
watch(page);

await page.goto(`${base}/login`);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.reload();
await page.waitForSelector('[data-demo-btn]');
await page.click('[data-demo-btn]');
await page.waitForURL('**/who**');
await page.click('.quest-player-card:has-text("Gatinha")');
await page.waitForURL('**/journey**');
await page.waitForFunction(() => document.querySelector('[data-bind="xp"]')?.textContent !== '');
const maya = await page.evaluate(() => localStorage.getItem('pc.activePlayer'));
if (!maya) fail('no remembered child after picking Gatinha');

// "Switch to coach view" on /family (demo access, SPEC-v3 WP9 acceptance).
// Enter through the grown-ups button on /who, as the demo smoke does.
await page.goto(`${base}/who`);
await page.waitForSelector('[data-grownups]');
await page.click('[data-grownups]');
await passGrownUp(page);
await page.waitForURL('**/family**');
await page.waitForSelector('[data-to-coach]:not([hidden])');
await page.click('[data-to-coach]');
await page.waitForURL(/\/coach\/?(\?.*)?$/);
await page.waitForSelector('.quest-coach-nav a[href="/coach/library"]');

// ------------------------------------------- A: ten entries by full load
await queuePending(page, 'wp9-pending-a');
const a0 = await state(page);
for (const entry of TEN_A) {
  await page.goto(`${base}${hrefOf(entry.id)}`);
  await checkEntry(page, entry, 'A');
  await noWrites(page, `A ${entry.id}`);
}
sameState(a0, await state(page), 'A (full loads)');
if (JSON.parse(a0.outbox).length !== 1) fail('A: pending outbox event should still be waiting');

// ------------------- B: from /coach via CoachNav (router click → full load)
await page.goto(`${base}/coach`);
await page.waitForSelector('.quest-stat-card, [data-empty-programs]');
await queuePending(page, 'wp9-pending-b');
await page.evaluate(() => { window.__routerMarker = 'B'; });
const b0 = await state(page);
const chipB = (await page.textContent('[data-nav-name]'))?.trim();
await page.click('.quest-coach-nav a[href="/coach/library"]');
await page.waitForSelector('[data-library]');
if (await page.evaluate(() => window.__routerMarker)) fail('B: the library shared a JS context with /coach (expected a full page load)');
await noWrites(page, 'B index');

// Search on the way: "gin" → exactly the three Ginga entries; "au" → Aú first.
await page.fill('[data-lib-search]', 'gin');
const ginTitles = await page.$$eval('[data-lib-results] .quest-lib-row__title', (els) => els.map((e) => e.textContent.trim()));
if (ginTitles.sort().join('|') !== ['10-minute Ginga workout', 'Ginga', 'Ginga Basics'].join('|')) fail('B: "gin" returned ' + ginTitles.join(', '));
await page.fill('[data-lib-search]', 'au');
const auIds = await page.$$eval('[data-lib-results] [data-lib-entry]', (els) => els.map((e) => e.dataset.libEntry));
if (auIds.slice(0, 2).sort().join('|') !== 'glossary:au|lesson:au') fail('B: "au" ranked ' + auIds.slice(0, 3).join(', '));
await page.fill('[data-lib-search]', '');
await page.waitForSelector('[data-lib-browse]:not([hidden])');

for (const entry of TEN_B) {
  await page.locator(`[data-lib-browse] a[href="${hrefOf(entry.id)}"]`).first().click();
  await checkEntry(page, entry, 'B');
  await noWrites(page, `B ${entry.id}`);
  await page.click('[data-lib-back]');
  await page.waitForSelector('[data-library]');
  await noWrites(page, 'B index');
}
sameState(b0, await state(page), 'B (from /coach)');
if (JSON.parse(b0.outbox).length !== 1) fail('B: pending outbox event should still be waiting');
// Leave the library: the same child is still the active player.
await page.click('.quest-coach-nav a[href="/coach"]');
await page.waitForSelector('.quest-stat-card, [data-empty-programs]');
const chipB2 = (await page.textContent('[data-nav-name]'))?.trim();
if (chipB !== chipB2) fail(`B: active player changed (${chipB} → ${chipB2})`);

// ------------------- C: from a lesson page (router click → full load)
await page.goto(`${base}/learn/movements/au`);
await page.waitForSelector('[data-lesson-stage]:not([inert])');
await queuePending(page, 'wp9-pending-c');
await page.evaluate(() => {
  window.__routerMarker = 'C';
  const a = document.createElement('a');
  a.href = '/coach/library/lesson/ginga-basics';
  a.id = 'wp9-to-library';
  a.textContent = 'Library';
  document.querySelector('main').prepend(a);
});
const c0 = await state(page);
const chipC = (await page.textContent('[data-nav-name]'))?.trim();
const xpC = await page.evaluate(() => {
  const db = JSON.parse(localStorage.getItem('pc.demo.v1') || '{}');
  const pid = localStorage.getItem('pc.activePlayer');
  return (db.events || []).filter((e) => e.playerId === pid).reduce((n, e) => n + (Number(e.xp) || 0), 0);
});
await page.click('#wp9-to-library');
await page.waitForSelector('[data-library-entry]');
if (await page.evaluate(() => window.__routerMarker)) fail('C: the library shared a JS context with the lesson page (expected a full page load)');
const C_PATH = [
  { via: null, ...TEN_A[0] },
  // then hop entry → entry through the "More in" and cross links
  { via: '.quest-lib-more a[href="/coach/library/lesson/meia-lua-de-frente"]', id: 'lesson:meia-lua-de-frente', title: 'Meia Lua de Frente', expect: 'yt' },
  { via: '.quest-lib-more a[href="/coach/library/lesson/esquiva-cocorinha"]', ...TEN_A[2] },
  { via: '[data-lib-back]', id: null },
  { via: '[data-lib-browse] a[href="/coach/library/instrument/pandeiro"]', id: 'instrument:pandeiro', title: 'Pandeiro', expect: 'instrument', lesson: '/coach/library/lesson/pandeiro-atabaque' },
  { via: '[data-lib-instrument-lesson]', id: 'lesson:pandeiro-atabaque', title: 'Pandeiro & Atabaque', expect: 'yt' },
  { via: '.quest-lib-note a', id: 'yt:sankofaHaus', title: 'ACE x Sankofa Haus', expect: 'yt' },
  { via: '[data-lib-back]', id: null },
  { via: '[data-lib-browse] a[href="/coach/library/lesson/portuguese-for-the-roda"]', ...TEN_A[9] },
  { via: 'a.quest-lib-word-chip[href="/coach/library/glossary/camara"]', id: 'glossary:camara', title: 'Camará', expect: 'word' },
  { via: '.quest-lib-note a', ...TEN_A[9] },
  { via: '[data-lib-back]', id: null },
  { via: '[data-lib-browse] a[href="/coach/library/lesson/what-is-batizado"]', id: 'lesson:what-is-batizado', title: 'What is Batizado?', expect: 'reading' },
  { via: '[data-lib-back]', id: null },
  { via: '[data-lib-browse] a[href="/coach/library/yt/batizado2026"]', id: 'yt:batizado2026', title: 'Abadá Capoeira NYC Batizado 2026', expect: 'yt' },
];
let opened = 0;
for (const step of C_PATH) {
  if (step.via) await page.locator(step.via).first().click();
  if (!step.id) {
    await page.waitForSelector('[data-library]');
    await noWrites(page, 'C index');
    continue;
  }
  await checkEntry(page, step, 'C');
  await noWrites(page, `C ${step.id}`);
  opened += 1;
}
if (opened < 10) fail(`C: opened ${opened} entries, want 10`);
sameState(c0, await state(page), 'C (from a lesson page)');
if (JSON.parse(c0.outbox).length !== 1) fail('C: pending outbox event should still be waiting');
// Back to the lesson: same child, and only now does the outbox flush.
await page.goto(`${base}/learn/movements/au`);
await page.waitForSelector('[data-lesson-stage]:not([inert])');
const chipC2 = (await page.textContent('[data-nav-name]'))?.trim();
if (chipC !== chipC2) fail(`C: active player changed (${chipC} → ${chipC2})`);
const afterC = await state(page);
if (afterC.activeLocal !== c0.activeLocal) fail('C: remembered child changed');
if (JSON.parse(afterC.outbox).length !== 0) fail('C: the lesson page should flush the waiting event');
if (afterC.xp !== xpC + 20) fail(`C: XP after the lesson flush is ${afterC.xp}, want ${xpC + 20}`);

// ------------------------------------ noindex everywhere, never public
await page.goto(`${base}/coach/library`);
await page.waitForSelector('[data-library]');
const libHrefs = await page.$$eval('[data-lib-browse] a[href^="/coach/library/"]', (els) => [...new Set(els.map((a) => a.getAttribute('href')))]);
const allPages = ['/coach/library', ...libHrefs];
if (libHrefs.length < 50) fail(`expected about 51 library entry pages, found ${libHrefs.length}`);
for (const href of allPages) {
  const res = await page.request.get(`${base}${href}/`);
  const html = await res.text();
  if (!res.ok()) fail(`${href}: HTTP ${res.status()}`);
  if (!/<meta name="robots" content="noindex">/.test(html)) fail(`${href}: missing noindex`);
}
const sitemap = await (await page.request.get(`${base}/sitemap.xml`)).text();
if (/library/.test(sitemap)) fail('sitemap lists the library');
for (const pub of ['/', '/about', '/graduation', '/batizado', '/learn/music', '/journey']) {
  const html = await (await page.request.get(`${base}${pub}`)).text();
  if (/\/coach\/library/.test(html)) fail(`public page ${pub} links the library`);
  if (/name="robots"/.test(html)) fail(`public page ${pub} is noindex`);
}

// ------------------------- R10.5: Field guide cards open the right lesson
const FIELD = { berimbau: 'meet-the-berimbau', pandeiro: 'pandeiro-atabaque', atabaque: 'pandeiro-atabaque', agogo: 'agogo-reco-reco' };
for (const [inst, lesson] of Object.entries(FIELD)) {
  await page.goto(`${base}/learn/music`);
  await page.waitForSelector(`a.quest-instrument-card[data-instrument="${inst}"]`);
  const href = await page.getAttribute(`a.quest-instrument-card[data-instrument="${inst}"]`, 'href');
  if (href !== `/learn/music/${lesson}`) fail(`Field guide ${inst} links ${href}`);
  await page.click(`a.quest-instrument-card[data-instrument="${inst}"]`);
  await page.waitForSelector(`[data-lesson="${lesson}"] [data-lesson-stage]:not([inert])`);
}
await context.close();

// ------------- Phone, no child selected: "gin" is two taps from the library
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await phone.addInitScript(SPY);
const p2 = await phone.newPage();
watch(p2);
await p2.goto(`${base}/login?demo=1&next=/coach/library`);
await p2.waitForURL('**/coach/library**');
await p2.evaluate(() => { localStorage.removeItem('pc.activePlayer'); sessionStorage.removeItem('pc.activePlayer'); });
await p2.reload();
await p2.waitForSelector('[data-library]');
await p2.waitForSelector('[data-nav-chip]:not([hidden])');
await p2.evaluate(() => { window.__pcWrites = []; });
await p2.tap('[data-lib-search]');
await p2.keyboard.type('gin');
const phoneTitles = await p2.$$eval('[data-lib-results] .quest-lib-row__title', (els) => els.map((e) => e.textContent.trim()));
if (phoneTitles.sort().join('|') !== ['10-minute Ginga workout', 'Ginga', 'Ginga Basics'].join('|')) fail('phone: "gin" returned ' + phoneTitles.join(', '));
for (const [title, id] of [['Ginga Basics', 'lesson:ginga-basics'], ['10-minute Ginga workout', 'lesson:ginga-workout-10'], ['Ginga', 'glossary:ginga']]) {
  await p2.goto(`${base}/coach/library?q=gin`);
  await p2.waitForSelector('[data-lib-results] .quest-lib-row');
  await p2.locator(`[data-lib-results] [data-lib-entry="${id}"]`).tap();
  await p2.waitForSelector(`[data-library-entry="${id}"]`);
  const h1 = (await p2.textContent('[data-lib-title]'))?.trim();
  if (h1 !== title) fail(`phone: tapped ${id}, got "${h1}"`);
}
const overflow = await p2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
if (overflow > 0) fail(`phone: page scrolls sideways by ${overflow}px`);
const pw = await p2.evaluate(() => window.__pcWrites || []);
if (pw.length) fail('phone: library wrote storage: ' + pw.join('; '));
if (await p2.evaluate(() => localStorage.getItem('pc.activePlayer') || sessionStorage.getItem('pc.activePlayer'))) fail('phone: a child got selected');
await phone.close();

await browser.close();
const summary = { maya, a: TEN_A.length, b: TEN_B.length, c: opened, libraryPages: allPages.length, gin: ginTitles, errors };
console.log(JSON.stringify(summary, null, 1));
if (errors.length) { console.error('page errors'); process.exit(1); }
console.log('LIBRARY OK');
