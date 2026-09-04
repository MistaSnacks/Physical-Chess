// speech.js — Web Speech read-aloud (SPEC §4.8). English for lesson text,
// pt-BR for glossary words when the device has that voice. Stops on
// navigation. Highlights [data-sent] nodes one sentence at a time.
let generation = 0;
let voicesBound = false;

function voices() {
  if (typeof speechSynthesis === 'undefined') return [];
  return speechSynthesis.getVoices();
}

function ensureVoices() {
  if (voicesBound || typeof speechSynthesis === 'undefined') return;
  voicesBound = true;
  speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
  speechSynthesis.getVoices();
}

export function pickVoice(lang = 'en-US') {
  ensureVoices();
  const want = String(lang).toLowerCase().replace('_', '-');
  const list = voices();
  return (
    list.find((v) => v.lang.toLowerCase().replace('_', '-') === want) ||
    list.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(want.split('-')[0])) ||
    null
  );
}

function clearHighlights() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('[data-sent].is-reading').forEach((el) => el.classList.remove('is-reading'));
}

/** Cancel any in-flight utterance and drop sentence highlights. */
export function stop() {
  generation += 1;
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  clearHighlights();
}

function utter(text, { lang = 'en-US', rate = 0.95 } = {}) {
  return new Promise((resolve) => {
    if (!text || typeof speechSynthesis === 'undefined') { resolve(); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    const v = pickVoice(lang);
    if (v) u.voice = v;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

/**
 * Speak a single string. Cancels anything already speaking.
 * @param {string} text
 * @param {{ lang?: string, rate?: number, onEnd?: () => void }} [opts]
 */
export function speak(text, opts = {}) {
  const { lang = 'en-US', rate = 0.95, onEnd } = opts;
  const my = ++generation;
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  clearHighlights();
  ensureVoices();
  utter(text, { lang, rate }).then(() => { if (my === generation) onEnd?.(); });
}

/**
 * Speak each [data-sent] (or any) node in order, toggling .is-reading.
 * @param {Iterable<Element>} nodes
 * @param {{ lang?: string, rate?: number, onEnd?: () => void }} [opts]
 */
export async function speakSentences(nodes, opts = {}) {
  const { lang = 'en-US', rate = 0.95, onEnd } = opts;
  const list = Array.from(nodes || []).filter((n) => (n.textContent || '').trim());
  const my = ++generation;
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  clearHighlights();
  ensureVoices();
  for (const el of list) {
    if (my !== generation) return;
    el.classList.add('is-reading');
    try { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch { /* ignore */ }
    await utter((el.textContent || '').trim(), { lang, rate });
    el.classList.remove('is-reading');
  }
  if (my === generation) onEnd?.();
}

let navBound = false;
/** Cancel speech on Astro swaps and page hide. Safe to call more than once. */
export function bindStopOnNavigate() {
  if (navBound || typeof document === 'undefined') return;
  navBound = true;
  document.addEventListener('astro:before-swap', stop);
  window.addEventListener('pagehide', stop);
}
