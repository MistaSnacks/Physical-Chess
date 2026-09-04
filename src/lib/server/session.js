// server/session.js — server-side half of SPEC §2.1.1. Runs only inside
// Astro server routes on Vercel. Holds the refresh token in a signed,
// httpOnly cookie; mints 4-hour access tokens on demand.
const enc = new TextEncoder();
const b64 = (buf) => Buffer.from(buf).toString('base64url');
const unb64 = (s) => Buffer.from(s, 'base64url');

export const COOKIE = 'pc_session';
export const PKCE_COOKIE = 'pc_pkce';
const DAY = 86400;
export const GUARDIAN_MAX_AGE = 180 * DAY;
export const COACH_MAX_AGE = 1 * DAY;

async function key() {
  const secret = process.env.SESSION_COOKIE_SECRET || '';
  if (!secret) throw new Error('SESSION_COOKIE_SECRET is not set');
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function sign(payload) {
  const body = b64(enc.encode(JSON.stringify(payload)));
  const sig = b64(await crypto.subtle.sign('HMAC', await key(), enc.encode(body)));
  return `${body}.${sig}`;
}
export async function verify(token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const ok = await crypto.subtle.verify('HMAC', await key(), unb64(sig), enc.encode(body));
  if (!ok) return null;
  try { return JSON.parse(unb64(body).toString('utf8')); } catch { return null; }
}

export function cookieOpts(maxAge) {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production' || (process.env.APP_ORIGIN || '').startsWith('https'), sameSite: 'lax', path: '/', maxAge };
}

export function randomString(bytes = 32) {
  return b64(crypto.getRandomValues(new Uint8Array(bytes)));
}
export async function codeChallenge(verifier) {
  return b64(await crypto.subtle.digest('SHA-256', enc.encode(verifier)));
}

const CLIENT_ID = () => process.env.PUBLIC_WIX_CLIENT_ID || '';

/** Anonymous visitor access token (needed to call Create Redirect Session). */
export async function visitorToken() {
  const res = await fetch('https://www.wixapis.com/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: CLIENT_ID(), grantType: 'anonymous' }) });
  const data = await res.json();
  return data.access_token;
}

/** Exchange an authorization code (PKCE) for member tokens. */
export async function exchangeCode({ code, codeVerifier, redirectUri }) {
  const res = await fetch('https://www.wixapis.com/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: CLIENT_ID(), grantType: 'authorization_code', code, codeVerifier, redirectUri }) });
  if (!res.ok) throw new Error(`token exchange failed: ${await res.text()}`);
  return res.json(); // { access_token, refresh_token, expires_in }
}

/** Mint a fresh access token from a refresh token. */
export async function refresh(refreshToken) {
  const res = await fetch('https://www.wixapis.com/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: CLIENT_ID(), grantType: 'refresh_token', refreshToken }) });
  if (!res.ok) return null;
  return res.json();
}

/** Server-to-server admin token from the OAuth app's client secret. */
export async function adminToken() {
  const res = await fetch('https://www.wixapis.com/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID(), client_secret: process.env.WIX_CLIENT_SECRET, instance_id: process.env.WIX_SITE_ID }) });
  if (!res.ok) throw new Error(`admin token failed: ${await res.text()}`);
  return (await res.json()).access_token;
}

/** Who is calling? Verifies the bearer member token with Wix. */
export async function memberFromBearer(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const res = await fetch('https://www.wixapis.com/members/v1/members/my', { headers: { Authorization: token } });
  if (!res.ok) return null;
  return (await res.json()).member || null;
}

export const json = (data, init = {}) => new Response(JSON.stringify(data), { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } });
