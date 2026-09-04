// GET+POST /api/admin/roles
import { json } from '../../../lib/server/session.js';
import { missingSecret, demoResponse } from '../../../lib/server/demo-guard.js';
import { caller, hasRole } from '../../../lib/server/authz.js';
import { listAccounts, setRole } from '../../../lib/server/lms.js';
export const prerender = false;

export async function GET({ request }) {
  if (missingSecret()) return demoResponse();
  const who = await caller(request);
  if (who.error) return who.error;
  if (!hasRole(who.account, ['admin'])) return json({ error: 'Admin only.' }, { status: 403 });
  try {
    return json({ accounts: await listAccounts() });
  } catch (err) {
    console.error(err);
    return json({ error: 'Could not list accounts.' }, { status: 502 });
  }
}

export async function POST({ request }) {
  if (missingSecret()) return demoResponse();
  const who = await caller(request);
  if (who.error) return who.error;
  if (!hasRole(who.account, ['admin'])) return json({ error: 'Admin only.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  if (!body.memberId || !body.role) return json({ error: 'memberId and role are required.' }, { status: 400 });
  try {
    return json({ account: await setRole(body) });
  } catch (err) {
    console.error(err);
    return json({ error: err.message || 'Could not update role.' }, { status: err.status || 502 });
  }
}
