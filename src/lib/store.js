// store.js — tiny app state + pub/sub. Screens subscribe and re-render the
// bits they own; motion.js listens for the DOM events actions.js dispatches.
const state = {
  ready: false,
  session: null,        // { account, players } | null
  activePlayerId: null,
  player: null,         // the active Player row
  events: [],           // the active player's ledger
  snapshot: null,       // derivePlayer(events)
  isDemo: true,
};
const subs = new Set();

export const store = {
  get() { return state; },
  set(patch) {
    Object.assign(state, patch);
    for (const fn of subs) { try { fn(state); } catch (e) { console.error(e); } }
    return state;
  },
  subscribe(fn) { subs.add(fn); if (state.ready) fn(state); return () => subs.delete(fn); },
};

/** Bind text/attributes from the snapshot: <span data-bind="xp"> … */
export function bindDom(root = document) {
  return store.subscribe((s) => {
    if (!s.snapshot) return;
    root.querySelectorAll('[data-bind]').forEach((el) => {
      const v = getPath({ ...s.snapshot, player: s.player, account: s.session?.account }, el.dataset.bind);
      if (v == null) return;
      if (el.dataset.bindAttr) el.setAttribute(el.dataset.bindAttr, String(v));
      else if (el.dataset.bindStyle) el.style.setProperty(el.dataset.bindStyle, String(v));
      else el.textContent = String(v);
    });
  });
}

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
