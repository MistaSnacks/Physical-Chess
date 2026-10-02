// POST /api/session — cookie → fresh 4-hour member access token; slides the
// cookie so an active family is never logged out (SPEC §2.1.1).
// R15.3: the role is re-read from lms-accounts on every refresh, so a promotion
// or demotion takes effect at the next page load. Coaches and admins 24 h,
// families 180 days; a Class-mode cookie never outlives its 8 h cap (D12).
import { COOKIE, verify, sign, cookieOpts, refresh, json, sessionMaxAge, classExpired } from '../../../lib/server/session.js';
import { sessionIdentity } from '../../../lib/server/authz.js';
export const prerender = false;

export async function POST({ cookies }) {
  const raw = cookies.get(COOKIE)?.value;
  let data = null;
  try { data = await verify(raw); } catch { data = null; }
  if (!data?.refreshToken) return json({ accessToken: null }, { status: 401 });
  if (classExpired(data)) { cookies.delete(COOKIE, { path: '/' }); return json({ accessToken: null }, { status: 401 }); }
  const t = await refresh(data.refreshToken);
  if (!t?.access_token) { cookies.delete(COOKIE, { path: '/' }); return json({ accessToken: null }, { status: 401 }); }
  const who = await sessionIdentity(t.access_token, { memberId: data.memberId, role: data.role });
  const next = { ...data, ...who, refreshToken: t.refresh_token || data.refreshToken };
  cookies.set(COOKIE, await sign(next), cookieOpts(sessionMaxAge(next)));
  return json({
    accessToken: { value: t.access_token, expiresAt: Math.floor(Date.now() / 1000) + (t.expires_in || 14400) },
    role: who.role,
    classUntil: next.classUntil || null,
  });
}
