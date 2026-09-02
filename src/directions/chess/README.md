# Grandmaster Roda — direction brief for Agent 5

Paper file: `01M017JHZGTKX64S7G2TBPBBKH`
Artboards: board `XN-0`, puzzle `XO-0`, mobile `XP-0`

Before coding: call `mcp__paper__get_screenshot` on the three artboard IDs above, and
`mcp__paper__get_jsx` on the board artboard (`XN-0`) to copy exact colors, radii,
borders, shadows, type sizes and spacing.

---

## SPEC.md §5.4 — `/chess` — Grandmaster Roda (verbatim)

Paper: board `XN-0`, puzzle `XO-0`, mobile `XP-0`

- Bone `#F3EEE4`, ink `#0F0F0F`, kingfisher `#1D5DFF`, legal-move lime `#C6F547`, capture orange `#FF7A1A` (one use per screen), muted `#9A927F`, rule `#E4DCCB`. No radii at all. Borders 3–4px ink, shadows `6px 6px 0` / `10px 10px 0` ink.
- Rubik Mono One display (62 / 28 / 14–16, all caps), Nunito 900 labels 0.1–0.16em tracking, Nunito 600 body.
- Dashboard = checkerboard floor (120px squares) running off the right edge; modules are tiles standing on squares (done = white tile with pawn, current = kingfisher tile with orange knight on a lime square, locked = dashed outline with padlock), a knight-jump arrow, lime legal-move dots, an orange rotated "YOUR MOVE" flag; left column: eyebrow, "YOUR MOVE, MAYA.", promotion track (pawn/knight/bishop/rook/queen), scoresheet MOVE LIST with notation, "MAKE YOUR MOVE →" button.
- Real photos: the checkerboard's light squares occasionally hold a photo (2–3 squares), the position panel on the quiz becomes a photo with the board grid overlaid; the Batizado gallery is laid out on a board (photos on alternating squares).
- **Motion:** squares fade in in a checker wave (diagonal stagger), tiles slide onto their square, the knight arrow draws on, the lime dots pulse, chess clock ticks down for real (Maya's side counts), correct answer = "CHECK!" bar slams down and the piece on the position panel jumps to its square; finishing the quiz = "CHECKMATE" full-screen with the board flipping (3D rotateX).

---

## Reminders from SPEC.md §3 / §6 (apply to every direction)

- Astro 5, `output: 'static'`, no UI framework, no CSS framework, no animation library. Motion is CSS keyframes + Web Animations API + IntersectionObserver.
- Fonts already linked in `Base.astro`: `Fredoka:wght@400..700`, `Nunito:wght@400..900`, `Lilita One`, `Bangers`, `Rubik Mono One`.
- Use only shared data (`src/data/*.js`) and shared components (`src/components/*.astro`) for content; never fork the data.
- Build: `tokens.css`, `theme.css`, `motion.js`, `Nav.astro`, `Footer.astro`, and the five pages under `src/pages/chess/`.
- Respect `prefers-reduced-motion`: every animation collapses to its final state instantly.
- Entrance sequence ≤ 1.2s, hover + active states everywhere, one reward moment on quiz-correct, one celebration on quiz-complete, animate only `transform`/`opacity`/`stroke-dashoffset`/`clip-path`.
- View Transitions via Astro's `<ClientRouter />` with a direction-specific `::view-transition` style (Chess: checker wipe).
- Verify with `npm run build`, then screenshot all five pages at 1440 and 390 wide, saved to `screenshots/chess/`.
- Do not touch another direction's folder or the shared files.
