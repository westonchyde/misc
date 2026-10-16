# Pocket Tanks direction: gameplay audit

Audit of Fan Edition 03, commit `1cc4540b15d4d029de8c975e1bfc14db5e3ddf48`. This is an assessment and proposed development order, not a claim that the recommendations are implemented.

## Overall judgment

The game has a playable foundation: exclusive drafting, recognizable Pokémon, visible summons, destructible collision, legal commands, turn resolution, damage, AI and rematches. Its biggest gap is the quality of the decisions and feedback surrounding each shot. Increasing the roster or adding squads would amplify unfinished systems.

Use Pocket Tanks as the main reference for aiming, weapon identity, terrain silhouettes, drafting and quick rematches. Borrow Worms' physical consequences, character personality and impact feedback. Keep one trainer per side with six summoned Pokémon for the next substantial revision. Preserve trainer HP; borrowing Pocket Tanks' shot loop does not require immediately adopting its scoring rules.

The last revision improved the variety of drawings more than the variety of weapon behavior. A unique impact drawing is useful, but it does not establish a distinct weapon.

## Evidence and limits

Reviewed setup/draft/HUD controls, terrain generation, authoritative attacks, targeting, AI, sprites, choreography, camera and audio. Opened the current build in Chromium, entered a hot-seat match and captured the guide-disabled aiming state. Reviewed existing battle/summon screenshots and the 36-move visual catalog. Inspected the recorded validation and AI benchmark rather than rerunning unrelated regression suites for a documentation-only audit.

Concrete findings:

- The 36 moves comprise 15 relay, eight lob, four cluster, four salvo, one phase, one burrow and three beam moves. The 33 non-beam moves share the projectile integrator and launch-speed formula. Salvos, phase shots and some terrain patterns do have real differences; they should not be dismissed as entirely cosmetic.
- Fifteen relay moves and Dig send essentially the same Poké Ball through the flight phase, with the species-specific action occurring after arrival. This solves range but also accounts for much of the repeated visual experience.
- Most non-beam impacts use radial damage/impulse followed by terrain carving. Several patterns add meaningful edits, such as a trench, shaft or rock cover. Fire and wetness are trainer statuses, not persistent materials on the ground.
- The three terrain generators are combinations of smooth waves, with one island gap and fixed spawn shelves. Seeds change wave phase rather than selecting substantially different structures. At seed 42, surface height spans are 116 px for Highlands, 146 px for Sunset and 96 px for Islands, excluding the island gap.
- Map cards draw approximate decorative silhouettes rather than the actual generated terrain for the selected seed.
- Disabling the trajectory guide removes the in-world aiming preview altogether. There is no separate persistent direction arrow. Camera framing also depends on the enabled guide and its predicted arc.
- Trainers are fixed Ember/River avatars. Every match starts with Ember; rematch repeats the same options. There is no match series or configurable opening player.
- Pokémon use animated front-facing idle GIFs plus transforms. These are recognizable sprites, but not dedicated species attack poses. Audio still branches on several old attack kinds absent from current move data, so much of the intended attack-sound variation is not reached.
- Each side drafts 12 moves with 30 total uses. The recorded 20-game Ace/Rookie benchmark ended after 5–18 total attack turns. That is a warning about arsenal use and match pacing, not a conclusion about typical human matches.

The existing reach, replay, AI and browser checks establish useful correctness. Distinct effect-image hashes cannot measure animation quality, tactical variety or enjoyment. No side-by-side competitor playtest or new human balance study was performed for this audit.

## 1. Aiming and shot mastery — highest priority

The player should know the selected direction whenever it is their turn, including when the pointer is elsewhere and the full guide is disabled. Treat these as separate features:

1. An always-visible short arrow from the actual launch origin, angle tick and clear facing indicator. It remains visible with mouse, keyboard and touch interaction.
2. Optional trajectory assistance: no full path, a short beginning segment, or the current full prediction.
3. Optional click-to-target assistance, explicitly identified as an aim solver.

The current solver selects angle and power from a landing click. That helps accessibility and learning, but as the default it removes much of the artillery skill loop. Offer explicit Classic and Assisted aiming presets; keep assistance independent of CPU difficulty. Recommend Classic as the intended artillery experience after the direction and shot-history feedback are ready.

Add previous angle/power and an optional previous-shot trace/landing marker. Players need to understand how to correct a miss. Show wind direction and magnitude near aiming controls; avoid implying every delivery responds to wind. Support precise adjustment without awkward focus requirements and preserve the player's chosen settings through a shot.

Stabilize camera framing while adjusting the aim. Follow a high shot when needed, then return to a predictable field view. Changing a slider or disabling dots should not make the field feel like a different scale.

Acceptance: with the pointer outside the field and full prediction disabled, a new player can identify facing, approximate elevation and power, take a shot, and deliberately correct the next one.

## 2. Terrain should change tactics — highest priority

The terrain is destructible, but initial layouts usually ask similar questions. Build distinct gameplay silhouettes, independently selectable from scenery:

| Profile          | Tactical question                                             |
| ---------------- | ------------------------------------------------------------- |
| Rolling hills    | Balanced introduction and straightforward correction          |
| Central mountain | Arc over the ridge, drill through, or reposition?             |
| Deep valley      | Can you exploit the low position without trapping yourself?   |
| Twin peaks       | How do you knock the rival off a perch or remove its support? |
| Mesa and shelves | Where will a rolling attack stop, and which ledge is safe?    |
| Crater basin     | Which shots collect material in the low point?                |
| Split islands    | Does displacement justify the risk near the sea?              |

Start with normal and dramatic elevation settings, plus a reroll and seed. Generate the exact preview from authoritative terrain, showing spawn positions before drafting. Avoid a pile of poorly explained sliders until the presets work.

Keep a predominantly ground-connected landscape for this direction. Initial overhang mazes, floating islands, ropes and sprawling Worms maps are unnecessary. Destruction can still create tunnels and unusual shapes during play.

Map fairness means safe initial footing, usable headroom and meaningful attack or excavation options from both sides. It does not mean every move passes through every obstacle. Test many seeds and mirrored starts; current default-seed reach checks are not sufficient for dramatic profiles. Audit movement, escape from craters, terrain creation around bodies and sea-edge distances with the new geometry.

Acceptance: different presets lead players to draft or choose different attacks. A mountain is a meaningful obstacle; a valley matters to water, rolling objects and escape routes.

## 3. Weapon physics and material identity — highest priority

Recognizability must extend through anticipation, travel, contact and aftermath. A ball with a new color or an impact symbol is insufficient. Develop a few convincing behavior families, then apply them across the roster.

| Example move | Proposed visible and mechanical identity                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Flamethrower | A continuous expanding flame stream after a clearly marked relay deployment; scorches a directional strip and leaves short-lived burning patches. Water extinguishes them.                       |
| Hydro Pump   | A connected, pressurized arcing water stream from the cannons, sustained directional shove, splash and limited runoff toward lower terrain. It should not read as one blue shell.                |
| Water Pulse  | An unmistakable expanding ring whose width/coverage distinguishes it from the narrow push of Hydro Pump. Clearly define whether terrain blocks it.                                               |
| Rock Blast   | Irregular tumbling rocks with weight, short bounces or rolls and separate contacts; useful around slopes rather than just a generic spread.                                                      |
| Seed Bomb    | A recognizable seed casing with actual falling secondary seeds that collide, rather than scheduling small blasts at predetermined offsets.                                                       |
| Dig          | A visible burrower and traveling underground disturbance that excavates its route before surfacing. Current shaft carving at arrival is not that behavior.                                       |
| Thunderbolt  | A branched sky strike with an explicit targeting marker and warning. Wet-ground conduction requires an actual bounded wet region; the current wet-trainer bonus alone is not terrain conduction. |
| Ice Beam     | A sharply readable beam, frost trail and terrain/water interaction. If platforms are added, freezing must create real temporary collision with visible expiration.                               |
| Lava Plume   | Glowing globs that fall, collect and leave a temporary hazard, with an aftermath distinct from Flamethrower's strip.                                                                             |
| Body Slam    | Snorlax visibly rises/falls onto the landing zone, compresses on impact and creates a heavy directional shock/fall consequence. A ring beneath an idle sprite is insufficient.                   |
| Stone Edge   | Sequential rock growth and persistent, destructible cover with placement rules that cannot entomb a trainer.                                                                                     |
| Shadow Ball  | A ghostly mass with a clearly communicated phase rule and spectral trail; retain a real cover-bypassing niche rather than making every shot ignore hills.                                        |

These are proposals, not completed mechanics or claims about exact main-series Pokémon behavior. Prioritize roughly eight exemplar moves across fire, water, rocks, clusters, digging, lightning, physical impact and beams. Keep the existing roster available, but do not expand it until every current move has an honest tactical purpose.

For the remaining moves, make a worksheet covering launch silhouette, travel rule, collision, affected area, knockback direction, terrain edit, persistent aftermath, status, counterplay and sound. Two moves can share a physical family; they need a meaningful reason to choose one over the other. Do not promise 36 wholly independent fluid/physics systems.

Use actual projectiles for meaningful fragments. Make material systems bounded and deterministic: coarse water cells or surface patches, limited flow steps, finite burning lifetimes and explicit per-turn damage caps. Photorealistic fluid simulation is unnecessary. Decorative particles must never be the only representation of a damaging hazard.

Maintain useful range without making every attack a visually identical relay. Distinguish local summon/projectile launch, relay summon and targeted weather/ground attack in the UI. Show the legal summon region, direction and actual affected area. A relay solves short-range species moves, but should be a deliberate category rather than the default answer for half the roster.

Acceptance: with labels hidden, players can distinguish the main attack families in motion and predict a different consequence. After a water or fire attack, the next player must sometimes change their plan because of what remains.

## 4. Summons, animation, art and sound — high priority

Keep the visible trainer → ball → Pokémon → attack → recall identity. Improve placement near slopes and walls, keep the opponent readable behind large sprites, and define species-specific muzzle/hand/mouth/cannon anchors. The current shared launch origin does not reliably sell attacks coming from the Pokémon.

Use short anticipation and recoil poses, readable physical motion, contact timing and restrained hit pauses. Imported idle sprites can remain the base, with original pose/effect layers where needed. Scaling or rotating an idle sprite should not be reported as a bespoke attack animation. Animate bodies and water/flame along the path, not only on impact.

The Pokémon sprites are the visual benchmark and should remain the anchor for the art direction. Current smooth vector trainers and geometric effects do not sit naturally beside them. Bring the other layers toward that expressive pixel-art language, with consistent scale, outlines, shading, contact shadows and ground contact. Keep assets replaceable and maintain the existing provenance records.

For trainers, create a small original pixel-art character set with the same care in silhouette and shading as the Pokémon. Establish idle, walk, jump, throw, recoil/hurt and victory poses before producing many outfits. Clothing, hair, skin tone and accessories can be palette/layer variations over the shared animation set. The throw needs a readable wind-up, arm extension and release; the character must visibly react to a heavy hit. Use crisp integer scaling where practical. A proper pixel-art character is not the current vector figure passed through a pixelation filter.

For moves, define a production sheet covering anticipation, launch, travel, impact, aftermath and recall. Give each signature effect a material palette, texture, silhouette, evolving animation and sound. Fire needs irregular layered flame tongues, bright cores and embers; water needs connected pressure, translucent breakup, foam and splashes; rock needs facets, rotation, debris and weight; electricity needs branching, flicker and brief bright flashes. Rings, triangles and circles can support these effects, but should not be their entire visual identity. Pixelating those same shapes would not solve the problem.

Attach effects to per-species anchors, such as Blastoise's cannons, Charizard's mouth and Pikachu's cheeks, with facing and pose taken into account. Add charge or exertion poses, recoil, contact flashes and small amounts of secondary motion. A strong attack should feel like the Pokémon caused it. Aim for one convincing Charizard/Flamethrower sequence and one Blastoise/Hydro Pump sequence as the visual standard before extending the approach across 36 moves.

Keep the battlefield calmer than the attacks. Harmonize terrain edge texture, trainer outlines and effect resolution with the sprites, while preserving clear collision surfaces and readable hazards. Avoid increasing particles or bloom until the launch and material motion already read well. Review animation at actual play speed on a laptop, not only isolated effect thumbnails.

Create sound families that match material: water pressure/splash, flame ignition/crackle, rock weight/chips, electrical snap, beam charge and heavy body impact. Repair the stale audio routing. Offer sound during onboarding; it is currently off by default. Add subtle ambient audio only after attacks sound good. Respect reduced motion and separate sound/music volume if music is introduced.

Acceptance: each exemplar has a readable launch, travel, hit and aftermath at normal speed. The player can locate both trainers throughout it, and reduced effects preserve all gameplay information.

## 5. Draft, loadouts and resource strategy — high priority

The shared snake draft is a foundation worth keeping. Currently the pick cards show species, a broad role and two move names, but little information needed to understand their tradeoffs. Add inspect-before-pick details and a short preview: travel type, terrain effect, area, displacement, persistence, uses and actual drawbacks. Selecting for inspection must not immediately commit a pick.

Keep the map preview visible during drafting. Summarize team coverage without prescribing an optimal build: direct damage, displacement, terrain access, area denial, utility. Warn when a team has no practical way to deal with a central ridge. Show both players' picks and make CPU drafting legible. Preserve quick random teams, with saved favorite configurations or presets later.

Review ammo and cooldowns together. Both can be justified, but limiting a secondary to two uses and also forcing recharge may discourage experimentation in a short match. Do not add another PP or energy system. Tune resources around observed match duration and weapon power, not the count of Pokémon alone.

Acceptance: a new player can explain why they picked a Pokémon and what its two moves do differently before entering battle.

## 6. Match rules, movement and pacing — high priority

Decide the intended match length using human sessions. The current large loadout and short benchmark matches may not leave enough time to learn or exploit a draft. Measure how many drafted Pokémon are used, how often secondary effects matter and how frequently sea knockouts overwhelm other strategies. Adjust HP, damage, ammo and impulse together from those results.

Keep movement deliberate and limited. More elaborate terrain exposes slope, jump, crater escape and body-placement problems. Make movement budget and hazard risk visible. Avoid either extreme: free walking that defeats aiming decisions, or terrain traps that make a player spend several turns unable to participate. Excavation and movement should provide counterplay.

Alternate or randomize the opening player, display the choice, and offer a best-of-three series. Distinguish immediate rematch with the same setup, a new seed, and a redraft. Local handoff should announce the next player clearly without an unnecessary long interruption.

Keep trainer HP as the default victory rule. A fixed-round damage-score mode could later capture more Pocket Tanks pacing and ensure more arsenal use, but it should be a separate documented ruleset. Deathmatch and score play require different balance assumptions.

Acceptance: matches give enough turns for several choices without dragging; first-player advantage and environmental deaths are measured rather than assumed fair.

## 7. AI difficulty — high priority after mechanics change

The current levels do differ in search, error, tactical weights, drafting and movement. They do not simply change HP. That is good groundwork. Their decisions still mostly score an estimated immediate blast rather than simulate a complete aftermath. Coarse edge and terrain bonuses are not full tactical planning.

Once attacks gain bounce, flow and persistence, evaluate a bounded set of promising candidate shots through the same simulation to settling, including self-damage, future hazard exposure, escape and resource use. Set a consistent thinking budget. Rookie should produce understandable misses and basic choices; Trainer should be reliable; Ace should exploit terrain and counterplay rather than merely use nearly exact aim.

Keep player assistance independent of AI level. Validate difficulties against humans and across varied maps, swapped starting sides and drafts. The recorded Ace 19/Rookie 1 result is a regression signal, not proof of enjoyable difficulty or fair human matchups.

## 8. Character choice and larger battles — useful, different priorities

Add trainer name, a small avatar selection, clothing/skin/hair palettes, team color and optional cosmetic victory pose. Save profiles locally and show them in the draft, HUD and results. Keep combat stats equal initially; cosmetic identity gives personality without another balance system.

Defer Worms-style squads. The current simulation, AI, camera, results, draft and targeting assume two players. Multiple trainers per team require unit activation, elimination rules, team resources, spawn fairness and much more screen information. It is a separate mode, not a small settings toggle.

If broader multiplayer becomes desirable later, evaluate three or four players with one trainer each before squads. That still requires ownership, turn-order and multi-target changes. It should not be silently included in the next polish pass. Online and persistent Pokémon Battle mode remain later roadmap items.

## 9. Onboarding, accessibility and replayability — medium priority

Replace reliance on text help with a short optional interactive lesson: manual arc, miss correction, summon, cover, one material interaction and turn handoff. Provide a move practice range with reset and clear targets. Avoid asking the player to draft unfamiliar names without seeing what they do.

Improve HUD legibility on laptop-sized screens: enough battlefield space, readable angle/power/status durations, conspicuous unavailable-move reasons and consistent focus. Indicate damage-over-time and remaining hazard lifetimes beside the relevant object/player. Preserve contrast without requiring red/blue distinction alone. Validate keyboard-only operation, text scaling and reduced motion; responsive layout checks are not equivalent to real touch usability. Remapping and gamepad remain gaps.

After the core shot loop is good, add saved presets, match series, short challenges and useful results such as weapon usage, direct damage, fall damage and combos. These should support learning and rematches. Campaigns, progression, achievements and more roster breadth are lower-value work now.

## 10. Engineering and validation — required alongside the changes

The fixed-step simulation, shared projectile tracing, data-driven roster, module boundaries and offline build are worth retaining. Extend them rather than rewriting the game solely to change engines.

Material state, attack fragments, delayed effects and hazard lifetimes must be authoritative, seeded where appropriate and included in replay hashes. Separate cosmetic animation length from simulation outcomes. Previews must state what they predict: a nominal path is not a guarantee for bouncing fragments or a final flooded area.

Expand regression maps/seeds for peaks, thin ledges, deep craters, rolling contacts, embedded-body recovery, water/fire interaction and simultaneous knockouts. Test first-player swaps and matches with the revised arsenal. Profile large edits and multiple hazards; current terrain texture rebuilding and up-front sprite decoding deserve measurement on a modest laptop. Manually validate Safari and actual Mac standalone opening, audio and long-session performance.

New quality gates must include observed play, not only assertions:

- Can someone identify the weapon family with move names hidden?
- Can they aim with no full trajectory and correct a miss intentionally?
- Does the map change their draft or attack choice?
- Does an attack sometimes change the opponent's next decision through terrain or a visible hazard?
- Can they understand the source of damage and why the match ended?
- Are several draft strategies viable across both starting sides?

## Recommended build order

| Pass                    | Deliverable                                                                                                                                       | Exit condition                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1. Aiming and terrain   | Persistent direction indicator, separate assistance settings, previous-shot feedback, stable camera, distinct terrain profiles and exact previews | Manual aiming is readable; several fair maps produce different shot choices      |
| 2. Weapon behavior      | Approximately eight representative attacks with real material/physical differences, correct summon origins and distinct sound                     | Attacks read differently in motion and create different decisions                |
| 3. Complete the arsenal | Review all 36 move roles, extend proven families, honest draft inspection, resources and match-length tuning                                      | No move relies on a misleading description or purely decorative claimed mechanic |
| 4. Match experience     | Trainer customization, interactive tutorial, series/rematch options, AI adaptation, accessibility and device checks                               | Repeated human matches are understandable, varied and worth rematching           |

Each pass should end in a working offline build with measured checks and known limitations. New Pokémon, larger battlefields, squads, online play and the future persistent Pokémon mode follow a convincing two-trainer artillery game.
