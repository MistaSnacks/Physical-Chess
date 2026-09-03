# Physical Chess — Roda Quest LMS · Product & Build Spec (v2)

Owner: Camren (SoChlo Productions) for ACE / Abadá Capoeira Brooklyn (physicalchess.org).
Written 2026-09-03. Status: **draft for Camren's review** before any build agent starts.
Supersedes the showcase spec (`docs/SHOWCASE-SPEC-v1.md`). The client chose **Roda Quest**; this document turns the Quest showcase into the real, end-to-end LMS.

Repo: `/Users/admin/physical-chess-app` (cloned from the showcase, Quest promoted to the root routes, other directions removed; the showcase itself stays live at physical-chess-showcase.vercel.app, tag `showcase-v1`).

---

## 0. The ten decisions this spec makes

| # | Decision | Why |
|---|---|---|
| 1 | **Accounts belong to grown-ups; kids are "players" inside an account.** One Wix member (parent, guardian, teacher, coach) can hold several players. Kids never enter an email or password. | Ages 7–13 means COPPA. It also matches who the 61 existing members actually are: parents and school coordinators. Siblings share a login; a shared classroom tablet works with a "Who's playing?" picker. |
| 2 | **Wix Members stays the identity provider.** Custom-designed login/sign-up screens in the Quest look, powered by the Wix JS SDK (`auth.login` / `auth.register`), tokens exchanged with the mobile-safe full-page redirect flow. | Existing members keep their logins. The client keeps one member list in the Wix dashboard. No second auth vendor. |
| 3 | **Wix CMS collections are the system of record for student data**, designed as an **append-only event ledger** plus small snapshot tables. | The client can open the Wix dashboard, filter, and Export CSV with zero code. Every number the app shows is derivable from the ledger, so nothing is trapped in the UI. |
| 4 | **A thin server layer on Vercel (Astro server routes) holds a Wix API key** for anything cross-member: leaderboards, coach roster, exports, awarding cordas/patches, attendance. | Wix member tokens can only read a member's own rows (author-scoped). Anything that needs to see other families' data must run server-side under a trusted key. This is the "combo" of headless Wix plus our own logic, without our own database. |
| 5 | **Everything talks to data through one repository interface** (`src/lib/repo/`), with two implementations: `wixRepo` and `localRepo` (localStorage demo). | Demo mode works today with no OAuth app; the whole app is buildable and reviewable before the client creates the Wix OAuth app. If Wix CMS ever becomes limiting, a Postgres/Supabase repo drops in behind the same interface. |
| 6 | **The corda is real and coach-awarded; XP earns Levels, not cordas.** | A kid must never believe the app promoted them. Levels are named after capoeira movements; the corda on the HUD is set only by ACE at Batizado. "XP to next corda" becomes a **Batizado Readiness** ring. |
| 7 | **Streaks are weekly ("roda weeks"), not daily.** | Kids train once or twice a week. A daily streak punishes a seven-year-old for having a life. |
| 8 | **Curriculum content ships in the repo (versioned data files) for v1; student data lives in Wix.** Content moves into CMS collections in phase 2 when the client wants to self-edit. | Fastest path to done, deterministic builds for the agents, and the client's real need for extraction is about student data, not lesson text. |
| 9 | **No UI framework.** Astro pages + vanilla JS modules + a tiny pub/sub store. Same rules as the showcase (transform/opacity-only motion, reduced-motion fallbacks). | The showcase is already built this way; it deploys in seconds; Codex agents work fastest in it. |
| 10 | **Priorities are P0 / P1 / P2.** P0 + P1 must be done before the client returns with edits. P2 is written down so nothing is forgotten, but not built now. | "Mostly done" needs a definition. See §9. |

---

## 1. Users, roles, and what each one sees

| Role | Who | Enters via | Sees |
|---|---|---|---|
| **Player** | The kid, 7–13 | Parent logs in → picks the player card | The map, lessons, quizzes, Desafio, patches, turma leaderboard, Batizado |
| **Guardian** | Parent / guardian (Wix member, role `guardian`) | Email + password (Wix) | Player picker, add/edit players, per-player report card, export, settings (leaderboard opt-in), the Shop |
| **Coach** | ACE instructors (Wix member, role `coach`, set by admin) | Same login, role unlocks `/coach` | Roster by program, readiness, attendance stamps, award corda/patch, notes, CSV export |
| **Admin** | Camren, Pastor | role `admin` | Everything a coach sees plus role management and full export |
| **Visitor** | Not logged in | — | Public pages: Home, About Us set, Graduation public set, Shop, Batizado Media (non-members) |

Roles live in `lms-accounts.role` and are only writable by the server (API key). Default on sign-up is `guardian`.

---

## 2. Architecture

```
Browser (Astro static pages + JS modules)
 ├─ src/lib/wix.js         Wix SDK client, OAuthStrategy, token storage, login/register/reset
 ├─ src/lib/repo/          RepoInterface  → wixRepo (member token) | localRepo (demo)
 ├─ src/lib/store.js       in-memory state + pub/sub; screens bind to it
 ├─ src/lib/game/          xp.js  levels.js  streaks.js  patches.js  readiness.js (pure functions over events)
 └─ screens                render structure at build time, hydrate player state on load

Vercel (Astro server routes, @astrojs/vercel adapter, `prerender = false`)
 ├─ /api/me                verify member token → account + role
 ├─ /api/leaderboard       program/period → opted-in players, apelido + avatar + XP only
 ├─ /api/coach/*           roster, student, attendance, awards (coach/admin only)
 ├─ /api/export            CSV/JSON of players + progress + events (scope by role)
 └─ /api/shop/order        uniform order → Wix form collection + email to ACE
   env: WIX_API_KEY, WIX_SITE_ID, PUBLIC_WIX_CLIENT_ID, PUBLIC_DEMO

Wix (site 93f9dffd-79fb-4bea-94fa-810eef3397fe)
 ├─ Members (identity: 61 existing accounts keep working)
 └─ CMS collections (§3) — client exports CSV from the dashboard any time
```

### 2.1 Auth flow (guardian)

1. `/login` (our design). Email + password → `wix.auth.login()`; `/signup` → `wix.auth.register({ email, password, profile: { firstName, lastName } })`.
2. On `SUCCESS`, always use the **full-page redirect** exchange (Create Redirect Session with PKCE → `/auth/callback` → `/oauth2/token`). Never the iframe path; it fails on iOS Safari.
3. Handle `EMAIL_VERIFICATION_REQUIRED` (6-digit code screen), `OWNER_APPROVAL_REQUIRED` (pending notice), `resetPassword`, `emailAlreadyExists`, `invalidPassword` with plain-language errors.
4. **Session storage (see §2.1.1):** the refresh token never reaches page JavaScript. `/auth/callback` is a server route: it exchanges the code, stores the refresh token in an `httpOnly; Secure; SameSite=Lax` cookie, and returns only the 4-hour access token to the page. Logout via `wix.auth.logout(url)` plus clearing the cookie.
5. First login with no `lms-accounts` row → create it (role `guardian`) → `/players/new` (add first player) → `/who` (picker) → `/journey`.
6. Server routes get `Authorization: Bearer <member access token>`; the server verifies it by calling Get My Member with that token, loads the account row with the API key, and checks the role.

Blocker: the OAuth app must be created by hand (the MCP got a 403 again on 2026-09-03; the "Manage OAuth Apps" scope is not granted to the MCP token). Dashboard → Headless Settings → OAuth apps → "Physical Chess App", login URL empty, redirect URIs `http://localhost:4321/auth/callback` and `https://<prod-domain>/auth/callback`, plus allowed domain for the prod host. Until then everything runs in demo mode.

#### 2.1.1 Sessions that do not randomly log people out

The client's biggest complaint about the Wix site is members getting logged out. That happens on Wix-hosted pages because the member session rides on Wix's own browser cookies, which expire on their schedule, get dropped by Safari's third-party-cookie rules, and are shared across every Wix site in the browser. In the headless app we own the session, so we can make it behave:

| Wix facts we build on | What we do with them |
|---|---|
| Member **access tokens live 4 hours**; **refresh tokens are long-lived** and only die on logout, password change, or revocation. | The refresh token is the real session. It sits in a first-party `httpOnly` cookie on our domain (`pc_session`, 180-day `Max-Age`, renewed on every use, so an active family is never logged out). Nothing third-party, nothing Safari can purge as tracking. |
| Access tokens are minted from the refresh token with `renewToken` / `POST /oauth2/token`. | On every page load the app calls `/api/session`, which reads the cookie, mints a fresh access token server-side, and hands it to the page in memory only (never `localStorage`). API calls that get a 401 retry once through `/api/session`. From the user's side the app is simply always logged in. |
| The SDK's iframe token exchange breaks on iOS Safari. | We only use the full-page redirect exchange (§2.1 step 2). |
| Wix supports reCAPTCHA on custom login pages and email verification on sign-up. | Both on. reCAPTCHA v3 on `/login` and `/signup` stops credential stuffing; verification stops junk accounts. |
| PKCE `state` and `code_verifier` protect the redirect. | Stored server-side keyed by a one-time cookie, checked on callback, single use. |

Other rules: HTTPS only (HSTS), a strict Content-Security-Policy, the Wix API key only in Vercel env (never shipped to the browser), sign-out on all devices = password reset (Wix revokes refresh tokens), and coaches/admins get a shorter 24-hour cookie because their screens show other families' data. Player switching inside a family never touches the session.

Demo mode ignores all of this (there is no session to protect).

### 2.2 Demo mode

`PUBLIC_DEMO=1` or missing client ID → `localRepo`: seeded guardian "Demo Family" with players **Maya "Gatinha"** (mid-journey, the showcase state) and **Leo "Tubarão"** (brand new). A "Try the demo" button on Home. Every screen, including coach, works in demo (coach demo roster = 8 seeded players across 3 programs). Demo data is clearly labelled in the HUD ("Demo").

### 2.3 Player switching

`store.activePlayerId` in `sessionStorage`; the nav shows the active player's avatar chip; tapping it opens the picker. Coaches get a "Coach" chip next to it.

---

## 3. Data model (Wix CMS)

Field naming follows Wix (`camelCase`, `_owner` = the member). "Author" = `SITE_MEMBER_AUTHOR`. Existing `lms-courses`, `lms-modules`, `lms-lessons` stay for phase 2 content sync; `lms-progress` and `lms-quiz-results` are replaced by the ledger below and can be dropped after migration (they hold seed data only).

| Collection | Purpose | Key fields | Permissions (insert / read / update / remove) |
|---|---|---|---|
| `lms-accounts` | One row per Wix member | `memberId`, `role` (guardian·coach·admin), `displayName`, `email`, `phone`, `programs[]` (coach), `leaderboardOptIn` (bool, default true), `consentAt` | member / author / author* / admin |
| `lms-players` | Kids | `accountId`, `firstName`, `apelido`, `avatar` (`{animal, color}`), `birthYear` (optional), `program` (school/site), `startedAt`, `active`; snapshot: `xp`, `level`, `weekStreak`, `lastActiveWeek`, `stars`, `lessonsDone`, `cordaCurrent` (mirrored from awards) | member / author / author* / admin |
| `lms-events` | **Append-only ledger.** Every meaningful thing a player does | `playerId`, `accountId`, `type`, `moduleId`, `lessonId`, `xp`, `stars`, `payload` (JSON), `occurredAt`, `clientEventId` (uuid, idempotency), `source` (app·coach·system) | member / author / admin / admin |
| `lms-lesson-state` | Per player × lesson snapshot for fast reads | `playerId`, `lessonId`, `status` (open·done), `bestStars`, `bestScore`, `attempts`, `firstDoneAt`, `lastAt` | member / author / author / admin |
| `lms-patches` | Patch (badge) catalog | `key`, `title`, `subtitle`, `rule` (JSON), `art` (svg id), `tier`, `sortOrder` | admin / anyone / admin / admin |
| `lms-patch-awards` | Earned patches | `playerId`, `patchKey`, `earnedAt`, `awardedBy` (system·coach id) | member / author / admin / admin |
| `lms-corda-awards` | **Real rank history** | `playerId`, `corda`, `event` ("Batizado 2026"), `awardedAt`, `awardedBy`, `note` | **admin only** (server writes) / author / admin / admin |
| `lms-attendance` | Coach stamps | `playerId`, `program`, `classDate`, `stampedBy` | admin (server) / author / admin / admin |
| `lms-readiness-rules` | The checklist ACE uses for Batizado readiness | `key`, `label`, `rule` (JSON), `program` (blank = all), `active` | admin / anyone / admin / admin |
| `lms-leaderboard` | Server-computed cache | `program`, `period` (ISO week), `entries` (JSON: apelido, avatar, xp), `communityXp`, `computedAt` | admin / member / admin / admin |
| `lms-programs` | Schools / sites | `key`, `name`, `dayOfWeek`, `coachIds[]`, `active` | admin / anyone / admin / admin |

\* Wix cannot restrict *which* fields an author may update, so anything privileged (role, corda, attendance) lives in admin-only collections and the player row only **mirrors** it. A tampered mirror is corrected by the nightly recompute.

### 3.1 Event types and XP (the single source of truth for scoring)

| `type` | When | XP | Stars |
|---|---|---|---|
| `lesson.video.done` | Watched ≥ 80 % or tapped "I watched it" after 60 s | 20 | 1 |
| `lesson.reading.done` | Reached the end + answered the 1 check question | 15 | 1 (2 if check correct first try) |
| `lesson.drill.done` | Drill timer finished + self-rating | 25 | self-rating 1–3 |
| `practice.confirmed` | Guardian taps "I saw it" on a logged drill | +15 | — |
| `quiz.answered` | Each answer | 10 if correct, 0 if wrong | — |
| `quiz.done` | Quiz finished | +25 bonus if perfect | 3 perfect · 2 ≥ 66 % · 1 otherwise |
| `module.cleared` | All lessons in a module done | 100 | — |
| `desafio.done` | Daily challenge finished | 30 | — |
| `streak.week` | First activity in a new ISO week that continues the streak | 40 | — |
| `patch.earned` | Any patch | 0 (patches are their own reward) | — |
| `coach.xp` | Coach bonus with note | 10–50 | — |
| `corda.awarded` | Mirrors `lms-corda-awards` | 0 | — |

Rules: an event with an already-seen `clientEventId` is ignored. Re-doing a lesson never re-awards XP, only improves stars. All XP/level/streak/patch/readiness values are **pure functions** of the event list (`src/lib/game/*`), used identically in the browser (optimistic) and on the server (recompute + leaderboard).

### 3.2 Export (the client must be able to leave with their data)

1. **Wix dashboard → CMS → any `lms-*` collection → Export to CSV.** No code, works today.
2. **`/api/export?scope=program|all&format=csv|json`** for coaches/admin: players joined with account contact, current corda, level, XP, readiness, plus a second file of raw events. Streams, no size cap.
3. **Guardian report card** (`/family/report/:playerId`): printable page + "Download CSV" of that player's events, and a JSON of everything the app holds about them.
4. **Nightly recompute job** (`/api/jobs/recompute`, cron via Vercel) recomputes snapshots and the leaderboard cache from the ledger so the CSVs are always consistent with the ledger.

---

## 4. Gamification system

Design stance: cooperative over competitive, mastery over grind, and the real-world ceremony is the summit of the whole map.

### 4.1 XP → Levels (named after movements, easiest to hardest)

| Level | Title | XP to reach | Mestre Bira says |
|---|---|---|---|
| 1 | Iniciante | 0 | "Welcome to the roda!" |
| 2 | Ginga | 100 | "You found the rhythm." |
| 3 | Esquiva | 250 | "Now you can dodge." |
| 4 | Cocorinha | 450 | "Low and ready." |
| 5 | Meia Lua | 700 | "Your first kick sings." |
| 6 | Aú | 1000 | "Upside down and smiling." |
| 7 | Bênção | 1350 | — |
| 8 | Armada | 1750 | — |
| 9 | Rolê | 2200 | — |
| 10 | Macaco | 2700 | — |
| 11 | Rasteira | 3250 | — |
| 12 | Capoeirista da Roda | 3850 | "You belong in any roda." |

Level-up = full-screen moment: the map dims, the new title stamps in, confetti in hibiscus/mango/lime, Mestre Bira line. Numbers above are tuned so a kid doing 2 lessons a week reaches level 6 around Batizado.

### 4.2 Corda (real rank) and Batizado Readiness

- HUD shows `cordaCurrent` from `lms-corda-awards` (default **Crua**). Ladder: Crua → Crua-Amarela → Amarela → Amarela-Laranja → Laranja (confirm with ACE, §10).
- **Readiness ring** replaces "XP to next corda": percentage of active `lms-readiness-rules` satisfied. Default rules (seeded, coach-editable in phase 2):
  1. Movements module cleared
  2. Music quiz 2/3 or better
  3. "Portuguese for the Roda" done
  4. "What is Batizado?" done
  5. 8 practice sessions logged, 4 confirmed by a guardian
  6. 6 attendance stamps (only counts when the coach uses stamps; otherwise hidden)
- 100 % → "Roda Ready" patch and the golden gate on the map starts glowing. The gate **opens** only when a coach records the corda award.

### 4.3 Weekly streak ("roda weeks")

Any XP-earning event in an ISO week keeps the streak. Miss a week → streak resets to 0 with a kind message, never a punishment screen. Flame shows weeks. Milestones 4 / 8 / 12 / 20 weeks award patches.

### 4.4 Stars

Every lesson holds up to 3 stars (see §3.1). Map lesson dots show 0–3 tiny stars; module stop shows total. Stars only ever go up.

### 4.5 Patches (collectible embroidered-patch badges)

| key | Title | Rule |
|---|---|---|
| `first-ginga` | First Ginga | first lesson done |
| `boa-ginga` | Boa Ginga | Movements module cleared |
| `berimbau-ear` | Berimbau Ear | Music quiz perfect |
| `voice-of-roda` | Voice of the Roda | "Sing the Roda" drill 3 stars |
| `historian` | Historian | Culture module cleared |
| `fala-portugues` | Fala Português | 6 glossary words mastered in Desafio |
| `four-weeks` / `eight-weeks` / `twelve-weeks` | Roda Weeks 4 / 8 / 12 | streak milestones |
| `desafio-7` | Desafio Streak | 7 Desafios done |
| `home-roda` | Home Roda | 5 guardian-confirmed practices |
| `three-star-module` | Estrela | any module at all-3-star |
| `roda-ready` | Roda Ready | readiness 100 % |
| `batizado-2026` | Batizado 2026 | coach award (ceremony) |
| `helper` | Ajudante | coach award, with note |

Unlock moment: patch slides in from the corner, stitches on (SVG dash draw), 1.2 s. Patch wall on `/me`.

### 4.6 Desafio do Dia (daily challenge, P1)

One 60-second task per day from a rotating pool: Portuguese flashcard (word ↔ meaning), "name the instrument" (photo), order the steps of a movement, true/false culture fact, 30-second ginga timer with the metronome. 30 XP, once per day, sits in the HUD as a mango ticket.

### 4.7 Turma leaderboard + community goal (P1)

- Per program (school), current week, opted-in players only, **apelido + avatar only**, top 10 plus "you". Guardian toggle in settings (default on; confirm with client, §10).
- **Community goal**: the whole roda's XP this month fills a berimbau-shaped bar toward a target the coach sets ("Fill the berimbau by Batizado"). Cooperative, visible to everyone.

### 4.8 Mestre Bira and avatars

- Mestre Bira (SVG figure in a mango circle, already built) gets a small line library keyed by moment: welcome, first lesson, wrong answer, level up, streak saved, streak lost, readiness 100 %, patch earned.
- Player avatar = an animal from the Wix rainforest set (frog, snake, lizard, armadillo, plus two from the African maps content: giraffe, gorilla) drawn as flat SVG stickers, plus a uniform-cord color. Picked when a player is created; editable in `/me`.

---

## 5. Screen inventory

Parity with the Wix member site (nav: Home · About Us [Educators, the ACE, ABADÁ, F.A.Q., Contact] · Graduation [Batizado 2026, What is it?, Cordas, Batizado Media] · Shop · Movements [Capoeira ABADÁ, Virtual Training, Jogos] · Music · Culture [Portuguese, ABADÁ-Capoeira, Manifestations, Folklore, History & Maps]) plus the account, gamification and coach screens that make it an LMS.

**Status key:** ✅ built in showcase (needs live data) · 🔨 new. **Priority:** P0 must / P1 should / P2 later.

### 5.1 Public (visitor)

| Route | Screen | Wix parity | Status | Pri |
|---|---|---|---|---|
| `/` | Home: night-sky hero video, age line, contact, Log in / Sign up / Try the demo, Batizado 2026 CTA | Home | ✅ + auth buttons | P0 |
| `/about` | About Us hub: mission, the four sub-pages as map-style stops | About Us | 🔨 | P0 |
| `/about/educators` | Educators: portraits (Pernilongo, Marcia, Edna Lima, Cobra, Yara, Coco, Pastor — names/bios from client) | Educators | 🔨 | P0 |
| `/about/the-ace` | The ACE (Abadá Capoeira Experience) program | the ACE | 🔨 | P0 |
| `/about/abada` | ABADÁ-Capoeira the organization (Mestre Camisa, 1988, Rio) | ABADÁ | 🔨 | P0 |
| `/about/faq` | FAQ accordion | F.A.Q. | 🔨 | P0 |
| `/about/contact` | Contact: phone, email, form → Wix `contactForm` | Contact Us | 🔨 | P0 |
| `/graduation` | Graduation hub (public): Batizado 2026, What is it?, Cordas, Media | Graduation | 🔨 (reuse ✅ Batizado) | P0 |
| `/graduation/what-is-batizado` | Verbatim ceremony copy (six moments) | What is it? | ✅ content | P0 |
| `/graduation/cordas` | Rank ladder explained, kids' progression | Cordas (Ranks) | 🔨 | P0 |
| `/graduation/media` | Gallery 2016–2022 by year (captions from the Wix page) + YouTube 2024/25/26 | Batizado Media | ✅ partial | P0 |
| `/shop` | Uniform tops order form (parent name, child name, sizes, school program, contact) → Wix `contactForm3` + email | Shop | 🔨 | P1 |
| `/login` `/signup` `/forgot` `/verify` `/auth/callback` | Account flows in the Quest look | Wix login lightbox | 🔨 | P0 |

### 5.2 Player (logged in, active player selected)

| Route | Screen | Wix parity | Status | Pri |
|---|---|---|---|---|
| `/who` | Who's playing? Player cards (avatar, apelido, level), + Add a player | — | 🔨 | P0 |
| `/journey` | **The map** (today's `/dashboard`): live nodes from lesson state, HUD (level, XP, roda weeks, stars, readiness ring, corda), Desafio ticket, Next up, latest video | Member home | ✅ → live | P0 |
| `/learn/movements` | Module hub: level rail with lessons grouped as Capoeira ABADÁ · Virtual Training · Jogos | Movements + 3 sub-pages | ✅ → generic | P0 |
| `/learn/music` | Module hub: instruments field guide, songs, Boss Quiz | Music | ✅ → generic | P0 |
| `/learn/culture` | Module hub: Portuguese · ABADÁ-Capoeira · Manifestations · Folklore · History & Maps (maps + animals art from Wix media) | Culture + 5 sub-pages | 🔨 | P0 |
| `/learn/graduation` | Module hub: What is Batizado · Cordas · Batizado 2026 video, gate state | Graduation | ✅ partial | P0 |
| `/learn/:module/:lesson` | **Lesson player**: one route, four lesson types (video · reading · drill · quiz); completion writes events; next-lesson CTA; stars | (Wix has static pages) | 🔨 | P0 |
| `/me` | Player profile: avatar editor, level card, patch wall, stats, corda history | — | 🔨 | P0 |
| `/desafio` | Daily challenge | — | 🔨 | P1 |
| `/turma` | Turma leaderboard + community berimbau | — | 🔨 | P1 |
| `/batizado` | Ceremony page with countdown, gate, gallery (existing) linked from map summit | Batizado 2026 | ✅ | P0 |

### 5.3 Guardian

| Route | Screen | Status | Pri |
|---|---|---|---|
| `/family` | Family home: players, add player, settings (leaderboard opt-in, email), sign out | 🔨 | P0 |
| `/family/players/new` · `/family/players/:id` | Create/edit player: first name, apelido, avatar, program, birth year (optional) | 🔨 | P0 |
| `/family/report/:playerId` | Report card: level, XP, readiness checklist, lessons done, stars, patches, corda history, practice log with "I saw it" confirmations; Print; Download CSV / JSON | 🔨 | P0 |

### 5.4 Coach / Admin (`/coach`, role-gated)

| Route | Screen | Status | Pri |
|---|---|---|---|
| `/coach` | Roster by program: name, apelido, level, readiness %, weeks streak, last active, corda | 🔨 | P1 |
| `/coach/players/:id` | Student detail: readiness checklist, event timeline, notes; actions: stamp attendance, award patch, award corda (writes `lms-corda-awards`), XP bonus | 🔨 | P1 |
| `/coach/attendance` | Today's class: tap-to-stamp grid per program | 🔨 | P1 |
| `/coach/export` | Export CSV/JSON by program or all | 🔨 | P1 |
| `/coach/goal` | Set the community goal target and message | 🔨 | P1 |
| `/admin/roles` | Promote member to coach/admin, assign programs | 🔨 | P1 |

### 5.5 Curriculum (v1 content, in-repo `src/content/`)

Four modules, ~22 lessons. Every lesson: `id, moduleId, group, title, type, minutes, summary, body (markdown for reading), videoKey?, photoKey?, drill?, check?, quiz?`.

- **Movements** — Capoeira ABADÁ: Ginga Basics (video), Meia Lua de Frente (video), Esquiva & Cocorinha (drill), Aú (video), Bênção & Armada (video, aceCompilation). Virtual Training: 10-minute Ginga workout (drill w/ timer), Kick combo (drill). Jogos: Your first game (video), Roda etiquette (reading + check).
- **Music** — Meet the Berimbau (reading), Pandeiro & Atabaque (video), Agogô & Reco-reco (reading), Sing the Roda: "Paranauê" (drill: call-and-response), Music Boss Quiz (5 questions; keep Q "Which country was capoeira born in?" → Brazil).
- **Culture** — Portuguese for the Roda (reading, 12 words w/ audio later), ABADÁ-Capoeira (video, bhmShowcase), Manifestations: Samba de Roda, Jongo, Puxada de Rede, Maculelê (reading with Wix photos), Folklore (reading), History & Maps: Africa → Brazil (reading with the three maps), Culture Boss Quiz (5 questions).
- **Graduation** — What is Batizado? (reading, verbatim copy), Cordas (reading), Batizado 2026 (video), Roda Ready check (quiz: 3 questions from all modules).

All new copy is written in the client's voice for kids 7–13 (short sentences, Portuguese words bolded on first use) and flagged `reviewNeeded: true` until ACE approves. Member-only Wix pages could not be read (login wall); when the client shares that copy, it replaces ours.

---

## 6. Design system additions (stay inside Roda Quest)

Tokens in `src/directions/quest/tokens.css` are the law: palm shadow `#0B2E24`, deep leaf `#154334`, leaf border `#1E5A46`, hibiscus `#FF4F7A`, mango `#FFB238`, firefly lime `#B9F26B`, cream `#FFF6E5`, muted `#9FC4B3`; Lilita One display, Nunito labels/body.

New components (all in `src/components/quest/`, styled in `theme.css` sections with a `/* === component === */` header):

- `Hud.astro` (extracted from the dashboard, now data-bound): avatar chip, level + title, XP bar to next level, roda-weeks flame, stars, readiness ring, corda swatch, Desafio ticket.
- `ReadinessRing` (SVG ring, stroke-dashoffset animated), `LevelUp` overlay, `PatchUnlock` toast, `Patch` (SVG sticker with stitched border, 6 art variants by tier), `PlayerCard` (picker), `AvatarPicker`, `LessonFrame` (rail + stage layout, shared by all lesson types), `DrillTimer` (big countdown, metronome tick optional), `Reading` (chapter typesetting, 65 ch measure, cream on deep leaf), `Check` (single question at the end of a reading), `Quiz` (extend existing: image choices, order-the-steps, true/false), `Table` for coach screens (dense, tabular-nums, cream text, lime/mango status chips), `Form` fields (login/sign-up/shop) with 3 px leaf borders, 12 px radius, focus ring in lime.
- Motion budget unchanged: entrance ≤ 1.2 s, one idle loop per screen, reward moments only on real events.
- Mobile 390 first for every new screen; coach screens may be desktop-first but must not break at 390.
- Copy tone: second person, encouraging, no exclamation storms. Never show other families' emails or last names anywhere a player can see.

---

## 7. Stack changes to the repo

- Add `@astrojs/vercel`, `@wix/sdk`, `@wix/data`, `@wix/members`. Keep `output: 'static'`; server routes opt out with `export const prerender = false`.
- `src/lib/wix.js` (port from the old LMS repo, upgraded to the redirect exchange), `src/lib/repo/{index,wixRepo,localRepo}.js`, `src/lib/store.js`, `src/lib/game/*.js`, `src/lib/auth-guard.js` (redirects to `/login` or `/who`).
- Session server routes (§2.1.1): `src/pages/auth/callback.js` (code → tokens, sets the `pc_session` httpOnly cookie), `src/pages/api/session.js` (cookie → fresh access token, slides the cookie), `src/pages/api/logout.js`. Env adds `SESSION_COOKIE_SECRET` (HMAC over the cookie payload) and `RECAPTCHA_SITE_KEY`.
- `src/content/{modules,lessons,glossary,patches,readiness,levels,programs}.js` and `src/content/copy/*.md` for reading lessons.
- `scripts/wix-collections.mjs` (creates/updates the §3 collections via the Wix Data Collections API with the API key; idempotent) and `scripts/seed-demo.mjs`.
- `.env.example`: `PUBLIC_WIX_CLIENT_ID`, `PUBLIC_DEMO`, `WIX_API_KEY`, `WIX_SITE_ID`, `EXPORT_SECRET`.
- Vercel project `physical-chess-app` (new; the showcase project stays).

---

## 8. Work packages (Codex `gpt-5.6-sol` agents, after Camren approves this spec)

WP0 is done by Claude first; WP1–WP5 run in parallel; WP6 after WP3; WP7 last.

| WP | Owner | Scope | Done when |
|---|---|---|---|
| **WP0 Foundation** | Claude | §7 stack, repo interface + localRepo + demo seed, store, auth-guard, route skeletons with `Nav`/`Hud` wired, content schema + the existing 16 lessons migrated, game functions with unit tests (node `--test`), collections script (run against Wix), `/api/me` | `npm run build` + `npm test` pass; demo mode walks Home → Who → Journey → lesson → event recorded → HUD updates |
| **WP1 Content** | Codex | All lessons in §5.5 (copy, checks, quizzes, drills), glossary, Culture hub art from Wix media, Educators/ACE/ABADÁ/FAQ/Cordas copy, Mestre Bira lines | Every lesson renders in the player with real media; zero placeholder text; `reviewNeeded` flags set |
| **WP2 Lesson engine** | Codex | `/learn/:module/:lesson` for 4 types, DrillTimer, Reading + Check, Quiz extensions, completion → events via repo, next-up, stars, module hubs generalized from the showcase Movements/Music pages | Complete every lesson type in demo; refresh keeps state; reduced-motion OK; 390 wide OK |
| **WP3 Gamification UI** | Codex | Hud (bound), ReadinessRing, LevelUp, PatchUnlock, Patch art ×6, `/me` patch wall, map bound to lesson state, gate glow/open states, streak logic UI | Trigger every reward moment from real events in demo; map reflects state after each lesson |
| **WP4 Accounts & family** | Codex | `/login /signup /forgot /verify /auth/callback`, `/who`, `/family/*` incl. report card + CSV/JSON download, AvatarPicker, settings, wixRepo auth paths (works once client ID exists), error states | Full flow in demo; with a real client ID, a real Wix member logs in and their rows appear in the Wix CMS |
| **WP5 Public parity** | Codex | `/about/*`, `/graduation/*`, `/shop` (server route → Wix form collection), contact form, footer/nav updates, sitemap | Every Wix nav item has a Quest page; forms land in the Wix dashboard |
| **WP6 Coach & server** | Codex | `/api/leaderboard`, `/api/coach/*`, `/api/export`, `/api/jobs/recompute` (+ vercel cron), `/coach/*`, `/admin/roles`, `/turma`, `/desafio` + pool | Coach demo roster works; with API key, awards write to `lms-corda-awards` and the export CSV opens in Numbers |
| **WP7 QA & polish** | Codex | Screenshots of every route at 1440/390 (`screenshots/`), Lighthouse ≥ 85 on Home/Journey, a11y pass (focus, labels, contrast), copy pass, console clean | Checklist in `QA.md` all ticked |

Agent guardrails (paste into every Codex prompt): read `SPEC.md` fully; never edit `tokens.css`; never fork content or data helpers; all reads/writes go through `src/lib/repo`; every mutation is an event with a `clientEventId`; kid-safe copy; no new dependencies without noting it in the report; `npm run build` must pass before reporting; do not touch another WP's files except `theme.css` (append your own section).

---

## 9. Definition of "mostly done" (before the client returns)

- All P0 screens live in demo mode on `physical-chess-app.vercel.app`, real content, real media.
- P1 coach + Desafio + turma working in demo.
- Wix collections created; `wixRepo` implemented and tested against the site with a temporary test member; only the OAuth client ID is missing to flip `PUBLIC_DEMO` off.
- Export proven: a CSV downloaded from the Wix dashboard and one from `/api/export` open cleanly.
- QA checklist done, screenshots in the repo, memory notes updated.

---

## 10. Open questions for the client (batch them into one message)

1. **Create the OAuth app** in the Wix dashboard (5 minutes; we send exact steps) or grant Camren "Manage OAuth Apps" on the site.
2. **Member-page copy**: a member login (or a copy of the text) for Movements, Music, Culture, About Us, Educators, FAQ, Cordas so we can port it verbatim instead of our draft.
3. **Programs / schools list** (we see Achievement First Bushwick, Berkeley Carroll, Prospect Schools, John Jay adult crew) and which coach runs each.
4. **Kids' corda ladder**: confirm Crua → Crua-Amarela → Amarela → Amarela-Laranja → Laranja, and whether older kids go further.
5. **Batizado 2026 date** (countdown currently 2026-10-10, labelled TBC).
6. **Leaderboard**: OK to show apelidos within a school's turma, default on with a parent toggle? Or off by default?
7. **Educators**: names, titles (Mestre/Mestranda/Professor/Instrutor), one-line bios, which portrait for each.
8. **Shop**: uniform tops only, or more items? Prices? Where should orders go (email + dashboard)?
9. **Readiness checklist**: does the default list in §4.2 match how ACE decides who gets a corda?

---

## 11. Not in v1 (parked, on purpose)

Content editing in the Wix CMS (phase 2 sync), email/SMS nudges, Portuguese audio in the glossary, Portuguese UI toggle, PWA/offline, class-scheduling/bookings, payments (Wix Invoices already covers ACE billing), Supabase/Postgres (only if Wix Data limits bite: 500 KB/item, author-only permissions, no field-level rules).
