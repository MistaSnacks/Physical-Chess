// streaks.js — weekly "roda weeks" streak (SPEC §4.3). Pure. Weeks are ISO
// weeks in America/New_York.
const TZ = 'America/New_York';

/** 'YYYY-Www' ISO week key for a date in New York time. */
export function isoWeek(date) {
  const d = new Date(date);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  const local = new Date(Date.UTC(get('year'), get('month') - 1, get('day')));
  const day = local.getUTCDay() || 7; // Mon=1..Sun=7
  local.setUTCDate(local.getUTCDate() + 4 - day); // Thursday of this week
  const yearStart = new Date(Date.UTC(local.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((local - yearStart) / 86400000 + 1) / 7);
  return `${local.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Number of weeks between two ISO week keys (b - a). */
export function weekDiff(a, b) {
  return Math.round((weekStart(b) - weekStart(a)) / (7 * 86400000));
}

function weekStart(key) {
  const [y, w] = key.split('-W').map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - day + 1 + (w - 1) * 7);
  return monday.getTime();
}

/**
 * { weeks, activeThisWeek, lastActiveWeek, weeksList } for a player from the
 * weeks in which they earned XP. A streak survives if every week back from
 * this week (or last week, if this week is not yet active) is present.
 */
export function weekStreak(events, now = new Date()) {
  const weeks = new Set();
  for (const e of events) if ((e.xp || 0) > 0) weeks.add(isoWeek(e.occurredAt));
  const thisWeek = isoWeek(now);
  const sorted = [...weeks].sort();
  const lastActiveWeek = sorted[sorted.length - 1] || null;
  const activeThisWeek = weeks.has(thisWeek);
  let cursor = activeThisWeek ? thisWeek : lastActiveWeek;
  if (!cursor) return { weeks: 0, activeThisWeek: false, lastActiveWeek: null, weeksList: [] };
  if (!activeThisWeek && weekDiff(cursor, thisWeek) > 1) {
    return { weeks: 0, activeThisWeek: false, lastActiveWeek, weeksList: sorted };
  }
  let count = 0;
  while (weeks.has(cursor)) {
    count += 1;
    cursor = prevWeek(cursor);
  }
  return { weeks: count, activeThisWeek, lastActiveWeek, weeksList: sorted };
}

function prevWeek(key) {
  return isoWeek(new Date(weekStart(key) - 7 * 86400000 + 12 * 3600000));
}

/** True when a new XP event at `now` should also mint a `streak.week` bonus. */
export function startsNewStreakWeek(events, now = new Date()) {
  const thisWeek = isoWeek(now);
  return !events.some((e) => (e.xp || 0) > 0 && isoWeek(e.occurredAt) === thisWeek);
}
