# Pokémon Battlefront · Arsenal & Scale Edition 05

A playable, browser-based artillery fan game inspired by Pocket Tanks and Worms. Draft six Pokémon, aim an attack, visibly summon your partner and reshape a destructible battlefield. Trainers take damage; Pokémon return to their balls.

## Play without Terminal

1. [Download the current ZIP](https://github.com/westonchyde/misc/archive/refs/heads/main.zip).
2. Unzip it and open **play.html** in your browser.
3. Check for **FAN EDITION 05**. Choose solo, local hot-seat or practice, then inspect/draft your team or randomize it.

All 20 animated Pokémon sprites, code and synthesized sounds are included. No account, runtime download or server is required. Replace an older download to update. A private cloud address is not a public game link.

## What changed

- **Deliberately unequal weapons:** 100-damage direct-only Octazooka, weak plentiful barrages, heavy limited shots, a mountain mover, limited homing, rescue tunneling and mud that builds cover. Damage and role are visible before drafting.
- **Dugtrio and Octillery** join the shared draft: 20 Pokémon, 40 moves using real Pokémon move names, six exclusive partners per side. Random teams can contain weak choices.
- **Two different Blastoise attacks:** Hydro Pump is one focused 64-damage water rocket with displacement. Water Spout pours a finite reservoir into low ground, dealing up to eight 10-damage ticks before draining. Open ground spills water; deep pits retain it.
- **Twice the battlefield width:** 2560 × 960 worlds, larger mountains/valleys, 1520 px starting separation, zoom/pan/minimap and automatic shot tracking. Seven silhouettes, three sceneries, two relief settings and seeded generation remain.
- **Human-proportioned original trainer art:** smaller heads, shoulders, waists, articulated arms, long separated legs, compact shoes and backpacks. Existing names, palettes, skin tones and headwear remain cosmetic.
- **Measured difficulty separation:** Rookie estimates shots without trajectory search; Trainer searches with noticeable error; Ace searches finely and forecasts aftermath. Same damage, resources and HP on every level.
- **350 HP standard**, 250/500 options and 180 movement points per turn. Strong attacks, precision, utilities, terrain and resource tradeoffs matter more than uniform damage.

[Edition 05 notes](docs/REVISION-05.md) specify mechanics, lifetimes and limitations. The [Pocket Tanks audit](docs/POCKET-TANKS-AUDIT.md) records the broader design direction. The imported Pokémon GIFs are actual game sprites; procedural movement/material effects accompany them, rather than newly authored species attack sprite sheets.

## Controls and rules

| Action            | Controls                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------- |
| Move / jump       | A / D, W, or on-screen buttons                                                            |
| Pokémon / move    | 1–6, Q / E, or buttons                                                                    |
| Elevation / power | Sliders or arrow keys                                                                     |
| Flip / attack     | F / Space                                                                                 |
| Field aiming      | Click/drag manually; Assisted mode solves a landing arc; Shift-click always aims manually |
| Camera            | +/− buttons, right-drag to pan, minimap click, Overview or Auto                           |
| Guide / pause     | Guide button cycles short/full/direction only; Escape pauses                              |

Classic is the default: persistent gold direction arrow and short launch segment. Assisted aiming is available in setup. Assistance and prediction are independent from CPU difficulty. Full prediction shows the nominal shot, not every secondary collision/material outcome. Previous paths help correct misses. Sniper/beam power is fixed; rescue Dig uses facing instead of angle/power.

Each turn grants **180 movement points**, one attack and optionally **45 seconds**. Jumping costs 18. HP options are **250 / 350 / 500**, default 350. Ammunition and recharge vary by move and are enforced for everyone. When all ammunition is exhausted, remaining HP decides the result. Falling can hurt; sea/world boundaries are fatal. Practice has no return fire or timer, but trainers can still be knocked out. Rematches preserve teams and alternate openers; local best-of-three scores, new seeds and redrafting are available.

Water wets and extinguishes fire. Electricity gains 50% against wet trainers. Ice adds eight damage to a wet target and reduces movement. Burn/poison statuses tick for four HP on two owner turns; curse reduces movement, Snarl weakens one attack, mud reduces the next movement allowance by 30%. Trainers do not inherit Pokémon type advantages.

Water Spout's real pool drains before handoff; existing ground wetness can flow, conduct electricity or freeze into temporary solid ice. Fire/lava/poison patches can affect either trainer, with overlap damage capped per active turn. Most ground patches/ice last four global turns, Fire Blast patches two. See the revision notes for exact water behavior and counterplay.

## Roster

| Pokémon    | Moves                       |
| ---------- | --------------------------- |
| Charizard  | Flamethrower / Fire Blast   |
| Blastoise  | Hydro Pump / Water Spout    |
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
| Dugtrio    | Dig / Mud Bomb              |
| Octillery  | Octazooka / Bubble Beam     |

Pokémon learnsets/move names are adapted into artillery rules. This is not a main-series battle simulator.

## Development

Node 22+ recommended; validated with Node 24.19.0 and npm 11.9.0.

```sh
npm ci
npm run dev
```

Open the Local URL Vite prints on the same computer. The managed cloud can use `npm ci --cache /tmp/battlefront-npm` if the default cache is unwritable.

```sh
npm test                  # Simulation/content/draft/assets/materials/replay/AI
npm run build             # dist/ and self-contained play.html
npm run test:browser       # Game flow and effect/sprite catalog
npm run test:revision      # Profiles, maps, inspection, aiming lesson and responsive UI
npm run test:arsenal       # Actual UI excavation/flood/rescue and camera controls
npm run test:portable      # Exact standalone document offline
npm run test:terrain       # 2,240 move/shape/relief/seed/side role checks
npm run test:renderer      # Incremental terrain image vs full redraw
npm run benchmark:accuracy # Same weapon/seeds/sides on all three CPU levels
npm run benchmark:ai       # 20 seeded Ace/Rookie matches
```

Browser checks require the dev server, with `GAME_URL` to override its address. They use `CHROMIUM_PATH` or system Chromium. Screenshots/results go to `/tmp`. The production chunk warning is expected because assets are embedded. Rebuild `play.html` after source changes.

## Architecture and limits

`simulation.js` owns fixed 60 Hz physics, legal commands, collision, damage, resources, turn phases and victory. `world.js` separates world from viewport dimensions. Gravity is 440 px/s², ordinary launch speed 360 + power × 8.4, with move-specific exceptions. Swept projectile substeps are at most three pixels. Preview/live shots share the integrator.

`flood.js` simulates bounded 8 px liquid cells. `landscapes.js` generates terrain. `content.js` defines Pokémon, moves, roles and anchors; `draft.js`, `targeting.js` and `ai.js` handle drafting, assistance and planning. Higher CPU levels forecast on independent battle forks. Pools, terrain, RNG, fragments, materials, resources and previous shots participate in replay hashes.

`sprites.js` decodes pinned GIFs; `trainers.js` draws cached original human frames. `renderer.js` paints dirty terrain regions and handles world cameras. `effects.js`, `materials-art.js` and `audio.js` present attacks. `main.js` coordinates UI, schema-3 local preferences, demos, tutorial and local series. Battles/series do not save. `scripts/standalone.mjs` builds the offline document.

[Validation](docs/VALIDATION.md) distinguishes automated results from remaining checks. Real Mac/Safari double-click behavior, Firefox/Edge, audio quality, touch/controller use, comprehensive accessibility review, human balance and modest-device long-session performance remain manual work. Local liquid is bounded; official attack footage is not included. Online play, squads, persistent Pokémon Battle mode, saved matches, progression and remappable/gamepad input remain future scope.

Pokémon names and sprites remain third-party IP in this unofficial fan game. [Attribution](assets/ATTRIBUTION.md), the asset manifest and [library notices](THIRD_PARTY_NOTICES.md) record provenance. Content and art remain replaceable.
