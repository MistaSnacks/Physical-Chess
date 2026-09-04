// lms.js — cross-family operations under the OAuth client secret.
// Used by /api/coach/*, /api/leaderboard, /api/export, /api/jobs/recompute.
import { derivePlayer, makeEvent, EVENT } from '../game/index.js';
import { isoWeek, nyDate } from '../game/streaks.js';
import {
  C, queryItems, insertItem, updateItem, bulkInsert, bulkRemove, getItem,
  deleteWixMember, fromEventRow, fromPlayerRow, fromAccountRow, parseDate,
} from './wix-data.js';
import {
  buildLeaderboard, overviewFromRoster, PLAYER_CSV_HEADERS,
  EVENT_CSV_HEADERS, playerExportRow, eventExportRow, snapshotFields, csvEscape,
} from '../coach.js';
import { PROGRAMS } from '../../content/programs.js';
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

async function eventsForPlayer(playerId, { cap = 2000 } = {}) {
  const rows = await queryItems(C.events, {
    filter: { playerId: { $eq: playerId } },
    sort: [{ fieldName: 'occurredAt', order: 'ASC' }],
  }, { cap });
  return rows.map(fromEventRow);
}

async function playerRow(id) {
  const row = await getItem(C.players, id);
  return row ? fromPlayerRow(row) : null;
}

export async function getRoster(program, { cap = 200 } = {}) {
  const filter = program ? { program: { $eq: program }, active: { $ne: false } } : { active: { $ne: false } };
  const rows = await queryItems(C.players, { filter }, { cap });
  const players = rows.map(fromPlayerRow).slice(0, cap);
  const out = [];
  for (const player of players) {
    const events = await eventsForPlayer(player.id);
    const snapshot = derivePlayer(events);
    out.push({ ...player, snapshot, lastActiveAt: snapshot.lastActiveAt });
  }
  return out;
}

export async function getOverview(program) {
  return overviewFromRoster(await getRoster(program));
}

export async function getPlayerDetail(id) {
  const player = await playerRow(id);
  if (!player) return null;
  const events = (await eventsForPlayer(id)).sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
  const snapshot = derivePlayer(events);
  const [cordaAwards, attendance, patchAwards, accounts] = await Promise.all([
    queryItems(C.cordaAwards, { filter: { playerId: { $eq: id } } }),
    queryItems(C.attendance, { filter: { playerId: { $eq: id } } }),
    queryItems(C.patchAwards, { filter: { playerId: { $eq: id } } }),
    queryItems(C.accounts, { filter: { _id: { $eq: player.accountId } } }, { cap: 1 }),
  ]);
  const account = accounts[0] ? fromAccountRow(accounts[0]) : null;
  return {
    player,
    snapshot,
    events: events.slice(0, 100),
    cordaAwards,
    attendance,
    patchAwards,
    account: account ? { id: account.id, displayName: account.displayName, role: account.role, leaderboardOptIn: account.leaderboardOptIn, programs: account.programs } : null,
  };
}

export async function stampAttendance({ playerIds, program, classDate, stampedBy }) {
  const date = classDate || nyDate();
  const existing = await queryItems(C.attendance, { filter: { program: { $eq: program }, classDate: { $eq: date } } });
  const have = new Set(existing.map((r) => r.playerId));
  const events = [];
  const rows = [];
  for (const playerId of playerIds) {
    if (have.has(playerId)) continue;
    rows.push({ playerId, program, classDate: date, stampedBy });
    const player = await playerRow(playerId);
    events.push(eventDoc(makeEvent({
      playerId, accountId: player?.accountId || '', type: EVENT.ATTENDANCE,
      payload: { program, classDate: date }, source: 'coach',
    })));
  }
  if (rows.length) await bulkInsert(C.attendance, rows);
  if (events.length) await bulkInsert(C.events, events);
  return { stamped: rows.length, classDate: date, program };
}

export async function award({ playerId, kind, patchKey, corda, event: ceremony, xp, note, awardedBy }) {
  const player = await playerRow(playerId);
  if (!player) throw Object.assign(new Error('player not found'), { status: 404 });
  const base = { playerId, accountId: player.accountId, source: 'coach' };
  if (kind === 'patch') {
    const key = patchKey || 'helper';
    await insertItem(C.patchAwards, { playerId, patchKey: key, earnedAt: new Date().toISOString(), awardedBy });
    await insertItem(C.events, eventDoc(makeEvent({ ...base, type: EVENT.PATCH_EARNED, payload: { patchKey: key, note: note || '' } })));
  } else if (kind === 'corda') {
    if (!corda) throw Object.assign(new Error('corda required'), { status: 400 });
    await insertItem(C.cordaAwards, { playerId, corda, event: ceremony || 'Batizado 2026', awardedAt: new Date().toISOString(), awardedBy, note: note || '' });
    await insertItem(C.events, eventDoc(makeEvent({ ...base, type: EVENT.CORDA_AWARDED, payload: { corda, event: ceremony || 'Batizado 2026', note: note || '' } })));
    const current = await getItem(C.players, playerId);
    await updateItem(C.players, playerId, { ...current, cordaCurrent: corda });
  } else if (kind === 'xp') {
    await insertItem(C.events, eventDoc(makeEvent({ ...base, type: EVENT.COACH_XP, payload: { xp: Number(xp) || 10, note: note || '' } })));
  } else if (kind === 'note') {
    await insertItem(C.events, eventDoc(makeEvent({ ...base, type: EVENT.COACH_NOTE, payload: { note: note || '', by: awardedBy } })));
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
    await insertItem(C.programs, { key: program, name: catalog?.name || program, dayOfWeek: catalog?.dayOfWeek || '', inviteCode: catalog?.inviteCode || '', coachIds: [], active: true, ...patch });
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
  const players = (await queryItems(C.players, { filter: { program: { $eq: program }, active: { $ne: false } } })).map(fromPlayerRow);
  const accounts = (await queryItems(C.accounts, {})).map(fromAccountRow);
  const accountsById = new Map(accounts.map((a) => [a.id, a]));
  const eventsByPlayer = new Map();
  for (const p of players) eventsByPlayer.set(p.id, await eventsForPlayer(p.id));
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
  const players = (await queryItems(C.players, { filter: { active: { $ne: false } } }, { cap: 2000 })).map(fromPlayerRow);
  let updated = 0;
  for (const player of players) {
    const events = await eventsForPlayer(player.id);
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
      else if (s.status === 'done' || s.attempts > 0) await insertItem(C.lessonState, doc);
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
  const players = (await queryItems(C.players, { filter }, { cap: 2000 })).map(fromPlayerRow);
  const accounts = (await queryItems(C.accounts, {})).map(fromAccountRow);
  const accountsById = new Map(accounts.map((a) => [a.id, a]));
  const encoder = new TextEncoder();
  const headers = what === 'events' ? EVENT_CSV_HEADERS : PLAYER_CSV_HEADERS;

  if (format === 'json') {
    const rows = [];
    for (const p of players) {
      const events = await eventsForPlayer(p.id);
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
        const events = await eventsForPlayer(p.id);
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
  { id: C.lessonState, field: 'playerId' },
  { id: C.patchAwards, field: 'playerId' },
  { id: C.cordaAwards, field: 'playerId' },
  { id: C.attendance, field: 'playerId' },
  { id: C.players, field: '_id' },
];

export async function erasePlayer(playerId, { tombstoneAccountId } = {}) {
  for (const col of PLAYER_COLLECTIONS) {
    const filter = col.field === '_id' ? { _id: { $eq: playerId } } : { [col.field]: { $eq: playerId } };
    const rows = await queryItems(col.id, { filter }, { cap: 2000 });
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
