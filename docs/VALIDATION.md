# Fan Edition 02 — validation record

Validated in the actual cloud checkout with Node 24.19.0, npm 11.9.0, Vite 6.4.4 and system Chromium. This records executed checks, not a claim that the entire original roadmap is finished.

| Check | Outcome | Evidence |
| --- | --- | --- |
| `npm test` | 26 passed, 0 failed, 0 skipped | All move delivery types, collision/support, falls, terrain creation/removal, status/cooldown rules, illegal commands, downhill aiming, timer/practice, death/draw, replay state hashes, AI completion on all three maps |
| `node checks/browser.mjs` | Passed | Real UI selection and execution of all 12 moves; settings persistence; walking/jumping; pause freezes state; guide/log; hot-seat handoff; computer defeats player and opens results; rematch resets health; phone layout has no horizontal overflow; no page errors |
| `node checks/ui-regressions.mjs` | Passed | Volume 0 survives reload; pointer aiming follows the responsive camera; movement and Space attack work after focusing a slider |
| `npm run build` | Passed | Production `dist/` and approximately 84 KB self-contained `play.html`; no external runtime assets |
| `npm run test:portable` | Passed | Exact standalone HTML bytes loaded into offline browser document; summon/terrain impact/turn handoff; zero HTTP requests, no runtime errors, correct responsive dimensions, attack controls visible at 1366×900 |
| Visual review | Checked in Chromium | Menu, arena, summon, results, portable build and 390-pixel-wide mobile screens captured and inspected |

The cloud Chromium administrator policy blocks `file://` navigation. The portable test uses `page.setContent` with the exact `play.html` bytes in offline mode. Actual double-click launch in a personal Mac browser, Safari/Firefox/Edge behavior, real touch devices, sound quality and human balance feedback remain manual validation. Do not describe those as tested.

The AI completes seeded matches via the same `commit` and `step` rules used by people; three regression matches reach a real winner rather than timing out or being marked passed after zero turns. This does not establish optimal play or balance across every map seed.

Animation/terrain edit workloads are bounded: fixed world mask, cached scenery, capped particles, bounded shot search and projectile lifetime. Extended FPS/memory/long-session profiling has not been completed. The renderer updates terrain while beams excavate it, so slower devices may need additional optimization.

## Resolved during this rebuild

- Ambiguous absolute-angle controls replaced by facing plus elevation and pointer aiming.
- Fixed-speed themed shots replaced by nine delivery mechanisms and explicit tactical/status rules.
- Missing solo opponent replaced by command-based AI and tested end-to-end victory.
- Small undifferentiated art replaced by six outlined procedural sprites, species-specific projectile visuals and summon/attack/recall choreography.
- Terrain support/body collision and fall/sea outcomes now have regressions.
- Control enabling now follows phase transitions immediately.
- Keyboard input remains usable after interacting with sliders; zero volume remains zero after reload.
- Laptop controls fit with a responsive world camera rather than stretching sprites.
- Downloaded builds no longer require users to install Node or run a local server.

## Not delivered in this offline release

Online networking/reconnection, editable team builder, persistent Pokémon Battle, broad terrain overlays/ice, campaign/progression, saved matches/replay UI, gamepad/remapping, licensed production assets, broad device certification and extended balance/performance testing. These remain documented future work, not hidden or nonfunctional menu choices.
