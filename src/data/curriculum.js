// curriculum.js — the four modules mirroring the Wix member nav
// (Movements, Music, Culture, Graduation), per SPEC §4.4.
//
// Every direction must compute progress numbers FROM this data —
// never hard-code a percentage or "3 of 5" string in a page.

export const MODULES = [
  {
    id: 'movements',
    title: 'Movements',
    icon: 'movements',
    locked: false,
    lessons: [
      {
        id: 'ginga-basics',
        title: 'Ginga Basics',
        type: 'video',
        minutes: 6,
        videoKey: 'aulaoBushwick',
        summary: 'The ginga is the heartbeat of capoeira — the constant rocking step everything else grows from.',
        completed: true,
      },
      {
        id: 'meia-lua-de-frente',
        title: 'Meia Lua de Frente',
        type: 'video',
        minutes: 5,
        videoKey: 'berkeleyCarroll',
        summary: 'A sweeping front kick that travels in a half-moon arc.',
        completed: true,
      },
      {
        id: 'esquiva-cocorinha',
        title: 'Esquiva & Cocorinha',
        type: 'drill',
        minutes: 8,
        summary: 'Two escapes: the low lean of esquiva and the full crouch of cocorinha.',
        completed: true,
      },
      {
        id: 'au',
        title: 'Aú',
        type: 'video',
        minutes: 7,
        videoKey: 'acePresentation',
        summary: "Capoeira's cartwheel — a defensive escape that becomes an offensive threat.",
        completed: false,
      },
      {
        id: 'jogos-first-game',
        title: 'Jogos: your first game',
        type: 'video',
        minutes: 10,
        videoKey: 'acePresentation',
        summary: 'Putting ginga, kicks and escapes together inside the roda for the first time.',
        completed: false,
      },
    ],
  },
  {
    id: 'music',
    title: 'Music',
    icon: 'music',
    locked: false,
    lessons: [
      {
        id: 'meet-the-berimbau',
        title: 'Meet the Berimbau',
        type: 'reading',
        minutes: 4,
        photoKey: 'berimbauGourd',
        summary: 'A single string, a wooden bow, a gourd — and the instrument that leads every roda.',
        completed: true,
      },
      {
        id: 'pandeiro-atabaque',
        title: 'Pandeiro & Atabaque',
        type: 'video',
        minutes: 6,
        videoKey: 'sankofaHaus',
        summary: 'The tambourine and the drum that carry the rhythm section.',
        completed: false,
      },
      {
        id: 'sing-the-roda',
        title: 'Sing the Roda',
        type: 'drill',
        minutes: 5,
        summary: 'Call-and-response songs every capoeirista learns by ear.',
        completed: false,
      },
      {
        id: 'music-quiz',
        title: 'Music Quiz',
        type: 'quiz',
        minutes: 3,
        summary: 'Three questions on instruments, rhythm and where it all began.',
        completed: false,
        inProgress: true,
      },
    ],
  },
  {
    id: 'culture',
    title: 'Culture',
    icon: 'culture',
    locked: true,
    lockedReason: 'Finish Music to unlock Culture.',
    lessons: [
      {
        id: 'portuguese-for-the-roda',
        title: 'Portuguese for the Roda',
        type: 'reading',
        minutes: 5,
        summary: 'Six words every student hears in their first class.',
        completed: false,
      },
      {
        id: 'abada-capoeira',
        title: 'ABADÁ-Capoeira',
        type: 'video',
        minutes: 6,
        videoKey: 'bhmShowcase',
        summary: 'The organization behind the ACE program and its roots.',
        completed: false,
      },
      {
        id: 'folklore-manifestations',
        title: 'Folklore & Manifestations',
        type: 'reading',
        minutes: 5,
        photoKey: 'sambaDeRoda',
        summary: 'Samba de roda, jongo, puxada de rede — the traditions capoeira grew up alongside.',
        completed: false,
      },
      {
        id: 'history-maps',
        title: 'History & Maps',
        type: 'reading',
        minutes: 6,
        photoKey: 'mapBrazil',
        summary: 'From West and Central Africa to Brazil: how capoeira crossed the Atlantic.',
        completed: false,
      },
    ],
  },
  {
    id: 'graduation',
    title: 'Graduation',
    icon: 'graduation',
    locked: true,
    lockedReason: 'Finish Culture to unlock Graduation.',
    lessons: [
      {
        id: 'what-is-batizado',
        title: 'What is Batizado?',
        type: 'reading',
        minutes: 4,
        summary: 'The welcoming ceremony for new students and celebration of everyone else’s progress.',
        completed: false,
      },
      {
        id: 'cordas',
        title: 'Cordas',
        type: 'reading',
        minutes: 4,
        summary: 'The rank track every student climbs, corda by corda.',
        completed: false,
      },
      {
        id: 'batizado-2026',
        title: 'Batizado 2026',
        type: 'video',
        minutes: 5,
        videoKey: 'batizado2026',
        summary: 'What to expect at this year’s ceremony.',
        completed: false,
      },
    ],
  },
];

/** Instrument cards for the Music screen. */
export const INSTRUMENTS = [
  {
    id: 'berimbau',
    name: 'Berimbau',
    photoKey: 'berimbauGourd',
    blurb: 'A single-string bow instrument with a gourd resonator. It leads the roda and controls the game’s energy.',
  },
  {
    id: 'pandeiro',
    name: 'Pandeiro',
    blurb: 'A hand frame drum with jingles, played with slaps, taps and rolls.',
  },
  {
    id: 'atabaque',
    name: 'Atabaque',
    blurb: 'A tall hand drum that anchors the rhythm section alongside the berimbau.',
  },
  {
    id: 'agogo',
    name: 'Agogô',
    blurb: 'A double bell struck with a stick, adding a bright, ringing counter-rhythm.',
  },
];

/** Six Portuguese words every student learns, with meanings. */
export const PORTUGUESE_WORDS = [
  { word: 'Axé', meaning: 'Positive energy / life force shared in the roda' },
  { word: 'Roda', meaning: 'The circle of people and music where the game is played' },
  { word: 'Ginga', meaning: 'The constant rocking step at the base of every movement' },
  { word: 'Mestre', meaning: 'Master — the highest teaching rank' },
  { word: 'Corda', meaning: 'The cord tied at the waist marking a student’s rank' },
  { word: 'Berimbau', meaning: 'The bow-and-gourd instrument that leads the roda' },
];

/** The 3-question Music quiz. Q2 is the required "birthplace" question. */
export const MUSIC_QUIZ = [
  {
    id: 'q1',
    prompt: 'Which instrument leads the roda?',
    choices: ['Pandeiro', 'Berimbau', 'Atabaque'],
    correctIndex: 1,
  },
  {
    id: 'q2',
    prompt: 'Which country was capoeira born in?',
    choices: ['Portugal', 'Angola', 'Brazil'],
    correctIndex: 2,
  },
  {
    id: 'q3',
    prompt: 'What does "Axé" mean?',
    choices: ['Positive energy', 'A type of kick', 'A drum'],
    correctIndex: 0,
  },
];

/** { completed, total, percent } for a single module. */
export function moduleProgress(mod) {
  const total = mod.lessons.length;
  const completed = mod.lessons.filter((l) => l.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

/** { completed, total, percent } across every module. */
export function overallProgress() {
  const all = MODULES.flatMap((m) => m.lessons);
  const total = all.length;
  const completed = all.filter((l) => l.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

/** The next not-yet-completed lesson across unlocked modules, in module order. */
export function nextUpLesson() {
  for (const mod of MODULES) {
    if (mod.locked) continue;
    const lesson = mod.lessons.find((l) => !l.completed);
    if (lesson) return { module: mod, lesson };
  }
  return null;
}
