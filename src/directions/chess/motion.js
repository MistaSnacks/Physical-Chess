// motion.js — Grandmaster Roda animations.
// CSS keyframes + Web Animations API + IntersectionObserver only (no
// animation library). Every entrance/idle here is wrapped so
// prefers-reduced-motion collapses it to the final state instantly
// (base.css's global rule handles the CSS side; this file skips the
// JS-driven bits — the real chess-clock countdown keeps ticking since
// it is functional, not decorative).

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* -------------------------------------------------------------------
   Entrance: checker wave — diagonal stagger by data-row/data-col,
   plain index stagger (60ms) for everything else.
   ------------------------------------------------------------------- */
function initEntrance() {
  const selector =
    '.chess-fade-up, .chess-floor__square, .chess-tile, .chess-flag, .chess-dot, .chess-arrow';
  const els = Array.from(document.querySelectorAll(selector)).filter(
    (el) => !el.classList.contains('is-in')
  );
  if (!els.length) return;

  if (reducedMotion()) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }

  els.forEach((el, i) => {
    const row = Number(el.dataset.row || 0);
    const col = Number(el.dataset.col || 0);
    const diagonal = row + col;
    const delay = el.dataset.row || el.dataset.col ? diagonal * 45 : i * 55;
    el.style.animationDelay = `${Math.min(delay, 900)}ms`;
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  els.forEach((el) => io.observe(el));
}

/* -------------------------------------------------------------------
   Knight-jump arrow: measure the real path length so the
   stroke-dashoffset draw-on animation is exact, not a guessed number.
   ------------------------------------------------------------------- */
function initArrows() {
  document.querySelectorAll('.chess-arrow path').forEach((path) => {
    try {
      const len = path.getTotalLength();
      path.style.setProperty('--len', String(Math.ceil(len)));
    } catch (e) {
      /* no-op — keep the CSS fallback */
    }
  });
}

/* -------------------------------------------------------------------
   Chess clock: Maya's side really counts down. Mestre's side is a
   static reference clock (per SPEC §5.4).
   ------------------------------------------------------------------- */
function initClock() {
  const clockValue = document.querySelector('[data-chess-clock-maya]');
  const clockSide = document.querySelector('[data-chess-clock-side-maya]');
  if (!clockValue) return;

  let seconds = Number(clockValue.dataset.seconds || 42);

  function render() {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    clockValue.textContent = `${m}:${String(s).padStart(2, '0')}`;
    if (clockSide) clockSide.dataset.low = seconds <= 10 ? 'true' : 'false';
  }

  render();
  const id = setInterval(() => {
    if (seconds <= 0) {
      clearInterval(id);
      return;
    }
    seconds -= 1;
    render();
  }, 1000);
}

/* -------------------------------------------------------------------
   Puzzle reward: on quiz:correct, jump the knight on the position
   panel to the next square + flash the reward chip. On quiz:done,
   flip up the full-screen CHECKMATE overlay.
   ------------------------------------------------------------------- */
function initQuizReward() {
  const quiz = document.querySelector('[data-quiz]');
  const miniBoard = document.querySelector('.chess-mini-board');
  const piece = miniBoard ? miniBoard.querySelector('.chess-mini-board__piece') : null;
  const reward = document.querySelector('.chess-position-reward');
  const progressSquares = Array.from(document.querySelectorAll('.chess-puzzle-progress__square'));
  const checkmate = document.querySelector('.chess-checkmate');

  if (!quiz) return;

  let positions = [];
  if (miniBoard && miniBoard.dataset.positions) {
    positions = miniBoard.dataset.positions.split(';').map((pair) => {
      const [col, row] = pair.split(',').map(Number);
      return { col, row };
    });
  }

  function placePiece(col, row, cells = 4) {
    if (!piece) return;
    const pct = 100 / cells;
    piece.style.left = `${col * pct + pct / 2}%`;
    piece.style.top = `${row * pct + pct / 2}%`;
  }

  function updateProgress(index, total) {
    progressSquares.forEach((sq, i) => {
      sq.classList.remove('chess-puzzle-progress__square--done', 'chess-puzzle-progress__square--current');
      if (i < index) sq.classList.add('chess-puzzle-progress__square--done');
      else if (i === index) sq.classList.add('chess-puzzle-progress__square--current');
    });
  }

  quiz.addEventListener('quiz:correct', (e) => {
    const index = e.detail.index;
    const next = positions[index + 1] || positions[positions.length - 1];
    if (next) placePiece(next.col, next.row);
    if (reward) {
      reward.dataset.visible = 'true';
      if (!reducedMotion()) {
        setTimeout(() => {
          reward.dataset.visible = 'false';
        }, 1400);
      }
    }
    updateProgress(index + 1, progressSquares.length);
  });

  quiz.addEventListener('quiz:wrong', (e) => {
    updateProgress(e.detail.index + 1, progressSquares.length);
  });

  quiz.addEventListener('quiz:done', () => {
    if (checkmate) checkmate.dataset.visible = 'true';
  });
}

/* -------------------------------------------------------------------
   Movements "mark complete" drill card — a simple, reversible toggle.
   ------------------------------------------------------------------- */
function initMarkComplete() {
  const btn = document.querySelector('[data-chess-mark-complete]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const done = btn.dataset.done === 'true';
    btn.dataset.done = done ? 'false' : 'true';
    btn.textContent = done ? 'MARK COMPLETE' : 'PRACTICE COMPLETE ✓';
  });
}

/* -------------------------------------------------------------------
   Boot — runs on first paint and again after every Astro view
   transition, since the DOM is replaced on navigation.
   ------------------------------------------------------------------- */
function boot() {
  initEntrance();
  initArrows();
  initClock();
  initQuizReward();
  initMarkComplete();
}

document.addEventListener('astro:page-load', boot);
boot();
