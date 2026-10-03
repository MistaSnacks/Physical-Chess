// mestres.js — the Mestre registry (SPEC-v3 WP13, R13.1). One list for every
// place a real mestre's name shows: the Educators page, photo captions, alt
// text, and (after D5) the "Meet the Mestre" pop-up that replaces Bira.
//
// - The 15 `popup: true` entries are the client's names, in the client's
//   order (`order` 1-15). Titles are the client's until D5 says otherwise
//   (Bode, Cascão and Tigre may read Mestrando; Camisa Roxa may read
//   Grão-Mestre). `fullName()` gives the pop-up name, e.g. "Mestre Bimba".
// - `popup: false` entries are Educators-only (Mestranda Yara).
// - `educatorsName` is the name the Educators page and captions show today
//   ("Marcia" for Cigarra, who is Márcia Treidler). It stays until D5.
// - `portraitKey` is a PHOTOS key in src/data/media.js, or null with
//   `portraitPlaceholder: true` until ACE sends the portrait.
// - `fact` stays empty until ACE approves one. Never invent quotes or facts.

/** @typedef {{ id: string, name: string, title: string, portraitKey: string | null, portraitPlaceholder: boolean, fact: string, order: number, popup: boolean, educatorsName: string }} Mestre */

const entry = (order, id, title, name, portraitKey = null, educatorsName = name) => ({
  id,
  name,
  title,
  portraitKey,
  portraitPlaceholder: portraitKey === null,
  fact: '',
  order,
  popup: true,
  educatorsName,
});

/** @type {Mestre[]} */
export const MESTRES = [
  entry(1, 'bimba', 'Mestre', 'Bimba'),
  entry(2, 'camisa-roxa', 'Mestre', 'Camisa Roxa'),
  entry(3, 'camisa', 'Mestre', 'Camisa'),
  entry(4, 'cobra', 'Mestre', 'Cobra', 'mestreCobra'),
  entry(5, 'morcego', 'Mestre', 'Morcego'),
  entry(6, 'cigarra', 'Mestra', 'Cigarra', 'mestraMarciaBerimbau', 'Marcia'),
  entry(7, 'pernilongo', 'Mestre', 'Pernilongo', 'mestrePernilongo'),
  entry(8, 'paulinho-velho', 'Mestre', 'Paulinho Velho'),
  entry(9, 'apache', 'Mestre', 'Apache'),
  entry(10, 'piriquito-verde', 'Mestre', 'Piriquito Verde'),
  entry(11, 'cascao', 'Mestre', 'Cascão'),
  entry(12, 'canguru', 'Mestre', 'Canguru'),
  entry(13, 'bode', 'Mestre', 'Bode'),
  entry(14, 'tigre', 'Mestre', 'Tigre'),
  entry(15, 'edna-lima', 'Mestra', 'Edna Lima', 'mestraEdnaLima'),
  // Educators-only: not in the pop-up rotation.
  { ...entry(16, 'yara', 'Mestranda', 'Yara', 'mestrandaYara'), popup: false },
];

/** The 15 pop-up mestres in the client's order. */
export const POPUP_MESTRES = MESTRES.filter((m) => m.popup).sort((a, b) => a.order - b.order);

const BY_ID = new Map(MESTRES.map((m) => [m.id, m]));

/** Registry entry by id; throws on an unknown id so typos fail the build. */
export function mestreById(id) {
  const m = BY_ID.get(id);
  if (!m) throw new Error(`mestres.js: unknown mestre id "${id}"`);
  return m;
}

/** Pop-up name, e.g. "Mestre Bimba". */
export function fullName(m) {
  return `${m.title} ${m.name}`;
}

/** Educators-page name with title, e.g. "Mestra Marcia" (today's text until D5). */
export function educatorsLabel(m) {
  return `${m.title} ${m.educatorsName}`;
}
