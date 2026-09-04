# QA — Physical Chess / Roda Quest (WP7)

Branch `wp7`. Static `dist/client` served on **port 4407**. Screenshots in `screenshots/final/`. Date: 2026-09-03.

## Verdict

Demo on this worktree is ready for Camren to click through. Every player-facing route was captured at 1440 and 390 with no horizontal overflow. `npm test` (20), `npm run content:check`, `npm run build`, and `node test/e2e/demo-smoke.mjs http://localhost:4407` → **SMOKE OK**. Lighthouse performance is ≥ 85 on `/` (desktop 94, mobile 85) and `/journey` (desktop 90). Live Wix OAuth, CMS writes, and server routes were not exercised (no client secret on this machine).

## How to re-run

```
npm test
npm run content:check
npm run build
# from dist/client:
python3 -m http.server 4407
node test/e2e/demo-smoke.mjs http://localhost:4407
node test/e2e/shots.mjs http://localhost:4407
node test/e2e/lighthouse-journey.mjs http://localhost:4407
npx lighthouse@12 http://localhost:4407/ --preset=desktop --only-categories=performance,accessibility --output=json --output-path=screenshots/final/lh-home-desktop.json
npx lighthouse@12 http://localhost:4407/ --form-factor=mobile --screenEmulation.mobile --only-categories=performance,accessibility --output=json --output-path=screenshots/final/lh-home-mobile.json
```

Do not reinstall `node_modules` (symlink). Do not kill other agents' processes with `killall`.

---

## Routes at 1440 and 390 — no horizontal scroll

`test/e2e/shots.mjs` wrote `{name}-1440.png` and `{name}-390.png` for every row below. `screenshots/final/_overflow.json` is `{ "overflows": [], "errors": [] }`.

Redirects (no unique page to shoot): `/dashboard` → `/journey`, `/movements` → `/learn/movements`, `/music` → `/learn/music`. API and `/auth/callback` are not visual.

| Route | 1440 | 390 | Notes |
|---|---|---|---|
| `/` | home-1440 | home-390 | Age line + phone/email + SoChlo |
| `/about` | about-1440 | about-390 | |
| `/about/educators` | about-educators-1440 | about-educators-390 | Five portraits; Coco/Pastor still missing |
| `/about/the-ace` | about-the-ace-1440 | about-the-ace-390 | |
| `/about/abada` | about-abada-1440 | about-abada-390 | |
| `/about/faq` | about-faq-1440 | about-faq-390 | |
| `/about/contact` | about-contact-1440 | about-contact-390 | Static demo: form does not POST |
| `/graduation` | graduation-1440 | graduation-390 | |
| `/graduation/what-is-batizado` | graduation-what-is-batizado-1440 | graduation-what-is-batizado-390 | Verbatim `INTRO` + six `MOMENTS` |
| `/graduation/cordas` | graduation-cordas-1440 | graduation-cordas-390 | |
| `/graduation/media` | graduation-media-1440 | graduation-media-390 | Gallery + SoChlo videos |
| `/shop` | shop-1440 | shop-390 | Price: ask ACE |
| `/login` | login-1440 | login-390 | Demo button |
| `/signup` | signup-1440 | signup-390 | Demo fallback |
| `/forgot` | forgot-1440 | forgot-390 | Demo fallback |
| `/verify` | verify-1440 | verify-390 | Demo fallback |
| `/privacy` | privacy-1440 | privacy-390 | Needs ACE sign-off |
| `/batizado` | batizado-1440 | batizado-390 | Same ceremony copy |
| `/who` | who-1440 | who-390 | Maya + Leo |
| `/who` empty | who-no-players-1440 | who-no-players-390 | |
| `/journey` Maya | journey-1440 | journey-390 | Snapshot-bound HUD |
| `/journey` Leo | journey-new-player-1440 | journey-new-player-390 | Culture/Graduation locked |
| `/learn/movements` | learn-movements-1440 | learn-movements-390 | |
| `/learn/music` | learn-music-1440 | learn-music-390 | |
| `/learn/culture` | learn-culture-1440 | learn-culture-390 | Locked until Music |
| `/learn/graduation` | learn-graduation-1440 | learn-graduation-390 | Locked until Culture |
| `/learn/{module}/{id}` | `lesson-{id}-1440/390` | all 24 lessons | Locked deep links bounce to the hub |
| `/me` | me-1440 | me-390 | |
| `/desafio` | desafio-1440 | desafio-390 | Injected card is visible |
| `/turma` | turma-1440 | turma-390 | Berimbau + apelidos |
| `/family` | family-1440 | family-390 | |
| `/family` empty | family-no-players-1440 | family-no-players-390 | |
| `/family/players/new` | family-player-new-1440 | family-player-new-390 | |
| `/family/players/edit?player=player-maya` | family-player-edit-1440 | family-player-edit-390 | |
| `/family/report?player=player-maya` | family-report-1440 | family-report-390 | CSV control present |
| `/coach` | coach-1440 | coach-390 | Roster paints (was opacity 0) |
| `/coach` no program | coach-no-program-1440 | coach-no-program-390 | |
| `/coach/player?id=player-maya` | coach-player-1440 | coach-player-390 | |
| `/coach/attendance` | coach-attendance-1440 | coach-attendance-390 | |
| `/coach/class` | coach-class-1440 | coach-class-390 | |
| class mode on `/journey` | class-mode-journey-1440 | class-mode-journey-390 | Persistent bar |
| `/coach/export` | coach-export-1440 | coach-export-390 | |
| `/coach/goal` | coach-goal-1440 | coach-goal-390 | |
| `/admin/roles` | admin-roles-1440 | admin-roles-390 | Demo family as admin |

---

## Media, Batizado, Home contact

- [x] Photos and videos come from `src/data/media.js` (`wix()`, `yt()`, `video()`). Pages do not invent Media Manager filenames.
- [x] SoChlo credit: `YouTube.astro` wraps every embed; Home hero + lite YouTube; Footer; lesson file-video path still prints the line when there is no YouTube.
- [x] Batizado copy is verbatim from `src/data/batizado.js` (`INTRO` + six `MOMENTS`) on `/graduation/what-is-batizado`, `/batizado`, and the `what-is-batizado` lesson body.
- [x] Home shows `{CONTACT.ageLine}` (“Classes for 7–13 years of age”), phone, and email.

---

## Progress numbers from the snapshot

- [x] HUD, `/journey`, and `/me` bind `xp`, `level.*`, `lessonsDone`, `lessonsTotal`, `stars`, `streak.weeks`, `patches.length`, `readiness.percent` via `data-bind`. Grep of `src/pages` found no hard-coded Maya XP (295) or level titles as live values — the `1` / `0` / `Iniciante` in markup are placeholders until `bindDom()`.
- [x] Smoke: Maya `xp1: 295` → `xp2: 570`, `level: 4` after remaining Music lessons.

---

## Demo flow (`test/e2e/demo-smoke.mjs`)

- [x] Sign in (demo) → `/who`
- [x] Outbox replay: queue `lesson.video.done` for Leo, open Tubarão, ledger has `qa-outbox-replay` and outbox is empty
- [x] Add player Nico / Sabiá (Bushwick invite)
- [x] Video (Ginga Basics), reading, drill, remaining Music (video / reading / drill / quiz)
- [x] Module cleared copy after Music quiz
- [x] Level ≥ 4
- [x] Desafio do Dia
- [x] `/me`
- [x] Report card CSV (`physical-chess-gatinha.csv`)
- [x] Coach overview (roster opacity ≠ 0)
- [x] Class mode → journey bar → end
- [x] Coach export CSV
- [x] Prints **SMOKE OK**

---

## Empty and edge states

- [x] Brand-new player: Leo / Tubarão map (`journey-new-player-*`) — 0 XP, Culture and Graduation locked
- [x] All later modules locked: `/learn/culture` and `/learn/graduation` show “Finish Music…” / gate copy
- [x] Coach with no program: “No program is assigned to this login yet…”
- [x] Guardian with no players: Who + Family empty copy
- [x] Outbox replay: covered in smoke (queued while “offline”, applied on next player load)

---

## Keyboard, focus, live regions, read-aloud, reduced motion

- [x] Skip-to-content is the first focusable (`href="#main"`). `#main` is stamped on `<main>` in `nav.js`.
- [x] Visible focus: `:focus-visible` lime on Quest controls and player cards (WP7 theme append).
- [x] Avatar radios have `aria-label`. More menu keyboard cycle includes Close.
- [x] `aria-live="polite"` on toasts, form ok/error, empty notes, check feedback, quiz feedback, drill clock, patch unlock, avatar status.
- [x] Read-aloud: `ReadAloud.astro` + `speech.js` on readings and checks (“Listen to this” / “Listen to the question”); glossary speaks `pt-BR`.
- [x] Reduced motion: smoke reloads `/journey` with `prefers-reduced-motion: reduce` and asserts every `[data-quest-enter]` is already `true` (no hidden nodes). `motion.js` / `rewards.js` skip transforms and confetti.

---

## Console, build, tests

- [x] Shots: `pageerrors: 0`. Smoke: `errors: []` after ignoring Chromium’s `compute-pressure` permissions-policy line (not app code).
- [x] `npm run build` — pass
- [x] `npm test` — 20/20
- [x] `npm run content:check` — 24 lessons, 12 glossary words, 15 Bira moments
- [x] `node test/e2e/demo-smoke.mjs` — SMOKE OK

---

## Lighthouse (performance ≥ 85)

| Page | Form | Performance | Accessibility | Artifact |
|---|---|---|---|---|
| `/` | desktop | **94** | **100** | `screenshots/final/lh-home-desktop.json` |
| `/` | mobile (simulated) | **85** | **100** | `screenshots/final/lh-home-mobile.json` |
| `/journey` | desktop (demo Maya) | **90** | **96** | `screenshots/final/lh-journey-desktop.json` |

Home LCP is the Wix `heroRoda` poster. Journey a11y remainder is not a blocker (score 96).

---

## Copy pass

- [x] Kid-safe tone; no “click here” / “tap here” in `src/` (drill confirm no longer says tap-here).
- [x] No exclamation storms in `src/content`. Batizado verbatim still has the client’s own “Energy through the roof!”
- [x] Portuguese bold on first use in WP1 readings; public `site.js` uses the WP5 export shape with WP1 wording folded in. Almost all new copy remains `reviewNeeded: true`.
- [x] Fonts: Nunito + Lilita One only.

---

## Not bugs (left for live / ACE)

- Wix OAuth, `pc_session`, CMS, `/api/*` with a client secret
- Shop/contact inserts on the static smoke server (no API in `dist/client`)
- Educator portraits for Coco and Pastor
- Batizado 2026 date TBC
- Six dedicated teaching videos (compilations fill the slots)
- Privacy legal sign-off
