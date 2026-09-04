// authz.js — member bearer → lms-accounts row → role check.
import { memberFromBearer, json } from './session.js';
import { queryItems, C, fromAccountRow } from './wix-data.js';

export async function accountForMemberId(memberId) {
  const rows = await queryItems(C.accounts, { filter: { memberId: { $eq: memberId } } }, { consistentRead: true, cap: 5 });
  return rows[0] ? fromAccountRow(rows[0]) : null;
}

export async function caller(request) {
  const member = await memberFromBearer(request);
  if (!member) return { error: json({ error: 'Not signed in.' }, { status: 401 }) };
  const id = member._id || member.id;
  const account = await accountForMemberId(id);
  if (!account) return { error: json({ error: 'No account.' }, { status: 403 }) };
  return {
    member: { id, email: member.loginEmail, name: member.profile?.nickname || member.contact?.firstName || '' },
    account,
  };
}

export function hasRole(account, roles) {
  return roles.includes(account.role);
}

export function coachPrograms(account) {
  if (account.role === 'admin') return null; // all
  return account.programs || [];
}

export function canSeeProgram(account, program) {
  if (account.role === 'admin') return true;
  if (!program) return true;
  return (account.programs || []).includes(program);
}
