// cores.js — XP → Core (SPEC-v3 R12.2). Pure. Same shape as levelFor(), over
// the nine Cores in src/content/cores.js, except `percent` rounds down so a
// bar is never full until the next Core is reached (levelFor rounds, which
// shows 100% at 699 XP). Inert until D1: derivePlayer puts it on the
// snapshot as `core`, but no display reads it yet, and levelFor() and the
// stored `level` are unchanged.
import { CORES } from '../../content/cores.js';

export function coreFor(xp) {
  const total = Math.max(0, Number(xp) || 0);
  let current = CORES[0];
  for (const c of CORES) if (total >= c.xp) current = c;
  const next = CORES.find((c) => c.order === current.order + 1) || null;
  const floor = current.xp;
  const ceil = next ? next.xp : floor;
  const span = Math.max(1, ceil - floor);
  return {
    level: current.order,
    id: current.id,
    title: current.title,
    color: current.color,
    meaning: current.meaning,
    xp: total,
    xpInto: total - floor,
    xpToNext: next ? ceil - total : 0,
    xpSpan: next ? span : 0,
    percent: next ? Math.min(99, Math.floor(((total - floor) / span) * 100)) : 100,
    isMax: !next,
    nextTitle: next ? next.title : null,
  };
}
