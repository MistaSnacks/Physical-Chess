// modules.js — the four curriculum modules mirroring the Wix member nav
// (SPEC §5.5). `unlockAfter` names the module that must be cleared first;
// null means open from day one. Groups mirror the Wix sub-pages.
export const MODULES = [
  {
    id: 'movements',
    title: 'Movements',
    icon: 'movements',
    unlockAfter: null,
    photoKey: 'kidsWorkshopDay2',
    groups: [
      { id: 'capoeira-abada', title: 'Capoeira ABADÁ' },
      { id: 'virtual-training', title: 'Virtual Training' },
      { id: 'jogos', title: 'Jogos' },
    ],
  },
  {
    id: 'music',
    title: 'Music',
    icon: 'music',
    unlockAfter: null,
    photoKey: 'berimbauGourd',
    groups: [
      { id: 'instruments', title: 'Instruments' },
      { id: 'songs', title: 'Songs' },
      { id: 'boss', title: 'Boss Quiz' },
    ],
  },
  {
    id: 'culture',
    title: 'Culture',
    icon: 'culture',
    unlockAfter: 'music',
    lockedReason: 'Finish Music to unlock Culture.',
    photoKey: 'mapBrazil',
    groups: [
      { id: 'portuguese', title: 'Portuguese' },
      { id: 'abada', title: 'ABADÁ-Capoeira' },
      { id: 'manifestations', title: 'Manifestations' },
      { id: 'folklore', title: 'Folklore' },
      { id: 'history', title: 'History & Maps' },
      { id: 'boss', title: 'Boss Quiz' },
    ],
  },
  {
    id: 'graduation',
    title: 'Graduation',
    icon: 'graduation',
    unlockAfter: 'culture',
    lockedReason: 'Finish Culture to unlock Graduation.',
    photoKey: 'bannerBatizado',
    groups: [
      { id: 'batizado', title: 'Batizado' },
      { id: 'cordas', title: 'Cordas' },
      { id: 'ready', title: 'Roda Ready' },
    ],
  },
];

export function moduleById(id) {
  return MODULES.find((m) => m.id === id) || null;
}
