// GET /api/coach/roster?program=
import { json } from '../../../lib/server/session.js';
import { missingSecret, demoResponse } from '../../../lib/server/demo-guard.js';
import { caller, canSeeProgram, hasRole } from '../../../lib/server/authz.js';
import { getRoster } from '../../../lib/server/lms.js';
export const prerender = false;

export async function GET({ request, url }) {
  if (missingSecret()) return demoResponse();
  const who = await caller(request);
  if (who.error) return who.error;
  if (!hasRole(who.account, ['coach', 'admin'])) return json({ error: 'Coach only.' }, { status: 403 });
  const program = url.searchParams.get('program') || '';
  if (program && !canSeeProgram(who.account, program)) return json({ error: 'Not your program.' }, { status: 403 });
  try {
    const players = await getRoster(program || undefined);
    return json({ players, program: program || null });
  } catch (err) {
    console.error(err);
    return json({ error: 'Could not load the roster.' }, { status: 502 });
  }
}
