// DELETE /api/account — all players + lms-accounts row + Wix Delete Member.
import { json } from '../../lib/server/session.js';
import { missingSecret, demoResponse } from '../../lib/server/demo-guard.js';
import { caller } from '../../lib/server/authz.js';
import { eraseAccount } from '../../lib/server/lms.js';
export const prerender = false;

export async function DELETE({ request }) {
  if (missingSecret()) return demoResponse();
  const who = await caller(request);
  if (who.error) return who.error;
  try {
    await eraseAccount(who.account);
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: 'Could not delete this account.' }, { status: 502 });
  }
}
