import { W, H, SEA } from "./world.js";
export const WATER_CELL = 8;
const COLS = 64,
  ROWS = Math.ceil(H / WATER_CELL);
// A finite reservoir, not an infinite damage zone. Gravity and lateral equalization conserve
// liquid except at open boundaries; solid terrain determines the basin and spill level.
export function createPool(x, y, owner, volume = 640) {
  return {
    x,
    y,
    owner,
    x0: Math.max(
      0,
      Math.min(
        W - COLS * WATER_CELL,
        Math.floor((x - 256) / WATER_CELL) * WATER_CELL,
      ),
    ),
    cols: COLS,
    rows: ROWS,
    grid: new Uint8Array(COLS * ROWS),
    blocked: new Uint8Array(COLS * ROWS),
    terrainVersion: -1,
    age: 0,
    step: 0,
    remaining: volume * 255,
    nextPulse: 0.7,
    pulses: 0,
    damage: [0, 0],
    spillY: SEA,
    duration: 3.9,
  };
}
function liquidAt(pool, x, y) {
  const c = Math.floor((x - pool.x0) / WATER_CELL),
    r = Math.floor(y / WATER_CELL);
  return c >= 0 && c < pool.cols && r >= 0 && r < pool.rows
    ? pool.grid[r * pool.cols + c]
    : 0;
}
export function poolContains(pool, x, y) {
  return liquidAt(pool, x, y) > 96;
}
export function advancePool(pool, b, dt) {
  pool.age += dt;
  pool.step++;
  const n = pool.cols,
    g = pool.grid,
    blocked = pool.blocked;
  if (pool.terrainVersion !== b.terrain.version) {
    pool.terrainVersion = b.terrain.version;
    const center = Math.max(
      1,
      Math.min(n - 2, Math.floor((pool.x - pool.x0) / 8)),
    );
    let left = SEA,
      right = SEA;
    for (let c = center; c >= 0; c--)
      left = Math.min(left, b.terrain.top(pool.x0 + c * 8 + 4));
    for (let c = center; c < n; c++)
      right = Math.min(right, b.terrain.top(pool.x0 + c * 8 + 4));
    pool.spillY = Math.max(left, right);
    for (let r = 0; r < pool.rows; r++)
      for (let c = 0; c < n; c++) {
        const x = pool.x0 + c * 8 + 4,
          y = r * 8 + 4,
          i = r * n + c;
        blocked[i] =
          b.terrain.solid(x, y) ||
          b.terrain.solid(x - 3, y) ||
          b.terrain.solid(x + 3, y) ||
          b.terrain.solid(x, y + 3)
            ? 1
            : 0;
        if (blocked[i]) g[i] = 0;
      }
  }
  if (pool.remaining > 0 && pool.age < 0.85) {
    const center = Math.floor((pool.x - pool.x0) / 8),
      base = Math.max(1, Math.floor((pool.y - 112) / 8));
    let budget = Math.min(pool.remaining, Math.ceil((640 * 255 * dt) / 0.8));
    for (let k = 0; k < 24 && budget > 0; k++) {
      const offset = (k % 2 ? 1 : -1) * Math.ceil(k / 2),
        c = center + offset;
      if (c < 1 || c >= n - 1) continue;
      let row = base;
      while (row > 0 && (blocked[row * n + c] || g[row * n + c] > 230)) row--;
      const i = row * n + c;
      if (blocked[i]) continue;
      const amount = Math.min(255 - g[i], budget);
      g[i] += amount;
      budget -= amount;
      pool.remaining -= amount;
    }
  }
  for (let sub = 0; sub < 2; sub++)
    for (let r = pool.rows - 2; r >= 0; r--) {
      const reverse = (pool.step + sub) % 2;
      for (let k = 0; k < n; k++) {
        const c = reverse ? n - 1 - k : k,
          i = r * n + c,
          v = g[i];
        if (!v) continue;
        const y = r * 8 + 4;
        if (y >= SEA - 5 || c === 0 || c === n - 1) {
          g[i] = 0;
          continue;
        }
        const below = i + n;
        // Water above the lowest open outlet cannot remain as a standing wall on flat ground.
        if ((blocked[below] || g[below] > 200) && y < pool.spillY) {
          g[i] = 0;
          continue;
        }
        if (!blocked[below]) {
          const amount = Math.min(g[i], 255 - g[below]);
          g[below] += amount;
          g[i] -= amount;
        }
        if (!g[i]) continue;
        for (const dir of reverse ? [1, -1] : [-1, 1]) {
          const j = i + dir;
          if (blocked[j]) continue;
          const amount = Math.max(0, Math.floor((g[i] - g[j]) / 3));
          g[i] -= amount;
          g[j] += amount;
        }
      }
    }
  // Fast pressure equalization below the spill line: connected water settles into
  // a level pool instead of retaining a tall numerical mound at the pour point.
  for (let r = pool.rows - 2; r * WATER_CELL >= pool.spillY; r--) {
    let start = 0;
    while (start < n) {
      while (start < n && blocked[r * n + start]) start++;
      let end = start,
        total = 0,
        supported = false;
      while (end < n && !blocked[r * n + end]) {
        total += g[r * n + end];
        supported ||=
          !!blocked[(r + 1) * n + end] || g[(r + 1) * n + end] > 200;
        end++;
      }
      const count = end - start;
      if (count && total && supported) {
        const average = Math.floor(total / count),
          extra = total % count;
        for (let c = start; c < end; c++)
          g[r * n + c] =
            average + ((c - start + pool.step) % count < extra ? 1 : 0);
      }
      start = end + 1;
    }
  }
  if (pool.pulses < 8 && pool.age >= pool.nextPulse) {
    pool.nextPulse += 0.4;
    pool.pulses++;
    for (let i = 0; i < 2; i++) {
      const p = b.players[i];
      if (p.hp <= 0) continue;
      const submerged =
        poolContains(pool, p.x, p.y - 7) && poolContains(pool, p.x, p.y + 12);
      if (submerged) {
        b.damagePlayer(i, 10, pool.owner, 0, 0, null, true);
        pool.damage[i] += 10;
        p.wet = 3;
        p.burn = 0;
      }
    }
  }
  for (const p of b.players)
    if (poolContains(pool, p.x, p.y + 12)) {
      p.wet = Math.max(2, p.wet);
      p.burn = 0;
    }
  return pool.age < pool.duration;
}
export function drawPools(c, b) {
  for (const pool of b.pools) {
    const n = pool.cols,
      g = pool.grid;
    for (let r = 0; r < pool.rows; r++)
      for (let col = 0; col < n; col++) {
        const value = g[r * n + col];
        if (value < 32) continue;
        const x = pool.x0 + col * 8,
          y = r * 8;
        c.fillStyle = value > 180 ? "#338fbecc" : "#6bc9e0aa";
        c.fillRect(x, y, 8, 8);
        if (r === 0 || g[(r - 1) * n + col] < 48) {
          c.fillStyle = "#c0f3ef";
          c.fillRect(x, y, 8, 2);
          if (col % 4 === 0) {
            c.fillStyle = "#eafffb";
            c.fillRect(x + 2, y + 2, 3, 2);
          }
        }
      }
    if (pool.age < 0.9) {
      for (let i = 0; i < 18; i++) {
        const q = (pool.age * 2.3 + i * 0.073) % 1;
        c.fillStyle = i % 3 ? "#75d9ec" : "#e6fffa";
        c.fillRect(
          pool.x + Math.sin(i * 2.3) * 75,
          pool.y - 170 + q * 150,
          4,
          10,
        );
      }
    }
  }
}
