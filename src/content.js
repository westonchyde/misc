// Canonical Pokémon move names; battle mechanics are artillery adaptations.
const attack = (
  id,
  name,
  kind,
  damage,
  radius,
  force,
  effect,
  description,
  extra = {},
) => ({
  id,
  name,
  kind,
  damage,
  radius,
  force,
  effect,
  description,
  visual: id,
  cooldown: 0,
  ammo: 3,
  range: 3400,
  ...extra,
});
const species = (id, dex, name, element, color, role, moves) => ({
  id,
  dex,
  name,
  element,
  color,
  role,
  moves,
});
export const roster = [
  species(
    "charizard",
    6,
    "Charizard",
    "FIRE",
    "#ff9b50",
    "Flame zones & crossfire",
    [
      attack(
        "flamethrower",
        "Flamethrower",
        "relay",
        31,
        74,
        105,
        "burn",
        "Arc a Poké Ball across the map. Charizard emerges and sweeps the landing zone with flame.",
        { pattern: "fan" },
      ),
      attack(
        "fire-blast",
        "Fire Blast",
        "lob",
        35,
        43,
        140,
        "burn",
        "A blazing fireball bursts into a five-point fire cross.",
        { pattern: "cross", cooldown: 1, ammo: 2 },
      ),
    ],
  ),
  species(
    "blastoise",
    9,
    "Blastoise",
    "WATER",
    "#78d4f4",
    "Soak & displacement",
    [
      attack(
        "hydro-pump",
        "Hydro Pump",
        "lob",
        27,
        49,
        290,
        "wet",
        "An arcing torrent hits with enormous knockback and soaks the target.",
      ),
      attack(
        "water-pulse",
        "Water Pulse",
        "lob",
        26,
        82,
        130,
        "wet",
        "A water sphere expands into wide concentric shockwaves.",
        { pattern: "ring", cooldown: 1, ammo: 2 },
      ),
    ],
  ),
  species(
    "pikachu",
    25,
    "Pikachu",
    "ELECTRIC",
    "#ffe169",
    "Lightning & wet combos",
    [
      attack(
        "thunderbolt",
        "Thunderbolt",
        "relay",
        33,
        48,
        100,
        "electric",
        "Place a lightning beacon with an arcing ball. Pikachu calls a forked bolt down on it.",
      ),
      attack(
        "electro-ball",
        "Electro Ball",
        "cluster",
        30,
        34,
        125,
        "electric",
        "An electric orb splits into three charged bursts around its landing.",
        { pattern: "cluster", cooldown: 1, ammo: 2 },
      ),
    ],
  ),
  species("golem", 76, "Golem", "ROCK", "#d6c49f", "Barrage & earthquakes", [
    attack(
      "rock-blast",
      "Rock Blast",
      "salvo",
      12,
      27,
      70,
      null,
      "Launch three heavy rocks in a tight, wind-affected barrage.",
      { count: 3, spread: 2 },
    ),
    attack(
      "earthquake",
      "Earthquake",
      "relay",
      33,
      140,
      190,
      null,
      "Golem emerges at the landing marker and sends a broad seismic wave through the ground.",
      { pattern: "seismic", cooldown: 1, ammo: 2 },
    ),
  ]),
  species("gengar", 94, "Gengar", "GHOST", "#bfa0ff", "Phase & poison", [
    attack(
      "shadow-ball",
      "Shadow Ball",
      "phase",
      31,
      47,
      115,
      null,
      "A ghost orb phases through rising terrain, exploding as it descends.",
    ),
    attack(
      "sludge-bomb",
      "Sludge Bomb",
      "cluster",
      27,
      45,
      95,
      "poison",
      "A sludge globe bursts into poisonous splashes that drain HP on two turns.",
      { pattern: "cluster", cooldown: 1, ammo: 2 },
    ),
  ]),
  species(
    "snorlax",
    143,
    "Snorlax",
    "NORMAL",
    "#9dd7b9",
    "Body impact & heavy beam",
    [
      attack(
        "body-slam",
        "Body Slam",
        "relay",
        36,
        60,
        235,
        null,
        "Arc the ball to any part of the field. Snorlax drops onto the landing point.",
        { pattern: "slam" },
      ),
      attack(
        "hyper-beam",
        "Hyper Beam",
        "beam",
        46,
        18,
        170,
        null,
        "Charge a huge golden beam that crosses the entire arena and drills terrain.",
        { cooldown: 2, ammo: 2 },
      ),
    ],
  ),
  species(
    "venusaur",
    3,
    "Venusaur",
    "GRASS",
    "#9cd487",
    "Seeds & solar power",
    [
      attack(
        "seed-bomb",
        "Seed Bomb",
        "cluster",
        29,
        42,
        105,
        null,
        "An explosive seed scatters three smaller seeds into nearby ground.",
        { pattern: "cluster" },
      ),
      attack(
        "solar-beam",
        "Solar Beam",
        "beam",
        40,
        14,
        125,
        null,
        "Gather sunlight, then cut a full-arena path with a green-white solar lance.",
        { cooldown: 1, ammo: 2 },
      ),
    ],
  ),
  species(
    "alakazam",
    65,
    "Alakazam",
    "PSYCHIC",
    "#efb5df",
    "Levitate & precision",
    [
      attack(
        "psybeam",
        "Psybeam",
        "lob",
        29,
        46,
        130,
        "curse",
        "A rainbow psychic spiral arcs over cover and disrupts the next movement turn.",
      ),
      attack(
        "psychic",
        "Psychic",
        "relay",
        31,
        72,
        290,
        "curse",
        "Alakazam levitates the target zone and slams it down with psychic force.",
        { pattern: "lift", cooldown: 1, ammo: 2 },
      ),
    ],
  ),
  species(
    "machamp",
    68,
    "Machamp",
    "FIGHTING",
    "#b7c6d5",
    "Punches & aura blasts",
    [
      attack(
        "dynamic-punch",
        "Dynamic Punch",
        "relay",
        33,
        57,
        220,
        "curse",
        "Machamp arrives in a burst of fists. Disruption halves the next movement budget.",
      ),
      attack(
        "focus-blast",
        "Focus Blast",
        "lob",
        39,
        64,
        175,
        null,
        "A dense blue aura sphere drives a deep, wide crater into cover.",
        { cooldown: 1, ammo: 2 },
      ),
    ],
  ),
  species(
    "gyarados",
    130,
    "Gyarados",
    "WATER",
    "#77c6ef",
    "Tidal sweep & dragon fire",
    [
      attack(
        "aqua-tail",
        "Aqua Tail",
        "relay",
        30,
        95,
        275,
        "wet",
        "A sweeping tidal tail hits a broad area and throws soaked opponents sideways.",
        { pattern: "sweep" },
      ),
      attack(
        "dragon-rage",
        "Dragon Rage",
        "lob",
        35,
        56,
        160,
        null,
        "A dragon-shaped flare tears through the air and erupts on impact.",
        { cooldown: 1, ammo: 2 },
      ),
    ],
  ),
  species("lapras", 131, "Lapras", "ICE", "#a0e7fa", "Shards & freezing", [
    attack(
      "ice-shard",
      "Ice Shard",
      "salvo",
      12,
      25,
      65,
      "chill",
      "Three spinning ice shards cut small craters and reduce next-turn movement.",
      { count: 3, spread: 2 },
    ),
    attack(
      "ice-beam",
      "Ice Beam",
      "beam",
      30,
      12,
      90,
      "chill",
      "A full-arena ice ray freezes the target. Deals extra damage to wet trainers.",
      { cooldown: 1, ammo: 2 },
    ),
  ]),
  species(
    "dragonite",
    149,
    "Dragonite",
    "DRAGON",
    "#ffc785",
    "Wind & meteor rain",
    [
      attack(
        "hurricane",
        "Hurricane",
        "relay",
        28,
        99,
        330,
        null,
        "A targeted tornado tears open the ground and launches nearby trainers.",
        { pattern: "lift" },
      ),
      attack(
        "draco-meteor",
        "Draco Meteor",
        "cluster",
        38,
        42,
        155,
        null,
        "A star flare calls down three staggered meteors around the landing point.",
        { pattern: "meteor", cooldown: 2, ammo: 2 },
      ),
    ],
  ),
  species(
    "tyranitar",
    248,
    "Tyranitar",
    "ROCK",
    "#b5c590",
    "Spikes & armor breaking",
    [
      attack(
        "stone-edge",
        "Stone Edge",
        "relay",
        32,
        70,
        170,
        null,
        "A row of jagged stone spikes erupts from the landing zone.",
        { pattern: "spikes" },
      ),
      attack(
        "crunch",
        "Crunch",
        "relay",
        36,
        65,
        175,
        null,
        "Tyranitar lunges through a huge spectral jaw that crushes cover.",
        { pattern: "bite", cooldown: 1, ammo: 2 },
      ),
    ],
  ),
  species(
    "scizor",
    212,
    "Scizor",
    "STEEL",
    "#ee9d98",
    "Metal barrage & cross cuts",
    [
      attack(
        "bullet-punch",
        "Bullet Punch",
        "salvo",
        8,
        20,
        45,
        null,
        "Five fast steel punches arc as a compact metallic barrage.",
        { count: 5, spread: 1.4 },
      ),
      attack(
        "x-scissor",
        "X-Scissor",
        "relay",
        36,
        65,
        155,
        null,
        "Scizor dashes in and carves two intersecting blades into the terrain.",
        { pattern: "crosscut", cooldown: 1, ammo: 2 },
      ),
    ],
  ),
  species(
    "espeon",
    196,
    "Espeon",
    "PSYCHIC",
    "#d4b8f4",
    "Stars & psychic volleys",
    [
      attack(
        "swift",
        "Swift",
        "salvo",
        8,
        24,
        45,
        null,
        "Five rotating stars fan out over cover in a golden volley.",
        { count: 5, spread: 2.2 },
      ),
      attack(
        "psyshock",
        "Psyshock",
        "relay",
        34,
        78,
        160,
        null,
        "Three psychic satellites converge on the landing zone.",
        { pattern: "orbit", cooldown: 1, ammo: 2 },
      ),
    ],
  ),
  species("umbreon", 197, "Umbreon", "DARK", "#b8accb", "Weaken & disrupt", [
    attack(
      "snarl",
      "Snarl",
      "lob",
      26,
      68,
      105,
      "weaken",
      "Dark sound waves arc across the field and reduce the rival’s next attack damage.",
    ),
    attack(
      "dark-pulse",
      "Dark Pulse",
      "relay",
      32,
      90,
      150,
      "curse",
      "Expanding black-violet rings reach around cover and disrupt movement.",
      { pattern: "ring", cooldown: 1, ammo: 2 },
    ),
  ]),
  species(
    "typhlosion",
    157,
    "Typhlosion",
    "FIRE",
    "#f2b170",
    "Lava fields & eruptions",
    [
      attack(
        "lava-plume",
        "Lava Plume",
        "lob",
        30,
        75,
        130,
        "burn",
        "A molten plume arcs over the battlefield and blooms into a fire flower.",
      ),
      attack(
        "eruption",
        "Eruption",
        "relay",
        39,
        105,
        220,
        "burn",
        "Typhlosion triggers a volcanic column and showers the impact zone with magma.",
        { pattern: "eruption", cooldown: 2, ammo: 2 },
      ),
    ],
  ),
  species(
    "garchomp",
    445,
    "Garchomp",
    "GROUND",
    "#a6b4e9",
    "Burrow & dragon charge",
    [
      attack(
        "dig",
        "Dig",
        "burrow",
        29,
        62,
        155,
        null,
        "Aim a long-range burrowing marker. Garchomp excavates a deep shaft and side tunnels.",
        { pattern: "tunnel" },
      ),
      attack(
        "dragon-rush",
        "Dragon Rush",
        "relay",
        40,
        62,
        260,
        null,
        "Garchomp streaks down a blue dragon trail and crashes into the landing zone.",
        { pattern: "rush", cooldown: 1, ammo: 2 },
      ),
    ],
  ),
];
roster.push(
  species(
    "dugtrio",
    51,
    "Dugtrio",
    "GROUND",
    "#d7b58c",
    "Rescue excavation & muddy cover",
    [
      attack(
        "dugtrio-dig",
        "Dig",
        "utility",
        0,
        55,
        0,
        null,
        "Dig an escape tunnel and emerge 220 px in the facing direction. No damage; spends your attack.",
        {
          ammo: 2,
          visual: "rescue-dig",
          behavior: "rescue",
          family: "Self rescue",
          terrain: "Escape tunnel · no enemy damage",
          counter:
            "Use when trapped. Choose an exit direction; this costs a turn.",
        },
      ),
      attack(
        "mud-bomb",
        "Mud Bomb",
        "lob",
        18,
        42,
        45,
        "mud",
        "A weak mud hit piles real earth beside the impact. Mud slows the rival; the mounds can protect either player.",
        {
          visual: "mud-bomb",
          behavior: "mud",
          family: "Terrain creation",
          terrain: "Two mud banks + 30% movement penalty",
          counter:
            "Weak damage. Jump or dig out; newly created cover can also protect its target.",
          ammo: 4,
        },
      ),
    ],
  ),
  species(
    "octillery",
    224,
    "Octillery",
    "WATER",
    "#e4a697",
    "Precision sniper & small reliable shots",
    [
      attack(
        "octazooka",
        "Octazooka",
        "precision",
        100,
        3,
        85,
        null,
        "A very fast ink shot. Direct body hit: 100 damage. A near miss deals zero; solid cover stops it.",
        {
          visual: "octazooka",
          behavior: "sniper",
          family: "Direct-hit sniper",
          terrain: "Small impact chip · stops at cover",
          counter:
            "No splash damage. Requires a clear firing line and precise aim.",
          directOnly: true,
          velocity: 1900,
          gravityScale: 0.035,
          windScale: 0,
          ammo: 2,
          cooldown: 1,
        },
      ),
      attack(
        "bubble-beam",
        "Bubble Beam",
        "salvo",
        6,
        26,
        20,
        "wet",
        "Five forgiving bubbles: only 6 damage each, but wide coverage and wetness. A weak, plentiful fallback.",
        {
          visual: "bubble-beam",
          behavior: "bubbles",
          family: "Small reliable barrage",
          terrain: "Tiny chips · wets targets",
          counter:
            "Only 30 base damage if all five land; useful when stronger moves are unavailable.",
          count: 5,
          spread: 1.1,
          ammo: 5,
        },
      ),
    ],
  ),
);
const elementColors = {
  FIRE: "#ff9b50",
  WATER: "#78d4f4",
  ELECTRIC: "#ffe169",
  ROCK: "#d6c49f",
  GHOST: "#bfa0ff",
  NORMAL: "#9dd7b9",
  GRASS: "#9cd487",
  PSYCHIC: "#d4b8f4",
  FIGHTING: "#b7c6d5",
  ICE: "#a0e7fa",
  DRAGON: "#ffc785",
  STEEL: "#ee9d98",
  DARK: "#b8accb",
  GROUND: "#a6b4e9",
};
// Each move has an inspectable tactical identity, independent from its illustration.
const mechanics = {
  "fire-blast": {
    behavior: "firecross",
    family: "Cross-shaped burst",
    terrain: "Cross cut + short fire patches",
    counter: "Precise center damage with a narrow cross-shaped footprint.",
  },
  earthquake: {
    behavior: "quake",
    family: "Ground shockwave",
    terrain: "Traveling ground ruptures",
    counter: "Wide reach near ground; danger to nearby support.",
  },
  "aqua-tail": {
    behavior: "tidal",
    family: "Tidal sweep",
    terrain: "Broad wet strip + displacement",
    counter: "A broad sweep, with less focused push than Hydro Pump.",
  },
  "draco-meteor": {
    behavior: "meteors",
    family: "Falling meteors",
    terrain: "Three physical descending meteors",
    counter:
      "Wide coverage; individual meteors can be stopped by higher cover.",
  },
  psychic: {
    behavior: "levitate",
    family: "Telekinetic lift",
    terrain: "Suspends, then throws",
    counter: "Vertical force threatens fall damage; avoid exposed perches.",
  },
  flamethrower: {
    behavior: "flame",
    family: "Flame sweep",
    terrain: "Burning strip · 4 HP/turn",
    counter: "Water extinguishes ground fire; move out of the strip.",
    description:
      "Relay Charizard to the landing zone. A sustained flame sweep scorches a strip; ground fire lasts four turns.",
  },
  "hydro-pump": {
    behavior: "stream",
    family: "Pressure stream",
    terrain: "Runoff · directional shove",
    counter: "Higher ground sheds runoff. Avoid the sea edge.",
    description:
      "Four connected water pulses follow your arc. Cannon pressure shoves in the direction of travel; runoff wets lower ground.",
    gravityScale: 0.92,
  },
  "water-pulse": {
    behavior: "water",
    family: "Expanding pulse",
    terrain: "Wide wet ground",
    counter: "Broad coverage, less displacement than Hydro Pump.",
  },
  "rock-blast": {
    behavior: "bounce",
    family: "Bouncing barrage",
    terrain: "Three tumbling rocks · 2 bounces",
    counter: "Slopes redirect rocks; steep cover catches low shots.",
    description:
      "Three heavy rocks tumble, bounce twice and roll down slopes before shattering.",
    gravityScale: 1.1,
  },
  "seed-bomb": {
    behavior: "seeds",
    family: "Physical cluster",
    terrain: "Three falling seed fragments",
    counter: "Wide coverage trades precise damage for spread.",
    description:
      "A seed casing bursts into three physical seed fragments. Each falls and collides with the terrain.",
  },
  "sludge-bomb": {
    behavior: "sludge",
    family: "Sludge cluster",
    terrain: "Poison patches · 3 HP/turn",
    counter: "A small persistent zone; leave it before your next turn.",
  },
  dig: {
    behavior: "burrow",
    family: "Traveling burrow",
    terrain: "Horizontal tunnel + exit shaft",
    counter: "Destroys support; can leave a deep crater.",
    description:
      "Relay Garchomp to a burrow entry. It excavates a traveling underground route, then bursts out beneath the target.",
  },
  thunderbolt: {
    behavior: "lightning",
    family: "Sky strike",
    terrain: "Conducts through connected wet patches",
    counter: "Stay out of wet ground; dry gaps stop conduction.",
    description:
      "Pikachu calls a branching sky strike. Connected wet patches conduct the strike beyond its direct impact.",
  },
  "ice-beam": {
    behavior: "freeze",
    family: "Freezing beam",
    terrain: "Freezes wet ground for 4 turns",
    counter: "Ice melts after four turns; watch your support.",
    description:
      "A crisp ice beam excavates its path and freezes wet patches into temporary, solid ice shelves.",
  },
  "lava-plume": {
    behavior: "lava",
    family: "Molten splash",
    terrain: "Falling molten globs · burning pools",
    counter: "Globs spread downhill. Water extinguishes their pools.",
    description:
      "A molten core bursts into falling lava globs. Each leaves a burning pool; water extinguishes it.",
  },
  "body-slam": {
    behavior: "slam",
    family: "Heavy impact",
    terrain: "Deep crater · strong lift",
    counter: "Powerful knockback, but a precise landing matters.",
  },
  hurricane: {
    behavior: "vortex",
    family: "Vortex",
    terrain: "Sustained pull and lift",
    counter: "Broad disruption; dangerous near drops.",
  },
};
const anchors = {
  dugtrio: [55, -30],
  octillery: [66, -44],
  charizard: [64, -55],
  blastoise: [44, -68],
  pikachu: [56, -40],
  golem: [55, -35],
  gengar: [58, -45],
  snorlax: [60, -42],
  venusaur: [59, -45],
  alakazam: [60, -52],
  machamp: [65, -45],
  gyarados: [60, -68],
  lapras: [60, -55],
  dragonite: [60, -52],
  tyranitar: [60, -50],
  scizor: [65, -45],
  espeon: [57, -38],
  umbreon: [57, -38],
  typhlosion: [60, -45],
  garchomp: [65, -50],
};
for (const s of roster)
  for (const m of s.moves) {
    const authored = {
      behavior: m.behavior,
      family: m.family,
      terrain: m.terrain,
      counter: m.counter,
    };
    Object.assign(
      m,
      {
        species: s.id,
        anchor: anchors[s.id],
        behavior: m.kind,
        family: {
          relay: "Relay summon",
          lob: "Arcing shot",
          cluster: "Cluster bursts",
          salvo: "Spread barrage",
          beam: "Terrain-cutting beam",
          phase: "Phasing orb",
          burrow: "Burrow",
        }[m.kind],
        terrain: "Crater + " + (m.effect || "impact"),
        counter: "Terrain, spacing and careful aim matter.",
      },
      mechanics[m.id],
    );
    for (const [k, v] of Object.entries(authored))
      if (v !== undefined) m[k] = v;
    m.color = s.id === "dugtrio" ? "#c4a071" : elementColors[s.element];
  }

const balance = {
  flamethrower: { damage: 32, force: 95 },
  "fire-blast": {
    damage: 78,
    radius: 70,
    force: 150,
    ammo: 2,
    cooldown: 1,
    tier: "HEAVY",
  },
  "hydro-pump": {
    damage: 64,
    radius: 38,
    force: 245,
    behavior: "hydro-rocket",
    family: "Water rocket",
    terrainRadius: 24,
    terrain: "Focused crater · strong horizontal shove",
    description:
      "One high-pressure water rocket. A tight 64-damage blast with directional knockback; it does not fill a pit.",
    counter:
      "Narrower than Water Spout. Aim for a direct impact; avoid sea edges.",
    gravityScale: 1,
    ammo: 3,
    tier: "HEAVY",
  },
  "water-pulse": {
    id: "water-spout",
    name: "Water Spout",
    visual: "water-spout",
    damage: 0,
    radius: 130,
    force: 0,
    effect: "wet",
    behavior: "flood",
    family: "Pit-filling water",
    pattern: null,
    terrainRadius: 0,
    ammo: 2,
    cooldown: 1,
    waterVolume: 640,
    description:
      "Pour a reservoir of water into the landing area. It fills low ground and deals repeated 10-damage drowning ticks before draining.",
    terrain: "Real pool · up to 80 damage in 10-point ticks",
    counter:
      "Little damage on open slopes; powerful in deep pits. Both trainers can drown.",
    tier: "SPECIAL",
  },
  thunderbolt: { damage: 48 },
  "electro-ball": { damage: 36 },
  "rock-blast": { damage: 16 },
  earthquake: {
    damage: 18,
    force: 70,
    radius: 125,
    terrainRadius: 180,
    family: "Mountain mover",
    terrain: "Huge excavation · only 18 base damage",
    description:
      "Trade damage for excavation. Golem removes a huge section of hillside and ruptures nearby ground.",
    counter: "Only 18 damage. Use to open a firing line or remove support.",
    tier: "UTILITY",
  },
  "shadow-ball": { damage: 44 },
  "sludge-bomb": { damage: 28 },
  "body-slam": { damage: 58, force: 220 },
  "hyper-beam": { damage: 90, radius: 8, force: 100, ammo: 1, tier: "HEAVY" },
  "seed-bomb": { damage: 45 },
  "solar-beam": { damage: 75, radius: 5, ammo: 2 },
  psybeam: { damage: 24, radius: 32, ammo: 5, tier: "LIGHT" },
  psychic: { damage: 32, force: 200 },
  "dynamic-punch": { damage: 55 },
  "focus-blast": { damage: 85, radius: 64, ammo: 2, tier: "HEAVY" },
  "aqua-tail": { damage: 38 },
  "dragon-rage": { damage: 26, radius: 34, ammo: 5, tier: "LIGHT" },
  "ice-shard": { damage: 9, ammo: 4 },
  "ice-beam": { damage: 34, radius: 12 },
  hurricane: { damage: 22, force: 75 },
  "draco-meteor": { damage: 108, radius: 50, ammo: 1, tier: "HEAVY" },
  "stone-edge": { damage: 36 },
  crunch: { damage: 62 },
  "bullet-punch": { damage: 4, ammo: 6, tier: "LIGHT" },
  "x-scissor": { damage: 54 },
  swift: {
    damage: 6,
    homing: { range: 350, turn: 1.15 },
    family: "Guided stars",
    terrain: "Limited steering · only 30 total base damage",
    description:
      "Five weak stars steer toward a nearby rival during their final approach. They cannot pass through cover.",
    counter: "Steering only works within 350 px; a bad launch still misses.",
    tier: "LIGHT",
  },
  psyshock: { damage: 42 },
  snarl: { damage: 14, ammo: 5, tier: "LIGHT" },
  "dark-pulse": { damage: 40 },
  "lava-plume": { damage: 35 },
  eruption: { damage: 82, ammo: 1, tier: "HEAVY" },
  dig: {
    damage: 50,
    seekRange: 280,
    family: "Burrowing seeker",
    description:
      "Land Garchomp within 280 px of the rival. It tracks along an underground tunnel before surfacing; distant landings do not home.",
    counter:
      "Must land nearby. Excavates support but has limited underground pursuit.",
  },
  "dragon-rush": { damage: 68 },
};
for (const s of roster)
  for (const m of s.moves) {
    const change = balance[m.id];
    if (change) Object.assign(m, change);
    m.tier ||=
      m.kind === "utility" || m.damage === 0
        ? "SPECIAL"
        : m.damage * (m.count || 1) >= 70
          ? "HEAVY"
          : m.damage * (m.count || 1) <= 30
            ? "LIGHT"
            : "STANDARD";
    m.damageText =
      m.kind === "utility"
        ? "0 · RESCUE"
        : m.behavior === "flood"
          ? "10 × UP TO 8"
          : m.directOnly
            ? "100 · DIRECT ONLY"
            : m.count
              ? `${m.damage} × ${m.count}`
              : String(m.damage);
    m.range = 3400;
  }
export const damageMoves = roster
  .flatMap((s) => s.moves)
  .filter((m) => m.kind !== "utility");
export const BALLISTIC = new Set([
  "lob",
  "phase",
  "relay",
  "salvo",
  "cluster",
  "burrow",
  "precision",
]);
export const REMOTE = new Set(["relay", "burrow"]);
export const difficultyProfiles = {
  easy: {
    name: "Rookie",
    angleStep: 10,
    powerStep: 12,
    refine: 0,
    aimError: 9,
    powerError: 8,
    choices: 4,
    statusWeight: 0,
    terrainWeight: 0,
    selfWeight: 0.7,
    movement: false,
    conserve: false,
    description:
      "Estimates distance with large errors, ignores wind and picks simple attacks. Expect genuine misses; no trajectory search or damage forecasting.",
  },
  normal: {
    name: "Trainer",
    angleStep: 5,
    powerStep: 6,
    refine: 2,
    aimError: 3.6,
    powerError: 3.6,
    choices: 2,
    statusWeight: 1,
    terrainWeight: 0.6,
    selfWeight: 1.5,
    movement: true,
    conserve: true,
    description:
      "Uses wind, combos, cover and remaining shots; repositions when blocked.",
  },
  hard: {
    name: "Ace",
    angleStep: 3,
    powerStep: 4,
    refine: 3,
    aimError: 0.35,
    powerError: 0.4,
    choices: 1,
    statusWeight: 1.8,
    terrainWeight: 1.2,
    selfWeight: 2,
    movement: true,
    conserve: true,
    description:
      "Fine trajectory search, draft synergy, terrain denial and careful resource use. Same damage and rules as you.",
  },
};
export const maps = [
  {
    id: "highlands",
    name: "Verdant Highlands",
    tag: "ROLLING HILLS",
    description: "Grassy ridges, long arcs and room to reposition.",
    sky: ["#80c7da", "#e1edc8"],
    grass: [112, 172, 99],
    soil: [92, 105, 72],
    accent: "#d8f69b",
  },
  {
    id: "sunset",
    name: "Copper Canyon",
    tag: "HIGH GROUND",
    description: "Warm mesas and a low central basin. Mind the drop.",
    sky: ["#a18ac7", "#f4bd93"],
    grass: [196, 140, 94],
    soil: [124, 84, 75],
    accent: "#ffc49c",
  },
  {
    id: "islands",
    name: "Moonlit Crossing",
    tag: "WATER HAZARD",
    description: "Two islands divided by sea. Knockback is king.",
    sky: ["#314b7c", "#8ba6bd"],
    grass: [104, 160, 151],
    soil: [73, 93, 110],
    accent: "#bce5fb",
  },
];
export function validateContent() {
  const ids = new Set(),
    speciesIds = new Set();
  for (const s of roster) {
    if (speciesIds.has(s.id) || !s.dex || s.moves.length !== 2)
      throw new Error(`Invalid species ${s.id}`);
    speciesIds.add(s.id);
    for (const m of s.moves) {
      if (
        ids.has(m.id) ||
        !m.name ||
        !m.visual ||
        ![...BALLISTIC, "beam", "utility"].includes(m.kind) ||
        !Number.isFinite(m.damage) ||
        m.damage < 0 ||
        (m.damage === 0 && !["flood", "rescue"].includes(m.behavior)) ||
        m.radius <= 0 ||
        m.ammo < 1 ||
        m.cooldown < 0 ||
        !m.color ||
        !m.description
      )
        throw new Error(`Invalid move ${m.id}`);
      ids.add(m.id);
    }
  }
  return ids.size;
}
validateContent();
