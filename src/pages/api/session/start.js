// POST /api/session/start — after auth.login()/register() SUCCESS the page
// sends the Wix sessionToken; we start the PKCE redirect (mobile-safe) and
// return the URL to send the browser to. State + verifier live in a signed
// 10-minute cookie, single use.
// R15.8: `next` is reduced to a same-origin path by safeNext() before it is
// used in postFlowUrl (which used to be `${origin}${next}`, so `@evil.com`
// or `.evil.com` changed the host) and before it goes into the PKCE cookie.
import { PKCE_COOKIE, sign, cookieOpts, randomString, codeChallenge, visitorToken, json } from '../../../lib/server/session.js';
import { safeNext } from '../../../lib/server/policy.js';
export const prerender = false;

export async function POST({ request, cookies }) {
  const body = await request.json().catch(() => ({}));
  const { sessionToken } = body;
  if (!sessionToken) return json({ error: 'Missing session token.' }, { status: 400 });
  const origin = process.env.APP_ORIGIN || new URL(request.url).origin;
  const next = safeNext(body.next, origin);
  const redirectUri = `${origin}/auth/callback`;
  const verifier = randomString(32);
  const state = randomString(16);
  const challenge = await codeChallenge(verifier);
  const visitor = await visitorToken();
  const res = await fetch('https://www.wixapis.com/_api/redirects-api/v1/redirect-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authorization: visitor },
    body: JSON.stringify({
      auth: { authRequest: { clientId: process.env.PUBLIC_WIX_CLIENT_ID, codeChallenge: challenge, codeChallengeMethod: 'S256', responseMode: 'query', responseType: 'code', scope: 'offline_access', redirectUri, sessionToken, state } },
      callbacks: { postFlowUrl: new URL(next, origin).href },
    }),
  });
  const data = await res.json();
  const url = data?.redirectSession?.fullUrl;
  if (!url) return json({ error: 'Wix could not start the sign-in redirect.', detail: data }, { status: 502 });
  cookies.set(PKCE_COOKIE, await sign({ verifier, state, next, redirectUri }), cookieOpts(600));
  return json({ redirectUrl: url });
}
