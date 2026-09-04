// bira.js — Mestre Bira's line library (SPEC §4.9), keyed by moment.
// motion.js / the Bira component pick one at random from the moment's list.
export const BIRA = {
  welcome: ['Welcome to the roda, camará!', 'Ready to ginga?'],
  firstLesson: ['Your first step. Every mestre started here.'],
  correct: ['Boa!', 'Isso!', 'That is it!'],
  wrong: ['Not this time. Try the next one.', 'Close! Keep going.'],
  levelUp: ['Level up! The roda is watching.'],
  streakSaved: ['Another roda week. Keep the rhythm.'],
  streakLost: ['The roda missed you. Start a new streak today.'],
  readinessFull: ['You are Roda Ready. Now your coach decides the corda.'],
  patch: ['A new patch for your uniform!'],
  lessonDone: ['Lesson cleared. Ginga on.'],
  demo: ['This is a demo family. Play as much as you like.'],
};

export function biraLine(moment, seed = Math.random()) {
  const list = BIRA[moment] || BIRA.correct;
  return list[Math.floor(seed * list.length) % list.length];
}
