// site.js — public-page copy for WP5 (SPEC §5.1). Shape is WP5's
// (ABOUT.mission, THE_ACE.kicker, CORDAS_PAGE.paragraphs, SHOP.fields object).
// Wording folded in from WP1 where it was richer. Draft until ACE reviews.

export const ABOUT = {
  reviewNeeded: true,
  mission: [
    'Physical Chess is the member app for ACE, the Abadá Capoeira Experience in Brooklyn. Kids ages 7 to 13 learn capoeira as a game, a music, and a culture, not only as a workout.',
    'ACE runs in schools and in community classes. Grown-ups log in. Kids pick a player card and walk the map. The real **corda** still comes from a coach at **Batizado**. The app is how you practice between classes.',
  ],
};

export const THE_ACE = {
  reviewNeeded: true,
  title: 'The ACE',
  kicker: 'Abadá Capoeira Experience',
  paragraphs: [
    'ACE is the Abadá Capoeira Experience — the Brooklyn program behind Physical Chess. Programs include in-school classes, after-school enrichment, outside classes, and summer camp.',
    'Kids train ginga, kicks, music, and the manners of the **roda**. The physical side trains balance, strength, and flexibility. The mental side trains improvisation, focus, and sticking with a goal.',
    'ACE shares values with **ABADÁ-Capoeira**. Coaches stamp attendance and award real cordas. This app is the at-home half of that work. If your child is younger than 7, email us at info@the-ace.org and we will tell you what we can offer.',
  ],
};

export const ABADA = {
  reviewNeeded: true,
  title: 'ABADÁ-Capoeira',
  paragraphs: [
    '**ABADÁ-Capoeira** is the Associação Brasileira de Apoio e Desenvolvimento da Arte-Capoeira. In English that means the Brazilian Association for the Support and Development of the Art of Capoeira.',
    'Mestre Camisa, José Tadeu Carneiro Cardoso, founded ABADÁ-Capoeira in 1988 in Rio de Janeiro. It is one of the largest capoeira organizations in the world.',
    'ACE / Abadá Capoeira Brooklyn teaches in that lineage. The ranks, the music, and the Batizado ceremony you see here follow ABADÁ tradition.',
  ],
};

export const EDUCATORS = [
  {
    name: 'Pernilongo',
    title: 'Mestre',
    portraitKey: 'mestrePernilongo',
    bio: 'Mestre Pernilongo teaches with ACE in Brooklyn. Full bio pending ACE review.',
    reviewNeeded: true,
  },
  {
    name: 'Marcia',
    title: 'Mestra',
    portraitKey: 'mestraMarciaBerimbau',
    bio: 'Mestra Marcia teaches with ACE in Brooklyn. Full bio pending ACE review.',
    reviewNeeded: true,
  },
  {
    name: 'Edna Lima',
    title: 'Mestra',
    portraitKey: 'mestraEdnaLima',
    bio: 'Mestra Edna Lima teaches with ACE in Brooklyn. Full bio pending ACE review.',
    reviewNeeded: true,
  },
  {
    name: 'Cobra',
    title: 'Mestre',
    portraitKey: 'mestreCobra',
    bio: 'Mestre Cobra teaches with ACE in Brooklyn. Full bio pending ACE review.',
    reviewNeeded: true,
  },
  {
    name: 'Yara',
    title: 'Mestranda',
    portraitKey: 'mestrandaYara',
    bio: 'Mestranda Yara teaches with ACE in Brooklyn. Full bio pending ACE review.',
    reviewNeeded: true,
  },
];

export const FAQ = [
  {
    q: 'What ages can join?',
    a: 'Classes are for kids 7 to 13. Grown-ups who want to train should contact ACE about adult crews. If your child is younger, email info@the-ace.org and we will tell you what we can offer.',
    reviewNeeded: true,
  },
  {
    q: 'What should my child wear?',
    a: 'Comfortable clothes they can squat, cartwheel, and sit on the floor in. Hair tied back. Bare feet in the **roda** unless a coach says otherwise. Once you have a uniform top, wear it to class.',
    reviewNeeded: true,
  },
  {
    q: 'How do I order a uniform?',
    a: 'ACE uses an ABADÁ uniform top once your child is settled in. Use the Shop page to request one, or ask a coach in class. Sizes run YS, YM, YL, AS, AM, and AL. Price: ask ACE. We confirm by email.',
    reviewNeeded: true,
  },
  {
    q: 'What is Batizado?',
    a: '**Batizado** is our yearly welcoming ceremony and cultural celebration. New students play their first official game. Students who have trained may receive a new **corda**. The 2026 date is still to be confirmed. See Graduation for the six moments of the ceremony.',
    reviewNeeded: true,
  },
  {
    q: 'How much does it cost?',
    a: 'Contact ACE. Fees depend on the school program or community class. Call 917-776-8150 or email info@the-ace.org.',
    reviewNeeded: true,
  },
  {
    q: 'Is capoeira safe for kids?',
    a: 'Coaches teach control, listening, and how to fall well. Kids play, they do not fight. The **roda** has rules: enter at the **berimbau**, do not crash the middle, stop when the music stops. Tell a coach about injuries or needs before class.',
    reviewNeeded: true,
  },
  {
    q: 'What if we miss a class?',
    a: 'Tell the coach when you can. Come back the next week. The app keeps a weekly streak, not a daily one, so one missed class does not wipe the week.',
    reviewNeeded: true,
  },
  {
    q: 'How does this app work?',
    a: 'A grown-up logs in. Kids never type an email. You pick who is playing, then the child follows the map: Movements, Music, Culture, then Graduation. XP earns levels. The app never awards a **corda**. Coaches do that at **Batizado**.',
    reviewNeeded: true,
  },
];

export const CORDAS_PAGE = {
  reviewNeeded: true,
  intro:
    'A **corda** is the colored rope tied at the waist. It is a real rank, given by a coach at **Batizado**. This app cannot promote a child. Levels and XP here are practice, named after movements.',
  paragraphs: [
    'Kids in ACE start at **Crua** (raw, unbleached). The next cords on our ladder are Crua-Amarela, Amarela, Amarela-Laranja, and Laranja. Older students may go further. ACE still needs to confirm the top of the kids\' ladder.',
    'New cordas are tied at Batizado during **troca de cordas**. Until then, wear the corda you were given and take care of it. The map shows a Batizado Readiness ring, not “XP to the next corda.” When the ring is full, you are ready to be seen. The golden gate opens only after a coach records the award.',
  ],
};

export const SHOP = {
  reviewNeeded: true,
  title: 'Uniform tops',
  intro:
    'Order an ACE uniform top for class and for Batizado. Price: ask ACE. We will confirm size, program, and cost by email. Uniform tops only in this form. Do not send card numbers through this page.',
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
