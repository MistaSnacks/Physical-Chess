// patches.js — evaluate patch rules against a derived snapshot. Pure.
import { PATCHES } from '../../content/patches.js';
import { MODULES } from '../../content/modules.js';

export function ruleMet(rule, s) {
  switch (rule.type) {
    case 'lessonsDone': return s.lessonsDone >= rule.min;
    case 'moduleCleared': return Boolean(s.modules[rule.moduleId]?.cleared);
    case 'quizPerfect': return (s.lessons[rule.lessonId]?.bestScore ?? -1) === 100;
    case 'lessonStars': return (s.lessons[rule.lessonId]?.bestStars ?? 0) >= rule.stars;
    case 'glossaryMastered': return s.glossaryMastered >= rule.min;
    case 'streakWeeks': return s.streak.weeks >= rule.weeks;
    case 'desafioCount': return s.desafios >= rule.min;
    case 'practiceConfirmed': return s.practicesConfirmed >= rule.min;
    case 'moduleAllThreeStar': return MODULES.some((m) => s.modules[m.id].total > 0 && s.modules[m.id].stars === s.modules[m.id].maxStars);
    case 'readiness': return (s.readiness?.percent ?? 0) >= rule.percent;
    case 'coach': return false;
    default: return false;
  }
}

/** Patches earned: system rules + coach-awarded keys. Returns catalog entries. */
export function earnedPatches(snapshot, coachAwardedKeys = []) {
  const coach = new Set(coachAwardedKeys);
  return PATCHES.filter((p) => coach.has(p.key) || ruleMet(p.rule, snapshot));
}
