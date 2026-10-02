// SPEC-v3 WP8: XP the first time only, the learner-event streak rule, and
// sticky module clears.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEvent, EVENT, derivePlayer, allowedXp, withAllowedXp, scoreLedger, weekStreak, startsNewStreakWeek } from '../src/lib/game/index.js';
import { weekXp } from '../src/lib/coach.js';

const P = { playerId: 'p1', accountId: 'a1' };
const NOW = new Date('2026-10-01T18:00:00-04:00');
const hoursAfter = (h) => new Date(NOW.getTime() + h * 3600000);

/** Append an event the way recordEvent does: xp from allowedXp. */
function record(ledger, spec, at = hoursAfter(ledger.length)) {
  const e = withAllowedXp(makeEvent({ ...P, occurredAt: at, ...spec }), ledger);
  ledger.push(e);
  return e;
}

test('replaying a finished video, reading, drill or quiz earns 0 XP', () => {
  const ledger = [];
  const kinds = [
    { type: EVENT.VIDEO_DONE, moduleId: 'music', lessonId: 'pandeiro-atabaque' },
    { type: EVENT.READING_DONE, moduleId: 'music', lessonId: 'meet-the-berimbau', payload: { checkFirstTry: true } },
    { type: EVENT.DRILL_DONE, moduleId: 'music', lessonId: 'sing-the-roda', payload: { selfRating: 2 } },
    { type: EVENT.QUIZ_DONE, moduleId: 'music', lessonId: 'music-quiz', payload: { score: 5, total: 5 } },
  ];
  for (const k of kinds) assert.ok(record(ledger, k).xp > 0, `${k.type} pays the first time`);
  const before = derivePlayer(ledger, { now: NOW }).xp;
  for (let i = 0; i < 50; i++) for (const k of kinds) assert.equal(record(ledger, k).xp, 0);
  const after = derivePlayer(ledger, { now: NOW });
  assert.equal(after.xp, before);
  assert.equal(after.lessons['pandeiro-atabaque'].attempts, 51, 'repeats still count as attempts');
  assert.equal(after.practices, 51, 'drill repeats still count as practices');
});

test('wrong-then-correct earns the 10 once; a second correct earns nothing', () => {
  const ledger = [];
  const q = (correct) => ({ type: EVENT.QUIZ_ANSWERED, moduleId: 'music', lessonId: 'music-quiz', payload: { questionId: 'q2', correct } });
  assert.equal(record(ledger, q(false)).xp, 0);
  assert.equal(record(ledger, q(true)).xp, 10);
  assert.equal(record(ledger, q(true)).xp, 0);
  const other = { type: EVENT.QUIZ_ANSWERED, moduleId: 'music', lessonId: 'music-quiz', payload: { questionId: 'q3', correct: true } };
  assert.equal(record(ledger, other).xp, 10, 'a different question still pays');
});

test('imperfect-then-perfect earns the +25 once', () => {
  const ledger = [];
  const done = (score) => ({ type: EVENT.QUIZ_DONE, moduleId: 'music', lessonId: 'music-quiz', payload: { score, total: 5 } });
  assert.equal(record(ledger, done(3)).xp, 0);
  assert.equal(record(ledger, done(5)).xp, 25);
  assert.equal(record(ledger, done(5)).xp, 0);
  const s = derivePlayer(ledger, { now: NOW });
  assert.equal(s.lessons['music-quiz'].bestStars, 3, 'stars still go up');
});

test('one Desafio pays per New York date', () => {
  const ledger = [];
  const d = { type: EVENT.DESAFIO_DONE, payload: { kind: 'fact' } };
  assert.equal(record(ledger, d, new Date('2026-10-01T09:00:00-04:00')).xp, 30);
  assert.equal(record(ledger, d, new Date('2026-10-01T23:30:00-04:00')).xp, 0);
  assert.equal(record(ledger, d, new Date('2026-10-02T00:30:00-04:00')).xp, 30, 'next NY day pays again');
});

test('a second practice confirmation of one lesson earns 0 XP but still counts', () => {
  const ledger = [];
  const c = { type: EVENT.PRACTICE_CONFIRMED, moduleId: 'movements', lessonId: 'esquiva-cocorinha', payload: { by: 'guardian' } };
  assert.equal(record(ledger, c).xp, 15);
  assert.equal(record(ledger, c, hoursAfter(30)).xp, 0);
  assert.equal(derivePlayer(ledger, { now: NOW }).practicesConfirmed, 2);
});

test('a week of only drill repeats keeps the streak', () => {
  const ledger = [];
  const drill = { type: EVENT.DRILL_DONE, moduleId: 'movements', lessonId: 'esquiva-cocorinha', payload: { selfRating: 2 } };
  const week = (n) => new Date(NOW.getTime() - n * 7 * 86400000);
  record(ledger, drill, week(1));
  const repeat = record(ledger, drill, week(0));
  assert.equal(repeat.xp, 0);
  assert.equal(weekStreak(ledger, NOW).weeks, 2);
  assert.equal(startsNewStreakWeek(ledger.slice(0, 1), week(0)), true, 'a repeat in a new week still mints the streak bonus');
});

test('bonuses and coach XP do not count a streak week on their own', () => {
  const coach = makeEvent({ ...P, type: EVENT.COACH_XP, payload: { xp: 20 }, occurredAt: NOW, source: 'coach' });
  const bonus = makeEvent({ ...P, type: EVENT.STREAK_WEEK, payload: { week: '2026-W40' }, occurredAt: NOW, source: 'system' });
  assert.equal(weekStreak([coach, bonus], NOW).weeks, 0);
});

test('turma weekly XP does not change on a replay', () => {
  const ledger = [];
  const v = { type: EVENT.VIDEO_DONE, moduleId: 'movements', lessonId: 'ginga-basics' };
  record(ledger, v);
  const week = weekXp(ledger, '2026-W40');
  for (let i = 0; i < 10; i++) record(ledger, v);
  assert.equal(weekXp(ledger, '2026-W40'), week);
});

test('allowedXp ignores a tampered stored xp value', () => {
  const forged = { ...makeEvent({ ...P, type: EVENT.VIDEO_DONE, moduleId: 'movements', lessonId: 'au', occurredAt: NOW }), xp: 99999 };
  assert.equal(allowedXp(forged, []), 20);
  const [rescored] = scoreLedger([forged]);
  assert.equal(rescored.xp, 20);
});

test('scoreLedger keeps players separate and dedupes module clears and streak weeks', () => {
  const a = makeEvent({ playerId: 'pa', accountId: 'x', type: EVENT.VIDEO_DONE, moduleId: 'movements', lessonId: 'au', occurredAt: hoursAfter(1) });
  const b = makeEvent({ playerId: 'pb', accountId: 'y', type: EVENT.VIDEO_DONE, moduleId: 'movements', lessonId: 'au', occurredAt: hoursAfter(2) });
  const m1 = makeEvent({ ...P, type: EVENT.MODULE_CLEARED, moduleId: 'music', occurredAt: hoursAfter(3) });
  const m2 = makeEvent({ ...P, type: EVENT.MODULE_CLEARED, moduleId: 'music', occurredAt: hoursAfter(4) });
  const s1 = makeEvent({ ...P, type: EVENT.STREAK_WEEK, payload: { week: '2026-W40' }, occurredAt: hoursAfter(5) });
  const s2 = makeEvent({ ...P, type: EVENT.STREAK_WEEK, payload: { week: '2026-W40' }, occurredAt: hoursAfter(6) });
  const out = scoreLedger([a, b, m1, m2, s1, s2]);
  assert.deepEqual(out.map((e) => e.xp), [20, 20, 100, 0, 40, 0]);
});

test('a module clear is sticky: a later lesson re-locks nothing and removes no patch', () => {
  // A cleared Music module where one lesson is not done stands in for a
  // lesson added after the clear.
  const music = ['meet-the-berimbau', 'pandeiro-atabaque', 'agogo-reco-reco', 'sing-the-roda'];
  const events = music.map((lessonId, i) => makeEvent({ ...P, type: EVENT.VIDEO_DONE, moduleId: 'music', lessonId, occurredAt: hoursAfter(i) }));
  events.push(makeEvent({ ...P, type: EVENT.MODULE_CLEARED, moduleId: 'music', occurredAt: hoursAfter(5), source: 'system' }));
  events.push(makeEvent({ ...P, type: EVENT.MODULE_CLEARED, moduleId: 'movements', occurredAt: hoursAfter(6), source: 'system' }));
  const s = derivePlayer(events, { now: NOW });
  assert.equal(s.modules.music.cleared, true);
  assert.equal(s.modules.music.completed, 4, 'completion still shows real progress');
  assert.equal(s.modules.culture.locked, false, 'Culture stays open');
  assert.ok(s.patches.some((p) => p.key === 'boa-ginga'), 'Boa Ginga stays earned');
  const ring = s.readiness.items.find((i) => i.key === 'movements-cleared');
  assert.equal(ring.met, true);
  assert.equal(ring.progress, 100);
});
