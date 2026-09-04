import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEvent, EVENT, derivePlayer, nyDate, isoWeek } from '../src/lib/game/index.js';
import { DESAFIO_POOL } from '../src/content/desafio.js';
import { desafioForDate, shuffle } from '../src/lib/desafio.js';
import { overviewFromRoster, toCsv, buildLeaderboard, csvEscape, READINESS_BUCKETS, programsForAccount } from '../src/lib/coach.js';

const P = { playerId: 'p1', accountId: 'a1' };

test('desafio pool has at least 20 items across the five kinds', () => {
  assert.ok(DESAFIO_POOL.length >= 20);
  const kinds = new Set(DESAFIO_POOL.map((d) => d.kind));
  for (const k of ['flashcard', 'instrument', 'order', 'fact', 'timer']) assert.ok(kinds.has(k), k);
  assert.ok(DESAFIO_POOL.every((d) => d.reviewNeeded === true));
});

test('desafioForDate is stable for a NY calendar date', () => {
  const a = desafioForDate(new Date('2026-09-03T18:00:00-04:00'));
  const b = desafioForDate(new Date('2026-09-03T23:30:00-04:00'));
  const c = desafioForDate(new Date('2026-09-04T10:00:00-04:00'));
  assert.equal(a.id, b.id);
  assert.equal(a.dateKey, '2026-09-03');
  assert.notEqual(a.id, c.id);
});

test('derivePlayer exposes desafioDoneToday for the NY date', () => {
  const now = new Date('2026-09-03T18:00:00-04:00');
  const today = makeEvent({ ...P, type: EVENT.DESAFIO_DONE, payload: { kind: 'flashcard' }, occurredAt: now });
  const yesterday = makeEvent({ ...P, type: EVENT.DESAFIO_DONE, payload: { kind: 'timer' }, occurredAt: new Date('2026-09-02T18:00:00-04:00') });
  assert.equal(derivePlayer([yesterday], { now }).desafioDoneToday, false);
  assert.equal(derivePlayer([today], { now }).desafioDoneToday, true);
  assert.equal(derivePlayer([today], { now }).desafios, 1);
});

test('overview buckets and quiet list', () => {
  const now = new Date('2026-09-03T18:00:00-04:00');
  const rows = [
    { id: 'a', apelido: 'Gatinha', firstName: 'Maya', startedAt: '2026-06-02', snapshot: { streak: { activeThisWeek: true }, lessons: { x: { status: 'done', lastAt: now.toISOString() } }, lastActiveAt: now.toISOString(), readiness: { percent: 100 } } },
    { id: 'b', apelido: 'Macaco', firstName: 'Tico', startedAt: '2026-04-08', snapshot: { streak: { activeThisWeek: false }, lessons: {}, lastActiveAt: new Date(now.getTime() - 28 * 86400000).toISOString(), readiness: { percent: 10 } } },
    { id: 'c', apelido: 'Tubarão', firstName: 'Leo', startedAt: '2026-09-01', snapshot: { streak: { activeThisWeek: false }, lessons: {}, lastActiveAt: null, readiness: { percent: 0 } } },
  ];
  const ov = overviewFromRoster(rows, now);
  assert.equal(ov.activeThisWeek, 1);
  assert.equal(ov.lessonsThisWeek, 1);
  assert.equal(ov.inactive.length, 1);
  assert.equal(ov.inactive[0].apelido, 'Macaco');
  assert.equal(ov.buckets.reduce((s, n) => s + n, 0), 3);
  assert.equal(READINESS_BUCKETS.length, 5);
});

test('CSV opens in Numbers: BOM, CRLF, quoted commas', () => {
  const csv = toCsv([{ key: 'n', label: 'name' }, { key: 'v', label: 'note' }], [{ n: 'Gatinha', v: 'ok, more' }]);
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.ok(csv.includes('\r\n'));
  assert.ok(csv.includes('"ok, more"'));
  assert.equal(csvEscape('a"b'), '"a""b"');
});

test('leaderboard hides opted-out families and ranks weekly XP', () => {
  const now = new Date('2026-09-03T18:00:00-04:00');
  const week = isoWeek(now);
  const players = [
    { id: 'p1', accountId: 'a1', apelido: 'Gatinha', firstName: 'Maya', avatar: { animal: 'frog', color: 'hibiscus' }, program: 'bushwick', active: true },
    { id: 'p2', accountId: 'a2', apelido: 'Beija-flor', firstName: 'Sol', avatar: { animal: 'frog', color: 'lilac' }, program: 'bushwick', active: true },
  ];
  const eventsByPlayer = new Map([
    ['p1', [makeEvent({ playerId: 'p1', accountId: 'a1', type: EVENT.VIDEO_DONE, lessonId: 'ginga-basics', moduleId: 'movements', occurredAt: now })]],
    ['p2', [makeEvent({ playerId: 'p2', accountId: 'a2', type: EVENT.VIDEO_DONE, lessonId: 'ginga-basics', moduleId: 'movements', occurredAt: now })]],
  ]);
  const accountsById = new Map([
    ['a1', { leaderboardOptIn: true }],
    ['a2', { leaderboardOptIn: false }],
  ]);
  const board = buildLeaderboard({ players, eventsByPlayer, accountsById, program: 'bushwick', period: week, now });
  assert.equal(board.entries.length, 1);
  assert.equal(board.entries[0].apelido, 'Gatinha');
  assert.ok(board.communityXp >= 20);
  assert.ok(!('email' in board.entries[0]));
});

test('shuffle is deterministic for a seed', () => {
  const a = shuffle(['a', 'b', 'c', 'd'], '2026-09-03');
  const b = shuffle(['a', 'b', 'c', 'd'], '2026-09-03');
  assert.deepEqual(a, b);
});

test('nyDate uses America/New_York', () => {
  assert.equal(nyDate(new Date('2026-09-04T02:00:00Z')), '2026-09-03');
});

test('programsForAccount: empty coach stays empty, admin sees all', () => {
  assert.deepEqual(programsForAccount({ role: 'coach', programs: [] }).map((p) => p.key), []);
  assert.deepEqual(programsForAccount({ role: 'coach' }).map((p) => p.key), []);
  assert.deepEqual(programsForAccount({ role: 'coach', programs: ['bushwick'] }).map((p) => p.key), ['bushwick']);
  const admin = programsForAccount({ role: 'admin', programs: [] }).map((p) => p.key);
  assert.ok(admin.includes('bushwick'));
  assert.ok(admin.length >= 3);
});
