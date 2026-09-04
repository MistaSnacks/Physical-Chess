// GET /api/coach/players/:id
import { json } from '../../../../lib/server/session.js';
import { missingSecret, demoResponse } from '../../../../lib/server/demo-guard.js';
import { caller, canSeeProgram, hasRole } from '../../../../lib/server/authz.js';
import { getPlayerDetail } from '../../../../lib/server/lms.js';
export const prerender = false;

export async function GET({ request, params }) {
  if (missingSecret()) return demoResponse();
  const who = await caller(request);
  if (who.error) return who.error;
  if (!hasRole(who.account, ['coach', 'admin'])) return json({ error: 'Coach only.' }, { status: 403 });
  try {
    const data = await getPlayerDetail(params.id);
    if (!data) return json({ error: 'Not found.' }, { status: 404 });
    if (!canSeeProgram(who.account, data.player.program)) return json({ error: 'Not your program.' }, { status: 403 });
    return json(data);
  } catch (err) {
    console.error(err);
    return json({ error: 'Could not load this student.' }, { status: 502 });
  }
}
