import { W, SPAWNS } from "./world.js";
// Gameplay silhouettes are independent from scenery. Heights are authoritative.
export const landscapes = [
  {
    id: "rolling",
    name: "Rolling hills",
    hint: "Open arcs and gentle slopes. A good place to learn.",
  },
  {
    id: "mountain",
    name: "The divide",
    hint: "A central mountain: arc over it, excavate, or move.",
  },
  {
    id: "valley",
    name: "Deep valley",
    hint: "High starts above a low basin. Water and falling matter.",
  },
  {
    id: "peaks",
    name: "Twin peaks",
    hint: "Two exposed perches. Remove support or knock a rival downhill.",
  },
  {
    id: "mesa",
    name: "Mesa country",
    hint: "Wide shelves, steep faces and channels for rolling attacks.",
  },
  {
    id: "basin",
    name: "Crater lake",
    hint: "A broad bowl that collects runoff and burning material.",
  },
  {
    id: "islands",
    name: "Split islands",
    hint: "A sea channel divides the arena. Watch your footing.",
  },
];
const recipes = {
  rolling: [440, 405, 380, 430, 495, 450, 465, 410, 425],
  mountain: [465, 440, 425, 335, 205, 330, 425, 440, 465],
  valley: [290, 285, 330, 460, 525, 460, 330, 285, 290],
  peaks: [470, 350, 260, 430, 520, 430, 260, 350, 470],
  mesa: [465, 430, 400, 400, 265, 265, 380, 380, 450],
  basin: [345, 355, 410, 510, 535, 510, 410, 355, 345],
  islands: [430, 380, 385, 445, 485, 445, 385, 380, 430],
};
function noise(seed, i) {
  let n = Math.imul((seed | 0) ^ Math.imul(i + 71, 374761393), 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
export function makeHeights(
  seed,
  profile = "rolling",
  relief = "normal",
  width = W,
) {
  const recipe = recipes[profile] || recipes.rolling;
  const dramatic = relief === "dramatic" ? 1.28 : 1;
  const knots = recipe.map(
    (v, i) => 590 + (v - 420) * dramatic * 1.45 + (noise(seed, i) - 0.5) * 56,
  );
  const heights = new Int16Array(width);
  for (let x = 0; x < width; x++) {
    const u = (x / (width - 1)) * 8,
      i = Math.min(7, Math.floor(u)),
      t = u - i;
    const q = t * t * (3 - 2 * t);
    const texture = 6 * Math.sin(x / (24 + noise(seed, 25) * 30) + (seed % 11));
    heights[x] = Math.max(
      210,
      Math.min(
        785,
        Math.round(knots[i] * (1 - q) + knots[i + 1] * q + texture),
      ),
    );
  }
  // Safe footing, without giving both players identical terrain.
  for (const x of SPAWNS) {
    const shelf = heights[x];
    for (let i = x - 65; i <= x + 65; i++) {
      const d = Math.abs(i - x),
        q = Math.max(0, Math.min(1, (d - 34) / 31));
      heights[i] = Math.round(shelf * (1 - q) + heights[i] * q);
    }
  }
  return heights;
}
