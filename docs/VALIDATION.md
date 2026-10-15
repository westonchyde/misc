# Draft Edition 03 — executed validation

Validated in the actual checkout with Node 24.19.0, npm 11.9.0, Vite 6.4.4 and system Chromium. The previous Fan Edition 02 report is superseded by this record.

| Check | Result | What executed |
| --- | --- | --- |
| Frozen installation | Passed | `npm ci --cache /tmp/battlefront-npm` from the committed lockfile, including `gifuct-js` |
| `npm test` | **31 passed; 0 failed/skipped** | Content, all 18 asset checksums, deterministic/exclusive teams, snake order, CPU picks, ownership/ammo/cooldowns, terrain/physics, status rules, supply exhaustion, relay timing, salvos/clusters, cover creation, replay hashes, AI completion and arc targeting |
| Move reach subcases | **216 passed** | All 36 moves actually damage an opponent from each starting side on each of the three maps; surviving bodies remain collision-free after settling |
| Browser gameplay | Passed | Sprite loading; manual exclusive draft; two consecutive CPU snake picks; random rerolls; six-member drafted HUD; long-range relay and projectile hits; ammo consumption; pointer/manual/keyboard aiming; jump/move; pause; logs; solo CPU victory; rematch with same teams; saved settings and no horizontal phone overflow; no page errors |
| Visual/sprite catalog | Passed | All 36 effects render to different image hashes; all 18 sprites have multiple distinct composited GIF frames; catalog screenshot inspected |
| Production build | Passed | `dist/` and standalone `play.html`, approximately 1.4 MB including embedded original sprite assets and library notices |
| Offline portable document | Passed | All 18 sprites decode without HTTP; draft, aimed long-range attack, actual damage, terrain edit and next turn; zero HTTP requests and no runtime errors; attack button fits at 1366×900 |
| Difficulty benchmark | **Ace 19 / Rookie 1 / 0 draws / 0 unfinished** | Twenty fixed seeded games, alternating Ace side, random nonoverlapping drafted teams, three maps, same legal commands/damage/HP/resources; 5–18 attack turns |

## Interpreting the evidence

Reach tests search for a legal damaging shot using the actual simulation; they do not merely compare a nominal range number. Cover, bad aim, a falling trainer or terrain edited during an attack can still change a shot's result. The tests cover the selected default seed on all maps, not every possible generated layout.

The benchmark is reproducible with `npm run benchmark:ai`. It demonstrates difficulty separation in that fixed regression set, not a universal 95% win rate or a completed human balance study. Difficulty changes drafting, search resolution/refinement, tactical weights, move selection, ammo conservation, movement and uncertainty. All levels use the same authoritative resource/physics/combat rules.

The custom effect catalog can be regenerated with `node checks/effects.mjs` against the dev server. The effects use original rendering/choreography around actual animated Pokémon sprites; these are not ripped official attack-animation sequences. Source GIFs are preserved with pinned source URLs, checksums and separate image ownership attribution.

## Issues found and fixed during this revision

- Short-range-only moves were unusable from default spawn distances: replaced them with full-map arcs and relay summons. Only three full-arena beams remain.
- Invented move names and six shared unlimited partners: replaced with 36 real move names, 18 Pokémon, exclusive pre-match drafting and finite resources.
- Difficulty was mostly aim jitter: added substantive search, tactical/resource/draft and movement differences, with measurable match outcomes.
- A marginal Ice Beam solution could miss after aim uncertainty: added alignment scoring so fine search centers its beam.
- Old knockback values became excessive when applied at full range: globally scaled impulses to 0.58, avoiding trivial early full-health ring-outs in the measured matches.
- Re-entering a draft after a match exposed stale telemetry: draft/home state now follows the visible screen.
- Relay attack effects initially appeared before emergence: arrival is now an opening flash; move effects follow attack resolution.
- Snarl could weaken periodic burn/poison ticks: periodic damage now remains independent of attack weakening.
- Pointer direction/power scaling made distant clicks overshoot badly: added optional actual-trajectory click-to-target search; classic manual controls remain available.

## Validation boundaries

Cloud Chromium blocks direct `file://` navigation by administrator policy. The portable check loads the **exact standalone HTML bytes** into an offline browser document. Actual double-click launch on a personal Mac, Safari/Firefox/Edge behavior, audio quality, real touch devices, comprehensive accessibility review, human balancing, and extended memory/FPS/long-session performance are still manual checks.

Vite's large-chunk advisory is expected because the portable deliverable embeds about 1 MB of original GIFs. The game caps composited frames and particles, caches terrain/backgrounds, shares trajectory calculations, and bounds AI candidate search; this does not establish a frame-rate guarantee on every device.

Online networking/reconnect, persistent Pokémon Battle, global terrain ice/fire/wetness, campaign, saved matches/replay UI and controller/remapping remain future scope. Drafting and random teams are implemented, not placeholders.
