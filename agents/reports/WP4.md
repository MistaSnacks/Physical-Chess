# WP4 — Accounts & family

## What I built
Guardian accounts and family screens in the Quest look, working end-to-end in demo:

- **Auth:** `/login` `/signup` `/forgot` `/verify` with every Wix `loginState` / `errorCode` mapped to plain language (`src/lib/auth-ui.js`). `?next=` round-trips. reCAPTCHA v3 loads only when `PUBLIC_RECAPTCHA_SITE_KEY` is set, token goes in a hidden field, then `captchaTokens.invisibleRecaptchaToken` per the [Wix JS SDK custom login doc](https://dev.wix.com/docs/go-headless/authentication/members/custom-login-page/re-captcha/add-re-captcha-to-a-custom-login-page-js-sdk). Demo mode keeps the demo card on login and a “needs the Wix connection” note on the other three.
- **Picker** `/who`: PlayerCard + level from each child’s snapshot. Grown-ups link (and every `/family*` page) uses a 2-digit math gate, session-only.
- **Family** `/family`: report links, settings (display name, read-only email, leaderboard opt-in), per-player “may play in class”, sign out, two-step **Delete my account** (demo: `resetDemo()`).
- **Players:** `/family/players/new` and `/family/players/edit?player=` (static output cannot prerender unknown ids). Invite code → `programByInvite`. AvatarPicker. Two-step **Delete this player**.
- **Report card** `/family/report?player=`: stats, readiness, lessons + stars, patches, corda history, practice log with “I saw it” → `practice.confirmed`, last 50 events, Print, CSV, JSON (`src/lib/export.js`).
- **Privacy** `/privacy`, linked from signup and the footer.
- **wixRepo:** `listEvents` pages; `appendEvents` uses one `hasSome(clientEventId)` query then `bulkInsert` (sequential `insert` if bulk is missing). Role/memberId cannot be patched from the client.

No new npm dependencies.

## Verified
`npm run build` and `npm test` pass. `node test/e2e/demo-smoke.mjs http://localhost:4404` prints `SMOKE OK`. Guardian flow on that server: sign in → add player → edit → report CSV/JSON download → delete player → sign out. Screenshots at 1440 and 390 in `screenshots/wp4/`. Regenerator: `scripts/wp4-shots.mjs`.

## Shared-file edits
- `src/directions/quest/theme.css` — appended `/* === WP4: accounts === */` only.
- `src/directions/quest/Footer.astro` — Privacy link.
- `src/lib/actions.js` — added `updateAccount`, `snapshotsForSession`, `confirmPractice`, `deleteAccount`; existing methods unchanged.
- `src/lib/wix.js`, `src/lib/repo/wixRepo.js`, `src/lib/repo/localRepo.js` — owned by this WP.

## Left out / next agent
- **Dynamic `/family/players/[id]`** skipped for static output; use `?player=`.
- **Visible reCAPTCHA widget** (`USER_CAPTCHA_REQUIRED`): we surface the message; a visible widget is not wired. Invisible v3 covers the spec’s default.
- **`DELETE /api/account` and `DELETE /api/players/:id`** belong to WP6. Demo delete works locally. Live Wix: if the route 404s, Family shows “Contact ACE to delete your account”.
- **Privacy copy** needs ACE/Camren sign-off (SPEC §10 q16). Flagged in this report only; the page has no `reviewNeeded` schema.

## Only verifiable once the OAuth client ID exists
Real Wix `login` / `register` / `sendPasswordResetEmail` / `processVerification`; PKCE redirect + `pc_session` cookie; first login creating `lms-accounts`; player rows appearing in the Wix CMS; `hasSome` + `bulkInsert` against live `lms-events`; reCAPTCHA tokens accepted by Wix; server-side account/player erasure.
