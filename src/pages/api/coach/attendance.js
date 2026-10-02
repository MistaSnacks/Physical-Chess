// POST /api/coach/attendance { program, playerIds[], classDate? }
// R15.6: every player must already be in `program`; one stranger in the
// list rejects the whole request. Writes lms-attendance only (R15.10).
import { json } from '../../../lib/server/session.js';
import { missingSecret, demoResponse } from '../../../lib/server/demo-guard.js';
import { caller, canSeeProgram, hasRole } from '../../../lib/server/authz.js';
import { attendanceCheck, validClassDate } from '../../../lib/server/policy.js';
import { stampAttendance, playersByIds } from '../../../lib/server/lms.js';
export const prerender = false;

export async function POST({ request }) {
  if (missingSecret()) return demoResponse();
  const who = await caller(request);
  if (who.error) return who.error;
  if (!hasRole(who.account, ['coach', 'admin'])) return json({ error: 'Coach only.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const { playerIds, program, classDate } = body;
  if (!program || !Array.isArray(playerIds) || !playerIds.length || playerIds.length > 200) {
    return json({ error: 'program and playerIds are required.' }, { status: 400 });
  }
  if (!validClassDate(classDate)) return json({ error: 'classDate must be YYYY-MM-DD.' }, { status: 400 });
  if (!canSeeProgram(who.account, program)) return json({ error: 'Not your program.' }, { status: 403 });
  try {
    const ids = [...new Set(playerIds.map(String))];
    const players = await playersByIds(ids);
    const check = attendanceCheck(ids, players, program);
    if (!check.ok) {
      return json({ error: 'Every player must be in this program.', missing: check.missing, mismatched: check.mismatched }, { status: 403 });
    }
    const result = await stampAttendance({ players, program, classDate, stampedBy: who.account.id });
    return json(result);
  } catch (err) {
    console.error(err);
    return json({ error: 'Could not stamp attendance.' }, { status: 502 });
  }
}
