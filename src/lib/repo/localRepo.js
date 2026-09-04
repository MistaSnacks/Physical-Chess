// localRepo.js — demo mode. Everything lives in localStorage under one key.
// Same promises as wixRepo so screens cannot tell the difference.
import { DEMO_ACCOUNT, DEMO_PLAYERS, demoEvents } from './demoSeed.js';
import { makeEvent, EVENT } from '../game/events.js';

const KEY = 'pc.demo.v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
}
function save(db) { localStorage.setItem(KEY, JSON.stringify(db)); return db; }
function seed() {
  return save({ signedIn: false, account: { ...DEMO_ACCOUNT }, players: DEMO_PLAYERS.map((p) => ({ ...p })), events: demoEvents() });
}
function db() { return load() || seed(); }
function uid(prefix) { return `${prefix}-${Math.random().toString(36).slice(2, 10)}`; }

export const localRepo = {
  name: 'local',
  isDemo: true,

  async signInDemo() { const d = db(); d.signedIn = true; save(d); return this.getSession(); },
  async resetDemo() { localStorage.removeItem(KEY); localStorage.removeItem('pc.coach.demo.v1'); return seed(); },

  async getSession() {
    const d = db();
    if (!d.signedIn) return null;
    return { account: d.account, players: d.players.filter((p) => p.active !== false && p.accountId === d.account.id) };
  },
  async signOut() { const d = db(); d.signedIn = false; save(d); },

  async createPlayer(data) {
    const d = db();
    const player = { id: uid('player'), accountId: d.account.id, active: true, mayPlayInClass: true, startedAt: new Date().toISOString().slice(0, 10), avatar: { animal: 'frog', color: 'lime' }, ...data };
    d.players.push(player);
    d.events.push(makeEvent({ playerId: player.id, accountId: d.account.id, type: EVENT.PLAYER_CREATED, payload: {} }));
    save(d);
    return player;
  },
  async updatePlayer(id, patch) {
    const d = db();
    const i = d.players.findIndex((p) => p.id === id);
    if (i === -1) throw new Error('player not found');
    d.players[i] = { ...d.players[i], ...patch, id };
    save(d);
    return d.players[i];
  },
  async deletePlayer(id) {
    const d = db();
    d.players = d.players.filter((p) => p.id !== id);
    d.events = d.events.filter((e) => e.playerId !== id);
    d.events.push(makeEvent({ playerId: id, accountId: d.account.id, type: EVENT.PLAYER_DELETED, payload: {}, source: 'system' }));
    save(d);
  },
  async listEvents(playerId) {
    return db().events.filter((e) => e.playerId === playerId);
  },
  async appendEvents(playerId, events) {
    const d = db();
    const seen = new Set(d.events.map((e) => e.clientEventId));
    const accepted = [];
    for (const e of events) {
      if (seen.has(e.clientEventId)) continue;
      seen.add(e.clientEventId);
      d.events.push({ ...e, playerId });
      accepted.push(e);
    }
    save(d);
    return accepted;
  },
  async updateAccount(patch) {
    const d = db();
    const safe = { ...patch };
    delete safe.memberId;
    delete safe.demo;
    // Demo Family may preview coach/admin screens from /family. Live wixRepo
    // still refuses role patches; only guardian·coach·admin are accepted here.
    if (safe.role && !['guardian', 'coach', 'admin'].includes(safe.role)) delete safe.role;
    d.account = { ...d.account, ...safe };
    save(d);
    return d.account;
  },

  /** Demo stand-in for Delete my account (SPEC §3.3): wipe and reseed signed out. */
  async deleteAccount() {
    localStorage.removeItem(KEY);
    seed();
  },
};

/** Demo-only: coachDemo reads/writes extra roster rows in the same localStorage db. */
export function readLocalDb() { return db(); }
export function writeLocalDb(d) { return save(d); }
export function allLocalPlayers() { return db().players.slice(); }
export function allLocalEvents() { return db().events.slice(); }
