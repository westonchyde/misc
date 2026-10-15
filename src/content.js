const move = (id, name, kind, values) => ({
  id,
  name,
  kind,
  damage: 0,
  radius: 0,
  force: 0,
  cooldown: 0,
  ...values,
});
export const roster = [
  {
    id: "charizard",
    name: "Charizard",
    element: "FIRE",
    color: "#ff9b50",
    role: "Burn & break cover",
    moves: [
      move("flame-burst", "Flame Burst", "lob", {
        damage: 32,
        radius: 42,
        force: 115,
        effect: "burn",
        color: "#ff9144",
        description:
          "Lob a fireball. The blast burns rivals for 4 damage over their next two turns.",
      }),
      move("flamethrower", "Flamethrower", "cone", {
        damage: 34,
        radius: 30,
        force: 70,
        range: 410,
        effect: "burn",
        cooldown: 1,
        color: "#ffb944",
        description:
          "A widening flame cone burns through cover. Best at close range.",
      }),
    ],
  },
  {
    id: "blastoise",
    name: "Blastoise",
    element: "WATER",
    color: "#78d4f4",
    role: "Displace & soak",
    moves: [
      move("hydro-pump", "Hydro Pump", "jet", {
        damage: 23,
        radius: 15,
        force: 300,
        range: 750,
        effect: "wet",
        cooldown: 1,
        color: "#6bdfff",
        description:
          "A straight jet drills a narrow tunnel and pushes rivals hard. Applies wetness.",
      }),
      move("water-bomb", "Water Bomb", "lob", {
        damage: 25,
        radius: 52,
        force: 200,
        effect: "wet",
        color: "#8be8ff",
        description:
          "A broad splash knocks rivals away and wets them for an electric follow-up.",
      }),
    ],
  },
  {
    id: "pikachu",
    name: "Pikachu",
    element: "ELECTRIC",
    color: "#ffe169",
    role: "Precision & wet combos",
    moves: [
      move("thunderbolt", "Thunderbolt", "bolt", {
        damage: 32,
        radius: 8,
        force: 60,
        range: 820,
        effect: "electric",
        cooldown: 1,
        color: "#ffe86b",
        description:
          "A precise bolt stops at solid cover. Wet rivals take 50% extra damage.",
      }),
      move("electro-ball", "Electro Ball", "lob", {
        damage: 29,
        radius: 34,
        force: 90,
        effect: "electric",
        color: "#fff28c",
        description:
          "An arcing electric orb. Use it over cover, especially after a water attack.",
      }),
    ],
  },
  {
    id: "golem",
    name: "Golem",
    element: "ROCK",
    color: "#d6c49f",
    role: "Excavate & fortify",
    moves: [
      move("boulder", "Boulder", "lob", {
        damage: 40,
        radius: 66,
        force: 165,
        color: "#ccb58b",
        description:
          "A massive boulder makes the biggest crater. Beware your own blast radius.",
      }),
      move("rock-wall", "Rock Wall", "wall", {
        radius: 25,
        range: 105,
        cooldown: 2,
        color: "#c1b38e",
        description:
          "Raise a pillar ahead. Blocks direct electric shots; spectral attacks pass through.",
      }),
    ],
  },
  {
    id: "gengar",
    name: "Gengar",
    element: "GHOST",
    color: "#bfa0ff",
    role: "Bypass & disrupt",
    moves: [
      move("shadow-ball", "Shadow Ball", "phase", {
        damage: 28,
        radius: 36,
        force: 95,
        effect: "curse",
        color: "#c89bff",
        description:
          "A spectral orb passes through terrain, bursting on a rival or at its landing marker.",
      }),
      move("phantom-ray", "Phantom Ray", "ghost", {
        damage: 22,
        radius: 18,
        force: 55,
        range: 650,
        effect: "curse",
        cooldown: 1,
        color: "#cba7ff",
        description:
          "A ray ignores terrain. Curse halves the rival’s movement budget next turn.",
      }),
    ],
  },
  {
    id: "snorlax",
    name: "Snorlax",
    element: "NORMAL",
    color: "#9dd7b9",
    role: "Heavy impact & tunnels",
    moves: [
      move("heavy-slam", "Heavy Slam", "slam", {
        damage: 44,
        radius: 56,
        force: 240,
        range: 450,
        cooldown: 1,
        color: "#bbedd0",
        description:
          "Leap to the ground marker for a crushing impact. Power controls distance.",
      }),
      move("dig", "Dig", "dig", {
        damage: 26,
        radius: 26,
        force: 105,
        range: 340,
        color: "#e0c18b",
        description:
          "Burrow horizontally ahead. Carve a tunnel and undermine a nearby rival.",
      }),
    ],
  },
];
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
  const ids = new Set();
  for (const species of roster)
    for (const m of species.moves) {
      if (
        ids.has(m.id) ||
        !m.name ||
        !Number.isFinite(m.damage) ||
        m.damage < 0 ||
        m.radius < 0 ||
        m.cooldown < 0 ||
        !m.color ||
        !m.description
      )
        throw new Error(`Invalid move: ${m.id}`);
      ids.add(m.id);
    }
  return ids.size;
}
validateContent();
