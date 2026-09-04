# Foundation (WP0) — what already exists

## Runtime model
- **Content** (`src/content/*.js`): `MODULES` (4, with `groups`, `unlockAfter`), `LESSONS` (16 today; schema documented at the top of `lessons.js`), `LEVELS`, `PATCHES` (rule descriptors), `READINESS_RULES`, `GLOSSARY` (12 words), `PROGRAMS` (invite codes), `BIRA` lines. `src/content/index.js` re-exports all + `INSTRUMENTS`.
- **Game engine** (`src/lib/game/`): pure functions. `makeEvent()` builds a ledger event with XP/stars from the table in `events.js`; `derivePlayer(events)` → snapshot `{ xp, level{level,title,percent,xpToNext…}, lessons{id→{status,bestStars,bestScore,attempts}}, modules{id→{completed,total,percent,cleared,locked,lockedReason,stars,maxStars}}, lessonsDone, lessonsTotal, stars, nextUp{moduleId,lessonId}, streak{weeks,activeThisWeek}, cordaCurrent, nextCorda, practices, practicesConfirmed, desafios, attendance, glossaryMastered, readiness{items[],percent,ready}, patches[] }`. `sideEffects()` mints module.cleared / patch.earned / streak.week. Tests in `test/game.test.mjs` (`npm test`).
- **Repo** (`src/lib/repo/`): `getRepo()` returns `localRepo` (demo, localStorage) or `wixRepo` (Wix Members + CMS). `IS_DEMO` is true when `PUBLIC_DEMO=1` or no client ID. Demo seed: account "Demo Family", players Maya "Gatinha" (mid-journey) and Leo "Tubarão" (new). `localRepo.resetDemo()` wipes it.
- **Store + actions** (`src/lib/store.js`, `src/lib/actions.js`): `store.get()/subscribe()`, `bindDom()` fills `[data-bind="path"]` (e.g. `xp`, `level.title`, `streak.weeks`, `patches.length`, `player.apelido`, `account.displayName`; add `data-bind-attr="…"` or `data-bind-style="--var"` to bind an attribute/CSS var instead of text). Actions: `loadSession()`, `selectPlayer(id)`, `clearActivePlayer()`, `recordEvent(type, {moduleId, lessonId, payload})`, `signInDemo()`, `signOut()`, `createPlayer()`, `updatePlayer()`, `deletePlayer()`, `flushOutbox()`. `recordEvent` dispatches DOM events on `document`: `game:xp {xp,type}`, `game:lesson-done {lessonId,stars}`, `game:module-cleared {moduleId}`, `game:level-up {level}`, `game:patch {patchKey}`, `game:streak {weeks}`. Motion code should listen to these.
- **Auth guard** (`src/lib/auth-guard.js`): `requireSession()`, `requireSession({ player: true })`, `requireSession({ role: 'coach' })`.
- **Avatars** (`src/lib/avatar.js`): `avatarSvg({animal,color}, size)`; 6 animals × 6 colors.
- **Nav** (`src/directions/quest/Nav.astro` + `src/lib/nav.js`): shows a player chip once a session exists.
- **Server** (`src/lib/server/session.js` + `src/pages/api/session/*`, `src/pages/auth/callback.js`, `src/pages/api/logout.js`, `src/pages/api/me.js`): httpOnly-cookie session per SPEC §2.1.1. Untestable until the Wix OAuth app exists; do not break them.
- **Wix**: the 11 `lms-*` collections exist on the site (definitions in `scripts/collections.mjs`). `wixRepo` targets `lms-accounts`, `lms-players`, `lms-events`.

## Routes today
`/` home · `/login` (demo button when IS_DEMO) · `/signup` · `/who` · `/journey` (the map; HUD is live-bound, map nodes still build-time) · `/learn/movements`, `/learn/music` (showcase pages, still on the transitional shim) · `/learn/[module]/[lesson]` (generic player: video / reading+check / drill+timer+rating / quiz) · `/batizado` · `/me` (skeleton) · `/family`, `/family/players/new` · `/coach` (skeleton). Redirects: `/dashboard`→`/journey`, `/movements`, `/music`.

## Design tokens and classes
Tokens in `src/directions/quest/tokens.css` (`--quest-*`). The foundation section at the end of `theme.css` adds: `.quest-screen(--narrow)`, `.quest-screen__eyebrow/title/sub`, `.quest-card(--note)`, `.quest-btn(--lime|--ghost)`, `.quest-btn-row`, `.quest-field*`, `.quest-form__error`, `.quest-players`, `.quest-player-card*`, `.quest-avatar-grid`, `.quest-swatches`, `.quest-lesson*`, `.quest-reading`, `.quest-steps`, `.quest-timer`, `.quest-done`, `.quest-rating`, `.quest-toast`, `.quest-table`, `.quest-demo-badge`. The showcase classes (`.quest-hud*`, `.quest-node*`, `.quest-rail*`, `.quest-quiz*`, `.quest-gate*`, …) are above it.

## Verifying
```
npm run build && npm test
(cd dist/client && python3 -m http.server 4398 >/dev/null 2>&1 &)
node test/e2e/demo-smoke.mjs http://localhost:4398   # prints SMOKE OK
lsof -ti:4398 | xargs kill
```
Screenshots: `node -e` with Playwright (already a devDependency) or headless Chrome `--screenshot`.
