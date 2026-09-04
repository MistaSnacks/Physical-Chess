// derive.js — turn a player's event ledger into the snapshot every screen
// binds to. Pure. Used identically in the browser (optimistic) and on the
// server (nightly recompute, leaderboard).
import { EVENT, LESSON_DONE_TYPES } from './events.js';
import { levelFor } from './levels.js';
import { weekStreak } from './streaks.js';
import { earnedPatches } from './patches.js';
import { readiness } from './readiness.js';
import { MODULES } from '../../content/modules.js';
import { LESSONS } from '../../content/lessons.js';
import { CORDAS } from '../../data/batizado.js';

/**
 * @param {Array} events   the player's ledger (any order)
 * @param {object} opts    { now?: Date, rules?: readiness rules }
 */
export function derivePlayer(events, opts = {}) {
  const now = opts.now || new Date();
  const seen = new Set();
  const ledger = [];
  for (const e of events) {
    if (!e || seen.has(e.clientEventId)) continue;
    seen.add(e.clientEventId);
    ledger.push(e);
  }
  ledger.sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));

  const xp = ledger.reduce((sum, e) => sum + (Number(e.xp) || 0), 0);
  const level = levelFor(xp);

  // Per-lesson state
  const lessons = {};
  for (const l of LESSONS) lessons[l.id] = { lessonId: l.id, status: 'open', bestStars: 0, bestScore: null, attempts: 0, firstDoneAt: null, lastAt: null };
  for (const e of ledger) {
    if (!e.lessonId || !LESSON_DONE_TYPES.has(e.type)) continue;
    const s = lessons[e.lessonId] || (lessons[e.lessonId] = { lessonId: e.lessonId, status: 'open', bestStars: 0, bestScore: null, attempts: 0, firstDoneAt: null, lastAt: null });
    s.attempts += 1;
    s.status = 'done';
    s.bestStars = Math.max(s.bestStars, Number(e.stars) || 0);
    if (e.type === EVENT.QUIZ_DONE && e.payload && e.payload.total) {
      const pct = Math.round((e.payload.score / e.payload.total) * 100);
      s.bestScore = s.bestScore == null ? pct : Math.max(s.bestScore, pct);
    }
    s.firstDoneAt = s.firstDoneAt || e.occurredAt;
    s.lastAt = e.occurredAt;
  }

  // Per-module progress + locking
  const modules = {};
  for (const m of MODULES) {
    const ls = LESSONS.filter((l) => l.moduleId === m.id);
    const done = ls.filter((l) => lessons[l.id].status === 'done');
    const stars = ls.reduce((s, l) => s + lessons[l.id].bestStars, 0);
    modules[m.id] = {
      moduleId: m.id,
      total: ls.length,
      completed: done.length,
      percent: ls.length ? Math.round((done.length / ls.length) * 100) : 0,
      stars,
      maxStars: ls.length * 3,
      cleared: ls.length > 0 && done.length === ls.length,
      locked: false,
      lockedReason: null,
    };
  }
  for (const m of MODULES) {
    if (m.unlockAfter && !modules[m.unlockAfter].cleared) {
      modules[m.id].locked = true;
      modules[m.id].lockedReason = m.lockedReason || `Finish ${m.unlockAfter} first.`;
    }
  }

  const all = LESSONS.length;
  const lessonsDone = LESSONS.filter((l) => lessons[l.id].status === 'done').length;
  const stars = LESSONS.reduce((s, l) => s + lessons[l.id].bestStars, 0);

  // Next up: first not-done lesson in an unlocked module, module order
  let nextUp = null;
  for (const m of MODULES) {
    if (modules[m.id].locked) continue;
    const l = LESSONS.find((x) => x.moduleId === m.id && lessons[x.id].status !== 'done');
    if (l) { nextUp = { moduleId: m.id, lessonId: l.id }; break; }
  }

  const streak = weekStreak(ledger, now);

  // Corda from awards (last wins)
  const cordaEvents = ledger.filter((e) => e.type === EVENT.CORDA_AWARDED);
  const cordaCurrent = cordaEvents.length ? cordaEvents[cordaEvents.length - 1].payload.corda : 'crua';
  const cordaIdx = Math.max(0, CORDAS.findIndex((c) => c.id === cordaCurrent));
  const nextCorda = CORDAS[Math.min(CORDAS.length - 1, cordaIdx + 1)].id;

  const practices = ledger.filter((e) => e.type === EVENT.DRILL_DONE).length;
  const practicesConfirmed = ledger.filter((e) => e.type === EVENT.PRACTICE_CONFIRMED).length;
  const desafios = ledger.filter((e) => e.type === EVENT.DESAFIO_DONE).length;
  const attendance = ledger.filter((e) => e.type === EVENT.ATTENDANCE).length;
  const glossaryMastered = new Set(ledger.filter((e) => e.type === EVENT.GLOSSARY_MASTERED).map((e) => e.payload.word)).size;

  const base = {
    xp, level, lessons, modules, lessonsDone, lessonsTotal: all, stars, nextUp, streak,
    cordaCurrent, nextCorda, practices, practicesConfirmed, desafios, attendance, glossaryMastered,
    eventCount: ledger.length,
    lastActiveAt: ledger.length ? ledger[ledger.length - 1].occurredAt : null,
  };
  const ready = readiness(base, opts.rules);
  const coachPatches = ledger.filter((e) => e.type === EVENT.PATCH_EARNED && e.source === 'coach').map((e) => e.payload.patchKey);
  const patches = earnedPatches({ ...base, readiness: ready }, coachPatches);
  return { ...base, readiness: ready, patches };
}

/** New events that should be minted as side effects after `event` lands. */
export function sideEffects(before, after, event, ctx) {
  const out = [];
  if (event.moduleId && !before.modules[event.moduleId]?.cleared && after.modules[event.moduleId]?.cleared) {
    out.push({ type: EVENT.MODULE_CLEARED, moduleId: event.moduleId, payload: {} });
  }
  const beforeKeys = new Set(before.patches.map((p) => p.key));
  for (const p of after.patches) if (!beforeKeys.has(p.key)) out.push({ type: EVENT.PATCH_EARNED, payload: { patchKey: p.key } });
  if (ctx && ctx.newStreakWeek) out.push({ type: EVENT.STREAK_WEEK, payload: { week: ctx.week } });
  return out;
}
