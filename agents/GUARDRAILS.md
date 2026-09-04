# Guardrails (paste-in for every agent)

You are building the Physical Chess app: a kids' capoeira LMS (ages 7–13) for ACE / Abadá Capoeira Brooklyn, in the "Roda Quest" design direction. Repo root is your working directory.

Before writing code, read in this order: `SPEC.md` (all of it), `agents/FOUNDATION.md`, your work package file in `agents/`. Then look at `src/content/`, `src/lib/`, `src/directions/quest/`, `src/pages/` to see what exists.

Rules:
1. Never edit `src/directions/quest/tokens.css`. Add CSS only by appending a new section to `src/directions/quest/theme.css` under a header comment `/* === WP<n>: <name> === */`. Reuse existing classes before inventing new ones.
2. Never fork content or data. Lessons/modules/levels/patches live in `src/content/`; media in `src/data/media.js` (`wix(key,w,h)`, `yt(key)`, `video(key)`); ceremony copy in `src/data/batizado.js`. `src/data/curriculum.js` and `src/data/student.js` are transitional shims: do not add to them.
3. All reads and writes of student data go through `src/lib/actions.js` (`recordEvent`, `selectPlayer`, `createPlayer`, …) and the store (`src/lib/store.js`, `bindDom`). Never call a repo directly from a page. Every mutation is a ledger event with a `clientEventId` (already handled by `recordEvent`).
4. Screens that need a session call `requireSession(...)` from `src/lib/auth-guard.js` at the top of their client script. Pattern: `document.addEventListener('astro:page-load', init); init();`.
5. Kid-safe copy: short sentences, second person, encouraging, no exclamation storms. Never show another family's email or last name anywhere a player can see. Portuguese words bold on first use. Any copy you invent gets a `reviewNeeded: true` flag where the schema allows it.
6. Real media only, from `src/data/media.js`. No stock photos, no emoji as icons (inline SVG instead), no lorem ipsum.
7. Motion: CSS keyframes / Web Animations API / IntersectionObserver only; animate only `transform`, `opacity`, `stroke-dashoffset`, `clip-path`; every animation collapses to its final state under `prefers-reduced-motion: reduce`; entrance ≤ 1.2 s; one idle loop per screen max.
8. Mobile 390 first for every new player/guardian screen; nothing may scroll horizontally at 390 or 1440.
9. No new npm dependencies without writing why in your report. No UI framework, no CSS framework.
10. Do not touch files owned by another work package (listed in each WP file). Shared files you may edit are listed in your WP file. If a shared change is unavoidable, make it minimal and backwards compatible, and say so in the report.
11. Before you report: `npm run build` passes, `npm test` passes, and you have run `node test/e2e/demo-smoke.mjs` against a static server of `dist/client` (see `agents/FOUNDATION.md` → Verifying) and it prints `SMOKE OK`. Screenshot every screen you built at 1440 and 390 into `screenshots/<wp>/`.
12. Commit as you go with clear messages (`git add -A && git commit -m "WP<n>: …"`). Do not push. Do not run `git rebase`, `git reset --hard`, or `killall`/`pkill`; to free a port use `lsof -ti:<port> | xargs kill`.
13. Finish with a short report: what you built, what you left out and why, any shared-file edits, anything the next agent must know. Write it to `agents/reports/WP<n>.md`.
