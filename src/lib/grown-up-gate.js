// grown-up-gate.js — a 2-digit math check before /family (SPEC §5.2 / WP4).
// Kids share the device; this is a speed bump, not security. Session-only.

const KEY = 'pc.grownUp';

export function isGrownUp() {
  try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; }
}

export function markGrownUp() {
  try { sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ }
}

function rand(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function requireGrownUp() {
  if (isGrownUp()) return Promise.resolve(true);
  return new Promise((resolve) => {
    const a = rand(6, 9);
    const b = rand(4, 9);
    const overlay = document.createElement('div');
    overlay.className = 'quest-grownup';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'quest-grownup-title');
    overlay.innerHTML = `
      <form class="quest-grownup__card" data-grownup-form>
        <p class="quest-screen__eyebrow">Grown-ups</p>
        <h2 class="quest-grownup__title" id="quest-grownup-title">Quick check</h2>
        <p class="quest-grownup__body">This page is for grown-ups. What is ${a} + ${b}?</p>
        <div class="quest-form__error" data-error hidden></div>
        <div class="quest-field">
          <label class="quest-field__label" for="quest-grownup-answer">Your answer</label>
          <input class="quest-field__input" id="quest-grownup-answer" name="answer" inputmode="numeric" autocomplete="off" required />
        </div>
        <div class="quest-btn-row">
          <button class="quest-btn quest-btn--lime" type="submit">Continue</button>
          <button class="quest-btn quest-btn--ghost" type="button" data-grownup-cancel>Back</button>
        </div>
      </form>`;
    document.body.appendChild(overlay);
    const input = overlay.querySelector('#quest-grownup-answer');
    const err = overlay.querySelector('[data-error]');
    const close = (ok) => {
      overlay.remove();
      resolve(ok);
    };
    overlay.querySelector('[data-grownup-cancel]').addEventListener('click', () => close(false));
    overlay.querySelector('[data-grownup-form]').addEventListener('submit', (e) => {
      e.preventDefault();
      const n = Number(String(input.value).trim());
      if (n === a + b) {
        markGrownUp();
        close(true);
        return;
      }
      err.textContent = 'Not quite. Ask a grown-up for this page.';
      err.hidden = false;
      input.value = '';
      input.focus();
    });
    input.focus();
  });
}
