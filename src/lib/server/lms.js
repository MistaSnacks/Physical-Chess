// lms.js — cross-family operations under the OAuth client secret.
// Used by /api/coach/*, /api/leaderboard, /api/export, /api/jobs/recompute,
// /api/account and /api/players.
//
// Every snapshot is derived from the trusted ledger (SPEC-v3 R15.10-11):
// member-written lms-events minus coach-only types, plus events converted
// from the admin-write lms-corda-awards, lms-attendance, lms-patch-awards and
// lms-coach-events rows (src/lib/repo/ledger.js). Rows written here set
// `_owner` to the child's guardian so the family can read them.
import { derivePlayer, makeEvent, EVENT } from '../game/index.js';
import { isoWeek, nyDate } from '../game/streaks.js';
import {
  C, queryItems, insertItem, updateItem, bulkInsert, bulkRemove, getItem,
  deleteWixMember, fromEventRow, fromPlayerRow, fromAccountRow, parseDate,
} from './wix-data.js';
import {
  buildLeaderboard, PLAYER_CSV_HEADERS,
  EVENT_CSV_HEADERS, playerExportRow, eventExportRow, snapshotFields, csvEscape,
} from '../coach.js';
import { buildLedger, byPlayer, sanitizeClassEvents } from '../repo/ledger.js';
import { matchInvite } from '../repo/invite.js';
import { rosterFilter } from './policy.js';
import { PROGRAMS, programByKey } from '../../content/programs.js';
import { LESSONS } from '../../content/lessons.js';

function eventDoc(event) {
  return {
    playerId: event.playerId,
    accountId: event.accountId,
    type: event.type,
    moduleId: event.moduleId,
    lessonId: event.lessonId,
    xp: event.xp,
    stars: event.stars,
    payload: JSON.stringify(event.payload || {}),
    occurredAt: event.occurredAt,
    clientEventId: event.clientEventId,
    source: event.source || 'coach',
  };
}

/** `_owner` for a row the server writes on a family's behalf (omitted when unknown). */
const owned = (doc, ownerId) => (ownerId ? { ...doc, _owner: ownerId } : doc);

/** Player row → player plus the guardian's member ID (server-side only). */
function toPlayer(row) {
  return row ? { ...fromPlayerRow(row), ownerId: row._owner || null } : null;
}
/** What leaves the server: never the guardian's member ID. */
export function publicPlayer(p) {
  if (!p) return null;
  const { ownerId, ...rest } = p;
  return rest;
}

async function rawEventsFor(playerId, { cap = 2000 } = {}) {
  const rows = await queryItems(C.events, {
    filter: { playerId: { $eq: playerId } },
    sort: [{ fieldName: 'occurredAt', order: 'ASC' }],
  }, { cap });
  return rows.map(fromEventRow);
}

const MIRRORS = [
  ['corda', C.cordaAwards],
  ['attendance', C.attendance],
  ['patchAwards', C.patchAwards],
  ['coachEvents', C.coachEvents],
];

async function queryByPlayers(collection, ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    try {
      out.push(...await queryItems(collection, { filter: { playerId: { $in: chunk } } }, { cap: 5000 }));
    } catch (err) {
      // lms-coach-events does not exist until WP15's schema is applied.
      console.warn(`ledger mirror ${collection} skipped:`, err.message);
    }
  }
  return out;
}

/** Mirror rows for many players at once: { corda, attendance, ... } each a Map playerId → rows. */
async function mirrorsFor(players) {
  const ids = players.map((p) => p.id);
  const mirrors = {};
  await Promise.all(MIRRORS.map(async ([name, col]) => { mirrors[name] = byPlayer(await queryByPlayers(col, ids)); }));
  return mirrors;
}

/** One player's trusted ledger, given preloaded mirrors (streams one player at a time). */
async function ledgerWith(p, mirrors) {
  return buildLedger({
    events: await rawEventsFor(p.id),
    corda: mirrors.corda.get(p.id) || [],
    attendance: mirrors.attendance.get(p.id) || [],
    patchAwards: mirrors.patchAwards.get(p.id) || [],
    coachEvents: mirrors.coachEvents.get(p.id) || [],
    ownerId: p.ownerId || null,
    accountId: p.accountId || '',
  });
}

/** Trusted ledgers for a set of players: Map playerId → events. */
async function ledgersFor(players) {
  const mirrors = await mirrorsFor(players);
  const out = new Map();
  for (const p of players) out.set(p.id, await ledgerWith(p, mirrors));
  return out;
}

async function ledgerFor(player) {
  return ledgerWith(player, await mirrorsFor([player]));
}

export async function playerRow(id) {
  try {
    return toPlayer(await getItem(C.players, id));
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function playersByIds(ids) {
  const out = [];
  const unique = [...new Set(ids)].filter(Boolean);
  for (let i = 0; i < unique.length; i += 50) {
    const rows = await queryItems(C.players, { filter: { _id: { $in: unique.slice(i, i + 50) } } }, { cap: 100 });
    out.push(...rows.map(toPlayer));
  }
  return out;
}

/** Roster for a rosterScope() result (R15.1). Empty scope → empty roster. */
export async function getRoster(scope, { cap = 200 } = {}) {
  const filter = rosterFilter(scope);
  if (!filter) return [];
  const rows = await queryItems(C.players, { filter }, { cap });
  const players = rows.map(toPlayer).slice(0, cap);
  const ledgers = await ledgersFor(players);
  return players.map((player) => {
    const snapshot = derivePlayer(ledgers.get(player.id) || []);
    return { ...publicPlayer(player), snapshot, lastActiveAt: snapshot.lastActiveAt };
  });
}

export async function getPlayerDetail(id) {
  const player = await playerRow(id);
  if (!player) return null;
  const ledger = await ledgerFor(player);
  const snapshot = derivePlayer(ledger);
  const events = [...ledger].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
  const [cordaAwards, attendance, patchAwards, accounts] = await Promise.all([
    queryItems(C.cordaAwards, { filter: { playerId: { $eq: id } } }),
    queryItems(C.attendance, { filter: { playerId: { $eq: id } } }),
    queryItems(C.patchAwards, { filter: { playerId: { $eq: id } } }),
    queryItems(C.accounts, { filter: { _id: { $eq: player.accountId } } }, { cap: 1 }),
  ]);
  const account = accounts[0] ? fromAccountRow(accounts[0]) : null;
  const noOwner = (rows) => rows.map(({ _owner, ...r }) => r);
  return {
    player: publicPlayer(player),
    snapshot,
    events: events.slice(0, 100),
    cordaAwards: noOwner(cordaAwards),
    attendance: noOwner(attendance),
    patchAwards: noOwner(patchAwards),
    account: account ? { id: account.id, displayName: account.displayName, role: account.role, leaderboardOptIn: account.leaderboardOptIn, programs: account.programs } : null,
  };
}

/**
 * Coach stamps (R15.6, R15.10). `players` were already checked by
 * attendanceCheck(): every one exists and is in `program`. Writes only
 * lms-attendance (no duplicate lms-events row), with `_owner` = guardian.
 */
export async function stampAttendance({ players, program, classDate, stampedBy }) {
  const date = classDate || nyDate();
  const existing = await queryItems(C.attendance, { filter: { program: { $eq: program }, classDate: { $eq: date } } });
  const have = new Set(existing.map((r) => r.playerId));
  const stampedAt = new Date().toISOString();
  const rows = [];
  for (const player of players) {
    if (have.has(player.id)) continue;
    have.add(player.id);
    rows.push(owned({ playerId: player.id, program, classDate: date, stampedBy, stampedAt }, player.ownerId));
  }
  if (rows.length) await bulkInsert(C.attendance, rows);
  return { stamped: rows.length, classDate: date, program };
}

/**
 * Coach awards (R15.10-11). Each kind writes one admin-write row with
 * `_owner` = guardian; nothing goes to the member-writable lms-events.
 */
export async function award({ playerId, kind, patchKey, corda, event: ceremony, xp, note, awardedBy }) {
  const player = await playerRow(playerId);
  if (!player) throw Object.assign(new Error('player not found'), { status: 404 });
  const now = new Date().toISOString();
  if (kind === 'patch') {
    const key = patchKey || 'helper';
    await insertItem(C.patchAwards, owned({ playerId, patchKey: key, earnedAt: now, awardedBy, note: note || '' }, player.ownerId));
  } else if (kind === 'corda') {
    if (!corda) throw Object.assign(new Error('corda required'), { status: 400 });
    await insertItem(C.cordaAwards, owned({ playerId, corda, event: ceremony || 'Batizado 2026', awardedAt: now, awardedBy, note: note || '' }, player.ownerId));
    const current = await getItem(C.players, playerId);
    await updateItem(C.players, playerId, { ...current, cordaCurrent: corda });
  } else if (kind === 'xp' || kind === 'note') {
    const type = kind === 'xp' ? EVENT.COACH_XP : EVENT.COACH_NOTE;
    const payload = kind === 'xp' ? { xp: Number(xp) || 10, note: note || '' } : { note: note || '', by: awardedBy };
    const e = makeEvent({ playerId, accountId: player.accountId, type, payload, source: 'coach' });
    await insertItem(C.coachEvents, owned(eventDoc(e), player.ownerId));
  } else {
    throw Object.assign(new Error('unknown award kind'), { status: 400 });
  }
  return getPlayerDetail(playerId);
}

export async function setGoal({ program, goalXp, goalLabel }) {
  const rows = await queryItems(C.programs, { filter: { key: { $eq: program } } }, { consistentRead: true, cap: 5 });
  const patch = { goalXp: Math.max(1, Number(goalXp) || 2500), goalLabel: goalLabel || 'Fill the berimbau by Batizado' };
  if (rows[0]) {
    await updateItem(C.programs, rows[0]._id || rows[0].id, { ...rows[0], ...patch });
  } else {
    const catalog = PROGRAMS.find((p) => p.key === program);
    // No inviteCode here: real codes are set by hand in the admin-read
    // lms-programs rows (R15.12), never copied from the client bundle.
    await insertItem(C.programs, { key: program, name: catalog?.name || program, dayOfWeek: catalog?.dayOfWeek || '', coachIds: [], active: true, ...patch });
  }
  return { program, ...patch };
}

export async function getGoals() {
  const rows = await queryItems(C.programs, {});
  const goals = {};
  for (const p of PROGRAMS) goals[p.key] = { goalXp: 2500, goalLabel: 'Fill the berimbau by Batizado' };
  for (const r of rows) {
    if (r.key) goals[r.key] = { goalXp: r.goalXp || 2500, goalLabel: r.goalLabel || 'Fill the berimbau by Batizado' };
  }
  return goals;
}

export async function computeLeaderboard(program, period) {
  const week = period || isoWeek(new Date());
  const cached = await queryItems(C.leaderboard, { filter: { program: { $eq: program }, period: { $eq: week } } }, { cap: 5 });
  const goals = await getGoals();
  const goal = goals[program] || { goalXp: 2500, goalLabel: 'Fill the berimbau by Batizado' };
  if (cached[0] && cached[0].entries) {
    let entries = cached[0].entries;
    if (typeof entries === 'string') { try { entries = JSON.parse(entries); } catch { entries = []; } }
    const hasCurrentShape = Array.isArray(entries)
      && entries.every((entry) => Object.prototype.hasOwnProperty.call(entry, 'weekStreak'));
    if (hasCurrentShape) {
      return {
        program, period: week, entries, communityXp: cached[0].communityXp || 0,
        target: goal.goalXp, goalLabel: goal.goalLabel, computedAt: parseDate(cached[0].computedAt) || cached[0].computedAt,
      };
    }
  }
  const built = await recomputeLeaderboard(program, week);
  return { ...built, target: goal.goalXp, goalLabel: goal.goalLabel };
}

async function recomputeLeaderboard(program, week) {
  const players = (await queryItems(C.players, { filter: { program: { $eq: program }, active: { $ne: false } } })).map(toPlayer);
  const accounts = (await queryItems(C.accounts, {})).map(fromAccountRow);
  const accountsById = new Map(accounts.map((a) => [a.id, a]));
  const eventsByPlayer = await ledgersFor(players);
  const built = buildLeaderboard({ players, eventsByPlayer, accountsById, program, period: week });
  const publicEntries = built.entries.map(({ apelido, avatar, xp, weekStreak }) => ({ apelido, avatar, xp, weekStreak }));
  const existing = await queryItems(C.leaderboard, { filter: { program: { $eq: program }, period: { $eq: week } } }, { cap: 5 });
  const doc = {
    program, period: week, entries: JSON.stringify(publicEntries),
    communityXp: built.communityXp, computedAt: new Date().toISOString(),
  };
  if (existing[0]) await updateItem(C.leaderboard, existing[0]._id || existing[0].id, { ...existing[0], ...doc });
  else await insertItem(C.leaderboard, doc);
  return { ...built, entries: publicEntries };
}

export async function recomputeAll() {
  const players = (await queryItems(C.players, { filter: { active: { $ne: false } } }, { cap: 2000 })).map(toPlayer);
  let updated = 0;
  const mirrors = await mirrorsFor(players);
  for (const player of players) {
    const events = await ledgerWith(player, mirrors);
    const snapshot = derivePlayer(events);
    const current = await getItem(C.players, player.id);
    await updateItem(C.players, player.id, { ...current, ...snapshotFields(snapshot) });
    const existingState = await queryItems(C.lessonState, { filter: { playerId: { $eq: player.id } } });
    const byLesson = new Map(existingState.map((r) => [r.lessonId, r]));
    for (const lesson of LESSONS) {
      const s = snapshot.lessons[lesson.id];
      if (!s) continue;
      const doc = {
        playerId: player.id, lessonId: lesson.id, status: s.status, bestStars: s.bestStars,
        bestScore: s.bestScore, attempts: s.attempts, firstDoneAt: s.firstDoneAt, lastAt: s.lastAt,
      };
      const prev = byLesson.get(lesson.id);
      if (prev) await updateItem(C.lessonState, prev._id || prev.id, { ...prev, ...doc });
      else if (s.status === 'done' || s.attempts > 0) await insertItem(C.lessonState, owned(doc, player.ownerId));
    }
    updated += 1;
  }
  const week = isoWeek(new Date());
  const programs = new Set(players.map((p) => p.program).filter(Boolean));
  for (const program of programs) await recomputeLeaderboard(program, week);
  return { players: updated, programs: [...programs], period: week, computedAt: new Date().toISOString() };
}

export async function exportPayload({ scope, what, program, format, account }) {
  const filter = { active: { $ne: false } };
  if (scope !== 'all') filter.program = { $eq: program };
  if (account.role !== 'admin' && scope === 'all') {
    filter.program = { $in: account.programs || [] };
  }
  const players = (await queryItems(C.players, { filter }, { cap: 2000 })).map(toPlayer);
  const accounts = (await queryItems(C.accounts, {})).map(fromAccountRow);
  const accountsById = new Map(accounts.map((a) => [a.id, a]));
  const mirrors = await mirrorsFor(players);
  const encoder = new TextEncoder();
  const headers = what === 'events' ? EVENT_CSV_HEADERS : PLAYER_CSV_HEADERS;

  if (format === 'json') {
    const rows = [];
    for (const p of players) {
      const events = await ledgerWith(p, mirrors);
      if (what === 'events') {
        for (const e of events) rows.push(eventExportRow(e, p));
      } else {
        rows.push(playerExportRow(p, derivePlayer(events), accountsById.get(p.accountId)));
      }
    }
    return JSON.stringify({ what, rows });
  }

  return new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`\uFEFF${headers.map((h) => csvEscape(h.label)).join(',')}\r\n`));
      for (const p of players) {
        const events = await ledgerWith(p, mirrors);
        if (what === 'events') {
          for (const e of events) {
            const row = eventExportRow(e, p);
            controller.enqueue(encoder.encode(headers.map((h) => csvEscape(row[h.key])).join(',') + '\r\n'));
          }
        } else {
          const row = playerExportRow(p, derivePlayer(events), accountsById.get(p.accountId));
          controller.enqueue(encoder.encode(headers.map((h) => csvEscape(row[h.key])).join(',') + '\r\n'));
        }
      }
      controller.close();
    },
  });
}

export async function listAccounts() {
  return (await queryItems(C.accounts, {}, { cap: 500 })).map(fromAccountRow);
}

export async function setRole({ memberId, role, programs }) {
  const rows = await queryItems(C.accounts, { filter: { memberId: { $eq: memberId } } }, { consistentRead: true, cap: 5 });
  if (!rows[0]) throw Object.assign(new Error('account not found'), { status: 404 });
  const allowed = ['guardian', 'coach', 'admin'];
  if (!allowed.includes(role)) throw Object.assign(new Error('invalid role'), { status: 400 });
  const updated = await updateItem(C.accounts, rows[0]._id || rows[0].id, { ...rows[0], role, programs: programs || [] });
  return fromAccountRow(updated);
}

const PLAYER_COLLECTIONS = [
  { id: C.events, field: 'playerId' },
  { id: C.coachEvents, field: 'playerId', optional: true },
  { id: C.lessonState, field: 'playerId' },
  { id: C.patchAwards, field: 'playerId' },
  { id: C.cordaAwards, field: 'playerId' },
  { id: C.attendance, field: 'playerId' },
  { id: C.players, field: '_id' },
];

export async function erasePlayer(playerId, { tombstoneAccountId } = {}) {
  for (const col of PLAYER_COLLECTIONS) {
    const filter = col.field === '_id' ? { _id: { $eq: playerId } } : { [col.field]: { $eq: playerId } };
    let rows;
    try {
      rows = await queryItems(col.id, { filter }, { cap: 2000 });
    } catch (err) {
      if (col.optional) { console.warn(`erase: ${col.id} skipped:`, err.message); continue; }
      throw err;
    }
    await bulkRemove(col.id, rows.map((r) => r._id || r.id));
  }
  await insertItem(C.events, eventDoc(makeEvent({
    playerId, accountId: tombstoneAccountId || '', type: EVENT.PLAYER_DELETED,
    payload: {}, source: 'system',
  })));
}

export async function eraseAccount(account) {
  const players = await queryItems(C.players, { filter: { accountId: { $eq: account.id } } }, { cap: 200 });
  for (const p of players) await erasePlayer(p._id || p.id, { tombstoneAccountId: account.id });
  const accounts = await queryItems(C.accounts, { filter: { _id: { $eq: account.id } } }, { cap: 5 });
  await bulkRemove(C.accounts, accounts.map((r) => r._id || r.id));
  if (account.memberId) await deleteWixMember(account.memberId);
}

// ------------------------------------------------- R15.2, R15.12, R15.9, R15.4

/** Real invite codes live only in the admin-read lms-programs rows. */
export async function resolveInvite(code) {
  if (!String(code || '').trim()) return null;
  const rows = await queryItems(C.programs, {}, { cap: 200 });
  const key = matchInvite(code, rows.map((r) => ({ key: r.key, inviteCode: r.inviteCode, active: r.active })));
  if (!key) return null;
  const row = rows.find((r) => r.key === key);
  return { key, name: programByKey(key)?.name || row?.name || key };
}

/**
 * POST /api/account: the account row for a verified Wix member. Idempotent;
 * always role guardian, no programs, `_owner` = the member.
 */
export async function ensureAccount(member) {
  const memberId = member._id || member.id;
  const rows = await queryItems(C.accounts, { filter: { memberId: { $eq: memberId } } }, { consistentRead: true, cap: 5 });
  if (rows[0]) return { account: fromAccountRow(rows[0]), created: false };
  const displayName = [member.contact?.firstName, member.contact?.lastName].filter(Boolean).join(' ') || member.profile?.nickname || '';
  const row = await insertItem(C.accounts, {
    memberId,
    role: 'guardian',
    displayName,
    email: member.loginEmail || '',
    phone: '',
    programs: [],
    leaderboardOptIn: false,
    consentAt: new Date().toISOString(),
    _owner: memberId,
  });
  return { account: fromAccountRow(row), created: true };
}

/** PATCH /api/account: `patch` already passed pickAccountPatch(). */
export async function updateAccountSettings(account, patch) {
  const current = await getItem(C.accounts, account.id);
  const row = await updateItem(C.accounts, account.id, {
    ...current,
    ...patch,
    role: current.role,
    programs: current.programs || [],
    memberId: current.memberId,
  });
  return fromAccountRow(row);
}

/** Programs the account's own children are in (R15.9). */
export async function childPrograms(accountId) {
  const rows = await queryItems(C.players, { filter: { accountId: { $eq: accountId }, active: { $ne: false } } }, { cap: 50 });
  return [...new Set(rows.map((r) => r.program).filter(Boolean))];
}

/** POST /api/players: `fields` passed pickPlayerInput(); `program` came from resolveInvite(). */
export async function createPlayerFor({ account, memberId, fields, program }) {
  const row = await insertItem(C.players, {
    firstName: fields.firstName,
    apelido: fields.apelido || '',
    avatar: fields.avatar || { animal: 'frog', color: 'lime' },
    birthYear: fields.birthYear ?? null,
    program: program || null,
    mayPlayInClass: fields.mayPlayInClass !== false,
    accountId: account.id,
    active: true,
    startedAt: new Date().toISOString().slice(0, 10),
    _owner: memberId,
  });
  return publicPlayer(toPlayer(row));
}

/** PATCH /api/players: caller already shown to own the player (or be admin). */
export async function updatePlayerFor(id, { fields, program }) {
  const current = await getItem(C.players, id);
  const next = { ...current, ...fields };
  if (program !== undefined) next.program = program;
  const row = await updateItem(C.players, id, next);
  return publicPlayer(toPlayer(row));
}

/** Class mode read (R15.4): the full trusted ledger, not the 100-event detail. */
export async function classLedger(player) {
  return ledgerFor(player);
}

/** Class mode write (R15.4): append under the child's account, source class. */
export async function appendClassEvents(player, events) {
  const prior = await ledgerFor(player);
  const accepted = sanitizeClassEvents(events, {
    playerId: player.id,
    accountId: player.accountId || '',
    existingIds: new Set(prior.map((e) => e.clientEventId)),
    prior,
  });
  if (accepted.length) await bulkInsert(C.events, accepted.map((e) => owned(eventDoc(e), player.ownerId)));
  return accepted.map((e) => e.clientEventId);
}
