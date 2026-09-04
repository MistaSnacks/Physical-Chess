// events.js — the event vocabulary and XP table (SPEC §3.1). This is the
// single source of truth for scoring; the browser and the server both use it.
export const EVENT = {
  VIDEO_DONE: 'lesson.video.done',
  READING_DONE: 'lesson.reading.done',
  DRILL_DONE: 'lesson.drill.done',
  PRACTICE_CONFIRMED: 'practice.confirmed',
  QUIZ_ANSWERED: 'quiz.answered',
  QUIZ_DONE: 'quiz.done',
  MODULE_CLEARED: 'module.cleared',
  DESAFIO_DONE: 'desafio.done',
  STREAK_WEEK: 'streak.week',
  PATCH_EARNED: 'patch.earned',
  COACH_XP: 'coach.xp',
  CORDA_AWARDED: 'corda.awarded',
  ATTENDANCE: 'attendance.stamped',
  GLOSSARY_MASTERED: 'glossary.mastered',
  PLAYER_CREATED: 'player.created',
  PLAYER_DELETED: 'player.deleted',
};

/** XP for an event. Pure. `payload` is the event's payload object. */
export function xpFor(type, payload = {}) {
  switch (type) {
    case EVENT.VIDEO_DONE: return 20;
    case EVENT.READING_DONE: return 15;
    case EVENT.DRILL_DONE: return 25;
    case EVENT.PRACTICE_CONFIRMED: return 15;
    case EVENT.QUIZ_ANSWERED: return payload.correct ? 10 : 0;
    case EVENT.QUIZ_DONE: return payload.score != null && payload.total && payload.score === payload.total ? 25 : 0;
    case EVENT.MODULE_CLEARED: return 100;
    case EVENT.DESAFIO_DONE: return 30;
    case EVENT.STREAK_WEEK: return 40;
    case EVENT.COACH_XP: return Math.max(10, Math.min(50, Number(payload.xp) || 10));
    default: return 0;
  }
}

/** Stars for a lesson-completing event (0–3). Pure. */
export function starsFor(type, payload = {}) {
  switch (type) {
    case EVENT.VIDEO_DONE: return 1;
    case EVENT.READING_DONE: return payload.checkFirstTry ? 2 : 1;
    case EVENT.DRILL_DONE: return Math.max(1, Math.min(3, Number(payload.selfRating) || 1));
    case EVENT.QUIZ_DONE: {
      if (!payload.total) return 1;
      const pct = (payload.score / payload.total) * 100;
      return pct === 100 ? 3 : pct >= 66 ? 2 : 1;
    }
    default: return 0;
  }
}

/** Which event types mark a lesson as done. */
export const LESSON_DONE_TYPES = new Set([EVENT.VIDEO_DONE, EVENT.READING_DONE, EVENT.DRILL_DONE, EVENT.QUIZ_DONE]);

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Build a ledger event. `xp` and `stars` are computed here so the ledger row
 * is self-describing when exported. Never mutate an event after creation.
 */
export function makeEvent({ playerId, accountId, type, moduleId = null, lessonId = null, payload = {}, occurredAt = new Date(), source = 'app', clientEventId }) {
  return {
    clientEventId: clientEventId || uuid(),
    playerId,
    accountId,
    type,
    moduleId,
    lessonId,
    payload,
    xp: xpFor(type, payload),
    stars: starsFor(type, payload),
    occurredAt: new Date(occurredAt).toISOString(),
    source,
  };
}
