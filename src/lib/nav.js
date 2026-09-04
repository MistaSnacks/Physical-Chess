// nav.js — fills the nav's session slot from the store (player chip / login).
import { store } from './store.js';
import { loadSession } from './actions.js';
import { avatarSvg } from './avatar.js';

function paint(s) {
  document.querySelectorAll('[data-nav-session]').forEach((slot) => {
    const login = slot.querySelector('[data-nav-login]');
    const chip = slot.querySelector('[data-nav-chip]');
    const coach = slot.querySelector('[data-nav-coach]');
    if (!s.session) { login.hidden = false; chip.hidden = true; coach.hidden = true; return; }
    login.hidden = true;
    chip.hidden = false;
    const role = s.session.account.role;
    coach.hidden = !(role === 'coach' || role === 'admin');
    const name = s.player ? (s.player.apelido || s.player.firstName) : s.session.account.displayName || 'Family';
    chip.querySelector('[data-nav-name]').textContent = name;
    chip.querySelector('[data-nav-avatar]').innerHTML = s.player ? avatarSvg(s.player.avatar, 28) : familySvg();
    chip.href = s.player ? '/who' : '/family';
  });
}
function familySvg() {
  return '<svg width="28" height="28" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2" fill="#FFF6E5"/><circle cx="16" cy="9" r="2.6" fill="#B9F26B"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6" fill="#FFF6E5"/><path d="M13 20c0-3 1.5-5 3.5-5s4 2 4 5" fill="#B9F26B"/></svg>';
}

let booted = false;
function boot() {
  if (!booted) { booted = true; store.subscribe(paint); }
  if (!store.get().ready) loadSession().catch(() => paint(store.get()));
  else paint(store.get());
}
document.addEventListener('astro:page-load', boot);
boot();
