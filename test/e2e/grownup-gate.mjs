// Grown-up gate: a direct load of each /family page shows exactly one
// parent check, and one right answer opens the page. Pages call init() twice
// on a direct load; before the fix that stacked two dialogs with the same
// input id, and the top one blocked the button underneath.
// Run: node test/e2e/grownup-gate.mjs <baseUrl>   (prints GATE OK)
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://localhost:4407';
const PAGES = ['/family/players/new', '/family/players/edit?player=player-maya', '/family', '/family/report?player=player-maya'];

const browser = await chromium.launch();
const failures = [];
for (const path of PAGES) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/login?demo=1&next=/about`);
  await page.waitForURL('**/about/**');
  await page.goto(base + path);
  await page.waitForSelector('.quest-grownup');
  await page.waitForTimeout(1000);
  const dialogs = await page.locator('.quest-grownup').count();
  if (dialogs !== 1) failures.push(`${path}: ${dialogs} parent dialogs`);
  const q = await page.textContent('#quest-grownup-description');
  const [, a, b] = q.match(/(\d+) \+ (\d+)/);
  await page.fill('#quest-grownup-answer', String(Number(a) + Number(b)));
  await page.locator('.quest-grownup button[type=submit]').first().click();
  await page.waitForTimeout(1000);
  if (await page.locator('.quest-grownup').count()) failures.push(`${path}: dialog still open after a right answer`);
  if (errors.length) failures.push(`${path}: ${errors.join('; ')}`);
  await context.close();
}
await browser.close();
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('GATE OK');
