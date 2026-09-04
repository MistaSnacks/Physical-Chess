# WP6 — Coach, server routes, Desafio, turma

**Owns:** `src/pages/api/**` (except the session/auth routes from WP0, which you may extend but not break), new `src/pages/coach/**` (`index`, `players/[id]` or `player.astro?id=`, `attendance`, `class`, `export`, `goal`), `src/pages/admin/roles.astro`, `src/pages/desafio.astro`, `src/pages/turma.astro`, `src/lib/server/**` (add files), new `src/lib/coach.js`, `src/lib/desafio.js`, `src/content/desafio.js`, `src/lib/repo/coachRepo.js` (server-backed) with a demo implementation `src/lib/repo/coachDemo.js`, `vercel.json` (cron), `scripts/seed-roles.mjs`.
**May edit (append):** `theme.css` under `/* === WP6: coach === */`; `src/lib/actions.js` (add `recordDesafio`, do not change existing functions); `src/content/index.js` (re-export `DESAFIO_POOL`).

## Goal
Everything that crosses families runs on the server with the OAuth client secret (`adminToken()` in `src/lib/server/session.js`), and the coach can run a class from a tablet. All of it also works in demo mode with a seeded coach roster.

## Deliverables
1. **Server routes** (each `export const prerender = false`; each verifies the caller with `memberFromBearer` then loads `lms-accounts` by `memberId` with the admin token and checks `role`; when `WIX_CLIENT_SECRET` is missing, every route returns `501 { demo: true }` and the client falls back to `coachDemo`):
   - `GET /api/me` (extend): `{ member, account }`.
   - `GET /api/leaderboard?program=&period=` → opted-in players only, `{ entries:[{apelido, avatar, xp}], communityXp, target, computedAt }` from `lms-leaderboard` cache; compute on miss.
   - `GET /api/coach/roster?program=` → players + snapshots (`derivePlayer` over each player's events; cap 200 players; page by program).
   - `GET /api/coach/players/:id` → player, snapshot, last 100 events, corda awards, attendance.
   - `POST /api/coach/attendance` `{ playerIds[], program, classDate }` → rows in `lms-attendance` + `attendance.stamped` events (`source: 'coach'`).
   - `POST /api/coach/award` `{ playerId, kind: 'patch'|'corda'|'xp', patchKey?, corda?, event?, xp?, note }` → `lms-patch-awards` / `lms-corda-awards` rows + the mirror event; corda award also updates `lms-players.cordaCurrent`.
   - `GET /api/export?scope=program|all&format=csv|json` (coach: own programs; admin: all) → two CSVs zipped is overkill: return one CSV of players joined with account contact + snapshot fields, and `?what=events` for the raw ledger. Stream rows.
   - `POST /api/jobs/recompute` (guarded by `EXPORT_SECRET` header or Vercel cron) → recompute `lms-players` snapshot fields, `lms-lesson-state`, and `lms-leaderboard` per program for the current ISO week. `vercel.json` cron nightly 03:30 America/New_York (write the UTC equivalent and comment it).
   - `POST /api/admin/roles` `{ memberId, role, programs[] }` (admin only).
   - `DELETE /api/players/:id` (guardian owning it, or admin): delete that player's rows in every `lms-*` collection, write a `player.deleted` tombstone (no personal data). `DELETE /api/account`: all players + account row + Wix Delete Member.
2. **Coach screens** (`requireSession({ role: 'coach' })`), desktop-first but sane at 390:
   - `/coach` overview: active players this week, lessons done this week, readiness distribution (5 buckets), kids inactive 3+ weeks; then roster table per program (`.quest-table`): apelido, first name, level, readiness %, roda weeks, last active, corda, link.
   - `/coach/players/:id`: readiness checklist, event timeline, notes (store as `coach.note` events), actions: stamp attendance (today), award patch (`batizado-2026`, `helper`), award corda (select from CORDAS + event name + note; confirm dialog; this is the one action that changes a kid's rank), XP bonus (10–50 + note).
   - `/coach/attendance`: pick program + date → tap-to-stamp grid of player cards; save.
   - `/coach/class` **Class mode** (SPEC §2.4): pick program → full-screen player cards (avatar + apelido only, players with `mayPlayInClass`) → tapping selects that player for this device (`selectPlayer`) and goes to `/journey`; persistent top bar "Class mode · <program> · End" on every screen while `sessionStorage.pc.classMode` is set (add the bar in `src/lib/nav.js`, minimal); events recorded in class mode carry `source: 'class'` (extend `recordEvent` to read a `source` override from sessionStorage, minimal change).
   - `/coach/export`: buttons for program/all × players/events.
   - `/coach/goal`: set the community goal target and message for the month (`lms-programs` row fields `goalXp`, `goalLabel`; add to `scripts/collections.mjs` and note it in the report).
   - `/admin/roles`: list accounts (admin), change role and programs.
3. **Demo coach**: `coachDemo.js` seeds 8 players across 3 programs with plausible ledgers (reuse `demoSeed.js` helpers); the demo account gets a "Switch to coach view" toggle on `/family` (sets `account.role = 'coach'` in the local repo).
4. **Desafio do Dia** `/desafio` (SPEC §4.6): pool in `src/content/desafio.js` (≥ 20 items across: glossary flashcard, name-the-instrument with `photoKey`, order-the-steps for a drill, true/false culture fact, 30-second ginga timer). One per day per player (key by NY date), 30 XP via `desafio.done`, HUD ticket state (WP3's Hud reads `snapshot.desafios` and a `desafioDoneToday` you add to `derivePlayer` in a backwards-compatible way, or compute it in the page and set a `data-desafio-done` attribute on `body`).
5. **Turma** `/turma` (SPEC §4.7): leaderboard for the player's program (apelidos + avatars + XP, top 10 + "you"), community berimbau bar toward the program goal, opt-out notice if the guardian opted out.

## Done when
Coach demo roster, awards, attendance, class mode, export (CSV opens in Numbers), Desafio and turma all work in demo; server routes are written against the Wix REST docs and return `501 demo` without a secret; smoke test still `SMOKE OK`; screenshots in `screenshots/wp6/`; report `agents/reports/WP6.md`.
