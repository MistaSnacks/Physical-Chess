// readiness.js — the Batizado Readiness checklist (SPEC §4.2). Evaluated by
// src/lib/game/readiness.js. `hiddenUntilUsed` rules only count once a coach
// has produced at least one matching event for the player (attendance).
export const READINESS_RULES = [
  { key: 'movements-cleared', label: 'Finish the Movements module', rule: { type: 'moduleCleared', moduleId: 'movements' } },
  { key: 'music-quiz', label: 'Score 2 of 3 or better on the Music quiz', rule: { type: 'quizScore', lessonId: 'music-quiz', minPercent: 66 } },
  { key: 'portuguese', label: 'Learn Portuguese for the Roda', rule: { type: 'lessonDone', lessonId: 'portuguese-for-the-roda' } },
  { key: 'what-is-batizado', label: 'Read What is Batizado?', rule: { type: 'lessonDone', lessonId: 'what-is-batizado' } },
  { key: 'practice', label: 'Log 8 practices, 4 seen by a grown-up', rule: { type: 'practice', logged: 8, confirmed: 4 } },
  { key: 'attendance', label: 'Get 6 class stamps from your coach', rule: { type: 'attendance', min: 6 }, hiddenUntilUsed: true },
];
