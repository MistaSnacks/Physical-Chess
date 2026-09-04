# WP2 — Lesson engine

## Built
- Module hubs at `/learn/[module]` (`getStaticPaths` over `MODULES`). Rail grouped by `module.groups`, live snapshot state (done + stars, current, open, locked), progress ring, Next-up CTA, module photo. Music ports the instrument field guide and glossary teaser. Culture shows maps, manifestations, and animal photos from `media.js`. Graduation shows the gate (locked / closed / glow when `readiness.ready`). Locked modules keep `lockedReason` and do not open lessons (click toasts; deep links bounce to `?locked=1`).
- Replaced showcase `learn/movements.astro` and `learn/music.astro`. Redirects `/movements` → `/learn/movements` and `/music` → `/learn/music` still work.
- Lesson player `/learn/:module/:lesson` for all four types, using `LessonFrame`, `Reading`, `Check`, `ReadAloud`, `DrillTimer`, and an extended `Quiz`.
  - Video: “I watched it” stays disabled for 60s (countdown ring) or until the YouTube iframe reports ended; HTML5 `wixVideoKey` supported if WP1 adds it.
  - Reading: sentence highlight + Listen; glossary words speak `pt-BR` and `glossary.mastered` after “I can say it”; check shakes on wrong, lime pulse on right, first-try = 2 stars.
  - Drill: big timer, pause/resume, step cadence, metronome off by default, 1–3 self-rating, then a one-tap “Ask a grown-up…” `practice.confirmed`.
  - Quiz: `photoKey` above the prompt, 3 hearts, 0 hearts = restart with no XP (answers buffered until a finish), per-question `quiz.answered`, then `quiz.done` with stars.
- Completion panel: stars fill, XP delta (quiz includes answer XP), patch note, module-cleared treatment, Next from `snapshot.nextUp`, focus + `aria-live` toast.
- Mobile 390: rails become a horizontal chip strip; current chip scrolls into view. No horizontal page scroll at 390 or 1440.
- `src/lib/speech.js` + stop on `astro:before-swap` / `pagehide`.
- Smoke test waits out the 60s watch gate (Playwright clock) and clicks the visible quiz question.

## Left out
- Official YouTube IFrame API script (postMessage + 60s timer instead; no extra third-party script in smoke).
- Quiz types not in the schema (order-the-steps, image choices). `photoKey` is wired for when WP1 adds it.
- WP3 reward overlays (LevelUp / PatchUnlock). This package toasts the patch title only.
- Full guardian “I saw it” report-card flow (WP4). The drill confirm is the lite version.

## Shared-file edits
- `src/directions/quest/theme.css` — appended `/* === WP2: lesson engine === */` only. `tokens.css` untouched.
- `src/components/Quiz.astro` — WP2-owned; hearts, photo, restart.
- `src/lib/actions.js` — `recordEvent` now `await`s `flushOutbox()`, and flush no longer drops events queued during an in-flight write. Needed so a quiz’s three `quiz.answered` + `quiz.done` all persist before navigation. Backwards compatible.
- `test/e2e/demo-smoke.mjs` — 60s watch gate + scoped quiz clicks.
- Did not edit content files, `tokens.css`, `journey.astro`, or `motion.js`. `src/data/curriculum.js` remains for the map (WP3).

## Next agent
- Hubs live at `/learn/movements|music|culture|graduation`. Map `PAGE_FOR_MODULE` in `journey.astro` already points at `/learn/movements` and `/learn/music`; culture still links to `/learn/music` until WP3 rebinds the map to `/learn/<module>`.
- New lessons from WP1 render as long as they keep the schema in `src/content/lessons.js` (`videoKey`/`wixVideoKey`, `body`+`check`, `drill`, `quiz`, `glossary`).
- Static verify: `dist/client` on port **4402**. `npm run build`, `npm test`, `node test/e2e/demo-smoke.mjs http://localhost:4402` → `SMOKE OK`. Screenshots in `screenshots/wp2/`.
