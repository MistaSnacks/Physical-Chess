// authz.js — member bearer → lms-accounts row → role check.
// The pure rules (program scope, roster scope, leaderboard scope) live in
// policy.js so `npm test` covers them; they are re-exported here.
import { memberFromBearer, memberFromAccessToken, json } from './session.js';
import { queryItems, C, fromAccountRow } from './wix-data.js';
import { missingSecret } from './demo-guard.js';
export { canSeeProgram, rosterScope, leaderboardAllowed } from './policy.js';

export async function accountForMemberId(memberId) {
  const rows = await queryItems(C.accounts, { filter: { memberId: { $eq: memberId } } }, { consistentRead: true, cap: 5 });
  return rows[0] ? fromAccountRow(rows[0]) : null;
}

/** Role from the account row (R15.3). No row yet = a new family = guardian. */
export async function roleForMember(memberId) {
  const account = await accountForMemberId(memberId);
  return account?.role || 'guardian';
}

/**
 * Member ID and role for a session cookie, read from the account row at
 * login and on every refresh (R15.3). If Wix cannot be reached the previous
 * role is kept, so a hiccup never upgrades anyone.
 */
export async function sessionIdentity(accessToken, known = {}) {
  let memberId = known.memberId || null;
  let role = known.role || 'guardian';
  try {
    if (!memberId) {
      const member = await memberFromAccessToken(accessToken);
      memberId = member?._id || member?.id || null;
    }
    if (memberId && !missingSecret()) role = await roleForMember(memberId);
  } catch (err) {
    console.warn('session role lookup failed; keeping', role, err?.message || err);
  }
  return { memberId, role };
}

export function memberSummary(member) {
  const id = member._id || member.id;
  return { id, email: member.loginEmail, name: member.profile?.nickname || member.contact?.firstName || '' };
}

export async function caller(request) {
  const member = await memberFromBearer(request);
  if (!member) return { error: json({ error: 'Not signed in.' }, { status: 401 }) };
  const summary = memberSummary(member);
  const account = await accountForMemberId(summary.id);
  if (!account) return { error: json({ error: 'No account.' }, { status: 403 }) };
  return { member: summary, account };
}

export function hasRole(account, roles) {
  return roles.includes(account.role);
}

export function coachPrograms(account) {
  if (account.role === 'admin') return null; // all
  return account.programs || [];
}
