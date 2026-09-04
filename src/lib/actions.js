// actions.js — the only place screens call to change anything. Every
// mutation is a ledger event with a clientEventId (SPEC §3.1) written to an
// outbox first (SPEC §3.2), applied optimistically, then flushed.
import { store } from './store.js';
import { getRepo, IS_DEMO } from './repo/index.js';
import { makeEvent, derivePlayer, sideEffects, startsNewStreakWeek, isoWeek, EVENT } from './game/index.js';

const ACTIVE_KEY = 'pc.activePlayer';
const OUTBOX_KEY = 'pc.outbox';

function emit(name, detail) {
  document.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
}

export async function loadSession() {
  const repo = await getRepo();
  const session = await repo.getSession();
  store.set({ session, isDemo: IS_DEMO, ready: !session });
  if (!session) return null;
  const wanted = sessionStorage.getItem(ACTIVE_KEY);
  const player = session.players.find((p) => p.id === wanted) || null;
  if (player) await selectPlayer(player.id);
  else store.set({ ready: true });
  return session;
}

export async function selectPlayer(id) {
  const repo = await getRepo();
  const s = store.get();
  const player = s.session?.players.find((p) => p.id === id);
  if (!player) throw new Error('unknown player');
  sessionStorage.setItem(ACTIVE_KEY, id);
  await flushOutbox();
  const events = await repo.listEvents(id);
  const snapshot = derivePlayer(events);
  store.set({ activePlayerId: id, player, events, snapshot, ready: true });
  return snapshot;
}

export function clearActivePlayer() {
  sessionStorage.removeItem(ACTIVE_KEY);
  store.set({ activePlayerId: null, player: null, events: [], snapshot: null });
}

/**
 * Record something the active player did. Returns the new snapshot.
 * Dispatches DOM events for motion: game:xp, game:lesson-done,
 * game:module-cleared, game:level-up, game:patch, game:streak.
 */
export async function recordEvent(type, { moduleId = null, lessonId = null, payload = {} } = {}) {
  const s = store.get();
  if (!s.player) throw new Error('no active player');
  const now = new Date();
  const base = { playerId: s.player.id, accountId: s.player.accountId };
  const event = makeEvent({ ...base, type, moduleId, lessonId, payload, occurredAt: now });
  const before = s.snapshot || derivePlayer(s.events);
  const newWeek = event.xp > 0 && startsNewStreakWeek(s.events, now);
  let events = [...s.events, event];
  let after = derivePlayer(events, { now });
  const extra = sideEffects(before, after, event, { newStreakWeek: newWeek, week: isoWeek(now) }).map((e) => makeEvent({ ...base, ...e, occurredAt: now, source: 'system' }));
  if (extra.length) { events = [...events, ...extra]; after = derivePlayer(events, { now }); }
  store.set({ events, snapshot: after });

  queue([event, ...extra]);
  flushOutbox();

  if (event.xp > 0) emit('game:xp', { xp: event.xp, type });
  if (lessonId && after.lessons[lessonId]?.status === 'done' && before.lessons[lessonId]?.status !== 'done') emit('game:lesson-done', { lessonId, stars: after.lessons[lessonId].bestStars });
  for (const e of extra) {
    if (e.type === EVENT.MODULE_CLEARED) emit('game:module-cleared', { moduleId: e.moduleId });
    if (e.type === EVENT.PATCH_EARNED) emit('game:patch', { patchKey: e.payload.patchKey });
    if (e.type === EVENT.STREAK_WEEK) emit('game:streak', { weeks: after.streak.weeks });
  }
  if (after.level.level > before.level.level) emit('game:level-up', { level: after.level });
  return after;
}

function queue(events) {
  const box = readOutbox();
  box.push(...events);
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(box));
}
function readOutbox() {
  try { return JSON.parse(localStorage.getItem(OUTBOX_KEY)) || []; } catch { return []; }
}
let flushing = false;
export async function flushOutbox() {
  if (flushing) return;
  const box = readOutbox();
  if (!box.length) return;
  flushing = true;
  try {
    const repo = await getRepo();
    const byPlayer = new Map();
    for (const e of box) { if (!byPlayer.has(e.playerId)) byPlayer.set(e.playerId, []); byPlayer.get(e.playerId).push(e); }
    for (const [playerId, events] of byPlayer) await repo.appendEvents(playerId, events);
    localStorage.setItem(OUTBOX_KEY, '[]');
  } catch (err) {
    console.warn('outbox flush failed, will retry', err);
  } finally {
    flushing = false;
  }
}

export async function signInDemo() {
  const repo = await getRepo();
  if (!repo.signInDemo) throw new Error('not in demo mode');
  await repo.signInDemo();
  return loadSession();
}

export async function signOut() {
  const repo = await getRepo();
  clearActivePlayer();
  await repo.signOut();
  store.set({ session: null });
}

export async function createPlayer(data) {
  const repo = await getRepo();
  const player = await repo.createPlayer(data);
  const session = await repo.getSession();
  store.set({ session });
  return player;
}

export async function updatePlayer(id, patch) {
  const repo = await getRepo();
  const player = await repo.updatePlayer(id, patch);
  const session = await repo.getSession();
  store.set({ session, player: store.get().activePlayerId === id ? player : store.get().player });
  return player;
}

export async function deletePlayer(id) {
  const repo = await getRepo();
  await repo.deletePlayer(id);
  if (store.get().activePlayerId === id) clearActivePlayer();
  store.set({ session: await repo.getSession() });
}

export async function updateAccount(patch) {
  const repo = await getRepo();
  const account = await repo.updateAccount(patch);
  const session = await repo.getSession();
  store.set({ session });
  return account;
}

/**
 * Snapshots for every player in the signed-in family (picker / family home).
 * Bounded to a handful of siblings; one listEvents per player.
 */
export async function snapshotsForSession() {
  const repo = await getRepo();
  const players = store.get().session?.players || [];
  return Promise.all(players.map(async (player) => {
    const events = await repo.listEvents(player.id);
    return { player, events, snapshot: derivePlayer(events) };
  }));
}

export async function confirmPractice(playerId, { moduleId = null, lessonId = null } = {}) {
  if (store.get().activePlayerId !== playerId) await selectPlayer(playerId);
  const already = store.get().events.some((e) => e.type === EVENT.PRACTICE_CONFIRMED && e.lessonId === lessonId);
  if (already) return store.get().snapshot;
  return recordEvent(EVENT.PRACTICE_CONFIRMED, { moduleId, lessonId, payload: { by: 'guardian' } });
}

/**
 * Delete the whole family account. Demo: wipe and reseed signed-out.
 * Wix: DELETE /api/account (WP6). If that route is missing, returns { contactAce: true }.
 */
export async function deleteAccount() {
  const repo = await getRepo();
  clearActivePlayer();
  if (IS_DEMO && repo.resetDemo) {
    await repo.resetDemo();
    store.set({ session: null, ready: true });
    return { demo: true };
  }
  try {
    if (typeof repo.deleteAccount === 'function') await repo.deleteAccount();
    else {
      const res = await fetch('/api/account', { method: 'DELETE' }).catch(() => null);
      if (!res || res.status === 404 || !res.ok) return { contactAce: true };
    }
    store.set({ session: null, ready: true });
    return { ok: true };
  } catch (err) {
    if (err?.code === 'CONTACT_ACE' || err?.message === 'CONTACT_ACE') return { contactAce: true };
    throw err;
  }
}

window.addEventListener('online', () => flushOutbox());
