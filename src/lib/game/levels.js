// levels.js — XP → level. Pure.
import { LEVELS } from '../../content/levels.js';

export function levelFor(xp) {
  const total = Math.max(0, Number(xp) || 0);
  let current = LEVELS[0];
  for (const l of LEVELS) if (total >= l.xp) current = l;
  const next = LEVELS.find((l) => l.level === current.level + 1) || null;
  const floor = current.xp;
  const ceil = next ? next.xp : floor;
  const span = Math.max(1, ceil - floor);
  return {
    level: current.level,
    title: current.title,
    bira: current.bira,
    xp: total,
    xpInto: total - floor,
    xpToNext: next ? ceil - total : 0,
    xpSpan: next ? span : 0,
    percent: next ? Math.min(100, Math.round(((total - floor) / span) * 100)) : 100,
    isMax: !next,
    nextTitle: next ? next.title : null,
  };
}
