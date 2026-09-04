import { COOKIE, json } from '../../lib/server/session.js';
export const prerender = false;
export async function POST({ cookies }) {
  cookies.delete(COOKIE, { path: '/' });
  return json({ ok: true });
}
