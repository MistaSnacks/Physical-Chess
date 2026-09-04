// POST /api/coach/award
import { json } from '../../../lib/server/session.js';
import { missingSecret, demoResponse } from '../../../lib/server/demo-guard.js';
import { caller, canSeeProgram, hasRole } from '../../../lib/server/authz.js';
import { award, getPlayerDetail } from '../../../lib/server/lms.js';
export const prerender = false;

export async function POST({ request }) {
  if (missingSecret()) return demoResponse();
  const who = await caller(request);
  if (who.error) return who.error;
  if (!hasRole(who.account, ['coach', 'admin'])) return json({ error: 'Coach only.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  if (!body.playerId || !body.kind) return json({ error: 'playerId and kind are required.' }, { status: 400 });
  try {
    const detail = await getPlayerDetail(body.playerId);
    if (!detail) return json({ error: 'Not found.' }, { status: 404 });
    if (!canSeeProgram(who.account, detail.player.program)) return json({ error: 'Not your program.' }, { status: 403 });
    const result = await award({ ...body, awardedBy: who.account.id });
    return json(result);
  } catch (err) {
    console.error(err);
    return json({ error: err.message || 'Could not save the award.' }, { status: err.status || 502 });
  }
}
