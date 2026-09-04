// demoSeed.js — the "Demo Family" (SPEC §2.2): Maya "Gatinha" mid-journey
// (the showcase state) and Leo "Tubarão" brand new. Pure data.
import { makeEvent, EVENT } from '../game/events.js';

export const DEMO_ACCOUNT = {
  id: 'acct-demo',
  memberId: 'demo',
  role: 'guardian',
  displayName: 'Demo Family',
  email: 'demo@physicalchess.org',
  programs: [],
  leaderboardOptIn: false,
  demo: true,
};

export const DEMO_PLAYERS = [
  { id: 'player-maya', accountId: 'acct-demo', firstName: 'Maya', apelido: 'Gatinha', avatar: { animal: 'frog', color: 'hibiscus' }, birthYear: 2017, program: 'bushwick', startedAt: '2026-06-02', active: true, mayPlayInClass: true },
  { id: 'player-leo', accountId: 'acct-demo', firstName: 'Leo', apelido: 'Tubarão', avatar: { animal: 'lizard', color: 'mango' }, birthYear: 2019, program: 'bushwick', startedAt: '2026-09-01', active: true, mayPlayInClass: true },
];

const daysAgo = (n, h = 17) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, 0, 0, 0); return d; };

/** Maya: 4 lessons done across 4 consecutive weeks, quiz in progress. */
export function demoEvents() {
  const P = { playerId: 'player-maya', accountId: 'acct-demo' };
  const fixed = (id, rest) => makeEvent({ ...P, clientEventId: `demo-${id}`, ...rest });
  return [
    fixed('created', { type: EVENT.PLAYER_CREATED, payload: {}, occurredAt: daysAgo(27) }),
    fixed('w1-ginga', { type: EVENT.VIDEO_DONE, moduleId: 'movements', lessonId: 'ginga-basics', occurredAt: daysAgo(24) }),
    fixed('w1-streak', { type: EVENT.STREAK_WEEK, payload: { week: 1 }, occurredAt: daysAgo(24) }),
    fixed('w2-meia', { type: EVENT.VIDEO_DONE, moduleId: 'movements', lessonId: 'meia-lua-de-frente', occurredAt: daysAgo(17) }),
    fixed('w2-streak', { type: EVENT.STREAK_WEEK, payload: { week: 2 }, occurredAt: daysAgo(17) }),
    fixed('w3-esquiva', { type: EVENT.DRILL_DONE, moduleId: 'movements', lessonId: 'esquiva-cocorinha', payload: { selfRating: 2 }, occurredAt: daysAgo(10) }),
    fixed('w3-practice', { type: EVENT.PRACTICE_CONFIRMED, moduleId: 'movements', lessonId: 'esquiva-cocorinha', payload: { by: 'guardian' }, occurredAt: daysAgo(9), source: 'app' }),
    fixed('w3-streak', { type: EVENT.STREAK_WEEK, payload: { week: 3 }, occurredAt: daysAgo(10) }),
    fixed('w4-berimbau', { type: EVENT.READING_DONE, moduleId: 'music', lessonId: 'meet-the-berimbau', payload: { checkFirstTry: true }, occurredAt: daysAgo(3) }),
    fixed('w4-streak', { type: EVENT.STREAK_WEEK, payload: { week: 4 }, occurredAt: daysAgo(3) }),
    fixed('w4-desafio', { type: EVENT.DESAFIO_DONE, payload: { kind: 'flashcard' }, occurredAt: daysAgo(2) }),
    fixed('w4-q1', { type: EVENT.QUIZ_ANSWERED, moduleId: 'music', lessonId: 'music-quiz', payload: { questionId: 'q1', correct: true }, occurredAt: daysAgo(1) }),
    fixed('w4-glossary-axe', { type: EVENT.GLOSSARY_MASTERED, payload: { word: 'Axé' }, occurredAt: daysAgo(1) }),
    fixed('w4-glossary-roda', { type: EVENT.GLOSSARY_MASTERED, payload: { word: 'Roda' }, occurredAt: daysAgo(1) }),
  ];
}
