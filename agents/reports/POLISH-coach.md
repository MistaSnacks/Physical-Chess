# Polish report — coach
- Reworked `/coach/*` and `/admin/roles` into a consistent coach workspace with clearer hierarchy, spacing, focus states, touch targets, responsive rosters, and calmer operational copy.
- Refined class mode for shared tablets and verified the player-card room layout at 1024px as well as 1440px and 390px.
- Made the community berimbau the `/turma` hero, then replaced the rank list with an XP podium and a separate Roda Weeks podium, each limited to the top three plus the current player.
- Changed leaderboard consent to default off in local, Wix, server normalization, demo-family seed, Family settings, and the matching spec data-model line; the extra demo families retain explicit opt-ins so the feature remains reviewable.
- Kept community XP visible for every player, added the default-private notice, and invalidated old leaderboard cache shapes before showing streak data.
- Polished `/desafio` challenge and completion states without adding an idle animation or dependency; reduced-motion behavior remains inherited from Quest.
- Corrected coach attendance defaults to use the New York calendar day and added live status feedback to attendance, roles, and async board regions.
- Verified the final build, all 21 unit tests, `SMOKE OK` on port 4416, no 390px overflow, 44px scoped controls, and the screenshots in `screenshots/polish/coach/`.
- Nothing is blocked; Camren still needs to confirm the open leaderboard policy in SPEC §10 question 6 before the temporary default-off decision changes.
