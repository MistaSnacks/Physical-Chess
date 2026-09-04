// motion.js — Roda Quest animations.
// CSS keyframes handle idle loops (halo pulse, flag bob, mascot breathe —
// declared directly in theme.css). This file drives:
//   - entrance stagger (fade/rise-in, node pop-in, path draw-on)
//   - XP bar fill
//   - quiz reactions (hearts shake, correct bounce + XP chip fly, confetti)
//   - the movements "mark complete" toggle
//   - the batizado gate-open reveal
//
// Respects prefers-reduced-motion: reduce — every animated transform /
// opacity change is skipped in favor of the final state.

import { initRewards, fireConfetti } from '../../lib/rewards.js';

function reduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function stagger(nodes, attr, delayStep, startDelay = 0) {
  nodes.forEach((el, i) => {
    if (reduced()) {
      el.setAttribute(attr, 'true');
      return;
    }
    // Cap the final delay so every entrance has fully settled by 1.2s.
    const delay = Math.min(startDelay + i * delayStep, 600);
    setTimeout(() => el.setAttribute(attr, 'true'), delay);
  });
}

function initEntrance() {
  const enterEls = Array.from(document.querySelectorAll('[data-quest-enter]'));
  stagger(enterEls, 'data-quest-enter', 45, 20);

  const nodeEls = Array.from(document.querySelectorAll('[data-quest-node]')).filter(
    (el) => el.offsetParent !== null
  );
  stagger(nodeEls, 'data-quest-node', 60, 540);
}

function initTrailDraw() {
  const trails = Array.from(
    document.querySelectorAll('.quest-trail-svg, .quest-map-mobile__svg')
  ).filter((trail) => trail.getBoundingClientRect().width > 0);

  trails.forEach((trail) => {
    const paths = trail.querySelectorAll('.quest-trail-path');
    if (reduced()) {
      trail.style.clipPath = 'inset(0 0 0 0)';
      paths.forEach((path) => {
        path.style.strokeDashoffset = '0';
      });
      return;
    }
    trail.animate(
      [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
      { duration: 520, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'both' }
    );
    paths.forEach((path) => {
      const cleared = path.classList.contains('quest-trail-path--cleared') ||
        path.classList.contains('quest-trail-path--glow');
      const dash = Number(path.getAttribute('stroke-dasharray')?.split(' ')[0] || 100);
      path.animate(
        [{ strokeDashoffset: cleared ? dash : 52 }, { strokeDashoffset: 0 }],
        { duration: 520, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'both' }
      );
    });
  });
}

function initXpBar() {
  const fills = document.querySelectorAll('[data-xp-fill]');
  fills.forEach((fill) => {
    const percent = fill.getAttribute('data-xp-fill') || '0';
    fill.style.setProperty('--quest-xp-scale', String(Number(percent) / 100));
    if (reduced()) {
      fill.setAttribute('data-ready', 'true');
      return;
    }
    setTimeout(() => {
      fill.setAttribute('data-ready', 'true');
    }, 500);
  });
}

function initLessonDots() {
  document.querySelectorAll('[data-quest-trail-guide]').forEach((guide) => {
    if (!(guide instanceof SVGPathElement)) return;
    const svg = guide.ownerSVGElement;
    const map = svg?.closest('.quest-trail-area, .quest-map-mobile');
    const width = svg?.clientWidth || 0;
    const height = svg?.clientHeight || 0;
    if (!svg || !map || width === 0 || height === 0) return;

    const viewBox = svg.viewBox.baseVal;
    const scaleX = width / viewBox.width;
    const scaleY = height / viewBox.height;
    const length = guide.getTotalLength();
    const positionOnTrail = (el, progress) => {
      const point = guide.getPointAtLength(length * progress);
      el.style.left = `${point.x * scaleX}px`;
      el.style.top = `${point.y * scaleY}px`;
    };

    const dots = Array.from(map.querySelectorAll('[data-quest-lesson-dot]'));
    dots.forEach((dot, index) => {
      positionOnTrail(dot, Number(dot.getAttribute('data-path-progress') || 0));
      if (reduced()) {
        dot.setAttribute('data-ready', 'true');
      } else {
        setTimeout(() => dot.setAttribute('data-ready', 'true'), 260 + index * 18);
      }
    });

    map.querySelectorAll('[data-map-progress]').forEach((node) => {
      positionOnTrail(node, Number(node.getAttribute('data-map-progress') || 0));
    });
  });
}

function initMascotBreathing() {
  document.querySelectorAll('.quest-mascot__figure').forEach((el) => {
    if (!reduced()) el.classList.add('is-breathing');
  });
}

function initCompleteButtons() {
  document.querySelectorAll('[data-quest-complete-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const done = btn.getAttribute('data-done') === 'true';
      btn.setAttribute('data-done', done ? 'false' : 'true');
      btn.classList.toggle('is-complete', !done);
      const label = btn.querySelector('[data-quest-complete-label]');
      if (label) {
        label.textContent = done ? 'Mark complete' : 'Completed';
      }
    });
  });
}

// ---------------------------------------------------------------------
// Quiz reactions (Music / boss quiz page)
// ---------------------------------------------------------------------
function initQuizReactions() {
  const quizRoot = document.querySelector('[data-quiz]');
  if (!quizRoot) return;

  const hearts = Array.from(document.querySelectorAll('[data-quest-heart]'));
  const progressSegs = Array.from(document.querySelectorAll('[data-quest-progress-seg]'));
  const xpTotalEl = document.querySelector('[data-quest-xp-total]');
  const mascotTarget = document.querySelector('[data-quest-xp-target]');
  const flashEl = document.querySelector('.quest-flash');
  const winBanner = document.querySelector('[data-quest-win]');
  let xpEarned = 0;
  let heartsLost = 0;

  function updateProgress(index, state) {
    const seg = progressSegs[index];
    if (seg) seg.setAttribute('data-state', state);
    const next = progressSegs[index + 1];
    if (state === 'answered' && next) next.setAttribute('data-state', 'current');
  }

  quizRoot.addEventListener('quiz:wrong', (e) => {
    const detail = e.detail || {};
    updateProgress(detail.index, 'answered');
    const heart = hearts[hearts.length - 1 - heartsLost];
    if (heart) {
      heart.classList.add('heart-lost');
      if (!reduced()) {
        heart.classList.add('heart-shake');
        setTimeout(() => heart.classList.remove('heart-shake'), 550);
      }
    }
    heartsLost += 1;
  });

  quizRoot.addEventListener('quiz:correct', (e) => {
    const detail = e.detail || {};
    updateProgress(detail.index, 'answered');
    xpEarned += 50;
    if (xpTotalEl) xpTotalEl.textContent = `+${xpEarned} XP`;

    const choiceEl = quizRoot.querySelector(
      `[data-question-index="${detail.index}"] [data-quiz-choice][data-selected="true"]`
    );
    if (choiceEl && !reduced()) {
      choiceEl.classList.add('quest-correct-bounce');
      setTimeout(() => choiceEl.classList.remove('quest-correct-bounce'), 650);
    }

    if (reduced() || !mascotTarget) return;

    // Fly a "+50 XP" chip from the chosen answer toward the mascot's XP chip.
    const originRect = (choiceEl || quizRoot).getBoundingClientRect();
    const targetRect = mascotTarget.getBoundingClientRect();

    const chip = document.createElement('div');
    chip.className = 'quest-xp-chip';
    chip.textContent = '+50 XP';
    chip.style.left = `${originRect.left + originRect.width / 2 - 50}px`;
    chip.style.top = `${originRect.top}px`;
    const flyX = targetRect.left + targetRect.width / 2 - (originRect.left + originRect.width / 2);
    const flyY = targetRect.top - originRect.top;
    chip.style.setProperty('--fly-x', `${flyX}px`);
    chip.style.setProperty('--fly-y', `${flyY}px`);
    document.body.appendChild(chip);
    requestAnimationFrame(() => chip.classList.add('is-flying'));
    setTimeout(() => chip.remove(), 950);

    if (mascotTarget) {
      mascotTarget.classList.remove('quest-pulse');
      void mascotTarget.offsetWidth;
      mascotTarget.classList.add('quest-pulse');
    }
  });

  quizRoot.addEventListener('quiz:done', (e) => {
    if (winBanner) {
      winBanner.setAttribute('aria-hidden', 'false');
      winBanner.classList.add('is-visible');
      if (!reduced()) {
        setTimeout(() => {
          winBanner.classList.remove('is-visible');
          winBanner.setAttribute('aria-hidden', 'true');
        }, 2600);
      }
    }
    if (flashEl && !reduced()) {
      flashEl.classList.add('is-flashing');
      setTimeout(() => flashEl.classList.remove('is-flashing'), 750);
    }
    if (!reduced()) fireConfetti();
  });
}

// Confetti lives in rewards.js so game:* moments and the quiz share one canvas.

// ---------------------------------------------------------------------
// Batizado gate reveal
// ---------------------------------------------------------------------
function initGate() {
  const gate = document.querySelector('[data-quest-gate]');
  const ceremony = document.querySelector('[data-quest-ceremony]');
  if (!gate || !ceremony) return;

  gate.addEventListener('click', () => {
    if (gate.getAttribute('data-open') === 'true') return;
    gate.setAttribute('data-open', 'true');
    const reveal = () => {
      gate.setAttribute('hidden', '');
      ceremony.setAttribute('data-visible', 'true');
      if (reduced()) {
        ceremony.scrollIntoView({ behavior: 'auto', block: 'start' });
        return;
      }
      ceremony.animate(
        [
          { opacity: 0, transform: 'translateY(24px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 500, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' }
      );
      ceremony.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    if (reduced()) {
      reveal();
    } else {
      setTimeout(reveal, 520);
    }
  });
}

let lastInitAt = 0;
function init() {
  // Guard against a duplicate run: Astro fires 'astro:page-load' on the
  // very first load too when <ClientRouter /> is present, and we also
  // want a fallback for the (unlikely) case it doesn't fire at all.
  const now = Date.now();
  if (now - lastInitAt < 50) return;
  lastInitAt = now;

  initLessonDots();
  initEntrance();
  initTrailDraw();
  initXpBar();
  initMascotBreathing();
  initCompleteButtons();
  initQuizReactions();
  initGate();
  initRewards();
}

document.addEventListener('astro:page-load', init);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init, { once: true });
}
