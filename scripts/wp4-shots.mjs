// WP4 screenshots + guardian flow against a static server of dist/client.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const base = process.argv[2] || 'http://localhost:4404';
mkdirSync('screenshots/wp4', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

async function shot(name, width) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1100 });
  await page.waitForTimeout(350);
  await page.screenshot({ path: `screenshots/wp4/${name}-${width}.png`, fullPage: true });
}
async function both(name) {
  await shot(name, 1440);
  await shot(name, 390);
  await page.setViewportSize({ width: 1440, height: 1100 });
}

await page.goto(`${base}/login`);
await page.waitForSelector('[data-demo-btn]');
await both('login');

await page.goto(`${base}/signup`);
await page.waitForSelector('[data-demo-card]');
await both('signup');

await page.goto(`${base}/forgot`);
await page.waitForSelector('[data-demo-card]');
await both('forgot');

await page.goto(`${base}/verify`);
await page.waitForSelector('[data-demo-card]');
await both('verify');

await page.goto(`${base}/privacy`);
await page.waitForSelector('h1');
await both('privacy');

await page.goto(`${base}/login`);
await page.click('[data-demo-btn]');
await page.waitForURL('**/who**');
await page.waitForSelector('.quest-player-card:has-text("Gatinha")');
await both('who');

await page.evaluate(() => sessionStorage.setItem('pc.grownUp', '1'));

await page.goto(`${base}/family`);
await page.waitForSelector('[data-settings-form]');
await both('family');

await page.goto(`${base}/family/players/new`);
await page.waitForSelector('[data-player-form]');
await both('player-new');
await page.fill('#firstName', 'Nina');
await page.fill('#apelido', 'Sabia');
await page.fill('#inviteCode', 'BUSHWICK');
await page.click('button[type=submit]');
await page.waitForURL('**/journey**');

await page.goto(`${base}/family`);
await page.waitForSelector('.quest-player-card:has-text("Sabia")');
await page.click('.quest-player-card:has-text("Sabia")');
await page.waitForURL('**/family/players/edit**');
await page.waitForSelector('[data-player-form]:not([hidden])');
await both('player-edit');
await page.fill('#apelido', 'Sabiá');
await page.click('[data-player-form] button[type=submit]');
await page.waitForSelector('[data-ok]:not([hidden])');

const editUrl = page.url();
const playerId = new URL(editUrl).searchParams.get('player');
if (!playerId) throw new Error('missing player id after edit');

await page.goto(`${base}/family/report?player=${playerId}`);
await page.waitForSelector('.quest-report__hero');
await both('report-nina');

const [csv] = await Promise.all([
  page.waitForEvent('download'),
  page.click('[data-csv]'),
]);
const csvPath = await csv.path();
const csvText = readFileSync(csvPath, 'utf8');
if (!csvText.startsWith('occurredAt,type,moduleId,lessonId,xp,stars,source,payload')) {
  throw new Error('CSV header mismatch: ' + csvText.slice(0, 80));
}

const [jsonDl] = await Promise.all([
  page.waitForEvent('download'),
  page.click('[data-json]'),
]);
const jsonText = readFileSync(await jsonDl.path(), 'utf8');
const payload = JSON.parse(jsonText);
if (payload.player.firstName !== 'Nina') throw new Error('JSON is not Nina');
if (payload.players) throw new Error('JSON leaked other players');

await page.goto(`${base}/family/report?player=player-maya`);
await page.waitForSelector('.quest-report__hero');
await both('report-maya');
const saw = await page.locator('.quest-chip:has-text("You saw it")').count();
if (!saw) throw new Error('Maya practice confirmation chip missing');

await page.goto(`${base}/family/players/edit?player=${playerId}`);
await page.waitForSelector('[data-delete-box]:not([hidden])');
await page.click('[data-delete-start]');
await page.fill('[data-delete-typed]', 'Nina');
await page.click('[data-delete-go]');
await page.waitForURL((u) => u.pathname.replace(/\/+$/, '') === '/family');
await page.waitForTimeout(400);
if (await page.locator('.quest-player-card:has-text("Sabiá")').count()) {
  throw new Error('Nina was not deleted');
}

await page.click('[data-signout]');
await page.waitForURL((u) => u.pathname === '/' || u.pathname === '/index.html' || u.pathname.endsWith('/'));
await page.goto(`${base}/who`);
await page.waitForURL('**/login**');

await browser.close();
if (errors.length) {
  console.error(errors);
  process.exit(1);
}
console.log('WP4 FLOW OK');
