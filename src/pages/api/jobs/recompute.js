// POST (and GET for Vercel cron) /api/jobs/recompute
// Nightly snapshot + leaderboard rebuild. Guarded by EXPORT_SECRET or the
// Vercel cron header. 501 without WIX_CLIENT_SECRET.
//
// vercel.json cron: "30 7 * * *" is 07:30 UTC, which is 03:30 America/New_York
// during EDT (Batizado season) and 02:30 during EST. Vercel cron is UTC-only.
import { json } from '../../../lib/server/session.js';
import { missingSecret, demoResponse } from '../../../lib/server/demo-guard.js';
import { recomputeAll } from '../../../lib/server/lms.js';
export const prerender = false;

function authorized(request) {
  if (request.headers.get('x-vercel-cron') === '1') return true;
  const secret = process.env.EXPORT_SECRET || '';
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const header = request.headers.get('x-export-secret') || '';
  return auth === `Bearer ${secret}` || header === secret;
}

async function run(request) {
  if (missingSecret()) return demoResponse();
  if (!authorized(request)) return json({ error: 'Not allowed.' }, { status: 401 });
  try {
    return json(await recomputeAll());
  } catch (err) {
    console.error(err);
    return json({ error: 'Recompute failed.' }, { status: 502 });
  }
}

export async function POST({ request }) { return run(request); }
// Vercel Cron invokes GET (UTC schedule in vercel.json).
export async function GET({ request }) { return run(request); }
