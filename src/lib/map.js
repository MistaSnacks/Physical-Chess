// map.js — bind the journey map to the live snapshot (SPEC §4, WP3).
// Trail geometry matches the showcase S-curves; motion.js still places
// nodes with getPointAtLength. This module only paints state.
import { MODULES, LESSONS } from '../content/index.js';
import { CORDAS, cordaIndex } from '../data/batizado.js';
import { store } from './store.js';
import { avatarSvg } from './avatar.js';

export const MODULE_STOPS = {
  movements: 0.1,
  music: 0.36,
  culture: 0.58,
  graduation: 0.76,
};
export const GATE_PROGRESS = 0.985;
export const DESKTOP_TRAIL = 'M40 670 C80 590 160 510 240 510 C330 510 380 650 460 590 C540 530 560 410 660 410 C740 410 660 250 520 210 C440 190 660 70 865 105';
export const MOBILE_TRAIL = 'M72 46 C292 118 296 210 172 280 C42 352 52 468 234 515 C350 548 306 688 158 720 C26 750 70 904 280 1000';

export function lessonTrailItems() {
  const order = MODULES.map((m) => m.id);
  return LESSONS.map((lesson) => {
    const moduleIndex = order.indexOf(lesson.moduleId);
    const stop = MODULE_STOPS[lesson.moduleId];
    const nextStop = moduleIndex === MODULES.length - 1
      ? GATE_PROGRESS
      : MODULE_STOPS[order[moduleIndex + 1]];
    const start = stop + 0.045;
    const end = nextStop - 0.045;
    const siblings = LESSONS.filter((l) => l.moduleId === lesson.moduleId);
    const i = siblings.findIndex((l) => l.id === lesson.id);
    return {
      lesson,
      moduleId: lesson.moduleId,
      progress: start + ((end - start) * (i + 1)) / (siblings.length + 1),
    };
  });
}

export function nodeState(moduleId, snapshot) {
  const m = snapshot.modules[moduleId];
  if (!m || m.locked) return 'locked';
  if (snapshot.nextUp?.moduleId === moduleId) return 'current';
  if (m.cleared) return 'done';
  return 'open';
}

export function clearedTrailPercent(snapshot, items = lessonTrailItems()) {
  const done = items.filter((item) => snapshot.lessons[item.lesson.id]?.status === 'done');
  const max = done.length ? Math.max(...done.map((item) => item.progress)) : 0.04;
  return Math.round(Math.max(0.04, max) * 1000) / 10;
}

function cordaById(id) {
  const i = cordaIndex(id);
  return CORDAS[i >= 0 ? i : 0];
}

function nextLesson(snapshot) {
  if (!snapshot.nextUp) return null;
  return LESSONS.find((l) => l.id === snapshot.nextUp.lessonId) || null;
}

export function paintMap(s) {
  const snapshot = s.snapshot;
  if (!snapshot) return;
  const root = document.querySelector('[data-quest-map]');
  if (!root) return;

  const percent = clearedTrailPercent(snapshot);
  root.querySelectorAll('.quest-trail-path--cleared, .quest-trail-path--glow').forEach((path) => {
    path.setAttribute('stroke-dasharray', `${percent} 100`);
  });

  root.querySelectorAll('[data-module-id]').forEach((el) => {
    const id = el.dataset.moduleId;
    const state = nodeState(id, snapshot);
    const mod = snapshot.modules[id];
    el.classList.remove('quest-node--done', 'quest-node--current', 'quest-node--open', 'quest-node--locked');
    el.classList.remove('quest-map-mobile__node--done', 'quest-map-mobile__node--current', 'quest-map-mobile__node--open', 'quest-map-mobile__node--locked');
    if (el.classList.contains('quest-map-mobile__node')) {
      el.classList.add(`quest-map-mobile__node--${state}`);
    } else {
      el.classList.add(`quest-node--${state}`);
    }
    const href = `/learn/${id}`;
    if (state === 'locked') {
      el.removeAttribute('href');
      el.setAttribute('aria-disabled', 'true');
      el.setAttribute('tabindex', '-1');
    } else {
      el.setAttribute('href', href);
      el.removeAttribute('aria-disabled');
      el.removeAttribute('tabindex');
    }
    const badge = el.querySelector('[data-node-badge]');
    if (badge && mod) badge.textContent = `${mod.completed}/${mod.total}`;
    const tag = el.querySelector('[data-node-tag]');
    if (tag && mod) {
      tag.textContent = state === 'locked'
        ? (mod.lockedReason || 'Locked')
        : state === 'current'
          ? `${mod.completed}/${mod.total} cleared`
          : `${mod.completed}/${mod.total} done`;
    }
    const label = el.dataset.labelBase || el.querySelector('[data-node-label]')?.textContent || id;
    el.setAttribute('aria-label', state === 'locked' ? `${label}, locked` : `${label}, ${mod.completed} of ${mod.total} done`);
  });

  root.querySelectorAll('[data-quest-lesson-dot]').forEach((dot) => {
    const id = dot.dataset.lessonId;
    const lesson = snapshot.lessons[id];
    const moduleId = LESSONS.find((l) => l.id === id)?.moduleId;
    const locked = moduleId ? snapshot.modules[moduleId]?.locked : false;
    const done = lesson?.status === 'done';
    const stars = done ? (lesson.bestStars || 0) : 0;
    dot.classList.toggle('quest-lesson-dot--locked', Boolean(locked));
    dot.classList.toggle('quest-lesson-dot--done', Boolean(done) && !locked);
    dot.classList.toggle('quest-lesson-dot--open', !done && !locked);
    dot.dataset.stars = String(stars);
    dot.querySelectorAll('[data-pip]').forEach((pip, i) => {
      pip.classList.toggle('is-lit', i < stars);
    });
  });

  const ready = snapshot.readiness.percent >= 100;
  const opened = snapshot.cordaCurrent !== 'crua';
  const next = cordaById(snapshot.nextCorda);
  root.querySelectorAll('[data-gate]').forEach((gate) => {
    gate.classList.toggle('quest-gate--dim', !ready && !opened);
    gate.classList.toggle('quest-gate--glow', ready && !opened);
    gate.classList.toggle('quest-gate--open', opened);
    const label = gate.querySelector('[data-gate-label]');
    if (label) label.textContent = `CORDA ${next.label.toUpperCase()}`;
  });

  const lesson = nextLesson(snapshot);
  const nextup = root.querySelector('[data-nextup]');
  if (nextup) {
    if (!lesson || !snapshot.nextUp) {
      nextup.hidden = true;
    } else {
      nextup.hidden = false;
      nextup.href = `/learn/${snapshot.nextUp.moduleId}/${lesson.id}`;
      const title = nextup.querySelector('[data-nextup-title]');
      if (title) title.textContent = lesson.title;
    }
  }

  const corda = cordaById(snapshot.cordaCurrent);
  root.querySelectorAll('[data-corda-label]').forEach((el) => {
    el.textContent = corda.label;
  });
}

let hudBound = false;
let mapBound = false;

export function paintHud(s) {
  const snapshot = s.snapshot;
  const player = s.player;
  if (!snapshot || !player) return;

  const corda = cordaById(snapshot.cordaCurrent);
  document.querySelectorAll('[data-hud-avatar]').forEach((el) => {
    el.innerHTML = avatarSvg(player.avatar, 80);
  });

  document.querySelectorAll('[data-hud-corda-swatch]').forEach((el) => {
    el.style.background = corda.color;
  });
  document.querySelectorAll('[data-hud-corda-label]').forEach((el) => {
    el.textContent = `CORDA ${corda.label.toUpperCase()}`;
  });
  document.querySelectorAll('[data-corda-label]').forEach((el) => {
    el.textContent = corda.label;
  });

  const scale = String((snapshot.level.percent || 0) / 100);
  document.querySelectorAll('[data-xp-fill]').forEach((fill) => {
    fill.style.setProperty('--quest-xp-scale', scale);
    fill.setAttribute('data-xp-fill', String(snapshot.level.percent || 0));
    fill.setAttribute('data-ready', 'true');
  });

  const ready = snapshot.readiness.percent >= 100;
  const offset = String(100 - (snapshot.readiness.percent || 0));
  document.querySelectorAll('[data-ring-fill]').forEach((ring) => {
    ring.style.strokeDashoffset = offset;
  });
  document.querySelectorAll('[data-ring-label]').forEach((el) => {
    el.textContent = ready ? 'Batizado ready' : 'Batizado readiness';
  });
}

export function bindHud() {
  if (hudBound) {
    if (store.get().snapshot) paintHud(store.get());
    return;
  }
  hudBound = true;
  return store.subscribe((s) => {
    if (s.snapshot && s.player) paintHud(s);
  });
}

export function bindMap() {
  document.querySelectorAll('[data-module-id]').forEach((el) => {
    if (el.dataset.lockBound) return;
    el.dataset.lockBound = '1';
    el.addEventListener('click', (e) => {
      if (el.getAttribute('aria-disabled') === 'true') e.preventDefault();
    });
  });
  if (mapBound) {
    if (store.get().snapshot) paintMap(store.get());
    return;
  }
  mapBound = true;
  return store.subscribe((s) => {
    if (s.snapshot) paintMap(s);
  });
}
