// WP10 post-build check (SPEC-v3 R10.1-R10.4) against dist/client.
//
//   node test/e2e/wp10-dist-check.mjs [dist/client] [baseline dist/client]
//
// The baseline is a build of client-notes-v3 (before WP10). With it, the
// script also proves every credit line other than acb2024 is unchanged.
// Prints "WP10 DIST OK" or exits 1 with the failures.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { YOUTUBE, WIX_VIDEOS, credit } from '../../src/data/media.js';

const DIST = process.argv[2] || 'dist/client';
const BASE = process.argv[3] || '';
const H1 = 'Welcome to ABADÁ Capoeira. Level up your Capoeira knowledge.';
const TV = 'Video: TV-ABADÁ Capoeira';
const SOCHLO = 'Video: SoChlo Productions';
const FOOTER_LINE = 'Video credits appear with each video';
const ACB_ID = YOUTUBE.acb2024.id;

const failures = [];
const fail = (msg) => failures.push(msg);
const ok = (cond, msg) => { if (!cond) fail(msg); };

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}
const read = (p) => readFileSync(p, 'utf8');
const text = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const footerOf = (html) => (html.match(/<footer class="quest-footer"[\s\S]*?<\/footer>/) || [''])[0];
const withoutFooter = (html) => html.replace(/<footer class="quest-footer"[\s\S]*?<\/footer>/, '');

// Video references a credit line can belong to: YouTube ids and Wix mp4 URLs.
const VIDEO_REFS = [
  ...Object.entries(YOUTUBE).map(([key, v]) => ({ key, needle: v.id })),
  ...Object.entries(WIX_VIDEOS).map(([key, v]) => ({ key, needle: v.mp4 })),
];
/** Key of the video referenced closest before `index` in `html`, or null. */
function nearestVideo(html, index) {
  let best = null;
  for (const ref of VIDEO_REFS) {
    const at = html.lastIndexOf(ref.needle, index);
    if (at >= 0 && (!best || at > best.at)) best = { key: ref.key, at };
  }
  return best ? best.key : null;
}
const CREDIT_RE = /Videos?: [^<"]*/g;
function credits(html) {
  const out = [];
  for (const m of html.matchAll(CREDIT_RE)) out.push({ text: m[0].trim(), index: m.index });
  return out;
}
// Per-video credit elements rendered from credit(key).
const CREDIT_EL_RE = /class="(?:quest-video-credit|quest-video-card__credit|quest-hero__credit)"[^>]*>([^<]*)</g;

const pages = htmlFiles(DIST);
const page = (route) => {
  const p = join(DIST, route, 'index.html');
  ok(existsSync(p), `missing ${route}`);
  return existsSync(p) ? read(p) : '';
};

// R10.1: home H1, exact.
const home = page('');
const h1 = home.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
ok(h1 && text(h1[1]) === H1, `home H1 is "${h1 && text(h1[1])}"`);
ok(home.includes('Roda Quest &middot; Physical Chess') || home.includes('Roda Quest · Physical Chess'), 'home eyebrow changed (waits for D8)');
ok(home.includes('<title>Roda Quest — Physical Chess</title>'), 'home <title> changed (waits for D8)');

// R10.2/R10.3: acb2024 on the home bottom card and the Journey.
const latest = (home.match(/<section class="quest-section quest-section--latest"[\s\S]*?<\/section>/) || [''])[0];
ok(latest.includes(ACB_ID) && latest.includes(TV), 'home "Latest from the roda" card does not show TV-ABADÁ');
const journey = page('journey');
const jLatest = (journey.match(/<article class="quest-latest"[\s\S]*?<\/article>/) || [''])[0];
ok(jLatest.includes(ACB_ID) && jLatest.includes(TV), '/journey latest video does not show TV-ABADÁ');

// Every per-video credit element equals credit() of its video.
let creditEls = 0;
for (const file of pages) {
  const html = withoutFooter(read(file));
  for (const m of html.matchAll(CREDIT_EL_RE)) {
    creditEls += 1;
    const key = nearestVideo(html, m.index);
    const where = relative(DIST, file);
    if (!key) { fail(`${where}: credit "${m[1]}" has no video before it`); continue; }
    ok(m[1].trim() === credit(key), `${where}: credit for ${key} is "${m[1].trim()}", expected "${credit(key)}"`);
  }
}
ok(creditEls > 0, 'found no credit elements at all');

// R10.3: no footer names a producer; every footer has the neutral line.
let footers = 0;
for (const file of pages) {
  const f = footerOf(read(file));
  if (!f) continue;
  footers += 1;
  const where = relative(DIST, file);
  ok(f.includes(FOOTER_LINE), `${where}: footer lacks "${FOOTER_LINE}"`);
  ok(!/SoChlo|TV-ABAD|Productions|Video:/.test(f), `${where}: footer names a producer`);
}
ok(footers > 0, 'found no footers');

// R10.4: the three age lines link to /classes.
const ageLink = /<a class="quest-age-link[^"]*" href="\/classes">Classes for 7–13 years of age/;
ok(ageLink.test((home.match(/<p class="quest-hero__age"[\s\S]*?<\/p>/) || [''])[0]), 'home hero age line does not link to /classes');
ok(ageLink.test(footerOf(home)), 'footer age line does not link to /classes');
const contact = page('about/contact');
ok(ageLink.test((contact.match(/<p class="quest-screen__sub"[\s\S]*?<\/p>/) || [''])[0]), 'contact age line does not link to /classes');
for (const file of pages) {
  const f = footerOf(read(file));
  if (f) ok(ageLink.test(f), `${relative(DIST, file)}: footer age line does not link to /classes`);
}

// R10.4: /classes content, no invite codes, form posts to /api/contact.
const classes = page('classes');
ok(!/\b(BUSHWICK|BERKELEY|PROSPECT|RODA)\b/.test(classes), '/classes HTML contains an invite code');
ok(!/inviteCode/i.test(classes), '/classes HTML mentions inviteCode');
ok(/data-classes-form/.test(classes), '/classes has no inquiry form');
for (const s of ['What a class is like', 'Where ACE teaches', 'How to join', 'To be confirmed', 'Ask ACE', 'Classes for 7–13 years of age']) {
  ok(classes.includes(s), `/classes lacks "${s}"`);
}
for (const f of ['ages', 'schedule', 'cost', 'uniform']) ok(classes.includes(`data-fact="${f}"`), `/classes lacks the ${f} fact`);
const script = (classes.match(/src="(\/_astro\/classes\.astro[^"]+\.js)"/) || [])[1];
ok(script && read(join(DIST, script)).includes('/api/contact'), '/classes script does not post to /api/contact');
ok(read(join(DIST, 'sitemap.xml')).includes('/classes</loc>'), 'sitemap lacks /classes');

// Against the baseline: every credit string other than acb2024's is unchanged.
if (BASE) {
  let swapped = 0;
  for (const file of htmlFiles(BASE)) {
    const rel = relative(BASE, file);
    const nextPath = join(DIST, rel);
    if (!existsSync(nextPath)) { fail(`${rel}: page missing from the new build`); continue; }
    const before = withoutFooter(read(file));
    const after = withoutFooter(read(nextPath));
    const a = credits(before);
    const b = credits(after);
    if (a.length !== b.length) { fail(`${rel}: ${a.length} credit strings before, ${b.length} after`); continue; }
    a.forEach((c, i) => {
      if (c.text === b[i].text) return;
      const isAcb = nearestVideo(after, b[i].index) === 'acb2024';
      if (c.text === SOCHLO && b[i].text === TV && isAcb) swapped += 1;
      else fail(`${rel}: credit "${c.text}" became "${b[i].text}"`);
    });
    const so = (s) => (s.match(/SoChlo/g) || []).length;
    const diff = so(before) - so(after);
    const tvHere = b.filter((c) => c.text === TV).length;
    ok(diff === tvHere, `${rel}: SoChlo mentions outside the footer went ${so(before)} -> ${so(after)}`);
  }
  ok(swapped >= 2, `expected acb2024 to switch on at least home and journey, saw ${swapped}`);
  console.log(`baseline: ${swapped} acb2024 credit(s) switched to TV-ABADÁ; all other credits unchanged`);
}

console.log(`checked ${pages.length} pages, ${footers} footers, ${creditEls} credit lines`);
if (failures.length) {
  console.error(failures.map((f) => `FAIL ${f}`).join('\n'));
  process.exit(1);
}
console.log('WP10 DIST OK');
