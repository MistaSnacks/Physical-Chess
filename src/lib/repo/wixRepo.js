// wixRepo.js — Wix Members (identity) + Wix CMS collections (data).
// Reads and writes run as the logged-in member, so Wix's author-scoped
// permissions guarantee a family only ever sees its own rows. Anything
// cross-family goes through /api/* (server, client secret). SPEC §2, §3.
import { wix, getMemberSession, signOutMember } from '../wix.js';

const C = {
  accounts: 'lms-accounts',
  players: 'lms-players',
  events: 'lms-events',
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

const fromAccount = (r) => ({
  id: r._id,
  memberId: r.memberId,
  role: r.role || 'guardian',
  displayName: r.displayName || '',
  email: r.email || '',
  phone: r.phone || '',
  programs: r.programs || [],
  leaderboardOptIn: r.leaderboardOptIn !== false,
  demo: false,
});
const fromPlayer = (r) => ({
  id: r._id,
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
  occurredAt: r.occurredAt,
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

export const wixRepo = {
  name: 'wix',
  isDemo: false,

  async getSession() {
    const member = await getMemberSession();
    if (!member) return null;
    let rows = await all(wix.items.query(C.accounts).eq('memberId', member._id));
    let account;
    if (rows.length) {
      account = fromAccount(rows[0]);
    } else {
      const created = await wix.items.insert(C.accounts, {
        memberId: member._id,
        role: 'guardian',
        displayName: [member.contact?.firstName, member.contact?.lastName].filter(Boolean).join(' ') || member.profile?.nickname || '',
        email: member.loginEmail || '',
        programs: [],
        leaderboardOptIn: true,
        consentAt: new Date(),
      });
      account = fromAccount(created);
    }
    const players = (await all(wix.items.query(C.players).eq('accountId', account.id).ne('active', false))).map(fromPlayer);
    return { account, players };
  },

  async signOut() { await signOutMember(); },

  async createPlayer(data) {
    const session = await this.getSession();
    const row = await wix.items.insert(C.players, {
      firstName: data.firstName,
      apelido: data.apelido || '',
      avatar: data.avatar || { animal: 'frog', color: 'lime' },
      birthYear: data.birthYear || null,
      program: data.program || null,
      mayPlayInClass: data.mayPlayInClass !== false,
      accountId: session.account.id,
      active: true,
      startedAt: new Date().toISOString().slice(0, 10),
    });
    return fromPlayer(row);
  },
  async updatePlayer(id, patch) {
    const current = await wix.items.get(C.players, id);
    const row = await wix.items.update(C.players, { ...current, ...patch, _id: id });
    return fromPlayer(row);
  },
  async deletePlayer(id) {
    // Full erasure (SPEC §3.3) runs on the server with the client secret so
    // it can delete ledger rows the member can only read. Here we mark
    // inactive immediately and ask the server to finish.
    await this.updatePlayer(id, { active: false });
    await fetch('/api/players/' + encodeURIComponent(id), { method: 'DELETE', headers: await authHeaders() }).catch(() => {});
  },
  async listEvents(playerId) {
    return (await all(wix.items.query(C.events).eq('playerId', playerId).ascending('occurredAt'))).map(fromEvent);
  },
  async appendEvents(playerId, events) {
    if (!events?.length) return [];
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
    const session = await this.getSession();
    const current = await wix.items.get(C.accounts, session.account.id);
    const safe = { ...patch };
    delete safe.role;
    delete safe.memberId;
    const row = await wix.items.update(C.accounts, { ...current, ...safe, _id: session.account.id, role: current.role, memberId: current.memberId });
    return fromAccount(row);
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
