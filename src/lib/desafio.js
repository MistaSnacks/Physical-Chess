// desafio.js — pick today's Desafio and describe it. Pure + tiny DOM helpers.
import { DESAFIO_POOL } from '../content/desafio.js';
import { nyDate } from './game/streaks.js';

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Same challenge for every player on a given NY date (rotating pool). */
export function desafioForDate(date = new Date()) {
  const dateKey = nyDate(date);
  const item = DESAFIO_POOL[hash(dateKey) % DESAFIO_POOL.length];
  return { ...item, dateKey };
}

export function shuffle(list, seed) {
  const out = list.slice();
  let h = hash(String(seed || 'seed'));
  for (let i = out.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1664525) + 1013904223) | 0;
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
