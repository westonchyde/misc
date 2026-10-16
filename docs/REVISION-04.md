# Terrain & Tactics — Fan Edition 04

This revision implements the next substantial two-trainer artillery pass from the Pocket Tanks audit. It keeps the 18 animated Pokémon sprites and 36 moves. It does not introduce squads or claim the entire long-term roadmap is complete.

## Playing

Download the current repository ZIP, unzip it and open `play.html`. The game includes its assets and runs offline without a server or Terminal. Existing downloads must be replaced to receive updates. The header identifies this build as **FAN EDITION 04**.

Choose solo, local hot-seat or practice; choose scenery and one of seven terrain shapes; inspect the actual seed preview; then draft or randomize six exclusive Pokémon each. Click a Pokémon to inspect its two moves and live demonstrations. **Draft this Pokémon** confirms a pick. Inspection alone does not spend it. Demonstrations use a fixed practice field; the map above the draft shows your actual battlefield.

Classic aiming is the new default: manual elevation and power, an always-visible gold direction arrow and a short initial arc. Assisted aiming is available in setup. It solves angle/power from a landing click and enables full prediction. The field guide button cycles short arc, full guide and direction only. Settings independently control targeting assistance, guide length and previous-shot history. CPU difficulty does not change player assistance.

A/D move, W jumps, F flips facing, Q/E select moves, 1–6 select Pokémon, arrows adjust elevation/power, and Space commits an attack. Native slider keyboard controls also work. A previous-shot path and its settings help correct misses. Beam power is disabled because it has no effect. Camera framing no longer depends on the selected arc or guide setting.

The optional **Learn to aim** lesson requires actual elevation/power changes and two resolved shots. It then introduces water/lightning practice. Practice has no timer or return fire. It can still end if a trainer is knocked out; it is not an invulnerable sandbox.

## Terrain and trainers

Gameplay silhouettes and scenery are independent. Shapes are Rolling Hills, The Divide (central mountain), Deep Valley, Twin Peaks, Mesa Country, Crater Lake and Split Islands. Natural/dramatic elevation and seeds change geometry. Starting shelves blend back into the surrounding slope. Setup and draft previews use the same authoritative surface and island-gap rules as combat.

Original pixel-art trainers replace the vector figures. Each has idle, walking, airborne, throwing, hurt and victory behavior, with articulated limbs and shared pixel-art construction. Names, six outfit palettes, three headwear styles and four skin tones are cosmetic. Profiles save locally. Pokémon retain their original animated sprites, with pose transforms, charge effects and improved material choreography; this is not a new collection of hand-drawn Pokémon attack sprite sheets.

## Weapon behavior

All moves retain real Pokémon names, with artillery-specific rules. Seventeen moves have explicit behavior overrides; others reuse the established projectile, salvo, phase, beam and relay systems. They do not represent 36 independent physics engines.

| Move         | Behavior in this revision                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------ |
| Flamethrower | A quick relay summon, sustained textured flame visual and a persistent ground-fire strip                     |
| Fire Blast   | Cross-shaped terrain cut with short-lived fire patches                                                       |
| Hydro Pump   | Four pressure pulses along an arcing connected stream; directional shove, shallow erosion and surface runoff |
| Water Pulse  | Wide expanding impact and broader wet ground coverage                                                        |
| Rock Blast   | Three separately simulated tumbling rocks, each with up to two terrain bounces                               |
| Seed Bomb    | Three physical secondary seeds with gravity and collision                                                    |
| Sludge Bomb  | Staggered poisonous splashes with persistent poison patches                                                  |
| Earthquake   | Immediate ground impact followed by ten timed terrain ruptures; all finish before handoff                    |
| Dig          | Entry shaft, an excavated traveling underground route and exit burst                                         |
| Thunderbolt  | Branched sky strike and conduction through connected wet patches; dry gaps interrupt conduction              |
| Ice Beam     | Terrain-cutting beam that freezes intersected wet patches into real temporary ice collision                  |
| Lava Plume   | Four physical molten secondary globs with bounded force and burning pools                                    |
| Body Slam    | Visible drop, impact recoil, crater, lift and ground-debris feedback                                         |
| Aqua Tail    | Broad terrain sweep and wet strip                                                                            |
| Psychic      | Brief suspension followed by telekinetic lift                                                                |
| Hurricane    | Sustained local pull/lift around the vortex                                                                  |
| Draco Meteor | Three physical descending meteors with individual collisions                                                 |

Projectile previews use the live integrator, including Rock Blast bounce and differing water/rock gravity. Salvo, cluster and material aftermath are dynamic; the full guide is a nominal prediction rather than a guarantee of all secondary contacts. Earlier projectiles can change terrain before later ones arrive.

Attack origins are defined per species. Fire, water, rock, electrical, spectral and other projectiles gain material-specific trails and contact detail. Audio routing uses the current move definitions rather than obsolete delivery names. Sound is optional in setup/settings. Reduced motion disables shake, reduces particles and removes rapid lightning flashes.

## Ground materials and balance rules

Water is a bounded surface-patch simulation, not a volumetric fluid solver. Patches flow downhill for up to one simulation second, settle on actual terrain, wet trainers and extinguish intersecting fire/lava. Ground fire, lava and poison can damage either trainer. At most one overlapping ground-hazard hit is applied to a trainer during its active turn: fire 4 HP, lava 6 HP or poison 3 HP. Entering a zone can trigger that hit; staying inside does not apply damage every frame. Existing burn/poison statuses still have their own owner-turn ticks.

Most ground patches and ice expire after **four global turns**, including the creation turn's remainder; Fire Blast patches last two. Labels show remaining turns. Water touching a trainer refreshes wetness and extinguishes burn. Thunderbolt finds connected wet patches by bounded geometric adjacency. Ice shelves are authoritative material cells; melting clears only the ice cells still owned by that shelf, preserving ordinary terrain/cover that replaced them.

Hydro Pump's per-pulse force and secondary-fragment force are scaled so repeated contacts do not multiply the original impulse into an easy full-arena knockout. The sea remains fatal; tactical edge knockouts are still possible. Trainers have no species type advantages.

## Draft, match flow and AI

Draft inspection shows delivery family, base damage, uses, recharge, terrain interaction and counterplay. Team summaries show coverage. Trainer/Ace CPU drafting considers the selected terrain as well as team coverage and wet/electric combinations. Random teams and rerolls remain available.

The UI defaults to 240 HP; Quick uses 180 and Endurance 300. The simulation's bare-constructor default remains 180 for backward compatibility. Movement is 125 per turn, jumping costs 18 and optional turn time is 45 seconds. One attack per turn and existing ammunition/cooldowns remain enforced.

Setup offers a seeded opening coin toss or a chosen player. Best-of-three is available. Rematches/next rounds alternate the opener; result actions distinguish the same map, a new seed with the same teams, redrafting, and setup. Series scores are local to the session. Saved trainer/settings profiles persist; active battles/series do not.

Rookie uses coarse search, wider error and no aftermath forecasting. Trainer forecasts up to four candidates; Ace up to ten. Forecasts fork authoritative state and resolve actual attacks/falling/material effects with a fixed 1,200-tick budget. They score damage, self-damage, hazard pressure, wet combinations, resource costs and knockouts. Real aim uncertainty is applied afterward. CPU movement also attempts to leave dangerous patches. Planning is bounded and deterministic; it is not a multi-turn strategic search.

## Validation and remaining limits

Run `npm test`, `npm run build`, `npm run test:browser`, `npm run test:revision`, `npm run test:portable`, `npm run test:terrain` and `npm run benchmark:ai`. A dev server is required for browser/revision checks. `CHROMIUM_PATH` and `GAME_URL` can override their defaults.

The added checks cover 140 seed/shape/elevation spawn fixtures, material lifetime/damage/extinguishing/conduction, physical fragments and bounce, temporary collision/melting, tunnel/wave resolution, simulation forks, profile normalization and input/inspection/tutorial flows. The terrain reach matrix tests 36 moves × seven shapes × two reliefs × two seeds × both sides: 2,016 cases. This checks useful range, not a promise that arbitrary aim hits a moving target.

See `docs/VALIDATION.md` for the final run results. Automated checks do not establish that the game is as satisfying or balanced as Pocket Tanks. Human playtesting, actual Mac/Safari opening, Firefox/Edge, real touch/gamepad, audio quality and modest-laptop long-session performance remain manual validation. All Pokémon still use the imported front/idle animation assets; some choreography remains procedural. More human balance work is expected around persistent hazards, displacement and match length.

Online synchronization, squads, persistent Pokémon Battle mode, saved matches, progression, remappable inputs and gamepad support remain later scope. The asset source/checksum records are retained; original trainer and material rendering code is replaceable alongside the Pokémon content definitions.
