import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEvent, EVENT, derivePlayer, levelFor, weekStreak, isoWeek, sideEffects } from '../src/lib/game/index.js';

const P = { playerId: 'p1', accountId: 'a1' };
const at = (daysAgo) => new Date(Date.now() - daysAgo * 86400000);

test('levelFor maps XP to movement-named levels', () => {
  assert.equal(levelFor(0).title, 'Iniciante');
  assert.equal(levelFor(99).level, 1);
  assert.equal(levelFor(100).title, 'Ginga');
  assert.equal(levelFor(320).title, 'Esquiva');
  assert.equal(levelFor(320).xpToNext, 130);
  assert.equal(levelFor(99999).isMax, true);
});

test('empty ledger derives a clean new player', () => {
  const s = derivePlayer([]);
  assert.equal(s.xp, 0);
  assert.equal(s.lessonsDone, 0);
  assert.equal(s.modules.movements.locked, false);
  assert.equal(s.modules.culture.locked, true);
  assert.deepEqual(s.nextUp, { moduleId: 'movements', lessonId: 'ginga-basics' });
  assert.equal(s.streak.weeks, 0);
  assert.equal(s.cordaCurrent, 'crua');
  assert.equal(s.patches.length, 0);
});

test('duplicate clientEventId is ignored, redo never re-awards XP twice in totals', () => {
  const e = makeEvent({ ...P, type: EVENT.VIDEO_DONE, moduleId: 'movements', lessonId: 'ginga-basics' });
  const s = derivePlayer([e, { ...e }]);
  assert.equal(s.xp, 20);
  assert.equal(s.lessons['ginga-basics'].attempts, 1);
});

test('stars only go up; quiz score tracked', () => {
  const q1 = makeEvent({ ...P, type: EVENT.QUIZ_DONE, moduleId: 'music', lessonId: 'music-quiz', payload: { score: 1, total: 3 }, occurredAt: at(2) });
  const q2 = makeEvent({ ...P, type: EVENT.QUIZ_DONE, moduleId: 'music', lessonId: 'music-quiz', payload: { score: 3, total: 3 }, occurredAt: at(1) });
  const s = derivePlayer([q2, q1]);
  assert.equal(s.lessons['music-quiz'].bestStars, 3);
  assert.equal(s.lessons['music-quiz'].bestScore, 100);
  assert.ok(s.patches.some((p) => p.key === 'berimbau-ear'));
});

test('clearing a module unlocks the next and mints side effects', () => {
  const music = ['meet-the-berimbau', 'pandeiro-atabaque', 'agogo-reco-reco', 'sing-the-roda', 'music-quiz'];
  const events = [
    makeEvent({ ...P, type: EVENT.READING_DONE, moduleId: 'music', lessonId: music[0], payload: { checkFirstTry: true } }),
    makeEvent({ ...P, type: EVENT.VIDEO_DONE, moduleId: 'music', lessonId: music[1] }),
    makeEvent({ ...P, type: EVENT.READING_DONE, moduleId: 'music', lessonId: music[2], payload: { checkFirstTry: true } }),
    makeEvent({ ...P, type: EVENT.DRILL_DONE, moduleId: 'music', lessonId: music[3], payload: { selfRating: 3 } }),
  ];
  const before = derivePlayer(events);
  assert.equal(before.modules.culture.locked, true);
  const last = makeEvent({ ...P, type: EVENT.QUIZ_DONE, moduleId: 'music', lessonId: music[4], payload: { score: 3, total: 5 } });
  const after = derivePlayer([...events, last]);
  assert.equal(after.modules.music.cleared, true);
  assert.equal(after.modules.culture.locked, false);
  const fx = sideEffects(before, after, last);
  assert.ok(fx.some((e) => e.type === EVENT.MODULE_CLEARED && e.moduleId === 'music'));
});

test('weekly streak counts consecutive ISO weeks in New York time', () => {
  const now = new Date('2026-09-03T18:00:00-04:00');
  const w = (weeksAgo) => new Date(now.getTime() - weeksAgo * 7 * 86400000);
  const ev = (d) => makeEvent({ ...P, type: EVENT.VIDEO_DONE, lessonId: 'au', moduleId: 'movements', occurredAt: d });
  assert.equal(weekStreak([ev(w(0)), ev(w(1)), ev(w(2)), ev(w(3))], now).weeks, 4);
  assert.equal(weekStreak([ev(w(1)), ev(w(2))], now).weeks, 2); // last week still alive this week
  assert.equal(weekStreak([ev(w(2)), ev(w(3))], now).weeks, 0); // missed last week
  assert.equal(weekStreak([ev(w(0)), ev(w(2))], now).weeks, 1); // gap breaks it
  assert.equal(isoWeek(new Date('2026-01-01T02:00:00Z')), '2026-W01'); // Dec 31 NY time, ISO week of Jan 1
  assert.equal(isoWeek(new Date('2025-12-28T17:00:00Z')), '2025-W52'); // Sunday Dec 28 NY
});

test('readiness ring reflects the checklist and hides attendance until used', () => {
  const s = derivePlayer([]);
  assert.equal(s.readiness.total, 5);
  const stamped = derivePlayer([makeEvent({ ...P, type: EVENT.ATTENDANCE, payload: { program: 'bushwick' }, source: 'coach' })]);
  assert.equal(stamped.readiness.total, 6);
});
