// SPEC-v3 WP12 groundwork: the nine Cores (R12.1), coreFor() (R12.2) and the
// rule that XP thresholds may only move down (R12.8). Inert until D1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CORES, coreById } from '../src/content/cores.js';
import { LEVELS } from '../src/content/levels.js';
import { coreFor, levelFor, derivePlayer, makeEvent, EVENT } from '../src/lib/game/index.js';

// ---------------------------------------------------------------- R12.1

test('the nine Cores are in order with ABADÁ spellings, meanings and start XP', () => {
  assert.deepEqual(
    CORES.map((c) => [c.order, c.title, c.meaning, c.xp]),
    [
      [1, 'Crua', 'A beginner', 0],
      [2, 'Ouro', 'The value of what you will learn', 100],
      [3, 'Sol', 'Waking up to learning', 250],
      [4, 'Mar', 'How big the road ahead is', 700],
      [5, 'Floresta', 'Learning becomes solid', 1000],
      [6, 'Ametista', 'Carrying capoeira forward', 1750],
      [7, 'Camaleão', 'The ABADÁ style of Mestre Camisa', 2200],
      [8, 'Rubi', 'Justice', 3250],
      [9, 'Diamante', 'All colors in one', 3850],
    ],
  );
  assert.deepEqual(CORES.map((c) => c.cordColor), ['Natural', 'Yellow', 'Orange', 'Blue', 'Green', 'Purple', 'Brown', 'Red', 'White']);
});

test('every Core meaning waits for ACE review', () => {
  for (const c of CORES) assert.equal(c.reviewNeeded, true, `${c.title} reviewNeeded`);
});

test('every Core xp is a LEVELS threshold; levels 4, 7 and 10 fold into the Core before them', () => {
  const thresholds = new Set(LEVELS.map((l) => l.xp));
  for (const c of CORES) assert.ok(thresholds.has(c.xp), `${c.title} xp ${c.xp} is not a LEVELS threshold`);
  const coreXp = new Set(CORES.map((c) => c.xp));
  const folded = LEVELS.filter((l) => !coreXp.has(l.xp)).map((l) => l.level);
  assert.deepEqual(folded, [4, 7, 10]);
});

test('Core ids are unique ASCII slugs and coreById finds them', () => {
  const ids = CORES.map((c) => c.id);
  assert.equal(new Set(ids).size, CORES.length);
  for (const id of ids) assert.match(id, /^[a-z]+$/);
  assert.equal(coreById('camaleao').title, 'Camaleão');
  assert.equal(coreById('nope'), null);
});

test('Core colors are hex, distinct, and any named token matches tokens.css', () => {
  const css = readFileSync(new URL('../src/directions/quest/tokens.css', import.meta.url), 'utf8');
  for (const c of CORES) {
    assert.match(c.color, /^#[0-9a-f]{6}$/, `${c.title} color`);
    if (c.token) {
      const m = css.match(new RegExp(`${c.token}:\\s*(#[0-9a-fA-F]{6})`));
      assert.ok(m, `${c.token} exists in tokens.css`);
      assert.equal(m[1].toLowerCase(), c.color, `${c.title} color equals ${c.token}`);
    }
  }
  assert.equal(new Set(CORES.map((c) => c.color)).size, CORES.length);
});

// ---------------------------------------------------------------- R12.2

test('coreFor boundaries: one XP short stays, the threshold moves up (99/100 … 3,849/3,850)', () => {
  for (let i = 1; i < CORES.length; i++) {
    const prev = CORES[i - 1];
    const c = CORES[i];
    const below = coreFor(c.xp - 1);
    const at = coreFor(c.xp);
    assert.equal(below.title, prev.title, `${c.xp - 1} XP is still ${prev.title}`);
    assert.equal(below.level, prev.order);
    assert.equal(below.xpToNext, 1);
    assert.equal(below.nextTitle, c.title);
    assert.equal(at.title, c.title, `${c.xp} XP is ${c.title}`);
    assert.equal(at.level, c.order);
    assert.equal(at.xpInto, 0);
    assert.equal(at.percent, at.isMax ? 100 : 0);
    assert.equal(below.percent, 99, `${c.xp - 1} XP is never a full bar`);
  }
  // the named pairs from the spec, spelled out
  assert.equal(coreFor(99).title, 'Crua');
  assert.equal(coreFor(100).title, 'Ouro');
  assert.equal(coreFor(3849).title, 'Rubi');
  assert.equal(coreFor(3850).title, 'Diamante');
});

test('folded levels do not move the Core (449/450, 1,349/1,350, 2,699/2,700)', () => {
  for (const xp of [450, 1350, 2700]) {
    assert.equal(coreFor(xp - 1).title, coreFor(xp).title, `${xp} is not a Core threshold`);
    assert.notEqual(levelFor(xp - 1).level, levelFor(xp).level, `${xp} is still a level threshold`);
  }
});

test('coreFor returns every field R12.2 names, with the Core color and meaning', () => {
  const c = coreFor(560);
  for (const k of ['level', 'title', 'xpInto', 'xpToNext', 'percent', 'isMax', 'nextTitle', 'color', 'meaning']) {
    assert.ok(k in c, `coreFor has ${k}`);
  }
  assert.equal(c.level, 3);
  assert.equal(c.title, 'Sol');
  assert.equal(c.color, '#ff8a1f');
  assert.equal(c.meaning, 'Waking up to learning');
  assert.equal(c.xpInto, 310);
  assert.equal(c.xpToNext, 140);
  assert.equal(c.nextTitle, 'Mar');
  assert.equal(c.isMax, false);
});

test('coreFor percent math', () => {
  assert.equal(coreFor(0).percent, 0);
  assert.equal(coreFor(50).percent, 50); // Crua 0 → Ouro 100
  assert.equal(coreFor(99).percent, 99);
  assert.equal(coreFor(175).percent, 50); // Ouro 100 → Sol 250
  assert.equal(coreFor(450).percent, 44); // Sol 250 → Mar 700: 200 / 450 = 44.4
  assert.equal(coreFor(699).percent, 99); // 449 / 450 = 99.8 rounds down: never full before Mar
  assert.equal(levelFor(699).percent, 100, 'levelFor still rounds, unchanged');
  assert.equal(coreFor(2725).percent, 50); // Camaleão 2,200 → Rubi 3,250
  for (let xp = 0; xp < 3850; xp += 37) {
    const c = coreFor(xp);
    const expected = Math.floor((c.xpInto / c.xpSpan) * 100);
    assert.equal(c.percent, expected, `percent at ${xp}`);
    assert.ok(c.percent >= 0 && c.percent <= 99, 'only Diamante reads 100');
  }
});

test('Diamante is reachable and is the top', () => {
  const top = coreFor(3850);
  assert.equal(top.isMax, true);
  assert.equal(top.percent, 100);
  assert.equal(top.xpToNext, 0);
  assert.equal(top.nextTitle, null);
  assert.equal(coreFor(99999).title, 'Diamante');
});

test('coreFor treats bad input as 0 XP', () => {
  for (const bad of [-50, NaN, undefined, null, 'abc']) assert.equal(coreFor(bad).title, 'Crua');
  assert.equal(coreFor('250').title, 'Sol');
});

test('the snapshot carries core; level and levelFor are unchanged', () => {
  const empty = derivePlayer([]);
  assert.equal(empty.core.title, 'Crua');
  assert.equal(empty.level.title, 'Iniciante');

  // about 560 XP, like the smoke test's Maya: Core Sol, still movement level 4
  const P = { playerId: 'p1', accountId: 'a1' };
  const events = [
    makeEvent({ ...P, type: EVENT.COACH_XP, payload: { xp: 50 } }),
    ...Array.from({ length: 10 }, () => makeEvent({ ...P, type: EVENT.COACH_XP, payload: { xp: 50 } })),
    makeEvent({ ...P, type: EVENT.COACH_XP, payload: { xp: 10 } }),
  ];
  const s = derivePlayer(events);
  assert.equal(s.xp, 560);
  assert.deepEqual(s.core, coreFor(560));
  assert.deepEqual(s.level, levelFor(560));
  assert.equal(s.level.level, 4);
  assert.equal(s.level.title, 'Cocorinha');
  assert.equal(s.core.title, 'Sol');
});

// ---------------------------------------------------------------- R12.8

// The thresholds as shipped (SPEC v2 §4.1 and SPEC-v3 WP12). They may only
// move down: lowering one is fine (update this table in the same commit),
// raising one fails this test. Kids never lose a level or Core they earned.
const SHIPPED_LEVEL_XP = { 1: 0, 2: 100, 3: 250, 4: 450, 5: 700, 6: 1000, 7: 1350, 8: 1750, 9: 2200, 10: 2700, 11: 3250, 12: 3850 };
const SHIPPED_CORE_XP = { crua: 0, ouro: 100, sol: 250, mar: 700, floresta: 1000, ametista: 1750, camaleao: 2200, rubi: 3250, diamante: 3850 };

/** Problems with `table` against the shipped thresholds. */
function thresholdProblems(table, shipped, keyOf) {
  const problems = [];
  const byKey = new Map(table.map((row) => [String(keyOf(row)), row]));
  for (const [key, xp] of Object.entries(shipped)) {
    const row = byKey.get(key);
    if (!row) problems.push(`${key} was removed`);
    else if (row.xp > xp) problems.push(`${key} rose from ${xp} to ${row.xp}`);
  }
  if (table[0]?.xp !== 0) problems.push('the first threshold must be 0');
  for (let i = 1; i < table.length; i++) {
    if (!(table[i].xp > table[i - 1].xp)) problems.push(`${keyOf(table[i])} is not above ${keyOf(table[i - 1])}`);
  }
  return problems;
}

test('R12.8: LEVELS thresholds never rise above what shipped', () => {
  assert.deepEqual(thresholdProblems(LEVELS, SHIPPED_LEVEL_XP, (l) => l.level), []);
});

test('R12.8: Core thresholds never rise above what shipped', () => {
  assert.deepEqual(thresholdProblems(CORES, SHIPPED_CORE_XP, (c) => c.id), []);
});

test('R12.8: the guard catches a raised threshold and allows a lowered one', () => {
  const raised = CORES.map((c) => (c.id === 'mar' ? { ...c, xp: 750 } : c));
  assert.deepEqual(thresholdProblems(raised, SHIPPED_CORE_XP, (c) => c.id), ['mar rose from 700 to 750']);
  const lowered = CORES.map((c) => (c.id === 'mar' ? { ...c, xp: 650 } : c));
  assert.deepEqual(thresholdProblems(lowered, SHIPPED_CORE_XP, (c) => c.id), []);
  const raisedLevel = LEVELS.map((l) => (l.level === 12 ? { ...l, xp: 4000 } : l));
  assert.deepEqual(thresholdProblems(raisedLevel, SHIPPED_LEVEL_XP, (l) => l.level), ['12 rose from 3850 to 4000']);
});
