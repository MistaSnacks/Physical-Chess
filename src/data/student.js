// student.js — TRANSITIONAL. The showcase's hard-coded demo student, now
// derived from the demo ledger so numbers match the runtime store. WP3
// replaces it with data-bind on the live snapshot.
import { derivePlayer } from '../lib/game/derive.js';
import { demoEvents } from '../lib/repo/demoSeed.js';
import { DEMO_PLAYERS } from '../lib/repo/demoSeed.js';

const snap = derivePlayer(demoEvents());
const maya = DEMO_PLAYERS[0];

export const STUDENT = {
  firstName: maya.firstName,
  apelido: maya.apelido,
  corda: snap.cordaCurrent,
  nextCorda: snap.nextCorda,
  streakDays: snap.streak.weeks,
  xp: snap.xp,
  xpToNext: snap.xp + snap.level.xpToNext,
  stars: snap.stars,
  badges: snap.patches.length,
  level: snap.level,
  readiness: snap.readiness,
};
