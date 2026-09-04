// DELETE /api/players/:id — guardian who owns the player, or admin.
import { json } from '../../../lib/server/session.js';
import { missingSecret, demoResponse } from '../../../lib/server/demo-guard.js';
import { caller, hasRole } from '../../../lib/server/authz.js';
import { erasePlayer, getPlayerDetail } from '../../../lib/server/lms.js';
export const prerender = false;

export async function DELETE({ request, params }) {
  if (missingSecret()) return demoResponse();
  const who = await caller(request);
  if (who.error) return who.error;
  try {
    const detail = await getPlayerDetail(params.id);
    if (!detail) return json({ error: 'Not found.' }, { status: 404 });
    const owns = detail.player.accountId === who.account.id;
    if (!owns && !hasRole(who.account, ['admin'])) return json({ error: 'Not allowed.' }, { status: 403 });
    await erasePlayer(params.id, { tombstoneAccountId: who.account.id });
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: 'Could not delete this player.' }, { status: 502 });
  }
}
