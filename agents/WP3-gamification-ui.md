# WP3 — Gamification UI

**Owns:** `src/pages/journey.astro`, `src/pages/me.astro`, `src/directions/quest/motion.js`, new `src/components/quest/Hud.astro`, `ReadinessRing.astro`, `LevelUp.astro`, `PatchUnlock.astro`, `Patch.astro`, `Bira.astro`, `src/lib/rewards.js`.
**May edit (append):** `src/directions/quest/theme.css` under `/* === WP3: gamification === */`. You may delete `src/data/student.js` once nothing imports it; `src/data/curriculum.js` may only be deleted if WP2's hub pages no longer import it (check with grep; if they do, leave it).

## Goal
The map and the HUD run on the live snapshot, and every reward moment in SPEC §4 exists and fires from the DOM events actions.js dispatches.

## Deliverables
1. **Hud.astro**: extract the HUD from `journey.astro` into a component bound with `data-bind`: avatar (`avatarSvg` of the player, not a photo), apelido, level + title, XP bar to next level (`level.percent`), roda-weeks flame, stars, patches count, **ReadinessRing** (SVG ring on `readiness.percent`, label "Batizado ready" at 100), corda swatch from `cordaCurrent` (CORDAS in `src/data/batizado.js`), Desafio ticket placeholder (WP6 wires it; link `/desafio`), Batizado countdown card. Used on `/journey` and `/me`.
2. **Map bound to state**: node states (`done`/`current`/`open`/`locked`) and lesson dots (done/open/locked with 0–3 tiny stars) come from the snapshot at runtime, not build time. Keep the existing SVG trail and `motion.js` placement logic (`getPointAtLength`), just feed it live data; `clearedTrailPercent` becomes runtime. The gate: dim when readiness < 100, glowing pulse at 100, "open" state when `cordaCurrent !== 'crua'` (gate label shows the next corda). Module nodes link to `/learn/<module>`; current node's "NEXT UP" pill uses `nextUp`.
3. **Reward moments** (`src/lib/rewards.js` listens on `document`):
   - `game:xp` → "+N XP" chip flies from the event origin to the HUD XP bar (or from screen center if none).
   - `game:lesson-done` → stars fill one by one.
   - `game:level-up` → **LevelUp** overlay: map dims, new title stamps in, confetti in hibiscus/mango/lime (reuse the confetti canvas in motion.js), Mestre Bira line from `LEVELS[].bira`, dismiss on tap.
   - `game:patch` → **PatchUnlock** toast: patch slides in from the corner and "stitches on" (SVG dash draw, 1.2 s).
   - `game:module-cleared` → screen-wide lime flash + confetti.
   - `game:streak` → flame pop.
   - All respect `prefers-reduced-motion`.
4. **Patch.astro**: an SVG embroidered-patch sticker, 6 art variants by `art` key (footprint, kick, berimbau, mouth, map, speech, flame, ticket, house, star, gate, corda, hands → map them onto 6 drawings + a color per tier), locked state is a dashed outline silhouette.
5. **`/me`**: avatar editor (animal grid + color swatches, saves via `updatePlayer`), level card, stats, **patch wall** (all PATCHES; earned vs locked with the rule in plain words), readiness checklist (each item with progress), corda history (from `corda.awarded` events; empty state "Your first corda comes at Batizado").
6. **Bira.astro**: the mascot (reuse the existing SVG figure in a mango circle) with a speech bubble that takes a `moment` and picks a line from `content/bira.js`; breathes idle.
7. Keep `journey` entrance ≤ 1.2 s; remove any leftover `STUDENT` imports.

## Done when
Every reward fires from real demo events (complete lessons via WP2's player or the WP0 skeleton), the map reflects state after each lesson, `/me` works, smoke test prints `SMOKE OK`, screenshots in `screenshots/wp3/`, report in `agents/reports/WP3.md`.
