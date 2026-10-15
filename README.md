# Pokémon Battlefront — Draft Edition 03

A browser artillery fan game inspired by Pocket Tanks and Worms: draft a team, summon actual animated Pokémon, aim long-range attacks, destroy terrain and outlast the opposing trainer.

## Play without Terminal

Download **Code → Download ZIP** from GitHub, unzip it, and open **`play.html`** in your browser. It includes all 18 original animated sprites, effects and code. No account, asset server, Node installation or internet connection is required to play. Download a fresh ZIP to update an older local copy; the HTML file does not auto-update.

Choose solo vs CPU, shared-keyboard two-player, or practice. Choose **Snake draft** or **Random teams**, review your six, then enter the battlefield. Randomize again to reroll both teams.

## The draft

18 Pokémon share one pool. Each trainer gets six exclusive picks, with both moves included. Snake order is **Ember → River → River → Ember**, repeated until both have six. You cannot take a Pokémon already drafted. In solo and practice, River picks automatically; CPU drafting strategy follows the selected difficulty. Hot-seat players take turns picking on the same computer. Random teams are repeatable from the seed and reroll sequence, have six Pokémon each, and never overlap.

## Controls

| Action | Controls |
| --- | --- |
| Move / jump | A / D / W, or on-screen buttons |
| Select your six partners / their two moves | Click, or 1–6 and Q / E |
| Set a landing target | Click/drag the field with **Click-to-target arcs** enabled |
| Classic manual aim | Sliders and arrow keys; Shift-click sets direction and power directly |
| Elevation / power | Left/right arrows; up/down arrows |
| Reverse aim | F or the facing buttons |
| Commit | Space or **Summon & attack** |
| Pause | Escape or **Pause** |

Pointer assistance searches legal arcs using the same terrain/wind collision code; it can be disabled in Settings. It does not promise a hit on a moving/falling target. Manual controls always remain available. Negative elevation aims downhill. Power applies to all arcs and relay shots; the three beams have fixed reach/power.

## Rules and artillery reach

- Trainers have **180 HP**. Each turn gives **125 movement points**, one attack, and optionally **45 seconds**. Jumping costs 18. Practice has no timer or return fire.
- Each primary has **3 shots**, each secondary **2**, and strong moves also recharge for 1–2 owner turns. Ownership, ammo and cooldowns are enforced in simulation, including for CPU players. If all shots are exhausted, remaining HP decides the result.
- **33 moves use arcs, salvos, clusters or relay summons.** Every one can reach across the normal starting distance. Beams (Hyper Beam, Solar Beam, Ice Beam) have full-arena range. Tests find a damaging legal shot for every move from both starting sides on all three maps: **216 reach checks**. Poor aim, intervening terrain or falling targets can still make you miss.
- Short-range attacks use a **Poké Ball relay**. You aim the ball to a landing zone; the Pokémon emerges there, executes its attack, and recalls. Flamethrower is a local flame sweep after the long throw, not a short beam from your distant trainer.
- Salvos are multiple swept physical projectiles with spread and staggered launches. Clusters have staggered secondary impacts. Earthquake breaks a broad ground strip; Stone Edge adds real rock cover; Dig makes a shaft and branches; beams excavate a narrow line. Every move has its own projectile/impact visual and attack choreography.
- Damage fades with blast distance and is reduced behind cover. Water pushes and wets; electricity does 50% extra against wet trainers. Ice adds 8 damage to wet targets and reduces one movement budget. Water extinguishes/prevents burn. Burn and poison each tick for 4 HP on two owner turns. Disruption halves one movement budget. Snarl reduces damage for the next owner attack turn by 20%. Trainers have no Pokémon type advantages.
- Falling can hurt (up to 35 damage); the sea and world boundaries are fatal. Impulses are globally scaled to 0.58 so initial-position water hits do not casually throw a full-health trainer across the entire map. Falling bodies and cluster fragments settle before handoff.

## Roster and moves

| Pokémon | Primary / Secondary |
| --- | --- |
| Charizard | Flamethrower / Fire Blast |
| Blastoise | Hydro Pump / Water Pulse |
| Pikachu | Thunderbolt / Electro Ball |
| Golem | Rock Blast / Earthquake |
| Gengar | Shadow Ball / Sludge Bomb |
| Snorlax | Body Slam / Hyper Beam |
| Venusaur | Seed Bomb / Solar Beam |
| Alakazam | Psybeam / Psychic |
| Machamp | Dynamic Punch / Focus Blast |
| Gyarados | Aqua Tail / Dragon Rage |
| Lapras | Ice Shard / Ice Beam |
| Dragonite | Hurricane / Draco Meteor |
| Tyranitar | Stone Edge / Crunch |
| Scizor | Bullet Punch / X-Scissor |
| Espeon | Swift / Psyshock |
| Umbreon | Snarl / Dark Pulse |
| Typhlosion | Lava Plume / Eruption |
| Garchomp | Dig / Dragon Rush |

These are real Pokémon move names and historical species learnsets. Delivery, damage, resources, status rules and effects are original artillery adaptations, not a simulation of main-series turn-based Pokémon battles.

## Difficulty

| Level | What changes |
| --- | --- |
| Rookie | Coarse angle/power search, wider aim error, simple damage choices, random drafting and no tactical walking |
| Trainer | Denser search/refinement; wind, wet combos, self-damage, ammo conservation, balanced drafting and safe repositioning |
| Ace | Finest search, more exact aim, terrain/edge denial, status synergy, lethal-shot and resource scoring, smarter drafting, edge retreat and higher-ground movement |

All levels use the same HP, damage, wind, ammo, cooldowns, drafted ownership and command validation. A fixed reproducible 20-game regression set (alternating Ace sides, random drafted teams, three maps) finished **Ace 19 / Rookie 1**, with **5–18 attack turns**. This is evidence of separation on that set, not a universal win-rate or complete human balance study.

## Development

Node 22+ recommended; validated with Node 24.19.0 and npm 11.9.0.

```sh
npm ci
npm run dev
```

Open the Local URL Vite prints on the **same computer**. A private cloud address is not a public game link. In the managed cloud environment, use `npm ci --cache /tmp/battlefront-npm` if the default cache is unwritable.

```sh
npm test                 # 31 tests, including 216 move/spawn reach cases
npm run build            # dist/ plus self-contained play.html
npm run test:browser      # Draft, combat, AI, input, effects and sprite animation checks; dev server required
npm run test:portable     # Offline document with the exact portable HTML bytes
npm run benchmark:ai      # Reproduce the fixed 20-match difficulty comparison
```

Browser checks use `/usr/bin/chromium`, `CHROMIUM_PATH`, or Playwright's installed browser. Run `npx playwright install chromium` on a development computer if needed. `GAME_URL` overrides the default dev server URL. Screenshots are written to `/tmp/` by the checks. The portable build deliberately embeds about 1 MB of source GIF assets; Vite's large-chunk advisory is expected for this single-file deliverable. Do not edit `play.html` by hand; rebuild it after source changes.

## Modules

`simulation.js` owns fixed 60 Hz terrain, wind, physics, commands, resources, attack patterns and match rules. `traceShot` and live shots share `advanceProjectile`. Gravity is 440 px/s², launch speed is 260 + power × 5.6, and the mask is 1280×680 with sea at y=632. Projectile steps are at most 3 pixels. Rendering and sprite timing cannot change hits.

`draft.js` owns snake/random teams and CPU picks. `ai.js` owns bounded candidate search, tactical scoring, refinement and movement plans. `targeting.js` owns optional pointer arc search. `content.js` owns roster/move/map/difficulty data. `sprites.js` decodes the original GIFs into at most 28 sampled composited frames per species, preserving disposal semantics. `effects.js` draws the 36 custom move effects. `renderer.js` owns camera, terrain caching and choreography; `art.js` draws original trainers and primitives. `audio.js` synthesizes sound; `main.js` owns UI and commands.

Phases: aim → summon/throw → flight → remote emergence/attack (when applicable) → settle → recall → handoff/victory. State hashes include teams, ammo, statuses, live shots, fragments and RNG state. They support regression checks, not an implemented online protocol. Settings schema version 1 persists locally; matches do not save.

## Assets, evidence and remaining work

The sprites are actual Black/White animated front sprites from a pinned PokeAPI archive revision. Full ownership/source/checksum information is in [assets/ATTRIBUTION.md](assets/ATTRIBUTION.md) and its manifest. They remain third-party Pokémon IP; this is an unofficial fan game. Original trainer/background/effect code is separate and replaceable. No external fonts, asset APIs or runtime downloads are needed.

See [docs/ARTILLERY-REVISION.md](docs/ARTILLERY-REVISION.md), [docs/VALIDATION.md](docs/VALIDATION.md) and the retained [inventory](docs/PLAYABILITY-INVENTORY.md). The cloud browser blocks direct `file://` navigation by administrator policy; the portable smoke check loads the exact standalone bytes into an offline browser document and asserts zero HTTP requests. Actual Mac double-click, Safari/Firefox/Edge, real touch devices, audio quality, long-session memory/performance and human balance remain manual validation.

Online multiplayer/reconnection, persistent Pokémon Battle mode, global terrain wet/fire/ice overlays, campaign/progression, saved matches/replay UI, remappable controls/gamepad and production rights clearance remain future work. Chilled trainers do not create persistent frozen-water platforms. Drafts and random teams are implemented; these are no longer a future placeholder.
