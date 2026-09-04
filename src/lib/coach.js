// coach.js — shared coach/turma helpers (pure). Screens and the demo repo
// both use these so overview numbers match the export CSV.
import { isoWeek, nyDate, nyMonth, weekStreak } from './game/streaks.js';
import { PROGRAMS, programByKey } from '../content/programs.js';
import { CORDAS } from '../data/batizado.js';

export const CLASS_MODE_KEY = 'pc.classMode';
export const READINESS_BUCKETS = [
  { key: '0-20', label: '0–20%', min: 0, max: 20 },
  { key: '21-40', label: '21–40%', min: 21, max: 40 },
  { key: '41-60', label: '41–60%', min: 41, max: 60 },
  { key: '61-80', label: '61–80%', min: 61, max: 80 },
  { key: '81-100', label: '81–100%', min: 81, max: 100 },
];

export function cordaLabel(id) {
  return CORDAS.find((c) => c.id === id)?.label || id || 'Crua';
}

export function readinessBucket(percent) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  if (p <= 20) return 0;
  if (p <= 40) return 1;
  if (p <= 60) return 2;
  if (p <= 80) return 3;
  return 4;
}

export function overviewFromRoster(rows, now = new Date()) {
  const thisWeek = isoWeek(now);
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 21);
  let activeThisWeek = 0;
  let lessonsThisWeek = 0;
  const inactive = [];
  const buckets = [0, 0, 0, 0, 0];
  for (const r of rows) {
    const s = r.snapshot || {};
    if (s.streak?.activeThisWeek) activeThisWeek += 1;
    const lessons = s.lessons || {};
    for (const L of Object.values(lessons)) {
      if (L.status === 'done' && L.lastAt && isoWeek(L.lastAt) === thisWeek) lessonsThisWeek += 1;
    }
    const last = s.lastActiveAt ? new Date(s.lastActiveAt) : null;
    const startedAt = r.startedAt || r.player?.startedAt;
    const quiet = last ? last < cutoff : Boolean(startedAt && new Date(startedAt) < cutoff);
    if (quiet) inactive.push({ id: r.id || r.player?.id, apelido: r.apelido || r.player?.apelido, firstName: r.firstName || r.player?.firstName, lastActiveAt: s.lastActiveAt || null });
    buckets[readinessBucket(s.readiness?.percent)] += 1;
  }
  return { activeThisWeek, lessonsThisWeek, inactive, buckets, total: rows.length, week: thisWeek };
}

export function weekXp(events, week = isoWeek(new Date())) {
  return events.reduce((sum, e) => sum + (isoWeek(e.occurredAt) === week ? Number(e.xp) || 0 : 0), 0);
}

export function monthXp(events, month = nyMonth(new Date())) {
  return events.reduce((sum, e) => sum + (nyMonth(e.occurredAt) === month ? Number(e.xp) || 0 : 0), 0);
}

export function buildLeaderboard({ players, eventsByPlayer, accountsById, program, period, now = new Date() }) {
  const week = period || isoWeek(now);
  const month = nyMonth(now);
  const entries = [];
  let communityXp = 0;
  for (const p of players) {
    if (p.program !== program || p.active === false) continue;
    const acc = accountsById.get(p.accountId);
    const events = eventsByPlayer.get(p.id) || [];
    communityXp += monthXp(events, month);
    if (acc?.leaderboardOptIn !== true) continue;
    entries.push({
      playerId: p.id,
      apelido: p.apelido || p.firstName,
      avatar: p.avatar || { animal: 'frog', color: 'lime' },
      xp: weekXp(events, week),
      weekStreak: weekStreak(events, now).weeks,
    });
  }
  entries.sort((a, b) => b.xp - a.xp || a.apelido.localeCompare(b.apelido));
  return {
    program,
    period: week,
    entries: entries.map(({ playerId, apelido, avatar, xp, weekStreak: weeks }) => ({ playerId, apelido, avatar, xp, weekStreak: weeks })),
    communityXp,
    computedAt: now.toISOString(),
  };
}

export function csvEscape(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** UTF-8 BOM + CRLF so the file opens cleanly in Numbers. */
export function toCsv(headers, rows) {
  const head = headers.map((h) => csvEscape(h.label)).join(',');
  const body = rows.map((row) => headers.map((h) => csvEscape(row[h.key])).join(',')).join('\r\n');
  return `\uFEFF${head}\r\n${body}`;
}

export const PLAYER_CSV_HEADERS = [
  { key: 'apelido', label: 'apelido' },
  { key: 'firstName', label: 'firstName' },
  { key: 'program', label: 'program' },
  { key: 'programName', label: 'programName' },
  { key: 'guardianName', label: 'guardianName' },
  { key: 'guardianEmail', label: 'guardianEmail' },
  { key: 'corda', label: 'corda' },
  { key: 'level', label: 'level' },
  { key: 'levelTitle', label: 'levelTitle' },
  { key: 'xp', label: 'xp' },
  { key: 'stars', label: 'stars' },
  { key: 'lessonsDone', label: 'lessonsDone' },
  { key: 'readiness', label: 'readinessPercent' },
  { key: 'weekStreak', label: 'rodaWeeks' },
  { key: 'lastActiveAt', label: 'lastActiveAt' },
];

export const EVENT_CSV_HEADERS = [
  { key: 'occurredAt', label: 'occurredAt' },
  { key: 'playerId', label: 'playerId' },
  { key: 'apelido', label: 'apelido' },
  { key: 'type', label: 'type' },
  { key: 'xp', label: 'xp' },
  { key: 'stars', label: 'stars' },
  { key: 'moduleId', label: 'moduleId' },
  { key: 'lessonId', label: 'lessonId' },
  { key: 'source', label: 'source' },
  { key: 'payload', label: 'payload' },
  { key: 'clientEventId', label: 'clientEventId' },
];

export function playerExportRow(player, snapshot, account) {
  const prog = programByKey(player.program);
  return {
    apelido: player.apelido || '',
    firstName: player.firstName || '',
    program: player.program || '',
    programName: prog?.name || '',
    guardianName: account?.displayName || '',
    guardianEmail: account?.email || '',
    corda: cordaLabel(snapshot?.cordaCurrent || player.cordaCurrent),
    level: snapshot?.level?.level ?? '',
    levelTitle: snapshot?.level?.title ?? '',
    xp: snapshot?.xp ?? player.xp ?? 0,
    stars: snapshot?.stars ?? 0,
    lessonsDone: snapshot?.lessonsDone ?? 0,
    readiness: snapshot?.readiness?.percent ?? '',
    weekStreak: snapshot?.streak?.weeks ?? '',
    lastActiveAt: snapshot?.lastActiveAt || '',
  };
}

export function eventExportRow(event, player) {
  return {
    occurredAt: event.occurredAt,
    playerId: event.playerId,
    apelido: player?.apelido || '',
    type: event.type,
    xp: event.xp || 0,
    stars: event.stars || 0,
    moduleId: event.moduleId || '',
    lessonId: event.lessonId || '',
    source: event.source || '',
    payload: typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload || {}),
    clientEventId: event.clientEventId || '',
  };
}

export function downloadBlob(filename, text, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function readClassMode() {
  try {
    const raw = sessionStorage.getItem(CLASS_MODE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeClassMode(value) {
  if (!value) sessionStorage.removeItem(CLASS_MODE_KEY);
  else sessionStorage.setItem(CLASS_MODE_KEY, JSON.stringify(value));
}

export const NO_PROGRAMS_COPY =
  'No program is assigned to this login yet. Ask an admin to add your turmas.';

export function programsForAccount(account) {
  if (!account) return [];
  if (account.role === 'admin') return PROGRAMS.filter((p) => p.active);
  const keys = account.programs || [];
  if (!keys.length) return [];
  return keys.map(programByKey).filter(Boolean);
}

export function snapshotFields(snapshot) {
  return {
    xp: snapshot.xp,
    level: snapshot.level.level,
    weekStreak: snapshot.streak.weeks,
    lastActiveWeek: snapshot.streak.lastActiveWeek,
    stars: snapshot.stars,
    lessonsDone: snapshot.lessonsDone,
    cordaCurrent: snapshot.cordaCurrent,
  };
}

export const EVENT_LABELS = {
  'lesson.video.done': 'Watched a video',
  'lesson.reading.done': 'Finished a reading',
  'lesson.drill.done': 'Finished a drill',
  'practice.confirmed': 'A grown-up saw practice',
  'quiz.answered': 'Quiz answer',
  'quiz.done': 'Finished a quiz',
  'module.cleared': 'Cleared a module',
  'desafio.done': 'Desafio do Dia',
  'streak.week': 'Roda week saved',
  'patch.earned': 'Patch',
  'coach.xp': 'Coach XP',
  'corda.awarded': 'Corda awarded',
  'attendance.stamped': 'Class stamp',
  'glossary.mastered': 'Glossary word',
  'player.created': 'Player created',
  'player.deleted': 'Player deleted',
  'coach.note': 'Coach note',
};
