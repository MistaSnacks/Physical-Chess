// POST /api/coach/class/events { playerId, events[] } — Class mode writes
// (SPEC-v3 R15.4). Same access rule as the class read route. Events are
// appended to lms-events under the child's account (_owner = guardian, so
// the family sees "done in class") with source `class`; coach-only and
// unknown types are dropped and XP is scored here (sanitizeClassEvents).
import { json } from '../../../../lib/server/session.js';
import { missingSecret, demoResponse } from '../../../../lib/server/demo-guard.js';
import { caller } from '../../../../lib/server/authz.js';
import { classPlayerAllowed } from '../../../../lib/server/policy.js';
import { playerRow, appendClassEvents } from '../../../../lib/server/lms.js';
export const prerender = false;

export async function POST({ request }) {
  if (missingSecret()) return demoResponse();
  const who = await caller(request);
  if (who.error) return who.error;
  const body = await request.json().catch(() => ({}));
  if (!body?.playerId || typeof body.playerId !== 'string' || !Array.isArray(body.events)) {
    return json({ error: 'playerId and events are required.' }, { status: 400 });
  }
  try {
    const player = await playerRow(body.playerId);
    if (!player) return json({ error: 'Not found.' }, { status: 404 });
    if (!classPlayerAllowed(who.account, player)) return json({ error: 'Not in your class.' }, { status: 403 });
    return json({ accepted: await appendClassEvents(player, body.events) });
  } catch (err) {
    console.error(err);
    return json({ error: 'Could not save class events.' }, { status: 502 });
  }
}
