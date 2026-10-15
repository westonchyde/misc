import { traceShot, originFor, GRAVITY } from "./simulation.js";
import { BALLISTIC } from "./content.js";
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
// Pointer assist searches legal arcs to the chosen landing area; manual controls remain independent.
export function aimAt(battle, move, x, y, owner = battle.active) {
  const p = battle.players[owner],
    right = x >= p.x,
    origin = originFor(p, right ? 0 : 180),
    dx = Math.abs(x - origin.x),
    dy = y - origin.y;
  if (!BALLISTIC.has(move.kind)) {
    let angle = (Math.atan2(origin.y - y, x - origin.x) * 180) / Math.PI;
    if (angle < -90) angle += 360;
    return { angle: clamp(angle, -65, 245), power: 55 };
  }
  let best = null;
  const score = (angle, power) => {
    const trace = traceShot(battle, move, angle, power, owner, false),
      distance = Math.hypot(trace.x - x, trace.y - y);
    const value = distance + Math.max(0, -trace.y) * 0.2;
    if (!best || value < best.score) best = { angle, power, score: value };
  };
  for (let elevation = 20; elevation <= 80; elevation += 5) {
    const a = (elevation * Math.PI) / 180,
      denominator = 2 * Math.cos(a) ** 2 * (dy + dx * Math.tan(a));
    if (denominator <= 0) continue;
    const velocity = Math.sqrt((GRAVITY * dx * dx) / denominator),
      power = (velocity - 260) / 5.6;
    if (power >= 18 && power <= 103)
      score(right ? elevation : 180 - elevation, clamp(power, 20, 100));
  }
  if (!best) {
    for (let e = 15; e <= 80; e += 10)
      for (const power of [20, 40, 60, 80, 100])
        score(right ? e : 180 - e, power);
  }
  const base = { ...best };
  for (let da = -2; da <= 2; da++)
    for (let dp = -2; dp <= 2; dp++)
      score(clamp(base.angle + da, -65, 245), clamp(base.power + dp, 20, 100));
  return { angle: best.angle, power: Math.round(best.power * 10) / 10 };
}
