// GET /api/leaderboard?program=&period=
// R15.9: admin any program; a coach their programs; a guardian (or a coach
// who is also a parent) only the programs their own children are in.
import { json } from '../../lib/server/session.js';
import { missingSecret, demoResponse } from '../../lib/server/demo-guard.js';
import { caller, hasRole, leaderboardAllowed } from '../../lib/server/authz.js';
import { computeLeaderboard, childPrograms } from '../../lib/server/lms.js';
export const prerender = false;

export async function GET({ request, url }) {
  if (missingSecret()) return demoResponse();
  const who = await caller(request);
  if (who.error) return who.error;
  const program = url.searchParams.get('program');
  const period = url.searchParams.get('period') || '';
  if (!program) return json({ error: 'program is required.' }, { status: 400 });
  if (!hasRole(who.account, ['guardian', 'coach', 'admin'])) return json({ error: 'Not allowed.' }, { status: 403 });
  try {
    const allowed = leaderboardAllowed(who.account, program)
      || leaderboardAllowed(who.account, program, await childPrograms(who.account.id));
    if (!allowed) return json({ error: 'Not your program.' }, { status: 403 });
    const data = await computeLeaderboard(program, period || undefined);
    return json(data);
  } catch (err) {
    console.error(err);
    return json({ error: 'Could not load the leaderboard.' }, { status: 502 });
  }
}
