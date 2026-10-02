// /api/players — create and edit a family's players (SPEC-v3 R15.2, R15.12).
//   POST   { firstName, apelido?, avatar?, birthYear?, mayPlayInClass?, inviteCode? }
//   PATCH  { id, ...same fields, leaveProgram?, active? }
// The program is set only from a valid invite code, checked here against
// the admin-read lms-programs rows; `program`, `accountId` and snapshot
// fields are rejected. Rows get accountId = caller's account and _owner =
// caller's member ID. lms-players is admin-write with author-only reads.
import { json } from '../../../lib/server/session.js';
import { missingSecret, demoResponse } from '../../../lib/server/demo-guard.js';
import { caller, hasRole } from '../../../lib/server/authz.js';
import { pickPlayerInput } from '../../../lib/server/policy.js';
import { createPlayerFor, updatePlayerFor, playerRow, resolveInvite } from '../../../lib/server/lms.js';
export const prerender = false;

const badInvite = () => json({ error: 'That invite code does not match a class.', code: 'INVITE' }, { status: 400 });

export async function POST({ request }) {
  if (missingSecret()) return demoResponse();
  const who = await caller(request);
  if (who.error) return who.error;
  const input = pickPlayerInput(await request.json().catch(() => null), { create: true });
  if (input.error) return json({ error: input.error, rejected: input.rejected }, { status: 400 });
  try {
    let program = null;
    if (input.inviteCode) {
      const prog = await resolveInvite(input.inviteCode);
      if (!prog) return badInvite();
      program = prog.key;
    }
    const player = await createPlayerFor({ account: who.account, memberId: who.member.id, fields: input.fields, program });
    return json({ player }, { status: 201 });
  } catch (err) {
    console.error(err);
    return json({ error: 'Could not add the player.' }, { status: 502 });
  }
}

export async function PATCH({ request }) {
  if (missingSecret()) return demoResponse();
  const who = await caller(request);
  if (who.error) return who.error;
  const body = await request.json().catch(() => null);
  if (!body?.id || typeof body.id !== 'string') return json({ error: 'id is required.' }, { status: 400 });
  const input = pickPlayerInput(body);
  if (input.error) return json({ error: input.error, rejected: input.rejected }, { status: 400 });
  try {
    const current = await playerRow(body.id);
    if (!current) return json({ error: 'Not found.' }, { status: 404 });
    const owns = current.accountId === who.account.id;
    if (!owns && !hasRole(who.account, ['admin'])) return json({ error: 'Not allowed.' }, { status: 403 });
    let program;
    if (input.inviteCode) {
      const prog = await resolveInvite(input.inviteCode);
      if (!prog) return badInvite();
      program = prog.key;
    } else if (input.leaveProgram) {
      program = null;
    }
    const player = await updatePlayerFor(body.id, { fields: input.fields, program });
    return json({ player });
  } catch (err) {
    console.error(err);
    return json({ error: 'Could not save the player.' }, { status: 502 });
  }
}
