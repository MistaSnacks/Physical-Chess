// GET /api/me — member token → { member, account }. 501 without client secret.
import { memberFromBearer, json } from '../../lib/server/session.js';
import { missingSecret, demoResponse } from '../../lib/server/demo-guard.js';
import { accountForMemberId } from '../../lib/server/authz.js';
export const prerender = false;

export async function GET({ request }) {
  if (missingSecret()) return demoResponse();
  const member = await memberFromBearer(request);
  if (!member) return json({ error: 'Not signed in.' }, { status: 401 });
  const id = member._id || member.id;
  const account = await accountForMemberId(id);
  return json({
    member: { id, email: member.loginEmail, name: member.profile?.nickname || member.contact?.firstName || '' },
    account,
  });
}
