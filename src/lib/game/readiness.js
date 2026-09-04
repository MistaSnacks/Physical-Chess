// readiness.js — Batizado Readiness checklist (SPEC §4.2). Pure.
import { READINESS_RULES } from '../../content/readiness.js';

function met(rule, s) {
  switch (rule.type) {
    case 'moduleCleared': return Boolean(s.modules[rule.moduleId]?.cleared);
    case 'quizScore': return (s.lessons[rule.lessonId]?.bestScore ?? -1) >= rule.minPercent;
    case 'lessonDone': return s.lessons[rule.lessonId]?.status === 'done';
    case 'practice': return s.practices >= rule.logged && s.practicesConfirmed >= rule.confirmed;
    case 'attendance': return s.attendance >= rule.min;
    default: return false;
  }
}

function progressOf(rule, s) {
  switch (rule.type) {
    case 'moduleCleared': return s.modules[rule.moduleId]?.percent ?? 0;
    case 'quizScore': return Math.min(100, Math.round(((s.lessons[rule.lessonId]?.bestScore ?? 0) / rule.minPercent) * 100));
    case 'lessonDone': return s.lessons[rule.lessonId]?.status === 'done' ? 100 : 0;
    case 'practice': return Math.min(100, Math.round(((Math.min(s.practices, rule.logged) + Math.min(s.practicesConfirmed, rule.confirmed)) / (rule.logged + rule.confirmed)) * 100));
    case 'attendance': return Math.min(100, Math.round((s.attendance / rule.min) * 100));
    default: return 0;
  }
}

export function readiness(snapshot, rules = READINESS_RULES) {
  const items = rules
    .filter((r) => !(r.hiddenUntilUsed && snapshot.attendance === 0))
    .map((r) => ({ key: r.key, label: r.label, met: met(r.rule, snapshot), progress: progressOf(r.rule, snapshot) }));
  const metCount = items.filter((i) => i.met).length;
  const percent = items.length ? Math.round((metCount / items.length) * 100) : 0;
  return { items, metCount, total: items.length, percent, ready: items.length > 0 && metCount === items.length };
}
