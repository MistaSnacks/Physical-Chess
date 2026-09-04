// player-card.js — DOM builder for picker / family grids. Mirrors the
// markup in src/components/quest/PlayerCard.astro. Names go in textContent
// so a child's apelido cannot inject HTML.
import { avatarSvg } from './avatar.js';

export function playerCardEl(player, { href, onClick, snapshot } = {}) {
  const el = document.createElement(onClick ? 'button' : 'a');
  el.className = 'quest-player-card';
  el.dataset.player = player.id;
  if (onClick) {
    el.type = 'button';
    el.addEventListener('click', onClick);
  } else {
    el.href = href || `/family/players/edit?player=${encodeURIComponent(player.id)}`;
  }

  const avatar = document.createElement('span');
  avatar.className = 'quest-player-card__avatar';
  avatar.innerHTML = avatarSvg(player.avatar, 96);

  const name = document.createElement('span');
  name.className = 'quest-player-card__name';
  name.textContent = player.apelido || player.firstName;

  const meta = document.createElement('span');
  meta.className = 'quest-player-card__meta';
  if (snapshot?.level) {
    meta.textContent = `Level ${snapshot.level.level} · ${snapshot.level.title}`;
  } else {
    meta.textContent = player.firstName;
  }

  el.append(avatar, name, meta);
  return el;
}

export function plusSvg(size = 96) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="none" stroke="#7FA894" stroke-width="1.5" stroke-dasharray="3 3"/><path d="M12 7v10M7 12h10" stroke="#9FC4B3" stroke-width="2.4" stroke-linecap="round"/></svg>`;
}
