# Battlefront — Trainer Arena

A browser-playable local hot-seat artillery fan prototype. Two trainers, six visible summon partners, twelve data-driven moves, destructible terrain, movement and jumping, health, status effects, alternating turns, victory/draw and rematch.

## Run

Node 22+ recommended (validated on Node 24). `npm ci --cache /tmp/battlefront-npm`, then `npm run dev`. Build with `npm run build`. Simulation tests: `npm test`.

Use A/D to move, W to jump, arrow keys or sliders to aim, and Space or the summon button to attack. Angle 45° points right; 135° points left. Choose a partner and either move below the battlefield. One attack and 90 pixels of movement per turn. Trainers have 150 HP; falling into the sea is fatal. No turn timer in this slice. Inputs commit immediately on attack; selection and aim are freely adjustable beforehand. No attack resources or trainer elemental typing. Sound defaults off.

## Architecture and decisions

Vanilla JavaScript + Canvas 2D + Vite: minimal tooling, small production bundle, direct access to pixel collision/destruction. `src/simulation.js` owns fixed 60 Hz simulation, seeded terrain, collision, damage and turn phases; it has no DOM dependencies. `src/content.js` defines six replaceable species and twelve move records. `src/main.js` converts input to simulation commands and presents events, terrain, procedural sprites, audio and UI. `src/style.css` owns the responsive HUD. Render timing never determines simulation attack execution. Terrain is an authoritative 1200×620 byte mask; rendering regenerates only after edits. Projectiles sweep in steps no larger than three pixels to limit tunneling. Physics units are pixels and seconds. Gravity is 420 px/s², ballistic speed is 180 + power × 4. Seed 42 is the default map.

Turn phases: aim → summon → flight (lobbed moves) → settle → recall → next turn or victory. Settling waits for grounded survivors with a five-second escape limit. UI animations follow simulation events. Pokémon are summoned attackers; only trainers have HP. A later persistent Pokémon Battle mode should introduce combatant entities rather than put HP into presentation sprites.

Fire burns for two owner turns at 5 HP per turn; water applies wetness; electricity does 1.5× damage to wet trainers; curse reduces movement speed on the next owner turn. Status markers appear beside trainers. Rock Wall adds terrain; Dig removes a horizontal tunnel; Phantom Ray ignores terrain. Other beams carve along their direction. Ballistic previews use the same timestep/gravity as simulation, but do not predict opponent collisions or aftermath. Move power only affects lobbed shots. Explosion damage uses radial falloff without blast occlusion in this slice. Movement budget is intentionally measured as distance, so curse affects speed rather than total reach. No wind or ordinary fall damage yet.

## Assets / provenance

All creature silhouettes, trainer sprites, landscape and effects are procedural shapes drawn in this repository; no ripped sprites, external character artwork or audio recordings. Sound is synthesized. Optional Google Fonts are Barlow Condensed and Inter, with system fallbacks. Pokémon names and character identities belong to their respective rights holders. This is an unofficial fan prototype, not a rights-cleared distribution. Content records and the sprite drawing function are replaceable for an original-creature version.

## Validation and remaining scope

Simulation tests cover seeded repeatability, terrain edits, damage falloff, all twelve move handoffs, statuses, movement/attack limits, victory/draw/sea death and replay repeatability. Browser smoke tests cover loading, move selection, firing/turn handoff, terrain change, help and restart. With the dev server running, use `npm run test:browser` (uses system Chromium at `/usr/bin/chromium`; adjust the executable path in `checks/browser.mjs` on other machines).

This is the first playable milestone, not the completed master brief. Follow-up milestones: stronger animation/recall polish, blast occlusion and collision edge cases; authored maps and terrain overlays (burning/wetness currently affect trainers only); team builder and full menu navigation; configurable rules/save versioning; AI using legal commands; network authority/command validation and reconnect tests; remappable controls/gamepad, touch movement, accessibility and long-match performance profiling. Online play, AI, frozen water, persistent Pokémon, cooldowns and all environmental example interactions are not implemented. Six available species are currently the fixed team; future team selection is separate from roster size.

The available handoff is the design source. The referenced full 50-section master prompt was not included in this chat. Preserve visible summoning, distinct tactical roles and terrain-first combat as the core identity.
