# Journey polish report
- Rebalanced `/journey` so the live HUD, map, next lesson, and latest video read as one clear progression.
- Moved “Next up” ahead of the long curriculum map at mobile widths and kept every journey action at least 44 px.
- Tightened HUD spacing, XP wrapping, stat alignment, Batizado copy, focus states, and hover/active lift.
- Gave the real Brooklyn roda video a usable 16:9 card at both 1440 and 390 instead of a cramped media chip.
- Limited the journey to one idle loop, shortened reward bursts/confetti, and fully collapsed motion in reduced-motion mode.
- Made level-up a labeled modal, restored focus on dismissal, and added smooth reward exits without changing game events.
- No dependencies or data-flow APIs changed; Camren should confirm the Batizado date while the UI continues to show “date TBC.”
- Verified build, 20 tests, `SMOKE OK`, reward event states, focus restoration, and zero horizontal overflow at 390.
