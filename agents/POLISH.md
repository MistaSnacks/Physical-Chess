# Polish pass (Codex SOL) — one screen group per run

You are polishing a finished screen of the Physical Chess app (kids' capoeira LMS, ages 7–13, "Roda Quest" look). Read `agents/GUARDRAILS.md` first, then `SPEC.md` §5.2 and §6, then `agents/FOUNDATION.md`. Guardrails apply in full (tokens.css untouched; theme.css append-only under `/* === POLISH: <group> === */`; real media only; kid-safe copy; motion rules; no new dependencies).

Your job is craft, not features. For the screen group named in the prompt:

1. **Look at it** at 1440 and 390 (build, serve `dist/client` on the port in the prompt, Playwright screenshots; the demo login is `/login?demo=1` then pick "Gatinha" on `/who`; coach view is Family → "Switch to coach view").
2. **Fix what a design lead would fix**: spacing rhythm (multiples of 4/8), type hierarchy (Lilita One display, Nunito labels with tracking, Nunito body 16–18 at 65ch max), alignment across repeated cards, contrast (cream on deep leaf ≥ 4.5:1 for body text), touch targets ≥ 44 px on mobile, empty/loading states that don't jump, focus rings visible, hover/active states in the Quest language (lift 2–4 px, offset shadow), and copy that reads like a coach talking to a kid (short, warm, no exclamation storms, Portuguese bold on first use).
3. **Motion**: entrance ≤ 1.2 s, one idle loop per screen, reward moments only from real events, everything collapses under `prefers-reduced-motion`. Remove any animation that fights the content.
4. **Do not** change routes, data flow, event names, or component APIs. Do not rewrite a screen; refine it.
5. Verify: `npm run build`, `npm test`, `node test/e2e/demo-smoke.mjs http://localhost:<port>` prints `SMOKE OK`, no horizontal scroll at 390, screenshots into `screenshots/polish/<group>/`. Commit as `polish(<group>): …`. Write 5–10 lines to `agents/reports/POLISH-<group>.md` about what you changed and anything you left for Camren.

Groups: `journey` (/journey + Hud + rewards), `lessons` (/learn/* hubs + player, all four types), `me-family` (/who, /me, /family/*, report card), `auth` (/login, /signup, /forgot, /verify, /privacy), `public` (/, /about/*, /graduation/*, /shop, /batizado, footer, More menu), `coach` (/coach/*, /admin/roles, /desafio, /turma).

## Group-specific notes

### coach
Turma board changes (product decision 2026-09-03, applies to `/turma` and any board the coach screens show):
- Show **top 3 plus "you"**, not top 10. Three reads like a Batizado podium; ten reads like a rank list.
- Add a second board on the same page that is not about volume: **"Roda weeks"** (longest current streaks) or **"Most stars this week"**. A kid who trains once a week can top it.
- The berimbau community goal stays the hero of the page, above both boards.
- **Names list defaults off**: the `leaderboardOptIn` account setting defaults to `false` in `localRepo`, `wixRepo`, the demo seed and the family settings screen copy ("Show our apelidos on the turma board" is unchecked by default). The berimbau bar shows for everyone regardless of the setting. Update `SPEC.md` §4.7 to say default off pending the client's answer to §10 question 6.
- In class mode the board should feel like the room: same top 3 + you, no change in data, just make sure it looks right on a tablet at 1024 wide.
