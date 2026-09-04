// coachDemo.js — complete demo implementation of the coach/cross-family
// surface. Seeded into the same localStorage db as localRepo so class-mode
// play and family play share a ledger. Awards, attendance, goals and extra
// family accounts live alongside.
import { DEMO_ACCOUNT, DEMO_PLAYERS, demoEvents } from './demoSeed.js';
import { readLocalDb, writeLocalDb, localRepo } from './localRepo.js';
import { makeEvent, EVENT, derivePlayer } from '../game/index.js';
import { PROGRAMS } from '../../content/programs.js';
import {
  overviewFromRoster, buildLeaderboard, toCsv, PLAYER_CSV_HEADERS, EVENT_CSV_HEADERS,
  playerExportRow, eventExportRow,
} from '../coach.js';
import { isoWeek } from '../game/streaks.js';

const KEY = 'pc.coach.demo.v1';

const DEFAULT_GOAL = { goalXp: 2500, goalLabel: 'Fill the berimbau by Batizado' };

export const COACH_DEMO_ACCOUNTS = [
  { ...DEMO_ACCOUNT },
  { id: 'acct-jordan', memberId: 'm-jordan', role: 'guardian', displayName: 'Jordan', email: 'jordan@demo.invalid', programs: [], leaderboardOptIn: true, demo: true },
  { id: 'acct-sam', memberId: 'm-sam', role: 'guardian', displayName: 'Sam', email: 'sam@demo.invalid', programs: [], leaderboardOptIn: true, demo: true },
  { id: 'acct-rio', memberId: 'm-rio', role: 'guardian', displayName: 'Rio', email: 'rio@demo.invalid', programs: [], leaderboardOptIn: true, demo: true },
  { id: 'acct-aisha', memberId: 'm-aisha', role: 'guardian', displayName: 'Aisha', email: 'aisha@demo.invalid', programs: [], leaderboardOptIn: true, demo: true },
  { id: 'acct-mei', memberId: 'm-mei', role: 'guardian', displayName: 'Mei', email: 'mei@demo.invalid', programs: [], leaderboardOptIn: false, demo: true },
  { id: 'acct-luis', memberId: 'm-luis', role: 'guardian', displayName: 'Luis', email: 'luis@demo.invalid', programs: [], leaderboardOptIn: true, demo: true },
];

export const COACH_DEMO_PLAYERS = [
  ...DEMO_PLAYERS,
  { id: 'player-nova', accountId: 'acct-jordan', firstName: 'Nova', apelido: 'Sereia', avatar: { animal: 'snake', color: 'lime' }, birthYear: 2016, program: 'bushwick', startedAt: '2026-05-12', active: true, mayPlayInClass: true },
  { id: 'player-tico', accountId: 'acct-sam', firstName: 'Tico', apelido: 'Macaco', avatar: { animal: 'gorilla', color: 'hibiscus' }, birthYear: 2015, program: 'bushwick', startedAt: '2026-04-08', active: true, mayPlayInClass: true },
  { id: 'player-kai', accountId: 'acct-rio', firstName: 'Kai', apelido: 'Girafa', avatar: { animal: 'giraffe', color: 'mango' }, birthYear: 2017, program: 'berkeley-carroll', startedAt: '2026-06-18', active: true, mayPlayInClass: true },
  { id: 'player-luna', accountId: 'acct-aisha', firstName: 'Luna', apelido: 'Capivara', avatar: { animal: 'armadillo', color: 'sky' }, birthYear: 2016, program: 'berkeley-carroll', startedAt: '2026-03-04', active: true, mayPlayInClass: true },
  { id: 'player-sol', accountId: 'acct-mei', firstName: 'Sol', apelido: 'Beija-flor', avatar: { animal: 'frog', color: 'lilac' }, birthYear: 2018, program: 'berkeley-carroll', startedAt: '2026-07-22', active: true, mayPlayInClass: false },
  { id: 'player-nino', accountId: 'acct-luis', firstName: 'Nino', apelido: 'Tamanduá', avatar: { animal: 'lizard', color: 'cream' }, birthYear: 2018, program: 'prospect', startedAt: '2026-08-20', active: true, mayPlayInClass: true },
];

const daysAgo = (n, h = 16) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, 20, 0, 0); return d; };
const ev = (id, rest) => makeEvent({ clientEventId: `coach-demo-${id}`, ...rest });

function extraEvents() {
  const out = [];
  // Nova — active this week, movements underway
  const N = { playerId: 'player-nova', accountId: 'acct-jordan' };
  out.push(
    ev('nova-c', { ...N, type: EVENT.PLAYER_CREATED, occurredAt: daysAgo(40) }),
    ev('nova-g', { ...N, type: EVENT.VIDEO_DONE, moduleId: 'movements', lessonId: 'ginga-basics', occurredAt: daysAgo(14) }),
    ev('nova-s1', { ...N, type: EVENT.STREAK_WEEK, payload: { week: 1 }, occurredAt: daysAgo(14) }),
    ev('nova-m', { ...N, type: EVENT.VIDEO_DONE, moduleId: 'movements', lessonId: 'meia-lua-de-frente', occurredAt: daysAgo(7) }),
    ev('nova-s2', { ...N, type: EVENT.STREAK_WEEK, payload: { week: 2 }, occurredAt: daysAgo(7) }),
    ev('nova-e', { ...N, type: EVENT.DRILL_DONE, moduleId: 'movements', lessonId: 'esquiva-cocorinha', payload: { selfRating: 3 }, occurredAt: daysAgo(1) }),
    ev('nova-s3', { ...N, type: EVENT.STREAK_WEEK, payload: { week: 3 }, occurredAt: daysAgo(1) }),
    ev('nova-a1', { ...N, type: EVENT.ATTENDANCE, payload: { program: 'bushwick' }, source: 'coach', occurredAt: daysAgo(8) }),
  );
  // Tico — inactive ~4 weeks
  const T = { playerId: 'player-tico', accountId: 'acct-sam' };
  out.push(
    ev('tico-c', { ...T, type: EVENT.PLAYER_CREATED, occurredAt: daysAgo(50) }),
    ev('tico-g', { ...T, type: EVENT.VIDEO_DONE, moduleId: 'movements', lessonId: 'ginga-basics', occurredAt: daysAgo(28) }),
    ev('tico-s', { ...T, type: EVENT.STREAK_WEEK, payload: { week: 1 }, occurredAt: daysAgo(28) }),
  );
  // Kai — music, two-week streak
  const K = { playerId: 'player-kai', accountId: 'acct-rio' };
  out.push(
    ev('kai-c', { ...K, type: EVENT.PLAYER_CREATED, occurredAt: daysAgo(22) }),
    ev('kai-b', { ...K, type: EVENT.READING_DONE, moduleId: 'music', lessonId: 'meet-the-berimbau', payload: { checkFirstTry: true }, occurredAt: daysAgo(9) }),
    ev('kai-s1', { ...K, type: EVENT.STREAK_WEEK, payload: { week: 1 }, occurredAt: daysAgo(9) }),
    ev('kai-p', { ...K, type: EVENT.VIDEO_DONE, moduleId: 'music', lessonId: 'pandeiro-atabaque', occurredAt: daysAgo(2) }),
    ev('kai-s2', { ...K, type: EVENT.STREAK_WEEK, payload: { week: 2 }, occurredAt: daysAgo(2) }),
    ev('kai-a', { ...K, type: EVENT.ATTENDANCE, payload: { program: 'berkeley-carroll' }, source: 'coach', occurredAt: daysAgo(2) }),
  );
  // Luna — high readiness
  const L = { playerId: 'player-luna', accountId: 'acct-aisha' };
  out.push(ev('luna-c', { ...L, type: EVENT.PLAYER_CREATED, occurredAt: daysAgo(60) }));
  const drills = ['esquiva-cocorinha', 'sing-the-roda'];
  for (let i = 0; i < 8; i++) {
    out.push(ev(`luna-d${i}`, { ...L, type: EVENT.DRILL_DONE, moduleId: i < 6 ? 'movements' : 'music', lessonId: drills[i % 2], payload: { selfRating: 3 }, occurredAt: daysAgo(40 - i * 3) }));
  }
  for (let i = 0; i < 4; i++) {
    out.push(ev(`luna-pc${i}`, { ...L, type: EVENT.PRACTICE_CONFIRMED, moduleId: 'movements', lessonId: 'esquiva-cocorinha', payload: { by: 'guardian' }, occurredAt: daysAgo(38 - i * 3), source: 'app' }));
  }
  out.push(
    ev('luna-g', { ...L, type: EVENT.VIDEO_DONE, moduleId: 'movements', lessonId: 'ginga-basics', occurredAt: daysAgo(45) }),
    ev('luna-ml', { ...L, type: EVENT.VIDEO_DONE, moduleId: 'movements', lessonId: 'meia-lua-de-frente', occurredAt: daysAgo(42) }),
    ev('luna-au', { ...L, type: EVENT.VIDEO_DONE, moduleId: 'movements', lessonId: 'au', occurredAt: daysAgo(36) }),
    ev('luna-jg', { ...L, type: EVENT.VIDEO_DONE, moduleId: 'movements', lessonId: 'jogos-first-game', occurredAt: daysAgo(30) }),
    ev('luna-pt', { ...L, type: EVENT.READING_DONE, moduleId: 'culture', lessonId: 'portuguese-for-the-roda', payload: { checkFirstTry: true }, occurredAt: daysAgo(12) }),
    ev('luna-bat', { ...L, type: EVENT.READING_DONE, moduleId: 'graduation', lessonId: 'what-is-batizado', payload: { checkFirstTry: true }, occurredAt: daysAgo(10) }),
    ev('luna-q1', { ...L, type: EVENT.QUIZ_ANSWERED, moduleId: 'music', lessonId: 'music-quiz', payload: { questionId: 'q1', correct: true }, occurredAt: daysAgo(5) }),
    ev('luna-q2', { ...L, type: EVENT.QUIZ_ANSWERED, moduleId: 'music', lessonId: 'music-quiz', payload: { questionId: 'q2', correct: true }, occurredAt: daysAgo(5) }),
    ev('luna-q3', { ...L, type: EVENT.QUIZ_ANSWERED, moduleId: 'music', lessonId: 'music-quiz', payload: { questionId: 'q3', correct: false }, occurredAt: daysAgo(5) }),
    ev('luna-qd', { ...L, type: EVENT.QUIZ_DONE, moduleId: 'music', lessonId: 'music-quiz', payload: { score: 2, total: 3 }, occurredAt: daysAgo(5) }),
    ev('luna-br', { ...L, type: EVENT.READING_DONE, moduleId: 'music', lessonId: 'meet-the-berimbau', payload: { checkFirstTry: true }, occurredAt: daysAgo(20) }),
    ev('luna-pa', { ...L, type: EVENT.VIDEO_DONE, moduleId: 'music', lessonId: 'pandeiro-atabaque', occurredAt: daysAgo(18) }),
  );
  for (let i = 0; i < 6; i++) {
    out.push(ev(`luna-a${i}`, { ...L, type: EVENT.ATTENDANCE, payload: { program: 'berkeley-carroll' }, source: 'coach', occurredAt: daysAgo(35 - i * 5) }));
  }
  out.push(ev('luna-now', { ...L, type: EVENT.DESAFIO_DONE, payload: { kind: 'flashcard' }, occurredAt: daysAgo(0) }));
  // Sol — opted out of leaderboard, music only
  const S = { playerId: 'player-sol', accountId: 'acct-mei' };
  out.push(
    ev('sol-c', { ...S, type: EVENT.PLAYER_CREATED, occurredAt: daysAgo(18) }),
    ev('sol-b', { ...S, type: EVENT.READING_DONE, moduleId: 'music', lessonId: 'meet-the-berimbau', payload: { checkFirstTry: false }, occurredAt: daysAgo(3) }),
    ev('sol-s', { ...S, type: EVENT.STREAK_WEEK, payload: { week: 1 }, occurredAt: daysAgo(3) }),
  );
  // Nino — new at Prospect
  const P = { playerId: 'player-nino', accountId: 'acct-luis' };
  out.push(
    ev('nino-c', { ...P, type: EVENT.PLAYER_CREATED, occurredAt: daysAgo(12) }),
    ev('nino-g', { ...P, type: EVENT.VIDEO_DONE, moduleId: 'movements', lessonId: 'ginga-basics', occurredAt: daysAgo(1) }),
    ev('nino-s', { ...P, type: EVENT.STREAK_WEEK, payload: { week: 1 }, occurredAt: daysAgo(1) }),
  );
  return out;
}

function loadMeta() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
}
function saveMeta(m) { localStorage.setItem(KEY, JSON.stringify(m)); return m; }

function seedMeta() {
  const attendance = extraEvents().filter((e) => e.type === EVENT.ATTENDANCE).map((e, i) => ({
    id: `att-${i}`,
    playerId: e.playerId,
    program: e.payload.program,
    classDate: e.occurredAt.slice(0, 10),
    stampedBy: 'acct-demo',
  }));
  return saveMeta({
    attendance,
    patchAwards: [],
    cordaAwards: [],
    accounts: COACH_DEMO_ACCOUNTS.map((a) => ({ ...a })),
    programGoals: Object.fromEntries(PROGRAMS.map((p) => [p.key, { ...DEFAULT_GOAL }])),
  });
}
function meta() { return loadMeta() || seedMeta(); }

function uid(prefix) { return `${prefix}-${Math.random().toString(36).slice(2, 10)}`; }

export const coachDemo = {
  name: 'coach-demo',
  isDemo: true,

  async ensure() {
    const d = readLocalDb();
    if (!d.coachSeeded) {
      const haveP = new Set(d.players.map((p) => p.id));
      for (const p of COACH_DEMO_PLAYERS) if (!haveP.has(p.id)) d.players.push({ ...p });
      const seen = new Set(d.events.map((e) => e.clientEventId));
      for (const e of extraEvents()) if (!seen.has(e.clientEventId)) d.events.push(e);
      d.coachSeeded = true;
      writeLocalDb(d);
    }
    if (!loadMeta()) seedMeta();
    return this;
  },

  async roster(program) {
    await this.ensure();
    const d = readLocalDb();
    const players = d.players.filter((p) => p.active !== false && (!program || p.program === program)).slice(0, 200);
    return players.map((player) => {
      const events = d.events.filter((e) => e.playerId === player.id);
      const snapshot = derivePlayer(events);
      return { ...player, snapshot, lastActiveAt: snapshot.lastActiveAt };
    });
  },

  async overview(program) {
    const rows = await this.roster(program);
    return overviewFromRoster(rows);
  },

  async player(id) {
    await this.ensure();
    const d = readLocalDb();
    const m = meta();
    const player = d.players.find((p) => p.id === id);
    if (!player) return null;
    const events = d.events.filter((e) => e.playerId === id).sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
    const snapshot = derivePlayer(d.events.filter((e) => e.playerId === id));
    const account = m.accounts.find((a) => a.id === player.accountId) || null;
    return {
      player,
      snapshot,
      events: events.slice(0, 100),
      cordaAwards: m.cordaAwards.filter((c) => c.playerId === id),
      attendance: m.attendance.filter((a) => a.playerId === id),
      patchAwards: m.patchAwards.filter((p) => p.playerId === id),
      account: account ? { id: account.id, displayName: account.displayName, role: account.role, leaderboardOptIn: account.leaderboardOptIn, programs: account.programs } : null,
    };
  },

  async stampAttendance({ playerIds = [], program, classDate, stampedBy = 'acct-demo' }) {
    await this.ensure();
    const m = meta();
    const d = readLocalDb();
    const date = classDate || new Date().toISOString().slice(0, 10);
    const accepted = [];
    for (const playerId of playerIds) {
      if (m.attendance.some((a) => a.playerId === playerId && a.classDate === date && a.program === program)) continue;
      const player = d.players.find((p) => p.id === playerId);
      const row = { id: uid('att'), playerId, program, classDate: date, stampedBy };
      m.attendance.push(row);
      const event = makeEvent({
        playerId, accountId: player?.accountId || '', type: EVENT.ATTENDANCE,
        payload: { program, classDate: date }, source: 'coach',
      });
      d.events.push(event);
      accepted.push(row);
    }
    writeLocalDb(d);
    saveMeta(m);
    return { stamped: accepted.length, classDate: date, program };
  },

  async award({ playerId, kind, patchKey, corda, event: ceremony, xp, note, awardedBy = 'acct-demo' }) {
    await this.ensure();
    const d = readLocalDb();
    const m = meta();
    const player = d.players.find((p) => p.id === playerId);
    if (!player) throw new Error('player not found');
    const base = { playerId, accountId: player.accountId, source: 'coach' };
    if (kind === 'patch') {
      const key = patchKey || 'helper';
      m.patchAwards.push({ id: uid('paw'), playerId, patchKey: key, earnedAt: new Date().toISOString(), awardedBy });
      d.events.push(makeEvent({ ...base, type: EVENT.PATCH_EARNED, payload: { patchKey: key, note: note || '' } }));
    } else if (kind === 'corda') {
      if (!corda) throw new Error('corda required');
      m.cordaAwards.push({ id: uid('caw'), playerId, corda, event: ceremony || 'Batizado 2026', awardedAt: new Date().toISOString(), awardedBy, note: note || '' });
      d.events.push(makeEvent({ ...base, type: EVENT.CORDA_AWARDED, payload: { corda, event: ceremony || 'Batizado 2026', note: note || '' } }));
      const i = d.players.findIndex((p) => p.id === playerId);
      d.players[i] = { ...d.players[i], cordaCurrent: corda };
    } else if (kind === 'xp') {
      d.events.push(makeEvent({ ...base, type: EVENT.COACH_XP, payload: { xp: Number(xp) || 10, note: note || '' } }));
    } else if (kind === 'note') {
      d.events.push(makeEvent({ ...base, type: EVENT.COACH_NOTE, payload: { note: note || '', by: awardedBy } }));
    } else {
      throw new Error('unknown award kind');
    }
    writeLocalDb(d);
    saveMeta(m);
    return this.player(playerId);
  },

  async setGoal({ program, goalXp, goalLabel }) {
    await this.ensure();
    const m = meta();
    m.programGoals[program] = {
      goalXp: Math.max(1, Number(goalXp) || DEFAULT_GOAL.goalXp),
      goalLabel: goalLabel || DEFAULT_GOAL.goalLabel,
    };
    saveMeta(m);
    return { program, ...m.programGoals[program] };
  },

  async goals() {
    await this.ensure();
    return { ...meta().programGoals };
  },

  async leaderboard({ program, period }) {
    await this.ensure();
    const d = readLocalDb();
    const m = meta();
    const week = period || isoWeek(new Date());
    const eventsByPlayer = new Map();
    for (const e of d.events) {
      if (!eventsByPlayer.has(e.playerId)) eventsByPlayer.set(e.playerId, []);
      eventsByPlayer.get(e.playerId).push(e);
    }
    const accountsById = new Map(m.accounts.map((a) => [a.id, a]));
    const built = buildLeaderboard({ players: d.players, eventsByPlayer, accountsById, program, period: week });
    const goal = m.programGoals[program] || DEFAULT_GOAL;
    return { ...built, target: goal.goalXp, goalLabel: goal.goalLabel, entries: built.entries.slice(0, 10) };
  },

  async exportData({ scope = 'program', format = 'csv', what = 'players', program }) {
    await this.ensure();
    const d = readLocalDb();
    const m = meta();
    const players = d.players.filter((p) => p.active !== false && (scope === 'all' || p.program === program));
    const accountsById = new Map(m.accounts.map((a) => [a.id, a]));
    if (what === 'events') {
      const rows = [];
      for (const p of players) {
        for (const e of d.events.filter((x) => x.playerId === p.id)) rows.push(eventExportRow(e, p));
      }
      rows.sort((a, b) => String(a.occurredAt).localeCompare(String(b.occurredAt)));
      if (format === 'json') return { what, rows };
      return toCsv(EVENT_CSV_HEADERS, rows);
    }
    const rows = players.map((p) => playerExportRow(p, derivePlayer(d.events.filter((e) => e.playerId === p.id)), accountsById.get(p.accountId)));
    if (format === 'json') return { what, rows };
    return toCsv(PLAYER_CSV_HEADERS, rows);
  },

  async listAccounts() {
    await this.ensure();
    const m = meta();
    const d = readLocalDb();
    // Mirror the signed-in demo account's current role onto acct-demo.
    const signed = d.account;
    return m.accounts.map((a) => (a.id === signed.id ? { ...a, role: signed.role, programs: signed.programs || a.programs } : { ...a }));
  },

  async setRole({ memberId, role, programs }) {
    await this.ensure();
    const m = meta();
    const i = m.accounts.findIndex((a) => a.memberId === memberId || a.id === memberId);
    if (i === -1) throw new Error('account not found');
    m.accounts[i] = { ...m.accounts[i], role, programs: programs || m.accounts[i].programs || [] };
    saveMeta(m);
    const d = readLocalDb();
    if (d.account.memberId === m.accounts[i].memberId || d.account.id === m.accounts[i].id) {
      await localRepo.updateAccount({ role, programs: m.accounts[i].programs });
    }
    return m.accounts[i];
  },

  async appendPlayerEvents(playerId, events) {
    return localRepo.appendEvents(playerId, events);
  },
};
