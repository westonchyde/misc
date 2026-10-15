# Draft & artillery revision

User priorities: actual Pokémon sprites and real move names; Pocket Tanks-style pre-battle picking; a larger draft pool; random teams; meaningful AI difficulty; every offensive move capable of spanning the arena; distinct choreography and effects for every move.

Implementation target: 18 Pokémon, 36 canonical move names, six picks each from one exclusive snake draft (0/1/1/0 order); CPU picks in solo, shared picks in hot-seat, seeded random teams and reroll. Three shots per primary move, two per secondary, plus cooldowns. Trainer HP 180. Drafted ownership and resources are enforced in simulation.

Delivery: 33 ballistic/relay attacks and three full-arena beams. Short-range canonical moves use a ballistic Poké Ball relay: trainer throws the ball to the aimed landing zone, Pokémon emerges there, executes its move, then recalls. All ballistic deliveries share full-map reach, wind and previews; damage patterns, salvos, clusters, burrowing and terrain response differ. A range test must find a damaging shot from both default spawn sides for every move on every map. Reach means aiming can hit; cover and poor aim can still block/miss.

Difficulty must change search resolution, tactical scoring, target selection, shot conservation, draft choices and movement, with bounded seeded uncertainty. No extra HP, hidden damage multipliers or access to undrafted Pokémon.

Sprites are pinned PokeAPI archive GIFs with actual animation frames decoded locally. The offline build embeds them and records source URLs/checksums and ownership separately. Move effects and encounter mechanics are original artillery adaptations, not a claim to reproduce main-series battle rules.
