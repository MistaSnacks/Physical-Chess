# WP5 — Public site parity

## What I built
Every Wix public-nav item now has a Quest page:

| Wix | Route |
|---|---|
| Home | `/` |
| About Us | `/about` |
| Educators | `/about/educators` |
| the ACE | `/about/the-ace` |
| ABADÁ | `/about/abada` |
| F.A.Q. | `/about/faq` |
| Contact | `/about/contact` → `POST /api/contact` (`contactForm`) |
| Graduation | `/graduation` |
| Batizado 2026 | `/batizado` (kept; linked from the hub) |
| What is it? | `/graduation/what-is-batizado` (verbatim `INTRO` + `MOMENTS`) |
| Cordas | `/graduation/cordas` |
| Batizado Media | `/graduation/media` |
| Shop | `/shop` → `POST /api/shop/order` (`contactForm3`, Wix field keys) |

Nav keeps the four player links and the session chip. A **More** menu (keyboard: arrows / Home / End / Escape; 390: bottom sheet) lists About, Graduation, Shop, Privacy. Footer has contact, age line, public sitemap, and the SoChlo credit.

Home: night-sky hero (cropped `heroRoda` as LCP; Wix mp4 `videoProject1` idle-loads on viewports wider than 700px), age line + phone/email, Log in / Try the demo (`/login?demo=1` auto-starts demo) / Batizado 2026 (`/graduation`), four module stops, click-to-play “latest from the roda” (`acb2024`).

Forms in demo (no `WIX_CLIENT_SECRET`, or static `dist/client` with no API) show **Demo: nothing was sent.** With a client secret they insert via `adminToken()`.

## `src/content/site.js`
WP1 had not landed `site.js` on this worktree. I created it with the exact §4 export names: `ABOUT`, `THE_ACE`, `ABADA`, `EDUCATORS`, `FAQ`, `CORDAS_PAGE`, `SHOP`. All invented copy is `reviewNeeded: true`. WP1 should replace this file rather than add a second one.

## Left out, and why
- **Privacy page** — WP4 owns `/privacy`. Nav and footer link it; it 404s until WP4 ships.
- **Coco and Pastor portraits** — WP1 §4 only lists five `portraitKey`s. No keys in `media.js` for those two; they are not on Educators.
- **2017 and 2020 gallery years** — WP5 said skip captions with no photo. None of those Wix captions match a `media.js` key.
- **2018 Volta do Mundo / Pronto para Evento / Instructor Batizando** and other unmatched captions — skipped the same way.
- **Shop email to ACE** — SPEC mentions Resend; WP5 only requires the Wix insert. No new dependency. Wire email in WP6 if needed.
- **Member-site About/ACE/FAQ/Cordas copy** — those Wix URLs are behind the login lightbox. Draft copy is flagged for ACE.

## Shared-file edits
- `src/layouts/Base.astro` — `og:image` = `wix('heroWorkshop', 1200, 630)` plus og/twitter description. Backwards compatible.
- `src/pages/login.astro` — `/login?demo=1` calls `signInDemo()` when `IS_DEMO`. WP4 owns this file; change is additive.
- `src/directions/quest/theme.css` — append-only `/* === WP5: public === */`.
- `.gitignore` — `node_modules` without a trailing slash so this worktree’s symlink is ignored (an earlier `git add -A` had tracked it; later commit untracked it).

## Next agent
- WP1: overwrite `src/content/site.js` in place; keep the export names.
- WP4: `/privacy` is already linked.
- WP6: live `contactForm` / `contactForm3` inserts need `WIX_CLIENT_SECRET` + `WIX_SITE_ID`. Contact fields used: `name`, `email`, `message`, `submissionTime`. Shop fields: `parentsName`, `childsNameShirtPan`, `email`, `schoolProgramAndChild`, `contact`, `submissionTime`.
- Static `python -m http.server` of `dist/client` has no API routes; the pages fall back to the demo message. Vercel serves the routes.

## Verify
- `npm run build` pass
- `npm test` pass (7)
- `node test/e2e/demo-smoke.mjs http://localhost:4405` → `SMOKE OK`
- No horizontal overflow at 390 or 1440 on the public pages
- Lighthouse performance on `/`: **desktop 94**, **mobile 96** (LCP 2.3 s). Hero video is not LCP on phone (poster image `heroRoda` 900×1400; video starts only above 700px).
- Screenshots: `screenshots/wp5/` (each public screen at 1440 and 390, plus More dropdown/sheet and form demo states)

No new npm dependencies.
