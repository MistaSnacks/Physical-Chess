// wixRepo.js — Wix Members (identity) + Wix CMS collections (data).
// Reads run as the logged-in member, so Wix's author-scoped permissions
// guarantee a family only ever sees its own rows. Writes to accounts and
// players go through /api/account and /api/players (SPEC-v3 R15.2): those
// collections are admin-write, so a member cannot give themselves a role, a
// program or another family's child. Anything cross-family goes through
// /api/* too (server, client secret). SPEC §2, §3.
import { wix, getMemberSession, signOutMember } from '../wix.js';
import { buildLedger } from './ledger.js';

const C = {
  accounts: 'lms-accounts',
  players: 'lms-players',
  events: 'lms-events',
  cordaAwards: 'lms-corda-awards',
  attendance: 'lms-attendance',
  patchAwards: 'lms-patch-awards',
  coachEvents: 'lms-coach-events',
};

const PAGE = 100;

async function all(query) {
  const out = [];
  let res = await query.limit(PAGE).find();
  out.push(...res.items);
  while (res.hasNext()) {
    res = await res.next();
    out.push(...res.items);
  }
  return out;
}

/** Mirror collections may not exist until Camren applies WP15's schema; read them softly. */
async function allOrEmpty(query) {
  try { return await all(query); } catch (err) { console.warn('ledger read skipped', err?.message || err); return []; }
}

const fromAccount = (r) => ({
  id: r._id || r.id,
  memberId: r.memberId,
  role: r.role || 'guardian',
  displayName: r.displayName || '',
  email: r.email || '',
  phone: r.phone || '',
  programs: r.programs || [],
  leaderboardOptIn: r.leaderboardOptIn === true,
  demo: false,
});
const fromPlayer = (r) => ({
  id: r._id || r.id,
  accountId: r.accountId,
  firstName: r.firstName,
  apelido: r.apelido || '',
  avatar: r.avatar || { animal: 'frog', color: 'lime' },
  birthYear: r.birthYear || null,
  program: r.program || null,
  startedAt: r.startedAt || null,
  active: r.active !== false,
  mayPlayInClass: r.mayPlayInClass !== false,
});
const fromEvent = (r) => ({
  clientEventId: r.clientEventId,
  playerId: r.playerId,
  accountId: r.accountId,
  type: r.type,
  moduleId: r.moduleId || null,
  lessonId: r.lessonId || null,
  payload: r.payload ? (typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload) : {},
  xp: r.xp || 0,
  stars: r.stars || 0,
  occurredAt: r.occurredAt instanceof Date ? r.occurredAt.toISOString() : r.occurredAt,
  source: r.source || 'app',
  _id: r._id,
});

function toEventRow(e, playerId) {
  return {
    clientEventId: e.clientEventId,
    playerId,
    accountId: e.accountId,
    type: e.type,
    moduleId: e.moduleId || null,
    lessonId: e.lessonId || null,
    payload: JSON.stringify(e.payload || {}),
    xp: e.xp || 0,
    stars: e.stars || 0,
    occurredAt: new Date(e.occurredAt),
    source: e.source || 'app',
  };
}

/** JSON call to our own /api routes with the member bearer token. */
async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.code = data?.code || null;
    err.data = data;
    throw err;
  }
  return data;
}

// Players of the signed-in family (from the last getSession). Any other
// player is a Class-mode player and is read and written through the
// coach-scoped routes instead of the member's own collections.
let familyIds = null;

async function isFamilyPlayer(repo, playerId) {
  if (!familyIds) await repo.getSession();
  return Boolean(familyIds && familyIds.has(playerId));
}

export const wixRepo = {
  name: 'wix',
  isDemo: false,

  async getSession() {
    const member = await getMemberSession();
    if (!member) { familyIds = null; return null; }
    const rows = await all(wix.items.query(C.accounts).eq('memberId', member._id));
    // First login: the server creates the row (role guardian, _owner = member).
    const account = rows.length ? fromAccount(rows[0]) : fromAccount((await api('/api/account', { method: 'POST' })).account);
    const players = (await all(wix.items.query(C.players).eq('accountId', account.id).ne('active', false))).map(fromPlayer);
    familyIds = new Set(players.map((p) => p.id));
    return { account, players };
  },

  async signOut() { familyIds = null; await signOutMember(); },

  async checkInvite(code) {
    const data = await api('/api/players/invite', { method: 'POST', body: { code } });
    return data?.program || null;
  },

  async createPlayer(data) {
    const { player } = await api('/api/players', {
      method: 'POST',
      body: {
        firstName: data.firstName,
        apelido: data.apelido || '',
        avatar: data.avatar || { animal: 'frog', color: 'lime' },
        birthYear: data.birthYear || null,
        mayPlayInClass: data.mayPlayInClass !== false,
        inviteCode: data.inviteCode || '',
      },
    });
    familyIds?.add(player.id);
    return fromPlayer(player);
  },
  async updatePlayer(id, patch) {
    const { player } = await api('/api/players', { method: 'PATCH', body: { ...patch, id } });
    return fromPlayer(player);
  },
  async deletePlayer(id) {
    // Full erasure (SPEC §3.3) runs on the server with the client secret so
    // it can delete ledger rows the member can only read. Here we mark
    // inactive immediately and ask the server to finish.
    await this.updatePlayer(id, { active: false });
    await fetch('/api/players/' + encodeURIComponent(id), { method: 'DELETE', headers: await authHeaders() }).catch(() => {});
    familyIds?.delete(id);
  },
  async listEvents(playerId) {
    const [events, corda, attendance, patchAwards, coachEvents] = await Promise.all([
      all(wix.items.query(C.events).eq('playerId', playerId).ascending('occurredAt')),
      allOrEmpty(wix.items.query(C.cordaAwards).eq('playerId', playerId)),
      allOrEmpty(wix.items.query(C.attendance).eq('playerId', playerId)),
      allOrEmpty(wix.items.query(C.patchAwards).eq('playerId', playerId)),
      allOrEmpty(wix.items.query(C.coachEvents).eq('playerId', playerId)),
    ]);
    return buildLedger({ events: events.map(fromEvent), corda, attendance, patchAwards, coachEvents });
  },
  /** Class mode (R15.4): the full ledger of a turma player from another family. */
  async listClassEvents(playerId) {
    if (await isFamilyPlayer(this, playerId)) return this.listEvents(playerId);
    const data = await api('/api/coach/class/players/' + encodeURIComponent(playerId));
    return data?.events || [];
  },
  async appendEvents(playerId, events) {
    if (!events?.length) return [];
    if (!(await isFamilyPlayer(this, playerId))) {
      let data;
      try {
        data = await api('/api/coach/class/events', { method: 'POST', body: { playerId, events } });
      } catch (err) {
        // A refusal (not your class, unticked "may play in class", player gone)
        // will never succeed; drop it so one child cannot block the outbox.
        // Network errors, 401 and 5xx throw and retry on the next flush.
        if ([400, 403, 404].includes(err.status)) { console.warn('class events refused', err.status, playerId); return []; }
        throw err;
      }
      const accepted = new Set(data?.accepted || []);
      return events.filter((e) => accepted.has(e.clientEventId));
    }
    const ids = events.map((e) => e.clientEventId).filter(Boolean);
    const existing = new Set();
    if (ids.length) {
      // One query for the whole batch — never one round-trip per event.
      const found = await all(wix.items.query(C.events).hasSome('clientEventId', ids));
      for (const r of found) existing.add(r.clientEventId);
    }
    const fresh = events.filter((e) => !existing.has(e.clientEventId));
    if (!fresh.length) return [];
    const rows = fresh.map((e) => toEventRow(e, playerId));
    if (typeof wix.items.bulkInsert === 'function') {
      await wix.items.bulkInsert(C.events, rows);
    } else {
      for (const row of rows) await wix.items.insert(C.events, row);
    }
    return fresh;
  },
  async updateAccount(patch) {
    // PATCH /api/account accepts displayName, phone and leaderboardOptIn only;
    // anything else (role, programs, memberId) is rejected with a 400.
    const { account } = await api('/api/account', { method: 'PATCH', body: patch });
    return fromAccount(account);
  },
  async deleteAccount() {
    // WP6 implements DELETE /api/account (client secret: wipe players, ledger, member).
    const res = await fetch('/api/account', { method: 'DELETE', headers: await authHeaders() }).catch(() => null);
    if (!res || res.status === 404 || !res.ok) {
      const err = new Error('CONTACT_ACE');
      err.code = 'CONTACT_ACE';
      throw err;
    }
    await this.signOut();
  },
};

export async function authHeaders() {
  const tokens = wix.auth.getTokens();
  return { Authorization: `Bearer ${tokens?.accessToken?.value || ''}` };
}
