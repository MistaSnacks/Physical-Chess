// library-search.js — title search for the instructor library (SPEC-v3 R9.3).
// Kept apart from library.js so the browser bundle carries only these few
// functions plus a small JSON index, not the whole curriculum.
//
// Case and accents are ignored ("au" finds "Aú"). Exact-word matches rank
// first, then word-prefix, then substring. No search library needed.

/** Sort order inside one rank: lessons first, page links last. */
export const TYPE_ORDER = { lesson: 0, glossary: 1, instrument: 2, yt: 3, wix: 4, page: 5 };

/** Lower-case, accents removed: "Aú" → "au", "Agogô" → "agogo". */
export function fold(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Folded words, split on anything that is not a letter or digit. */
export function words(s) {
  return fold(s).split(/[^a-z0-9]+/).filter(Boolean);
}

/**
 * Match rank of one title against a query: 0 exact word (or run of words),
 * 1 word prefix, 2 substring, -1 no match.
 */
export function matchRank(title, query) {
  const q = words(query).join(' ');
  if (!q) return -1;
  const w = words(title).join(' ');
  if (` ${w} `.includes(` ${q} `)) return 0;
  if (` ${w}`.includes(` ${q}`)) return 1;
  if (w.includes(q)) return 2;
  return -1;
}

/**
 * Search entry titles (lesson titles, glossary words, instrument names, video
 * and page titles). Within a rank, a title that is exactly the query leads,
 * then type order, then catalog order. Entries need `title` and `type`.
 */
export function searchEntries(query, entries) {
  const q = words(query).join(' ');
  if (!q) return [];
  return entries
    .map((entry, i) => ({ entry, i, rank: matchRank(entry.title, query), whole: words(entry.title).join(' ') === q }))
    .filter((r) => r.rank >= 0)
    .sort((a, b) => (a.rank - b.rank)
      || (Number(b.whole) - Number(a.whole))
      || ((TYPE_ORDER[a.entry.type] ?? 9) - (TYPE_ORDER[b.entry.type] ?? 9))
      || (a.i - b.i))
    .map((r) => r.entry);
}
