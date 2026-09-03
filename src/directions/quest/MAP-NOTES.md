# Roda Quest dashboard map — required fixes (second pass)

Compare `screenshots/quest/dashboard-desktop.png` with the Paper map (artboard `ED-0`, screenshot via `mcp__paper__get_screenshot`). The live map is a straight diagonal line with four small nodes. It must become the winding adventure map:

1. **Winding path.** Replace the straight line with an S-curve built from cubic beziers that spans the whole map area (roughly x 440→1400, y 140→860 at 1440 wide), like the Paper path: `M560 720 C600 640,680 560,760 560 C850 560,900 700,980 640 C1060 580,1080 460,1180 460 C1260 460,1180 300,1040 260 C960 240,1140 150,1280 180`. Cleared segments are solid lime 14px; the road ahead is cream 10px with `stroke-dasharray: 4 26`, 55 % opacity. Path draws on with stroke-dashoffset on entrance.
2. **Richer nodes.** Keep the four modules as the big stops (96px done/locked, 120–150px current with the dashed hibiscus halo and the "YOU ARE HERE!" flag), but also place every lesson from `curriculum.js` as a small 28px dot along the curve between its module's stop and the next (lime if completed, cream outline otherwise, dim if locked). Compute positions along the SVG path with `getPointAtLength()` at build time or in `motion.js`, so the layout is data-driven.
3. **Gate placement.** The gold Corda gate sits at the end of the path, top-right, with clear space; it must never overlap a node or label. Its label pill goes below it.
4. **Photos in nodes.** Done stops show a dimmed real photo with a lime check; the current stop shows `HERO_CANDIDATES[0]`; locked stops are deep leaf with the padlock.
5. **Ground.** Keep the two stage-light circles and the star field; add a faint dashed "trail glow" under the cleared segment.
6. Mobile (390): the map becomes a vertical winding path with the HUD above it; nodes 72px; no horizontal overflow.
7. Idle motion: current-node halo pulse, flag bob, and the mascot breath. Entrance ≤ 1.2 s: path draw, then nodes pop in along the path order with 60 ms stagger.

Verify with screenshots at 1440 and 390 before finishing, and keep everything else on the page intact.
