// motion.js — Sticker Roda animation system.
// CSS keyframes + Web Animations API + IntersectionObserver only (no
// animation library, per SPEC §3). Every effect here is skipped/short-
// circuited when the user prefers reduced motion (SPEC §6.4).

const reduceMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* -----------------------------------------------------------------------
   1. Entrance: cards drop in with a spring (translateY 24px -> 0, rotate
      0 -> resting tilt), 60ms stagger within each [data-stagger] group.
      -------------------------------------------------------------------- */
function playEntrance(el, index) {
  const tilt = el.style.getPropertyValue('--tilt') || '0deg';
  const delay = index * 60;

  if (reduceMotion()) {
    el.style.opacity = '1';
    el.style.transform = `translateY(0) rotate(${tilt})`;
    return;
  }

  el.style.opacity = '0';
  const anim = el.animate(
    [
      { opacity: 0, transform: 'translateY(24px) rotate(0deg)' },
      { opacity: 1, transform: `translateY(-4px) rotate(${tilt})`, offset: 0.72 },
      { opacity: 1, transform: `translateY(0) rotate(${tilt})` },
    ],
    {
      duration: 620,
      delay,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      fill: 'both',
    }
  );
  anim.addEventListener('finish', () => {
    el.style.opacity = '1';
    el.style.transform = `translateY(0) rotate(${tilt})`;
    // Bake the final frame into inline style then drop the animation so
    // CSS hover/active transitions can take over the transform property.
    try {
      anim.commitStyles();
    } catch (e) {
      /* commitStyles can throw if the element left the document */
    }
    anim.cancel();
  });
}

function initEntrance() {
  const groups = document.querySelectorAll('[data-stagger]');
  const seen = new WeakSet();

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const group = entry.target;
        if (seen.has(group)) return;
        seen.add(group);
        const cards = group.querySelectorAll('[data-anim="card"]');
        cards.forEach((card, i) => playEntrance(card, i));
        io.unobserve(group);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  groups.forEach((g) => io.observe(g));

  // Standalone cards outside a [data-stagger] group still get an entrance.
  document
    .querySelectorAll('[data-anim="card"]:not([data-stagger] [data-anim="card"])')
    .forEach((card, i) => {
      const soloIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              playEntrance(card, 0);
              soloIo.disconnect();
            }
          });
        },
        { threshold: 0.15 }
      );
      soloIo.observe(card);
    });
}

/* -----------------------------------------------------------------------
   2. Progress bars fill on scroll.
      -------------------------------------------------------------------- */
function initProgressBars() {
  const bars = document.querySelectorAll('[data-progress]');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const bar = entry.target;
        const fill = bar.querySelector('[data-progress-fill]');
        const pct = Math.max(0, Math.min(100, Number(bar.dataset.progress) || 0));
        if (fill) {
          if (reduceMotion()) {
            fill.style.width = `${pct}%`;
          } else {
            fill.style.width = '0%';
            requestAnimationFrame(() => {
              fill.style.transition = 'width 900ms cubic-bezier(0.16,1,0.3,1)';
              fill.style.width = `${pct}%`;
            });
          }
        }
        io.unobserve(bar);
      });
    },
    { threshold: 0.4 }
  );
  bars.forEach((b) => io.observe(b));
}

/* -----------------------------------------------------------------------
   3. "Done!" chips pop with a scale overshoot when they enter view.
      -------------------------------------------------------------------- */
function initDoneChips() {
  const chips = document.querySelectorAll('[data-chip="done"]');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        popChip(entry.target);
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );
  chips.forEach((c) => io.observe(c));
}

export function popChip(chip) {
  if (reduceMotion()) return;
  chip.animate(
    [
      { transform: 'scale(0.4)', offset: 0 },
      { transform: 'scale(1.18)', offset: 0.65 },
      { transform: 'scale(1)', offset: 1 },
    ],
    { duration: 420, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
  );
}

/* -----------------------------------------------------------------------
   4. Mobile bottom sheet.
      -------------------------------------------------------------------- */
function initSheet() {
  const sheet = document.querySelector('[data-mobile-sheet]');
  if (!sheet) return;
  const panel = sheet.querySelector('.sr-sheet__panel');
  const openers = document.querySelectorAll('[data-sheet-open]');
  const closers = sheet.querySelectorAll('[data-sheet-close]');

  function open() {
    sheet.hidden = false;
    document.body.style.overflow = 'hidden';
    openers.forEach((o) => o.setAttribute('aria-expanded', 'true'));
    requestAnimationFrame(() => {
      sheet.dataset.open = 'true';
      if (!reduceMotion() && panel) {
        panel.animate(
          [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }],
          { duration: 380, easing: 'cubic-bezier(0.16,1,0.3,1)' }
        );
      }
    });
  }

  function close() {
    sheet.dataset.open = 'false';
    document.body.style.overflow = '';
    openers.forEach((o) => o.setAttribute('aria-expanded', 'false'));
    const done = () => {
      sheet.hidden = true;
    };
    if (!reduceMotion() && panel) {
      const anim = panel.animate(
        [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }],
        { duration: 260, easing: 'cubic-bezier(0.4,0,1,1)' }
      );
      anim.addEventListener('finish', done);
    } else {
      done();
    }
  }

  openers.forEach((o) => o.addEventListener('click', open));
  closers.forEach((c) => c.addEventListener('click', close));
}

/* -----------------------------------------------------------------------
   5. Confetti canvas — 120 pieces in sun / lime / coral / blue, 1.6s.
      rAF loop only lives here (SPEC §6.5).
      -------------------------------------------------------------------- */
const CONFETTI_COLORS = ['#FFC93C', '#2FBF71', '#FF6B57', '#3D9BE9'];

export function fireConfetti(originRect, count = 120, duration = 1600) {
  if (reduceMotion()) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'sr-confetti-canvas';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: '9999',
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const originX = originRect ? originRect.left + originRect.width / 2 : window.innerWidth / 2;
  const originY = originRect ? originRect.top + originRect.height / 2 : window.innerHeight / 3;

  const pieces = Array.from({ length: count }, () => ({
    x: originX + (Math.random() - 0.5) * 60,
    y: originY + (Math.random() - 0.5) * 20,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    vx: (Math.random() - 0.5) * 9,
    vy: -(6 + Math.random() * 7),
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.35,
    gravity: 0.28 + Math.random() * 0.12,
  }));

  const start = performance.now();

  function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      const fade = t > duration - 300 ? Math.max(0, (duration - t) / 300) : 1;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (t < duration) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(frame);
}

/* -----------------------------------------------------------------------
   6. Quiz reactions — bounce + confetti on correct, shake on wrong,
      full celebration on done.
      -------------------------------------------------------------------- */
function bounce(el) {
  if (reduceMotion() || !el) return;
  el.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.06) translateY(-6px)', offset: 0.4 },
      { transform: 'scale(0.99)', offset: 0.7 },
      { transform: 'scale(1)' },
    ],
    { duration: 480, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
  );
}

function shake(el) {
  if (reduceMotion() || !el) return;
  el.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-8px)' },
      { transform: 'translateX(7px)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(3px)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 420, easing: 'ease-out' }
  );
}

function initQuizReactions() {
  document.querySelectorAll('[data-quiz]').forEach((quiz) => {
    if (quiz.dataset.motionInit === 'true') return;
    quiz.dataset.motionInit = 'true';

    quiz.addEventListener('quiz:correct', (e) => {
      const question = quiz.querySelector('[data-quiz-question]:not([hidden])');
      const chosen = question && question.querySelector('[data-quiz-choice][data-selected="true"]');
      bounce(chosen || question);
      const rect = (chosen || quiz).getBoundingClientRect();
      fireConfetti(rect, 120, 1600);
    });

    quiz.addEventListener('quiz:wrong', () => {
      const question = quiz.querySelector('[data-quiz-question]:not([hidden])');
      const chosen = question && question.querySelector('[data-quiz-choice][data-selected="true"]');
      shake(chosen || question);
    });

    quiz.addEventListener('quiz:done', () => {
      quiz.classList.add('is-celebrating');
      const rect = quiz.getBoundingClientRect();
      fireConfetti(rect, 120, 1600);
      fireConfetti({ left: 0, top: 0, width: window.innerWidth, height: 0 }, 60, 1600);
      window.setTimeout(() => quiz.classList.remove('is-celebrating'), 2200);
    });
  });
}

/* -----------------------------------------------------------------------
   7. Mark-complete buttons (Movements lesson player) — local UI-only
      completion toggle with a Done-chip pop.
      -------------------------------------------------------------------- */
function initMarkComplete() {
  document.querySelectorAll('[data-mark-complete]').forEach((btn) => {
    if (btn.dataset.motionInit === 'true') return;
    btn.dataset.motionInit = 'true';
    btn.addEventListener('click', () => {
      const card = btn.closest('[data-lesson-card]');
      if (!card || card.dataset.completed === 'true') return;
      card.dataset.completed = 'true';
      const chip = card.querySelector('[data-chip="done"]');
      if (chip) {
        chip.hidden = false;
        popChip(chip);
      }
      btn.textContent = 'Marked complete';
      btn.disabled = true;
      bounce(card);
    });
  });
}

/* -----------------------------------------------------------------------
   Init
   -------------------------------------------------------------------- */
function initAll() {
  initEntrance();
  initProgressBars();
  initDoneChips();
  initSheet();
  initQuizReactions();
  initMarkComplete();
}

document.addEventListener('astro:page-load', initAll);
initAll();
