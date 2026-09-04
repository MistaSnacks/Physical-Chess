// site.js — public-page copy for WP5 (SPEC §5.1). Kid-facing lessons stay
// in lessons.js; this file is parent/visitor copy. Draft until ACE reviews.
import { CORDAS, CONTACT } from '../data/batizado.js';
import { PROGRAMS } from './programs.js';

export const ABOUT = {
  reviewNeeded: true,
  eyebrow: 'About us',
  title: 'A Brooklyn roda for kids',
  paragraphs: [
    'Physical Chess is the member app for ACE, the Abadá Capoeira Experience in Brooklyn. Kids ages 7 to 13 learn capoeira as a game, a music, and a culture, not only as a workout.',
    'ACE runs in schools and in community classes. The work builds balance, strength, and flexibility. It also builds focus, improvisation, and a sense of belonging in a roda.',
  ],
};

export const THE_ACE = {
  reviewNeeded: true,
  title: 'The ACE',
  subtitle: 'Active Cultural Education',
  paragraphs: [
    'The ACE is the Abadá Capoeira Experience in New York City. Programs include in-school classes, after-school enrichment, outside classes, and summer camp.',
    'Capoeira here is a physical and creative outlet. It promotes community and self-confidence. The physical side trains balance, strength, and flexibility. The mental side trains improvisation, strategic thinking, and sticking with a goal.',
    'ACE shares values and philosophy with the international association ABADÁ-Capoeira.',
  ],
  contact: CONTACT,
};

export const ABADA = {
  reviewNeeded: true,
  title: 'ABADÁ-Capoeira',
  paragraphs: [
    'ABADÁ-Capoeira is the Associação Brasileira de Apoio e Desenvolvimento da Arte-Capoeira. In English that means the Brazilian Association for the Support and Development of the Art of Capoeira.',
    'Mestre Camisa, José Tadeu Carneiro Cardoso, founded ABADÁ-Capoeira in 1988 in Rio de Janeiro. It is one of the largest capoeira organizations in the world.',
    'ACE in Brooklyn shares values and philosophy with this international association.',
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
    a: 'Classes are for kids 7 to 13. Grown-ups who want to train should contact ACE about adult crews.',
    reviewNeeded: true,
  },
  {
    q: 'What should my child wear?',
    a: 'Comfortable clothes they can squat, cartwheel, and sit on the floor in. Hair tied back. Bare feet unless a coach says otherwise.',
    reviewNeeded: true,
  },
  {
    q: 'Do we need a uniform?',
    a: 'ACE uses an ABADÁ uniform top once your child is settled in. Order one on the Shop page, or ask a coach in class. Price: ask ACE.',
    reviewNeeded: true,
  },
  {
    q: 'What is Batizado?',
    a: 'Batizado is the yearly welcoming ceremony. New students play their first official game and receive a corda. Current students who are ready may change cordas. The 2026 date is still to be confirmed.',
    reviewNeeded: true,
  },
  {
    q: 'How much does it cost?',
    a: 'Contact ACE. Fees depend on the school program or community class. Call 917-776-8150 or email info@the-ace.org.',
    reviewNeeded: true,
  },
  {
    q: 'Is capoeira safe for kids?',
    a: 'Coaches teach escapes before fancy kicks. The roda has rules: enter at the berimbau, do not crash the middle, stop when the music stops. Tell a coach about injuries or needs before class.',
    reviewNeeded: true,
  },
  {
    q: 'What if we miss a class?',
    a: 'Tell the coach when you can. A missed week does not punish your child. The app streak is weekly on purpose. Come back and ginga.',
    reviewNeeded: true,
  },
  {
    q: 'How does this app work?',
    a: 'A grown-up logs in. Kids never type an email. You pick who is playing, then the child follows the map: lessons, drills, quizzes, and a Batizado readiness ring. The app never awards a corda. Coaches do that at Batizado.',
    reviewNeeded: true,
  },
];

export const CORDAS_PAGE = {
  reviewNeeded: true,
  title: 'Cordas',
  intro: 'A corda is the cord tied at the waist. Its color is a real rank, given by a coach at Batizado. This app cannot promote a child. Levels and XP here are practice, named after movements.',
  ladder: CORDAS.map((c) => ({ id: c.id, label: c.label, color: c.color })),
  kidsNote: 'Kids in ACE start at Crua and climb toward Laranja. Older students may go further. ACE will confirm the top of the kids\' ladder.',
  ceremonyNote: 'New cordas are tied at Batizado during troca de cordas. Until then, wear the corda you were given and take care of it.',
};

const SHIRT_PANT_SIZES = ['YS', 'YM', 'YL', 'AS', 'AM', 'AL'];

export const SHOP = {
  reviewNeeded: true,
  item: 'Uniform top',
  price: 'ask ACE',
  sizes: SHIRT_PANT_SIZES,
  programs: PROGRAMS.filter((p) => p.active).map((p) => ({ key: p.key, name: p.name })),
  note: 'Uniform tops only in this form. Shirt and pant size both help ACE pack the right kit. Orders go to ACE. You will get a confirmation. Pay the way your coach already uses. Do not send card numbers through this page.',
  fields: [
    { key: 'parentName', label: 'Parent name', type: 'text', required: true },
    { key: 'childName', label: 'Child name', type: 'text', required: true },
    { key: 'shirtSize', label: 'Shirt size', type: 'select', options: SHIRT_PANT_SIZES, required: true },
    { key: 'pantSize', label: 'Pant size', type: 'select', options: SHIRT_PANT_SIZES, required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'program', label: 'School program', type: 'select', optionsFrom: 'programs', required: true },
    { key: 'phone', label: 'Contact number', type: 'tel', required: true },
  ],
};
