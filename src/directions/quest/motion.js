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

function reduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function stagger(nodes, attr, delayStep, startDelay = 0) {
  nodes.forEach((el, i) => {
    if (reduced()) {
      el.setAttribute(attr, 'true');
      return;
    }
    const delay = startDelay + i * delayStep;
    setTimeout(() => el.setAttribute(attr, 'true'), delay);
  });
}

function initEntrance() {
  const enterEls = Array.from(document.querySelectorAll('[data-quest-enter]'));
  stagger(enterEls, 'data-quest-enter', 70, 20);

  const nodeEls = Array.from(document.querySelectorAll('[data-quest-node]'));
  stagger(nodeEls, 'data-quest-node', 90, 260);
}

function initTrailDraw() {
  const paths = document.querySelectorAll('.quest-trail-path');
  paths.forEach((path) => {
    if (!(path instanceof SVGPathElement)) return;
    const length = path.getTotalLength();
    if (reduced()) {
      path.style.strokeDasharray = 'none';
      path.style.strokeDashoffset = '0';
      return;
    }
    const dashed = path.classList.contains('quest-trail-path--dashed');
    if (!dashed) {
      path.style.strokeDasharray = `${length}`;
    } else {
      // preserve the dashed pattern while still animating a draw-on via
      // dashoffset over a duplicated length
      path.style.strokeDasharray = `4 26`;
    }
    path.style.strokeDashoffset = `${length}`;
    path.getBoundingClientRect(); // force layout before transition
    path.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)';
    requestAnimationFrame(() => {
      path.style.strokeDashoffset = '0';
    });
  });
}

function initXpBar() {
  const fills = document.querySelectorAll('[data-xp-fill]');
  fills.forEach((fill) => {
    const percent = fill.getAttribute('data-xp-fill') || '0';
    if (reduced()) {
      fill.style.width = `${percent}%`;
      return;
    }
    fill.style.width = '0%';
    setTimeout(() => {
      fill.style.width = `${percent}%`;
    }, 500);
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
  let xpEarned = 0;
  let heartsLost = 0;

  function updateProgress(index, state) {
    const seg = progressSegs[index];
    if (seg) seg.setAttribute('data-state', state);
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

    if (reduced() || !mascotTarget) return;

    // Fly a "+50 XP" chip from the chosen answer toward the mascot's XP chip.
    const choiceEl = quizRoot.querySelector(
      `[data-question-index="${detail.index}"] [data-quiz-choice][data-selected="true"]`
    );
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
    if (flashEl && !reduced()) {
      flashEl.classList.add('is-flashing');
      setTimeout(() => flashEl.classList.remove('is-flashing'), 750);
    }
    if (!reduced()) fireConfetti();
  });
}

// ---------------------------------------------------------------------
// Confetti — canvas + rAF only (per motion rule 5)
// ---------------------------------------------------------------------
function fireConfetti() {
  const canvas = document.querySelector('.quest-confetti-canvas');
  if (!(canvas instanceof HTMLCanvasElement)) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  ctx.scale(dpr, dpr);

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
    if (elapsed < duration) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------
// Batizado gate reveal
// ---------------------------------------------------------------------
function initGate() {
  const gate = document.querySelector('[data-quest-gate]');
  const ceremony = document.querySelector('[data-quest-ceremony]');
  if (!gate || !ceremony) return;

  gate.addEventListener('click', () => {
    gate.setAttribute('data-open', 'true');
    ceremony.setAttribute('data-visible', 'true');
    if (!reduced()) {
      ceremony.animate(
        [
          { opacity: 0, transform: 'translateY(24px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 500, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' }
      );
    }
    ceremony.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
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

  initEntrance();
  initTrailDraw();
  initXpBar();
  initMascotBreathing();
  initCompleteButtons();
  initQuizReactions();
  initGate();
}

document.addEventListener('astro:page-load', init);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init, { once: true });
}
