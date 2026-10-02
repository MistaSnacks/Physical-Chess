// cores.js — the nine Cores (SPEC-v3 WP12, R12.1). ABADÁ's names for its
// solid cord colors, used as practice colors earned with XP.
//
// INERT until client decision D1: nothing on screen reads this file yet.
// The HUD, /me, the player card, reports, coach views, overlays, CSV and
// storage still show the movement levels (src/content/levels.js). R12.3
// onward switches the displays once ACE answers D1.
//
// A Core is never a corda. Cordas are awarded by an instructor at Batizado
// (SPEC decision 6); the app never awards one.
//
// Schema:
//   order        1-9, the Core's place on the ladder (coreFor() calls it `level`)
//   id           ASCII slug, stable forever (file names, routes, exports)
//   title        the Cor's name, ABADÁ spelling (D2)
//   cordColor    the cord color in plain English
//   color        hex close to the cord color
//   token        the tokens.css custom property this matches, or null
//   meaning      what the color stands for (ACE approves the wording)
//   xp           start XP. Always a LEVELS threshold (levels 4, 7 and 10
//                fold into the Core before them). Thresholds may only move
//                down (R12.8, test/cores.test.mjs).
//   reviewNeeded true until ACE approves the meaning
//
// Colors: Crua uses --quest-corda-crua and Camaleão uses --quest-mango-shadow
// from src/directions/quest/tokens.css. Ouro and Sol reuse the yellow and
// orange of CORDAS (src/data/batizado.js) so a Core and a corda of the same
// color match. The rest are hex values close to the cord colors; Diamante is
// pure white so it never reads as Crua's natural.
export const CORES = [
  { order: 1, id: 'crua', title: 'Crua', cordColor: 'Natural', color: '#e8dcc3', token: '--quest-corda-crua', meaning: 'A beginner', xp: 0, reviewNeeded: true },
  { order: 2, id: 'ouro', title: 'Ouro', cordColor: 'Yellow', color: '#ffc93c', token: null, meaning: 'The value of what you will learn', xp: 100, reviewNeeded: true },
  { order: 3, id: 'sol', title: 'Sol', cordColor: 'Orange', color: '#ff8a1f', token: null, meaning: 'Waking up to learning', xp: 250, reviewNeeded: true },
  { order: 4, id: 'mar', title: 'Mar', cordColor: 'Blue', color: '#2f6fdb', token: null, meaning: 'How big the road ahead is', xp: 700, reviewNeeded: true },
  { order: 5, id: 'floresta', title: 'Floresta', cordColor: 'Green', color: '#2e9e4f', token: null, meaning: 'Learning becomes solid', xp: 1000, reviewNeeded: true },
  { order: 6, id: 'ametista', title: 'Ametista', cordColor: 'Purple', color: '#7b3fb5', token: null, meaning: 'Carrying capoeira forward', xp: 1750, reviewNeeded: true },
  { order: 7, id: 'camaleao', title: 'Camaleão', cordColor: 'Brown', color: '#7a4a00', token: '--quest-mango-shadow', meaning: 'The ABADÁ style of Mestre Camisa', xp: 2200, reviewNeeded: true },
  { order: 8, id: 'rubi', title: 'Rubi', cordColor: 'Red', color: '#d7263d', token: null, meaning: 'Justice', xp: 3250, reviewNeeded: true },
  { order: 9, id: 'diamante', title: 'Diamante', cordColor: 'White', color: '#ffffff', token: null, meaning: 'All colors in one', xp: 3850, reviewNeeded: true },
];

export function coreById(id) {
  return CORES.find((c) => c.id === id) || null;
}
