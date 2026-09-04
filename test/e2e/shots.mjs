// Screenshot every main route at 1440 and 390 in demo mode.
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://localhost:4398';
const out = process.argv[3] || 'screenshots/merged';
const routes = ['/', '/login', '/who', '/journey', '/learn/movements', '/learn/music', '/learn/culture', '/learn/graduation', '/learn/movements/esquiva-cocorinha', '/learn/music/meet-the-berimbau', '/learn/music/music-quiz', '/me', '/desafio', '/turma', '/family', '/family/report?player=player-maya', '/about', '/about/educators', '/graduation', '/graduation/media', '/shop', '/batizado', '/coach', '/coach/class', '/privacy'];
const browser = await chromium.launch();
const errors = {};
for (const [label, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { (errors[label] ||= []).push(e.message.slice(0, 120)); });
  await page.goto(`${base}/login?demo=1`); await page.waitForTimeout(800);
  await page.goto(`${base}/who`); await page.waitForTimeout(600);
  const maya = page.locator('.quest-player-card:has-text("Gatinha")').first();
  if (await maya.count()) { await maya.click(); await page.waitForTimeout(600); }
  for (const r of routes) {
    if (r === '/coach' || r === '/coach/class') {
      await page.goto(`${base}/family`); await page.waitForTimeout(600);
      const btn = page.locator('[data-to-coach]');
      if (await btn.count() && await btn.isVisible()) { await btn.click(); await page.waitForTimeout(1200); }
    }
    await page.goto(`${base}${r}`); await page.waitForTimeout(1400);
    const w = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    const name = r.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home';
    await page.screenshot({ path: `${out}/${name}-${label}.png`, fullPage: false });
    if (w) (errors[label] ||= []).push(`HSCROLL ${r}`);
  }
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(errors, null, 1));
