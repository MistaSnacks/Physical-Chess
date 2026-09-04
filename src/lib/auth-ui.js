// auth-ui.js — plain-language mapping of every Wix loginState / errorCode
// (SPEC §2.1) plus the reCAPTCHA v3 helper. Screens never invent their own
// error copy.
//
// reCAPTCHA: https://dev.wix.com/docs/go-headless/authentication/members/custom-login-page/re-captcha/add-re-captcha-to-a-custom-login-page-js-sdk
// Pass the token as captchaTokens.invisibleRecaptchaToken (v3 / invisible)
// or captchaTokens.recaptchaToken (visible widget).

export const RECAPTCHA_SITE_KEY = import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY || '';

const VERIFY_KEY = 'pc.verify';

export function authMessage(res) {
  if (!res) return 'Something went wrong. Please try again.';
  switch (res.loginState) {
    case 'EMAIL_VERIFICATION_REQUIRED':
      return 'Check your email for a 6-digit code.';
    case 'OWNER_APPROVAL_REQUIRED':
      return 'Thanks. ACE will approve your account soon. You can close this page.';
    case 'SILENT_CAPTCHA_REQUIRED':
      return 'One more check and we can log you in.';
    case 'USER_CAPTCHA_REQUIRED':
      return 'Please complete the check below so we know you are a person.';
    case 'SUCCESS':
      return '';
    default:
      break;
  }
  switch (res.errorCode) {
    case 'invalidPassword':
      return 'That password does not match. Try again or reset it.';
    case 'invalidEmail':
      return 'That email does not look right. Check it and try again.';
    case 'resetPassword':
      return 'This account needs a new password. Use Forgot your password.';
    case 'missingCaptchaToken':
      return 'Please wait a moment and try again. The safety check did not finish.';
    case 'invalidCaptchaToken':
      return 'The safety check expired. Try again.';
    case 'emailAlreadyExists':
      return 'That email already has an account. Log in instead.';
    default:
      return res.error || 'We could not do that. Check the details and try again.';
  }
}

export function loginQueryMessage(search = location.search) {
  const q = new URLSearchParams(search);
  if (q.get('reset') === '1') return 'Your password was reset. Log in with the new one.';
  if (q.get('error') === 'state') return 'That sign-in link was used or expired. Please log in again.';
  if (q.get('error') === 'exchange') return 'We could not finish signing you in. Please try again.';
  return '';
}

/** Load recaptcha v3 only when PUBLIC_RECAPTCHA_SITE_KEY is set. */
export function loadRecaptcha() {
  if (!RECAPTCHA_SITE_KEY) return Promise.resolve(false);
  if (window.grecaptcha?.execute) return Promise.resolve(true);
  if (window.__pcRecaptcha) return window.__pcRecaptcha;
  window.__pcRecaptcha = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_SITE_KEY)}`;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error('recaptcha failed to load'));
    document.head.appendChild(s);
  });
  return window.__pcRecaptcha;
}

export async function recaptchaToken(action = 'login') {
  if (!RECAPTCHA_SITE_KEY) return null;
  await loadRecaptcha();
  await new Promise((r) => window.grecaptcha.ready(r));
  return window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
}

export function fillRecaptchaField(form, token) {
  const input = form?.querySelector('[data-recaptcha]');
  if (input) input.value = token || '';
}

export function saveVerifyState({ stateToken, next = '/who' }) {
  sessionStorage.setItem(VERIFY_KEY, JSON.stringify({ stateToken, next }));
}

export function readVerifyState() {
  try { return JSON.parse(sessionStorage.getItem(VERIFY_KEY) || 'null'); } catch { return null; }
}

export function clearVerifyState() {
  sessionStorage.removeItem(VERIFY_KEY);
}

/**
 * Drive the post-login/register state machine. Returns:
 *   'ok'        — redirect exchange started
 *   'verify'    — sent to /verify
 *   'pending'   — owner approval; caller should show authMessage
 *   'captcha'   — silent/visible captcha needed; caller retries
 *   'error'     — show authMessage
 */
export async function continueAuth(res, { next = '/who', captchaKind } = {}) {
  const { beginRedirectExchange, beginEmailVerification } = await import('./wix.js');
  if (res.loginState === 'SUCCESS') {
    await beginRedirectExchange(res.data.sessionToken, next);
    return 'ok';
  }
  if (res.loginState === 'EMAIL_VERIFICATION_REQUIRED') {
    beginEmailVerification(res.data?.stateToken, next);
    return 'verify';
  }
  if (res.loginState === 'OWNER_APPROVAL_REQUIRED') return 'pending';
  if (res.loginState === 'SILENT_CAPTCHA_REQUIRED' && captchaKind !== 'silent') return 'captcha-silent';
  if (res.loginState === 'USER_CAPTCHA_REQUIRED' && captchaKind !== 'visible') return 'captcha-visible';
  return 'error';
}
