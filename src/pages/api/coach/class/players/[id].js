// GET /api/coach/class/players/:id — Class mode across families (SPEC-v3
// R15.4). The full trusted ledger of a turma player, for a coach whose
// program it is, when the guardian ticked "may play in class". Not the
// 100-event /api/coach/players/:id detail: the tablet needs every event to
// show the child's real XP, stars and unlocks.
import { json } from '../../../../../lib/server/session.js';
import { missingSecret, demoResponse } from '../../../../../lib/server/demo-guard.js';
import { caller } from '../../../../../lib/server/authz.js';
import { classPlayerAllowed } from '../../../../../lib/server/policy.js';
import { playerRow, classLedger, publicPlayer } from '../../../../../lib/server/lms.js';
export const prerender = false;

export async function GET({ request, params }) {
  if (missingSecret()) return demoResponse();
  const who = await caller(request);
  if (who.error) return who.error;
  try {
    const player = await playerRow(params.id);
    if (!player) return json({ error: 'Not found.' }, { status: 404 });
    if (!classPlayerAllowed(who.account, player)) return json({ error: 'Not in your class.' }, { status: 403 });
    return json({ player: publicPlayer(player), events: await classLedger(player) });
  } catch (err) {
    console.error(err);
    return json({ error: 'Could not load this player.' }, { status: 502 });
  }
}
