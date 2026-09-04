// patch-art.js — embroidered-patch SVGs for Patch.astro and PatchUnlock.
// 13 catalog `art` keys map onto 6 drawings; tier picks the cloth color.
export const ART_VARIANT = {
  footprint: 'print',
  kick: 'kick',
  berimbau: 'berimbau',
  mouth: 'voice',
  speech: 'voice',
  map: 'place',
  house: 'place',
  gate: 'place',
  flame: 'honor',
  ticket: 'honor',
  star: 'honor',
  corda: 'honor',
  hands: 'honor',
};

export const TIER = {
  1: { fill: '#FFF6E5', stitch: '#154334', ink: '#0B2E24' },
  2: { fill: '#FFB238', stitch: '#0B2E24', ink: '#0B2E24' },
  3: { fill: '#FF4F7A', stitch: '#FFF6E5', ink: '#0B2E24' },
  4: { fill: '#B9F26B', stitch: '#0B2E24', ink: '#0B2E24' },
};

const DRAWINGS = {
  print:
    '<ellipse cx="40" cy="28" rx="10" ry="12"/><circle cx="28" cy="48" r="5.5"/><circle cx="36" cy="54" r="5"/><circle cx="46" cy="54" r="5"/><circle cx="54" cy="48" r="5.5"/>',
  kick:
    '<circle cx="28" cy="26" r="7"/><path d="M28 33c2 8 6 14 18 16M46 49c8 2 14-2 18-10" fill="none" stroke-width="5" stroke-linecap="round"/><path d="M22 58c8-2 18 2 28 0" fill="none" stroke-width="3" stroke-linecap="round"/>',
  berimbau:
    '<path d="M28 16c18 8 24 22 24 48" fill="none" stroke-width="4" stroke-linecap="round"/><path d="M28 16c-2 18 2 34 6 48" fill="none" stroke-width="3.2" stroke-linecap="round"/><circle cx="32" cy="62" r="8" fill="none" stroke-width="3"/><path d="M48 40h10M52 36v14" fill="none" stroke-width="2.4" stroke-linecap="round"/>',
  voice:
    '<ellipse cx="34" cy="40" rx="12" ry="14"/><path d="M46 32c8 4 8 12 0 16M52 28c12 6 12 18 0 24" fill="none" stroke-width="3" stroke-linecap="round"/><path d="M28 38h10M28 44h8" fill="none" stroke-width="2.2" stroke-linecap="round"/>',
  place:
    '<path d="M18 48l22-22 22 22v16H18z"/><path d="M34 64V50h12v14" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="40" cy="36" r="4"/>',
  honor:
    '<path d="M40 16l6 14h14l-11 9 4 14-13-8-13 8 4-14-11-9h14z"/>',
};

function variant(art) {
  return ART_VARIANT[art] || 'honor';
}

function cloth(tier) {
  return TIER[tier] || TIER[1];
}

/**
 * Full sticker markup (svg element). `stitching` starts the dash hidden so
 * rewards.js can draw it on; earned patches on the wall start drawn.
 */
export function patchMarkup({ art, tier = 1, title = 'Patch', earned = true, size = 88, stitching = false }) {
  const v = variant(art);
  const c = cloth(tier);
  const drawing = DRAWINGS[v];
  const fill = earned ? c.fill : 'none';
  const ink = earned ? c.ink : '#7FA894';
  const stitch = earned ? c.stitch : '#7FA894';
  const offset = stitching ? 100 : 0;
  const dash = earned ? '5 3' : '3 4';
  return `<svg class="quest-patch" width="${size}" height="${size}" viewBox="0 0 80 80" role="img" aria-label="${escapeAttr(title)}" data-art="${v}" data-earned="${earned ? 'true' : 'false'}">
    <rect class="quest-patch__cloth" x="6" y="6" width="68" height="68" rx="16" fill="${fill}" stroke="${earned ? ink : 'transparent'}" stroke-width="3"/>
    <g class="quest-patch__art" fill="${ink}" stroke="${ink}">${drawing}</g>
    <rect class="quest-patch__stitch" pathLength="100" x="6" y="6" width="68" height="68" rx="16" fill="none" stroke="${stitch}" stroke-width="2.4" stroke-dasharray="${dash}" stroke-dashoffset="${offset}" stroke-linecap="round"/>
  </svg>`;
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
