# Playability rebuild inventory

The first prototype runs, but execution alone is not a satisfying game. This is the acceptance inventory for the second playable milestone.

## Required in this rebuild

- **Match loop:** title/setup screen; solo vs AI, shared-keyboard duel and target practice; three seeded maps; start, pause, help, results, rematch and return to setup. Controls explained before playing. Distinguish playable modes from future scope.
- **Input and aiming:** intuitive facing + elevation, useful trajectory/beam/target previews using authoritative simulation, click-to-aim, keyboard and touch movement, meaningful movement budget, visible blocked/cooldown reasons, no losing input after clicking a button. Preserve per-player selection.
- **Physics and terrain:** swept projectiles, trainer body collision, slope stepping, supported jumps, fall damage, sea elimination, reliable crater settling, terrain creation that cannot entomb trainers, safe spawn placement. Seeded wind. Remove turn-advancement timeouts that hide unstable bodies. Bound flights and settle persistent velocities explicitly.
- **Moves:** six tactical species and twelve distinct attacks. Arcing fire, widening flame cone, water jet, water bomb, electric strike, electric orb, boulder, rock cover, spectral shot through cover, disruption ray, body slam and tunneling. Different delivery, terrain response, knockback, status and counterplay. Enforce cooldowns; no trainer type advantages. AI follows the same legal commands.
- **Art:** larger outlined trainer sprites with facing, walking, throwing, jumping and hurt poses; six recognizable hand-drawn creature sprites with animated body parts; distinctive projectiles; layered detailed terrain/sky/water/decor; readable player labels and shadows. No downloaded or ripped character art.
- **Summon and attacks:** thrown rotating ball, opening flash, creature emergence, anticipation, species-specific attack pose, actual attack from summon muzzle, trails/impact/debris, recoil/knockback, return beam and ball recall. Keep creatures visible through their attack. Reduced effects option. Animation driven by simulation phases.
- **Feedback:** active-player marker, HP and damage numbers, wind, timer, movement meter, cooldown chips, status durations, trajectory endpoint and danger radius, chronological turn log, sound cues, match results and statistics. Keep controls disabled with a reason while resolving.
- **AI:** bounded deterministic shot search, trajectory evaluation, self-damage penalty, status/cooldown choices, legal movement when blocked, clear thinking feedback, selectable difficulty; reproducible complete matches.
- **Persistence/accessibility:** local versioned preferences, sound/volume, reduced motion and aim-guide options, legible contrast, keyboard focus, semantic buttons, responsive controls, no external font dependency.
- **QA:** move behavior and damage tests, body collision/support/falls/terrain creation regressions, statuses/cooldowns/command validation, replay hashes, AI match completion, browser control/pause/turn/rematch paths, screenshots of menu/battle/summon, production build.

## Explicit later scope

Online play and reconnection; editable teams beyond the fixed six; persistent Pokémon Battle mode; frozen water and broad environmental simulation; campaign/unlocks; remappable controls/gamepad; licensed production art; cross-browser/manual usability and extended performance testing. These are not presented as completed or selectable fake modes.

## Current release evidence

See README and the final validation report. This file records intended acceptance criteria, not automatic claims that every item has passed.

## Rebuild disposition

Implemented: the offline match flow, three modes/maps, six animated procedural partners, twelve moves/nine delivery types, fixed-step physics and terrain, cooldowns/statuses, bounded AI, menus/HUD/log/results, pointer/keyboard/touch buttons, versioned preferences, synthesized audio and a self-contained downloadable game. Tests and limits are recorded in [VALIDATION.md](VALIDATION.md).

Partially covered: sprites/attack poses are procedural fan art rather than production animation sheets; summon placements are presentation actors rather than independently colliding combatants; no expanded team editing; slow-device/long-session profiling and manual accessibility/cross-browser reviews remain outstanding. These limits do not block the tested offline match loop, but they matter for a production release.
