# WP1 report — Content

2026-09-03. Working tree `pc-wp1`, branch `wp1`.

## What I built

Curriculum and public-site copy only. No pages, no CSS, no new npm dependencies.

- **24 lessons** in `src/content/lessons.js` (16 stable ids kept). Reading bodies live in `src/content/copy/*.js` so Node tests and the Astro player can import the same markdown strings. `what-is-batizado` is assembled from `src/data/batizado.js` (`INTRO` + all six `MOMENTS`) so ceremony copy is not forked.
- **Glossary**: still 12 words; each has an English `example` sentence.
- **Mestre Bira**: 3–5 lines per existing moment, plus `desafio`, `readingCheckWrong`, `quizPerfect`, `classMode`.
- **Public copy** in `src/content/site.js` for WP5: `ABOUT`, `THE_ACE`, `ABADA`, `EDUCATORS`, `FAQ` (8), `CORDAS_PAGE` (ladder from `CORDAS`), `SHOP` (uniform top, sizes YS–AL, Wix-form fields, price `"ask ACE"`).
- **`npm run content:check`** (`scripts/content-check.mjs`): required fields by type, media keys vs `media.js`, ≥3 lessons per module, glossary/Bira/site shape, §5.5 ids, music-quiz q1–q3 frozen.

Verified: `npm run content:check`, `npm test`, `npm run build` pass. `node test/e2e/demo-smoke.mjs http://localhost:4401` printed `SMOKE OK`. Screenshots of every lesson plus the Movements/Music hubs at 1440 and 390 are in `screenshots/wp1/` (52 files).

## Lesson inventory

| id | module | group | type | reviewNeeded |
|---|---|---|---|---|
| `ginga-basics` | movements | capoeira-abada | video | true |
| `meia-lua-de-frente` | movements | capoeira-abada | video | true |
| `esquiva-cocorinha` | movements | capoeira-abada | drill | true |
| `au` | movements | capoeira-abada | video | true |
| `bencao-armada` | movements | capoeira-abada | video (`aceCompilation`) | true |
| `ginga-workout-10` | movements | virtual-training | drill (600 s, 72 bpm) | true |
| `kick-combo` | movements | virtual-training | drill (180 s) | true |
| `jogos-first-game` | movements | jogos | video | true |
| `roda-etiquette` | movements | jogos | reading + check | true |
| `meet-the-berimbau` | music | instruments | reading + check | true |
| `pandeiro-atabaque` | music | instruments | video | true |
| `agogo-reco-reco` | music | instruments | reading + check | true |
| `sing-the-roda` | music | songs | drill (title now *Sing the Roda: Paranauê*) | true |
| `music-quiz` | music | boss | quiz (q1–q3 unchanged; q4 pandeiro; q5 call-and-response) | true |
| `portuguese-for-the-roda` | culture | portuguese | reading + check, `glossary: true` | true |
| `abada-capoeira` | culture | abada | video | true |
| `folklore-manifestations` | culture | manifestations | reading + check (title *Manifestations*; maculelê added). Extra `photoKeys`: sambaDeRoda, jongoDrum, puxadaDeRede | true |
| `folklore` | culture | folklore | reading + check (**new**; §5.5 lists Folklore separately from Manifestations) | true |
| `history-maps` | culture | history | reading + check. Extra `photoKeys`: mapAfrica, mapSlaveTrade, mapBrazil | true |
| `culture-quiz` | culture | boss | quiz, 5 questions | true |
| `what-is-batizado` | graduation | batizado | reading + check (verbatim six moments) | **false** |
| `cordas` | graduation | cordas | reading + check | true |
| `batizado-2026` | graduation | batizado | video | true |
| `roda-ready-check` | graduation | ready | quiz, 3 questions from movements / music / graduation | true |

Readings (except verbatim Batizado) are 120–220 words, second person, short sentences, Portuguese **bold** on first use.

Video summaries say the clips are class energy, not step-by-step teaching (SPEC §5.5 video honesty).

## What still needs client review

Everything with `reviewNeeded: true`: all new/expanded lesson copy, glossary examples, Bira lines, and all of `site.js`.

SPEC §10 items this package could not close:

- Member-page verbatim copy (Movements, Music, Culture, About, Educators, FAQ, Cordas) — login wall; drafts are ours.
- Educator bios beyond title + “teaches with ACE in Brooklyn.” **Coco** and **Pastor** are in SPEC §5.1 but WP1 only listed five `portraitKey`s, so they are not in `EDUCATORS`. Add them when ACE supplies a portrait key and a real bio.
- Kids’ corda ladder top (Crua → Laranja assumed; older kids TBD).
- Shop prices (copy says ask ACE).
- Batizado 2026 date still TBC in `batizado.js`.
- Six short teaching videos still not shot; existing YouTube compilations fill the slots.

No dedicated Wix photo for maculelê or reco-reco. Manifestations uses samba/jongo/puxada photos; agogô-reco-reco uses `puxadaDeRede` (same key the instrument card already uses for agogô).

## Shared-file edits (unavoidable)

WP1 said “do not touch pages or CSS.” These were required so `npm test` / smoke still pass after adding a music lesson and two quiz questions:

- `package.json` — added `content:check` script only.
- `test/game.test.mjs` — music-clear test now completes `agogo-reco-reco` as well (module clear = every lesson in the module).
- `test/e2e/demo-smoke.mjs` — answers music-quiz q4 and q5 so `quiz:done` still fires.

Did not touch `tokens.css`, `theme.css`, pages, repo, store, or game engine.

## What the next agent must know

- **WP2 (lesson player):** `glossary: true` is set on Portuguese but the current player does not render the glossary list (intro copy tells the kid to tap speakers). Drill `steps[].photoKey` and reading `photoKeys[]` are in the data; the skeleton player only shows `photoKey` on readings and step **text** on drills. Wire those, plus metronome for `metronomeBpm`.
- **WP5:** import `src/content/site.js`. Educators array is five people. FAQ answers cost with ACE phone/email from `CONTACT`. Shop `fields` / `sizes` / `programs` are ready to bind.
- **WP3:** Bira moments `desafio`, `readingCheckWrong`, `quizPerfect`, `classMode` exist; pick with `biraLine(moment)`.
- Music must be fully cleared (5 lessons, including `agogo-reco-reco`) before Culture unlocks. Graduation still unlocks after Culture.
- `folklore-manifestations` id is stable; only the title changed to Manifestations.
