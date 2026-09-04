// GET /auth/callback?code&state — finish PKCE, store the refresh token in
// the httpOnly cookie, hand the browser back to the app.
import { COOKIE, PKCE_COOKIE, verify, sign, cookieOpts, exchangeCode, GUARDIAN_MAX_AGE } from '../../lib/server/session.js';
export const prerender = false;

export async function GET({ url, cookies, redirect }) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const pk = await verify(cookies.get(PKCE_COOKIE)?.value);
  cookies.delete(PKCE_COOKIE, { path: '/' });
  if (!code || !pk || pk.state !== state) return redirect('/login?error=state', 302);
  try {
    const t = await exchangeCode({ code, codeVerifier: pk.verifier, redirectUri: pk.redirectUri });
    cookies.set(COOKIE, await sign({ refreshToken: t.refresh_token, role: 'guardian', issuedAt: Date.now() }), cookieOpts(GUARDIAN_MAX_AGE));
    return redirect(pk.next && pk.next.startsWith('/') ? pk.next : '/who', 302);
  } catch (err) {
    console.error(err);
    return redirect('/login?error=exchange', 302);
  }
}
