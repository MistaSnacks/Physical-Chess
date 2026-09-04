// GET /api/export?scope=program|all&format=csv|json&what=players|events&program=
import { json } from '../../lib/server/session.js';
import { missingSecret, demoResponse } from '../../lib/server/demo-guard.js';
import { caller, canSeeProgram, hasRole } from '../../lib/server/authz.js';
import { exportPayload } from '../../lib/server/lms.js';
export const prerender = false;

export async function GET({ request, url }) {
  if (missingSecret()) return demoResponse();
  const who = await caller(request);
  if (who.error) return who.error;
  if (!hasRole(who.account, ['coach', 'admin'])) return json({ error: 'Coach only.' }, { status: 403 });
  const scope = url.searchParams.get('scope') === 'all' ? 'all' : 'program';
  const format = url.searchParams.get('format') === 'json' ? 'json' : 'csv';
  const what = url.searchParams.get('what') === 'events' ? 'events' : 'players';
  const program = url.searchParams.get('program') || '';
  if (scope === 'program' && !program) return json({ error: 'program is required for scope=program.' }, { status: 400 });
  if (scope === 'program' && !canSeeProgram(who.account, program)) return json({ error: 'Not your program.' }, { status: 403 });
  if (scope === 'all' && who.account.role !== 'admin' && !(who.account.programs || []).length) {
    return json({ error: 'No programs assigned.' }, { status: 403 });
  }
  try {
    const body = await exportPayload({ scope, what, program, format, account: who.account });
    const filename = `physical-chess-${what}-${scope === 'all' ? 'all' : program}.${format}`;
    const type = format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json';
    return new Response(body, {
      headers: {
        'Content-Type': type,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error(err);
    return json({ error: 'Export failed.' }, { status: 502 });
  }
}
