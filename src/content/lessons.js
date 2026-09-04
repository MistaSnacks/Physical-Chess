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

export const LESSONS = [
  // ---------------- Movements ----------------
  {
    id: 'ginga-basics', moduleId: 'movements', group: 'capoeira-abada', title: 'Ginga Basics', type: 'video', minutes: 6,
    videoKey: 'aulaoBushwick', reviewNeeded: true,
    summary: 'The ginga is the heartbeat of capoeira. The rocking step everything else grows from.',
  },
  {
    id: 'meia-lua-de-frente', moduleId: 'movements', group: 'capoeira-abada', title: 'Meia Lua de Frente', type: 'video', minutes: 5,
    videoKey: 'berkeleyCarroll', reviewNeeded: true,
    summary: 'A sweeping front kick that travels in a half-moon arc.',
  },
  {
    id: 'esquiva-cocorinha', moduleId: 'movements', group: 'capoeira-abada', title: 'Esquiva & Cocorinha', type: 'drill', minutes: 8,
    reviewNeeded: true,
    summary: 'Two escapes: the low lean of esquiva and the full crouch of cocorinha.',
    drill: {
      seconds: 90,
      metronomeBpm: 72,
      steps: [
        { text: 'Start in your ginga. Rock back and forth to the beat.' },
        { text: 'Esquiva: lean your body to one side, hand up to protect your face.' },
        { text: 'Back to ginga. Now the other side.' },
        { text: 'Cocorinha: squat all the way down, one hand on the floor, other hand up.' },
        { text: 'Pop back up into ginga. Repeat until the timer ends.' },
      ],
    },
  },
  {
    id: 'au', moduleId: 'movements', group: 'capoeira-abada', title: 'Aú', type: 'video', minutes: 7,
    videoKey: 'acePresentation', reviewNeeded: true,
    summary: "Capoeira's cartwheel. A defensive escape that becomes an offensive threat.",
  },
  {
    id: 'jogos-first-game', moduleId: 'movements', group: 'jogos', title: 'Jogos: your first game', type: 'video', minutes: 10,
    videoKey: 'acePresentation', reviewNeeded: true,
    summary: 'Putting ginga, kicks and escapes together inside the roda for the first time.',
  },

  // ---------------- Music ----------------
  {
    id: 'meet-the-berimbau', moduleId: 'music', group: 'instruments', title: 'Meet the Berimbau', type: 'reading', minutes: 4,
    photoKey: 'berimbauGourd', reviewNeeded: true,
    summary: 'A single string, a wooden bow, a gourd. The instrument that leads every roda.',
    body: `The **berimbau** is a bow. A long stick of wood, bent by one steel string.

At the bottom hangs a dried gourd called a **cabaça**. It is the speaker. When you press the gourd against your belly and pull it away, the sound changes from a low buzz to a bright open note.

In one hand you hold a coin or a stone against the string. In the other hand a thin stick and a small rattle called the **caxixi**. Stick hits string, caxixi shakes, gourd sings.

The berimbau is the boss of the roda. When it plays slow, the game is slow. When it plays fast, the game is fast. When it stops, everyone stops.`,
    check: { prompt: 'What does the gourd on a berimbau do?', choices: ['It is the speaker that makes the sound bigger', 'It holds the coin', 'It is a decoration'], correctIndex: 0 },
  },
  {
    id: 'pandeiro-atabaque', moduleId: 'music', group: 'instruments', title: 'Pandeiro & Atabaque', type: 'video', minutes: 6,
    videoKey: 'sankofaHaus', reviewNeeded: true,
    summary: 'The tambourine and the drum that carry the rhythm section.',
  },
  {
    id: 'sing-the-roda', moduleId: 'music', group: 'songs', title: 'Sing the Roda', type: 'drill', minutes: 5,
    reviewNeeded: true,
    summary: 'Call-and-response songs every capoeirista learns by ear.',
    drill: {
      seconds: 60,
      metronomeBpm: 96,
      steps: [
        { text: 'Clap on the beat. One, two, one, two.' },
        { text: 'Leader sings: "Paranauê, paranauê, paraná."' },
        { text: 'Everyone answers: "Paranauê, paranauê, paraná!"' },
        { text: 'Keep clapping. Sing it louder each time.' },
      ],
    },
  },
  {
    id: 'music-quiz', moduleId: 'music', group: 'boss', title: 'Music Boss Quiz', type: 'quiz', minutes: 3,
    reviewNeeded: true,
    summary: 'Three questions on instruments, rhythm and where it all began.',
    quiz: [
      { id: 'q1', prompt: 'Which instrument leads the roda?', choices: ['Pandeiro', 'Berimbau', 'Atabaque'], correctIndex: 1 },
      { id: 'q2', prompt: 'Which country was capoeira born in?', choices: ['Portugal', 'Angola', 'Brazil'], correctIndex: 2 },
      { id: 'q3', prompt: 'What does "Axé" mean?', choices: ['Positive energy', 'A type of kick', 'A drum'], correctIndex: 0 },
    ],
  },

  // ---------------- Culture ----------------
  {
    id: 'portuguese-for-the-roda', moduleId: 'culture', group: 'portuguese', title: 'Portuguese for the Roda', type: 'reading', minutes: 5,
    reviewNeeded: true,
    summary: 'Twelve words every student hears in their first class.',
    body: `Capoeira speaks Portuguese, the language of Brazil. You do not need to speak it to play. But a few words open the door.

Tap the speaker next to each word to hear it. Say it back. Then find it in the glossary on your profile.`,
    glossary: true,
    check: { prompt: 'What is a "roda"?', choices: ['The circle where the game is played', 'A kind of drum', 'A kick'], correctIndex: 0 },
  },
  {
    id: 'abada-capoeira', moduleId: 'culture', group: 'abada', title: 'ABADÁ-Capoeira', type: 'video', minutes: 6,
    videoKey: 'bhmShowcase', reviewNeeded: true,
    summary: 'The organization behind the ACE program and its roots.',
  },
  {
    id: 'folklore-manifestations', moduleId: 'culture', group: 'manifestations', title: 'Folklore & Manifestations', type: 'reading', minutes: 5,
    photoKey: 'sambaDeRoda', reviewNeeded: true,
    summary: 'Samba de roda, jongo, puxada de rede. The traditions capoeira grew up alongside.',
    body: `Capoeira has cousins. In Bahia, people dance **samba de roda** in a circle with clapping and a tambourine. In the countryside, **jongo** drums call and answer late into the night. On the beach, fishermen pull the net and sing **puxada de rede**.

All of them share the circle, the clap, and the call-and-response. When you learn one, you understand the others.`,
    check: { prompt: 'What do samba de roda, jongo and capoeira all share?', choices: ['A circle and call-and-response singing', 'The same kicks', 'A berimbau'], correctIndex: 0 },
  },
  {
    id: 'history-maps', moduleId: 'culture', group: 'history', title: 'History & Maps', type: 'reading', minutes: 6,
    photoKey: 'mapBrazil', reviewNeeded: true,
    summary: 'From West and Central Africa to Brazil: how capoeira crossed the Atlantic.',
    body: `Look at the map. Capoeira's story starts in **Africa**, in the lands we now call Angola, Congo and beyond.

People from those lands were taken across the ocean to **Brazil** against their will. They carried their music, their dances and their games with them. In Brazil those traditions met and mixed, and capoeira was born.

For a long time capoeira was forbidden. People played it anyway, in secret, disguised as a dance. Today it is celebrated all over the world, and you are part of that story.`,
    check: { prompt: 'Where was capoeira born?', choices: ['Brazil', 'Portugal', 'The United States'], correctIndex: 0 },
  },

  // ---------------- Graduation ----------------
  {
    id: 'what-is-batizado', moduleId: 'graduation', group: 'batizado', title: 'What is Batizado?', type: 'reading', minutes: 4,
    photoKey: 'kidsParents', reviewNeeded: false,
    summary: 'The welcoming ceremony for new students and celebration of everyone else’s progress.',
    body: `Batizado is our welcoming event for new students and cultural celebration of current students' progress throughout the year. It's filled with rich traditions, incredible performances and energy through the roof! The sense of community is palpable and contagious. Come join us and see for yourself!

**Abertura.** The opening of our events are always a spectacle to behold. The music, energy, athleticism and grace are amazing! Just try and keep your hands clapping while you watch.

**Batizado.** New students are officially welcomed by very experienced Capoeiristas, usually in a very fun way, during their first official game as a student of ABADÁ-Capoeira. Each and every student always remembers their first game with fondness for the rest of their lives in and outside of Capoeira.`,
    check: { prompt: 'What happens to a new student at Batizado?', choices: ['They play their first official game and receive a corda', 'They take a written test', 'They watch from the side'], correctIndex: 0 },
  },
  {
    id: 'cordas', moduleId: 'graduation', group: 'cordas', title: 'Cordas', type: 'reading', minutes: 4,
    photoKey: 'cordsTable2022', reviewNeeded: true,
    summary: 'The rank track every student climbs, corda by corda.',
    body: `Your **corda** is the cord you tie at your waist. Its color shows how far you have travelled.

Kids start with **Crua**, the natural color of the rope. Then comes **Crua-Amarela**, half natural and half yellow. Then **Amarela**, then **Amarela-Laranja**, then **Laranja**.

Only your coach can give you a corda, and only at Batizado. The app cannot. What the app can do is show you when you are ready.`,
    check: { prompt: 'Who gives you a new corda?', choices: ['Your coach, at Batizado', 'The app, when you have enough XP', 'Your parents'], correctIndex: 0 },
  },
  {
    id: 'batizado-2026', moduleId: 'graduation', group: 'batizado', title: 'Batizado 2026', type: 'video', minutes: 5,
    videoKey: 'batizado2026', reviewNeeded: true,
    summary: 'What to expect at this year’s ceremony.',
  },
];

export function lessonById(id) {
  return LESSONS.find((l) => l.id === id) || null;
}

export function lessonsForModule(moduleId) {
  return LESSONS.filter((l) => l.moduleId === moduleId);
}
