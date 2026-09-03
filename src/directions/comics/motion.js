// motion.js — Axé Comics interactive motion.
//
// Most of this direction's motion (panel entrance slide+overshoot, starburst
// pop+wobble, halftone drift, speech-bubble typing, hover shadow bump, the
// per-choice AXÉ! burst) is pure CSS in theme.css, driven by attribute
// selectors and animation-fill-mode so it needs no JS and collapses for
// `prefers-reduced-motion` via the global base.css guard.
//
// This file wires the handful of things that need real interactivity:
//   - quiz:correct  -> shake the quiz panel (the reward moment)
//   - quiz:done     -> reveal the full-screen "AXÉ!!!" splash (celebration)
//   - movements "MARK DONE" buttons -> demo toggle to a DONE! state
//   - the Movements splash video play button

function restartAnimation(el, className) {
  el.classList.remove(className);
  // eslint-disable-next-line no-unused-expressions
  void el.offsetWidth;
  el.classList.add(className);
}

function wireQuizReward() {
  document.querySelectorAll('[data-quiz]').forEach((quiz) => {
    if (quiz.dataset.comicsWired === 'true') return;
    quiz.dataset.comicsWired = 'true';

    const panel = quiz.closest('.cx-quiz-panel') || quiz;

    quiz.addEventListener('quiz:correct', () => {
      restartAnimation(panel, 'cx-shake');
    });

    quiz.addEventListener('quiz:done', (event) => {
      const overlay = document.querySelector('[data-celebrate]');
      if (!overlay) return;
      const { score, total } = event.detail || {};
      const scoreEl = overlay.querySelector('[data-celebrate-score]');
      if (scoreEl && typeof score === 'number') {
        scoreEl.textContent = `${score} / ${total} correct — +${score * 50} XP`;
      }
      // Unhiding (display:none -> flex) is enough to replay the
      // fill-mode:both entrance animation on .cx-celebrate__title fresh.
      overlay.hidden = false;
    });
  });
}

function wireMarkComplete() {
  document.querySelectorAll('[data-step-mark]').forEach((btn) => {
    if (btn.dataset.wired === 'true') return;
    btn.dataset.wired = 'true';
    btn.addEventListener('click', () => {
      const step = btn.closest('[data-step]');
      if (step) step.dataset.done = 'true';
    });
  });
}

function wireSplashVideo() {
  document.querySelectorAll('[data-splash-play]').forEach((btn) => {
    if (btn.dataset.wired === 'true') return;
    btn.dataset.wired = 'true';
    btn.addEventListener('click', () => {
      const media = btn.closest('[data-video-key]');
      if (!media) return;
      const poster = media.querySelector('.cx-splash__poster');
      const video = media.querySelector('.cx-splash__video');
      if (poster) poster.hidden = true;
      btn.hidden = true;
      if (video) {
        video.hidden = false;
        video.play().catch(() => {});
      }
    });
  });
}

function init() {
  wireQuizReward();
  wireMarkComplete();
  wireSplashVideo();
}

document.addEventListener('astro:page-load', init);
init();
