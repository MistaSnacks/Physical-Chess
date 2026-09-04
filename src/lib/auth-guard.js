// auth-guard.js — call at the top of a screen's client script.
//   requireSession()                  → guardian screens (/family, /who)
//   requireSession({ player: true })  → player screens (/journey, /learn/*)
//   requireSession({ role: 'coach' }) → coach/admin screens
// Redirects with ?next= so the user lands back where they were.
import { loadSession } from './actions.js';
import { store } from './store.js';

export async function requireSession({ player = false, role = null } = {}) {
  const session = await loadSession();
  const here = location.pathname + location.search;
  if (!session) { location.replace(`/login?next=${encodeURIComponent(here)}`); return null; }
  if (role) {
    const r = session.account.role;
    const ok = role === 'coach' ? r === 'coach' || r === 'admin' : r === role;
    if (!ok) { location.replace('/who'); return null; }
  }
  if (player && !store.get().player) {
    location.replace(session.players.length ? `/who?next=${encodeURIComponent(here)}` : '/family/players/new');
    return null;
  }
  return store.get();
}
