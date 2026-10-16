# Arsenal & Scale — Fan Edition 05

This pass makes the 20 Pokémon / 40 move draft deliberately unequal. Cosmetics remain stat-neutral; weapons no longer share a narrow damage band. This is still two-trainer combat, local hot-seat, practice and solo AI.

## Arsenal rules

350 HP is the standard; Quick is 250 and Endurance is 500. Turns allow 180 movement points, with an 18-point jump cost. Damage values are base damage before falloff, wetness, status, terrain occlusion and falling. The draft inspector and battle move buttons show damage, uses, recharge and weapon role. Randomization is exclusive and unweighted: a weak loadout is possible. There is no hidden equalization.

| Role                 | Example                                                                                         | Cost and counterplay                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Direct-hit sniper    | Octillery's Octazooka: exactly 100 on direct body contact, zero splash                          | Two uses, one owner-turn recharge; fixed speed, aim required; terrain stops it                              |
| Focused displacement | Blastoise's Hydro Pump: one 64-damage water rocket                                              | Three uses; tight crater and strong horizontal impulse; distinct from flooding                              |
| Pit-filling water    | Blastoise's Water Spout: up to eight 10-damage ticks                                            | Two uses, one owner-turn recharge; finite reservoir spills off open ground; both trainers can drown         |
| Self rescue          | Dugtrio's Dig: zero damage, tunnels 220 px in the facing direction                              | Two uses; spends the whole attack; choose direction instead of power                                        |
| Terrain creation     | Dugtrio's Mud Bomb: 18 damage and two real earth banks                                          | Four uses; mud reduces the affected trainer's next movement allowance by 30%; new cover may help its target |
| Mountain mover       | Golem's Earthquake: 18 base damage, 180 px excavation radius plus traveling ruptures            | Opens cover or removes support; falling can matter more than the direct hit                                 |
| Limited homing       | Espeon's Swift: five weak 6-damage stars                                                        | Steering only within 350 px; bad launches and cover still defeat it                                         |
| Underground pursuit  | Garchomp's Dig: 50 damage                                                                       | Lands a relay ball, then seeks a rival within 280 px through terrain; distant landings stay local           |
| Weak plentiful shot  | Scizor's Bullet Punch: five 4-damage hits; Dragon Rage: 26 damage                               | Six/five uses respectively; useful when heavy moves are unavailable                                         |
| Heavy limited shot   | Hyper Beam: 90; Focus Blast: 85; Fire Blast: 78; Draco Meteor: 108 distributed across fragments | Narrow hit windows, limited uses, spread, cover or recharge distinguish their risk                          |

Not all moves need equal total damage. Large salvos show per-projectile damage; cluster damage is a distributed budget, not guaranteed damage on one trainer. Existing poison, fire, wetness, ice, disruption, bouncing rocks, fragments and relay attacks remain.

## Finite water

Water Spout uses a local 512 px region of 8 px fluid cells and a finite reservoir. Gravity and lateral equalization fill low ground. The lowest escape barrier determines what can remain; water above it spills away. The pool lasts 3.9 simulation seconds, with eight possible pulses from 0.7 seconds at 0.4-second intervals. Each pulse deals exactly 10 if the trainer's knees and feet are submerged. Water extinguishes burns and wets trainers. Remaining water becomes ordinary wet ground when the pool drains; the next turn waits for drainage and world settling.

A deep, supported pit can retain all 80 damage. Open slopes or flat land often retain little or none. Excavation followed by flooding is intentional counterplay. Pools affect either trainer. This is a bounded local liquid model, not global fluid simulation; multiple persistent reservoirs, currents and water levels spanning the whole map are outside this revision.

## Scale and presentation

World space is 2560 × 960, twice the previous width. Trainers begin 1520 px apart. Seven seeded silhouettes and both elevation settings scale to the new world with safe starting shelves. Launch speed is 360 + power × 8.4; fixed-speed weapons are explicit exceptions. Camera and world coordinates are separate.

Overview keeps the complete battlefield visible while aiming. Auto follows summons, flights and impacts. Use +/− to zoom, right-drag to pan, click the minimap to inspect another area, Overview to fit the field or Auto to resume following. Camera controls do not change angle/power. Direction arrows remain visible with prediction disabled; an offscreen aiming compass helps while panning. The larger field makes trainers small in overview; zoom is available for inspection and close aiming.

Trainers use new original human-proportioned pixel frames: small head, shoulders, waist, separated long legs, elbows, shoes and backpack. Idle/walking/jump/throw/hurt/victory poses and existing cosmetics remain. Dugtrio and Octillery use actual animated game sprites from the same pinned PokeAPI archive as the earlier roster. New move art includes ink rounds, bubbles, clay banks, flowing pools and escape-tunnel debris. These are procedural effects paired with the imported sprites, not official attack footage.

Terrain rendering updates dirty rectangles rather than repainting the entire 2.46-million-cell world after each small edit. Collision remains authoritative. Fluid grids participate in replay hashes and deep-copy with simulation forks. Presentation timing cannot change damage.

## Difficulty

Rookie chooses a legal offensive move and estimates distance with signed horizontal error, vertical uncertainty, coarse elevations, power error and no wind compensation. It never traces trajectories or forecasts aftermath. Trainer searches trajectories and forecasts four shortlisted results, then adds noticeable aim/power error. Ace searches more finely, forecasts ten outcomes and adds small errors. All levels use the same HP, move damage, terrain and ammunition rules.

The reproducible accuracy benchmark uses the same ordinary Dragon Rage shot, 60 seeds/sides per level, identical maps and health. It is deliberately separate from the full-match benchmark so a stronger draft cannot masquerade as better aiming. Neither benchmark establishes human difficulty or overall balance; playtesting still matters.

Settings schema 3 migrates older preferences. Old HP values migrate to 350. Saved cosmetic profiles remain usable. Online multiplayer, additional battlefield trainers, persistent Pokémon Battle mode, controller/remapping and saved matches remain future scope.
