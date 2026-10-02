// /api/account — the signed-in family's lms-accounts row (SPEC-v3 R15.2).
//   POST   create the row on first login (role guardian, _owner = member).
//          Uses the bearer member directly: caller() needs a row to exist.
//   PATCH  save displayName, phone, leaderboardOptIn. role, programs,
//          memberId or any other field → 400.
//   DELETE all players + lms-accounts row + Wix Delete Member (SPEC §3.3).
// lms-accounts is admin-insert/admin-update with author-only reads, so these
// routes are the only way a member can create or change their row.
import { json, memberFromBearer } from '../../lib/server/session.js';
import { missingSecret, demoResponse } from '../../lib/server/demo-guard.js';
import { caller } from '../../lib/server/authz.js';
import { pickAccountPatch } from '../../lib/server/policy.js';
import { eraseAccount, ensureAccount, updateAccountSettings } from '../../lib/server/lms.js';
export const prerender = false;

export async function POST({ request }) {
  if (missingSecret()) return demoResponse();
  const member = await memberFromBearer(request);
  if (!member) return json({ error: 'Not signed in.' }, { status: 401 });
  try {
    const { account, created } = await ensureAccount(member);
    return json({ account }, { status: created ? 201 : 200 });
  } catch (err) {
    console.error(err);
    return json({ error: 'Could not create the account.' }, { status: 502 });
  }
}

export async function PATCH({ request }) {
  if (missingSecret()) return demoResponse();
  const who = await caller(request);
  if (who.error) return who.error;
  const picked = pickAccountPatch(await request.json().catch(() => null));
  if (picked.error) return json({ error: picked.error, rejected: picked.rejected }, { status: 400 });
  try {
    return json({ account: await updateAccountSettings(who.account, picked.patch) });
  } catch (err) {
    console.error(err);
    return json({ error: 'Could not save settings.' }, { status: 502 });
  }
}

export async function DELETE({ request }) {
  if (missingSecret()) return demoResponse();
  const who = await caller(request);
  if (who.error) return who.error;
  try {
    await eraseAccount(who.account);
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: 'Could not delete this account.' }, { status: 502 });
  }
}
