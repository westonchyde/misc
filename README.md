# Pokémon Battlefront · Terrain & Tactics Edition 04

A playable, browser-based, two-trainer artillery fan game inspired by Pocket Tanks and Worms. Draft six Pokémon, aim an attack, visibly summon your partner and reshape a destructible battlefield. Trainers take damage; summoned Pokémon return to their balls.

## Play without Terminal

1. [Download the current ZIP](https://github.com/westonchyde/misc/archive/refs/heads/main.zip).
2. Unzip it and open **play.html** in your browser.
3. Check that the header says **FAN EDITION 04**. Choose solo, local hot-seat or practice, then inspect/draft your team or randomize it.

All 18 animated Pokémon sprites, code and sounds are included. No accounts, runtime downloads or server are required. Replace an older download to update it. A private cloud address is not a public game link.

## What changed in Edition 04

- **Seven gameplay silhouettes**, independently selectable from three scenery themes: rolling hills, a central mountain, deep valley, twin peaks, mesas, crater basin and split islands. Natural/dramatic elevation, seeds, rerolls, safe spawn shelves and actual terrain previews in setup/draft.
- **An always-visible aim arrow**, Classic manual aiming, optional Assisted targeting, short/full/no trajectory prediction, previous-shot feedback and stable camera framing.
- **Original animated pixel-art trainers** with saved names, outfit palettes, skin tones and headwear. Cosmetics have equal combat rules.
- **Different physical attacks and aftermath:** bouncing rocks, colliding seed/meteor/lava fragments, traveling underground excavation, timed ground ruptures, connected water pulses/runoff, ground fire/poison, wet-ground conduction and temporary solid ice shelves.
- **Move inspection before drafting**, including live demonstrations, uses, terrain effects and counterplay. Clicking a card inspects; the confirmation button spends the pick. The shared snake draft and random teams remain.
- **240 HP standard matches**, optional Quick/Endurance settings, opening-player choice, best-of-three scores, alternating openers and separate rematch/new-seed/redraft actions.
- **AI aftermath forecasting**, terrain-aware drafting, hazard avoidance, material-specific audio and an interactive aiming lesson.

The Pokémon sprites remain the original animated assets. Attack choreography combines those animations with procedural poses and material effects; it is not a set of newly authored species attack sprite sheets. The [revision notes](docs/REVISION-04.md) document exact mechanics and limits; the [audit](docs/POCKET-TANKS-AUDIT.md) records the broader design direction.

## Controls and rules

| Action                | Controls                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| Move / jump           | A / D, W, or on-screen buttons                                                                                |
| Choose Pokémon / move | 1–6, Q / E, or buttons                                                                                        |
| Elevation / power     | Sliders or arrow keys                                                                                         |
| Flip / commit         | F / Space                                                                                                     |
| Aim on the field      | Click/drag for manual direction/power; Assisted mode solves a landing arc; Shift-click always uses manual aim |
| Guide / pause         | Field guide button cycles short/full/direction only; Escape pauses                                            |

Classic is the default: gold direction arrow and a short launch segment, without automatically solving the landing. Assisted mode is available in setup; targeting and guide settings are independent from CPU difficulty. Full prediction shows the nominal shot, not every secondary collision/material consequence. Previous paths help correct misses.

Each turn grants **125 movement points**, one attack and optionally **45 seconds**. Jumping costs 18. The UI offers **180 / 240 / 300 HP**, defaulting to 240. Primaries have three uses, secondaries two; stronger moves recharge for one or two owner turns. Finite ammunition and ownership are enforced for humans and CPU. If both sides exhaust all moves, remaining HP decides the result. Falling can hurt; the sea/world boundaries are fatal. Practice has no return fire or timer, but trainers can still be knocked out.

Water wets and extinguishes fire. Electricity gains 50% against wet trainers. Ice adds eight damage to a wet target and reduces movement. Burn/poison statuses tick for four HP on two owner turns; curse reduces movement and Snarl weakens an attack. Trainers do not inherit Pokémon type advantages.

Ground materials are separate from trainer statuses. Surface water flows briefly downhill and can conduct Thunderbolt or freeze under Ice Beam. Fire, lava and poison patches persist and can affect either trainer; overlapping patches apply at most one ground-zone hit per trainer's active turn. Most patches/ice last four **global turns**, Fire Blast patches two; labels show remaining life. See the revision notes for exact damage and lifetime rules. Water uses bounded surface patches rather than volumetric filling.

## Roster

| Pokémon    | Moves                       |
| ---------- | --------------------------- |
| Charizard  | Flamethrower / Fire Blast   |
| Blastoise  | Hydro Pump / Water Pulse    |
| Pikachu    | Thunderbolt / Electro Ball  |
| Golem      | Rock Blast / Earthquake     |
| Gengar     | Shadow Ball / Sludge Bomb   |
| Snorlax    | Body Slam / Hyper Beam      |
| Venusaur   | Seed Bomb / Solar Beam      |
| Alakazam   | Psybeam / Psychic           |
| Machamp    | Dynamic Punch / Focus Blast |
| Gyarados   | Aqua Tail / Dragon Rage     |
| Lapras     | Ice Shard / Ice Beam        |
| Dragonite  | Hurricane / Draco Meteor    |
| Tyranitar  | Stone Edge / Crunch         |
| Scizor     | Bullet Punch / X-Scissor    |
| Espeon     | Swift / Psyshock            |
| Umbreon    | Snarl / Dark Pulse          |
| Typhlosion | Lava Plume / Eruption       |
| Garchomp   | Dig / Dragon Rush           |

Real move names and species learnsets are adapted into artillery rules. Seventeen moves have explicit behavior overrides; the rest use established projectile, salvo, phase, beam and relay families. This is not a main-series Pokémon battle simulator.

## Development

Node 22+ recommended. Validated with Node 24.19.0 and npm 11.9.0.

```sh
npm ci
npm run dev
```

Open the Local URL Vite prints on the **same computer**. In the managed cloud environment, `npm ci --cache /tmp/battlefront-npm` avoids an unwritable default cache.

```sh
npm test                 # Simulation, content, materials, terrain, replay and AI tests
npm run build            # dist/ and self-contained play.html
npm run test:browser      # Draft, combat, AI, input, effects and sprite checks
npm run test:revision     # Profiles, terrain, aim feedback, inspection and tutorial
npm run test:portable     # Exact standalone document, offline
npm run test:terrain      # 2,016 move/shape/relief/seed/side range cases
npm run benchmark:ai      # Fixed 20-match Ace/Rookie comparison across seven shapes
```

Browser/revision checks require the dev server and use `CHROMIUM_PATH`, `/usr/bin/chromium` or Playwright's installed browser. `GAME_URL` overrides the dev-server URL. Screenshots/results are written to `/tmp`. The large production JS chunk is expected: the portable build embeds about 1 MB of GIF assets. Rebuild `play.html` after source changes; do not edit it manually.

## Architecture and validation

`simulation.js` owns fixed 60 Hz physics, terrain collision, legal commands, damage, materials, resource use, turn phases and match rules. Rendering cannot change hits. Gravity is 440 px/s²; launch speed is 260 + power × 5.6, with move-specific gravity. Swept projectile substeps are at most three pixels. Previews and live shots share the integrator.

`landscapes.js` generates seeded silhouettes; `content.js` defines Pokémon, moves, anchors and tactical metadata. `draft.js`, `targeting.js` and `ai.js` handle drafting, optional targeting assistance and bounded planning. Higher CPU levels simulate a shortlist through actual aftermath using independent battle forks. AI uses the same commands, HP, damage and resource rules as humans.

`sprites.js` decodes the pinned Pokémon GIFs. `trainers.js` supplies original pixel-art characters and cosmetic profiles. `renderer.js`, `effects.js` and `materials-art.js` render terrain, summons, attacks and ground materials; `audio.js` synthesizes material cues. `main.js` coordinates UI, settings, inspection demos, tutorial and local series. `scripts/standalone.mjs` packages the offline document.

Replay hashes include RNG, terrain, live fragments, hazards, temporary ice, ammunition and previous shots. This supports regression checks, not an implemented online protocol. Settings schema 2 migrates existing preferences and persists profiles locally; battles/series do not save.

[Validation results](docs/VALIDATION.md) distinguish automated evidence from remaining manual checks. A passing reach or effect-image test is not proof of good game feel or human balance. Human playtesting, actual Mac/Safari opening, Firefox/Edge, real touch/controller use, audio quality and long-session/device profiling remain manual work. Online play, squads, persistent Pokémon Battle mode, saved matches, progression and remappable/gamepad controls remain future scope.

Pokémon names and sprites remain third-party IP in this unofficial fan game. [Attribution](assets/ATTRIBUTION.md), the asset manifest and [library notices](THIRD_PARTY_NOTICES.md) record provenance. Content and artwork remain replaceable.
