# Terrain & Tactics Edition 04 — executed validation

Validated in the actual checkout using Node 24.19.0, npm 11.9.0, Vite 6.4.4 and system Chromium. This supersedes the Edition 03 validation report. No tests are marked skipped or disabled to obtain these results.

| Check                        | Result                                         | Evidence                                                                                                                                                                                                                                                      |
| ---------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen installation          | Passed                                         | `npm ci --cache /tmp/battlefront-npm`, 20 packages installed using the lockfile                                                                                                                                                                               |
| `npm test`                   | **48 passed; 0 failed/skipped**                | Existing combat/content/assets/draft/replay/AI regressions plus 17 new tests for silhouettes, profiles, forks, materials, fragments, ice, tunneling and forecasting                                                                                           |
| Spawn stability              | **140 terrain fixtures passed**                | Seven silhouettes × two reliefs × ten seeds; both trainers settle without damage or embedded collision                                                                                                                                                        |
| Original reach checks        | **216 passed**                                 | Every move actually damages an opponent from both sides on each default scenery/map configuration; surviving trainers settle outside terrain                                                                                                                  |
| Expanded terrain reach       | **2,016 passed**                               | 36 moves × seven shapes × two reliefs × two seeds × both sides; actual attacks resolve through the simulation. No small corrective adjustments were required in the final run                                                                                 |
| Revision browser checks      | Passed                                         | Seven distinct authoritative previews, saved name/skin/headwear/palette, inspect before confirming, both move tabs, selected shape/relief/HP/opener, aim arrow with prediction disabled, stable camera, mobile overflow and all five interactive lesson steps |
| Offline portable document    | Passed                                         | Exact `play.html` bytes, offline; all 18 sprites decode, draft/random teams, assisted shot, real damage/terrain edit and next turn; zero HTTP requests, no runtime errors; attack button fits at 1366×900                                                     |
| Production build             | Passed                                         | `dist/` and self-contained `play.html`, approximately 1,495 KB; library notices and all source GIF assets embedded                                                                                                                                            |
| Gameplay browser suite       | Passed                                         | Exclusive inspect/confirm snake draft, CPU double picks, random rerolls, combat, resources, input, pause, solo victory, series/rematch and responsive layout                                                                                                  |
| Legacy effect/sprite catalog | Passed                                         | Rendering of the 36 move glyph definitions and distinct composited frames for all 18 sprites                                                                                                                                                                  |
| Difficulty benchmark         | **Ace 20 / Rookie 0 / 0 draws / 0 unfinished** | Twenty fixed seeded games across seven silhouettes, both reliefs, three sceneries, 240 HP and alternating starting relationships; 3–15 attack turns                                                                                                           |
| Actual-renderer showcase     | Passed                                         | Captured in-simulation Flamethrower, Hydro Pump, Rock Blast and Dig at their real attack/flight phases; visual review alongside full battle, mountain, draft and trainer screens                                                                              |

## What the added tests establish

Rocks reflect before their final collision. Seed/meteor/lava fragments have independent positions, velocities and terrain contacts. Hydro Pump launches four pressure pulses with bounded impulse and leaves actual runoff. Water extinguishes ground fire and can prevent immediate reignition. Overlapping ground hazards do not damage every frame and expire on their specified turn. Water moves downhill. Thunderbolt crosses connected wet patches and stops at dry gaps. Ice Beam creates real collision, and melting preserves original earth. Earthquake's delayed ruptures and Dig's traveling excavation resolve before handoff.

Battle forks preserve RNG and simulation state while isolating terrain, trainers and material mutations. Higher AI levels forecast attacks without modifying live HP, terrain or turn ownership; Rookie does not run aftermath forecasts. Player profiles do not change combat statistics.

Range checks establish a damaging legal shot in the tested layouts, not a guarantee that arbitrary aim hits. Dynamic fragments, cover, movement and earlier terrain changes can alter later contacts. Seeds outside the regression matrix still need exploration. The catalog only establishes that the underlying drawing functions render different images and sprites animate; it does not establish tactical diversity or animation quality. The showcase uses the actual simulation and renderer rather than invented attack illustrations.

The CPU benchmark is a reproducible regression set, not a universal win-rate prediction or a human difficulty study. Some matches still end quickly through environmental displacement. Human testing should examine Rookie difficulty, manual aiming, material counterplay, match length, weapon usage and opening-player advantage.

## Issues found and fixed during this revision

- The full-guide switch also removed aiming direction: direction arrows and numeric field feedback now draw independently.
- Camera scale depended on the selected guide/arc: framing now uses the battlefield silhouette and trainer positions.
- Flattened spawn shelves could form movement-blocking steps: shelf edges now blend into the surrounding surface.
- Earlier bouncing rocks could change terrain before later rocks arrived, invalidating nominal aim: CPU forecasting evaluates alternative actual attacks rather than trusting only a single traced centerline.
- Multi-pulse water and secondary molten fragments multiplied knockback into rapid full-arena ring-outs: per-contact forces and water lift are bounded separately.
- The initial forecast shortlist accidentally evaluated one Rookie candidate despite a zero budget: the zero-budget branch is now explicit and tested.
- Laptop/mobile control tracks could expand beyond the viewport: grid children and slider tracks now shrink within the console.
- The aiming lesson originally selected a recharging secondary, blocking a second correction shot: it now uses an available primary for both shots.
- Repeated wet/fire labels overlapped: nearby same-material patches share visual label spacing, and temporary ice has its own expiry labels.
- Legacy impact geometry obscured some new material effects: signature material impacts and physical-fragment debris use the new material renderer.

## Validation boundaries

The cloud browser blocks direct `file://` navigation by administrator policy. The portable test loads the exact standalone document into an offline browser and asserts no HTTP requests. Actual Mac double-click/Safari behavior, Firefox/Edge, audio quality, real touch/controller use, comprehensive accessibility review and long-session/device performance remain manual checks.

Vite's large-chunk advisory is expected because the portable document embeds about 1 MB of original GIFs. Simulation/AI budgets, capped sprite frames/particles/materials and cached terrain limit work, but do not establish a frame-rate guarantee on modest hardware. Water is a bounded surface-patch model; Pokémon attacks still use the imported front/idle assets with procedural choreography.

Online/reconnection, squads, persistent Pokémon Battle mode, saved matches, progression and controller/remapping remain future scope. Ground wet/fire/poison and temporary ice are implemented in this revision; they are no longer merely roadmap entries.
