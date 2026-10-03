// library.test.mjs — WP9 instructor library catalog + R10.5 Field guide map.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CATALOG, entryById, detailEntries, searchLibrary, searchIndex, browseTree,
  matchRank, lessonForInstrument, LIBRARY_BASE,
} from '../src/lib/library.js';
import { searchEntries } from '../src/lib/library-search.js';
import { LESSONS, GLOSSARY, INSTRUMENTS, INSTRUMENT_LESSON, lessonById } from '../src/content/index.js';
import { YOUTUBE, WIX_VIDEOS } from '../src/data/media.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

test('catalog: about 62 entries, every source covered once', () => {
  const count = (type) => CATALOG.filter((e) => e.type === type).length;
  assert.equal(count('lesson'), LESSONS.length);
  assert.equal(count('lesson'), 24);
  assert.equal(count('glossary'), GLOSSARY.length);
  assert.equal(count('instrument'), INSTRUMENTS.length);
  assert.equal(count('yt'), Object.keys(YOUTUBE).length);
  assert.deepEqual(CATALOG.filter((e) => e.type === 'wix').map((e) => e.slug), ['videoProject1']);
  assert.ok(count('page') >= 11, 'links for /about/*, /graduation/* and /batizado');
  assert.ok(CATALOG.length >= 58 && CATALOG.length <= 66, `catalog has ${CATALOG.length} entries`);
});

test('catalog: IDs are unique and type-prefixed', () => {
  const ids = CATALOG.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate catalog id');
  for (const e of CATALOG) {
    assert.match(e.id, /^(lesson|glossary|instrument|yt|wix|page):[a-z0-9-]+$/i, e.id);
    assert.equal(e.id, `${e.type}:${e.slug}`);
  }
  // Slugs collide across types, which is why the prefix exists.
  assert.ok(entryById('lesson:au'));
  assert.ok(entryById('glossary:au'));
  assert.ok(entryById('instrument:berimbau'));
  assert.ok(entryById('yt:acb2024'));
});

test('catalog: entries point at source records, nothing copied', () => {
  for (const l of LESSONS) {
    const e = entryById(`lesson:${l.id}`);
    assert.equal(e.source, l, `lesson ${l.id} should reference the LESSONS record`);
    assert.equal(e.title, l.title);
    assert.equal(e.reviewNeeded, l.reviewNeeded);
  }
  assert.equal(entryById('yt:acb2024').source, YOUTUBE.acb2024);
  assert.equal(entryById('wix:videoProject1').source, WIX_VIDEOS.videoProject1);
  assert.equal(entryById('instrument:berimbau').source, INSTRUMENTS.find((i) => i.id === 'berimbau'));
});

test('catalog: library pages live under /coach/library, page links open the page', () => {
  const pages = new Set();
  for (const e of detailEntries()) {
    assert.equal(e.href, `${LIBRARY_BASE}/${e.type}/${e.slug}`);
    assert.ok(!pages.has(e.href), `duplicate route ${e.href}`);
    pages.add(e.href);
  }
  for (const e of CATALOG.filter((x) => x.type === 'page')) {
    assert.equal(e.external, true);
    assert.match(e.href, /^\/(about|graduation|batizado)/);
    const file = e.href === '/about' || e.href === '/graduation'
      ? join(ROOT, 'src/pages', e.href, 'index.astro')
      : join(ROOT, 'src/pages', `${e.href}.astro`);
    assert.ok(statSync(file).isFile(), `page link ${e.href} has no page (${relative(ROOT, file)})`);
  }
});

test('browse tree: every lesson, word and instrument sits in a module group once', () => {
  const { modules, videos, pages } = browseTree();
  const seen = modules.flatMap((m) => m.groups.flatMap((g) => g.entries.map((e) => e.id)));
  assert.equal(new Set(seen).size, seen.length);
  const expected = CATALOG.filter((e) => ['lesson', 'glossary', 'instrument'].includes(e.type)).map((e) => e.id);
  assert.deepEqual([...seen].sort(), [...expected].sort());
  assert.equal(videos.length, Object.keys(YOUTUBE).length + 1);
  assert.equal(pages.flatMap((g) => g.entries).length, CATALOG.filter((e) => e.type === 'page').length);
});

test('search: "gin" returns exactly Ginga Basics, the 10-minute Ginga workout and the Ginga word', () => {
  const hits = searchLibrary('gin').map((e) => e.id);
  assert.deepEqual(hits.sort(), ['glossary:ginga', 'lesson:ginga-basics', 'lesson:ginga-workout-10'].sort());
  assert.deepEqual(searchLibrary('GIN').map((e) => e.id).sort(), hits);
});

test('search: "au" ranks the Aú lesson and the Aú word first', () => {
  const hits = searchLibrary('au').map((e) => e.id);
  assert.deepEqual(hits.slice(0, 2).sort(), ['glossary:au', 'lesson:au']);
  assert.ok(hits.length > 2, 'substring matches (berimbau, aulão) follow');
  assert.deepEqual(searchLibrary('Aú').map((e) => e.id), hits, 'accents are optional');
});

test('search: exact word, then word prefix, then substring; titles only', () => {
  assert.equal(matchRank('Aú', 'au'), 0);
  assert.equal(matchRank('ACE Aulão at Achievement First Bushwick Elementary', 'au'), 1);
  assert.equal(matchRank('Meet the Berimbau', 'au'), 2);
  assert.equal(matchRank('Meia Lua de Frente', 'meia lua'), 0);
  assert.equal(matchRank('Roda etiquette', 'xyz'), -1);
  assert.deepEqual(searchLibrary(''), []);
  assert.deepEqual(searchLibrary('   '), []);
  // Instruments and glossary words are searchable by name; meanings are not.
  assert.ok(searchLibrary('agogo').some((e) => e.id === 'instrument:agogo'));
  assert.deepEqual(searchLibrary('positive energy'), []);
});

test('search: the browser index ranks the same as the catalog', () => {
  const index = searchIndex();
  assert.ok(index.every((r) => typeof r.title === 'string' && r.href && r.type && r.meta));
  for (const q of ['gin', 'au', 'berimbau', 'batizado', 'reco reco']) {
    assert.deepEqual(searchEntries(q, index).map((r) => r.id), searchLibrary(q).map((e) => e.id), q);
  }
});

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

test('every video shown anywhere in the app is in the catalog', () => {
  const keys = [...Object.keys(YOUTUBE), ...Object.keys(WIX_VIDEOS)];
  const skip = new Set(['src/data/media.js', 'src/lib/library.js']);
  const files = walk(join(ROOT, 'src')).filter((f) => /\.(astro|js|mjs|ts)$/.test(f) && !skip.has(relative(ROOT, f)));
  const shown = new Set();
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    for (const k of keys) {
      if (new RegExp(`['"\`]${k}['"\`]`).test(text)) shown.add(k);
    }
  }
  for (const l of LESSONS) {
    if (l.videoKey) shown.add(l.videoKey);
    if (l.wixVideoKey) shown.add(l.wixVideoKey);
  }
  assert.ok(shown.size >= 11, `found ${shown.size} video keys in use`);
  for (const k of shown) {
    const inCatalog = entryById(`yt:${k}`) || entryById(`wix:${k}`);
    assert.ok(inCatalog, `video "${k}" is shown in the app but missing from the library`);
  }
});

test('INSTRUMENT_LESSON: every instrument maps to a lesson that exists (R9.2, R10.5)', () => {
  assert.deepEqual(INSTRUMENT_LESSON, {
    berimbau: 'meet-the-berimbau',
    pandeiro: 'pandeiro-atabaque',
    atabaque: 'pandeiro-atabaque',
    agogo: 'agogo-reco-reco',
  });
  for (const inst of INSTRUMENTS) {
    const lessonId = INSTRUMENT_LESSON[inst.id];
    assert.ok(lessonId, `instrument ${inst.id} has no lesson`);
    const lesson = lessonById(lessonId);
    assert.ok(lesson, `INSTRUMENT_LESSON.${inst.id} → "${lessonId}" is not a lesson`);
    assert.equal(lesson.moduleId, 'music');
    assert.equal(lessonForInstrument(inst.id), lesson);
    assert.ok(entryById(`lesson:${lessonId}`), `library has no entry for ${lessonId}`);
  }
});

test('Field guide cards link to their lessons (R10.5)', () => {
  const hub = readFileSync(join(ROOT, 'src/pages/learn/[module]/index.astro'), 'utf8');
  assert.match(hub, /INSTRUMENT_LESSON/);
  assert.match(hub, /<a class="quest-instrument-card" href=\{inst\.href\}/);
  assert.doesNotMatch(hub, /<article class="quest-instrument-card"/);
});

test('library pages never touch player state (R9.5)', () => {
  const files = walk(join(ROOT, 'src/pages/coach/library'))
    .concat([join(ROOT, 'src/lib/library.js'), join(ROOT, 'src/lib/library-search.js'), join(ROOT, 'src/components/quest/LibraryRow.astro')]);
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    const code = text.replace(/^\s*\/\/.*$/gm, '');
    for (const banned of ['recordEvent', 'selectPlayer', 'flushOutbox', 'clearActivePlayer', 'requireSession', 'lib/actions.js', 'lib/store.js', 'Quiz.astro', 'DrillTimer', 'Check.astro']) {
      assert.ok(!code.includes(banned), `${relative(ROOT, f)} references ${banned}`);
    }
    if (f.endsWith('.astro') && f.includes('pages')) {
      assert.match(text, /<Base[^>]*\bstaff\b/, `${relative(ROOT, f)} must use <Base staff>`);
    }
  }
});
