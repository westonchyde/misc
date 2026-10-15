import { roster } from "./content.js";
import { traceShot, originFor, SEA } from "./simulation.js";

function evaluate(battle, species, moveIndex, angle, power) {
  const move = roster[species].moves[moveIndex],
    me = battle.players[battle.active],
    rival = battle.players[1 - battle.active];
  const trace = traceShot(battle, move, angle, power);
  let score = -8;
  if (["lob", "phase", "slam"].includes(move.kind)) {
    const d = Math.hypot(trace.x - rival.x, trace.y - rival.y),
      self = Math.hypot(trace.x - me.x, trace.y - me.y),
      reach = move.radius + 32;
    score = move.damage * Math.max(0, 1 - Math.max(0, d - 15) / reach);
    if (trace.direct) score = move.damage;
    score -=
      move.damage * Math.max(0, 1 - Math.max(0, self - 15) / reach) * 1.7;
    if (d < move.radius + 50 && trace.y < SEA) score += 4;
  } else if (move.kind !== "wall") {
    const [a, b] = trace.points,
      dx = b.x - a.x,
      dy = b.y - a.y,
      length = Math.hypot(dx, dy);
    const u =
      ((rival.x - a.x) * dx + (rival.y - a.y) * dy) / (length * length || 1);
    const d = Math.hypot(
      a.x + dx * Math.max(0, Math.min(1, u)) - rival.x,
      a.y + dy * Math.max(0, Math.min(1, u)) - rival.y,
    );
    if (u >= 0 && u <= 1 && d < move.radius + 17)
      score = move.damage + move.force * 0.035;
  }
  if (move.effect === "electric" && rival.wet && score > 0) score *= 1.5;
  if (move.effect === "wet" && !rival.wet && score > 0) score += 3;
  if (move.effect === "curse" && score > 0) score += 2;
  if (move.effect === "burn" && rival.wet) score -= 3;
  if (trace.x < 0 || trace.x > 1280) score -= 5;
  return { species, moveIndex, angle, power, score, target: trace };
}
export function planShot(battle) {
  const me = battle.players[battle.active],
    rival = battle.players[1 - battle.active];
  const right = rival.x >= me.x,
    angles = [];
  for (let a = 15; a <= 80; a += 5) angles.push(right ? a : 180 - a);
  const origin = originFor(me, right ? 0 : 180);
  let direct =
    (Math.atan2(origin.y - rival.y, rival.x - origin.x) * 180) / Math.PI;
  if (direct < -90) direct += 360;
  angles.push(Math.max(-65, Math.min(245, direct)));
  let best = { score: -Infinity };
  for (let s = 0; s < roster.length; s++)
    for (let m = 0; m < 2; m++) {
      if (!battle.available(s, m) || roster[s].moves[m].kind === "wall")
        continue;
      const kind = roster[s].moves[m].kind;
      for (const angle of angles)
        for (
          let power = 25;
          power <= 100;
          power += ["lob", "phase", "slam"].includes(kind) ? 5 : 100
        ) {
          const option = evaluate(battle, s, m, angle, power);
          if (option.score > best.score) best = option;
        }
    }
  if (!Number.isFinite(best.score))
    return {
      species: 0,
      moveIndex: 0,
      angle: right ? 45 : 135,
      power: 75,
      score: 0,
    };
  // Refine around the coarse solution while keeping total work bounded.
  const coarse = { ...best };
  for (let da = -3; da <= 3; da++)
    for (let dp = -4; dp <= 4; dp += 2) {
      const a = Math.max(-65, Math.min(245, coarse.angle + da)),
        p = Math.max(20, Math.min(100, coarse.power + dp));
      const option = evaluate(battle, coarse.species, coarse.moveIndex, a, p);
      if (option.score > best.score) best = option;
    }
  const error =
    battle.options.difficulty === "easy"
      ? 5
      : battle.options.difficulty === "hard"
        ? 0
        : 1.2;
  best.angle = Math.max(
    -65,
    Math.min(245, best.angle + (battle.rng() - 0.5) * error),
  );
  return best;
}
export function safeApproach(battle) {
  const me = battle.players[battle.active],
    rival = battle.players[1 - battle.active],
    dir = Math.sign(rival.x - me.x);
  const ahead = me.x + dir * 26;
  if (battle.terrain.top(ahead, me.y - 25) >= SEA - 30) return 0;
  return dir;
}
