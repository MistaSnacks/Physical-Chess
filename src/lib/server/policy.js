// policy.js — the pure rules behind the server routes (SPEC-v3 WP15). No
// network, no env reads at import time, so `npm test` covers every branch.
// Routes in src/pages/api/** call these; the Wix calls stay in lms.js.
import { ANIMALS, AVATAR_COLORS } from '../avatar.js';

const DAY = 86400;
export const GUARDIAN_MAX_AGE = 180 * DAY;
export const COACH_MAX_AGE = 1 * DAY;
export const CLASS_MAX_AGE = 8 * 3600; // D12: shared class tablets

// ---------------------------------------------------------------- R15.8

/**
 * Where to send the browser after sign-in. Only a same-origin path is
 * allowed; anything else falls back. Rejects control characters and
 * backslashes before parsing, because URL parsers drop tabs and newlines
 * and read `\` as `/`, which turns `/\t/evil.com` into `//evil.com`.
 */
export function safeNext(next, origin, fallback = '/who') {
  if (typeof next !== 'string' || !next) return fallback;
  if (/[\u0000-\u001F\u007F\\]/.test(next)) return fallback;
  if (!next.startsWith('/') || next.startsWith('//')) return fallback;
  let base;
  let url;
  try {
    base = new URL(origin);
    url = new URL(next, base);
  } catch {
    return fallback;
  }
  if (url.origin !== base.origin) return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}

// ---------------------------------------------------------------- R15.1

export function isStaff(role) {
  return role === 'coach' || role === 'admin';
}

/** Admin sees everything; a coach only their programs. No program = admin only. */
export function canSeeProgram(account, program) {
  if (!account) return false;
  if (account.role === 'admin') return true;
  if (!program) return false;
  return (account.programs || []).includes(program);
}

/**
 * Which programs a roster request may read.
 *   { programs: null }       admin, no program: every player (incl. no program)
 *   { programs: ['a', ...] } these programs only ([] means an empty roster)
 *   { error: 403 }           asked for a program the caller cannot see
 */
export function rosterScope(account, program) {
  if (program) return canSeeProgram(account, program) ? { programs: [program] } : { error: 403 };
  if (account?.role === 'admin') return { programs: null };
  return { programs: [...(account?.programs || [])] };
}

/** Wix Data filter for a rosterScope() result (null when nothing to read). */
export function rosterFilter(scope) {
  if (!scope || scope.error) return null;
  const active = { active: { $ne: false } };
  if (scope.programs === null) return active;
  if (!scope.programs.length) return null;
  if (scope.programs.length === 1) return { ...active, program: { $eq: scope.programs[0] } };
  return { ...active, program: { $in: scope.programs } };
}

// ---------------------------------------------------------------- R15.2

export const ACCOUNT_PATCH_FIELDS = ['displayName', 'phone', 'leaderboardOptIn'];
const PRIVILEGED_ACCOUNT_FIELDS = ['role', 'programs', 'memberId'];

/**
 * PATCH /api/account body → { patch } or { error, rejected }. Only the three
 * safe settings pass; role, programs, memberId or any other key is a 400.
 */
export function pickAccountPatch(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Send a JSON object.', rejected: [] };
  const keys = Object.keys(body);
  const privileged = keys.filter((k) => PRIVILEGED_ACCOUNT_FIELDS.includes(k));
  if (privileged.length) return { error: `Not allowed: ${privileged.join(', ')}.`, rejected: privileged };
  const unknown = keys.filter((k) => !ACCOUNT_PATCH_FIELDS.includes(k));
  if (unknown.length) return { error: `Unknown fields: ${unknown.join(', ')}.`, rejected: unknown };
  const patch = {};
  if ('displayName' in body) {
    if (typeof body.displayName !== 'string') return { error: 'displayName must be text.', rejected: ['displayName'] };
    patch.displayName = body.displayName.trim().slice(0, 80);
  }
  if ('phone' in body) {
    if (typeof body.phone !== 'string') return { error: 'phone must be text.', rejected: ['phone'] };
    patch.phone = body.phone.trim().slice(0, 40);
  }
  if ('leaderboardOptIn' in body) {
    if (typeof body.leaderboardOptIn !== 'boolean') return { error: 'leaderboardOptIn must be true or false.', rejected: ['leaderboardOptIn'] };
    patch.leaderboardOptIn = body.leaderboardOptIn;
  }
  if (!Object.keys(patch).length) return { error: 'Nothing to save.', rejected: [] };
  return { patch };
}

const PLAYER_CREATE_FIELDS = ['firstName', 'apelido', 'avatar', 'birthYear', 'mayPlayInClass', 'inviteCode'];
const PLAYER_PATCH_FIELDS = [...PLAYER_CREATE_FIELDS, 'leaveProgram', 'active'];

/**
 * POST/PATCH /api/players body → { fields, inviteCode, leaveProgram } or
 * { error, rejected }. `program`, `accountId`, snapshot and owner fields are
 * never accepted: the program comes only from a valid invite code.
 */
export function pickPlayerInput(body, { create = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Send a JSON object.', rejected: [] };
  const allowed = create ? PLAYER_CREATE_FIELDS : PLAYER_PATCH_FIELDS;
  const keys = Object.keys(body).filter((k) => !(k === 'id' && !create));
  const rejected = keys.filter((k) => !allowed.includes(k));
  if (rejected.length) return { error: `Not allowed: ${rejected.join(', ')}.`, rejected };
  const fields = {};
  if ('firstName' in body) {
    const v = typeof body.firstName === 'string' ? body.firstName.trim().slice(0, 40) : '';
    if (!v) return { error: 'firstName is required.', rejected: ['firstName'] };
    fields.firstName = v;
  } else if (create) {
    return { error: 'firstName is required.', rejected: ['firstName'] };
  }
  if ('apelido' in body) {
    if (body.apelido != null && typeof body.apelido !== 'string') return { error: 'apelido must be text.', rejected: ['apelido'] };
    fields.apelido = String(body.apelido || '').trim().slice(0, 40);
  }
  if ('avatar' in body) {
    const a = body.avatar || {};
    if (!ANIMALS.includes(a.animal) || !Object.prototype.hasOwnProperty.call(AVATAR_COLORS, a.color)) {
      return { error: 'Pick an avatar from the list.', rejected: ['avatar'] };
    }
    fields.avatar = { animal: a.animal, color: a.color };
  }
  if ('birthYear' in body) {
    if (body.birthYear == null || body.birthYear === '') fields.birthYear = null;
    else {
      const y = Number(body.birthYear);
      if (!Number.isInteger(y) || y < 2000 || y > 2030) return { error: 'birthYear looks wrong.', rejected: ['birthYear'] };
      fields.birthYear = y;
    }
  }
  if ('mayPlayInClass' in body) {
    if (typeof body.mayPlayInClass !== 'boolean') return { error: 'mayPlayInClass must be true or false.', rejected: ['mayPlayInClass'] };
    fields.mayPlayInClass = body.mayPlayInClass;
  }
  if ('active' in body) {
    if (typeof body.active !== 'boolean') return { error: 'active must be true or false.', rejected: ['active'] };
    fields.active = body.active;
  }
  if ('inviteCode' in body && body.inviteCode != null && typeof body.inviteCode !== 'string') {
    return { error: 'inviteCode must be text.', rejected: ['inviteCode'] };
  }
  const inviteCode = String(body.inviteCode || '').trim().slice(0, 40);
  const leaveProgram = body.leaveProgram === true;
  if (!create && !Object.keys(fields).length && !inviteCode && !leaveProgram) return { error: 'Nothing to save.', rejected: [] };
  return { fields, inviteCode, leaveProgram };
}

// ---------------------------------------------------------------- R15.6

/**
 * Every requested player must exist and already belong to `program`.
 * `players` are rows found for `playerIds` (any order, missing ones absent).
 */
export function attendanceCheck(playerIds, players, program) {
  const byId = new Map((players || []).map((p) => [p.id, p]));
  const missing = [];
  const mismatched = [];
  for (const id of playerIds || []) {
    const p = byId.get(id);
    if (!p) missing.push(id);
    else if (!program || p.program !== program) mismatched.push(id);
  }
  return { ok: !missing.length && !mismatched.length, missing, mismatched };
}

// ---------------------------------------------------------------- R15.9

/**
 * Leaderboard reads: admin any program; a coach their programs; anyone
 * (guardian or coach) the programs their own children are in.
 */
export function leaderboardAllowed(account, program, childPrograms = []) {
  if (!account || !program) return false;
  if (account.role === 'admin') return true;
  if (account.role === 'coach' && canSeeProgram(account, program)) return true;
  return childPrograms.includes(program);
}

// ---------------------------------------------------------------- R15.7

/** Constant-time string comparison (both sides are short secrets). */
export function timingSafeEqual(a, b) {
  const x = String(a);
  const y = String(b);
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i += 1) diff |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0);
  return diff === 0;
}

/**
 * /api/jobs/recompute guard. Vercel Cron sends `Authorization: Bearer
 * ${CRON_SECRET}` when CRON_SECRET is set in the project. Manual runs may use
 * EXPORT_SECRET (bearer or x-export-secret). The x-vercel-cron header is
 * never trusted: anyone can send it.
 */
export function cronAuthorized(headers, env = {}) {
  const get = (name) => (typeof headers?.get === 'function' ? headers.get(name) : headers?.[name]) || '';
  const auth = get('authorization');
  const cron = env.CRON_SECRET || '';
  if (cron && timingSafeEqual(auth, `Bearer ${cron}`)) return true;
  const manual = env.EXPORT_SECRET || '';
  if (manual && (timingSafeEqual(auth, `Bearer ${manual}`) || timingSafeEqual(get('x-export-secret'), manual))) return true;
  return false;
}

// ---------------------------------------------------------------- R15.3

/**
 * Cookie lifetime for a session payload. Coaches and admins 24 h, families
 * 180 days (D12). Once Class mode starts on a device the cookie can never
 * outlive `classUntil` (8 h), even after Class mode ends.
 */
export function sessionMaxAge({ role, classUntil } = {}, nowMs = Date.now()) {
  const base = isStaff(role) ? COACH_MAX_AGE : GUARDIAN_MAX_AGE;
  if (!classUntil) return base;
  const left = Math.floor((Number(classUntil) - nowMs) / 1000);
  return Math.max(0, Math.min(base, left));
}

export function classExpired({ classUntil } = {}, nowMs = Date.now()) {
  return Boolean(classUntil) && Number(classUntil) <= nowMs;
}

/** Payload for the Class-mode cookie: the 8 h cap starts once and never slides. */
export function classSessionPayload(data, nowMs = Date.now()) {
  const keep = data.classUntil && Number(data.classUntil) > nowMs;
  return { ...data, classUntil: keep ? Number(data.classUntil) : nowMs + CLASS_MAX_AGE * 1000 };
}

// ---------------------------------------------------------------- R15.4

/** A coach may open a child on a class tablet: their program, ticked "may play in class", active. */
export function classPlayerAllowed(account, player) {
  if (!account || !player) return false;
  if (!isStaff(account.role)) return false;
  if (player.active === false || player.mayPlayInClass === false) return false;
  return canSeeProgram(account, player.program);
}

/** Attendance dates are NY calendar days, YYYY-MM-DD (or omitted for today). */
export function validClassDate(value) {
  if (value == null || value === '') return true;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
