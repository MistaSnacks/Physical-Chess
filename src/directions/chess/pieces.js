// pieces.js — chess piece glyph paths, copied from Paper artboard XN-0
// (promotion track icons: CRUA/pawn, AMARELA/knight, LARANJA/bishop,
// VERDE/rook, AZUL/queen). All paths sit in a 24x24 viewBox.
//
// CORDAS in data/batizado.js maps each corda rank to one of these piece
// ids via `pieceMapping`.

export const PIECE_INNER = {
  pawn: '<circle cx="12" cy="6" r="3"/><path d="M9 11h6l2 7H7z"/><rect x="6" y="18" width="12" height="3"/>',
  knight:
    '<path d="M6 21h12v-2H6zM7 18c0-5 2-8 6-10l1-3 2.5 3c1.5 1.5 1.5 4 0 5.5L14 15v3z"/>',
  bishop:
    '<circle cx="12" cy="4" r="1.6"/><path d="M12 6c3 2 4 5 2 8h-4c-2-3-1-6 2-8z"/><path d="M8 16h8l1 3H7z"/>',
  rook: '<path d="M6 3h3v2h2V3h2v2h2V3h3v5l-1 1v7l1 1v4H6v-4l1-1V9L6 8z"/>',
  queen:
    '<path d="M4 8l3 6 2-8 3 6 3-6 2 8 3-6-1 11H5z"/><rect x="5" y="19" width="14" height="2"/>',
};

/** Raw inner-SVG markup (paths only, no wrapping <svg>) for a piece id. */
export function pieceInner(pieceId) {
  return PIECE_INNER[pieceId] || PIECE_INNER.pawn;
}

/** Full standalone <svg>…</svg> string for a piece id. */
export function pieceSVG(pieceId, { fill = '#0F0F0F', size = 24 } = {}) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="${fill}" aria-hidden="true">${pieceInner(pieceId)}</svg>`;
}

/** Padlock glyph used for locked tiles/modules. */
export const LOCK_INNER =
  '<rect x="5" y="11" width="14" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 11V7a4 4 0 0 1 8 0v4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';

export function lockSVG({ size = 24, color = '#9A927F' } = {}) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="color:${color}" aria-hidden="true">${LOCK_INNER}</svg>`;
}

/** Knight-shaped logo mark (the header brand icon). */
export const LOGO_INNER = PIECE_INNER.knight;
