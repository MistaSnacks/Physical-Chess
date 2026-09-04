// site.js — public-page copy for WP5. Written here because WP1 has not
// landed this file on this worktree. Export names match agents/WP1-content.md §4.
// Invented copy is flagged reviewNeeded: true for ACE.

export const ABOUT = {
  reviewNeeded: true,
  mission: [
    'Physical Chess is the kids program of ACE / Abadá Capoeira Brooklyn. We teach capoeira as a game you play with your whole body — music, movement, and respect in the same circle.',
    'Our classes are for ages 7–13. Grown-ups log in. Kids pick a player card and walk the map. The real **corda** still comes from a coach at **Batizado**. The app is how you practice between classes.',
  ],
};

export const THE_ACE = {
  reviewNeeded: true,
  title: 'The ACE',
  kicker: 'Abadá Capoeira Experience',
  paragraphs: [
    'ACE is the Abadá Capoeira Experience — the Brooklyn program behind Physical Chess. We teach in schools and in open classes, with the same **ABADÁ-Capoeira** lineage you will meet at Batizado.',
    'Kids train ginga, kicks, music, and the manners of the **roda**. Coaches stamp attendance and award real cordas. This app is the at-home half of that work: lessons, quizzes, and a map that points toward the ceremony.',
    'If your child is younger than 7, email us at info@the-ace.org and we will tell you what we can offer.',
  ],
};

export const ABADA = {
  reviewNeeded: true,
  title: 'ABADÁ-Capoeira',
  paragraphs: [
    '**ABADÁ-Capoeira** is one of the largest capoeira organizations in the world. Mestre Camisa founded it in 1988 in Rio de Janeiro.',
    'ACE / Abadá Capoeira Brooklyn teaches in that lineage. The ranks, the music, and the Batizado ceremony you see here follow ABADÁ tradition. We keep this page short and factual until ACE sends the full member-site copy.',
  ],
};

export const EDUCATORS = [
  {
    name: 'Pernilongo',
    title: 'Mestre',
    portraitKey: 'mestrePernilongo',
    bio: 'Mestre Pernilongo teaches with ACE in Brooklyn.',
    reviewNeeded: true,
  },
  {
    name: 'Marcia',
    title: 'Mestra',
    portraitKey: 'mestraMarciaBerimbau',
    bio: 'Mestra Marcia teaches with ACE in Brooklyn.',
    reviewNeeded: true,
  },
  {
    name: 'Edna Lima',
    title: 'Mestra',
    portraitKey: 'mestraEdnaLima',
    bio: 'Mestra Edna Lima teaches with ACE in Brooklyn.',
    reviewNeeded: true,
  },
  {
    name: 'Cobra',
    title: 'Mestre',
    portraitKey: 'mestreCobra',
    bio: 'Mestre Cobra teaches with ACE in Brooklyn.',
    reviewNeeded: true,
  },
  {
    name: 'Yara',
    title: 'Mestranda',
    portraitKey: 'mestrandaYara',
    bio: 'Mestranda Yara teaches with ACE in Brooklyn.',
    reviewNeeded: true,
  },
];

export const FAQ = [
  {
    q: 'What ages can join?',
    a: 'Classes are for 7–13 years of age. If your child is younger, email info@the-ace.org and we will tell you what we can offer.',
    reviewNeeded: true,
  },
  {
    q: 'What should my child wear?',
    a: 'Comfortable clothes you can move in. Bare feet in the roda. Once you have a uniform top, wear it to class.',
    reviewNeeded: true,
  },
  {
    q: 'How do I order a uniform?',
    a: 'Use the Shop page to request a uniform top. Sizes run YS, YM, YL, AS, AM, and AL. Price: ask ACE. We confirm by email.',
    reviewNeeded: true,
  },
  {
    q: 'What is Batizado?',
    a: '**Batizado** is our welcoming event and cultural celebration. New students play their first official game. Students who have trained may receive a new **corda**. See Graduation for the six moments of the ceremony.',
    reviewNeeded: true,
  },
  {
    q: 'How much does it cost?',
    a: 'Contact ACE for current tuition and Batizado fees. Email info@the-ace.org or call 917-776-8150.',
    reviewNeeded: true,
  },
  {
    q: 'Is capoeira safe for kids?',
    a: 'Coaches teach control, listening, and how to fall well. Kids play, they do not fight. Tell us about injuries or needs before class.',
    reviewNeeded: true,
  },
  {
    q: 'What if we miss a class?',
    a: 'Come back the next week. The app keeps a weekly streak, not a daily one, so one missed class does not wipe the week.',
    reviewNeeded: true,
  },
  {
    q: 'How does this app work?',
    a: 'A grown-up logs in. Kids pick a player card and follow the map: Movements, Music, Culture, then Graduation. XP earns levels. Only a coach awards a real corda.',
    reviewNeeded: true,
  },
];

export const CORDAS_PAGE = {
  reviewNeeded: true,
  intro:
    'A **corda** is the colored rope tied at the waist. It is a real rank. A coach awards it at **Batizado**. The app never promotes a child.',
  paragraphs: [
    'Kids in ACE start at **Crua** (raw, unbleached). The next cords on our ladder are Crua-Amarela, Amarela, Amarela-Laranja, and Laranja. ACE still needs to confirm this ladder for older students.',
    'The map shows a Batizado Readiness ring, not “XP to the next corda.” When the ring is full, you are ready to be seen. The golden gate opens only after a coach records the award.',
  ],
};

export const SHOP = {
  reviewNeeded: true,
  title: 'Uniform tops',
  intro:
    'Order an ACE uniform top for class and for Batizado. Price: ask ACE. We will confirm size, program, and cost by email.',
  price: 'Ask ACE',
  sizes: ['YS', 'YM', 'YL', 'AS', 'AM', 'AL'],
  fields: {
    parentsName: 'Parent name',
    childsName: 'Child name',
    shirtSize: 'Shirt size',
    pantSize: 'Pant size',
    email: 'Email',
    schoolProgramAndChild: 'School program',
    contact: 'Contact number',
  },
};
