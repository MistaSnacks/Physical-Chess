// lessons.js — every lesson in the curriculum (SPEC §5.5). Content is the
// versioned source of truth for v1; student progress never lives here.
//
// Schema (all lessons):
//   id, moduleId, group, title, type: 'video'|'reading'|'drill'|'quiz',
//   minutes, summary, reviewNeeded (true until ACE approves the copy)
// By type:
//   video   → videoKey (YouTube key in media.js) or wixVideoKey (mp4)
//   reading → body (markdown string), photoKey?, check: { prompt, choices, correctIndex }
//   drill   → drill: { steps: [{ text, photoKey? }], seconds, metronomeBpm? }
//   quiz    → quiz: [{ id, prompt, choices, correctIndex, photoKey? }]
//
// WP1 (content) fills the remaining lessons from §5.5 and replaces the
// showcase-era summaries. Keep ids stable: events reference them forever.

import { INTRO, MOMENTS } from '../data/batizado.js';
import { body as meetTheBerimbauBody } from './copy/meet-the-berimbau.js';
import { body as portugueseBody } from './copy/portuguese-for-the-roda.js';
import { body as manifestationsBody } from './copy/manifestations.js';
import { body as folkloreBody } from './copy/folklore.js';
import { body as historyMapsBody } from './copy/history-maps.js';
import { body as rodaEtiquetteBody } from './copy/roda-etiquette.js';
import { body as agogoRecoRecoBody } from './copy/agogo-reco-reco.js';
import { body as cordasBody } from './copy/cordas.js';

/** Verbatim ceremony copy from src/data/batizado.js (client-approved). */
const whatIsBatizadoBody = [INTRO, ...MOMENTS.map((m) => `**${m.title}.** ${m.copy}`)].join('\n\n');

export const LESSONS = [
  // ---------------- Movements ----------------
  {
    id: 'ginga-basics', moduleId: 'movements', group: 'capoeira-abada', title: 'Ginga Basics', type: 'video', minutes: 6,
    videoKey: 'aulaoBushwick', reviewNeeded: true,
    summary: 'Watch a real ACE aulão at Achievement First Bushwick. Look for the rocking ginga that never stops. This is class energy, not a slow how-to.',
  },
  {
    id: 'meia-lua-de-frente', moduleId: 'movements', group: 'capoeira-abada', title: 'Meia Lua de Frente', type: 'video', minutes: 5,
    videoKey: 'berkeleyCarroll', reviewNeeded: true,
    summary: 'Watch students at Berkeley Carroll. The meia lua de frente is a front kick that draws a half-moon. Your coach will teach the kick in person.',
  },
  {
    id: 'esquiva-cocorinha', moduleId: 'movements', group: 'capoeira-abada', title: 'Esquiva & Cocorinha', type: 'drill', minutes: 8,
    reviewNeeded: true,
    summary: 'Two escapes: the low lean of esquiva and the full crouch of cocorinha. Stay in ginga between them.',
    drill: {
      seconds: 90,
      metronomeBpm: 72,
      steps: [
        { text: 'Start in your ginga. Rock back and forth to the beat.', photoKey: 'kidsWorkshopDay2' },
        { text: 'Esquiva: lean your body to one side, hand up to protect your face.', photoKey: 'classPhoto2022a' },
        { text: 'Back to ginga. Now the other side.' },
        { text: 'Cocorinha: squat all the way down, one hand on the floor, other hand up.', photoKey: 'classPhoto2022b' },
        { text: 'Pop back up into ginga. Repeat until the timer ends.', photoKey: 'heroWorkshop' },
      ],
    },
  },
  {
    id: 'au', moduleId: 'movements', group: 'capoeira-abada', title: 'Aú', type: 'video', minutes: 7,
    videoKey: 'acePresentation', reviewNeeded: true,
    summary: "Watch the aú, capoeira's cartwheel, in an ACE presentation. It is an escape that can turn into an attack.",
  },
  {
    id: 'bencao-armada', moduleId: 'movements', group: 'capoeira-abada', title: 'Bênção & Armada', type: 'video', minutes: 6,
    videoKey: 'aceCompilation', reviewNeeded: true,
    summary: 'Watch bênção, the blessing kick, and armada, the spinning kick, inside a real ACE roda. This is class energy, not a slow how-to.',
  },
  {
    id: 'ginga-workout-10', moduleId: 'movements', group: 'virtual-training', title: '10-minute Ginga workout', type: 'drill', minutes: 10,
    reviewNeeded: true,
    summary: 'Ten minutes of ginga at home, on a 72-beat metronome. Small steps count. Do not freeze.',
    drill: {
      seconds: 600,
      metronomeBpm: 72,
      steps: [
        { text: 'Find space. Stand in your ginga. Soft knees. Eyes forward.', photoKey: 'kidsWorkshopDay2' },
        { text: 'Rock right, then left, on the metronome. One move per beat.', photoKey: 'classPhoto2022c' },
        { text: 'Keep your arms alive. One hand guards your face. The other is ready.' },
        { text: 'After a few minutes, add a small squat on each side. Stay in ginga.', photoKey: 'classPhotoWorkshop2022' },
        { text: 'If you get tired, make the step smaller. Do not freeze.' },
        { text: 'Finish with eight slow gingas, then still. Hand on heart. Breathe.', photoKey: 'heroWorkshop' },
        { text: 'Smile at the room, even if the room is your kitchen.' },
      ],
    },
  },
  {
    id: 'kick-combo', moduleId: 'movements', group: 'virtual-training', title: 'Kick combo', type: 'drill', minutes: 4,
    reviewNeeded: true,
    summary: 'String ginga, meia lua de frente, and esquiva on both sides. Slow is better than sloppy.',
    drill: {
      seconds: 180,
      steps: [
        { text: 'Ginga twice. Feel the floor.', photoKey: 'classPhoto2022a' },
        { text: 'Meia lua de frente with the front leg. Return to ginga.', photoKey: 'classPhoto2022b' },
        { text: 'Esquiva to the side. Hand up.', photoKey: 'classPhoto2021a' },
        { text: 'Other side: ginga, meia lua, esquiva.' },
        { text: 'If you have room, add aú after the escape. If not, skip it.', photoKey: 'classPhoto2021b' },
        { text: 'Repeat until the timer ends. Slow is better than sloppy.' },
      ],
    },
  },
  {
    id: 'jogos-first-game', moduleId: 'movements', group: 'jogos', title: 'Jogos: your first game', type: 'video', minutes: 10,
    videoKey: 'acePresentation', reviewNeeded: true,
    summary: 'Watch a first jogo, the game inside the roda. Notice how two people play, the circle claps, and nobody crashes.',
  },
  {
    id: 'roda-etiquette', moduleId: 'movements', group: 'jogos', title: 'Roda etiquette', type: 'reading', minutes: 5,
    photoKey: 'voltaDoMundo', reviewNeeded: true,
    summary: 'How to enter the roda, when to clap, and how to buy the game without crashing the circle.',
    body: rodaEtiquetteBody,
    check: { prompt: 'Where do you enter the roda?', choices: ['At the foot of the berimbau', 'Through the middle of the circle', 'From behind the players'], correctIndex: 0 },
  },

  // ---------------- Music ----------------
  {
    id: 'meet-the-berimbau', moduleId: 'music', group: 'instruments', title: 'Meet the Berimbau', type: 'reading', minutes: 5,
    photoKey: 'berimbauGourd', reviewNeeded: true,
    summary: 'A single string, a wooden bow, a gourd. The instrument that leads every roda.',
    body: meetTheBerimbauBody,
    check: { prompt: 'What does the gourd on a berimbau do?', choices: ['It is the speaker that makes the sound bigger', 'It holds the coin', 'It is a decoration'], correctIndex: 0 },
  },
  {
    id: 'pandeiro-atabaque', moduleId: 'music', group: 'instruments', title: 'Pandeiro & Atabaque', type: 'video', minutes: 6,
    videoKey: 'sankofaHaus', reviewNeeded: true,
    summary: 'Meet the pandeiro and the atabaque, the tambourine and the tall drum that carry the rhythm section.',
  },
  {
    id: 'agogo-reco-reco', moduleId: 'music', group: 'instruments', title: 'Agogô & Reco-reco', type: 'reading', minutes: 5,
    photoKey: 'puxadaDeRede', reviewNeeded: true,
    summary: 'The double bell and the scraper that decorate the roda without leading it.',
    body: agogoRecoRecoBody,
    check: { prompt: 'What is a reco-reco?', choices: ['A scraper you drag a stick across', 'A tall drum', 'A whistle'], correctIndex: 0 },
  },
  {
    id: 'sing-the-roda', moduleId: 'music', group: 'songs', title: 'Sing the Roda: Paranauê', type: 'drill', minutes: 5,
    reviewNeeded: true,
    summary: 'Call-and-response on "Paranauê." Clap, listen, then answer.',
    drill: {
      seconds: 60,
      metronomeBpm: 96,
      steps: [
        { text: 'Clap on the beat. One, two, one, two.', photoKey: 'sambaDeRoda' },
        { text: 'Leader sings: "Paranauê, paranauê, paraná."' },
        { text: 'Everyone answers: "Paranauê, paranauê, paraná."', photoKey: 'heroRoda' },
        { text: 'Keep clapping. Sing it stronger each time, not shoutier.' },
        { text: 'When the timer ends, one last answer, then quiet.' },
      ],
    },
  },
  {
    id: 'music-quiz', moduleId: 'music', group: 'boss', title: 'Music Boss Quiz', type: 'quiz', minutes: 4,
    reviewNeeded: true,
    summary: 'Five questions on instruments, rhythm, call-and-response, and where it all began.',
    quiz: [
      { id: 'q1', prompt: 'Which instrument leads the roda?', choices: ['Pandeiro', 'Berimbau', 'Atabaque'], correctIndex: 1 },
      { id: 'q2', prompt: 'Which country was capoeira born in?', choices: ['Portugal', 'Angola', 'Brazil'], correctIndex: 2 },
      { id: 'q3', prompt: 'What does "Axé" mean?', choices: ['Positive energy', 'A type of kick', 'A drum'], correctIndex: 0 },
      { id: 'q4', prompt: 'What is a pandeiro?', choices: ['A tambourine with jingles', 'A steel string', 'A whistle'], correctIndex: 0 },
      { id: 'q5', prompt: 'What is call and response in the roda?', choices: ['The leader sings a line and everyone sings it back', 'Two kicks in a row', 'A kind of corda'], correctIndex: 0 },
    ],
  },

  // ---------------- Culture ----------------
  {
    id: 'portuguese-for-the-roda', moduleId: 'culture', group: 'portuguese', title: 'Portuguese for the Roda', type: 'reading', minutes: 6,
    reviewNeeded: true,
    summary: 'Twelve words every student hears in their first class.',
    body: portugueseBody,
    glossary: true,
    check: { prompt: 'What is a "roda"?', choices: ['The circle where the game is played', 'A kind of drum', 'A kick'], correctIndex: 0 },
  },
  {
    id: 'abada-capoeira', moduleId: 'culture', group: 'abada', title: 'ABADÁ-Capoeira', type: 'video', minutes: 6,
    videoKey: 'bhmShowcase', reviewNeeded: true,
    summary: "Watch ACE's Black History Month showcase. This is the organization behind your class, ABADÁ-Capoeira, alive in Brooklyn.",
  },
  {
    id: 'folklore-manifestations', moduleId: 'culture', group: 'manifestations', title: 'Manifestations', type: 'reading', minutes: 6,
    photoKey: 'sambaDeRoda', reviewNeeded: true,
    summary: 'Samba de roda, jongo, puxada de rede, and maculelê. The traditions capoeira grew up alongside.',
    photoKeys: ['sambaDeRoda', 'jongoDrum', 'puxadaDeRede'],
    body: manifestationsBody,
    check: { prompt: 'What do samba de roda, jongo, maculelê and capoeira all share?', choices: ['A circle and call-and-response singing', 'The same kicks', 'A berimbau'], correctIndex: 0 },
  },
  {
    id: 'folklore', moduleId: 'culture', group: 'folklore', title: 'Folklore', type: 'reading', minutes: 5,
    photoKey: 'jongoDrum', reviewNeeded: true,
    summary: 'Stories the roda tells: malícia, animal movements, and why capoeira learned to look like a dance.',
    body: folkloreBody,
    check: { prompt: 'What is malícia in capoeira?', choices: ['A kind of smarts used in the game', 'A drum', 'A corda color'], correctIndex: 0 },
  },
  {
    id: 'history-maps', moduleId: 'culture', group: 'history', title: 'History & Maps', type: 'reading', minutes: 6,
    photoKey: 'mapAfrica', reviewNeeded: true,
    summary: 'From West and Central Africa to Brazil: how capoeira crossed the Atlantic.',
    photoKeys: ['mapAfrica', 'mapSlaveTrade', 'mapBrazil'],
    body: historyMapsBody,
    check: { prompt: 'Where was capoeira born?', choices: ['Brazil', 'Portugal', 'The United States'], correctIndex: 0 },
  },
  {
    id: 'culture-quiz', moduleId: 'culture', group: 'boss', title: 'Culture Boss Quiz', type: 'quiz', minutes: 4,
    reviewNeeded: true,
    summary: 'Five questions from Portuguese, ABADÁ, manifestations, folklore, and the maps.',
    quiz: [
      { id: 'q1', prompt: 'What does camará mean?', choices: ['Friend', 'Kick', 'Drum'], correctIndex: 0 },
      { id: 'q2', prompt: 'Who founded ABADÁ-Capoeira?', choices: ['Mestre Camisa', 'Mestre Bimba', 'Mestre Pastinha'], correctIndex: 0 },
      { id: 'q3', prompt: 'What do dancers hold in maculelê?', choices: ['Two wooden sticks', 'A berimbau', 'A net'], correctIndex: 0 },
      { id: 'q4', prompt: 'Capoeira was born in which country?', choices: ['Brazil', 'Portugal', 'The United States'], correctIndex: 0 },
      { id: 'q5', prompt: 'Why did capoeira learn to look like a dance?', choices: ['The art was forbidden, so players hid the fight inside the game', 'Kicks are not allowed', 'There was no music yet'], correctIndex: 0 },
    ],
  },

  // ---------------- Graduation ----------------
  {
    id: 'what-is-batizado', moduleId: 'graduation', group: 'batizado', title: 'What is Batizado?', type: 'reading', minutes: 6,
    photoKey: 'kidsParents', reviewNeeded: false,
    summary: 'The welcoming ceremony for new students and celebration of everyone else’s progress.',
    body: whatIsBatizadoBody,
    check: { prompt: 'What happens to a new student at Batizado?', choices: ['They play their first official game and receive a corda', 'They take a written test', 'They watch from the side'], correctIndex: 0 },
  },
  {
    id: 'cordas', moduleId: 'graduation', group: 'cordas', title: 'Cordas', type: 'reading', minutes: 5,
    photoKey: 'cordsTable2022', reviewNeeded: true,
    summary: 'The rank track every student climbs, corda by corda. The app never awards one.',
    body: cordasBody,
    check: { prompt: 'Who gives you a new corda?', choices: ['Your coach, at Batizado', 'The app, when you have enough XP', 'Your parents'], correctIndex: 0 },
  },
  {
    id: 'batizado-2026', moduleId: 'graduation', group: 'batizado', title: 'Batizado 2026', type: 'video', minutes: 5,
    videoKey: 'batizado2026', reviewNeeded: true,
    summary: "Watch last year's energy so this year's Batizado feels familiar. The 2026 date is still to be confirmed.",
  },
  {
    id: 'roda-ready-check', moduleId: 'graduation', group: 'ready', title: 'Roda Ready check', type: 'quiz', minutes: 3,
    reviewNeeded: true,
    summary: 'Three questions drawn from movements, music, and graduation. A last listen before the gate.',
    quiz: [
      { id: 'q1', prompt: 'What is the ginga?', choices: ['The rocking step at the base of every movement', 'A spinning kick', 'A kind of drum'], correctIndex: 0 },
      { id: 'q2', prompt: 'Which instrument leads the roda?', choices: ['Berimbau', 'Pandeiro', 'Agogô'], correctIndex: 0 },
      { id: 'q3', prompt: 'Who can give you a new corda?', choices: ['Your coach, at Batizado', 'This app, when XP is full', 'Any grown-up in the room'], correctIndex: 0 },
    ],
  },
];

export function lessonById(id) {
  return LESSONS.find((l) => l.id === id) || null;
}

export function lessonsForModule(moduleId) {
  return LESSONS.filter((l) => l.moduleId === moduleId);
}
