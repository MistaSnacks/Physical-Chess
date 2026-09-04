// wix.js — browser-side Wix SDK client (SPEC §2.1, §2.1.1).
// The refresh token never lives here: /auth/callback stores it in the
// httpOnly `pc_session` cookie and /api/session mints 4-hour access tokens.
// Until the OAuth app exists (client ID missing) the app runs in demo mode
// and nothing in this file executes.
import { createClient, OAuthStrategy } from '@wix/sdk';
import { items } from '@wix/data';
import { members } from '@wix/members';

export const CLIENT_ID = import.meta.env.PUBLIC_WIX_CLIENT_ID || '';

export const wix = createClient({
  modules: { items, members },
  auth: OAuthStrategy({ clientId: CLIENT_ID }),
});

let sessionPromise = null;

/** Ask the server for a fresh member access token (from the httpOnly cookie). */
export async function refreshAccessToken() {
  const res = await fetch('/api/session', { method: 'POST', credentials: 'same-origin' });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.accessToken) return null;
  wix.auth.setTokens({ accessToken: data.accessToken, refreshToken: { value: '', role: 'member' } });
  return data;
}

/** Current member or null. Caches per page load. */
export async function getMemberSession() {
  if (!CLIENT_ID) return null;
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const t = await refreshAccessToken();
      if (!t) return null;
      try {
        const { member } = await wix.members.getCurrentMember({ fieldsets: ['FULL'] });
        return member || null;
      } catch { return null; }
    })();
  }
  return sessionPromise;
}

export async function loginWithPassword(email, password) {
  return wix.auth.login({ email, password });
}

export async function registerWithPassword({ email, password, firstName, lastName }) {
  return wix.auth.register({ email, password, profile: { firstName, lastName } });
}

export async function sendPasswordReset(email) {
  return wix.auth.sendPasswordResetEmail(email, `${location.origin}/login?reset=1`);
}

export async function processVerification(verificationCode) {
  return wix.auth.processVerification({ verificationCode });
}

/**
 * After login/register SUCCESS: hand the session token to the server, which
 * runs the PKCE redirect flow and sets the cookie. Full-page redirect only
 * (the SDK's iframe exchange fails on iOS Safari).
 */
export async function beginRedirectExchange(sessionToken, next = '/who') {
  const res = await fetch('/api/session/start', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken, next }),
  });
  const data = await res.json();
  if (!data.redirectUrl) throw new Error(data.error || 'Could not start the sign-in redirect.');
  location.href = data.redirectUrl;
}

export async function signOutMember() {
  await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
  sessionPromise = null;
  try {
    const { logoutUrl } = await wix.auth.logout(`${location.origin}/`);
    location.href = logoutUrl;
  } catch {
    location.href = '/';
  }
}
