// library.js — the instructor library catalog (SPEC-v3 R9.2, R9.3).
//
// One flat list of entries an instructor can pull up in class with no child
// selected. Entries point at the source records in src/content and
// src/data/media.js (`entry.source`); nothing is copied, so titles, copy and
// reviewNeeded always follow the source.
//
// IDs are type-prefixed because slugs collide (`lesson:au`, `glossary:au`):
//   lesson:<lessonId>       the 24 lessons
//   glossary:<slug>         the 12 Portuguese words
//   instrument:<id>         the four Field guide instruments
//   yt:<YOUTUBE key>        every YouTube video
//   wix:<WIX_VIDEOS key>    videoProject1 only (the other Wix clips wait for D11)
//   page:<slug>             links to the public /about, /graduation and /batizado pages
//
// Pure module: safe to import from Astro frontmatter, client scripts and
// node tests. It never reads or writes player state.
import { MODULES, LESSONS, GLOSSARY, INSTRUMENTS, INSTRUMENT_LESSON, moduleById, lessonById } from '../content/index.js';
import { YOUTUBE, WIX_VIDEOS } from '../data/media.js';
import { words, searchEntries } from './library-search.js';

export { fold, words, matchRank } from './library-search.js';

export const LIBRARY_BASE = '/coach/library';

/** Wix-hosted videos shown in the app today (home hero). The rest wait for D11. */
export const LIBRARY_WIX_VIDEOS = ['videoProject1'];

/** Public pages an instructor may want to open in class (links only). */
export const LIBRARY_PAGES = [
  { slug: 'about', path: '/about', title: 'About Us', group: 'about' },
  { slug: 'about-educators', path: '/about/educators', title: 'Educators', group: 'about' },
  { slug: 'about-the-ace', path: '/about/the-ace', title: 'the ACE', group: 'about' },
  { slug: 'about-abada', path: '/about/abada', title: 'ABADÁ', group: 'about' },
  { slug: 'about-faq', path: '/about/faq', title: 'F.A.Q.', group: 'about' },
  { slug: 'about-contact', path: '/about/contact', title: 'Contact', group: 'about' },
  { slug: 'graduation', path: '/graduation', title: 'Graduation', group: 'graduation' },
  { slug: 'graduation-what-is-batizado', path: '/graduation/what-is-batizado', title: 'What is Batizado?', group: 'graduation' },
  { slug: 'graduation-cordas', path: '/graduation/cordas', title: 'Cordas', group: 'graduation' },
  { slug: 'graduation-media', path: '/graduation/media', title: 'Batizado Media', group: 'graduation' },
  { slug: 'batizado', path: '/batizado', title: 'Batizado 2026', group: 'graduation' },
];

export const PAGE_GROUPS = [
  { id: 'about', title: 'About Us' },
  { id: 'graduation', title: 'Graduation' },
];

/** Labels for the type badge on rows and entry pages. */
export const KIND_LABEL = {
  video: 'Video lesson',
  reading: 'Reading',
  drill: 'Drill',
  quiz: 'Quiz',
  word: 'Word',
  instrument: 'Instrument',
  clip: 'Video',
  page: 'Page',
};

/** URL-safe slug from a word: "Aú" → "au", "Camará" → "camara". */
export function slugify(s) {
  return words(s).join('-');
}

function entryHref(type, slug) {
  return `${LIBRARY_BASE}/${type}/${slug}`;
}

function lessonEntry(lesson) {
  return {
    id: `lesson:${lesson.id}`,
    type: 'lesson',
    slug: lesson.id,
    kind: lesson.type,
    get title() { return lesson.title; },
    get reviewNeeded() { return Boolean(lesson.reviewNeeded); },
    moduleId: lesson.moduleId,
    group: lesson.group,
    href: entryHref('lesson', lesson.id),
    external: false,
    source: lesson,
  };
}

function glossaryEntry(g) {
  const slug = slugify(g.word);
  return {
    id: `glossary:${slug}`,
    type: 'glossary',
    slug,
    kind: 'word',
    get title() { return g.word; },
    get reviewNeeded() { return Boolean(g.reviewNeeded); },
    moduleId: 'culture',
    group: 'portuguese',
    href: entryHref('glossary', slug),
    external: false,
    source: g,
  };
}

function instrumentEntry(inst) {
  return {
    id: `instrument:${inst.id}`,
    type: 'instrument',
    slug: inst.id,
    kind: 'instrument',
    get title() { return inst.name; },
    get reviewNeeded() { return Boolean(inst.reviewNeeded); },
    moduleId: 'music',
    group: 'instruments',
    href: entryHref('instrument', inst.id),
    external: false,
    source: inst,
  };
}

function videoEntry(type, key, record) {
  return {
    id: `${type}:${key}`,
    type,
    slug: key,
    kind: 'clip',
    get title() { return record.title; },
    get reviewNeeded() { return false; },
    moduleId: null,
    group: null,
    href: entryHref(type, key),
    external: false,
    source: record,
  };
}

function pageEntry(page) {
  return {
    id: `page:${page.slug}`,
    type: 'page',
    slug: page.slug,
    kind: 'page',
    get title() { return page.title; },
    get reviewNeeded() { return false; },
    moduleId: null,
    group: page.group,
    href: page.path,
    external: true,
    source: page,
  };
}

export const CATALOG = [
  ...LESSONS.map(lessonEntry),
  ...GLOSSARY.map(glossaryEntry),
  ...INSTRUMENTS.map(instrumentEntry),
  ...Object.entries(YOUTUBE).map(([key, rec]) => videoEntry('yt', key, rec)),
  ...LIBRARY_WIX_VIDEOS.map((key) => videoEntry('wix', key, WIX_VIDEOS[key])),
  ...LIBRARY_PAGES.map(pageEntry),
];

const BY_ID = new Map(CATALOG.map((e) => [e.id, e]));

export function entryById(id) {
  return BY_ID.get(id) || null;
}

/** Entries that get their own library page (everything but page links). */
export function detailEntries() {
  return CATALOG.filter((e) => !e.external);
}

/** Lessons that play a given YouTube key. */
export function lessonsForVideo(key) {
  return LESSONS.filter((l) => l.videoKey === key);
}

/** Library entry for the lesson that teaches an instrument (R10.5 map). */
export function lessonForInstrument(instrumentId) {
  const lessonId = INSTRUMENT_LESSON[instrumentId];
  return lessonId ? lessonById(lessonId) : null;
}

/** The glossary entry spelled like an instrument name, if any (Berimbau). */
export function glossaryForWord(word) {
  return entryById(`glossary:${slugify(word)}`);
}

/**
 * Browse tree: modules → groups → entries (lessons, plus the words under
 * Culture · Portuguese and the instruments under Music · Instruments), then
 * videos, then page links.
 */
export function browseTree() {
  const modules = MODULES.map((m) => ({
    id: m.id,
    title: m.title,
    groups: m.groups
      .map((g) => ({
        id: g.id,
        title: g.title,
        entries: CATALOG.filter((e) => e.moduleId === m.id && e.group === g.id),
      }))
      .filter((g) => g.entries.length),
  }));
  const videos = CATALOG.filter((e) => e.type === 'yt' || e.type === 'wix');
  const pages = PAGE_GROUPS.map((g) => ({
    id: g.id,
    title: g.title,
    entries: CATALOG.filter((e) => e.type === 'page' && e.group === g.id),
  }));
  return { modules, videos, pages };
}

/** "Movements · Capoeira ABADÁ" for an entry, or '' when it has no module. */
export function placeLabel(entry) {
  const mod = entry.moduleId ? moduleById(entry.moduleId) : null;
  if (!mod) return entry.type === 'page' ? (PAGE_GROUPS.find((g) => g.id === entry.group)?.title || '') : '';
  const group = mod.groups.find((g) => g.id === entry.group);
  return group ? `${mod.title} · ${group.title}` : mod.title;
}

/** Short meta line: "Video lesson · 6 min", "Word", "Video · 8:40". */
export function metaLabel(entry) {
  const kind = KIND_LABEL[entry.kind] || '';
  if (entry.type === 'lesson') return `${kind} · ${entry.source.minutes} min`;
  if (entry.type === 'wix' && entry.source.seconds) {
    const s = entry.source.seconds;
    return `${kind} · ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
  return kind;
}

/**
 * Search the catalog by title (R9.3): lesson titles, glossary words,
 * instrument names, video and page titles. Exact word, then word prefix,
 * then substring; case and accents ignored.
 */
export function searchLibrary(query, catalog = CATALOG) {
  return searchEntries(query, catalog);
}

/**
 * Minimal rows for the browser-side search (serialised into the index page).
 * Plain data only, so the client never bundles the curriculum.
 */
export function searchIndex(catalog = CATALOG) {
  return catalog.map((e) => ({
    id: e.id,
    type: e.type,
    kind: e.kind,
    title: e.title,
    href: e.href,
    external: e.external,
    meta: metaLabel(e),
    place: placeLabel(e),
  }));
}
