# WP6 — Coach, server routes, Desafio, turma

## What I built

Cross-family coach tools, Desafio do Dia, and turma, all working in demo without a Wix client secret.

**Server routes** (`prerender = false`). Each checks `WIX_CLIENT_SECRET` first and returns `501 { demo: true }` so the browser falls back to `coachDemo`. With a secret they verify `Authorization: Bearer` via Get My Member (`GET https://www.wixapis.com/members/v1/members/my`), load `lms-accounts` with the client-credentials admin token, then call Wix Data Items REST v2 (`POST /wix-data/v2/items/query`, `POST /wix-data/v2/items`, `PUT /wix-data/v2/items/{id}`, `DELETE /wix-data/v2/items/{id}?dataCollectionId=`, bulk insert/remove). Docs used: [Query Data Items](https://dev.wix.com/docs/api-reference/business-solutions/cms/data-items/query-data-items), [Insert Data Item](https://dev.wix.com/docs/api-reference/business-solutions/cms/data-items/insert-data-item), [Delete Member](https://dev.wix.com/docs/api-reference/crm/members-contacts/members/member-management/members/delete-member).

| Route | Role |
|---|---|
| `GET /api/me` | `{ member, account }` |
| `GET /api/leaderboard?program=&period=` | opted-in apelido + avatar + weekly XP; compute on cache miss |
| `GET /api/coach/roster?program=` | players + `derivePlayer` snapshots, cap 200 |
| `GET /api/coach/players/:id` | player, snapshot, last 100 events, awards, attendance |
| `POST /api/coach/attendance` | `lms-attendance` + `attendance.stamped` (`source: 'coach'`) |
| `POST /api/coach/award` | patch / corda / xp / note; corda updates `lms-players.cordaCurrent` |
| `GET+POST /api/coach/goal` | `lms-programs.goalXp` / `goalLabel` |
| `GET /api/export` | streaming CSV (BOM + CRLF) or JSON; `what=players\|events` |
| `GET+POST /api/jobs/recompute` | snapshots + `lms-lesson-state` + leaderboard cache; `EXPORT_SECRET` or `x-vercel-cron` |
| `GET+POST /api/admin/roles` | list / set role + programs |
| `DELETE /api/players/:id` | erase that player’s `lms-*` rows + `player.deleted` tombstone |
| `DELETE /api/account` | all players + account + Delete Member |

`vercel.json` cron: `30 7 * * *` (07:30 UTC = 03:30 America/New_York during EDT). `scripts/seed-roles.mjs` promotes Camren/Pastor by `CAMREN_MEMBER_ID` / `PASTOR_MEMBER_ID`.

**Demo coach** (`src/lib/repo/coachDemo.js`): 8 players across Bushwick, Berkeley Carroll, and Prospect (Maya + Leo + 6 seeded kids), including one opted-out of the leaderboard, one `mayPlayInClass: false`, one quiet ~4 weeks, and Luna at 100% readiness. Family page has **Switch to coach view** / **admin** / **family**.

**Screens:** `/coach` overview + roster, `/coach/player?id=`, `/coach/attendance`, `/coach/class`, `/coach/export`, `/coach/goal`, `/admin/roles`, `/desafio` (22-item pool), `/turma`. Class mode writes `sessionStorage.pc.classMode`, paints a persistent bar, and sets `source: 'class'` on events. HUD Desafio ticket is injected onto `.quest-hud`.

Verified: `npm test` (15), `npm run build`, `node test/e2e/demo-smoke.mjs http://localhost:4406` → `SMOKE OK`. CSV has UTF-8 BOM + CRLF (Numbers). Corda award updates the player row. Screenshots in `screenshots/wp6/` at 1440 and 390.

No new npm dependencies.

## What I left out

Live Wix calls were not exercised (no client secret). Demo implementations of every route are complete. Shop/contact email (Resend) is WP5. Field-level CMS editing of readiness rules is phase 2.

Student detail is `/coach/player?id=` (static, works on `dist/client`) rather than `/coach/players/:id`, because a dynamic Astro page would 404 on the static smoke server. The API remains `GET /api/coach/players/:id`.

## Shared-file edits

- `src/lib/game/derive.js` — `desafioDoneToday`, `notes`
- `src/lib/game/streaks.js` — `nyDate`, `nyMonth`
- `src/lib/game/events.js` — `coach.note`
- `src/lib/actions.js` — class-mode `source` on `recordEvent`; added `recordDesafio`, `selectClassPlayer`, `updateAccount` (existing functions otherwise unchanged)
- `src/lib/repo/localRepo.js` — `getSession` filters by `accountId` so coach-seeded kids do not appear on `/who`; `resetDemo` clears coach meta; demo db helpers for `coachDemo`
- `src/lib/nav.js` — class-mode bar + HUD ticket
- `src/pages/family/index.astro` — demo role toggles
- `src/pages/api/me.js` — 501 without secret; returns `account`
- `scripts/collections.mjs` — `goalXp`, `goalLabel` on `lms-programs`
- `src/content/index.js` — re-exports `DESAFIO_POOL`
- `src/directions/quest/theme.css` — `/* === WP6: coach === */`

## What the next agent must know

1. Re-run `npm run wix:collections` after the secret exists so `goalXp` / `goalLabel` land on `lms-programs`.
2. `scripts/seed-roles.mjs` needs `CAMREN_MEMBER_ID` and `PASTOR_MEMBER_ID` (those members must already have an `lms-accounts` row from first login).
3. Vercel cron is GET; the job handler accepts GET and POST. Set `EXPORT_SECRET` and optionally `CRON_SECRET`.
4. Admin token uses the same `client_credentials` body as WP0 (`instance_id: WIX_SITE_ID`) plus `wix-site-id` on Data calls.
5. Class mode: `sessionStorage['pc.classMode']` JSON `{ program, programName }`. End clears the active player and returns to `/coach/class`.
6. Demo coach data lives in `pc.demo.v1` (players/events) and `pc.coach.demo.v1` (attendance, awards, goals, extra accounts). `localRepo.resetDemo()` wipes both.
7. Screenshot static server: port **4406**.
