# WP7 — QA & polish

Branch `wp7`. Port **4407**. No new npm dependencies. `node_modules` left as the worktree symlink.

## What I fixed

Post-merge bugs first, then copy/a11y/harness, then Lighthouse.

**Role and empty states**
- Demo Family → Coach never stuck: `localRepo.updateAccount` was stripping `role`. Demo now accepts `guardian|coach|admin`. Live `wixRepo` still cannot patch role from the client.
- Coach with `programs: []` used to see every turma. `programsForAccount()` now: admin → all active programs; coach with `[]` → empty copy on `/coach`.
- Who with no players now has `data-empty` copy.

**Visual bugs**
- `.quest-check` was reused for 22px report/coach dots, which shrank the lesson check. Report uses `.quest-checklist__mark`; coach uses `.quest-checks__item`.
- WP6 injected a second Desafio bar. HUD `.quest-hud__ticket` is now the only ticket (`data-desafio-ticket`).
- Late `innerHTML` (coach, turma, desafio, empty-program) kept `[data-quest-enter]` at opacity 0. `motion.js` observes added nodes and stamps them `true`. Coach/turma screenshots now show the roster and berimbau.
- Showcase `.quest-latest { grid-template-columns: 112px 1fr }` crushed the Home lite-YouTube. Scoped the full-width block under `.quest-section--latest`.

**Copy, media, chrome**
- Folded WP1 wording into WP5 `site.js` shape (`ABOUT.mission`, `THE_ACE.kicker`, `CORDAS_PAGE.paragraphs`, `SHOP.fields` object).
- Dropped tap-here copy on drill confirm.
- Skip-to-content, `#main`, named avatar radios, Quest-only fonts (Nunito + Lilita One), `aria-live` on form/toast/empty.
- `YouTube.astro` always shows “Video: SoChlo Productions”.
- Favicon is a Quest ginga mark (palm / mango / lime), not the leftover diamond.
- Deleted unused `src/data/student.js` and `src/data/curriculum.js`.
- Credit contrast on the latest-from-the-roda card (muted green was 4.2:1).
- Active player id is written to `localStorage` as well as `sessionStorage`, so a refresh (and Lighthouse’s new tab) still opens the map.

**Perf**
- Home hero `srcset` (480 / 720 / 900) so a 412px viewport is not the 900×1400 JPEG.

**Harness**
- `test/e2e/demo-smoke.mjs` is the full demo flow (outbox, add player, all lesson types, module clear, level-up, `/me`, report CSV, coach, class mode, export). Prints `SMOKE OK`.
- `test/e2e/shots.mjs` shoots every public, player, family, and coach route plus all 24 lessons at 1440 and 390, plus empty/class-mode extras.
- `test/e2e/lighthouse-journey.mjs` seeds a Chromium profile, then runs Lighthouse with `--disable-storage-reset`.

## Verify

| Check | Result |
|---|---|
| `npm test` | 20/20 |
| `npm run content:check` | 24 lessons |
| `npm run build` | pass |
| `node test/e2e/demo-smoke.mjs http://localhost:4407` | SMOKE OK (Maya 295 → 570 XP, level 4) |
| `node test/e2e/shots.mjs http://localhost:4407` | overflow 0, pageerrors 0 |
| Lighthouse `/` desktop | performance **94**, a11y **100** |
| Lighthouse `/` mobile | performance **85**, a11y **100** |
| Lighthouse `/journey` desktop | performance **90**, a11y **96** |

Full tick list: `QA.md`. PNGs: `screenshots/final/`.

## Shared-file edits

Append-only `/* === WP7: qa === */` in `src/directions/quest/theme.css`. `tokens.css` untouched. Small fixes landed in `localRepo.js`, `motion.js`, `nav.js`, `actions.js`, `YouTube.astro`, `Base.astro`, `site.js`, lesson/coach/family pages as needed. Each fix is its own `WP7:` commit.

## What remains

- **Live Wix** was never hit. No `WIX_CLIENT_SECRET` / OAuth app here. Login, CMS, `/api/*`, contact/shop inserts, cron recompute, and `scripts/seed-roles.mjs` still need Camren’s IDs and secrets (see WP4 + WP6 reports).
- Static `dist/client` has no API routes; forms show the demo fallback by design.
- Almost every lesson, `site.js` block, and desafio item is still `reviewNeeded: true`. Batizado ceremony copy is the exception (`false`).
- Coco and Pastor are in SPEC §5.1 but have no `portraitKey` in `media.js`, so they are not on Educators.
- Batizado 2026 date is still TBC. Six short teaching videos were never shot; existing SoChlo compilations fill those lesson slots.
- Privacy copy needs ACE/Camren legal sign-off (SPEC §10). Shop price is “ask ACE”.
- Member-site About / Movements / Music / FAQ / Cordas verbatim from the Wix login wall was never captured; drafts are ours.
- Home mobile 85 is the simulated-4G floor: LCP is still the Wix JPEG. Do not chase webp without a Media Manager export.
- Chromium may log `compute-pressure is not allowed` from YouTube; smoke ignores that line.

## Top 5 things Camren should look at before the client sees it

1. **Walk the demo as a grown-up, then as Gatinha, then as coach.** Confirm Family → “Switch to coach view” actually stays on `/coach`, class mode, and export. That path was broken at merge.
2. **Approve or rewrite `reviewNeeded` copy** — especially Home/About/FAQ/Shop, the 23 flagged lessons, and the desafio pool. Portuguese bold and “class energy, not a how-to” on videos are ours, not ACE’s.
3. **Batizado 2026 date and corda ladder.** The map still says date TBC. Kids’ top of the ladder (Crua → Laranja) is assumed. Do not ship a wrong ceremony date.
4. **Educators + teaching video honesty.** Coco and Pastor are missing. Video lessons are real aulões, not step-by-step. If the client expects slow-motion how-tos, say so before parents see it.
5. **Privacy + live login.** `/privacy` is a draft. Real Wix login, first `lms-accounts` row, and server-side erase have never been clicked. Do not demo “this is production” until OAuth exists.

## What the next person must know

- Screenshot / smoke static server: **4407**.
- Demo db: `localStorage pc.demo.v1`; coach extra: `pc.coach.demo.v1`; outbox: `pc.outbox`; grown-up gate: `sessionStorage pc.grownUp`; class mode: `sessionStorage pc.classMode`; active player: `sessionStorage` **and** `localStorage pc.activePlayer`.
- Do not rebase, force-push, or `killall`. Do not reinstall `node_modules`.
