// mestres.js — Mestre of the week (SPEC-v3 WP13, R13.3). Pure.
// Every pop-up site shows the same mestre for a whole week. The index is the
// number of whole weeks since Monday 2026-09-28 in New York time, mod 15.
// It deliberately ignores ISO week numbers: 2026 has 53 ISO weeks, so
// `isoWeekNumber % 15` would jump at New Year.
import { POPUP_MESTRES } from '../../content/mestres.js';
import { nyDate } from './streaks.js';

/** Monday that starts rotation week 0 (order 1, Bimba), New York calendar date. */
export const MESTRE_WEEK_EPOCH = '2026-09-28';

const DAY = 86400000;

function dayNumber(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / DAY;
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Whole weeks between the epoch Monday and `date`'s New York calendar day
 * (negative before it). `date` is an instant (Date, ms, ISO timestamp) or a
 * bare 'YYYY-MM-DD' string, which is read as a New York calendar date.
 */
export function weeksSinceEpoch(date) {
  const ymd = typeof date === 'string' && YMD.test(date) ? date : nyDate(date);
  return Math.floor((dayNumber(ymd) - dayNumber(MESTRE_WEEK_EPOCH)) / 7);
}

/** Rotation index 0-14 for `date`. */
export function mestreWeekIndex(date) {
  const n = POPUP_MESTRES.length;
  return ((weeksSinceEpoch(date) % n) + n) % n;
}

/** The registry entry for the Mestre of the week that contains `date`. */
export function mestreOfWeek(date) {
  return POPUP_MESTRES[mestreWeekIndex(date)];
}
