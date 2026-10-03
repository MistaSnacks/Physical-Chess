# WP9: Instructor library, plus R10.5 (Field guide links)

Branch `wp9-library` (based on `client-notes-v3`, after WP8 `67c8538`). Port **4411**. No new npm dependencies. All testing was in **demo mode** (`localRepo`). Real mode waits for D13.

## What I built

**Catalog: `src/lib/library.js`** (R9.2)
- 62 entries: 24 lessons, 12 glossary words, 4 instruments, the 10 `YOUTUBE` videos, `videoProject1`, and 11 page links (`/about` plus its 5 pages, `/graduation` plus its 3 pages, `/batizado`).
- The other 11 `WIX_VIDEOS` clips are left out. None of them appears anywhere in the app, and they wait for D11.
- IDs carry a type prefix because slugs collide: `lesson:au`, `glossary:au`, `instrument:berimbau`, `yt:acb2024`, `wix:videoProject1`, `page:about-faq`.
- Each entry points at its source record (`entry.source`). `title` and `reviewNeeded` are getters on that record, so nothing is copied.
- Helpers: `browseTree()`, `searchLibrary()`, `searchIndex()` (plain rows for the browser), `lessonsForVideo()`, `lessonForInstrument()`, `glossaryForWord()`, `placeLabel()`, `metaLabel()`.
- `src/lib/library-search.js` holds the pure search: `fold`, `words`, `matchRank`, `searchEntries`. It is a separate file so the browser bundle carries only the search code plus a JSON index, not the whole curriculum.
- `src/lib/library-icons.js` holds the inline SVG row icons. There are no emoji icons.

**Search** (R9.3)
- Matches titles only: lesson titles, glossary words, instrument names, and video and page titles.
- Case and accents are ignored.
- Ranking: exact word (or run of words) first, then word prefix, then substring. Within a rank, a title that equals the query wins, then type order, then catalog order.
- Results update as you type. `?q=` stays in the URL, so Back and bookmarks keep the search.

**Routes** (R9.1)
- `src/pages/coach/library/index.astro`:
  - live search
  - section jump chips
  - browse by module and group; words sit under Culture · Portuguese and instruments under Music · Instruments
  - a Videos section (every video in the app)
  - a Pages section, whose rows open the public page itself
- `src/pages/coach/library/[type]/[slug].astro`: 51 static entry pages.
- `CoachNav.astro` gains `'library'` in its `active` union and a "Library" link, second after Overview.
- Not linked from any public page or from `public/sitemap.xml`.
- Row component: `src/components/quest/LibraryRow.astro`.

**Entry pages by type** (R9.4)
- **Video lesson:** `YouTube.astro` (a `<video controls>` is ready for `wixVideoKey` lessons), plus a link to the same clip under Videos.
- **Reading:** `Reading.astro` with `glossary={false}`, then the check question with its answer marked. The "Portuguese for the Roda" page links its 12 word pages instead of rendering the glossary.
- **Drill:** facts (timer length, bpm, step count) and the step list with step photos. No timer and no self-rating.
- **Quiz:** every question with its answer marked. Static markup, not `Quiz.astro`.
- **Glossary:** `say` with a pt-BR speak button (`ReadAloud`), then `meaning` and `example`, plus a link to the lesson the word comes from.
- **Instrument:** photo, blurb, a "Lesson: …" button via `INSTRUMENT_LESSON`, and "Word: Berimbau" where a glossary word has the same spelling.
- **YouTube / Wix video:** the player (`<video controls>` for `videoProject1`) and the lessons that use it.
- **Page link:** opens the public page directly. Page links have no library page.
- Each entry page also has a "More in <group>" list, so a coach can hop to the next item in one tap.
- `reviewNeeded` shows as a dashed "Draft copy" chip on entry pages only.

**No progress side effects** (R9.5)
- Library pages never import `actions.js` or the store, and never call `recordEvent` or `requireSession`.
- `<Base staff>` sets `data-staff` on `<body>` and adds `<meta name="robots" content="noindex">`.
- `nav.js` calls `loadSession({ select: !document.body.hasAttribute('data-staff') })`, so staff pages load the session without selecting the remembered child. That means no `selectPlayer`, no outbox flush, and no write to `pc.activePlayer`.
- The library never calls `clearActivePlayer`.
- **Library pages have no `<ClientRouter />`, on purpose.** Under the router, every page visited earlier keeps its `astro:page-load` listeners. `/coach`, `/coach/*`, `/family`, `/who`, `/journey`, `/me`, `/turma`, `/desafio` and `/admin/roles` all call `requireSession()` from `init` before checking that their own root element exists. On a library page reached by router navigation, those listeners selected the child and flushed the outbox. The library smoke caught this on its first run.
- Without a router on the destination, Astro falls back to a full page load (`router.js`: no `astro-view-transitions-enabled` → `location.href`). So every visit to the library starts with a clean JS context, and only `nav.js` touches the session, with `select: false`.
- The cost: moving between library pages is a plain page load, with no fade.

**Access** (R9.6): ungated in v1 (D11). There is no browser role check. Demo access is "Switch to coach view" on `/family`.

**R10.5 Field guide links**
- `INSTRUMENT_LESSON` lives in `src/content/index.js`:
  - berimbau → `meet-the-berimbau`
  - pandeiro → `pandeiro-atabaque`
  - atabaque → `pandeiro-atabaque`
  - agogo → `agogo-reco-reco`
- The four Music Field guide cards in `src/pages/learn/[module]/index.astro` are now `<a class="quest-instrument-card">` links to `/learn/music/<lesson>`, with a "Lesson: …" cue line.
- They carry `data-lesson-link`, so the hub's locked-module toast also covers them. The lesson page still enforces locks.
- Card styles (anchor reset, focus ring, cue) live in my CSS file.

**CSS:** `src/directions/quest/wp9-library.css`, a new file imported after `theme.css`. `theme.css` is untouched. It reuses the existing `quest-card`, `quest-coach-*`, `quest-lesson__stage`, `quest-lesson__type`, `quest-check*`, `quest-choice-letter`, `quest-steps`, `quest-field*`, `quest-btn*` and `quest-video-frame` classes. Motion is transform-only on hover, and off under reduced motion. Main has `width: 100%` because `.quest-page` is a flex column.

## Left out, and why

- **R9.7: show mode, loop, 0.5x speed.** Skipped as instructed. It is an unrequested suggestion. If ACE wants it: add `enablejsapi=1` at runtime as `[lesson].astro` does, then `setPlaybackRate(0.5)`, a loop toggle, and a fullscreen big-text mode on entry pages.
- **The 11 other `WIX_VIDEOS` clips:** they wait for D11, per R9.2.
- **Staff-only material (library v2):** needs a server route with a real role check, after D11 and D13.
- **Video credits:** library pages use `YouTube.astro` as it is today, with its hard-coded credit line. WP10 adds a `credit` prop and `credit(key)`. After WP10 merges, pass `credit={credit(key)}` in `[type]/[slug].astro` (three `<YouTube>` uses). The Wix `<video>` shows no credit line yet. It should use `credit('videoProject1')` once that exists.

## Shared-file edits (minimal, backwards compatible)

| File | Change |
|---|---|
| `src/lib/actions.js` | `loadSession({ select = true } = {})`; `if (player && select) await selectPlayer(...)`. A two-line diff, and the default is unchanged. |
| `src/lib/nav.js` | `boot()` passes `{ select: !document.body.hasAttribute('data-staff') }` to `loadSession`. 4 lines including a comment. |
| `src/layouts/Base.astro` | Optional `staff` prop: `data-staff` on `<body>` and robots `noindex`. No change when the prop is absent. |
| `src/content/index.js` | Added `INSTRUMENT_LESSON` only. |
| `src/components/quest/CoachNav.astro` | `'library'` in the union, plus the Library link. |
| `src/pages/learn/[module]/index.astro` | Field guide cards only: imports, an `instrumentCards` map, `<article>` → `<a>`, and the `wp9-library.css` import. |

New files: `src/lib/library.js`, `src/lib/library-search.js`, `src/lib/library-icons.js`, `src/components/quest/LibraryRow.astro`, `src/pages/coach/library/index.astro`, `src/pages/coach/library/[type]/[slug].astro`, `src/directions/quest/wp9-library.css`, `test/library.test.mjs`, `test/e2e/library-smoke.mjs`.

## Verification (demo mode)

| Command | Result |
|---|---|
| `npm test` | 45/45 pass, including 13 new tests in `test/library.test.mjs` |
| `npm run content:check` | `content-check OK · 24 lessons · 12 glossary words · 15 Bira moments` |
| `npm run build` | Complete; 52 library pages (index + 51 entries), all with `noindex` and `data-staff`; no other page has `noindex` |
| `node test/e2e/demo-smoke.mjs http://localhost:4411` (run from scratch dir) | `SMOKE OK`, `errors: []` |
| `node test/e2e/library-smoke.mjs http://localhost:4411` (run from scratch dir) | `LIBRARY OK`, `errors: []` |
| Negative control: forced `select = true` in `nav.js`, rebuilt, reran library smoke | Failed as expected (`set pc.activePlayer`, `pc.demo.v1`, `pc.outbox` on a library page); then restored |

`test/library.test.mjs` covers:
- unique type-prefixed IDs
- every source covered, with entries pointing at source records
- routes, and the page links resolving to real pages
- the browse tree
- **"gin" returns exactly Ginga Basics, the 10-minute Ginga workout and the Ginga word**
- **"au" ranks `lesson:au` and `glossary:au` first**
- accent folding and the rank order
- the browser index ranking the same as the catalog
- **every video key used anywhere in `src/` (plus lesson `videoKey`s) is in the catalog**
- **every `INSTRUMENT_LESSON` target exists and is a Music lesson**
- the Field guide cards are links
- library files never reference `recordEvent`, `selectPlayer`, `flushOutbox`, `clearActivePlayer`, `requireSession`, the store, `Quiz.astro`, `DrillTimer` or `Check.astro`, and every library page uses `<Base staff>`

`test/e2e/library-smoke.mjs`:
- **Setup:** pick Gatinha (the child is remembered), then "Switch to coach view" via `/family`.
- **Spy:** an init script records every `localStorage`/`sessionStorage` write to a `pc.*` key.
- **Before each run:** one event is queued in `pc.outbox`.
  - **A. Full loads.** 10 entries by `page.goto`. No `pc.*` write on any page. Ledger, XP, outbox, active player (local + session), coach demo DB and class mode are all unchanged. The pending event is still waiting.
  - **B. From `/coach`.** A click on CoachNav "Library". Asserts it was a full load, not a shared JS context. Search "gin" returns exactly the three entries, and "au" ranks Aú first. Then 10 entries through browse links, with no writes on any page and the state unchanged. Back on `/coach` the chip still shows Gatinha.
  - **C. From a lesson page.** An injected link is clicked on `/learn/movements/au`, which the router intercepts and turns into a full load. 11 entries through "More in", instrument → lesson, lesson → clip, and word ↔ lesson links. No writes, state unchanged. Back on the lesson, the same child is playing, and only then does the waiting event flush (XP +20).
- Each entry is checked by type: title, robots `noindex`, `data-staff`, no lesson-engine controls, check and quiz answers marked exactly once, drill steps present, word speak button present, video embed or `<video controls>` present, instrument → lesson link.
- **noindex everywhere:** all 52 library URLs are fetched and each has `noindex`. The sitemap has no library. `/`, `/about`, `/graduation`, `/batizado`, `/learn/music` and `/journey` neither link the library nor carry `noindex`.
- **R10.5:** each of the four Field guide cards has the right `href`, and clicking it opens that lesson.
- **Phone (390×844, touch), no child selected:** tap search, type "gin", get exactly the three entries. Tapping each opens it (search box + result). No sideways scroll, no writes, and still no child selected.

**Screenshots** are in `$SCRATCH/shots/wp9/`: 30 shots at 390 and 1440 (plus a full-page Field guide shot at each width). They cover the library index, searches for "gin", "au" and a no-match query, video, reading, reading-with-words, drill, quiz, glossary, instrument, YouTube and Wix entries, the `/learn/music` Field guide, and `/coach` with the new CoachNav. No page scrolls sideways at either width. The only element flagged is the existing horizontal lesson-rail scroller on `/learn/music` at 390, which I did not change.

## Notes for the next agent

- **WP15 (`loadSession`, Class mode):** my diff is the `select` parameter plus `&& select` on the `selectPlayer` line. Keep `select: false` skipping any class-player restore as well, so a library visit on a class tablet never re-selects anyone.
- **App-wide router issue, not fixed here because the files belong to others:** most player, family and coach pages call `requireSession()` at the top of an `astro:page-load` listener without first checking that their own root element is on the page. Those listeners outlive router navigation, so after visiting `/coach` every later router page re-runs the coach guard. A one-line guard at the start of each `init` (e.g. `if (!document.querySelector('[data-coach-root]')) return;`) would fix it. Then the library could take `<ClientRouter />` back if anyone wants the fade.
- **`/family` on a direct load shows two grown-up gates.** `init` runs from both `astro:page-load` and the direct call before `requireGrownUp` resolves. The library smoke goes in through `/who` → "Grown-ups", as the demo smoke does.
- **Network reconnect:** `actions.js` adds a global `window` `online` → `flushOutbox()` listener on every page, because `nav.js` imports it. On a library page that could still flush the outbox when the network comes back. This is untested and outside my allowed `actions.js` edit. A guard of `if (!document.body.hasAttribute('data-staff'))` would close it.
- **After WP10:** pass `credit` to the three `<YouTube>` uses in `[type]/[slug].astro`.
