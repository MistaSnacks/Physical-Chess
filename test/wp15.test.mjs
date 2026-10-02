// wp15.test.mjs — trusted access (SPEC-v3 WP15). Every rule the server
// routes enforce is a pure function; these cases are the exit-test list
// that can run before D13.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  safeNext, canSeeProgram, rosterScope, rosterFilter, pickAccountPatch, pickPlayerInput,
  attendanceCheck, leaderboardAllowed, cronAuthorized, timingSafeEqual, sessionMaxAge,
  classSessionPayload, classExpired, classPlayerAllowed, validClassDate,
  GUARDIAN_MAX_AGE, COACH_MAX_AGE, CLASS_MAX_AGE,
} from '../src/lib/server/policy.js';
import {
  isCoachOnly, memberEvents, buildLedger, cordaRowToEvent, attendanceRowToEvent,
  patchAwardRowToEvent, coachEventRowToEvent, sanitizeClassEvents, byPlayer, COACH_PATCH_KEYS,
} from '../src/lib/repo/ledger.js';
import { matchInvite, normalizeInvite } from '../src/lib/repo/invite.js';
import { makeEvent, EVENT, derivePlayer } from '../src/lib/game/index.js';
import { PROGRAMS } from '../src/content/programs.js';

const ORIGIN = 'https://app.physicalchess.org';
const admin = { role: 'admin', programs: [] };
const coach = { role: 'coach', programs: ['bushwick', 'prospect'] };
const lonelyCoach = { role: 'coach', programs: [] };
const guardian = { role: 'guardian', programs: [] };

// ------------------------------------------------------------ R15.8 safeNext

test('safeNext keeps a same-origin path with its query', () => {
  assert.equal(safeNext('/journey?x=1', ORIGIN), '/journey?x=1');
  assert.equal(safeNext('/learn/music/music-quiz#q2', ORIGIN), '/learn/music/music-quiz#q2');
  assert.equal(safeNext('/who', 'http://localhost:4321'), '/who');
});

test('safeNext falls back to /who for every off-site form', () => {
  const bad = [
    '//example.com',
    '/\\example.com',
    '\\\\example.com',
    '\t//example.com',
    '/\t/example.com',
    '\n//example.com',
    '/\n/example.com',
    '\r\n//example.com',
    ' //example.com',
    '@example.com',
    '.example.com',
    'https://example.com/journey',
    `${ORIGIN}/journey`, // absolute URLs are refused even on our own origin
    'javascript:alert(1)',
    'example.com',
    '',
    null,
    undefined,
    42,
  ];
  for (const next of bad) assert.equal(safeNext(next, ORIGIN), '/who', JSON.stringify(next));
});

test('safeNext fixes the old start.js host bug: `${origin}${next}`', () => {
  // The old code built postFlowUrl as origin + next; these changed the host.
  assert.equal(new URL(`${ORIGIN}@example.com`).host, 'example.com');
  assert.equal(new URL(`${ORIGIN}.example.com`).host, 'app.physicalchess.org.example.com');
  assert.equal(new URL(safeNext('@example.com', ORIGIN), ORIGIN).host, 'app.physicalchess.org');
  assert.equal(new URL(safeNext('.example.com', ORIGIN), ORIGIN).host, 'app.physicalchess.org');
});

test('safeNext uses the given fallback and survives a bad origin', () => {
  assert.equal(safeNext('//evil', ORIGIN, '/family'), '/family');
  assert.equal(safeNext('/journey', 'not a url'), '/who');
});

// ------------------------------------------------------------ R15.1 scope

test('canSeeProgram: empty program is admin-only', () => {
  assert.equal(canSeeProgram(admin, ''), true);
  assert.equal(canSeeProgram(admin, null), true);
  assert.equal(canSeeProgram(coach, ''), false);
  assert.equal(canSeeProgram(coach, null), false);
  assert.equal(canSeeProgram(coach, 'bushwick'), true);
  assert.equal(canSeeProgram(coach, 'berkeley-carroll'), false);
  assert.equal(canSeeProgram(guardian, 'bushwick'), false);
  assert.equal(canSeeProgram(null, 'bushwick'), false);
});

test('rosterScope: a missing program means the caller\'s own programs', () => {
  assert.deepEqual(rosterScope(admin, ''), { programs: null });
  assert.deepEqual(rosterScope(coach, ''), { programs: ['bushwick', 'prospect'] });
  assert.deepEqual(rosterScope(lonelyCoach, ''), { programs: [] });
  assert.deepEqual(rosterScope(coach, 'prospect'), { programs: ['prospect'] });
  assert.deepEqual(rosterScope(coach, 'berkeley-carroll'), { error: 403 });
  assert.deepEqual(rosterScope(admin, 'berkeley-carroll'), { programs: ['berkeley-carroll'] });
});

test('rosterFilter: only admins query without a program filter', () => {
  assert.deepEqual(rosterFilter({ programs: null }), { active: { $ne: false } });
  assert.deepEqual(rosterFilter({ programs: ['bushwick'] }), { active: { $ne: false }, program: { $eq: 'bushwick' } });
  assert.deepEqual(rosterFilter({ programs: ['bushwick', 'prospect'] }), { active: { $ne: false }, program: { $in: ['bushwick', 'prospect'] } });
  assert.equal(rosterFilter({ programs: [] }), null, 'no programs → no query, empty roster');
  assert.equal(rosterFilter({ error: 403 }), null);
  // The coach filter never matches a player with no program.
  const f = rosterFilter(rosterScope(coach, ''));
  assert.ok(f.program.$in.every(Boolean));
});

// ------------------------------------------------------------ R15.2 whitelist

test('PATCH /api/account accepts only displayName, phone, leaderboardOptIn', () => {
  assert.deepEqual(pickAccountPatch({ displayName: '  Silva family ', leaderboardOptIn: true }), { patch: { displayName: 'Silva family', leaderboardOptIn: true } });
  assert.deepEqual(pickAccountPatch({ phone: '718-555-0100' }), { patch: { phone: '718-555-0100' } });
  assert.equal(pickAccountPatch({ displayName: 'x'.repeat(200) }).patch.displayName.length, 80);
});

test('PATCH /api/account rejects role, programs and memberId, even beside safe fields', () => {
  for (const key of ['role', 'programs', 'memberId']) {
    const r = pickAccountPatch({ displayName: 'Ok', [key]: key === 'programs' ? ['bushwick'] : 'admin' });
    assert.ok(r.error, key);
    assert.deepEqual(r.rejected, [key]);
    assert.equal(r.patch, undefined);
  }
  const all = pickAccountPatch({ role: 'admin', programs: [], memberId: 'm2' });
  assert.deepEqual(all.rejected.sort(), ['memberId', 'programs', 'role']);
});

test('PATCH /api/account rejects unknown keys, wrong types and empty bodies', () => {
  assert.deepEqual(pickAccountPatch({ email: 'x@y.z' }).rejected, ['email']);
  assert.deepEqual(pickAccountPatch({ _owner: 'm2' }).rejected, ['_owner']);
  assert.ok(pickAccountPatch({ leaderboardOptIn: 'yes' }).error);
  assert.ok(pickAccountPatch({ displayName: 5 }).error);
  assert.ok(pickAccountPatch({}).error);
  assert.ok(pickAccountPatch(null).error);
  assert.ok(pickAccountPatch([]).error);
});

test('POST/PATCH /api/players never take a program, account or snapshot field', () => {
  const ok = pickPlayerInput({ firstName: ' Nico ', apelido: 'Sabiá', avatar: { animal: 'frog', color: 'lime' }, inviteCode: ' k7q-m2x9 ', mayPlayInClass: true }, { create: true });
  assert.deepEqual(ok.fields, { firstName: 'Nico', apelido: 'Sabiá', avatar: { animal: 'frog', color: 'lime' }, mayPlayInClass: true });
  assert.equal(ok.inviteCode, 'k7q-m2x9');
  for (const key of ['program', 'accountId', 'xp', 'cordaCurrent', '_owner', 'id']) {
    const r = pickPlayerInput({ firstName: 'A', [key]: 'x' }, { create: true });
    assert.deepEqual(r.rejected, [key], key);
  }
  assert.ok(pickPlayerInput({ apelido: 'no name' }, { create: true }).error);
  assert.ok(pickPlayerInput({ firstName: 'A', avatar: { animal: 'dragon', color: 'lime' } }, { create: true }).error);
  // PATCH: id allowed, leaveProgram/active allowed, program still refused.
  assert.deepEqual(pickPlayerInput({ id: 'p1', leaveProgram: true }), { fields: {}, inviteCode: '', leaveProgram: true });
  assert.deepEqual(pickPlayerInput({ id: 'p1', active: false }).fields, { active: false });
  assert.deepEqual(pickPlayerInput({ id: 'p1', program: 'bushwick' }).rejected, ['program']);
  assert.ok(pickPlayerInput({ id: 'p1' }).error, 'nothing to save');
});

// ------------------------------------------------------------ R15.6

test('attendance requires every player to be in the program', () => {
  const players = [
    { id: 'a', program: 'bushwick' },
    { id: 'b', program: 'bushwick' },
    { id: 'c', program: 'prospect' },
    { id: 'd', program: null },
  ];
  assert.deepEqual(attendanceCheck(['a', 'b'], players, 'bushwick'), { ok: true, missing: [], mismatched: [] });
  assert.deepEqual(attendanceCheck(['a', 'c', 'd'], players, 'bushwick'), { ok: false, missing: [], mismatched: ['c', 'd'] });
  assert.deepEqual(attendanceCheck(['a', 'zz'], players, 'bushwick'), { ok: false, missing: ['zz'], mismatched: [] });
  assert.equal(attendanceCheck(['a'], players, '').ok, false);
});

test('attendance dates are real YYYY-MM-DD days', () => {
  assert.equal(validClassDate('2026-10-02'), true);
  assert.equal(validClassDate(undefined), true);
  assert.equal(validClassDate(''), true);
  assert.equal(validClassDate('2026-02-30'), false);
  assert.equal(validClassDate('10/02/2026'), false);
  assert.equal(validClassDate({}), false);
});

// ------------------------------------------------------------ R15.9

test('leaderboard: a guardian sees only their own children\'s programs', () => {
  assert.equal(leaderboardAllowed(guardian, 'bushwick', ['bushwick']), true);
  assert.equal(leaderboardAllowed(guardian, 'prospect', ['bushwick']), false);
  assert.equal(leaderboardAllowed(guardian, 'bushwick', []), false);
  assert.equal(leaderboardAllowed(guardian, '', ['bushwick']), false);
  assert.equal(leaderboardAllowed(coach, 'prospect', []), true);
  assert.equal(leaderboardAllowed(coach, 'berkeley-carroll', []), false);
  assert.equal(leaderboardAllowed(coach, 'berkeley-carroll', ['berkeley-carroll']), true, 'a coach who is also a parent');
  assert.equal(leaderboardAllowed(admin, 'berkeley-carroll', []), true);
  assert.equal(leaderboardAllowed({ role: 'guardian', programs: ['prospect'] }, 'prospect', []), false, 'programs[] on a guardian row grants nothing');
});

// ------------------------------------------------------------ R15.7

const headers = (h) => new Headers(h);

test('cron: CRON_SECRET bearer passes; the x-vercel-cron header alone gets nothing', () => {
  const env = { CRON_SECRET: 'cron-abc', EXPORT_SECRET: 'export-xyz' };
  assert.equal(cronAuthorized(headers({ authorization: 'Bearer cron-abc' }), env), true);
  assert.equal(cronAuthorized(headers({ 'x-vercel-cron': '1' }), env), false);
  assert.equal(cronAuthorized(headers({ 'x-vercel-cron': '1' }), {}), false);
  assert.equal(cronAuthorized(headers({ authorization: 'Bearer wrong' }), env), false);
  assert.equal(cronAuthorized(headers({ authorization: 'cron-abc' }), env), false);
  assert.equal(cronAuthorized(headers({}), env), false);
});

test('cron: EXPORT_SECRET still works for manual runs; empty secrets never match', () => {
  const env = { CRON_SECRET: 'cron-abc', EXPORT_SECRET: 'export-xyz' };
  assert.equal(cronAuthorized(headers({ authorization: 'Bearer export-xyz' }), env), true);
  assert.equal(cronAuthorized(headers({ 'x-export-secret': 'export-xyz' }), env), true);
  assert.equal(cronAuthorized(headers({ authorization: 'Bearer ' }), { CRON_SECRET: '', EXPORT_SECRET: '' }), false);
  assert.equal(cronAuthorized(headers({ authorization: 'Bearer undefined' }), {}), false);
  assert.equal(cronAuthorized({ authorization: 'Bearer cron-abc' }, env), true, 'plain object headers');
});

test('timingSafeEqual compares whole strings', () => {
  assert.equal(timingSafeEqual('abc', 'abc'), true);
  assert.equal(timingSafeEqual('abc', 'abd'), false);
  assert.equal(timingSafeEqual('abc', 'abcd'), false);
  assert.equal(timingSafeEqual('', ''), true);
});

// ------------------------------------------------------------ R15.3

test('cookie lifetime: coach and admin 24 h, family 180 days', () => {
  assert.equal(sessionMaxAge({ role: 'coach' }), COACH_MAX_AGE);
  assert.equal(sessionMaxAge({ role: 'admin' }), COACH_MAX_AGE);
  assert.equal(sessionMaxAge({ role: 'guardian' }), GUARDIAN_MAX_AGE);
  assert.equal(sessionMaxAge({}), GUARDIAN_MAX_AGE);
  assert.equal(COACH_MAX_AGE, 86400);
  assert.equal(GUARDIAN_MAX_AGE, 180 * 86400);
});

test('Class mode caps the cookie at 8 h and the cap never slides', () => {
  const t0 = Date.parse('2026-10-02T13:00:00Z');
  const started = classSessionPayload({ role: 'coach', refreshToken: 'r' }, t0);
  assert.equal(started.classUntil, t0 + CLASS_MAX_AGE * 1000);
  assert.equal(sessionMaxAge(started, t0), 8 * 3600);
  const later = t0 + 3 * 3600 * 1000;
  assert.equal(sessionMaxAge(started, later), 5 * 3600, 'refresh three hours in keeps the same end');
  assert.equal(classSessionPayload(started, later).classUntil, started.classUntil, 'starting again does not extend');
  assert.equal(classExpired(started, later), false);
  assert.equal(classExpired(started, t0 + 8 * 3600 * 1000), true);
  assert.equal(sessionMaxAge(started, t0 + 9 * 3600 * 1000), 0);
  assert.equal(classExpired({ role: 'coach' }, later), false);
});

// ------------------------------------------------------------ R15.4

test('class players: coach\'s program, may play in class, active', () => {
  const p = { id: 'p', program: 'bushwick', mayPlayInClass: true, active: true };
  assert.equal(classPlayerAllowed(coach, p), true);
  assert.equal(classPlayerAllowed(admin, { ...p, program: null }), true);
  assert.equal(classPlayerAllowed(coach, { ...p, program: 'berkeley-carroll' }), false);
  assert.equal(classPlayerAllowed(coach, { ...p, program: null }), false);
  assert.equal(classPlayerAllowed(coach, { ...p, mayPlayInClass: false }), false);
  assert.equal(classPlayerAllowed(coach, { ...p, active: false }), false);
  assert.equal(classPlayerAllowed(guardian, p), false);
  assert.equal(classPlayerAllowed({ role: 'guardian', programs: ['bushwick'] }, p), false);
});

// ------------------------------------------------------------ R15.10-11

const P = { playerId: 'p1', accountId: 'acct-1' };
const at = (d) => new Date(`2026-09-${d}T20:00:00Z`);

test('coach-only filter: corda, stamps, coach XP and notes, coach patches', () => {
  const ok = [
    makeEvent({ ...P, type: EVENT.VIDEO_DONE, lessonId: 'ginga-basics', moduleId: 'movements' }),
    makeEvent({ ...P, type: EVENT.PATCH_EARNED, payload: { patchKey: 'first-steps' }, source: 'system' }),
    makeEvent({ ...P, type: EVENT.DESAFIO_DONE, source: 'class' }),
  ];
  const forged = [
    makeEvent({ ...P, type: EVENT.CORDA_AWARDED, payload: { corda: 'azul' }, source: 'coach' }),
    makeEvent({ ...P, type: EVENT.ATTENDANCE, payload: { program: 'bushwick' }, source: 'coach' }),
    makeEvent({ ...P, type: EVENT.COACH_XP, payload: { xp: 50 }, source: 'coach' }),
    makeEvent({ ...P, type: EVENT.COACH_NOTE, payload: { note: 'great' }, source: 'app' }),
    makeEvent({ ...P, type: EVENT.PATCH_EARNED, payload: { patchKey: 'first-steps' }, source: 'coach' }),
    makeEvent({ ...P, type: EVENT.PATCH_EARNED, payload: { patchKey: 'helper' }, source: 'system' }),
    makeEvent({ ...P, type: EVENT.PATCH_EARNED, payload: { patchKey: 'batizado-2026' }, source: 'app' }),
  ];
  for (const e of ok) assert.equal(isCoachOnly(e), false, e.type);
  for (const e of forged) assert.equal(isCoachOnly(e), true, `${e.type} ${e.source}`);
  assert.deepEqual([...COACH_PATCH_KEYS].sort(), ['batizado-2026', 'helper']);
  assert.deepEqual(memberEvents([...ok, ...forged]).map((e) => e.clientEventId), ok.map((e) => e.clientEventId));
});

test('memberEvents drops rows another member wrote into this child\'s ledger', () => {
  const mine = { ...makeEvent({ ...P, type: EVENT.VIDEO_DONE, lessonId: 'ginga-basics' }), _owner: 'm-guardian' };
  const theirs = { ...makeEvent({ ...P, type: EVENT.VIDEO_DONE, lessonId: 'au' }), _owner: 'm-stranger' };
  const server = makeEvent({ ...P, type: EVENT.READING_DONE, lessonId: 'roda-etiquette' });
  assert.deepEqual(memberEvents([mine, theirs, server], { ownerId: 'm-guardian' }).map((e) => e.lessonId), ['ginga-basics', 'roda-etiquette']);
  assert.equal(memberEvents([mine, theirs]).length, 2, 'browser reads are already author-scoped');
});

test('mirror rows become events with stable ids', () => {
  const corda = cordaRowToEvent({ _id: 'c1', playerId: 'p1', corda: 'crua-verde', event: 'Batizado 2026', awardedAt: { $date: '2026-09-20T15:00:00.000Z' }, note: 'axé' }, 'acct-1');
  assert.deepEqual(corda, {
    clientEventId: 'corda:c1', playerId: 'p1', accountId: 'acct-1', type: EVENT.CORDA_AWARDED,
    moduleId: null, lessonId: null, payload: { corda: 'crua-verde', event: 'Batizado 2026', note: 'axé' },
    xp: 0, stars: 0, occurredAt: '2026-09-20T15:00:00.000Z', source: 'coach',
  });
  const stamp = attendanceRowToEvent({ id: 'a1', playerId: 'p1', program: 'bushwick', classDate: '2026-09-22' });
  assert.equal(stamp.clientEventId, 'attendance:a1');
  assert.equal(stamp.type, EVENT.ATTENDANCE);
  assert.equal(stamp.occurredAt, '2026-09-22T16:00:00.000Z', 'falls back to the class date');
  assert.deepEqual(stamp.payload, { program: 'bushwick', classDate: '2026-09-22' });
  assert.equal(attendanceRowToEvent({ _id: 'a2', playerId: 'p1', classDate: '2026-09-22', stampedAt: '2026-09-22T21:05:00.000Z' }).occurredAt, '2026-09-22T21:05:00.000Z');
  const patch = patchAwardRowToEvent({ _id: 'pa1', playerId: 'p1', patchKey: 'helper', earnedAt: new Date('2026-09-23T18:00:00Z') });
  assert.equal(patch.type, EVENT.PATCH_EARNED);
  assert.equal(patch.source, 'coach');
  assert.equal(patch.occurredAt, '2026-09-23T18:00:00.000Z');
  const xp = coachEventRowToEvent({ _id: 'ce1', playerId: 'p1', type: EVENT.COACH_XP, payload: '{"xp":30,"note":"great ginga"}', occurredAt: '2026-09-24T18:00:00.000Z', clientEventId: 'uuid-1' });
  assert.equal(xp.clientEventId, 'uuid-1');
  assert.deepEqual(xp.payload, { xp: 30, note: 'great ginga' });
  assert.equal(coachEventRowToEvent({ _id: 'ce2', playerId: 'p1', type: EVENT.CORDA_AWARDED, occurredAt: '2026-09-24T18:00:00.000Z' }), null, 'lms-coach-events holds coach.xp and coach.note only');
});

test('buildLedger: forged coach events are ignored, real awards count in the snapshot', () => {
  const learner = [
    { ...makeEvent({ ...P, type: EVENT.VIDEO_DONE, moduleId: 'movements', lessonId: 'ginga-basics', occurredAt: at(10) }), _owner: 'm1' },
    // Forged by the family: stored xp 500 and a coach-only type.
    { ...makeEvent({ ...P, type: EVENT.READING_DONE, moduleId: 'movements', lessonId: 'roda-etiquette', occurredAt: at(11) }), xp: 500, _owner: 'm1' },
    { ...makeEvent({ ...P, type: EVENT.COACH_XP, payload: { xp: 50 }, occurredAt: at(11), source: 'coach' }), _owner: 'm1' },
    { ...makeEvent({ ...P, type: EVENT.CORDA_AWARDED, payload: { corda: 'azul' }, occurredAt: at(11), source: 'coach' }), _owner: 'm1' },
    { ...makeEvent({ ...P, type: EVENT.PATCH_EARNED, payload: { patchKey: 'batizado-2026' }, occurredAt: at(11), source: 'coach' }), _owner: 'm1' },
    ...[1, 2, 3, 4, 5, 6].map((i) => ({ ...makeEvent({ ...P, type: EVENT.ATTENDANCE, payload: { program: 'bushwick' }, occurredAt: at(11), source: 'coach' }), _owner: 'm1', clientEventId: `forged-att-${i}` })),
  ];
  const forgedOnly = derivePlayer(buildLedger({ events: learner, ownerId: 'm1' }));
  assert.equal(forgedOnly.xp, 20 + 15, 'stored xp is re-scored, coach xp ignored');
  assert.equal(forgedOnly.cordaCurrent, 'crua');
  assert.equal(forgedOnly.attendance, 0);
  assert.ok(!forgedOnly.patches.some((p) => p.key === 'batizado-2026'));

  const ledger = buildLedger({
    events: learner,
    ownerId: 'm1',
    accountId: 'acct-1',
    corda: [{ _id: 'c1', playerId: 'p1', corda: 'crua-verde', awardedAt: at(20).toISOString() }],
    attendance: [{ _id: 'a1', playerId: 'p1', program: 'bushwick', classDate: '2026-09-15' }, { _id: 'a2', playerId: 'p1', program: 'bushwick', classDate: '2026-09-22' }],
    patchAwards: [{ _id: 'pa1', playerId: 'p1', patchKey: 'helper', earnedAt: at(21).toISOString() }],
    coachEvents: [
      { _id: 'ce1', playerId: 'p1', type: EVENT.COACH_XP, payload: JSON.stringify({ xp: 30 }), occurredAt: at(22).toISOString(), clientEventId: 'cx-1', xp: 999 },
      { _id: 'ce2', playerId: 'p1', type: EVENT.COACH_NOTE, payload: JSON.stringify({ note: 'Lovely ginga', by: 'acct-coach' }), occurredAt: at(23).toISOString(), clientEventId: 'cn-1' },
    ],
  });
  const s = derivePlayer(ledger);
  assert.equal(s.xp, 20 + 15 + 30, 'coach XP from lms-coach-events, scored from payload');
  assert.equal(s.cordaCurrent, 'crua-verde');
  assert.equal(s.attendance, 2);
  assert.ok(s.patches.some((p) => p.key === 'helper'));
  assert.ok(!s.patches.some((p) => p.key === 'batizado-2026'));
  assert.deepEqual(s.notes.map((n) => n.note), ['Lovely ginga']);
  assert.ok(ledger.every((e) => !('_owner' in e)), '_owner never leaves buildLedger');
  assert.deepEqual(ledger.map((e) => e.occurredAt), [...ledger.map((e) => e.occurredAt)].sort((a, b) => new Date(a) - new Date(b)));
});

test('byPlayer groups mirror rows for one roster-wide query', () => {
  const m = byPlayer([{ playerId: 'a', x: 1 }, { playerId: 'b' }, { playerId: 'a', x: 2 }, { nope: true }]);
  assert.deepEqual(m.get('a').map((r) => r.x), [1, 2]);
  assert.equal(m.get('b').length, 1);
  assert.equal(m.size, 2);
});

test('class writes: learner events only, pinned to the child, source class, XP scored server-side', () => {
  const now = new Date('2026-10-02T15:00:00Z');
  const prior = [makeEvent({ playerId: 'kid', accountId: 'acct-kid', type: EVENT.VIDEO_DONE, lessonId: 'ginga-basics', occurredAt: at(20), clientEventId: 'old-1' })];
  const sent = [
    { ...makeEvent({ playerId: 'other', accountId: 'acct-coach', type: EVENT.VIDEO_DONE, lessonId: 'au', moduleId: 'movements', occurredAt: now, source: 'class' }), xp: 900, clientEventId: 'n1' },
    { ...makeEvent({ playerId: 'kid', accountId: 'x', type: EVENT.VIDEO_DONE, lessonId: 'ginga-basics', occurredAt: now, source: 'class' }), clientEventId: 'n2' },
    { ...makeEvent({ playerId: 'kid', accountId: 'x', type: EVENT.MODULE_CLEARED, moduleId: 'movements', occurredAt: now, source: 'system' }), clientEventId: 'n3' },
    { ...makeEvent({ playerId: 'kid', type: EVENT.COACH_XP, payload: { xp: 50 }, occurredAt: now }), clientEventId: 'n4' },
    { ...makeEvent({ playerId: 'kid', type: EVENT.CORDA_AWARDED, payload: { corda: 'azul' }, occurredAt: now }), clientEventId: 'n5' },
    { ...makeEvent({ playerId: 'kid', type: EVENT.PATCH_EARNED, payload: { patchKey: 'helper' }, occurredAt: now, source: 'system' }), clientEventId: 'n6' },
    { ...makeEvent({ playerId: 'kid', type: EVENT.PLAYER_DELETED, occurredAt: now }), clientEventId: 'n7' },
    { ...makeEvent({ playerId: 'kid', type: EVENT.DESAFIO_DONE, occurredAt: new Date('2027-01-01T00:00:00Z') }), clientEventId: 'n8' },
    { ...makeEvent({ playerId: 'kid', type: EVENT.DESAFIO_DONE, occurredAt: now }), clientEventId: 'old-1' },
    { ...makeEvent({ playerId: 'kid', type: EVENT.DESAFIO_DONE, occurredAt: now }), clientEventId: 'n1' },
    null,
    { type: EVENT.VIDEO_DONE, occurredAt: now.toISOString() },
  ];
  const out = sanitizeClassEvents(sent, { playerId: 'kid', accountId: 'acct-kid', existingIds: new Set(['old-1']), prior, now });
  assert.deepEqual(out.map((e) => e.clientEventId), ['n1', 'n2', 'n3']);
  assert.ok(out.every((e) => e.playerId === 'kid' && e.accountId === 'acct-kid'));
  assert.deepEqual(out.map((e) => e.source), ['class', 'class', 'system']);
  assert.deepEqual(out.map((e) => e.xp), [20, 0, 100], 'stored xp ignored; a repeat lesson pays nothing');
});

// ------------------------------------------------------------ R15.12 invites

test('matchInvite: case, spaces and dashes do not matter; inactive programs never match', () => {
  const programs = [
    { key: 'bushwick', inviteCode: 'K7Q-M2X9', active: true },
    { key: 'prospect', inviteCode: 'ZP4RW8', active: false },
    { key: 'nocode', active: true },
  ];
  assert.equal(normalizeInvite(' k7q-m2 x9 '), 'K7QM2X9');
  assert.equal(matchInvite('k7qm2x9', programs), 'bushwick');
  assert.equal(matchInvite(' K7Q-M2X9 ', programs), 'bushwick');
  assert.equal(matchInvite('ZP4RW8', programs), null);
  assert.equal(matchInvite('', programs), null);
  assert.equal(matchInvite('anything', programs), null);
  assert.equal(matchInvite(undefined, programs), null);
});

test('PROGRAMS ships without invite codes and keeps its stable shape', () => {
  assert.deepEqual(PROGRAMS.map((p) => p.key), ['bushwick', 'berkeley-carroll', 'prospect', 'brooklyn-open']);
  for (const p of PROGRAMS) {
    assert.deepEqual(Object.keys(p).sort(), ['active', 'dayOfWeek', 'key', 'name']);
    assert.equal('inviteCode' in p, false);
  }
});

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear() };
}

test('demo invite validation goes through localRepo with placeholder codes', async () => {
  globalThis.localStorage = memoryStorage();
  const { localRepo, DEMO_INVITE_CODES } = await import('../src/lib/repo/localRepo.js');
  assert.deepEqual(await localRepo.checkInvite('bushwick'), { key: 'bushwick', name: 'Achievement First Bushwick' }, 'the smoke test types BUSHWICK');
  assert.deepEqual(await localRepo.checkInvite(' roda '), { key: 'brooklyn-open', name: 'ACE Brooklyn (open class)' });
  assert.equal(await localRepo.checkInvite('NOPE'), null);
  assert.equal(await localRepo.checkInvite(''), null);
  assert.equal(DEMO_INVITE_CODES.length, 4);

  await localRepo.signInDemo();
  const placed = await localRepo.createPlayer({ firstName: 'Nico', inviteCode: 'BUSHWICK', program: 'prospect' });
  assert.equal(placed.program, 'bushwick', 'program comes from the code, never from `program`');
  assert.equal('inviteCode' in placed, false);
  const home = await localRepo.createPlayer({ firstName: 'Ana' });
  assert.equal(home.program, null);
  const sneaky = await localRepo.createPlayer({ firstName: 'Bo', program: 'prospect' });
  assert.equal(sneaky.program, null);
  await assert.rejects(() => localRepo.createPlayer({ firstName: 'Cy', inviteCode: 'WRONG' }), (err) => err.code === 'INVITE');

  assert.equal((await localRepo.updatePlayer(placed.id, { apelido: 'Sabiá' })).program, 'bushwick', 'blank code keeps the class');
  assert.equal((await localRepo.updatePlayer(placed.id, { program: 'prospect' })).program, 'bushwick', '`program` is ignored');
  assert.equal((await localRepo.updatePlayer(placed.id, { inviteCode: 'prospect' })).program, 'prospect');
  assert.equal((await localRepo.updatePlayer(placed.id, { leaveProgram: true })).program, null);
  await assert.rejects(() => localRepo.updatePlayer(placed.id, { inviteCode: 'WRONG' }), (err) => err.code === 'INVITE');
  delete globalThis.localStorage;
});

// ------------------------------------------------------------ R15.12 bundle

const CLIENT = new URL('../dist/client/', import.meta.url).pathname;
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

test('built client: programs chunk has no invite codes; demo placeholders only in the demo repo chunk', { skip: !existsSync(CLIENT) && 'run npm run build first' }, () => {
  const files = walk(CLIENT).filter((p) => /\.(js|html|json)$/.test(p));
  const programChunks = files.filter((p) => {
    const s = readFileSync(p, 'utf8');
    return s.includes('brooklyn-open') && s.includes('dayOfWeek');
  });
  assert.ok(programChunks.length >= 1, 'found the PROGRAMS chunk');
  const literal = /[`'"](BUSHWICK|BERKELEY|PROSPECT|RODA)[`'"]/;
  for (const p of programChunks) {
    const s = readFileSync(p, 'utf8');
    assert.equal(s.includes('inviteCode'), false, `${p} carries inviteCode`);
    assert.equal(literal.test(s), false, `${p} carries a code`);
  }
  const withCodes = files.filter((p) => literal.test(readFileSync(p, 'utf8')));
  for (const p of withCodes) assert.ok(readFileSync(p, 'utf8').includes('pc.demo.v1'), `${p} has a code outside the demo repo chunk`);
  assert.ok(withCodes.length <= 1, `codes in ${withCodes.length} files`);
});
