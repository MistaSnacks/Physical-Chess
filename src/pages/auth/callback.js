// GET /auth/callback?code&state — finish PKCE, store the refresh token in
// the httpOnly cookie, hand the browser back to the app.
// R15.3: the cookie's role comes from the lms-accounts row, so coaches and
// admins get the 24-hour cookie (D12). R15.8: `next` must be a same-origin path.
import { COOKIE, PKCE_COOKIE, verify, sign, cookieOpts, exchangeCode, sessionMaxAge } from '../../lib/server/session.js';
import { sessionIdentity } from '../../lib/server/authz.js';
import { safeNext } from '../../lib/server/policy.js';
export const prerender = false;

export async function GET({ url, cookies, redirect }) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const pk = await verify(cookies.get(PKCE_COOKIE)?.value);
  cookies.delete(PKCE_COOKIE, { path: '/' });
  if (!code || !pk || pk.state !== state) return redirect('/login?error=state', 302);
  const origin = process.env.APP_ORIGIN || url.origin;
  try {
    const t = await exchangeCode({ code, codeVerifier: pk.verifier, redirectUri: pk.redirectUri });
    const { memberId, role } = await sessionIdentity(t.access_token);
    const payload = { refreshToken: t.refresh_token, role, memberId, issuedAt: Date.now() };
    cookies.set(COOKIE, await sign(payload), cookieOpts(sessionMaxAge(payload)));
    return redirect(safeNext(pk.next, origin), 302);
  } catch (err) {
    console.error(err);
    return redirect('/login?error=exchange', 302);
  }
}
