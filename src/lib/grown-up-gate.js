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
    const previousFocus = document.activeElement;
    const overlay = document.createElement('div');
    overlay.className = 'quest-grownup';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'quest-grownup-title');
    overlay.setAttribute('aria-describedby', 'quest-grownup-description');
    overlay.innerHTML = `
      <form class="quest-grownup__card" data-grownup-form>
        <p class="quest-screen__eyebrow">Grown-ups</p>
        <h2 class="quest-grownup__title" id="quest-grownup-title">Quick check</h2>
        <p class="quest-grownup__body" id="quest-grownup-description">This page is for grown-ups. What is ${a} + ${b}?</p>
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
      document.removeEventListener('keydown', onKeydown);
      overlay.remove();
      if (!ok && previousFocus instanceof HTMLElement) previousFocus.focus();
      resolve(ok);
    };
    const onKeydown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = Array.from(overlay.querySelectorAll('input, button')).filter((el) => !el.disabled);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
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
    document.addEventListener('keydown', onKeydown);
    input.focus();
  });
}
