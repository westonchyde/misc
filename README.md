# Pokémon Battlefront — Fan Edition 02

A complete offline match loop for a browser artillery fan game: choose a map, play against a computer or a friend, summon six visible partners, reshape the terrain, and play through victory and rematch.

## Play — no Terminal needed

1. On GitHub choose **Code → Download ZIP**, then unzip the download.
2. Open **`play.html`** in Safari, Chrome, Firefox, or Edge. It is a self-contained generated build: no server, account, Node installation, or asset downloads are required.
3. Choose **Solo expedition** (AI), **Couch rivalry** (shared keyboard), or **Target practice**. Pick a map and press **Enter the battlefield**.

If your browser displays source text instead, use **Open With → Safari/Chrome** on the HTML file. Open the file from the extracted folder, not the ZIP archive or GitHub's source-code viewer. The portable game must be rebuilt after source edits; it does not update itself when source changes. Download a fresh release ZIP to update an existing downloaded copy.

## Controls and rules

| Action | Controls |
| --- | --- |
| Move / jump | A / D / W, or the on-screen buttons |
| Select partner / move | Click, or 1–6 and Q / E |
| Aim | Click or drag on the battlefield; adjust sliders for precision |
| Elevation / power | Left/right arrows; up/down arrows |
| Flip aim direction | F or the direction buttons |
| Commit attack | Space or **Summon & attack** |
| Pause | Escape or **Pause** |

Trainers have **140 HP**. Each turn gives **125 movement points**, with **18** spent per jump and one attack. Default turn timer is **45 seconds**; disable it in setup. Practice has no timer or return fire. Falls can deal up to 35 damage; entering the sea or leaving the world is fatal. Once an attack is committed, simulation and landing resolve before the next trainer acts. You can change selection/aim freely before committing.

Negative elevation aims downhill. Aim dots and endpoint rings use the same trajectory code and wind as attacks. Power affects lobs and Heavy Slam; direct attacks have fixed range/power. Very high arcs may leave the top of the view; a marker tracks an overhead projectile. Previews assume the current trainer position, so aiming while airborne can change the eventual launch point. All six partners are available to each trainer. Trainers have no Pokémon elemental typing.

## The team

| Partner | Moves | Tactical role |
| --- | --- | --- |
| Charizard | Flame Burst / Flamethrower | Arcing fireball or widening close-range cone; burning and excavation |
| Blastoise | Hydro Pump / Water Bomb | Narrow drilling jet or broad splash; strong displacement and wetness |
| Pikachu | Thunderbolt / Electro Ball | Cover-blocked precision bolt or lobbed orb; 50% bonus against wet trainers |
| Golem | Boulder / Rock Wall | Largest crater, or a new pillar that blocks direct shots |
| Gengar | Shadow Ball / Phantom Ray | Terrain-passing orb or ray; curses the rival's next movement budget |
| Snorlax | Heavy Slam / Dig | Visible leap to a ground marker, or a horizontal burrow that removes support |

Fire burns for **4 HP at each of the next two owner turn starts**. Water extinguishes burning and wets for two owner turns. Wetness prevents a new burn and enables the electric multiplier. Curse halves one movement budget. Strong attacks recharge for one or two owner turns; alternate moves remain available. Rock Wall requires empty ground and cannot be placed over a trainer. Explosion damage falls off radially and is reduced behind cover; direct hits receive full base damage.

## Develop

Node 22+ recommended; validated here with Node 24 and npm 11.

```sh
npm ci
npm run dev
```

Open the **Local** URL printed by Vite on the same computer. If port 5173 is occupied, Vite prints another port. A cloud private-network address is not a public game URL. On this managed cloud machine, use `npm ci --cache /tmp/battlefront-npm` if the default npm cache is unwritable.

```sh
npm test                 # Simulation, gameplay and AI regression suite
npm run build            # dist/ plus the portable play.html
npm run test:browser      # UI suite; requires a running dev server
npm run test:portable     # Offline, self-contained build smoke check
```

Browser checks use `/usr/bin/chromium` when available, otherwise Playwright's installed browser. On a development computer, run `npx playwright install chromium` first, or set `CHROMIUM_PATH`. `GAME_URL` overrides the browser suite's default `http://127.0.0.1:5173`. Browser screenshots are written to `/tmp/` in the cloud checks. Generated `play.html` is deliberately committed so ZIP downloads are immediately playable.

## Architecture

- **`src/simulation.js`**: authoritative fixed 60 Hz simulation; seeded terrain and wind; validated commands; body and swept projectile collision; statuses, cooldowns, attack resolution, settling and victory. No DOM, render clocks, or presentation randomness. Gravity 440 px/s²; ballistic speed 240 + power × 4.2. Movement and impulses use pixels/seconds. Terrain is a 1280×680 byte mask, with sea at y=632. Body collision samples an 18×36 region; projectiles advance in steps no larger than 3 pixels. Falling bodies finish before turn handoff.
- **`src/content.js`**: six species, twelve move records, three map styles, content validation. Moves share delivery implementations; species-specific tuning stays in records.
- **`src/ai.js`**: bounded seeded candidate search, refinement, predicted damage/self-damage, status bonuses and legal cooldown checks. UI AI may safely approach before shooting. Rookie/Trainer/Ace vary aim uncertainty. No hidden damage or access to extra move resources.
- **`src/art.js`**: hand-drawn procedural silhouettes and trainer poses. Replaceable rendering layer; no sprite-sheet downloads.
- **`src/renderer.js`**: cached landscape/terrain, aim previews, summon/attack/recall choreography, projectiles, particles, damage numbers, water and restrained camera shake. Render timing never determines attack hits.
- **`src/main.js`**: menus, commands, controls, AI turn orchestration, accessible DOM HUD, pause, results and versioned browser preferences.
- **`src/audio.js`**: synthesized cues; sound defaults off. Presentation noise never enters simulation RNG.
- **`scripts/standalone.mjs`**: embeds the production bundle and styles in `play.html`. No external assets or runtime network requests.

Phases: aim → summon → flight or attack → settle → recall → handoff → aim/victory. Presentation actors have no HP; persistent Pokémon Battle mode would introduce separate combatant entities. `stateHash()` supports deterministic regression checks; it is not a network protocol. Local preferences use schema version 1. Saved matches/replays are not a released feature.

## Validation and limits

The regression inventory is in [docs/PLAYABILITY-INVENTORY.md](docs/PLAYABILITY-INVENTORY.md); exact executed checks are in [docs/VALIDATION.md](docs/VALIDATION.md). Browser automation runs in Chromium here. Direct `file://` navigation is blocked by the cloud browser's administrator policy, so portable-bundle checks load the exact standalone HTML bytes into an offline browser document and assert zero HTTP requests. Safari, Firefox and Edge still need manual platform checks.

This release is a playable offline Trainer Battle, not the entire long-term roadmap. Online multiplayer/reconnect, persistent Pokémon Battle mode, editable teams beyond the fixed six, frozen water and global wet/burning terrain overlays, gamepad/remappable controls, campaigns/unlocks, saved matches, licensed production artwork and extended cross-device balance/performance work remain future scope. Wetness and burning currently belong to trainers. AI search is tactical and bounded, not a human expert opponent. Mobile has touch controls but very small screens remain less readable than a laptop.

## Provenance

All creature/trainer shapes, maps, effects and sounds are created procedurally in this repository. No ripped sprite sheets, external fonts, character artwork, audio recordings or runtime asset services are used. Pokémon names and character identities belong to their rights holders; this is an unofficial fan prototype. Content and drawing modules can be replaced for an original-creature edition. The design handoff retained in this chat is the available source; the referenced full 50-section prompt was not provided as text.
