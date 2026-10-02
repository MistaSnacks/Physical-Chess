// WP10 — credits as data (SPEC-v3 R10.2, R10.3).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { YOUTUBE, WIX_VIDEOS, credit, yt } from '../src/data/media.js';

test("credit('acb2024') is the TV-ABADÁ line (D9)", () => {
  assert.equal(credit('acb2024'), 'Video: TV-ABADÁ Capoeira');
});

test('every YOUTUBE and WIX_VIDEOS entry has a non-empty credit', () => {
  for (const [table, entries] of [['YOUTUBE', YOUTUBE], ['WIX_VIDEOS', WIX_VIDEOS]]) {
    for (const [key, entry] of Object.entries(entries)) {
      assert.equal(typeof entry.credit, 'string', `${table}.${key}`);
      assert.ok(entry.credit.trim().length > 0, `${table}.${key}`);
      assert.equal(credit(key), entry.credit, `credit('${key}')`);
    }
  }
});

test('every other credit is unchanged until D9', () => {
  const others = [...Object.keys(YOUTUBE), ...Object.keys(WIX_VIDEOS)].filter((k) => k !== 'acb2024');
  for (const key of others) assert.equal(credit(key), 'Video: SoChlo Productions', key);
});

test('YOUTUBE and WIX_VIDEOS keys do not collide, so credit(key) is unambiguous', () => {
  const clash = Object.keys(YOUTUBE).filter((k) => k in WIX_VIDEOS);
  assert.deepEqual(clash, []);
});

test('yt() still returns a plain YouTube id', () => {
  for (const [key, entry] of Object.entries(YOUTUBE)) {
    const id = yt(key);
    assert.equal(typeof id, 'string', key);
    assert.equal(id, entry.id, key);
    assert.match(id, /^[A-Za-z0-9_-]{11}$/, key);
  }
  assert.equal(yt('acb2024'), 'ercczK8Cgf8');
});

test('credit() throws on an unknown key', () => {
  assert.throws(() => credit('nope'), /unknown video key/);
});
