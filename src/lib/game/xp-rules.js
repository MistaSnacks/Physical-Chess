// xp-rules.js — "XP the first time only" (SPEC §3.1, SPEC-v3 R8.1). Pure.
// recordEvent stores allowedXp() as the event's xp, so every reader of
// stored XP (derivePlayer, turma totals, the +XP fly-in, export) agrees.
// Repeats still record events: stars, attempts and practice counts update.
import { EVENT, xpFor } from './events.js';
import { nyDate, isoWeek } from './streaks.js';

const LESSON_TYPES = new Set([EVENT.VIDEO_DONE, EVENT.READING_DONE, EVENT.DRILL_DONE]);

const isPerfect = (p = {}) => p.score != null && p.total && p.score === p.total;

/** True when `prior` already earned what `event` would earn. */
function alreadyPaid(event, prior) {
  if (prior.type !== event.type || prior.clientEventId === event.clientEventId) return false;
  if (event.playerId && prior.playerId && prior.playerId !== event.playerId) return false;
  const p = event.payload || {};
  const q = prior.payload || {};
  if (LESSON_TYPES.has(event.type)) return prior.lessonId === event.lessonId;
  switch (event.type) {
    case EVENT.QUIZ_ANSWERED:
      return Boolean(q.correct) && prior.lessonId === event.lessonId && q.questionId === p.questionId;
    case EVENT.QUIZ_DONE:
      return isPerfect(q) && prior.lessonId === event.lessonId;
    case EVENT.PRACTICE_CONFIRMED:
      return prior.lessonId === event.lessonId;
    case EVENT.DESAFIO_DONE:
      return nyDate(prior.occurredAt) === nyDate(event.occurredAt);
    case EVENT.MODULE_CLEARED:
      return prior.moduleId === event.moduleId;
    case EVENT.STREAK_WEEK:
      return isoWeek(prior.occurredAt) === isoWeek(event.occurredAt);
    default:
      return false;
  }
}

/**
 * XP `event` may earn given the player's earlier events. Computed from the
 * event's type and payload, never from a stored `xp` value.
 */
export function allowedXp(event, ledger = []) {
  const base = xpFor(event.type, event.payload || {});
  if (!base) return 0;
  return ledger.some((prior) => alreadyPaid(event, prior)) ? 0 : base;
}

/** A copy of `event` with its xp set by allowedXp(). */
export function withAllowedXp(event, ledger = []) {
  return { ...event, xp: allowedXp(event, ledger) };
}

/**
 * Re-score a whole ledger in time order (any number of players). Used for the
 * demo seeds and any server-side recompute that must ignore stored xp.
 */
export function scoreLedger(events = []) {
  const sorted = [...events].sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));
  const byPlayer = new Map();
  const scored = new Map();
  for (const e of sorted) {
    const prior = byPlayer.get(e.playerId) || [];
    const next = withAllowedXp(e, prior);
    prior.push(next);
    byPlayer.set(e.playerId, prior);
    scored.set(e.clientEventId, next);
  }
  return events.map((e) => scored.get(e.clientEventId) || e);
}
