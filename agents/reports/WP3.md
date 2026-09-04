# WP3 — Gamification UI

## What I built
- **Hud** (`src/components/quest/Hud.astro`) on `/journey` and `/me`: avatar SVG (links to `/me`), apelido, level + title, XP bar, roda-weeks flame, stars, patches, **ReadinessRing**, corda swatch from `CORDAS`, Desafio ticket placeholder (`/desafio`), Batizado countdown. Bound with `data-bind` plus `bindHud()` for avatar, corda color, XP scale, and ring offset.
- **Map** on `/journey` painted from the live snapshot (`src/lib/map.js`): node states `done` / `current` / `open` / `locked`, lesson dots with 0–3 pips, trail `clearedTrailPercent` at runtime. Gate is dim below 100% readiness, glow-pulses at 100%, open when `cordaCurrent !== 'crua'`. Module nodes link to `/learn/<module>`; NEXT UP uses `snapshot.nextUp` and links to the lesson. Existing SVG trails + `getPointAtLength` placement kept; resize re-places dots.
- **Reward moments** (`src/lib/rewards.js`, loaded from `motion.js` so the WP0 lesson player fires them too):
  - `game:xp` — chip flies to the HUD XP bar (or nav chip)
  - `game:lesson-done` — three stars fill one by one
  - `game:level-up` — overlay, title stamp, hibiscus/mango/lime confetti, Bira line from `LEVELS[].bira`, tap to dismiss
  - `game:patch` — corner toast, SVG stitch draw 1.2s
  - `game:module-cleared` — lime flash + confetti
  - `game:streak` — flame pop
  - All skip motion under `prefers-reduced-motion`
- **Patch** stickers: 13 `art` keys → 6 drawings + tier colors; locked = dashed silhouette.
- **`/me`**: avatar editor (`updatePlayer`), level card, stats, patch wall (rule in plain words = catalog `subtitle`), readiness checklist with progress, corda history empty state.
- **Bira.astro**: existing mango-circle figure, line from `content/bira.js`, idle breathe.

Verified in demo: Maya Aú → XP/stars; Jogos → module cleared + Boa Ginga patch; Pandeiro → level 4 Cocorinha; Leo Ginga Basics → First Ginga + streak week. Map showed Movements done / Music current after the module clear. `npm test` 9/9, `npm run build` pass, `node test/e2e/demo-smoke.mjs http://localhost:4403` → **SMOKE OK**. Screenshots in `screenshots/wp3/`.

## Left out
- Did not delete `src/data/student.js` — `batizado.astro` (not WP3) still imports it.
- Did not delete `src/data/curriculum.js` — `/learn/movements` and `/learn/music` still import it (WP2).
- Gate **glow** and **open** CSS are wired; Maya’s demo snapshot is 0% readiness and `crua`, so screenshots show the dim gate. Glow needs readiness 100%; open needs a `corda.awarded` event (WP6 coach).
- Desafio ticket is a placeholder link; WP6 owns `/desafio`.
- `/learn/culture` and `/learn/graduation` hubs do not exist yet (WP2). Nodes still link there per the brief.

## Shared-file edits
- `src/directions/quest/theme.css` — appended `/* === WP3: gamification === */` only.
- `src/directions/quest/motion.js` — **owned**. Confetti moved to `rewards.js`; `initRewards()`; resize re-runs trail placement.
- No `tokens.css` edits. No new npm dependencies.

## Next agent
- Reward listeners live on `document` via `motion.js`. Do not add a second `game:*` listener that also fires confetti.
- Overlay hosts (`[data-levelup]`, `[data-patch-unlock]`, `.quest-flash`, `.quest-confetti-canvas`) are injected if missing, so lesson pages work without extra markup.
- HUD XP fly target is `[data-xp-target]` (the XP track). Keep that attribute if you restyle the HUD.
- Copy on `/me` (profile intro, empty corda line, readiness note) is new kid-facing text; no `reviewNeeded` field on pages — flag it in the copy pass.
