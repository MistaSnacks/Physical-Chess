# Codex polish pass — instructions

You are polishing ONE direction route of the Physical Chess Showcase. The route is given in the first line of your prompt as `ROUTE=<sticker|quest|comics|chess>`. Work only inside `src/directions/<ROUTE>/`, `src/pages/<ROUTE>/`, and `screenshots/<ROUTE>/`. Three other Codex runs are polishing the other routes at the same time in this repo: never edit shared files (`src/data`, `src/components`, `src/layouts`, `src/styles/base.css`, `src/pages/index.astro`), never run `npm install`, never `git commit`, never kill processes by name (use PIDs only).

## Read first
1. `SPEC.md` (all of it; §2 screens, §5.<n> your direction, §6 motion rules, §8 acceptance checklist).
2. `src/directions/<ROUTE>/README.md`.
3. Every file already in your two folders, then the shared data/components they import.
4. The existing screenshots in `screenshots/<ROUTE>/` (open the PNGs).

## What "polish" means here
The client (a kids' capoeira program, ages 7–13) rejected the first designs as not visually striking enough. Your job is to make this route unmistakably striking, kid-appealing, and alive, while staying faithful to the direction's palette, type, and Paper design values in SPEC §5. Concretely:

- **Audit against SPEC §2 + §5 + §8** and fix every gap: missing screen content, missing real photos/videos, missing animations, hard-coded progress numbers, missing reduced-motion fallbacks, credits missing on videos, copy not verbatim on Batizado.
- **Raise the motion quality**: entrance sequence ≤ 1.2 s with proper easing (spring-like cubic-beziers, staggered), one deliberate idle loop, real hover/active states, the direction's reward moment on `quiz:correct` and celebration on `quiz:done`. Animate only transform / opacity / stroke-dashoffset / clip-path. No jank, no layout thrash.
- **Raise the visual quality**: type hierarchy and contrast, spacing rhythm, real photos cropped well (use the `wix(key, w, h)` helper for crops ≤ 1600px wide), no empty or dead areas, no overflow at 1440 or 390, no overlapping elements, no unreadable text on photos (add the direction's own scrim treatment).
- **Kid appeal**: bigger, bolder, friendlier. Copy should be short and encouraging, in the direction's voice.
- Keep the direction distinct: do not borrow another route's look.

## Verify before you finish
- `npm run build` passes with zero errors.
- Start `npm run preview -- --port <PORT>` (PORT is given in your prompt) in the background, then screenshot all five pages at 1440x900 and 390x844 with headless Chrome:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --window-size=1440,900 --screenshot=screenshots/<ROUTE>/<page>-desktop.png http://localhost:<PORT>/<ROUTE>/<page>` (and `--window-size=390,844` → `<page>-mobile.png`).
- Look at every screenshot and fix what is wrong. Repeat until clean. Kill the preview server by PID.

## Report (print at the end)
1. Defects found and fixed (bullet list).
2. Animations added or improved.
3. Anything in SPEC you could not satisfy and why.
4. Screenshot paths.
