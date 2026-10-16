# Arsenal & Scale Edition 05 — executed validation

Validated in the checkout with Node 24.19.0, npm 11.9.0, Vite 6.4.4 and system Chromium. This supersedes the Edition 04 report. No tests are skipped or disabled to obtain the results.

| Check                              | Result                                             | Evidence                                                                                                                                                                                                                                   |
| ---------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Simulation suite                   | 61 passed, no failures/skips                       | Existing rules, replay, content/assets, draft, terrain/materials, physics and AI checks plus 13 arsenal/scale regressions                                                                                                                  |
| Safe starts                        | 140 fixtures                                       | Seven shapes × two reliefs × ten seeds; both trainers settle without damage or embedded collision                                                                                                                                          |
| Expanded arsenal reach/role matrix | 2,240 cases passed                                 | 40 moves × seven shapes × two reliefs × two seeds × both sides; 2,072 ordinary damaging outcomes, 56 delivered/resolved floods, 56 local rescues, 40 sniper hits, 16 intended sniper cover blocks; 18 cases required small aim corrections |
| CPU accuracy                       | Rookie 22/60, Trainer 44/60, Ace 60/60 hits        | Identical Dragon Rage, health, alternating sides and seeded rolling/valley/basin fields; mean damage 7.7 / 16.4 / 26.0                                                                                                                     |
| Full-match difficulty              | Ace 20 wins, Rookie 0, no draws/unfinished matches | Fixed exclusive random teams, 350 HP, seven silhouettes, two reliefs, three sceneries and alternating sides/openers; 7–14 attack turns                                                                                                     |
| Gameplay browser suite             | Passed                                             | Draft inspection/confirmation, CPU snake picks, random rerolls, real attacks, input, movement, ammo, pause, solo victory, rematch/series, preferences and mobile layout; no page errors                                                    |
| Revision browser suite             | Passed                                             | Seven previews, persistent profiles, shape/relief/HP/opener, inspector tabs, persistent aim arrow with guide off, camera stability, responsive layout and all aiming-lesson steps                                                          |
| Arsenal browser sequence           | Passed                                             | Legal UI-only draft, camera zoom/minimap without changing aim, Earthquake creates pit → Water Spout deals 80 in 10-point ticks → pool drains → next turn; Dugtrio moves 220 px without enemy damage; precision/rescue control states       |
| Terrain render comparison          | Passed, five edits                                 | Incremental cache matches a fresh full renderer byte for byte after craters, earth creation, large excavation and ice; observed incremental rebuilds 4–9 ms in this cloud run, not a device performance guarantee                          |
| Effect/sprite catalog              | Passed                                             | 40 distinct rendered impact definitions; all 20 pinned animated sprites decode to multiple distinct composited frames                                                                                                                      |
| Actual-renderer showcase           | Passed                                             | Captures live Hydro Pump, retained water, rescue Dig, Mud Bomb, Octazooka, Swift and Earthquake using real simulation phases                                                                                                               |
| Production packaging               | Passed                                             | `dist/` and self-contained `play.html`, approximately 1,547 KB with assets/notices embedded                                                                                                                                                |
| Offline portable document          | Passed                                             | Exact standalone bytes loaded with network disabled; 20 sprites, draft, aimed attack, damage, terrain edit and handoff; zero HTTP requests/runtime errors; attack button fits at 1366×900                                                  |

## What the new checks establish

A direct Octazooka body/head contact deals 100; a near miss deals no splash damage; terrain blocks it. Strong/weak damage budgets and HP presets are explicit. Hydro Pump launches a single damaging rocket rather than the former four-pulse stream.

A finite Water Spout reservoir retains enough water in a deep pit for eight 10-damage ticks. Open flat ground spills it and cannot become a persistent damaging wall. After pouring, the pit surface becomes level. Pools drain before turn handoff; grid/reservoir state deep-copies in forks and affects deterministic state hashes. The actual browser combo verifies these rules through game controls, not by mutating its live battle.

Dugtrio travels gradually through a real carved corridor, consumes its attack/ammo, exits a pit and does not damage the opponent. Mud creates collidable earth banks without embedding the target and reduces the next movement allowance by 30%. Earthquake removes over 40,000 terrain cells in its fixture with only 18 base damage. Swift steers only inside its approach radius. Rookie has zero trajectory traces/aftermath forecasts and deterministic imperfect target estimates.

Range checks now assert the intended role. Utility Dig must rescue locally, not damage a far opponent. Water Spout must deliver a finite pool near the rival and resolve all pulses; it need not damage someone on open ground. Octazooka must hit exposed trainers or stop at real cover. Other moves still need a legal damaging shot in the tested layouts. The matrix does not guarantee arbitrary aim or guarantee hits after earlier terrain changes.

## Issues caught and corrected

- Enlarging the world without separating viewport coordinates clipped previews and misinterpreted field clicks. Renderer/camera/input now share explicit world/viewport transforms.
- Rookie still searched for accurate trajectories like higher levels. It now estimates a shot independently; measured misses establish the difference.
- Upper-body sniper collisions could lie outside the generic splash radius and deal zero damage. Explicit direct contacts now bypass that splash-distance gate.
- A finite fluid grid initially retained a numerical water mound. Spill drainage and connected pressure equalization now create a level retained pool.
- Earth creation could leave old grass below a new surface. Terrain cache invalidates the affected vertical strip and recomposes decorations; exact image comparisons verify the fix.
- Clipping antialiased decorations at dirty edges produced small pixel differences. Base terrain updates remain incremental; decorations recompose consistently.
- At overview scale the aim arrow became too thin. It now keeps its screen size across zoom levels.
- Repeated damage numbers overlapped. Closely simultaneous hits combine visually; separate ticks rise farther and expire sooner.

## Boundaries

The administrator browser policy prevents direct `file://` navigation. The portable check loads the exact standalone document bytes into an offline Chromium page and verifies zero HTTP requests. Actual Mac double-click/Safari behavior, Firefox/Edge, audio quality, real touch/controller use, accessibility review and modest-device long-session performance remain manual checks.

The accuracy benchmark measures one ordinary shot on a fixed set, not every weapon or human difficulty. The full-match benchmark is a reproducible regression set, not a universal win-rate prediction. Some battles still end through terrain displacement. Human playtesting should examine manual aiming, match length, weak drafts, opener advantage and water/cover counterplay. A distinct effect image does not establish good animation or game feel.

Water is local and bounded, not a whole-map fluid solver. Pokémon use imported front/idle GIFs with procedural choreography, not official attack footage or newly drawn species sheets. Trainer art is original. Vite's large-chunk advisory reflects embedded assets. Online/reconnect, squads, persistent Pokémon Battle mode, saved matches, progression and controller/remapping remain future scope.
