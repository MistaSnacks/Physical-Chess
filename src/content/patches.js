// patches.js — the collectible patch (badge) catalog (SPEC §4.5).
// `rule` is a plain descriptor evaluated by src/lib/game/patches.js so the
// same rules can later live in the Wix `lms-patches` collection as JSON.
// tiers: 1 stitch (easy) · 2 embroidered · 3 gold thread · 4 coach-only
export const PATCHES = [
  { key: 'first-ginga', title: 'First Ginga', subtitle: 'Your first lesson done', tier: 1, art: 'footprint', rule: { type: 'lessonsDone', min: 1 } },
  { key: 'boa-ginga', title: 'Boa Ginga', subtitle: 'Movements cleared', tier: 2, art: 'kick', rule: { type: 'moduleCleared', moduleId: 'movements' } },
  { key: 'berimbau-ear', title: 'Berimbau Ear', subtitle: 'Perfect Music quiz', tier: 2, art: 'berimbau', rule: { type: 'quizPerfect', lessonId: 'music-quiz' } },
  { key: 'voice-of-roda', title: 'Voice of the Roda', subtitle: 'Sing the Roda, 3 stars', tier: 2, art: 'mouth', rule: { type: 'lessonStars', lessonId: 'sing-the-roda', stars: 3 } },
  { key: 'historian', title: 'Historian', subtitle: 'Culture cleared', tier: 2, art: 'map', rule: { type: 'moduleCleared', moduleId: 'culture' } },
  { key: 'fala-portugues', title: 'Fala Português', subtitle: '6 words mastered', tier: 2, art: 'speech', rule: { type: 'glossaryMastered', min: 6 } },
  { key: 'four-weeks', title: 'Roda Weeks 4', subtitle: 'Four weeks in a row', tier: 1, art: 'flame', rule: { type: 'streakWeeks', weeks: 4 } },
  { key: 'eight-weeks', title: 'Roda Weeks 8', subtitle: 'Eight weeks in a row', tier: 2, art: 'flame', rule: { type: 'streakWeeks', weeks: 8 } },
  { key: 'twelve-weeks', title: 'Roda Weeks 12', subtitle: 'Twelve weeks in a row', tier: 3, art: 'flame', rule: { type: 'streakWeeks', weeks: 12 } },
  { key: 'desafio-7', title: 'Desafio Streak', subtitle: 'Seven daily challenges', tier: 2, art: 'ticket', rule: { type: 'desafioCount', min: 7 } },
  { key: 'home-roda', title: 'Home Roda', subtitle: '5 practices seen by a grown-up', tier: 2, art: 'house', rule: { type: 'practiceConfirmed', min: 5 } },
  { key: 'three-star-module', title: 'Estrela', subtitle: 'Every star in a module', tier: 3, art: 'star', rule: { type: 'moduleAllThreeStar' } },
  { key: 'roda-ready', title: 'Roda Ready', subtitle: 'Ready for Batizado', tier: 3, art: 'gate', rule: { type: 'readiness', percent: 100 } },
  { key: 'batizado-2026', title: 'Batizado 2026', subtitle: 'You were there', tier: 4, art: 'corda', rule: { type: 'coach' } },
  { key: 'helper', title: 'Ajudante', subtitle: 'A coach saw you help', tier: 4, art: 'hands', rule: { type: 'coach' } },
];

export function patchByKey(key) {
  return PATCHES.find((p) => p.key === key) || null;
}
