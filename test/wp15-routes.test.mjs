// wp15-routes.test.mjs — drives the real WP15 route handlers against an
// in-memory fake of the Wix REST endpoints they call (OAuth token, Get My
// Member, Data Items query/insert/update/get/bulk). No network. This checks
// the glue in lms.js and src/pages/api/** that the pure tests cannot reach.
// It does NOT prove Wix lets a server route set `_owner`: that is the first
// spike after D13 (agents/reports/WP15.md).
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeEvent, EVENT } from '../src/lib/game/index.js';

process.env.WIX_CLIENT_SECRET = 'test-secret';
process.env.WIX_SITE_ID = 'site-test';
process.env.PUBLIC_WIX_CLIENT_ID = 'client-test';
process.env.SESSION_COOKIE_SECRET = 'cookie-secret-for-tests-only';
process.env.CRON_SECRET = 'cron-secret';
process.env.EXPORT_SECRET = 'export-secret';
process.env.APP_ORIGIN = 'https://app.test';

// ------------------------------------------------------------------ fake Wix

let db;
let seq;
const MEMBERS = {
  'tok-ana': { id: 'm-ana', loginEmail: 'ana@x.test', contact: { firstName: 'Ana', lastName: 'Silva' } },
  'tok-ben': { id: 'm-ben', loginEmail: 'ben@x.test', contact: { firstName: 'Ben' } },
  'tok-coach': { id: 'm-coach', loginEmail: 'coach@x.test', contact: { firstName: 'Cora' } },
  'tok-lonely': { id: 'm-lonely', loginEmail: 'lonely@x.test', contact: { firstName: 'Lo' } },
  'tok-admin': { id: 'm-admin', loginEmail: 'admin@x.test', contact: { firstName: 'Ad' } },
  'tok-new': { id: 'm-new', loginEmail: 'new@x.test', contact: { firstName: 'Nia', lastName: 'Lee' } },
};
const coll = (id) => (db[id] ||= []);
function matches(row, filter = {}) {
  return Object.entries(filter).every(([k, cond]) => {
    const v = row[k];
    if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
      if ('$eq' in cond && v !== cond.$eq) return false;
      if ('$ne' in cond && v === cond.$ne) return false;
      if ('$in' in cond && !cond.$in.includes(v)) return false;
      return true;
    }
    return v === cond;
  });
}
const item = (row) => ({ id: row._id, data: { ...row } });
function insertRow(collection, data, actor = 'app-identity') {
  const row = { ...data, _id: `${collection}-${++seq}`, _createdDate: new Date().toISOString() };
  if (!row._owner) row._owner = actor; // Wix sets the writer as owner when none is given
  coll(collection).push(row);
  return row;
}
const jsonRes = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url);
  const body = init.body ? JSON.parse(init.body) : {};
  const method = init.method || 'GET';
  const auth = init.headers?.Authorization || init.headers?.authorization || '';
  if (u.pathname === '/oauth2/token') {
    if (body.grant_type === 'client_credentials') return jsonRes({ access_token: 'admin-token' });
    if (body.grantType === 'authorization_code') return jsonRes({ access_token: body.code, refresh_token: `refresh-${body.code}`, expires_in: 14400 });
    if (body.grantType === 'refresh_token') return jsonRes({ access_token: body.refreshToken.replace('refresh-', ''), refresh_token: body.refreshToken, expires_in: 14400 });
    if (body.grantType === 'anonymous') return jsonRes({ access_token: 'visitor' });
  }
  if (u.pathname === '/members/v1/members/my') {
    const m = MEMBERS[auth];
    return m ? jsonRes({ member: m }) : jsonRes({ message: 'no' }, 401);
  }
  if (u.pathname === '/_api/redirects-api/v1/redirect-session') {
    return jsonRes({ redirectSession: { fullUrl: 'https://wix.test/redirect', postFlowUrl: body.callbacks.postFlowUrl } });
  }
  assert.equal(auth, 'admin-token', `Wix Data call without the admin token: ${u.pathname}`);
  if (u.pathname === '/wix-data/v2/items/query') {
    const { dataCollectionId, query } = body;
    let rows = coll(dataCollectionId).filter((r) => matches(r, query.filter));
    for (const s of query.sort || []) rows = [...rows].sort((a, b) => String(a[s.fieldName]).localeCompare(String(b[s.fieldName])) * (s.order === 'DESC' ? -1 : 1));
    const page = rows.slice(query.paging.offset, query.paging.offset + query.paging.limit);
    return jsonRes({ dataItems: page.map(item), pagingMetadata: { hasNext: query.paging.offset + page.length < rows.length } });
  }
  if (u.pathname === '/wix-data/v2/items' && method === 'POST') {
    return jsonRes({ dataItem: item(insertRow(body.dataCollectionId, body.dataItem.data)) });
  }
  if (u.pathname === '/wix-data/v2/bulk/items/insert') {
    return jsonRes({ results: body.dataItems.map((d) => ({ item: item(insertRow(body.dataCollectionId, d.data)) })) });
  }
  if (u.pathname === '/wix-data/v2/bulk/items/remove') {
    db[body.dataCollectionId] = coll(body.dataCollectionId).filter((r) => !body.dataItemIds.includes(r._id));
    return jsonRes({ results: [] });
  }
  const m = u.pathname.match(/^\/wix-data\/v2\/items\/([^/]+)$/);
  if (m) {
    const id = decodeURIComponent(m[1]);
    const collection = body.dataCollectionId || u.searchParams.get('dataCollectionId');
    const rows = coll(collection);
    const i = rows.findIndex((r) => r._id === id);
    if (i === -1) return jsonRes({ message: 'not found' }, 404);
    if (method === 'PUT') { rows[i] = { ...body.dataItem.data, _id: id }; return jsonRes({ dataItem: item(rows[i]) }); }
    if (method === 'DELETE') { rows.splice(i, 1); return jsonRes({}); }
    return jsonRes({ dataItem: item(rows[i]) });
  }
  throw new Error(`fake Wix: unhandled ${method} ${url}`);
};

// ------------------------------------------------------------------ helpers

const req = (path, { method = 'GET', token, body, headers = {} } = {}) => new Request(`https://app.test${path}`, {
  method,
  headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
  body: body ? JSON.stringify(body) : undefined,
});
const call = async (handler, opts = {}, extra = {}) => {
  const request = req(opts.path || '/', opts);
  const res = await handler({ request, url: new URL(request.url), params: extra.params || {}, cookies: extra.cookies, redirect: extra.redirect });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data, headers: res.headers };
};
function cookieJar(initial = {}) {
  const store = new Map(Object.entries(initial));
  const opts = new Map();
  return {
    get: (k) => (store.has(k) ? { value: store.get(k) } : undefined),
    set: (k, v, o) => { store.set(k, v); opts.set(k, o); },
    delete: (k) => { store.delete(k); opts.delete(k); },
    value: (k) => store.get(k),
    opts: (k) => opts.get(k),
  };
}
const rows = (c) => coll(c);

const api = {
  account: await import('../src/pages/api/account.js'),
  players: await import('../src/pages/api/players/index.js'),
  invite: await import('../src/pages/api/players/invite.js'),
  roster: await import('../src/pages/api/coach/roster.js'),
  attendance: await import('../src/pages/api/coach/attendance.js'),
  award: await import('../src/pages/api/coach/award.js'),
  detail: await import('../src/pages/api/coach/players/[id].js'),
  leaderboard: await import('../src/pages/api/leaderboard.js'),
  recompute: await import('../src/pages/api/jobs/recompute.js'),
  exportCsv: await import('../src/pages/api/export.js'),
  classRead: await import('../src/pages/api/coach/class/players/[id].js'),
  classWrite: await import('../src/pages/api/coach/class/events.js'),
  callback: await import('../src/pages/auth/callback.js'),
  session: await import('../src/pages/api/session/index.js'),
  classSession: await import('../src/pages/api/session/class.js'),
  start: await import('../src/pages/api/session/start.js'),
};
const { sign, verify } = await import('../src/lib/server/session.js');

// Two families (Ana: Maya in bushwick + Tom with no program; Ben: Kai in
// prospect), a coach for bushwick, a coach with no programs, an admin.
beforeEach(() => {
  seq = 0;
  db = {};
  for (const [id, memberId, role, programs] of [
    ['acct-ana', 'm-ana', 'guardian', []],
    ['acct-ben', 'm-ben', 'guardian', []],
    ['acct-coach', 'm-coach', 'coach', ['bushwick']],
    ['acct-lonely', 'm-lonely', 'coach', []],
    ['acct-admin', 'm-admin', 'admin', []],
  ]) coll('lms-accounts').push({ _id: id, memberId, role, programs, displayName: id, email: `${memberId}@x.test`, leaderboardOptIn: true, _owner: memberId });
  coll('lms-players').push(
    { _id: 'maya', accountId: 'acct-ana', firstName: 'Maya', apelido: 'Gatinha', program: 'bushwick', active: true, mayPlayInClass: true, _owner: 'm-ana' },
    { _id: 'tom', accountId: 'acct-ana', firstName: 'Tom', apelido: 'Tatu', program: null, active: true, mayPlayInClass: true, _owner: 'm-ana' },
    { _id: 'kai', accountId: 'acct-ben', firstName: 'Kai', apelido: 'Girafa', program: 'prospect', active: true, mayPlayInClass: true, _owner: 'm-ben' },
    { _id: 'noa', accountId: 'acct-ben', firstName: 'Noa', apelido: 'Onça', program: 'bushwick', active: true, mayPlayInClass: false, _owner: 'm-ben' },
  );
  coll('lms-programs').push(
    { _id: 'prog-1', key: 'bushwick', name: 'Achievement First Bushwick', inviteCode: 'K7Q-M2X9', active: true },
    { _id: 'prog-2', key: 'prospect', name: 'Prospect Schools', inviteCode: 'ZP4RW8', active: true },
  );
});

const memberEvent = (owner, e) => coll('lms-events').push({ ...e, payload: JSON.stringify(e.payload), _id: `ev-${++seq}`, _owner: owner });

// ------------------------------------------------------------------ R15.2

test('POST /api/account creates the row once, as guardian, owned by the member', async () => {
  const first = await call(api.account.POST, { method: 'POST', token: 'tok-new' });
  assert.equal(first.status, 201);
  assert.equal(first.data.account.role, 'guardian');
  assert.deepEqual(first.data.account.programs, []);
  const row = rows('lms-accounts').find((r) => r.memberId === 'm-new');
  assert.equal(row._owner, 'm-new');
  assert.equal(row.displayName, 'Nia Lee');
  const again = await call(api.account.POST, { method: 'POST', token: 'tok-new' });
  assert.equal(again.status, 200);
  assert.equal(rows('lms-accounts').filter((r) => r.memberId === 'm-new').length, 1);
  assert.equal((await call(api.account.POST, { method: 'POST' })).status, 401);
});

test('PATCH /api/account saves safe settings and rejects role tampering', async () => {
  const bad = await call(api.account.PATCH, { method: 'PATCH', token: 'tok-ana', body: { displayName: 'x', role: 'admin' } });
  assert.equal(bad.status, 400);
  assert.deepEqual(bad.data.rejected, ['role']);
  assert.equal((await call(api.account.PATCH, { method: 'PATCH', token: 'tok-ana', body: { programs: ['bushwick'] } })).status, 400);
  const ok = await call(api.account.PATCH, { method: 'PATCH', token: 'tok-ana', body: { displayName: 'Silva', phone: '555', leaderboardOptIn: false } });
  assert.equal(ok.status, 200);
  const row = rows('lms-accounts').find((r) => r._id === 'acct-ana');
  assert.deepEqual([row.displayName, row.phone, row.leaderboardOptIn, row.role, row.memberId], ['Silva', '555', false, 'guardian', 'm-ana']);
  assert.equal((await call(api.account.PATCH, { method: 'PATCH', token: 'tok-new', body: { displayName: 'x' } })).status, 403, 'no account row yet');
});

test('POST /api/players places a child only by a valid server-side invite code', async () => {
  const made = await call(api.players.POST, { method: 'POST', token: 'tok-ana', body: { firstName: 'Lia', inviteCode: 'k7q m2x9', avatar: { animal: 'frog', color: 'sky' } } });
  assert.equal(made.status, 201);
  assert.equal(made.data.player.program, 'bushwick');
  assert.equal(made.data.player.accountId, 'acct-ana');
  assert.equal('ownerId' in made.data.player, false);
  assert.equal(rows('lms-players').find((r) => r._id === made.data.player.id)._owner, 'm-ana');
  const wrong = await call(api.players.POST, { method: 'POST', token: 'tok-ana', body: { firstName: 'Lia', inviteCode: 'BUSHWICK' } });
  assert.equal(wrong.status, 400);
  assert.equal(wrong.data.code, 'INVITE', 'retired public codes no longer work');
  assert.equal((await call(api.players.POST, { method: 'POST', token: 'tok-ana', body: { firstName: 'Lia', program: 'bushwick' } })).status, 400);
  assert.equal((await call(api.players.POST, { method: 'POST', token: 'tok-ana', body: { firstName: 'Lia', accountId: 'acct-ben' } })).status, 400);
  const home = await call(api.players.POST, { method: 'POST', token: 'tok-ana', body: { firstName: 'Bo' } });
  assert.equal(home.data.player.program, null);
});

test('POST /api/players/invite names the class without revealing codes', async () => {
  assert.deepEqual((await call(api.invite.POST, { method: 'POST', token: 'tok-ana', body: { code: 'zp4rw8' } })).data, { program: { key: 'prospect', name: 'Prospect Schools' } });
  assert.deepEqual((await call(api.invite.POST, { method: 'POST', token: 'tok-ana', body: { code: 'nope' } })).data, { program: null });
  assert.equal((await call(api.invite.POST, { method: 'POST', body: { code: 'zp4rw8' } })).status, 401);
});

test('PATCH /api/players: owner only; program changes only by code or leaveProgram', async () => {
  assert.equal((await call(api.players.PATCH, { method: 'PATCH', token: 'tok-ben', body: { id: 'maya', apelido: 'hacked' } })).status, 403);
  assert.equal((await call(api.players.PATCH, { method: 'PATCH', token: 'tok-ana', body: { id: 'maya', program: 'prospect' } })).status, 400);
  const keep = await call(api.players.PATCH, { method: 'PATCH', token: 'tok-ana', body: { id: 'maya', apelido: 'Gata' } });
  assert.deepEqual([keep.status, keep.data.player.program, keep.data.player.apelido], [200, 'bushwick', 'Gata']);
  const moved = await call(api.players.PATCH, { method: 'PATCH', token: 'tok-ana', body: { id: 'maya', inviteCode: 'ZP4RW8' } });
  assert.equal(moved.data.player.program, 'prospect');
  assert.equal((await call(api.players.PATCH, { method: 'PATCH', token: 'tok-ana', body: { id: 'maya', inviteCode: 'bad' } })).status, 400);
  const left = await call(api.players.PATCH, { method: 'PATCH', token: 'tok-ana', body: { id: 'maya', leaveProgram: true } });
  assert.equal(left.data.player.program, null);
  assert.equal(rows('lms-players').find((r) => r._id === 'maya')._owner, 'm-ana', 'update keeps the owner');
  assert.equal((await call(api.players.PATCH, { method: 'PATCH', token: 'tok-admin', body: { id: 'maya', apelido: 'A' } })).status, 200, 'admin may edit');
});

// ------------------------------------------------------------------ R15.1

test('roster: a missing program never returns other programs or program-less kids', async () => {
  const ids = (r) => r.data.players.map((p) => p.id).sort();
  assert.deepEqual(ids(await call(api.roster.GET, { path: '/api/coach/roster', token: 'tok-coach' })), ['maya', 'noa']);
  assert.deepEqual(ids(await call(api.roster.GET, { path: '/api/coach/roster', token: 'tok-lonely' })), []);
  assert.deepEqual(ids(await call(api.roster.GET, { path: '/api/coach/roster', token: 'tok-admin' })), ['kai', 'maya', 'noa', 'tom']);
  assert.equal((await call(api.roster.GET, { path: '/api/coach/roster?program=prospect', token: 'tok-coach' })).status, 403);
  assert.equal((await call(api.roster.GET, { path: '/api/coach/roster', token: 'tok-ana' })).status, 403);
  const roster = await call(api.roster.GET, { path: '/api/coach/roster', token: 'tok-coach' });
  assert.ok(roster.data.players.every((p) => !('ownerId' in p)), 'guardian member IDs stay on the server');
  // A coach cannot open a program-less child's detail either.
  assert.equal((await call(api.detail.GET, { token: 'tok-coach' }, { params: { id: 'tom' } })).status, 403);
  assert.equal((await call(api.detail.GET, { token: 'tok-admin' }, { params: { id: 'tom' } })).status, 200);
});

// ------------------------------------------------------------------ R15.6, R15.10-11

test('attendance: one child from another program rejects the request; stamps go to lms-attendance only', async () => {
  const bad = await call(api.attendance.POST, { method: 'POST', token: 'tok-coach', body: { program: 'bushwick', playerIds: ['maya', 'kai'] } });
  assert.equal(bad.status, 403);
  assert.deepEqual(bad.data.mismatched, ['kai']);
  assert.equal(rows('lms-attendance').length, 0);
  const ok = await call(api.attendance.POST, { method: 'POST', token: 'tok-coach', body: { program: 'bushwick', playerIds: ['maya', 'noa'], classDate: '2026-09-29' } });
  assert.deepEqual([ok.status, ok.data.stamped], [200, 2]);
  assert.deepEqual(rows('lms-attendance').map((r) => [r.playerId, r._owner]).sort(), [['maya', 'm-ana'], ['noa', 'm-ben']]);
  assert.equal(rows('lms-events').length, 0, 'no duplicate lms-events write');
  const again = await call(api.attendance.POST, { method: 'POST', token: 'tok-coach', body: { program: 'bushwick', playerIds: ['maya'], classDate: '2026-09-29' } });
  assert.equal(again.data.stamped, 0);
  assert.equal((await call(api.attendance.POST, { method: 'POST', token: 'tok-coach', body: { program: 'bushwick', playerIds: ['maya'], classDate: '29/09' } })).status, 400);
});

test('awards write admin-only rows owned by the guardian and show up in the snapshot', async () => {
  for (const body of [
    { playerId: 'maya', kind: 'corda', corda: 'crua-verde' },
    { playerId: 'maya', kind: 'patch', patchKey: 'helper' },
    { playerId: 'maya', kind: 'xp', xp: 40, note: 'great ginga' },
    { playerId: 'maya', kind: 'note', note: 'Lovely' },
  ]) assert.equal((await call(api.award.POST, { method: 'POST', token: 'tok-coach', body })).status, 200, body.kind);
  assert.equal(rows('lms-events').length, 0, 'nothing in member-writable lms-events');
  for (const c of ['lms-corda-awards', 'lms-patch-awards']) assert.deepEqual(rows(c).map((r) => r._owner), ['m-ana'], c);
  assert.deepEqual(rows('lms-coach-events').map((r) => [r.type, r._owner]), [['coach.xp', 'm-ana'], ['coach.note', 'm-ana']]);
  const detail = await call(api.detail.GET, { token: 'tok-coach' }, { params: { id: 'maya' } });
  assert.equal(detail.data.snapshot.cordaCurrent, 'crua-verde');
  assert.equal(detail.data.snapshot.xp, 40);
  assert.ok(detail.data.snapshot.patches.some((p) => p.key === 'helper'));
  assert.deepEqual(detail.data.snapshot.notes.map((n) => n.note), ['Lovely']);
  assert.ok(detail.data.cordaAwards.every((r) => !('_owner' in r)));
  assert.equal((await call(api.award.POST, { method: 'POST', token: 'tok-coach', body: { playerId: 'kai', kind: 'xp', xp: 50 } })).status, 403, 'not your program');
});

test('forged coach-only events in lms-events are ignored on the roster, in readiness and in the CSV', async () => {
  const P = { playerId: 'maya', accountId: 'acct-ana' };
  memberEvent('m-ana', makeEvent({ ...P, type: EVENT.VIDEO_DONE, moduleId: 'movements', lessonId: 'ginga-basics' }));
  memberEvent('m-ana', { ...makeEvent({ ...P, type: EVENT.READING_DONE, moduleId: 'movements', lessonId: 'roda-etiquette' }), xp: 999 });
  memberEvent('m-ana', makeEvent({ ...P, type: EVENT.COACH_XP, payload: { xp: 50 }, source: 'coach' }));
  memberEvent('m-ana', makeEvent({ ...P, type: EVENT.CORDA_AWARDED, payload: { corda: 'azul' }, source: 'coach' }));
  for (let i = 0; i < 8; i += 1) memberEvent('m-ana', makeEvent({ ...P, type: EVENT.ATTENDANCE, payload: { program: 'bushwick' }, source: 'coach' }));
  memberEvent('m-ana', makeEvent({ ...P, type: EVENT.PATCH_EARNED, payload: { patchKey: 'batizado-2026' }, source: 'coach' }));
  // Another family writes into Maya's ledger.
  memberEvent('m-ben', makeEvent({ ...P, type: EVENT.DESAFIO_DONE }));
  // A real stamp.
  await call(api.attendance.POST, { method: 'POST', token: 'tok-coach', body: { program: 'bushwick', playerIds: ['maya'], classDate: '2026-09-29' } });

  const roster = await call(api.roster.GET, { path: '/api/coach/roster?program=bushwick', token: 'tok-coach' });
  const maya = roster.data.players.find((p) => p.id === 'maya').snapshot;
  assert.equal(maya.xp, 35, 'video 20 + reading 15; stored 999, coach xp and the other family\'s desafio ignored');
  assert.equal(maya.cordaCurrent, 'crua');
  assert.equal(maya.attendance, 1, 'only the real stamp');
  assert.ok(!maya.patches.some((p) => p.key === 'batizado-2026'));
  const readinessAttendance = maya.readiness.items.find((i) => /attend|class/i.test(i.key + i.label));
  if (readinessAttendance) assert.notEqual(readinessAttendance.met, true);

  const csv = await call(api.exportCsv.GET, { path: '/api/export?scope=program&program=bushwick&what=events&format=csv', token: 'tok-coach' });
  assert.equal(csv.status, 200);
  const lines = String(csv.data).trim().split('\r\n');
  const mayaTypes = lines.filter((l) => l.includes(',maya,')).map((l) => l.split(',')[3]);
  assert.deepEqual(mayaTypes.sort(), ['attendance.stamped', 'lesson.reading.done', 'lesson.video.done']);
  const players = await call(api.exportCsv.GET, { path: '/api/export?scope=program&program=bushwick&format=json', token: 'tok-coach' });
  assert.equal(players.data.rows.find((r) => r.firstName === 'Maya').xp, 35);
});

// ------------------------------------------------------------------ R15.4

test('class mode: coach reads a non-family child\'s full ledger and writes class events under their account', async () => {
  const P = { playerId: 'maya', accountId: 'acct-ana' };
  const base = Date.parse('2026-06-01T15:00:00Z');
  for (let i = 0; i < 130; i += 1) memberEvent('m-ana', makeEvent({ ...P, type: EVENT.QUIZ_ANSWERED, lessonId: 'music-quiz', payload: { questionId: `q${i}`, correct: true }, occurredAt: new Date(base + i * 60000) }));
  const read = await call(api.classRead.GET, { token: 'tok-coach' }, { params: { id: 'maya' } });
  assert.equal(read.status, 200);
  assert.equal(read.data.events.length, 130, 'no 100-event cap');
  assert.equal('ownerId' in read.data.player, false);
  assert.equal((await call(api.detail.GET, { token: 'tok-coach' }, { params: { id: 'maya' } })).data.events.length, 100, 'the coach detail route still caps');
  assert.equal((await call(api.classRead.GET, { token: 'tok-coach' }, { params: { id: 'noa' } })).status, 403, 'may not play in class');
  assert.equal((await call(api.classRead.GET, { token: 'tok-coach' }, { params: { id: 'kai' } })).status, 403, 'not your program');
  assert.equal((await call(api.classRead.GET, { token: 'tok-ana' }, { params: { id: 'maya' } })).status, 403, 'guardians cannot use class routes');

  const now = new Date();
  const sent = [
    { ...makeEvent({ playerId: 'maya', accountId: 'acct-coach', type: EVENT.VIDEO_DONE, moduleId: 'movements', lessonId: 'au', occurredAt: now, source: 'class' }), xp: 500 },
    makeEvent({ playerId: 'maya', accountId: 'acct-coach', type: EVENT.COACH_XP, payload: { xp: 50 }, occurredAt: now }),
  ];
  const write = await call(api.classWrite.POST, { method: 'POST', token: 'tok-coach', body: { playerId: 'maya', events: sent } });
  assert.deepEqual(write.data.accepted, [sent[0].clientEventId]);
  const stored = rows('lms-events').find((r) => r.clientEventId === sent[0].clientEventId);
  assert.deepEqual([stored.accountId, stored.source, stored._owner, stored.xp], ['acct-ana', 'class', 'm-ana', 20]);
  const replay = await call(api.classWrite.POST, { method: 'POST', token: 'tok-coach', body: { playerId: 'maya', events: sent } });
  assert.deepEqual(replay.data.accepted, [], 'idempotent by clientEventId');
  assert.equal((await call(api.classWrite.POST, { method: 'POST', token: 'tok-coach', body: { playerId: 'kai', events: sent } })).status, 403);
});

// ------------------------------------------------------------------ R15.9, R15.7

test('leaderboard: a guardian only sees their own children\'s programs', async () => {
  assert.equal((await call(api.leaderboard.GET, { path: '/api/leaderboard?program=bushwick', token: 'tok-ana' })).status, 200);
  assert.equal((await call(api.leaderboard.GET, { path: '/api/leaderboard?program=prospect', token: 'tok-ana' })).status, 403);
  assert.equal((await call(api.leaderboard.GET, { path: '/api/leaderboard?program=prospect', token: 'tok-ben' })).status, 200);
  assert.equal((await call(api.leaderboard.GET, { path: '/api/leaderboard?program=prospect', token: 'tok-coach' })).status, 403);
  assert.equal((await call(api.leaderboard.GET, { path: '/api/leaderboard?program=prospect', token: 'tok-admin' })).status, 200);
});

test('cron: header-only call 401, CRON_SECRET bearer 200, EXPORT_SECRET manual run 200', async () => {
  assert.equal((await call(api.recompute.GET, { path: '/api/jobs/recompute', headers: { 'x-vercel-cron': '1' } })).status, 401);
  assert.equal((await call(api.recompute.GET, { path: '/api/jobs/recompute', headers: { authorization: 'Bearer cron-secret' } })).status, 200);
  assert.equal((await call(api.recompute.POST, { method: 'POST', path: '/api/jobs/recompute', headers: { 'x-export-secret': 'export-secret' } })).status, 200);
  const maya = rows('lms-players').find((r) => r._id === 'maya');
  assert.equal(maya._owner, 'm-ana', 'recompute keeps the owner');
});

// ------------------------------------------------------------------ R15.3, R15.8

async function login(token, next = '/journey') {
  const cookies = cookieJar({ pc_pkce: await sign({ verifier: 'v', state: 's', next, redirectUri: 'https://app.test/auth/callback' }) });
  let location = null;
  const redirect = (to, status) => { location = to; return new Response(null, { status, headers: { Location: to } }); };
  await call(api.callback.GET, { path: `/auth/callback?code=${token}&state=s` }, { cookies, redirect });
  return { cookies, location };
}

test('callback: role from the account row sets the cookie lifetime; next must be same-origin', async () => {
  const coach = await login('tok-coach');
  assert.equal(coach.location, '/journey');
  assert.equal(coach.cookies.opts('pc_session').maxAge, 86400);
  const payload = await verify(coach.cookies.value('pc_session'));
  assert.deepEqual([payload.role, payload.memberId], ['coach', 'm-coach']);
  const fam = await login('tok-ana');
  assert.equal(fam.cookies.opts('pc_session').maxAge, 180 * 86400);
  for (const next of ['//example.com', '/\\example.com', '/\t/example.com', '\n//example.com']) {
    assert.equal((await login('tok-ana', next)).location, '/who', JSON.stringify(next));
  }
});

test('refresh re-reads the role; Class mode caps the cookie at 8 h for staff only', async () => {
  const { cookies } = await login('tok-ana');
  // Promote Ana to coach in the CMS: the next refresh shortens her cookie.
  rows('lms-accounts').find((r) => r._id === 'acct-ana').role = 'coach';
  const r = await call(api.session.POST, { method: 'POST' }, { cookies });
  assert.equal(r.data.role, 'coach');
  assert.equal(cookies.opts('pc_session').maxAge, 86400);

  const fam = await login('tok-ben');
  assert.equal((await call(api.classSession.POST, { method: 'POST' }, { cookies: fam.cookies })).status, 403);

  const coach = await login('tok-coach');
  const started = await call(api.classSession.POST, { method: 'POST' }, { cookies: coach.cookies });
  assert.equal(started.status, 200);
  assert.equal(coach.cookies.opts('pc_session').maxAge, 8 * 3600);
  const after = await call(api.session.POST, { method: 'POST' }, { cookies: coach.cookies });
  assert.equal(after.status, 200);
  assert.ok(coach.cookies.opts('pc_session').maxAge <= 8 * 3600, 'refresh stays inside the class cap');
  assert.equal(after.data.classUntil, started.data.classUntil);
  // Once the cap passes, the session ends.
  const expired = await sign({ ...(await verify(coach.cookies.value('pc_session'))), classUntil: Date.now() - 1000 });
  const dead = cookieJar({ pc_session: expired });
  assert.equal((await call(api.session.POST, { method: 'POST' }, { cookies: dead })).status, 401);
  assert.equal(dead.value('pc_session'), undefined);
});

test('session/start: postFlowUrl and the PKCE cookie only ever carry a same-origin path', async () => {
  for (const [next, want] of [['@example.com', '/who'], ['.example.com', '/who'], ['/journey?x=1', '/journey?x=1']]) {
    const cookies = cookieJar();
    const res = await call(api.start.POST, { method: 'POST', body: { sessionToken: 'st', next } }, { cookies });
    assert.equal(res.status, 200);
    const pk = await verify(cookies.value('pc_pkce'));
    assert.equal(pk.next, want, next);
  }
  let sentPostFlow = null;
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('redirect-session')) sentPostFlow = JSON.parse(init.body).callbacks.postFlowUrl;
    return realFetch(url, init);
  };
  try {
    await call(api.start.POST, { method: 'POST', body: { sessionToken: 'st', next: '@example.com' } }, { cookies: cookieJar() });
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(new URL(sentPostFlow).host, 'app.test');
  assert.equal(sentPostFlow, 'https://app.test/who');
});
