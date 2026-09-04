# WP1 — Content

**Owns:** `src/content/lessons.js`, `src/content/glossary.js`, `src/content/bira.js`, new files under `src/content/copy/` and `src/content/site.js`.
**May edit (append only):** nothing else. Do not touch pages or CSS.

## Goal
Every lesson in SPEC §5.5 exists in `src/content/lessons.js` with real, kid-safe copy (ages 7–13), using the schema at the top of that file. Public-site copy for WP5 lives in `src/content/site.js`.

## Deliverables
1. **Lessons.** Keep the 16 existing ids stable. Add the missing ones so the modules match §5.5:
   - Movements: `bencao-armada` (video, `aceCompilation`), `ginga-workout-10` (drill with timer, 600 s, metronome 72, group `virtual-training`), `kick-combo` (drill, 180 s, `virtual-training`), `roda-etiquette` (reading + check, group `jogos`).
   - Music: `agogo-reco-reco` (reading + check, group `instruments`). Extend `music-quiz` to 5 questions (keep q1–q3 exactly as they are; add q4 about the pandeiro, q5 about "call and response").
   - Culture: `culture-quiz` (quiz, 5 questions, group `boss`). Expand `portuguese-for-the-roda` body (it uses `glossary: true` to render the glossary; write a 3-paragraph intro). Add `maculele` to the manifestations reading.
   - Graduation: `roda-ready-check` (quiz, 3 questions drawn from all modules, group `ready`).
   - Every drill has 4–7 steps; steps may reference `photoKey`s from `src/data/media.js` (read the keys there; class photos `classPhoto2022a…`, `kidsWorkshopDay2`, `heroWorkshop` are good for movement steps).
   - Every reading has a `check` (one question, three choices). Body is markdown with `**bold**` for Portuguese words on first use and blank-line paragraphs. 120–220 words for 7–13 year olds; short sentences.
   - `reviewNeeded: true` on everything you write. Verbatim Batizado copy (already in `what-is-batizado`) stays `reviewNeeded: false`.
2. **Glossary**: keep 12 words; add a `example` sentence to each (English, one line).
3. **Mestre Bira lines**: 3–5 lines per moment in `bira.js`; add moments `desafio`, `readingCheckWrong`, `quizPerfect`, `classMode`.
4. **Site copy** (`src/content/site.js`): exported objects for WP5's public pages: `ABOUT` (mission 2 paragraphs), `THE_ACE`, `ABADA` (Mestre Camisa, founded 1988 in Rio, one of the largest capoeira organizations; keep it factual and short), `EDUCATORS` (array: name, title, portraitKey from media.js `mestrePernilongo`, `mestraMarciaBerimbau`, `mestraEdnaLima`, `mestreCobra`, `mestrandaYara`; bios 1–2 sentences, `reviewNeeded: true`; do NOT invent facts beyond title + "teaches with ACE in Brooklyn"), `FAQ` (8 Q&As a parent would ask: ages, what to wear, uniform, Batizado, cost → "contact ACE", safety, missed classes, how the app works), `CORDAS_PAGE` (explains the kids' ladder from `src/data/batizado.js` CORDAS), `SHOP` (uniform top: sizes YS/YM/YL/AS/AM/AL, fields per the Wix "Uniform Tops" form: parent name, child name + shirt/pant size, email, school program, contact number; price "ask ACE").
5. A `node` script `scripts/content-check.mjs` that fails if any lesson is missing required fields for its type, any `photoKey`/`videoKey` is not in `media.js`, or any module has fewer than 3 lessons. Wire it as `npm run content:check`.

## Done when
`npm run content:check`, `npm run build`, `npm test` pass. Every module has its §5.5 lessons. Report in `agents/reports/WP1.md` listing every lesson id and what still needs client review.
