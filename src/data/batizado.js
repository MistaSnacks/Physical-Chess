// batizado.js — ceremony copy (verbatim from physicalchess.org), the cordas
// rank track, and the countdown target. Per SPEC §4.3. Keep the copy exactly
// as written; it is client-approved language.

export const INTRO =
  "Batizado is our welcoming event for new students and cultural celebration of current students' progress throughout the year. It's filled with rich traditions, incredible performances and energy through the roof! The sense of community is palpable and contagious. Come join us and see for yourself!";

/** The six ceremony moments, in order, with verbatim copy and a real photo. */
export const MOMENTS = [
  {
    id: 'abertura',
    title: 'Abertura',
    copy:
      'The opening of our events are always a spectacle to behold. The music, energy, athleticism and grace are amazing! Just try and keep your hands clapping while you watch.',
    photoKey: 'cocoTubarao',
  },
  {
    id: 'solos',
    title: 'Solos',
    copy:
      'These dazzling displays of technique and showmanship are sure to wow you. The Capoeirista does a solo performance exhibiting their skills. Sit back and enjoy!',
    photoKey: 'videoPoster1',
  },
  {
    id: 'batizado',
    title: 'Batizado',
    copy:
      'New students are officially welcomed by very experienced Capoeiristas, usually in a very fun way, during their first official game as a student of ABADÁ-Capoeira. Each and every student always remembers their first game with fondness for the rest of their lives in and outside of Capoeira.',
    photoKey: 'kidsParents',
  },
  {
    id: 'volta-do-mundo',
    title: 'Volta do Mundo',
    copy:
      "When a student's name is called they walk around the roda in a very large circle. Their first time passing the berimbau, our main instrument, they show a sign of respect and continue on to receive their cord and tie it while they continue walking around the roda. When the berimbau calls everyone's attention they move to one of the sides to prepare to play their first game as an official student.",
    photoKey: 'voltaDoMundo',
  },
  {
    id: 'troca-de-cordas',
    title: 'Troca de Cordas',
    copy:
      'Current students who continue to show progress receive a new corda. They walk around the roda, paying respect to the berimbau their first time around after which they receive their new corda which they tie above their current corda while they play with their fellow students changing cordas.',
    photoKey: 'toroMindinha',
  },
  {
    id: 'jogo-de-compra',
    title: 'Jogo de Compra',
    copy:
      'After the students receiving their new cordas have all played amongst each other, students who already have that corda continue to buy the game to play with their new colleagues.',
    photoKey: 'troca2019',
  },
];

/**
 * The ABADÁ kids' corda progression. `pieceMapping` is the chess piece the
 * Grandmaster Roda direction uses for the same rank.
 */
export const CORDAS = [
  { id: 'crua', label: 'Crua', color: '#E8DCC3', pieceMapping: 'pawn' },
  {
    id: 'crua-amarela',
    label: 'Crua-Amarela',
    color: 'linear-gradient(135deg, #E8DCC3 50%, #FFC93C 50%)',
    pieceMapping: 'knight',
  },
  { id: 'amarela', label: 'Amarela', color: '#FFC93C', pieceMapping: 'bishop' },
  {
    id: 'amarela-laranja',
    label: 'Amarela-Laranja',
    color: 'linear-gradient(135deg, #FFC93C 50%, #FF8A1F 50%)',
    pieceMapping: 'rook',
  },
  { id: 'laranja', label: 'Laranja', color: '#FF8A1F', pieceMapping: 'queen' },
];

/** ISO date the countdown targets. Label it "date TBC" in the UI. */
export const BATIZADO_DATE = '2026-10-10T11:00:00-04:00';
export const BATIZADO_DATE_TBC = true;

export const CONTACT = {
  phone: '917-776-8150',
  email: 'info@the-ace.org',
  ageLine: 'Classes for 7–13 years of age',
};

/** Index of a corda id within CORDAS, for rendering rank-track progress. */
export function cordaIndex(id) {
  return CORDAS.findIndex((c) => c.id === id);
}
