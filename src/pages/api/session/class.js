// POST /api/session/class — Class mode started on this device (SPEC §2.4,
// SPEC-v3 R15.3, D12). Re-signs the session cookie with an 8-hour cap that
// never slides: /api/session keeps the cookie inside it and ends the session
// when it passes, even if Class mode was ended earlier. Coach or admin only.
// Demo mode (no SESSION_COOKIE_SECRET) answers 501 and the browser ignores it.
import { COOKIE, verify, sign, cookieOpts, json, sessionMaxAge, classExpired, classSessionPayload } from '../../../lib/server/session.js';
import { missingSecret, demoResponse } from '../../../lib/server/demo-guard.js';
import { roleForMember } from '../../../lib/server/authz.js';
import { isStaff } from '../../../lib/server/policy.js';
export const prerender = false;

export async function POST({ cookies }) {
  let data = null;
  try { data = await verify(cookies.get(COOKIE)?.value); } catch { return demoResponse(); }
  if (!data?.refreshToken) return json({ error: 'Not signed in.' }, { status: 401 });
  if (classExpired(data)) { cookies.delete(COOKIE, { path: '/' }); return json({ error: 'Session ended.' }, { status: 401 }); }
  let role = data.role;
  if (data.memberId && !missingSecret()) {
    try { role = await roleForMember(data.memberId); } catch (err) { console.warn('class session role lookup failed', err?.message || err); }
  }
  if (!isStaff(role)) return json({ error: 'Coach only.' }, { status: 403 });
  const next = classSessionPayload({ ...data, role });
  const maxAge = sessionMaxAge(next);
  cookies.set(COOKIE, await sign(next), cookieOpts(maxAge));
  return json({ ok: true, classUntil: next.classUntil, maxAge });
}
