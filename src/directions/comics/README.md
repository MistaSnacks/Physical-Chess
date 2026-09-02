# Axé Comics — direction brief for Agent 4

Paper file: `01M017JHZGTKX64S7G2TBPBBKH`
Artboards: dashboard `EF-0`, quiz `EG-0`, mobile `UA-0`

Before coding: call `mcp__paper__get_screenshot` on the three artboard IDs above, and
`mcp__paper__get_jsx` on the dashboard artboard (`EF-0`) to copy exact colors, radii,
borders, shadows, type sizes and spacing.

---

## SPEC.md §5.3 — `/comics` — Axé Comics (verbatim)

Paper: dashboard `EF-0`, quiz `EG-0`, mobile `UA-0`

- Ground chrome yellow `#FFD21F`, panels pure white, ink `#111111`, cobalt `#1E4FD8`, cadmium red `#FF2E2E`, halftone gray. No rounded corners except speech bubbles (28px).
- Bangers display (104 / 44 / 26, 0.02–0.06em tracking), Nunito 900 labels, Nunito 800 body 15–19.
- 5px ink borders, `10px 10px 0 ink` shadows, panels tilted ±1.5°, halftone dot field (SVG) top-right, starburst stickers (18-point polygon, red, "DONE!" / "AXÉ!"), speech bubbles with triangular tails, comic caption boxes in yellow, a black corda meter bar at the bottom.
- Real photos are the panel art: each module panel's middle area is a photo with a halftone overlay (CSS radial-gradient dots, mix-blend multiply) so it reads as printed comic art. Video panels get a "▶ PLAY!" cobalt button.
- **Motion:** panels slide in from alternating sides with a slight overshoot; starbursts scale from 0 with rotation and a 2-frame "wobble"; halftone field drifts slowly; speech bubble types its text (CSS steps); hover on a panel bumps its shadow to 14px; correct answer = AXÉ! burst from the corner + panel shakes; page transitions use a "POW" wipe (a red diagonal band sweeps across).
- Screen mapping: Home = cover of Issue #4 ("MAYA VS. THE RODA!"), Dashboard = the strip, Movements = a full-page splash panel with the video and step panels underneath, Music = quiz panel, Batizado = "Special Issue" with the six moments as a 3×2 panel grid and the gallery as a contact sheet.

---

## Reminders from SPEC.md §3 / §6 (apply to every direction)

- Astro 5, `output: 'static'`, no UI framework, no CSS framework, no animation library. Motion is CSS keyframes + Web Animations API + IntersectionObserver.
- Fonts already linked in `Base.astro`: `Fredoka:wght@400..700`, `Nunito:wght@400..900`, `Lilita One`, `Bangers`, `Rubik Mono One`.
- Use only shared data (`src/data/*.js`) and shared components (`src/components/*.astro`) for content; never fork the data.
- Build: `tokens.css`, `theme.css`, `motion.js`, `Nav.astro`, `Footer.astro`, and the five pages under `src/pages/comics/`.
- Respect `prefers-reduced-motion`: every animation collapses to its final state instantly.
- Entrance sequence ≤ 1.2s, hover + active states everywhere, one reward moment on quiz-correct, one celebration on quiz-complete, animate only `transform`/`opacity`/`stroke-dashoffset`/`clip-path`.
- View Transitions via Astro's `<ClientRouter />` with a direction-specific `::view-transition` style (Comics: red band wipe).
- Verify with `npm run build`, then screenshot all five pages at 1440 and 390 wide, saved to `screenshots/comics/`.
- Do not touch another direction's folder or the shared files.
