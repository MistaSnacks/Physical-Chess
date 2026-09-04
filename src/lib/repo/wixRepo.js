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

async function all(query) {
  const items = [];
  let res = await query.limit(1000).find();
  items.push(...res.items);
  while (res.hasNext()) { res = await res.next(); items.push(...res.items); }
  return items;
}

const fromAccount = (r) => ({ id: r._id, memberId: r.memberId, role: r.role || 'guardian', displayName: r.displayName || '', email: r.email || '', programs: r.programs || [], leaderboardOptIn: r.leaderboardOptIn !== false, demo: false });
const fromPlayer = (r) => ({ id: r._id, accountId: r.accountId, firstName: r.firstName, apelido: r.apelido || '', avatar: r.avatar || { animal: 'frog', color: 'lime' }, birthYear: r.birthYear || null, program: r.program || null, startedAt: r.startedAt || null, active: r.active !== false, mayPlayInClass: r.mayPlayInClass !== false });
const fromEvent = (r) => ({ clientEventId: r.clientEventId, playerId: r.playerId, accountId: r.accountId, type: r.type, moduleId: r.moduleId || null, lessonId: r.lessonId || null, payload: r.payload ? JSON.parse(r.payload) : {}, xp: r.xp || 0, stars: r.stars || 0, occurredAt: r.occurredAt, source: r.source || 'app', _id: r._id });

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
    const row = await wix.items.insert(C.players, { ...data, accountId: session.account.id, active: true, startedAt: new Date().toISOString().slice(0, 10) });
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
    const accepted = [];
    for (const e of events) {
      const dup = await wix.items.query(C.events).eq('clientEventId', e.clientEventId).limit(1).find();
      if (dup.items.length) continue;
      await wix.items.insert(C.events, { ...e, playerId, payload: JSON.stringify(e.payload || {}), occurredAt: new Date(e.occurredAt) });
      accepted.push(e);
    }
    return accepted;
  },
  async updateAccount(patch) {
    const session = await this.getSession();
    const current = await wix.items.get(C.accounts, session.account.id);
    const row = await wix.items.update(C.accounts, { ...current, ...patch, _id: session.account.id });
    return fromAccount(row);
  },
};

export async function authHeaders() {
  const tokens = wix.auth.getTokens();
  return { Authorization: `Bearer ${tokens?.accessToken?.value || ''}` };
}
