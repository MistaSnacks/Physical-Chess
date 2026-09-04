// curriculum.js — TRANSITIONAL compatibility shim for the showcase-era pages.
// Content now lives in src/content/*; progress comes from the demo player at
// build time so the old pages still render. WP2/WP3 replace every import of
// this file with src/content + the runtime store, then delete it.
import { MODULES as CONTENT_MODULES } from '../content/modules.js';
import { LESSONS, lessonById } from '../content/lessons.js';
import { INSTRUMENTS as CONTENT_INSTRUMENTS, GLOSSARY } from '../content/index.js';
import { derivePlayer } from '../lib/game/derive.js';
import { demoEvents } from '../lib/repo/demoSeed.js';

const snap = derivePlayer(demoEvents());

export const MODULES = CONTENT_MODULES.map((m) => ({
  id: m.id,
  title: m.title,
  icon: m.icon,
  locked: snap.modules[m.id].locked,
  lockedReason: snap.modules[m.id].lockedReason,
  lessons: LESSONS.filter((l) => l.moduleId === m.id).map((l) => ({
    id: l.id,
    title: l.title,
    type: l.type,
    minutes: l.minutes,
    videoKey: l.videoKey,
    photoKey: l.photoKey,
    summary: l.summary,
    completed: snap.lessons[l.id].status === 'done',
    inProgress: snap.nextUp?.lessonId === l.id,
  })),
}));

export const INSTRUMENTS = CONTENT_INSTRUMENTS;
export const PORTUGUESE_WORDS = GLOSSARY.slice(0, 6).map((g) => ({ word: g.word, meaning: g.meaning }));
export const MUSIC_QUIZ = lessonById('music-quiz').quiz;

export function moduleProgress(mod) {
  const total = mod.lessons.length;
  const completed = mod.lessons.filter((l) => l.completed).length;
  return { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
}
export function overallProgress() {
  const all = MODULES.flatMap((m) => m.lessons);
  const completed = all.filter((l) => l.completed).length;
  return { completed, total: all.length, percent: all.length === 0 ? 0 : Math.round((completed / all.length) * 100) };
}
export function nextUpLesson() {
  for (const mod of MODULES) {
    if (mod.locked) continue;
    const lesson = mod.lessons.find((l) => !l.completed);
    if (lesson) return { module: mod, lesson };
  }
  return null;
}
