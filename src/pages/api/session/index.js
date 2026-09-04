// POST /api/session — cookie → fresh 4-hour member access token; slides the
// cookie so an active family is never logged out (SPEC §2.1.1).
import { COOKIE, verify, sign, cookieOpts, refresh, json, GUARDIAN_MAX_AGE, COACH_MAX_AGE } from '../../../lib/server/session.js';
export const prerender = false;

export async function POST({ cookies }) {
  const raw = cookies.get(COOKIE)?.value;
  const data = await verify(raw);
  if (!data?.refreshToken) return json({ accessToken: null }, { status: 401 });
  const t = await refresh(data.refreshToken);
  if (!t?.access_token) { cookies.delete(COOKIE, { path: '/' }); return json({ accessToken: null }, { status: 401 }); }
  const maxAge = data.role === 'coach' || data.role === 'admin' ? COACH_MAX_AGE : GUARDIAN_MAX_AGE;
  cookies.set(COOKIE, await sign({ ...data, refreshToken: t.refresh_token || data.refreshToken }), cookieOpts(maxAge));
  return json({ accessToken: { value: t.access_token, expiresAt: Math.floor(Date.now() / 1000) + (t.expires_in || 14400) } });
}
