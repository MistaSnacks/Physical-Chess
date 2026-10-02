// invite.js — match a class invite code to a program (SPEC-v3 R15.12). Pure.
// No codes live here: the demo repo passes its placeholder table and the
// server passes the admin-only lms-programs rows.

/** Codes compare without case, spaces or dashes ("k7q-m2x9" = "K7QM2X9"). */
export function normalizeInvite(code) {
  return String(code || '').toUpperCase().replace(/[\s-]+/g, '');
}

/**
 * @param {string} code    what the grown-up typed
 * @param {Array<{key: string, inviteCode?: string, active?: boolean}>} programs
 * @returns {string|null}  the program key, or null when nothing matches
 */
export function matchInvite(code, programs = []) {
  const c = normalizeInvite(code);
  if (!c) return null;
  const hit = programs.find((p) => p && p.key && p.active !== false && p.inviteCode && normalizeInvite(p.inviteCode) === c);
  return hit ? hit.key : null;
}
