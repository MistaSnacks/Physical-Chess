// POST /api/coach/attendance
import { json } from '../../../lib/server/session.js';
import { missingSecret, demoResponse } from '../../../lib/server/demo-guard.js';
import { caller, canSeeProgram, hasRole } from '../../../lib/server/authz.js';
import { stampAttendance } from '../../../lib/server/lms.js';
export const prerender = false;

export async function POST({ request }) {
  if (missingSecret()) return demoResponse();
  const who = await caller(request);
  if (who.error) return who.error;
  if (!hasRole(who.account, ['coach', 'admin'])) return json({ error: 'Coach only.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const { playerIds, program, classDate } = body;
  if (!program || !Array.isArray(playerIds) || !playerIds.length) {
    return json({ error: 'program and playerIds are required.' }, { status: 400 });
  }
  if (!canSeeProgram(who.account, program)) return json({ error: 'Not your program.' }, { status: 403 });
  try {
    const result = await stampAttendance({ playerIds, program, classDate, stampedBy: who.account.id });
    return json(result);
  } catch (err) {
    console.error(err);
    return json({ error: 'Could not stamp attendance.' }, { status: 502 });
  }
}
