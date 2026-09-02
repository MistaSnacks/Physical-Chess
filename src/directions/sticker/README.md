# Sticker Roda — direction brief for Agent 2

Paper file: `01M017JHZGTKX64S7G2TBPBBKH`
Artboards: dashboard `1-0`, module/quiz `3B-0`, mobile quiz `5P-0`

Before coding: call `mcp__paper__get_screenshot` on the three artboard IDs above, and
`mcp__paper__get_jsx` on the dashboard artboard (`1-0`) to copy exact colors, radii,
borders, shadows, type sizes and spacing.

---

## SPEC.md §5.1 — `/sticker` — Sticker Roda (verbatim)

Paper: dashboard `1-0`, module/quiz `3B-0`, mobile quiz `5P-0`

- Ground `#F4FAFF`, white surfaces, ink `#14324F`, ink-soft `#4A6B8A`, brand blue `#3D9BE9` / deep `#1F7FD1`, sky `#C9DDE1`, sun `#FFC93C`, lime `#2FBF71`, coral `#FF6B57`.
- Fredoka 700 display (44 / 26 / 18), Nunito body 15–18.
- 3px ink borders, hard offset shadows `6px 6px 0 ink`, cards tilted ±1.5°, pill buttons, sticker icons in rounded squares.
- **Motion (the reason this direction gets a second look):** cards drop in with a spring (translateY 24px → 0, rotate from 0 to their resting tilt, 60ms stagger); hover lifts 4px and straightens the tilt; progress bars fill on scroll; correct quiz answer bounces and fires confetti (canvas, 120 pieces in sun/lime/coral/blue, 1.6 s); "Done!" chips pop with a scale overshoot; the 👋 in the greeting is an SVG hand that waves. Mobile: bottom sheet slides up.
- The client saw this one static. It must feel alive on first paint.

---

## Reminders from SPEC.md §3 / §6 (apply to every direction)

- Astro 5, `output: 'static'`, no UI framework, no CSS framework, no animation library. Motion is CSS keyframes + Web Animations API + IntersectionObserver.
- Fonts already linked in `Base.astro`: `Fredoka:wght@400..700`, `Nunito:wght@400..900`, `Lilita One`, `Bangers`, `Rubik Mono One`.
- Use only shared data (`src/data/*.js`) and shared components (`src/components/*.astro`) for content; never fork the data.
- Build: `tokens.css`, `theme.css`, `motion.js`, `Nav.astro`, `Footer.astro`, and the five pages under `src/pages/sticker/`.
- Respect `prefers-reduced-motion`: every animation collapses to its final state instantly.
- Entrance sequence ≤ 1.2s, hover + active states everywhere, one reward moment on quiz-correct, one celebration on quiz-complete, animate only `transform`/`opacity`/`stroke-dashoffset`/`clip-path`.
- View Transitions via Astro's `<ClientRouter />` with a direction-specific `::view-transition` style (Sticker: fade+slide).
- Verify with `npm run build`, then screenshot all five pages at 1440 and 390 wide, saved to `screenshots/sticker/`.
- Do not touch another direction's folder or the shared files.
