# WP7 — QA & polish (runs after WP1–WP6 are merged)

**Owns:** `QA.md`, `test/e2e/**`, `screenshots/final/**`, `public/favicon.svg`, small fixes anywhere (each fix a separate commit prefixed `WP7:`; do not redesign anything).

## Deliverables
1. `QA.md` checklist, every line ticked or explained:
   - every route renders at 1440 and 390 with no horizontal scroll (list all routes from `src/pages`);
   - all photos/videos from `media.js`, SoChlo credit shown where videos appear; Batizado copy verbatim; contact and age line on Home;
   - progress numbers come from the snapshot (grep for hard-coded numbers in pages);
   - demo flow: sign in → who → add player → each lesson type → rewards → module cleared → level up → `/me` → report card CSV → coach view → class mode → export;
   - empty/edge states: brand-new player, all modules locked, coach with no program, guardian with no players, outbox replay (go offline in DevTools, finish a lesson, go online, verify the ledger has it);
   - keyboard: every interactive element reachable, visible focus, `aria-live` on feedback; read-aloud works; reduced-motion: no transforms/confetti;
   - console clean on every route; `npm run build`, `npm test`, `npm run content:check`, `node test/e2e/demo-smoke.mjs` pass;
   - Lighthouse performance ≥ 85 on `/` and `/journey` (`npx lighthouse` if available, else headless Chrome + note).
2. Extend `test/e2e/demo-smoke.mjs` into the full demo flow above (keep the file name and `SMOKE OK`).
3. Copy pass: kid-safe tone, no exclamation storms, Portuguese bold on first use, no "click here".
4. Screenshots of every route at both widths into `screenshots/final/`.
5. Report `agents/reports/WP7.md`: what you fixed, what remains, and the top 5 things Camren should look at before the client sees it.
