// media.js — the single photo + video manifest for every direction.
// Photos are real Wix Media Manager assets from physicalchess.org (site
// 93f9dffd-79fb-4bea-94fa-810eef3397fe). Videos are either Wix-hosted mp4s
// (class clips, program videos) or SoChlo Productions YouTube uploads.
//
// See SPEC.md §4.1 / §4.2 for the confirmed base set, and
// wix-images-inventory.json at the repo root for the full Media Manager
// listing this file's curated additions were pulled from.

const WIX_MEDIA_BASE = 'https://static.wixstatic.com/media/';

// ---------------------------------------------------------------------
// Photos — { file } is the bare Wix filename (no /v1/fill/ suffix, so
// wixOriginal() always serves the full-size original).
// ---------------------------------------------------------------------
export const PHOTOS = {
  // --- SPEC §4.1 confirmed set -----------------------------------------
  heroWorkshop: {
    file: '473014_10bb43a581574e12b16f5091b7fcb4af~mv2.jpg',
    caption: 'Kids workshop with Professor Coco',
  },
  heroRoda: {
    file: 'bc3ec7bc825c4e6ca746c659189cea83.jpg',
    caption: 'Wide roda shot',
  },
  heroStrip: {
    file: '473014_d2a74a236692481582693d7b21567b4cf000.jpg',
    caption: 'Home page banner strip',
  },
  bannerBatizado: {
    file: '11062b_c0f82e7370a041fb92d161623b53b27af000.jpg',
    caption: 'Batizado 2026 banner',
  },
  cocoTubarao: {
    file: '473014_5c597a6b0d04429fa4f5cbda9959ffaf~mv2.jpg',
    caption: 'Prof. Coco e Tubarão',
  },
  kidsParents: {
    file: '473014_12ea738b0df542fd88161b22d4ca4277~mv2.jpg',
    caption: 'Kids playing with parents',
  },
  voltaDoMundo: {
    file: '473014_cbe6cfd1bab04cc2bc2ff32cf2371eff~mv2.jpg',
    caption: 'Volta do Mundo',
  },
  toroMindinha: {
    file: '473014_89cb339c29a245aa864c0c3098ef1fa1~mv2.jpg',
    caption: 'Toro e Mindinha (Troca de Cordas)',
  },
  trocaDeCordas: {
    file: '473014_11a07343b5604f1d9a99e26c57ef693d~mv2.jpg',
    caption: 'Troca de Cordas',
  },
  voltaAdults: {
    file: '473014_5e22a6297b314f07b2aaec1997547872~mv2.jpg',
    caption: 'Adults receiving their first rank',
  },
  celebration2018: {
    file: '473014_28fa1769cd91447cad9a39a742143500~mv2.jpg',
    caption: 'Final celebration 2018',
  },
  cordsTable2018: {
    file: '473014_0fb5a2d1ec0f4d88b58b649af4b22038~mv2.jpg',
    caption: 'Cords table 2018',
  },
  batizado2019a: {
    file: '473014_c77f25c3da9e4f7295c8d25d41a44173~mv2.jpg',
    caption: 'Batizado 2019',
  },
  batizado2019b: {
    file: '473014_6f4af57fab5d4d229edb2d5f280f57a3~mv2.jpg',
    caption: 'ABADÁ Capoeira Brooklyn Batizado 2019',
  },
  groupFoto2019: {
    file: '473014_f60938a091d1493e9e8ef834bf5cc153~mv2.jpg',
    caption: 'Group foto 2019',
  },
  xampuGasparzinho: {
    file: '473014_2e8155fa082341448857a7f386f4b24a~mv2.jpg',
    caption: 'Xampu e Gasparzinho',
  },
  troca2019: {
    file: '473014_dd25d82081c149a7a051fe25367aa58b~mv2.jpg',
    caption: 'Troca de Cordas 2019',
  },
  batizado2022: {
    file: '473014_0b6497fbfada46e3b2cacad86cbeae53~mv2.jpg',
    caption: 'Batizado 2022',
  },
  cordsTable2022: {
    file: '473014_c289bcb834e04700a99a8e83be64b196~mv2.jpg',
    caption: 'Cords table 2022',
  },
  kidsWorkshopDay2: {
    file: '473014_5f267ec52bbf4576b42c8684d62751cb~mv2.jpg',
    caption: 'Kids Workshop Day 2',
  },
  pastorPerigoCiborg: {
    file: '473014_ab96f85e64034164b483afa15f024d2c~mv2.jpg',
    caption: 'Pastor com Perigo e Ciborg',
  },
  guindasteTubarao: {
    file: '473014_cbc4e60cc6bf494483d28bd788f18370~mv2.jpg',
    caption: 'Tubarão e Guindaste',
  },
  videoPoster1: {
    file: '473014_ad3f773426eb4e998ad5d0e5dd1eb144f000.jpg',
    caption: 'Solos video poster',
  },
  videoPoster2: {
    file: '473014_c50927cc537d42fa95da724532d5e043f000.jpg',
    caption: 'Solos video poster 2',
  },
  flyer2023: {
    file: '473014_92be22ded2f04a1a95869a4af8fb9aa7~mv2.png',
    caption: 'Batizado 2023 flyer',
  },

  // --- Curated additions from the Wix Media Manager --------------------
  // Teachers / mestres (Culture -> ABADÁ-Capoeira, About Us -> Educators)
  mestrePernilongo: {
    file: '473014_3401328370b04f2bb2dd99c78eea11df~mv2.webp',
    caption: 'Mestre Pernilongo',
  },
  mestraMarciaBerimbau: {
    file: '473014_49fa715f9fef4bc7826032cf796b9a4a~mv2.jpg',
    caption: 'Mestra Marcia on the berimbau',
  },
  mestraEdnaLima: {
    file: '473014_45bd6c2e77aa4c8c9c2a989d8c9aeed2~mv2.jpg',
    caption: 'Mestra Edna Lima',
  },
  mestreCobra: {
    file: '473014_a2f584a24fd04c5d91f21d957e8437a2~mv2.jpg',
    caption: 'Mestre Cobra',
  },
  mestrandaYara: {
    file: '473014_c856e8d81639422181a4e300b888dc7c~mv2.jpg',
    caption: 'Mestranda Yara',
  },

  // Real class photos (WhatsApp uploads from ACE classes, 2021-2022)
  classPhoto2022a: {
    file: '473014_c0441dae4e6b4bd0a7e3c87a4824ade1~mv2.jpg',
    caption: 'ACE class, December 2022',
  },
  classPhoto2022b: {
    file: '473014_3036ea2e3558496abb923747d75727c4~mv2.jpg',
    caption: 'ACE class, December 2022',
  },
  classPhotoWorkshop2022: {
    file: '473014_cfe9cc346e6f4b989e92fe308137118f~mv2.jpg',
    caption: 'ACE workshop, May 2022',
  },
  classPhoto2022c: {
    file: '473014_9e5a1330d0be4986909180f1eac6e520~mv2.jpg',
    caption: 'ACE class, May 2022',
  },
  classPhoto2021a: {
    file: '473014_4ee3bb8d5e8344369339ae9028135ee0~mv2.jpg',
    caption: 'ACE class, December 2021',
  },
  classPhoto2021b: {
    file: '473014_97d2906f6a6a4af3acbda06ba29a5242~mv2.jpg',
    caption: 'ACE class, September 2021',
  },

  // Culture -> History & Maps
  mapAfrica: {
    file: '473014_70e542516a634a4db324f55e9784a2e4~mv2.jpg',
    caption: 'Map of the African continent',
  },
  mapBrazil: {
    file: '473014_20ba21813d594db1b6ccf7a8c11f28d5~mv2.png',
    caption: 'The 26 Brazilian states and the Federal District',
  },
  mapSlaveTrade: {
    file: '473014_a0e32a6d788344818aa1af797cae2550~mv2.jpg',
    caption: 'Transatlantic slave trade routes, 1650-1860',
  },

  // Culture -> Folklore / Manifestations / instruments
  sambaDeRoda: {
    file: '473014_b73982b79fdf40b3b68e9e651c64000f~mv2.png',
    caption: 'Samba de roda',
  },
  berimbauGourd: {
    file: '473014_b6c3295274d74f7b93aef831ab28a77a~mv2.png',
    caption: 'Cabaça, the berimbau’s gourd resonator',
  },
  jongoDrum: {
    file: '473014_3555c27f184c4f23975d947fea81c52f~mv2.jpg',
    caption: 'Jongo, an Afro-Brazilian drum circle tradition',
  },
  puxadaDeRede: {
    file: '473014_8403db09c1294fc794bb06ee2eb0defb~mv2.jpg',
    caption: 'Puxada de Rede, a folkloric fishing dance',
  },

  // Movements named after animals (Ginga menagerie: Aú de Macaco, etc.)
  animalGiraffe: {
    file: '473014_9f86b0dfb312459e864653e587bf92a7~mv2.jpg',
    caption: 'Giraffe',
  },
  animalGorilla: {
    file: '473014_fa3fa8963c634b4a987ce37e8eafc360~mv2.jpg',
    caption: 'Gorilla',
  },
  animalLizard: {
    file: '473014_661d64d7929d48358bf0b21d18cc6422~mv2.jpg',
    caption: 'Lizard',
  },
  animalFrog: {
    file: '473014_2280c0f7a5d24872b8da01e34650bb93~mv2.jpg',
    caption: 'Frog',
  },
  animalSnake: {
    file: '473014_cabaaf2d5c4c4eb8a9ffe1197a2f9794~mv2.jpg',
    caption: 'Snake',
  },
  animalArmadillo: {
    file: '473014_0912160dd46c424aaaeae5ee5581b2f1~mv2.jpg',
    caption: 'Armadillo',
  },
};

// ---------------------------------------------------------------------
// Wix-hosted mp4 videos (class clips + program video). Keys mirror
// wix-videos-inventory.json at the repo root.
// ---------------------------------------------------------------------
export const WIX_VIDEOS = {
  videoProject1: {
    mp4: 'https://video.wixstatic.com/video/473014_d2a74a236692481582693d7b21567b4c/720p/mp4/file.mp4',
    poster: 'https://static.wixstatic.com/media/473014_d2a74a236692481582693d7b21567b4cf002.jpg',
    seconds: 520,
    title: 'Video Project 1 (2026 program video)',
  },
  aulao2024Lapa: {
    mp4: 'https://video.wixstatic.com/video/473014_3d2557ff2a8241c689d11c9d0a74e96b/720p/mp4/file.mp4',
    poster: 'https://static.wixstatic.com/media/473014_3d2557ff2a8241c689d11c9d0a74e96bf002.jpg',
    seconds: 630,
    title: 'Aulão 2024 – 300 Anos Lapa',
  },
  clip20240909a: {
    mp4: 'https://video.wixstatic.com/video/473014_75f9c019b0994e9a8e25b0c9580b9660/720p/mp4/file.mp4',
    poster: 'https://static.wixstatic.com/media/473014_75f9c019b0994e9a8e25b0c9580b9660f002.jpg',
    seconds: 23,
    title: 'Class clip, 2024-09-09',
  },
  clip20240909b: {
    mp4: 'https://video.wixstatic.com/video/473014_74516344498246d88b72274de6e7e878/720p/mp4/file.mp4',
    poster: 'https://static.wixstatic.com/media/473014_74516344498246d88b72274de6e7e878f002.jpg',
    seconds: 20,
    title: 'Class clip, 2024-09-09',
  },
  copacabana2019: {
    mp4: 'https://video.wixstatic.com/video/473014_3b12f1e32ea94b3bb673164cbf6849a0/720p/mp4/file.mp4',
    poster: 'https://static.wixstatic.com/media/473014_3b12f1e32ea94b3bb673164cbf6849a0f002.jpg',
    seconds: 378,
    title: 'ABADÁ Capoeira Copacabana 2019 Aulão',
  },
  nycSiteVideo: {
    mp4: 'https://video.wixstatic.com/video/473014_9cb3597a58954482954bc96bfeb7b0df/720p/mp4/file.mp4',
    poster: 'https://static.wixstatic.com/media/473014_9cb3597a58954482954bc96bfeb7b0dff002.jpg',
    seconds: 153,
    title: 'NYC Video for Site (2019)',
  },
  whatsapp2018a: {
    mp4: 'https://video.wixstatic.com/video/473014_476d6a6bf0954bee999b323062f35301/480p/mp4/file.mp4',
    poster: 'https://static.wixstatic.com/media/473014_476d6a6bf0954bee999b323062f35301f002.jpg',
    seconds: 33,
    title: 'Kids clip 2018 (portrait)',
  },
  whatsapp2018b: {
    mp4: 'https://video.wixstatic.com/video/473014_01ff9a5acead408eb4354140b540a822/480p/mp4/file.mp4',
    poster: 'https://static.wixstatic.com/media/473014_01ff9a5acead408eb4354140b540a822f002.jpg',
    seconds: 35,
    title: 'Kids clip 2018',
  },
  whatsapp2018c: {
    mp4: 'https://video.wixstatic.com/video/473014_0724006255494ba8833d9f64aab6ccbc/480p/mp4/file.mp4',
    poster: 'https://static.wixstatic.com/media/473014_0724006255494ba8833d9f64aab6ccbcf002.jpg',
    seconds: 15,
    title: 'Kids clip 2018',
  },
  whatsapp2018d: {
    mp4: 'https://video.wixstatic.com/video/473014_5058f3055da5461c9f87137ae5e46d6f/360p/mp4/file.mp4',
    poster: 'https://static.wixstatic.com/media/473014_5058f3055da5461c9f87137ae5e46d6ff002.jpg',
    seconds: 50,
    title: 'Kids clip 2018',
  },
  whatsapp2018e: {
    mp4: 'https://video.wixstatic.com/video/473014_f11484b882ea4c1a896b386169055834/360p/mp4/file.mp4',
    poster: 'https://static.wixstatic.com/media/473014_f11484b882ea4c1a896b386169055834f002.jpg',
    seconds: 33,
    title: 'Kids clip 2018',
  },
  whatsapp2018f: {
    mp4: 'https://video.wixstatic.com/video/473014_9240218a99c1472da743e86a3122b7eb/360p/mp4/file.mp4',
    poster: 'https://static.wixstatic.com/media/473014_9240218a99c1472da743e86a3122b7ebf002.jpg',
    seconds: 38,
    title: 'Kids clip 2018',
  },
};

// ---------------------------------------------------------------------
// SoChlo Productions YouTube uploads. Always credit "Video: SoChlo
// Productions" wherever one of these is embedded (SPEC §4.2).
// ---------------------------------------------------------------------
export const YOUTUBE = {
  aceCompilation: {
    id: 'r5G5G1RMakk',
    title: 'The Abadá Capoeira Experience',
    use: "Home hero background / 'What is Physical Chess'",
  },
  batizado2026: {
    id: 'R9ofSmjDe0I',
    title: 'Abadá Capoeira NYC Batizado 2026',
    use: 'Batizado screen featured video',
  },
  batizado2025: {
    id: '18UN2FHpS10',
    title: 'Abadá Capoeira NYC Batizado 2025',
    use: 'Batizado screen',
  },
  batizado2024: {
    id: 'qRHd8yXlMVk',
    title: 'Abadá Capoeira NYC Batizado 2024',
    use: 'Batizado screen',
  },
  aulaoBushwick: {
    id: 'EBvKKDFnZho',
    title: 'ACE Aulão at Achievement First Bushwick Elementary',
    use: 'Movements lesson video',
  },
  acePresentation: {
    id: 'y2NLf9Vw78w',
    title: 'Abadá Capoeira Experience Presentation',
    use: "Movements: 'Jogo' lesson",
  },
  sankofaHaus: {
    id: 'gv8gtMagSj0',
    title: 'ACE x Sankofa Haus',
    use: 'Music & Culture',
  },
  berkeleyCarroll: {
    id: '2OSrC0C9FGQ',
    title: 'ACE – Berkeley Carroll',
    use: 'Movements alt',
  },
  bhmShowcase: {
    id: '-V_OzLj_Hf8',
    title: 'ACE Black History Month Showcase',
    use: 'Culture',
  },
  acb2024: {
    id: 'ercczK8Cgf8',
    title: 'Abadá Capoeira Brooklyn 2024',
    use: "Dashboard 'latest from the roda'",
  },
};

/**
 * Wix fill-crop URL for a photo key, e.g. wix('heroWorkshop', 800, 600).
 * Uses Wix's `/v1/fill/w_<W>,h_<H>,al_c,q_85/<file>` transform.
 */
export function wix(key, w, h) {
  const photo = PHOTOS[key];
  if (!photo) throw new Error(`media.js: unknown photo key "${key}"`);
  return `${WIX_MEDIA_BASE}${photo.file}/v1/fill/w_${w},h_${h},al_c,q_85/${photo.file}`;
}

/** Full-size original photo URL (no transform suffix) for a photo key. */
export function wixOriginal(key) {
  const photo = PHOTOS[key];
  if (!photo) throw new Error(`media.js: unknown photo key "${key}"`);
  return `${WIX_MEDIA_BASE}${photo.file}`;
}

/** YouTube video id for a YOUTUBE key. */
export function yt(key) {
  const entry = YOUTUBE[key];
  if (!entry) throw new Error(`media.js: unknown YouTube key "${key}"`);
  return entry.id;
}

/** { mp4, poster, seconds } for a Wix-hosted video key. */
export function video(key) {
  const entry = WIX_VIDEOS[key];
  if (!entry) throw new Error(`media.js: unknown Wix video key "${key}"`);
  return { mp4: entry.mp4, poster: entry.poster, seconds: entry.seconds };
}

/** The six best landscape photos for hero use, in order. */
export const HERO_CANDIDATES = [
  'heroWorkshop',
  'heroRoda',
  'heroStrip',
  'bannerBatizado',
  'kidsParents',
  'voltaDoMundo',
];
