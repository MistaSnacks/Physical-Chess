# Roda Quest — direction brief for Agent 3

Paper file: `01M017JHZGTKX64S7G2TBPBBKH`
Artboards: map `ED-0`, quiz `EE-0`, mobile `U9-0`

Before coding: call `mcp__paper__get_screenshot` on the three artboard IDs above, and
`mcp__paper__get_jsx` on the dashboard/map artboard (`ED-0`) to copy exact colors, radii,
borders, shadows, type sizes and spacing.

---

## SPEC.md §5.2 — `/quest` — Roda Quest (verbatim)

Paper: map `ED-0`, quiz `EE-0`, mobile `U9-0`

- Ground palm shadow `#0B2E24`, surface deep leaf `#154334` / border `#1E5A46`, hibiscus `#FF4F7A`, mango `#FFB238` (+ shadow `#7A4A00`), firefly lime `#B9F26B` (+ shadow `#4E7A22`), cream `#FFF6E5`, muted `#9FC4B3` / `#7FA894`.
- Lilita One display (56 / 40 / 26), Nunito 800 labels with 0.1em tracking, Nunito 600 body.
- Dashboard **is the map**: SVG winding path, 96px nodes with 6px ink border and 8px drop, current node 120px with dashed halo and "YOU ARE HERE!" flag, gold rotated gate for the next corda, HUD panel (avatar, MAYA, corda, XP bar, 3 stats, Batizado card), "NEXT UP" mango pill. Stars scattered on the ground, two soft stage-light circles.
- Real photos live inside the nodes as circular masks (heroWorkshop for the current node; done nodes show a check over a dimmed photo) and in a "latest from the roda" video card.
- **Motion:** path draws on (stroke-dashoffset, 1.2 s), nodes pop in along the path with stagger, the current node pulses (halo scale 1 → 1.08) and the flag bobs; XP bar fills; mascot Mestre Bira (SVG figure in a mango circle) breathes; quiz hearts shake on a wrong answer, correct answer bounces lime and the "+50 XP" chip flies up to the HUD; boss-quiz completion = screen-wide lime flash + confetti in hibiscus/mango/lime.
- Screen mapping: Home = night sky hero with video; Movements = map node detail with lesson steps in the left "level rail"; Music = boss quiz; Batizado = the gate opens (Corda Amarela gate animates open to reveal the ceremony and gallery).

---

## Reminders from SPEC.md §3 / §6 (apply to every direction)

- Astro 5, `output: 'static'`, no UI framework, no CSS framework, no animation library. Motion is CSS keyframes + Web Animations API + IntersectionObserver.
- Fonts already linked in `Base.astro`: `Fredoka:wght@400..700`, `Nunito:wght@400..900`, `Lilita One`, `Bangers`, `Rubik Mono One`.
- Use only shared data (`src/data/*.js`) and shared components (`src/components/*.astro`) for content; never fork the data.
- Build: `tokens.css`, `theme.css`, `motion.js`, `Nav.astro`, `Footer.astro`, and the five pages under `src/pages/quest/`.
- Respect `prefers-reduced-motion`: every animation collapses to its final state instantly.
- Entrance sequence ≤ 1.2s, hover + active states everywhere, one reward moment on quiz-correct, one celebration on quiz-complete, animate only `transform`/`opacity`/`stroke-dashoffset`/`clip-path`.
- View Transitions via Astro's `<ClientRouter />` with a direction-specific `::view-transition` style (Quest: fade through palm-shadow).
- Verify with `npm run build`, then screenshot all five pages at 1440 and 390 wide, saved to `screenshots/quest/`.
- Do not touch another direction's folder or the shared files.
