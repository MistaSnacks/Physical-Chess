// GET /api/me — verify the bearer member token and return the member + role.
// WP6 extends this with the lms-accounts row read via the admin token.
import { memberFromBearer, json } from '../../lib/server/session.js';
export const prerender = false;
export async function GET({ request }) {
  const member = await memberFromBearer(request);
  if (!member) return json({ error: 'Not signed in.' }, { status: 401 });
  return json({ member: { id: member._id || member.id, email: member.loginEmail, name: member.profile?.nickname || '' } });
}
