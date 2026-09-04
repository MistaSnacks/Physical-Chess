// content/index.js — one import for everything in src/content.
export { MODULES, moduleById } from './modules.js';
export { LESSONS, lessonById, lessonsForModule } from './lessons.js';
export { LEVELS } from './levels.js';
export { PATCHES, patchByKey } from './patches.js';
export { READINESS_RULES } from './readiness.js';
export { GLOSSARY } from './glossary.js';
export { PROGRAMS, programByKey, programByInvite } from './programs.js';
export { BIRA, biraLine } from './bira.js';

/** Instrument cards for the Music screen. */
export const INSTRUMENTS = [
  { id: 'berimbau', name: 'Berimbau', photoKey: 'berimbauGourd', blurb: 'A single-string bow instrument with a gourd resonator. It leads the roda and controls the game’s energy.' },
  { id: 'pandeiro', name: 'Pandeiro', photoKey: 'sambaDeRoda', blurb: 'A hand frame drum with jingles, played with slaps, taps and rolls.' },
  { id: 'atabaque', name: 'Atabaque', photoKey: 'jongoDrum', blurb: 'A tall hand drum that anchors the rhythm section alongside the berimbau.' },
  { id: 'agogo', name: 'Agogô', photoKey: 'puxadaDeRede', blurb: 'A double bell struck with a stick, adding a bright, ringing counter-rhythm.' },
];
