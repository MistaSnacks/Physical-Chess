// ledger.js — build a player's trusted ledger from Wix rows (SPEC-v3
// R15.10-11). Pure; used by wixRepo in the browser and by lms.js on the server
// so the family view, the coach roster, readiness and the CSV agree.
//
// Members can insert into lms-events, so anything only a coach may grant is
// ignored there. Coach grants come from admin-write collections instead:
//   lms-corda-awards  → corda.awarded
//   lms-attendance    → attendance.stamped
//   lms-patch-awards  → patch.earned (source coach)
//   lms-coach-events  → coach.xp, coach.note
// XP is then re-scored from type and payload (scoreLedger), never trusted
// from the stored `xp` column.
import { EVENT, LEARNER_EVENTS, starsFor } from '../game/events.js';
import { scoreLedger, allowedXp } from '../game/xp-rules.js';
import { PATCHES } from '../../content/patches.js';

/** Types a member-written lms-events row may never carry. */
export const COACH_ONLY_TYPES = new Set([EVENT.CORDA_AWARDED, EVENT.ATTENDANCE, EVENT.COACH_XP, EVENT.COACH_NOTE]);
/** The only types lms-coach-events holds. */
export const COACH_EVENT_TYPES = new Set([EVENT.COACH_XP, EVENT.COACH_NOTE]);
/** Patches only a coach can give (rule type "coach"): batizado-2026, helper. */
export const COACH_PATCH_KEYS = new Set(PATCHES.filter((p) => p.rule?.type === 'coach').map((p) => p.key));

/** True for an event a member must not be able to grant themselves. */
export function isCoachOnly(event) {
  if (!event) return true;
  if (COACH_ONLY_TYPES.has(event.type)) return true;
  if (event.type === EVENT.PATCH_EARNED) {
    if (event.source === 'coach') return true;
    if (COACH_PATCH_KEYS.has(event.payload?.patchKey)) return true;
  }
  return false;
}

/**
 * Member-written lms-events rows minus coach-only types. With `ownerId`
 * (the player's guardian member ID), rows owned by someone else are dropped
 * too, so one family cannot write into another child's ledger.
 */
export function memberEvents(events = [], { ownerId = null } = {}) {
  return events.filter((e) => e && !isCoachOnly(e) && !(ownerId && e._owner && e._owner !== ownerId));
}

function isoDate(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value.$date) return value.$date;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function parsePayload(value) {
  if (value == null || value === '') return {};
  if (typeof value === 'string') { try { return JSON.parse(value); } catch { return {}; } }
  return typeof value === 'object' && !Array.isArray(value) ? value : {};
}

const rowId = (r) => r._id || r.id || '';

function mirror(row, type, payload, occurredAt, accountId, clientEventId) {
  return {
    clientEventId,
    playerId: row.playerId,
    accountId: accountId || row.accountId || '',
    type,
    moduleId: null,
    lessonId: null,
    payload,
    xp: 0,
    stars: 0,
    occurredAt,
    source: 'coach',
  };
}

export function cordaRowToEvent(row, accountId) {
  const at = isoDate(row.awardedAt) || isoDate(row._createdDate);
  return mirror(row, EVENT.CORDA_AWARDED, { corda: row.corda, event: row.event || '', note: row.note || '' }, at, accountId, `corda:${rowId(row)}`);
}

export function attendanceRowToEvent(row, accountId) {
  const at = isoDate(row.stampedAt) || isoDate(row._createdDate) || (row.classDate ? `${row.classDate}T16:00:00.000Z` : null);
  return mirror(row, EVENT.ATTENDANCE, { program: row.program || '', classDate: row.classDate || '' }, at, accountId, `attendance:${rowId(row)}`);
}

export function patchAwardRowToEvent(row, accountId) {
  const at = isoDate(row.earnedAt) || isoDate(row._createdDate);
  return mirror(row, EVENT.PATCH_EARNED, { patchKey: row.patchKey, note: row.note || '' }, at, accountId, `patch-award:${rowId(row)}`);
}

/** lms-coach-events row → event, or null for any type that does not belong there. */
export function coachEventRowToEvent(row, accountId) {
  if (!COACH_EVENT_TYPES.has(row.type)) return null;
  const at = isoDate(row.occurredAt) || isoDate(row._createdDate);
  return mirror(row, row.type, parsePayload(row.payload), at, accountId, row.clientEventId || `coach-event:${rowId(row)}`);
}

/**
 * The ledger derivePlayer() should see for one player.
 * @param {object} p
 * @param {Array} p.events       lms-events rows already in event shape (may carry _owner)
 * @param {Array} p.corda        lms-corda-awards rows
 * @param {Array} p.attendance   lms-attendance rows
 * @param {Array} p.patchAwards  lms-patch-awards rows
 * @param {Array} p.coachEvents  lms-coach-events rows
 * @param {string} [p.ownerId]   the player's guardian member ID (server only)
 * @param {string} [p.accountId] the player's account ID for mirrored events
 */
export function buildLedger({ events = [], corda = [], attendance = [], patchAwards = [], coachEvents = [], ownerId = null, accountId = '' } = {}) {
  const fromMembers = memberEvents(events, { ownerId }).map(({ _owner, ...e }) => e);
  const mirrored = [
    ...corda.filter((r) => r.corda).map((r) => cordaRowToEvent(r, accountId)),
    ...attendance.map((r) => attendanceRowToEvent(r, accountId)),
    ...patchAwards.filter((r) => r.patchKey).map((r) => patchAwardRowToEvent(r, accountId)),
    ...coachEvents.map((r) => coachEventRowToEvent(r, accountId)).filter(Boolean),
  ].filter((e) => e.occurredAt);
  const seen = new Set();
  const all = [];
  for (const e of [...fromMembers, ...mirrored]) {
    if (seen.has(e.clientEventId)) continue;
    seen.add(e.clientEventId);
    all.push(e);
  }
  all.sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));
  return scoreLedger(all);
}

/** Group rows by playerId (for one query across a whole roster). */
export function byPlayer(rows = []) {
  const map = new Map();
  for (const r of rows) {
    if (!r?.playerId) continue;
    if (!map.has(r.playerId)) map.set(r.playerId, []);
    map.get(r.playerId).push(r);
  }
  return map;
}

/** What Class mode may write for a child: learner events and their side effects. */
export const CLASS_EVENT_TYPES = new Set([...LEARNER_EVENTS, EVENT.MODULE_CLEARED, EVENT.STREAK_WEEK, EVENT.PATCH_EARNED]);
const SYSTEM_TYPES = new Set([EVENT.MODULE_CLEARED, EVENT.STREAK_WEEK, EVENT.PATCH_EARNED]);
const shortText = (v, n = 80) => (typeof v === 'string' && v ? v.slice(0, n) : null);

/**
 * POST /api/coach/class/events body → events safe to append under the
 * child's account (R15.4). Drops coach-only and unknown types, duplicates,
 * bad dates and oversized payloads; pins playerId/accountId; tags the source
 * `class` (side effects keep `system`); scores XP server-side.
 * @param {Array} events   what the tablet sent
 * @param {object} ctx     { playerId, accountId, existingIds: Set, prior: Event[], now: Date }
 */
export function sanitizeClassEvents(events, { playerId, accountId = '', existingIds = new Set(), prior = [], now = new Date() } = {}) {
  const accepted = [];
  const seen = new Set(existingIds);
  const latest = now.getTime() + 5 * 60 * 1000;
  for (const e of Array.isArray(events) ? events.slice(0, 200) : []) {
    if (!e || typeof e !== 'object' || !CLASS_EVENT_TYPES.has(e.type) || isCoachOnly(e)) continue;
    const id = shortText(e.clientEventId, 100);
    if (!id || seen.has(id)) continue;
    const at = new Date(e.occurredAt);
    if (Number.isNaN(at.getTime()) || at.getTime() > latest) continue;
    const payload = parsePayload(e.payload);
    if (JSON.stringify(payload).length > 4000) continue;
    const event = {
      clientEventId: id,
      playerId,
      accountId,
      type: e.type,
      moduleId: shortText(e.moduleId),
      lessonId: shortText(e.lessonId),
      payload,
      xp: 0,
      stars: starsFor(e.type, payload),
      occurredAt: at.toISOString(),
      source: SYSTEM_TYPES.has(e.type) && e.source === 'system' ? 'system' : 'class',
    };
    event.xp = allowedXp(event, [...prior, ...accepted]);
    seen.add(id);
    accepted.push(event);
  }
  return accepted;
}
