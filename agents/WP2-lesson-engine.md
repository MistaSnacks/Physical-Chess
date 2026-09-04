# WP2 — Lesson engine

**Owns:** `src/pages/learn/[module]/[lesson].astro`, new `src/pages/learn/[module]/index.astro` (replaces the two showcase pages `src/pages/learn/movements.astro` and `src/pages/learn/music.astro`, which you delete), new components in `src/components/quest/` (`LessonFrame.astro`, `DrillTimer.astro`, `Reading.astro`, `Check.astro`, `ReadAloud.astro`), `src/components/Quiz.astro` (extend, keep its events), `src/lib/speech.js`.
**May edit (append):** `src/directions/quest/theme.css` under `/* === WP2: lesson engine === */`.

## Goal
One lesson player that makes all four lesson types feel finished, plus a module hub page per module, all bound to the live snapshot.

## Deliverables
1. **Module hub** `/learn/[module]` (`getStaticPaths` over `MODULES`): level rail grouped by `module.groups`, each lesson row shows state from the snapshot (done + stars, current, open, locked), the module's photo, progress ring, "Next up" CTA, and for `music` the instrument field guide + glossary teaser (port from the showcase `learn/music.astro`), for `culture` the maps and manifestation photos (`mapAfrica`, `mapBrazil`, `mapSlaveTrade`, `sambaDeRoda`, `jongoDrum`, `puxadaDeRede`, animals), for `graduation` the gate state (locked / glowing when `readiness.ready`). Locked modules show the `lockedReason` and no lesson links. Redirect targets `/learn/movements`, `/learn/music` must keep working.
2. **Lesson player** on top of the WP0 skeleton:
   - Rail paints done/current/locked from the snapshot; locked lessons (module locked) show a padlock and cannot be opened (redirect to the hub with a toast).
   - **Video**: "I watched it" is disabled until 60 s have passed or the YouTube iframe reports ended (use the IFrame API via `enablejsapi=1` if practical; otherwise the timer), with a visible countdown ring.
   - **Reading**: `ReadAloud` button on the body and on the check (Web Speech API, `src/lib/speech.js`: `speak(text, {lang})`, highlights the sentence being read, stops on navigation; pt-BR voice for glossary words when `glossary: true` renders the 12 words with speaker buttons; mark `glossary.mastered` events when a kid taps a word's "I can say it" after hearing it). Check: wrong answer shakes, right answer confetti-lite (lime pulse), first-try = 2 stars.
   - **Drill**: `DrillTimer` with big countdown, optional metronome tick (WebAudio oscillator at `metronomeBpm`, mute toggle, off by default), step list that highlights the current step on a per-step cadence, pause/resume, then the 3-button self rating. Log a `practice` affordance: after rating, show "Ask a grown-up to tap here if they watched" → `practice.confirmed` event (guardian confirmation lite; WP4 owns the full flow, keep it minimal).
   - **Quiz**: extend `Quiz.astro` to support `photoKey` on a question (image above the prompt), hearts (3; a wrong answer loses one; 0 hearts = "try again" restart without XP), per-question `quiz.answered` events (already wired), completion with the score and stars.
   - Completion panel: stars earned (animated fill), XP delta, patch toast if `game:patch` fired, "Next: …" or "Back to the map"; if `game:module-cleared` fired, a bigger "Module cleared!" moment.
   - Keyboard and screen-reader friendly: buttons are buttons, `aria-live` on feedback, focus management to the completion panel.
3. **Mobile 390**: rail collapses to a horizontal chip strip above the stage.
4. Update `test/e2e/demo-smoke.mjs` if selectors change; it must still print `SMOKE OK`.

## Done when
All lesson types complete in demo, refresh keeps state, hub pages reflect state, reduced-motion OK, 390 OK, screenshots in `screenshots/wp2/`, report in `agents/reports/WP2.md`.
