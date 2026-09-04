// nav.js — fills the nav's session slot from the store (player chip / login).
// Also paints the class-mode bar (WP6) and the HUD Desafio ticket.
import { store } from './store.js';
import { loadSession, clearActivePlayer } from './actions.js';
import { avatarSvg } from './avatar.js';
import { readClassMode, writeClassMode } from './coach.js';

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
  paintClassBar();
  paintDesafioTicket(s);
  if (s.snapshot) document.body.dataset.desafioDone = s.snapshot.desafioDoneToday ? 'true' : 'false';
}

function familySvg() {
  return '<svg width="28" height="28" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2" fill="#FFF6E5"/><circle cx="16" cy="9" r="2.6" fill="#B9F26B"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6" fill="#FFF6E5"/><path d="M13 20c0-3 1.5-5 3.5-5s4 2 4 5" fill="#B9F26B"/></svg>';
}

function paintClassBar() {
  const mode = readClassMode();
  let bar = document.querySelector('[data-class-mode-bar]');
  if (!mode) {
    bar?.remove();
    document.body.classList.remove('has-class-mode');
    return;
  }
  document.body.classList.add('has-class-mode');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'quest-class-bar';
    bar.dataset.classModeBar = '';
    bar.setAttribute('role', 'status');
    document.body.prepend(bar);
  }
  bar.innerHTML = `<span>Class mode · ${escapeHtml(mode.programName || mode.program)} · tap to end</span><button type="button" class="quest-class-bar__end" data-end-class>End</button>`;
  bar.querySelector('[data-end-class]').addEventListener('click', () => {
    writeClassMode(null);
    clearActivePlayer();
    location.href = '/coach/class';
  });
}

function paintDesafioTicket(s) {
  const hud = document.querySelector('.quest-hud');
  if (!hud || !s.player) return;
  let ticket = hud.querySelector('[data-desafio-ticket]');
  if (!ticket) {
    ticket = document.createElement('a');
    ticket.className = 'quest-desafio-ticket';
    ticket.dataset.desafioTicket = '';
    hud.appendChild(ticket);
  }
  const done = Boolean(s.snapshot?.desafioDoneToday);
  ticket.href = '/desafio';
  ticket.dataset.done = done ? 'true' : 'false';
  ticket.innerHTML = done
    ? '<span class="quest-desafio-ticket__label">Desafio</span><span class="quest-desafio-ticket__state">Done today</span>'
    : '<span class="quest-desafio-ticket__label">Desafio do Dia</span><span class="quest-desafio-ticket__state">+30 XP</span>';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

let booted = false;
function boot() {
  if (!booted) { booted = true; store.subscribe(paint); }
  if (!store.get().ready) loadSession().catch(() => paint(store.get()));
  else paint(store.get());
}
document.addEventListener('astro:page-load', boot);
boot();
