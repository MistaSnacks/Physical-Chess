// GET+POST /api/coach/goal — community berimbau target on lms-programs.
import { json } from '../../../lib/server/session.js';
import { missingSecret, demoResponse } from '../../../lib/server/demo-guard.js';
import { caller, canSeeProgram, hasRole } from '../../../lib/server/authz.js';
import { getGoals, setGoal } from '../../../lib/server/lms.js';
export const prerender = false;

export async function GET({ request }) {
  if (missingSecret()) return demoResponse();
  const who = await caller(request);
  if (who.error) return who.error;
  if (!hasRole(who.account, ['coach', 'admin', 'guardian'])) return json({ error: 'Not allowed.' }, { status: 403 });
  try {
    return json({ goals: await getGoals() });
  } catch (err) {
    console.error(err);
    return json({ error: 'Could not load goals.' }, { status: 502 });
  }
}

export async function POST({ request }) {
  if (missingSecret()) return demoResponse();
  const who = await caller(request);
  if (who.error) return who.error;
  if (!hasRole(who.account, ['coach', 'admin'])) return json({ error: 'Coach only.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  if (!body.program) return json({ error: 'program is required.' }, { status: 400 });
  if (!canSeeProgram(who.account, body.program)) return json({ error: 'Not your program.' }, { status: 403 });
  try {
    return json(await setGoal(body));
  } catch (err) {
    console.error(err);
    return json({ error: 'Could not save the goal.' }, { status: 502 });
  }
}
