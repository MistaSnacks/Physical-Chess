// desafio.js — Desafio do Dia pool (SPEC §4.6). One item is chosen per
// New York calendar date; a player may complete it once for 30 XP.
// Copy is for ages 7–13 and flagged until ACE reviews it.

export const DESAFIO_POOL = [
  // --- glossary flashcards ---
  { id: 'fc-axe', kind: 'flashcard', reviewNeeded: true, title: 'Word of the day', prompt: 'What does this Portuguese word mean?', word: 'Axé', say: 'axé', meaning: 'Positive energy. The life force everyone shares in the roda.' },
  { id: 'fc-roda', kind: 'flashcard', reviewNeeded: true, title: 'Word of the day', prompt: 'What does this Portuguese word mean?', word: 'Roda', say: 'roda', meaning: 'The circle of people and music where the game is played.' },
  { id: 'fc-ginga', kind: 'flashcard', reviewNeeded: true, title: 'Word of the day', prompt: 'What does this Portuguese word mean?', word: 'Ginga', say: 'ginga', meaning: 'The rocking step at the base of every movement.' },
  { id: 'fc-mestre', kind: 'flashcard', reviewNeeded: true, title: 'Word of the day', prompt: 'What does this Portuguese word mean?', word: 'Mestre', say: 'mestre', meaning: 'Master. The highest teaching rank.' },
  { id: 'fc-corda', kind: 'flashcard', reviewNeeded: true, title: 'Word of the day', prompt: 'What does this Portuguese word mean?', word: 'Corda', say: 'corda', meaning: 'The cord tied at your waist that shows your rank.' },
  { id: 'fc-jogo', kind: 'flashcard', reviewNeeded: true, title: 'Word of the day', prompt: 'What does this Portuguese word mean?', word: 'Jogo', say: 'jogo', meaning: 'The game. Two capoeiristas playing inside the roda.' },
  { id: 'fc-esquiva', kind: 'flashcard', reviewNeeded: true, title: 'Word of the day', prompt: 'What does this Portuguese word mean?', word: 'Esquiva', say: 'esquiva', meaning: 'An escape. How you move away from a kick.' },
  { id: 'fc-camarada', kind: 'flashcard', reviewNeeded: true, title: 'Word of the day', prompt: 'What does this Portuguese word mean?', word: 'Camará', say: 'camará', meaning: 'Friend. What the songs call everyone in the roda.' },

  // --- name the instrument (real Wix photos) ---
  { id: 'inst-berimbau', kind: 'instrument', reviewNeeded: true, title: 'Name the instrument', prompt: 'Which instrument is this?', photoKey: 'berimbauGourd', choices: ['Berimbau', 'Pandeiro', 'Atabaque', 'Agogô'], correctIndex: 0 },
  { id: 'inst-pandeiro', kind: 'instrument', reviewNeeded: true, title: 'Name the instrument', prompt: 'This frame drum with jingles is a…', photoKey: 'sambaDeRoda', choices: ['Atabaque', 'Pandeiro', 'Reco-reco', 'Berimbau'], correctIndex: 1 },
  { id: 'inst-atabaque', kind: 'instrument', reviewNeeded: true, title: 'Name the instrument', prompt: 'The tall hand drum in this photo is an…', photoKey: 'jongoDrum', choices: ['Agogô', 'Pandeiro', 'Atabaque', 'Caxixi'], correctIndex: 2 },
  { id: 'inst-agogo', kind: 'instrument', reviewNeeded: true, title: 'Name the instrument', prompt: 'The bright double bell is called an…', photoKey: 'puxadaDeRede', choices: ['Berimbau', 'Agogô', 'Pandeiro', 'Atabaque'], correctIndex: 1 },

  // --- order the steps ---
  {
    id: 'order-esquiva', kind: 'order', reviewNeeded: true, title: 'Put the escape in order',
    prompt: 'Tap the steps of **esquiva** and **cocorinha** in the right order.',
    steps: [
      'Start in your ginga. Rock back and forth to the beat.',
      'Esquiva: lean your body to one side, hand up to protect your face.',
      'Back to ginga. Now the other side.',
      'Cocorinha: squat all the way down, one hand on the floor, other hand up.',
    ],
  },
  {
    id: 'order-paranauê', kind: 'order', reviewNeeded: true, title: 'Sing the roda in order',
    prompt: 'Tap the steps of “Paranauê” in the order you would do them in class.',
    steps: [
      'Clap on the beat. One, two, one, two.',
      'Leader sings: "Paranauê, paranauê, paraná."',
      'Everyone answers: "Paranauê, paranauê, paraná!"',
      'Keep clapping. Sing it louder each time.',
    ],
  },

  // --- true / false culture facts ---
  { id: 'tf-brazil', kind: 'fact', reviewNeeded: true, title: 'True or false', prompt: 'Capoeira was born in Brazil.', answer: true, explain: 'People from West and Central Africa brought games and music to Brazil, and capoeira was born there.' },
  { id: 'tf-xp-corda', kind: 'fact', reviewNeeded: true, title: 'True or false', prompt: 'The app can give you a new **corda** when you earn enough XP.', answer: false, explain: 'Only a coach awards a corda, and only at Batizado. XP earns Levels, not cordas.' },
  { id: 'tf-berimbau-leads', kind: 'fact', reviewNeeded: true, title: 'True or false', prompt: 'The **berimbau** leads the **roda** and tells the game how fast to go.', answer: true, explain: 'When the berimbau plays slow, the game is slow. When it stops, everyone stops.' },
  { id: 'tf-daily-streak', kind: 'fact', reviewNeeded: true, title: 'True or false', prompt: 'You have to open the app every day or your streak breaks.', answer: false, explain: 'Roda weeks count a whole week. Training once this week keeps your flame.' },
  { id: 'tf-samba', kind: 'fact', reviewNeeded: true, title: 'True or false', prompt: '**Samba de roda**, jongo, and capoeira all share a circle and call-and-response.', answer: true, explain: 'They are cousins: circle, clap, and answering the song.' },
  { id: 'tf-forbidden', kind: 'fact', reviewNeeded: true, title: 'True or false', prompt: 'Capoeira was always legal and easy to practice in Brazil.', answer: false, explain: 'For a long time it was forbidden. People played anyway, sometimes disguised as a dance.' },

  // --- 30-second ginga timer ---
  { id: 'timer-ginga', kind: 'timer', reviewNeeded: true, title: '30-second ginga', prompt: 'Rock in your **ginga** until the timer ends. Keep your arms alive.', seconds: 30, cue: 'Ginga with the beat. Weight shifts side to side.' },
  { id: 'timer-ginga-low', kind: 'timer', reviewNeeded: true, title: 'Low ginga', prompt: 'Stay in a low **ginga** for 30 seconds. Knees soft, eyes up.', seconds: 30, cue: 'Low and ready. Do not freeze at the bottom.' },
];

export function desafioById(id) {
  return DESAFIO_POOL.find((d) => d.id === id) || null;
}
