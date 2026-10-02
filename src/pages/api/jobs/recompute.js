// POST (and GET for Vercel cron) /api/jobs/recompute
// Nightly snapshot + leaderboard rebuild. 501 without WIX_CLIENT_SECRET.
// R15.7: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` once
// CRON_SECRET is set in the project env; manual runs may use EXPORT_SECRET
// (bearer or x-export-secret). The x-vercel-cron header proves nothing (any
// client can send it) and is no longer trusted. See cronAuthorized().
//
// vercel.json cron: "30 7 * * *" is 07:30 UTC, which is 03:30 America/New_York
// during EDT (Batizado season) and 02:30 during EST. Vercel cron is UTC-only.
import { json } from '../../../lib/server/session.js';
import { missingSecret, demoResponse } from '../../../lib/server/demo-guard.js';
import { cronAuthorized } from '../../../lib/server/policy.js';
import { recomputeAll } from '../../../lib/server/lms.js';
export const prerender = false;

async function run(request) {
  if (missingSecret()) return demoResponse();
  if (!cronAuthorized(request.headers, process.env)) return json({ error: 'Not allowed.' }, { status: 401 });
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
