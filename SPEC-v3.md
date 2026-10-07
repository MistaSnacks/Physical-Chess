# Physical Chess: Spec v3 · client notes of 2026-09-30

Owner: Camren (SoChlo Productions) for ACE / Abadá Capoeira Brooklyn. Written 2026-10-01. Status: **draft for Camren's review** before any build agent starts.

This spec **amends `SPEC.md` (v2)**. Everything in v2 still holds unless a section here replaces it. Where they conflict, v3 wins.

It turns the client's notes (`~/Downloads/New PhysicalChess Notes.pdf`) into build work, numbered after WP1-WP7: WP8 to WP16.

- **Source plan:** `~/Physical Chess/PC Notes OPUS v3.md`. Two blind reviewers scored it 9/10 on every dimension. It holds the reasoning and every code citation; this spec holds the requirements.
- **Client-facing explainer** of progression and logins: https://claude.ai/artifact/GNDXkqFNaydtz3weqL8E1S

All paths are relative to this repo. Line numbers refer to commit `83cd292`.

---

## 0. What changes, at a glance

| WP | What | Client note | Can start | Size |
|---|---|---|---|---|
| WP8 | Scoring integrity: first-time XP, streak rule, sticky module clears | Prerequisite (SPEC §3.1 bug) | Now | S |
| WP9 | Instructor library | Note 1 (top priority) | Now | M-L |
| WP10 | Copy, credits, classes page, Field guide links | Notes 2, 5, 11; Q1 | Now | S-M |
| WP11 | Quiz formats | Note 8 | Now (screens after D6) | M |
| WP12 | Cores and reward designs | Notes 3, 7 | After D1 (redemption after D4) | M |
| WP13 | Mestre registry and pop-ups | Note 4 | Registry now; swap after D5 | M |
| WP14 | Logo badge, journey collage, media intake | Notes 6, 9, 10 | Placeholders now; final with assets | M-L |
| WP15 | Trusted access (12 items) | Q2; release gate | Code now; exit tests after D13 | M |
| WP16 | Real-mode acceptance and release | All | After D13 and WP15 | M |

**Order:**

1. Day one: send the client message (§9), with the OAuth request first.
2. Then WP8, then WP9.
3. Then WP10, WP11 (schema only), the WP13 registry, the inert WP12 file, WP14 placeholders and WP15's code fixes, in parallel.
4. Then WP12 after D1, the WP13 swap after D5, and the WP14 finals.
5. Then WP16 after D13.

**Rules from earlier merges:**

- Each WP's CSS goes in its own file; `theme.css` broke when branches appended to it.
- Each WP reports the files changed, the evidence, open decisions, and whether tests ran in demo or real mode.

---

## 1. Decisions and defaults

Every decision has a default, so building never waits. Items in the "Must wait" column ship only once ACE answers.

| # | Decision | Default | Must wait |
|---|---|---|---|
| D1 | What are the nine Cores: the levels kids see, the rope ladder, or a separate track? Does the top bar keep the corda? May a child reach Diamante? | **Option A:** the Cores replace the 12 level *displays* as practice colors. Every corda display stays (SPEC decision 6). Diamante is reachable. | Showing Cores, unlocking designs (WP12) |
| D2 | Spellings | ABADÁ's: Ouro, Ametista, Camaleão, Canguru, Cascão, Piriquito Verde | Showing the names to real families |
| D3 | Ages 7-13 or 7-14; class facts | **Decided 2026-10-07: 7-14**, as the client's note says (changed in all six places). The age line links to `/classes`. | Real schedule and prices |
| D4 | How many designs? Redeemable? Public or gated? | Nine public printables, show-and-tell | Gated route, stamping, redemption |
| D5 | Does "Mestres pop up" mean the Bira mascot? Titles (Bode, Cascão, Tigre; Camisa Roxa as Grão-Mestre); Cigarra's display name; does Yara stay? | Yes, the mascot. The client's titles. Educators stay a separate list. | Swapping Bira on screen |
| D6 | New quiz formats, or reworded questions? The 4th bullet? May typed answers ignore accents? | New formats; suggest "Listen and identify"; accents fold only where ACE approves, per question | Matching and blank screens on live lessons |
| D7 | Should Rhythm find be a tracked activity? | Yes, as D6's Listen-and-identify | The Rhythm find activity |
| D8 | Does the "Roda Quest" name go? Do "Roda weeks" and "Roda Ready" rename? | Only the hero H1 changes | Every other "Roda Quest" label |
| D9 | Video credits | `acb2024` becomes TV-ABADÁ as asked; the footer goes neutral. **Camren** checks internally whether `acb2024` is TV-ABADÁ footage: YouTube lists SoChlo Productions LLC as the uploader. | Any other credit |
| D10 | Which cords do ACE kids wear? (v2 §10 Q4) | `CORDAS` untouched | Editing `CORDAS` or the award list |
| D11 | Who is an instructor? Is anything staff-only? Which Wix member pages go in the library? | Library v1 ungated at an unlisted URL | Library v2 (staff-only material) |
| D12 | Coach session length | 24 h (SPEC §2.1.1, the coded `COACH_MAX_AGE`); 8 h on class tablets (SPEC §2.4); families keep 180 days | Other lengths |
| D13 | **The site owner creates the Wix OAuth app and client secret** (v2 §2.1, §10 Q1) | Demo mode | Real logins, live tests, release |

---

## 2. Constraints that shape everything

- **Static site.** `astro.config.mjs` builds `output: 'static'`, so every lesson page is public HTML. `requireSession()` is a browser redirect, not access control. Only `/api/*` routes (`prerender = false`) can enforce anything.
- **The engine is pure.** `src/lib/game/*` derives everything from the event list (v2 §3.1). Keep it that way: new rules go into pure helpers with `npm test` cases.
- **Optimistic writes.** `recordEvent` updates the screen before the outbox flushes (`src/lib/actions.js:82-85`, v2 §3.2). Anything that must not unlock early checks events that have reached the server.
- **No new vendors.**
  - Video stays on YouTube through `YouTube.astro`.
  - Photos and audio go to Wix Media through the existing `wix()` helper (`src/data/media.js:372`).
  - Content stays in the repo.
- **Demo mode** (`PUBLIC_DEMO=1`, or no client ID) must keep working end to end, including `test/e2e/demo-smoke.mjs`.
- **Gates:** `npm test`, `npm run content:check`, `npm run build` and `node test/e2e/demo-smoke.mjs` pass at the end of every WP. The smoke test writes screenshots, so point it at a scratch folder.

---

## 3. Work packages

### WP8 · Scoring integrity (S, start now)

**Why.** Today a replay pays XP again, which breaks v2 §3.1 ("Re-doing a lesson never re-awards XP"):

- `makeEvent` sets XP from the event type alone (`src/lib/game/events.js:79`).
- A finished lesson's Complete button re-enables at once (`src/pages/learn/[module]/[lesson].astro:218`).
- `derivePlayer` adds up every event (`src/lib/game/derive.js:28`).

So 200 video replays earn 4,000 XP. Stored XP is also read by the turma totals (`src/lib/coach.js:53-59`), the fly-in (`actions.js:87`), the streak checks (`src/lib/game/streaks.js:49,74`, `actions.js:77`) and the server (`src/lib/server/wix-data.js:187`).

**Requirements**

- **R8.1** Add a pure `allowedXp(event, ledger)` in `src/lib/game/xp-rules.js` (new). `recordEvent` (`actions.js:68`) stores its result as the event's `xp`, right after `makeEvent`. The rules:
  - `lesson.video.done`, `lesson.reading.done`, `lesson.drill.done`: XP only if no earlier event of that type for that `lessonId` had XP above zero.
  - `quiz.answered`: 10 only for the first correct answer to that `lessonId` and `questionId`.
  - `quiz.done`: the +25 perfect bonus at most once per lesson.
  - `desafio.done`: XP at most once per New York date.
  - `practice.confirmed`: XP at most once per lesson. Confirmations still count toward patches and readiness as today.
  - Repeats still record events, so stars, attempts and practice counts update.
- **R8.2** `derivePlayer` stays a plain sum. Build the demo seeds through `allowedXp` too (`src/lib/repo/demoSeed.js`, `src/lib/repo/coachDemo.js:76-82`). Real ledgers are empty; check that when D13 lands.
- **R8.3** A streak week counts if it has any **learner event**: lesson done, quiz answer, quiz done, Desafio, practice confirmation or glossary mastered.
  - Add `LEARNER_EVENTS` to `events.js`.
  - Use it in `weekStreak`, `startsNewStreakWeek` (`streaks.js:49,74`) and the `recordEvent` gate (`actions.js:77`), instead of `xp > 0`.
- **R8.4** **Sticky module clears.** Today a module is cleared only while every one of its *current* lessons is done (`derive.js:61`), and locks follow from that (`:66-70`). So once a `module.cleared` event exists in the ledger, the module stays cleared for locks, patches and readiness. This must land before any new lesson ships (WP11 pilot, WP14 media).
- **R8.5** Delete the dead quiz animation in `src/directions/quest/motion.js` (the hard-coded +50 counter and chip, about `:178-240`). It targets `[data-quest-xp-total]` and `[data-quest-xp-target]`, which no page renders.

**Acceptance**

- `test/game.test.mjs` covers:
  - a replayed video, reading, drill or quiz adds 0 XP
  - wrong-then-correct earns the 10 once
  - imperfect-then-perfect earns the +25 once
  - a second Desafio on one date adds 0 XP
  - a second practice confirmation of one lesson adds 0 XP but still counts
  - a week of only drill repeats keeps the streak
  - adding a lesson to a cleared module re-locks nothing and removes no patch
- **Smoke:** replay `/learn/music/music-quiz` after a perfect run; `[data-earned]` reads "Stars only go up." and no `.quest-xp-chip` appears.
- Turma weekly XP doesn't change on a replay.
- The smoke test's Maya ends about 560 XP (570 today) and still passes `level >= 4` (`demo-smoke.mjs:235`).

### WP9 · Instructor library (M-L, start now)

**Goal.** An instructor can pull up any lesson, video, word or page in class, with no child selected (client note 1). "Similar to what we have already" means the physicalchess.org member pages; the app's module groups mirror that menu (`src/content/modules.js` header).

**Requirements**

- **R9.1 Routes.** Add `src/pages/coach/library/index.astro` and `src/pages/coach/library/[type]/[slug].astro`. Link them from `CoachNav.astro` (add `'library'` to its `active` union). Don't link them from public pages or `public/sitemap.xml`.
- **R9.2 Catalog** (`src/lib/library.js`, new), about 62 entries:
  - the 24 lessons, 12 glossary words and four `INSTRUMENTS`
  - all 10 `YOUTUBE` entries, plus `videoProject1`
  - link entries for `/about/*`, `/graduation/*` and `/batizado`
  - Not the other 11 `WIX_VIDEOS` clips: none is shown anywhere today, and six are "Kids clip 2018". They wait for D11.
  - IDs are type-prefixed (`lesson:au`, `glossary:au`, `instrument:berimbau`, `yt:acb2024`), because slugs collide.
  - Entries point at the source records; nothing is copied.
  - Keep `reviewNeeded`; showing it as a "draft" badge is optional.
  - Define `INSTRUMENT_LESSON` in `src/content/index.js`: berimbau → `meet-the-berimbau`, pandeiro and atabaque → `pandeiro-atabaque`, agogo → `agogo-reco-reco`. WP10 reuses it.
- **R9.3 Browse and search.**
  - Browse by module and group.
  - Search titles, glossary words and instrument names only, ignoring case and accents.
  - Rank exact-word matches first, then word-prefix, then substring.
  - No search library is needed.
- **R9.4 Entry pages by type:**
  - **Video:** `YouTube.astro`, or a `<video controls>` for `videoProject1`.
  - **Reading:** `Reading.astro` with `glossary={false}`, plus its check question with the answer marked.
  - **Drill:** the step list, without the timer or self-rating.
  - **Quiz:** the questions with answers marked, *not* `Quiz.astro`.
  - **Glossary:** `word`, `say` (with the speak button), `meaning` and `example`.
  - **Instrument:** photo, blurb, and a link via `INSTRUMENT_LESSON`.
  - **Page link:** opens the page.
- **R9.5 No progress side effects.**
  - Library pages never call `recordEvent`.
  - Give `loadSession()` (`actions.js:33-43`) a `select` option (default `true`).
  - Add a `staff` prop to `src/layouts/Base.astro` that sets `data-staff` on `<body>` and adds `<meta name="robots" content="noindex">`.
  - On staff pages, `src/lib/nav.js` (`:80-84`) calls `loadSession({ select: false })`.
  - The library doesn't clear the active player: `clearActivePlayer` would deselect the child on a Class-mode tablet.
- **R9.6 Access.** v1 is ungated (D11), because the content is already public. A browser role check would add nothing and would block instructors until D13. Staff-only material (v2) needs a server route with a real role check.
- **R9.7 Optional** (suggestions, not requested): show mode (fullscreen, big text), loop and 0.5x speed. For speed, add `enablejsapi=1` at runtime as the lesson page does (`[lesson].astro:177-184`), then `setPlaybackRate`.

**Acceptance**

- With no child selected, on a phone, "gin" returns exactly Ginga Basics, the 10-minute Ginga workout and the Ginga glossary word, each two taps away.
- "au" ranks the Aú lesson and the Aú glossary word first.
- Every video shown anywhere in the app is reachable.
- Opening ten entries leaves the ledger, XP, outbox and active player unchanged. Test this with a remembered child, arriving from `/coach` (a full page load) and from a lesson page (a router navigation).
- Every library page has `noindex`.
- It works in demo mode: "Switch to coach view" on `/family` (`src/pages/family/index.astro:76-80`).
- The Ginga entry is a class clip ("class energy, not a slow how-to", `src/content/lessons.js:34`). A real demonstration comes with WP14 media.

### WP10 · Copy, credits, classes page, Field guide links (S-M, start now)

**Requirements**

- **R10.1 Hero.**
  - Set the H1 at `src/pages/index.astro:85` to exactly "Welcome to ABADÁ Capoeira. Level up your Capoeira knowledge."
  - The eyebrow (`:84`), the page title (`:38`) and the other "Roda Quest" labels (`Footer.astro:46`, `batizado.astro:42`, `login.astro:34`, `Nav.astro:43`) wait for D8.
  - The meta description (`:39`) stays.
  - "Roda" stays wherever it's the capoeira word.
- **R10.2 Credits as data.**
  - Add `credit` to every `YOUTUBE` (`src/data/media.js:315`) and `WIX_VIDEOS` (`:236`) entry, plus a `credit(key)` helper. Keep `yt()` returning a plain id, because five callers depend on it.
  - Remove the "always credit SoChlo" comment (`media.js:312`).
  - `YouTube.astro` takes a `credit` prop in place of its hard-coded line (`:60`). Pass it from `journey.astro:129`, `[lesson].astro:66`, `batizado.astro:135` and `graduation/media.astro:92`.
  - `credit()` also feeds the home "Latest from the roda" card (`src/pages/index.astro:137`, `credit('acb2024')`), the hero (`:101`) and the lesson page's Wix-video credit (`[lesson].astro:73`).
- **R10.3 TV-ABADÁ credit.** Set `acb2024`'s credit to "Video: TV-ABADÁ Capoeira" (D9). In the same change, make the footer line (`Footer.astro:49`) "Video credits appear with each video". Every other credit stays until D9.
- **R10.4 Classes page.**
  - The age line (`CONTACT.ageLine`, `src/data/batizado.js:83`) becomes a link at `src/pages/index.astro:90`, `Footer.astro:54` and `src/pages/about/contact.astro:9`. It points to a new `/classes` page:
    - what a class is like
    - the programs from `src/content/programs.js`, marked "to be confirmed"
    - ages, schedule, cost and uniform, each "ask ACE" until known
    - how to join
    - an inquiry form posting to `/api/contact`
  - Never print invite codes.
  - Add `/classes` to `public/sitemap.xml`.
  - After D3, change the age in all six places together: `batizado.js:83`, `site.js:8,75` and `src/pages/index.astro:39`.
- **R10.5 Field guide links.** The four instrument cards (`src/pages/learn/[module]/index.astro:135-146`, plain `<article>` elements today) link to their lessons via `INSTRUMENT_LESSON`. Locks still apply, because the lesson page enforces them.

**Acceptance**

- The H1 reads exactly the client's sentence at 390px and 1440px.
- `acb2024` shows TV-ABADÁ on the home page and the Journey.
- The footer names no producer, and every other credit is unchanged.
- All three age lines open `/classes`.
- After D13, a test inquiry lands in Wix `contactForm`. Without the secret, the route returns a demo "ok" (`src/pages/api/contact.js:19`).
- Each Field guide card opens the right lesson, and a test checks each target exists.

### WP11 · Quiz formats (M; schema now, screens after D6)

**Requirements**

- **R11.1 Schema.** Questions gain `kind`: `multipleChoice` (the default when missing), `matching` or `fillBlank`.
  - Matching: `pairs`.
  - Fill in the blank: `accepted` answers, plus an optional per-question `foldAccents` flag (D6).
  - Optional `explain` text.
  - Existing questions keep working.
- **R11.2 Scoring** lives in a pure `src/lib/quiz.js` (new) with tests.
  - Answers are trimmed and compared case-insensitively. Accents are folded only when `foldAccents` is set.
  - A matching question is wrong if any pair is wrong at submit. A blank is wrong if it matches no accepted answer.
  - A wrong answer costs one heart and reveals the answer.
  - Each question emits one result, never XP per pair.
  - Stars stay as today (`events.js`).
- **R11.3 Content check** (`scripts/content-check.mjs`) learns the new kinds and rejects any question with no answer. Keep its existing pins:
  - 5 questions in the Music and Culture quizzes (`:155,165`)
  - Music q1-q3 word for word (`:160-162`)
  - 3 questions in Roda Ready (`:167`)
- **R11.4 Importer.** `scripts/quiz-import.mjs` (new) turns ACE's sheet into content. The sheet's columns: Cor, module, topic, kind, prompt, options or pairs, accepted answers, explanation. Rows without an answer are rejected.
- **R11.5 Screens (after D6).**
  - Matching: tap one side, then the other. It works by keyboard, and isn't drag-only.
  - Fill in the blank: a typed answer, or an optional word bank.
  - Pilot on the Culture quiz's last questions or a new lesson (which needs R8.4 first), never the pinned Music questions.
  - Until D6, the new kinds exist only in test fixtures, because `Quiz.astro` can't render them yet.
- **R11.6 Listen and identify** (if D6 and D7 approve): play a short audio clip and pick its name. It needs a small audio player component (WP14, R14.4).

**Acceptance**

- Legacy quizzes, reading checks (`Check.astro`) and the five Desafio kinds are unchanged.
- Scoring tests cover pairs, variants, accents, case and spacing.
- `content:check` accepts the new schema and rejects an unanswerable question.
- Reset and double submit don't duplicate credit.
- After D6, both screens work by touch and keyboard.

### WP12 · Cores and reward designs (M, after D1; redemption after D4)

**The nine Cores** are ABADÁ's names for its solid cord colors. Each start XP equals an existing level threshold (levels 4, 7 and 10 fold into the Core before them).

| Order | Cor | Cord color | Meaning (ACE approves the wording) | Start XP |
|---|---|---|---|---|
| 1 | Crua | Natural | A beginner | 0 |
| 2 | Ouro | Yellow | The value of what you will learn | 100 |
| 3 | Sol | Orange | Waking up to learning | 250 |
| 4 | Mar | Blue | How big the road ahead is | 700 |
| 5 | Floresta | Green | Learning becomes solid | 1,000 |
| 6 | Ametista | Purple | Carrying capoeira forward | 1,750 |
| 7 | Camaleão | Brown | The ABADÁ style of Mestre Camisa | 2,200 |
| 8 | Rubi | Red | Justice | 3,250 |
| 9 | Diamante | White | All colors in one | 3,850 |

**Requirements**

- **R12.1** `src/content/cores.js` (new, inert; it can land before D1) holds `order`, `title`, `color`, `meaning` and `xp`. A test checks every `xp` is a `LEVELS` threshold.
- **R12.2** `coreFor(xp)` (new) returns `level`, `title`, `xpInto`, `xpToNext`, `percent`, `isMax`, `nextTitle`, `color` and `meaning`. Add `core` to the snapshot in `derive.js`. `levelFor()` and the stored `level` stay unchanged.
- **R12.3 These displays switch from the level to the Core:**
  - the HUD caption, "to go" text and bar (`Hud.astro:28-32`), and the bar fill (`src/lib/map.js:178-181`, now `snapshot.core.percent`)
  - the level half of the Journey eyebrow (`journey.astro:48`), which becomes "Cor Sol · Corda Crua"
  - `/me` (`me.astro:27,70-73`)
  - the player card (`src/lib/player-card.js:28`)
  - the family report's Level and XP stats (`family/report.astro:89-90`)
  - the coach views (`coach/player.astro:91`, `coach/index.astro:88`)
- **R12.4 These displays don't change, because they show the instructor's corda** (SPEC decision 6):
  - the HUD corda chip (`Hud.astro:19-21`, `map.js:172`)
  - the corda half of the Journey eyebrow
  - the gate, "CORDA <next>" (`map.js:126-133`)
  - the `/me` corda history (`me.astro:112-116`)
  - the report's corda stat (`report.astro:93`)
  - the coach screens
  - `CORDAS`, `corda.awarded` and `lms-corda-awards`
- **R12.5 One overlay per Core.**
  - `recordEvent` emits `game:core-up` next to `game:level-up` (`actions.js:94`).
  - `rewards.js:316-319` listens to `game:core-up` instead. `game:level-up` can keep firing, but nothing listens to it.
  - The overlay shows the Cor's meaning and the design download.
- **R12.6 Copy.** Rewrite lines that say XP earns movement levels: `src/content/desafio.js:46`, `src/content/site.js:110,118`, the `levels.js` header comment and `src/content/copy/cordas.js`. Core copy says Cores are practice colors.
- **R12.7 Export.** Add a `core` column to the CSV (`coach.js:111-112,145-146`). Add `core` to `snapshotFields` (`coach.js:207-215`) and to the `lms-players` field list (`scripts/collections.mjs:15`).
- **R12.8 Thresholds may only move down.** A test compares them against the shipped values. New lessons make Cores easier to reach, and that's accepted.
- **R12.9 Smoke.** Change `demo-smoke.mjs:233-235` to read the HUD's `[data-bind="core.title"]` and assert "Sol". Maya has about 560 XP, and still about 600 on a streak day.
- **R12.10 Designs (default D4: public printables).**
  - **Unlock rule:** completing a Cor (reaching the next) unlocks its design, and reaching Diamante unlocks both Rubi's design and Diamante's own.
  - **Files:** under `public/rewards/`.
  - **Where they appear:** in the overlay, and on a "My designs" shelf on `/me`. Players already past a threshold see their earlier designs on the shelf, with no replayed overlays.
  - **Overlay layout:** restructure the panel, which today is one `<button>` (`LevelUp.astro:7`, `rewards.js:43`), so it can hold a link.
  - **Wait for the save:** enable the download only when the outbox is empty.
  - **Grown-up pages:** `family/report.astro:26` loads `motion.js`, which starts overlays (`motion.js:319`), so mark grown-up pages `data-grownup`. `rewards.js` skips Core-up overlays there, and the design appears on the shelf instead.
- **R12.11 Gated option (only if D4 asks).**
  - `src/pages/api/rewards/[playerId]/[cor].js` uses `caller()` (`src/lib/server/authz.js:10`). The player must belong to the caller's account, or the caller is a coach or admin with `canSeeProgram`.
  - The server recomputes XP from saved events with `xpFor` and `allowedXp`, ignoring stored `xp`.
  - Files move out of `public/` via the Vercel adapter's `includeFiles`. The button fetches with the token and saves a Blob. Demo mode serves watermarked samples.
  - Learner XP stays forgeable: backdated Desafio rows pass the daily rule. If designs are redeemable, the coach's "redeemed" tap is the real control. Check codes and stamping come only with this option.

**Acceptance**

- The nine Cores show in order, with D2 spellings (default ABADÁ), on every R12.3 display.
- Boundary tests pass at 99/100 through 3,849/3,850, and the bar's percent equals `core.percent`.
- Crossing 450 XP opens no overlay; crossing 700 XP opens exactly one.
- No XP display shows a movement-level name, and every R12.4 display is unchanged.
- An earned design downloads after logout and login, and a locked one isn't offered.
- The button stays disabled while the unlocking event is still in the outbox.
- The overlay appears on lesson pages and `/desafio`, and never on `/family/report`.
- Under R12.11, another family's request gets a 403.

### WP13 · Mestre registry and pop-ups (M; registry now, swap after D5)

**The 15 names, in order:** Mestre Bimba, Mestre Camisa Roxa, Mestre Camisa, Mestre Cobra, Mestre Morcego, Mestra Cigarra, Mestre Pernilongo, Mestre Paulinho Velho, Mestre Apache, Mestre Piriquito Verde, Mestre Cascão, Mestre Canguru, Mestre Bode, Mestre Tigre, Mestra Edna Lima.

Mestra Cigarra is Márcia Treidler, the "Mestra Marcia" already in the app (`mestraMarciaBerimbau`, `src/data/media.js:126-130`). Portraits on hand: Pernilongo, Cobra, Edna Lima and Cigarra (`media.js:121-139`).

**Requirements**

- **R13.1 Now: `src/content/mestres.js` (new).** Each entry has `id`, `name`, `title`, `portraitKey` (or a placeholder), `fact` (ACE-approved, empty until approved), `order`, `popup` and `educatorsName`.
  - The 15 client names have `popup: true`. Educators-only names such as Yara have `popup: false`.
  - `educatorsName` defaults to today's text ("Marcia" for Cigarra) until D5.
  - Educators bios (`site.js:39-67`), photo captions (`media.js:124-144`) and the alt text at `src/pages/about/abada.astro:14` read from the registry.
- **R13.2 After D5: replace Bira everywhere it pops up:**
  - `/me` (`me.astro:32`; `:72` reads `level.bira`)
  - `LevelUp.astro:8`
  - the overlay that `rewards.js` injects (`:43-61`, filled at `:204-206`)
  - The card shows the portrait and the name, plus the approved fact once there is one.
  - **No invented quotes from real mestres.** Encouraging lines are the app's own voice.
- **R13.3 Mestre of the week.** The same mestre shows at every pop-up site. Index = whole weeks since Monday 2026-09-28 (New York time), mod 15. Don't use the ISO week number: 2026 has 53 ISO weeks. An optional alternative ties each card to one of 15 milestones: the `/me` welcome, the first lesson, 8 Core-ups, 4 module clears and Roda Ready.
- **R13.4 Cleanup.**
  - Delete `Bira.astro`, `bira.js`, the `bira` lines in `levels.js` and the re-export at `src/content/index.js:9`.
  - In `content-check.mjs`, remove `:7`, `:17-20`, `:132-137` and the Bira count at `:189`. Add a registry check: 15 pop-up names, each with a title and order.
  - Keep the at-least-five educators check (`:142`).

**Acceptance**

- A unit test checks the 15 exact names, unique IDs, and a portrait or placeholder each.
- A test walks 15 weeks across 2026-W53 into 2027-W01 and sees all 15 names in order.
- Until D5, `/about/educators` and the captions render exactly as today.
- `astro build` and `content:check` pass with Bira gone.
- `grep -rnE "Mestr(e|a|ando|anda)\s+[A-Z]" src --include='*.js' --include='*.astro'` returns only these, outside `mestres.js` and `cores.js`:
  - `lessons.js:206` (quiz answers)
  - `site.js:29`, `about/index.astro:11` and `about/abada.astro:8` (ABADÁ history)

### WP14 · Logo badge, journey collage, media intake (M-L; placeholders now)

**Requirements**

- **R14.1 Badge.**
  - The pink tile (`Nav.astro:33-40`; `theme.css:116-126`; 40px on phones at `theme.css:2415-2417`) holds both the ABADÁ globe and the ACE mark, probably as a pill about 44px tall.
  - The PDF copies (303x180 and 744x256, opaque) are placeholders only. Request SVG or transparent originals.
  - If the globe doesn't read at 375px, also mock up a cream-chip alternative and let ACE pick.
  - Favicon, footer and share-image rollout is a suggestion.
- **R14.2 Collage.**
  - A decorative layer (`aria-hidden`, no pointer events) behind the map in `journey.astro`.
  - A scrim keeps labels at 4.5:1 contrast or better.
  - Static by default; drift is optional and respects reduced motion.
  - Photos come through `wix()`. Placeholders come from `PHOTOS`.
  - No names next to children; releases must be confirmed.
- **R14.3 Media intake.**
  - Keep an inventory sheet: file, type, title, topic, module, Cor, who appears, release status, credit and approved use.
  - Import one video, one photo, one audio clip and one design before bulk import.
  - Videos go to YouTube (unlisted), photos and audio to Wix Media. Originals stay out of git.
  - New lessons need R8.4 first.
- **R14.4 Audio player:** a small component, since no `<audio>` exists today.

**Acceptance**

- The badge is approved and sharp at 390px and 1440px, with alt text and a home link.
- The collage meets contrast at 390px and 1440px, and `/journey` Lighthouse performance stays at 85 or above (SPEC bar; `QA.md:7` records 90 on desktop).
- Imported items play on a phone and a tablet with credits.

### WP15 · Trusted access (M; code now, exit tests after D13)

Required before real families or coaches use the app. Each item: the gap, then the requirement.

1. **Roster scope.**
   - Gap: omitting `program` returns every player (`src/pages/api/coach/roster.js:13-16`), and `canSeeProgram` allows an empty program (`authz.js:33`).
   - **R15.1:** a non-admin gets only their own programs; players with no program are admin-only.
2. **Self-assigned roles and programs.**
   - Gap: `lms-accounts` and `lms-players` are member-insert and author-update (`scripts/collections.mjs:5,14-15`), and the browser creates the account row (`src/lib/repo/wixRepo.js:84-100`).
   - **R15.2:**
     - Server routes `POST /api/account` (using `memberFromBearer`, `src/lib/server/session.js:74`, since `caller()` 403s without an account row, `authz.js:15`), `PATCH /api/account` (only `displayName`, `phone` and `leaderboardOptIn`; rejects `role`, `programs` and `memberId`), and `POST`/`PATCH /api/players` (validates invite codes, R15.12).
     - Both collections become admin-insert and admin-update with **author-only reads**.
     - The routes set `_owner` to the caller's member ID.
     - `wixRepo.updateAccount` (`src/lib/repo/wixRepo.js:158`, used by `family/index.astro:155`) goes through `PATCH`.
3. **Cookie role.**
   - Gap: the callback hard-codes `role: 'guardian'` (`src/pages/auth/callback.js:14`), so `COACH_MAX_AGE` (`session.js:12`) never applies.
   - **R15.3:** read the role from the account row at login and refresh. Class mode lives only in `sessionStorage` (`src/lib/coach.js:182-194`), so starting it calls a route that re-signs the cookie for 8 hours (D12).
4. **Class mode across families.**
   - Gap: a non-family class player is dropped on reload (`actions.js:38-41`). In real mode, `selectClassPlayer` (`actions.js:239-246`) would read an empty ledger through author-scoped `wixRepo.listEvents` (`:136-138`).
   - **R15.4:**
     - Keep the class player while Class mode is on.
     - A coach-scoped read route returns the full ledger after checking `canSeeProgram` and `mayPlayInClass`. Don't reuse `GET /api/coach/players/[id]`: it caps at 100 events (`src/lib/server/lms.js:77`).
     - A write route appends class events under the child's account with `source: 'class'`.
5. **Contact.**
   - Gap: without the secret, the form returns a demo "ok" and stores nothing.
   - **R15.5:** verify real delivery and who at ACE follows up.
6. **Attendance.**
   - Gap: only the body's program is checked (`src/pages/api/coach/attendance.js:14-18`; `lms.js:85-103`).
   - **R15.6:** require `player.program === program` for each player.
7. **Cron.**
   - Gap: `/api/jobs/recompute` trusts `x-vercel-cron` (`recompute.js:13`); otherwise it checks `EXPORT_SECRET` (`:14-18`).
   - **R15.7:** drop the header check, accept `Authorization: Bearer ${CRON_SECRET}`, and set `CRON_SECRET` in Vercel. Keep `EXPORT_SECRET` for manual runs.
8. **Redirects.**
   - Gap: the callback accepts any `next` starting with `/` (`callback.js:15`), and `src/pages/api/session/start.js:9,22` builds `${origin}${next}`.
   - **R15.8:** resolve `next` against the origin, require the same origin, and fall back to `/who`.
9. **Leaderboard.**
   - Gap: only coaches are scoped (`src/pages/api/leaderboard.js:16-18`).
   - **R15.9:** a guardian may request only their own children's programs.
10. **Coach events not visible to families.**
    - Gap: these events are inserted with no `_owner` while reads are author-scoped (`collections.mjs:6,16`).
11. **Forged events.**
    - Gap: `lms-events` and `lms-patch-awards` accept member inserts (`collections.mjs:6,16,19`), and the server trusts stored type and XP (`wix-data.js:187`).
    - **R15.10-11 (one fix for items 10 and 11):**
      - Derive corda and attendance from the admin-write `lms-corda-awards` and `lms-attendance` (`collections.mjs:20-21`). Convert their rows to events before `derivePlayer`.
      - Set `_owner` on those inserts.
      - Stop the duplicate `lms-events` writes in `award()` and `stampAttendance()` (`lms.js:100,111-116`).
      - Make `lms-patch-awards` admin-write, and derive the two coach-awarded patches from it.
      - Add `lms-coach-events` (admin-write, author read, `_owner` set) only for `coach.xp` and `coach.note`.
      - Ignore every coach-only type found in member-written `lms-events`.
12. **Invite codes are public.**
    - Gap: `programs.js` is in the client bundle (imported by `family/players/new.astro:47` and `edit.astro:72`), and `lms-programs` is readable by anyone (`collections.mjs:8,24`).
    - **R15.12:**
      - Check codes through the repo. Demo keeps placeholder codes, so the smoke test's `BUSHWICK` step (`demo-smoke.mjs:188`) still works. Wix validates server-side in `POST /api/players`.
      - Take real codes out of the bundle.
      - Issue new non-dictionary codes, since BUSHWICK, BERKELEY, PROSPECT and RODA are already public.

**First spike after D13:** confirm a server route can set `_owner` on a Wix row and that the member can then read it. R15.2 and R15.10-11 depend on it.

**Exit tests (after D13)**

- Two families and two scoped coaches.
- A missing-program request, and role and program tampering.
- Class events across families, where a non-family class player shows their real XP and stars.
- Forged coach-only events are ignored on the roster, in readiness and in the CSV, while a real stamp and corda award show in the family view.
- A guardian saves settings through `PATCH /api/account`, and a request that includes `role` is rejected.
- Redirect variants fall back to `/who`:
  - for the callback: `//example.com`, `/\example.com`, and tab- and newline-prefixed forms
  - for `start.js`: `@example.com` and `.example.com`
- A header-only cron call gets 401; the scheduled call with `CRON_SECRET` gets 200.
- Grepping `dist/client` finds none of the new invite codes.
- Password reset, logout and refresh work.

### WP16 · Real-mode acceptance and release (M, after D13 and WP15)

- Existing member login works, along with new-member verification, reset, logout and refresh.
- Families are isolated (two children under one parent, plus a second family), and an instructor with no children can use the library and the coach screens.
- Saves:
  - An event made offline lands after reconnecting (`actions.js:249`).
  - Nothing that needs a saved event unlocks early.
  - Known gap to decide on: `selectPlayer` and `selectClassPlayer` (`actions.js:45-55`, `:239-246`) rebuild from the server after a failed flush, so unsent progress drops out of view until a later flush.
- Read `lastLoginDate` through the Members API (`fieldsets=FULL`) for the admin roster, after confirming Wix updates it for app logins. The sampled record still shows its 2019 sign-up date.
- Phone, tablet and desktop widths, keyboard focus, contrast and reduced motion.
- Report demo results separately from real-mode results.

---

## 4. Data model changes (amends v2 §3)

| Collection or file | Change | WP |
|---|---|---|
| Event `xp` | Written by `allowedXp` (first time only); `derivePlayer` stays a sum | WP8 |
| `src/lib/game/events.js` | `LEARNER_EVENTS` set | WP8 |
| Snapshot | `core` (from `coreFor`); modules stay cleared once `module.cleared` exists | WP8, WP12 |
| `lms-players` | Adds the `core` field; admin-insert and admin-update, author-only read | WP12, WP15 |
| `lms-accounts` | Admin-insert and admin-update, author-only read; written only by `/api/account` | WP15 |
| `lms-patch-awards` | Admin-write | WP15 |
| `lms-corda-awards`, `lms-attendance` | Become the source of truth for corda and attendance; `_owner` set on insert | WP15 |
| `lms-coach-events` (new) | Admin-write, author read; `coach.xp` and `coach.note` only | WP15 |
| Invite codes | Server-only; new non-dictionary codes | WP15 |
| `src/content/cores.js`, `mestres.js` (new) | Content tables (§3) | WP12, WP13 |
| CSV export | Adds a `core` column | WP12 |

## 5. Routes (new or changed)

| Route | Purpose | WP |
|---|---|---|
| `/coach/library`, `/coach/library/[type]/[slug]` | Instructor library (static, `noindex`) | WP9 |
| `/classes` | Classes info and inquiry form | WP10 |
| `POST /api/account`, `PATCH /api/account` | Create account; save safe settings | WP15 |
| `POST /api/players`, `PATCH /api/players` | Create and edit players; validate invite codes | WP15 |
| Coach-scoped class-player read and class-event write | Class mode across families | WP15 |
| Class-mode session route | Re-sign the cookie for 8 h | WP15 |
| `/api/jobs/recompute` | `CRON_SECRET` bearer only | WP15 |
| `/api/leaderboard`, `/api/coach/roster`, `/api/coach/attendance` | Scope fixes | WP15 |
| `/api/rewards/[playerId]/[cor]` | Only if D4 asks for gated designs | WP12 |

## 6. Scoring rules (amends v2 §3.1)

The XP values are unchanged: video 20, reading 15, drill 25, practice confirmed 15, correct answer 10, perfect quiz +25, module cleared 100, Desafio 30, streak week 40, coach bonus 10-50.

New:

- XP pays the first time only (R8.1). Desafio pays once per date; a practice confirmation pays once per lesson.
- Streak weeks count learner events (R8.3).
- Module clears are sticky (R8.4).
- XP thresholds (the `LEVELS` table and the Cores) may only move down (R12.8).

## 7. Out of scope (parked)

- Stamping, check codes and redemption (unless D4).
- Collectible Mestre cards (an option in R13.3).
- Another video host.
- A full login-history log (a small addition if ACE wants it).
- Per-Cor lesson requirements, or the "option C" track (needs a content map from ACE).
- Rebranding beyond the H1 (D8).

## 8. Facts this spec relies on (checked 2026-09-30 to 2026-10-01)

- **ABADÁ cord names and meanings, and the children's table by age** (solid blue only at 17): http://www.abadaworld.com/sistema.html and https://abadaoc.com/about/cord-system/
- **Mestres:**
  - Cigarra is Márcia Treidler, with the spellings Canguru and Piriquito Verde, and Camisa Roxa as Grão-Mestre: http://www.abadaworld.com/mestres.html
  - Current titles, and Mestre Camisa holding the white cord: https://abadamarin.org/graduation-system/ (updated April 2025)
- **`acb2024` uploader** is "SoChlo Productions LLC" (YouTube oEmbed). SPEC line 3 names SoChlo Productions as Camren's company.
- **Wix:** 61 members (Members API `metadata.total`). The `FULL` fieldset returns `lastLoginDate` and `status`.
- **PDF logos:** 303x180 and 744x256, RGB, no alpha (PyMuPDF).

## 9. Client message (send on day one)

The full text is at the end of `~/Physical Chess/PC Notes OPUS v3.md`. It opens with the OAuth request (D13), then asks D1-D12 and lists the assets: logos, designs, portraits, photos and the drive link.

The client-facing explainer of progression and logins (link at the top of this spec) goes with it.
