// avatar.js — flat SVG animal stickers for player avatars (SPEC §4.9).
// Six animals from the client's rainforest / Africa content, six cord colors.
export const ANIMALS = ['frog', 'snake', 'lizard', 'armadillo', 'giraffe', 'gorilla'];
export const AVATAR_COLORS = { hibiscus: '#FF4F7A', mango: '#FFB238', lime: '#B9F26B', cream: '#FFF6E5', sky: '#7FD3FF', lilac: '#C9A7FF' };

const FACE = {
  frog: '<ellipse cx="12" cy="13" rx="8" ry="6.5" fill="#2FBF71"/><circle cx="8.5" cy="7.5" r="3" fill="#2FBF71"/><circle cx="15.5" cy="7.5" r="3" fill="#2FBF71"/><circle cx="8.5" cy="7.5" r="1.6" fill="#FFF6E5"/><circle cx="15.5" cy="7.5" r="1.6" fill="#FFF6E5"/><circle cx="8.9" cy="7.7" r=".8" fill="#0B2E24"/><circle cx="15.9" cy="7.7" r=".8" fill="#0B2E24"/><path d="M8 14.5q4 3 8 0" stroke="#0B2E24" stroke-width="1.2" fill="none" stroke-linecap="round"/>',
  snake: '<path d="M5 15c0-4 3-6 7-6s7 2 7 6-3 5-7 5-7-1-7-5z" fill="#B9F26B"/><circle cx="9.5" cy="13" r="1.1" fill="#0B2E24"/><circle cx="14.5" cy="13" r="1.1" fill="#0B2E24"/><path d="M12 16v3M12 19l-1.2 1M12 19l1.2 1" stroke="#FF4F7A" stroke-width="1.3" fill="none" stroke-linecap="round"/>',
  lizard: '<path d="M4 13c2-5 6-7 8-7s6 2 8 7c-2 4-5 5-8 5s-6-1-8-5z" fill="#FFB238"/><circle cx="9" cy="12" r="1.2" fill="#0B2E24"/><circle cx="15" cy="12" r="1.2" fill="#0B2E24"/><path d="M6 8l-2-2M18 8l2-2" stroke="#FFB238" stroke-width="2" stroke-linecap="round"/><path d="M9.5 15.5q2.5 1.5 5 0" stroke="#0B2E24" stroke-width="1.1" fill="none" stroke-linecap="round"/>',
  armadillo: '<path d="M4 15a8 6 0 0 1 16 0v2H4z" fill="#C9B7A2"/><path d="M6 12h12M6.5 10h11M8 8h8" stroke="#8C7A66" stroke-width="1.2" stroke-linecap="round"/><circle cx="9" cy="14.5" r="1" fill="#0B2E24"/><circle cx="15" cy="14.5" r="1" fill="#0B2E24"/><circle cx="12" cy="17" r="1" fill="#0B2E24"/>',
  giraffe: '<ellipse cx="12" cy="13" rx="6.5" ry="6" fill="#FFD57A"/><circle cx="9" cy="6" r="1.4" fill="#B07C3A"/><circle cx="15" cy="6" r="1.4" fill="#B07C3A"/><path d="M9 7v2M15 7v2" stroke="#B07C3A" stroke-width="1.6"/><circle cx="8.5" cy="11" r="1.6" fill="#B07C3A"/><circle cx="15" cy="15.5" r="1.4" fill="#B07C3A"/><circle cx="10" cy="13" r="1" fill="#0B2E24"/><circle cx="14" cy="13" r="1" fill="#0B2E24"/>',
  gorilla: '<circle cx="12" cy="12" r="8" fill="#3B3B45"/><ellipse cx="12" cy="14" rx="5" ry="4" fill="#6B6B78"/><circle cx="9.5" cy="10.5" r="1.2" fill="#0B2E24"/><circle cx="14.5" cy="10.5" r="1.2" fill="#0B2E24"/><circle cx="10.5" cy="14" r=".8" fill="#0B2E24"/><circle cx="13.5" cy="14" r=".8" fill="#0B2E24"/><path d="M10 16.5q2 1.2 4 0" stroke="#0B2E24" stroke-width="1" fill="none" stroke-linecap="round"/>',
};

export function avatarSvg(avatar = {}, size = 64) {
  const animal = ANIMALS.includes(avatar.animal) ? avatar.animal : 'frog';
  const color = AVATAR_COLORS[avatar.color] || AVATAR_COLORS.lime;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" role="img" aria-label="${animal}"><circle cx="12" cy="12" r="12" fill="${color}"/>${FACE[animal]}</svg>`;
}
