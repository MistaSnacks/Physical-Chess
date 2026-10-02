// library-icons.js — inline SVG icons for instructor-library rows (no emoji
// as icons, GUARDRAILS 6). Strings, so Astro (set:html) and the browser-side
// search results (innerHTML) draw the same markup.
const svg = (body) => `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const stroke = 'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';

export const KIND_ICON = {
  video: svg('<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>'),
  reading: svg(`<path d="M4 5.5c2.8-1 5.5-.8 8 1 2.5-1.8 5.2-2 8-1v13c-2.8-1-5.5-.8-8 1-2.5-1.8-5.2-2-8-1z" ${stroke}/><path d="M12 6.5v13" ${stroke}/>`),
  drill: svg(`<circle cx="12" cy="13.5" r="7" ${stroke}/><path d="M12 13.5V10M9.5 3h5" ${stroke}/>`),
  quiz: svg(`<path d="M9 9.2a3 3 0 1 1 4.4 2.7c-.9.5-1.4 1.1-1.4 2.1v.5" ${stroke}/><circle cx="12" cy="18.2" r="1.4" fill="currentColor"/>`),
  word: svg(`<path d="M4.5 6.5h15v9.5h-8l-4.5 3.5V16h-2.5z" ${stroke}/>`),
  instrument: svg(`<path d="M9 18V6l10-2v12" ${stroke}/><circle cx="6.5" cy="18" r="2.5" ${stroke}/><circle cx="16.5" cy="16" r="2.5" ${stroke}/>`),
  clip: svg(`<rect x="3.5" y="5.5" width="17" height="13" rx="3" ${stroke}/><path d="M10.5 9.5v5l4.2-2.5z" fill="currentColor"/>`),
  page: svg(`<path d="M7 3.5h7l4 4v13H7z" ${stroke}/><path d="M10 12h5M10 15.5h5" ${stroke}/>`),
};

export const EXTERNAL = svg(`<path d="M13 5h6v6M19 5l-8 8" ${stroke}/><path d="M17 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 4 18.5v-10A1.5 1.5 0 0 1 5.5 7H10" ${stroke}/>`);
export const CHEVRON = svg(`<path d="M9.5 6l6 6-6 6" ${stroke}/>`);
export const CHECK = svg(`<path d="M5 12.5l4.5 4.5L19 7" ${stroke}/>`);
export const BACK = svg(`<path d="M15 5l-7 7 7 7" ${stroke}/>`);
export const SEARCH = svg(`<circle cx="10.5" cy="10.5" r="6" ${stroke}/><path d="M15 15l5 5" ${stroke}/>`);
