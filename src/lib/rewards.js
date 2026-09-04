// rewards.js — listen for game:* DOM events (actions.js) and play the
// SPEC §4 reward moments. Loaded from motion.js so every player screen
// that already imports motion gets them, including the WP0 lesson player.
import { patchByKey } from '../content/patches.js';
import { patchMarkup } from './patch-art.js';

const STAR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.5 5.7 21l1.5-7L2 9.3l7-.8z"/></svg>';

let lastPoint = null;
let hooked = false;
let overlayChain = Promise.resolve();

function reduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function pointFromEvent() {
  if (lastPoint) return lastPoint;
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

function ensureHosts() {
  if (!document.querySelector('.quest-flash')) {
    const flash = document.createElement('div');
    flash.className = 'quest-flash';
    flash.setAttribute('aria-hidden', 'true');
    document.body.appendChild(flash);
  }
  if (!document.querySelector('.quest-confetti-canvas')) {
    const canvas = document.createElement('canvas');
    canvas.className = 'quest-confetti-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
  }
  if (!document.querySelector('[data-levelup]')) {
    const el = document.createElement('div');
    el.className = 'quest-levelup';
    el.dataset.levelup = '';
    el.hidden = true;
    el.innerHTML = `<button class="quest-levelup__panel" type="button" data-levelup-dismiss>
      <figure class="quest-mascot quest-mascot--inline quest-mascot--compact">
        <div class="quest-mascot__bubble-wrap">
          <p class="quest-mascot__bubble" data-bira-line></p>
          <svg class="quest-mascot__tail" width="26" height="16" viewBox="0 0 26 16" aria-hidden="true"><path d="M0 0h26L13 16z" fill="#FFF6E5" /></svg>
        </div>
        <div class="quest-mascot__figure">
          <svg width="90" height="90" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="15" cy="4.5" r="2.2" fill="none" stroke="#0B2E24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M3 21l5-6 3 1 2-6 4 3 4-5" fill="none" stroke="#0B2E24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M8 15l-2 6" fill="none" stroke="#0B2E24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </figure>
      <p class="quest-levelup__eyebrow">New level</p>
      <h2 class="quest-levelup__title" data-levelup-title></h2>
      <p class="quest-levelup__bira" data-levelup-bira></p>
      <p class="quest-levelup__hint">Tap to keep going</p>
    </button>`;
    document.body.appendChild(el);
  }
  if (!document.querySelector('[data-patch-unlock]')) {
    const el = document.createElement('div');
    el.className = 'quest-patch-unlock';
    el.dataset.patchUnlock = '';
    el.hidden = true;
    el.setAttribute('role', 'status');
    el.innerHTML = `<div class="quest-patch-unlock__card">
      <div class="quest-patch-unlock__art" data-patch-unlock-art></div>
      <div class="quest-patch-unlock__copy">
        <p class="quest-patch-unlock__eyebrow">New patch</p>
        <p class="quest-patch-unlock__title" data-patch-unlock-title></p>
        <p class="quest-patch-unlock__sub" data-patch-unlock-sub></p>
      </div>
    </div>`;
    document.body.appendChild(el);
  }
}

function targetRect() {
  const el = document.querySelector('[data-xp-target], [data-xp-fill], [data-nav-chip]');
  if (!el) return { left: window.innerWidth / 2, top: 24, width: 0, height: 0 };
  return el.getBoundingClientRect();
}

function flyXp(xp) {
  const origin = pointFromEvent();
  const target = targetRect();
  const chip = document.createElement('div');
  chip.className = 'quest-xp-chip';
  chip.textContent = `+${xp} XP`;
  document.body.appendChild(chip);
  if (reduced()) {
    const t = target;
    chip.style.left = `${t.left + t.width / 2 - 50}px`;
    chip.style.top = `${t.top}px`;
    chip.style.opacity = '1';
    setTimeout(() => chip.remove(), 700);
    return;
  }
  chip.style.left = `${origin.x - 50}px`;
  chip.style.top = `${origin.y - 12}px`;
  const flyX = target.left + target.width / 2 - origin.x;
  const flyY = target.top - origin.y;
  chip.style.setProperty('--fly-x', `${flyX}px`);
  chip.style.setProperty('--fly-y', `${flyY}px`);
  requestAnimationFrame(() => chip.classList.add('is-flying'));
  setTimeout(() => chip.remove(), 950);
}

function fillStars(stars) {
  const n = Math.max(0, Math.min(3, Number(stars) || 0));
  const origin = pointFromEvent();
  const row = document.createElement('div');
  row.className = 'quest-star-burst';
  row.innerHTML = Array.from({ length: 3 }, (_, i) => `<span class="quest-star-burst__star" data-i="${i}">${STAR_SVG}</span>`).join('');
  row.style.left = `${origin.x}px`;
  row.style.top = `${origin.y}px`;
  document.body.appendChild(row);
  const lights = Array.from(row.querySelectorAll('.quest-star-burst__star'));
  const hudStars = document.querySelector('[data-hud-stars]');
  const show = (i) => {
    if (lights[i] && i < n) lights[i].classList.add('is-lit');
  };
  if (reduced()) {
    for (let i = 0; i < n; i++) show(i);
    if (hudStars) hudStars.classList.add('is-pop');
    setTimeout(() => { row.remove(); hudStars?.classList.remove('is-pop'); }, 800);
    return;
  }
  lights.forEach((el, i) => {
    setTimeout(() => show(i), i * 220);
  });
  if (hudStars) {
    hudStars.classList.remove('is-pop');
    void hudStars.offsetWidth;
    hudStars.classList.add('is-pop');
  }
  setTimeout(() => { row.remove(); hudStars?.classList.remove('is-pop'); }, 1400);
}

function flamePop() {
  const el = document.querySelector('[data-hud-flame]');
  if (!el) return;
  el.classList.remove('is-pop');
  void el.offsetWidth;
  el.classList.add('is-pop');
  setTimeout(() => el.classList.remove('is-pop'), 600);
}

function limeFlash() {
  const flash = document.querySelector('.quest-flash');
  if (!flash || reduced()) return;
  flash.classList.add('is-flashing');
  setTimeout(() => flash.classList.remove('is-flashing'), 750);
}

function showPatch(patchKey) {
  const patch = patchByKey(patchKey);
  if (!patch) return Promise.resolve();
  ensureHosts();
  const host = document.querySelector('[data-patch-unlock]');
  const art = host.querySelector('[data-patch-unlock-art]');
  host.querySelector('[data-patch-unlock-title]').textContent = patch.title;
  host.querySelector('[data-patch-unlock-sub]').textContent = patch.subtitle;
  art.innerHTML = patchMarkup({
    art: patch.art,
    tier: patch.tier,
    title: patch.title,
    earned: true,
    size: 88,
    stitching: !reduced(),
  });
  host.hidden = false;
  requestAnimationFrame(() => host.classList.add('is-visible'));
  const svg = art.querySelector('.quest-patch');
  if (svg && !reduced()) {
    requestAnimationFrame(() => svg.classList.add('is-stitching'));
  } else if (svg) {
    const stitch = svg.querySelector('.quest-patch__stitch');
    if (stitch) stitch.setAttribute('stroke-dashoffset', '0');
  }
  const hold = reduced() ? 400 : 1400;
  return new Promise((resolve) => {
    setTimeout(() => {
      host.classList.remove('is-visible');
      host.hidden = true;
      resolve();
    }, hold);
  });
}

function showLevelUp(level) {
  ensureHosts();
  const host = document.querySelector('[data-levelup]');
  host.querySelector('[data-levelup-title]').textContent = level.title || '';
  host.querySelector('[data-levelup-bira]').textContent = level.bira || '';
  const bubble = host.querySelector('[data-bira-line]');
  if (bubble && level.bira) bubble.textContent = level.bira;
  host.hidden = false;
  host.classList.add('is-visible');
  host.querySelector('[data-levelup-dismiss]')?.focus();
  if (!reduced()) fireConfetti();
  return new Promise((resolve) => {
    const done = () => {
      host.classList.remove('is-visible');
      host.hidden = true;
      host.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
      resolve();
    };
    const onClick = () => done();
    const onKey = (e) => { if (e.key === 'Escape') done(); };
    host.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
  });
}

function queueOverlay(fn) {
  overlayChain = overlayChain.then(fn).catch(() => {});
}

export function fireConfetti() {
  const canvas = document.querySelector('.quest-confetti-canvas');
  if (!(canvas instanceof HTMLCanvasElement)) return;
  if (reduced()) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const colors = ['#FF4F7A', '#FFB238', '#B9F26B'];
  const pieces = Array.from({ length: 90 }, () => ({
    x: Math.random() * window.innerWidth,
    y: -20 - Math.random() * 200,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    color: colors[Math.floor(Math.random() * colors.length)],
    vy: 3 + Math.random() * 4,
    vx: -2 + Math.random() * 4,
    rot: Math.random() * Math.PI,
    vr: -0.2 + Math.random() * 0.4,
  }));

  const start = performance.now();
  const duration = 1600;

  function frame(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    pieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (elapsed < duration) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
  requestAnimationFrame(frame);
}

export function initRewards() {
  ensureHosts();
  if (hooked) return;
  hooked = true;

  document.addEventListener('pointerdown', (e) => {
    lastPoint = { x: e.clientX, y: e.clientY };
  }, { passive: true });

  document.addEventListener('game:xp', (e) => {
    const xp = Number(e.detail?.xp) || 0;
    if (xp > 0) flyXp(xp);
  });

  document.addEventListener('game:lesson-done', (e) => {
    fillStars(e.detail?.stars);
  });

  document.addEventListener('game:module-cleared', () => {
    limeFlash();
    fireConfetti();
  });

  document.addEventListener('game:streak', () => {
    flamePop();
  });

  document.addEventListener('game:patch', (e) => {
    const key = e.detail?.patchKey;
    if (key) queueOverlay(() => showPatch(key));
  });

  document.addEventListener('game:level-up', (e) => {
    const level = e.detail?.level;
    if (level) queueOverlay(() => showLevelUp(level));
  });
}
