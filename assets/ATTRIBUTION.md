# Pokémon sprite provenance

These are actual Pokémon Black/White animated front sprites, retrieved from the public **PokeAPI/sprites** archive at commit `ba403973fdf9d0ac59175813861e6a1f8ed5020c`.

- Archive: https://github.com/PokeAPI/sprites
- Exact source URLs, Pokédex numbers, SHA-256 checksums and byte counts: [pokemon/manifest.json](pokemon/manifest.json).
- Sprite images and Pokémon identities are owned by Nintendo / Creatures Inc. / GAME FREAK / The Pokémon Company. An archive's code license does not grant ownership or commercial rights to the game artwork. This remains an unofficial fan game.
- `gifuct-js` decodes the original GIF frame patches in-browser. The original GIFs are preserved without recoloring or redrawing. Runtime canvases compose their disposal/frame metadata and sample at most 28 frames per species to bound memory. Sprite motion and attack choreography are presentation only.
- All sprites are embedded by Vite in the portable `play.html`; gameplay does not call PokeAPI or download assets. Source downloads use HTTPS with normal certificate verification.
- Source code, backgrounds, trainer art and move-effect drawing are repository code, separate from these third-party sprite assets. Replacing `src/content.js` and `src/sprites.js` supports a future original-creature version.
