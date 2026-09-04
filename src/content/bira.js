// bira.js — Mestre Bira's line library (SPEC §4.9), keyed by moment.
// motion.js / the Bira component pick one at random from the moment's list.
export const BIRA = {
  welcome: [
    'Welcome to the roda, camará.',
    'Ready to ginga?',
    'Come in. The circle has room for you.',
    'Shoes off, eyes up. We begin together.',
  ],
  firstLesson: [
    'Your first step. Every mestre started here.',
    'Slow is how we learn. Take this one.',
    'Watch once. Then you try.',
    'The ginga will feel strange. That is normal.',
  ],
  correct: [
    'Boa.',
    'Isso.',
    'That is it.',
    'You heard it right.',
    'Keep that.',
  ],
  wrong: [
    'Not this time. Try the next one.',
    'Close. Keep going.',
    'Almost. Read it once more.',
    'The roda is patient with you.',
  ],
  levelUp: [
    'Level up. The roda is watching.',
    'A new title. You earned this one.',
    'Look at you. The map just grew.',
    'Wear that name in class tomorrow.',
  ],
  streakSaved: [
    'Another roda week. Keep the rhythm.',
    'You showed up this week. That is the streak.',
    'The flame stays lit. See you next week.',
    'One week at a time. That is the whole trick.',
  ],
  streakLost: [
    'The roda missed you. Start a new streak today.',
    'A quiet week happens. Begin again without shame.',
    'Streaks reset. You do not.',
    'Come back. The ginga is still here.',
  ],
  readinessFull: [
    'You are Roda Ready. Now your coach decides the corda.',
    'The ring is full. Batizado is the next conversation.',
    'You did the work. Your coach will see it.',
    'Ready does not mean ranked. It means prepared.',
  ],
  patch: [
    'A new patch for your uniform.',
    'Stitch that one on in your mind.',
    'You collected something real today.',
    'Patches remember the days you showed up.',
  ],
  lessonDone: [
    'Lesson cleared. Ginga on.',
    'That page is done. On to the next.',
    'Nice work. Shake out your legs.',
    'Closed. Come back when you want more.',
  ],
  demo: [
    'This is a demo family. Play as much as you like.',
    'Demo mode. Nothing here is sent to ACE.',
    'Try Maya or Leo. Both are pretend players.',
    'Explore every screen. This data resets.',
  ],
  desafio: [
    'One small task. Sixty seconds. Then you are done.',
    'Desafio do dia. Quick and focused.',
    'This is a daily taste, not a whole class.',
    'Finish it, then go outside and ginga for real.',
  ],
  readingCheckWrong: [
    'Not that one. Read the line again.',
    'Look back at the paragraph. The answer is in there.',
    'Almost. Try a different choice.',
    'No rush. The question waits.',
  ],
  quizPerfect: [
    'Every answer right. Your ear is getting sharp.',
    'Perfect score. The boss quiz bows to you.',
    'Clean sheet. That is musician listening.',
    'You knew it. Trust that next time too.',
  ],
  classMode: [
    'Class mode. This tablet belongs to the turma.',
    'Tap your card. Play. Then hand it back.',
    'No family login on this device.',
    'Coach is in the room. Be kind with the tablet.',
  ],
};

export function biraLine(moment, seed = Math.random()) {
  const list = BIRA[moment] || BIRA.correct;
  return list[Math.floor(seed * list.length) % list.length];
}
