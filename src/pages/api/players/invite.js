// POST /api/players/invite { code } → { program: { key, name } | null }
// Lets the add/edit player forms name the class before saving (R15.12).
// Signed-in members only; the codes themselves never leave the server.
import { json } from '../../../lib/server/session.js';
import { missingSecret, demoResponse } from '../../../lib/server/demo-guard.js';
import { caller } from '../../../lib/server/authz.js';
import { resolveInvite } from '../../../lib/server/lms.js';
export const prerender = false;

export async function POST({ request }) {
  if (missingSecret()) return demoResponse();
  const who = await caller(request);
  if (who.error) return who.error;
  const body = await request.json().catch(() => ({}));
  const code = typeof body?.code === 'string' ? body.code.slice(0, 40) : '';
  try {
    return json({ program: code.trim() ? await resolveInvite(code) : null });
  } catch (err) {
    console.error(err);
    return json({ error: 'Could not check the code.' }, { status: 502 });
  }
}
