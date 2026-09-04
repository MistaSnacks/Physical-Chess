// lesson-ui.js — shared paint helpers for the module hub and lesson player.
const CHECK = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="#0B2E24" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const LOCK = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';

export function starIcons(n = 0) {
  const on = Math.max(0, Math.min(3, Number(n) || 0));
  return [1, 2, 3].map((i) => (
    `<svg class="quest-mini-star${i <= on ? ' is-on' : ''}" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.5 5.7 21l1.5-7L2 9.3l7-.8z" fill="${i <= on ? '#FFB238' : 'none'}" stroke="${i <= on ? '#FFB238' : '#7FA894'}" stroke-width="2"/></svg>`
  )).join('');
}

export function toast(msg) {
  const t = document.querySelector('[data-toast]');
  if (!t) return;
  t.textContent = msg;
  t.dataset.show = 'true';
  clearTimeout(toast._id);
  toast._id = setTimeout(() => { t.dataset.show = 'false'; }, 2400);
}

/**
 * Paint rail rows from the live snapshot. `currentId` is the lesson being
 * viewed (player) or next-up (hub). Locked modules get padlocks and the
 * links are disarmed.
 */
export function paintLessonRail(snapshot, { currentId, moduleId, lockLinks = false } = {}) {
  const modState = snapshot?.modules?.[moduleId];
  const moduleLocked = Boolean(modState?.locked);
  document.querySelectorAll('[data-rail-lesson]').forEach((el) => {
    const id = el.dataset.railLesson;
    const st = snapshot?.lessons?.[id];
    const done = st?.status === 'done';
    const current = Boolean(currentId) && id === currentId;
    el.classList.toggle('quest-rail__item--done', done && !current);
    el.classList.toggle('quest-rail__item--current', current);
    el.classList.toggle('quest-rail__item--locked', moduleLocked && !done);
    const icon = el.querySelector('[data-rail-icon]');
    if (icon) {
      if (moduleLocked && !done) icon.innerHTML = LOCK;
      else if (done) icon.innerHTML = CHECK;
    }
    const stars = el.querySelector('[data-rail-stars]');
    if (stars) stars.innerHTML = starIcons(st?.bestStars || 0);
    if (moduleLocked && lockLinks && el.tagName === 'A') {
      el.setAttribute('aria-disabled', 'true');
      el.tabIndex = -1;
    }
  });
}

export function setHubRing(percent) {
  const fill = document.querySelector('[data-hub-ring]');
  const label = document.querySelector('[data-hub-percent]');
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  if (fill) {
    const circ = 2 * Math.PI * 52;
    fill.style.strokeDasharray = String(circ);
    fill.style.strokeDashoffset = String(circ * (1 - pct / 100));
  }
  if (label) label.textContent = `${pct}%`;
}

export { CHECK as CHECK_ICON, LOCK as LOCK_ICON };
