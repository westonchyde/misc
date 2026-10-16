import { roster, BALLISTIC, REMOTE, difficultyProfiles } from "./content.js";
import { traceShot, originFor, SEA, W, RULES } from "./simulation.js";
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function evaluateShot(
  battle,
  species,
  moveIndex,
  angle,
  power,
  trace,
  profile,
) {
  const move = roster[species].moves[moveIndex],
    me = battle.players[battle.active],
    rival = battle.players[1 - battle.active];
  let predicted = 0,
    self = 0,
    alignment = 0;
  const damage = move.damage * (move.kind === "salvo" ? move.count : 1);
  if (BALLISTIC.has(move.kind)) {
    const reach = move.radius + 32 + (move.kind === "cluster" ? 25 : 0),
      d = Math.hypot(trace.x - rival.x, trace.y - rival.y),
      sd = Math.hypot(trace.x - me.x, trace.y - me.y);
    alignment = d;
    predicted = damage * Math.max(0, 1 - Math.max(0, d - 15) / reach);
    if (trace.direct) predicted = damage;
    if (move.kind === "cluster") predicted *= 0.8;
    if (
      d > 32 &&
      !["seismic", "tunnel"].includes(move.pattern) &&
      battle.terrain.lineBlocked(trace.x, trace.y - 5, rival.x, rival.y - 8)
    )
      predicted *= 0.55;
    self = damage * Math.max(0, 1 - Math.max(0, sd - 15) / reach);
  } else {
    const [a, b] = trace.points,
      dx = b.x - a.x,
      dy = b.y - a.y,
      len2 = dx * dx + dy * dy;
    const u = ((rival.x - a.x) * dx + (rival.y - a.y) * dy) / (len2 || 1);
    const d = Math.hypot(
      a.x + dx * clamp(u, 0, 1) - rival.x,
      a.y + dy * clamp(u, 0, 1) - rival.y,
    );
    alignment = d;
    if (u >= 0 && u <= 1 && d < move.radius + 17) predicted = damage;
  }
  if (move.effect === "electric" && rival.wet) predicted *= 1.5;
  if (move.effect === "chill" && rival.wet && predicted > 0) predicted += 8;
  if (me.weaken) predicted *= 0.8;
  let score = predicted - self * profile.selfWeight - alignment * 0.035;
  if (predicted > 0) {
    if (predicted >= rival.hp) score += 30;
    if (
      move.effect === "wet" &&
      !rival.wet &&
      me.team.some((s) =>
        roster[s].moves.some(
          (m) => m.effect === "electric" && me.ammo[m.id] > 0,
        ),
      )
    )
      score += 8 * profile.statusWeight;
    if (
      ["burn", "poison"].includes(move.effect) &&
      !rival[move.effect] &&
      !(move.effect === "burn" && rival.wet)
    )
      score += 6 * profile.statusWeight;
    if (["curse", "weaken", "chill"].includes(move.effect))
      score += 3 * profile.statusWeight;
    if (move.pattern === "lift") score += 8 * profile.terrainWeight;
    if (move.force >= 200) score += 3 * profile.terrainWeight;
    if (
      battle.terrain.top(
        rival.x + Math.sign(rival.x - me.x) * 70,
        rival.y - 10,
      ) >=
      SEA - 20
    )
      score += move.force * 0.04 * profile.terrainWeight;
    if (
      BALLISTIC.has(move.kind) &&
      Math.abs(trace.x - rival.x) < move.radius + 25
    )
      score += 4 * profile.terrainWeight;
  }
  if (
    profile.conserve &&
    me.ammo[move.id] === 1 &&
    move.ammo === 2 &&
    predicted < rival.hp - 15
  )
    score -= 5;
  if (profile.conserve) score -= move.cooldown * 0.7;
  if (move.behavior === "bounce" && Math.sin((angle * Math.PI) / 180) < 0.35)
    score -= 16;
  if (trace.x < 0 || trace.x > W || trace.y >= SEA) score -= 12;
  return {
    species,
    moveIndex,
    angle,
    power,
    score,
    predicted,
    self,
    target: trace,
  };
}
export function planShot(battle) {
  const profile =
      difficultyProfiles[battle.options.difficulty] ||
      difficultyProfiles.normal,
    me = battle.players[battle.active],
    rival = battle.players[1 - battle.active],
    right = rival.x >= me.x;
  const angles = [];
  for (let e = -35; e <= 83; e += profile.angleStep)
    angles.push(right ? e : 180 - e);
  const origin = originFor(me, right ? 0 : 180);
  let direct =
    (Math.atan2(origin.y - rival.y, rival.x - origin.x) * 180) / Math.PI;
  if (direct < -90) direct += 360;
  angles.push(clamp(direct, -65, 245));
  const powers = [];
  for (let p = 20; p <= 100; p += profile.powerStep) powers.push(p);
  if (!powers.includes(100)) powers.push(100);
  const cache = new Map(),
    ranked = [];
  let evaluations = 0;
  function evaluate(s, m, a, p) {
    const move = roster[s].moves[m],
      key = `${move.kind === "beam" ? "beam" : move.kind === "phase" ? "phase" : move.behavior === "bounce" ? "bounce" : "arc"}:${REMOTE.has(move.kind) ? "55,-42" : move.anchor}:${move.gravityScale || 1}:${a.toFixed(3)}:${p.toFixed(3)}`;
    let trace = cache.get(key);
    if (!trace) {
      trace = traceShot(battle, move, a, p, battle.active, false);
      cache.set(key, trace);
    }
    evaluations++;
    return evaluateShot(battle, s, m, a, p, trace, profile);
  }
  for (const s of me.team)
    for (let m = 0; m < 2; m++) {
      if (!battle.available(s, m)) continue;
      let best = null;
      const options = [];
      for (const a of angles)
        for (const p of roster[s].moves[m].kind === "beam" ? [70] : powers) {
          const option = evaluate(s, m, a, p);
          options.push(option);
          if (!best || option.score > best.score) best = option;
        }
      if (best && profile.refine) {
        const base = { ...best };
        for (let da = -profile.refine; da <= profile.refine; da++)
          for (let dp = -profile.refine; dp <= profile.refine; dp++) {
            const option = evaluate(
              s,
              m,
              clamp(base.angle + da, -65, 245),
              clamp(base.power + dp, 20, 100),
            );
            if (option.score > best.score) best = option;
          }
      }
      if (best) {
        ranked.push(best);
        if (battle.options.difficulty !== "easy") {
          options.sort((a, b) => b.score - a.score);
          const alternatives = [];
          for (const o of options) {
            if (
              Math.abs(o.angle - best.angle) < 4 &&
              Math.abs(o.power - best.power) < 7
            )
              continue;
            if (
              alternatives.some(
                (p) =>
                  Math.abs(p.angle - o.angle) < 4 &&
                  Math.abs(p.power - o.power) < 7,
              )
            )
              continue;
            alternatives.push(o);
            if (alternatives.length === 3) break;
          }
          ranked.push(...alternatives);
        }
      }
    }
  if (!ranked.length) return null;
  ranked.sort((a, b) => b.score - a.score);
  let forecasts = 0;
  const forecastCount =
    battle.options.difficulty === "hard"
      ? 10
      : battle.options.difficulty === "normal"
        ? 4
        : 0;
  const forecasted = [];
  const shortlist = [];
  const perMove = new Map();
  for (const option of forecastCount > 0 ? ranked : []) {
    const key = option.species + ":" + option.moveIndex,
      n = perMove.get(key) || 0;
    if (n >= 3) continue;
    shortlist.push(option);
    perMove.set(key, n + 1);
    if (shortlist.length >= forecastCount) break;
  }
  for (const option of shortlist) {
    const sim = battle.fork(),
      owner = battle.active,
      enemy = 1 - owner,
      startTurn = sim.turn;
    if (
      !sim.commit(option.species, option.moveIndex, option.angle, option.power)
    )
      continue;
    for (
      let tick = 0;
      tick < 1200 && sim.phase !== "over" && sim.turn === startTurn;
      tick++
    )
      sim.step();
    const dealt = rival.hp - sim.players[enemy].hp,
      self = me.hp - sim.players[owner].hp;
    const m = roster[option.species].moves[option.moveIndex],
      foe = sim.players[enemy];
    const hazard = sim.hazards.some(
      (h) => h.type !== "water" && Math.abs(h.x - foe.x) < h.radius + 20,
    )
      ? 4 * profile.terrainWeight
      : 0;
    const wetBonus =
      foe.wet &&
      !rival.wet &&
      me.team.some((s) =>
        roster[s].moves.some(
          (m) => m.effect === "electric" && me.ammo[m.id] > 0,
        ),
      )
        ? 6 * profile.statusWeight
        : 0;
    option.score =
      dealt -
      self * profile.selfWeight +
      hazard +
      wetBonus -
      m.cooldown * 0.6 +
      (foe.hp === 0 ? 45 : 0);
    option.forecast = {
      damage: dealt,
      self,
      hazards: sim.hazards.length,
      enemyHP: foe.hp,
    };
    forecasted.push(option);
    forecasts++;
  }
  if (forecasted.length) {
    ranked.length = 0;
    ranked.push(...forecasted);
    ranked.sort((a, b) => b.score - a.score);
  }
  const eligible = ranked
    .filter((p) => p.score >= ranked[0].score - 7)
    .slice(0, profile.choices);
  const choice = { ...eligible[Math.floor(battle.rng() * eligible.length)] };
  choice.angle = clamp(
    choice.angle + (battle.rng() - 0.5) * profile.aimError * 2,
    -65,
    245,
  );
  choice.power = clamp(
    choice.power + (battle.rng() - 0.5) * profile.powerError * 2,
    20,
    100,
  );
  choice.diagnostics = {
    level: battle.options.difficulty,
    forecasts,
    candidates: evaluations,
    trajectories: cache.size,
    legalMoves: ranked.length,
    statusWeight: profile.statusWeight,
    conserve: profile.conserve,
  };
  return choice;
}
export function movementPlan(battle, shot) {
  const profile =
      difficultyProfiles[battle.options.difficulty] ||
      difficultyProfiles.normal,
    me = battle.players[battle.active],
    rival = battle.players[1 - battle.active];
  if (!profile.movement || !me.grounded || battle.budget < 25) return null;
  let direction = 0,
    reason = "";
  const danger = battle.hazards.find(
    (h) =>
      h.type !== "water" &&
      Math.abs(h.x - me.x) < h.radius + 20 &&
      Math.abs(h.y - me.y - 18) < 45,
  );
  if (danger) {
    direction = me.x < danger.x ? -1 : 1;
    reason = "leave hazardous ground";
  } else if (
    battle.options.difficulty === "hard" &&
    (me.x < 125 || me.x > W - 125)
  ) {
    direction = me.x < W / 2 ? 1 : -1;
    reason = "escape sea edge";
  } else if (shot && shot.score < 18) {
    direction = Math.sign(rival.x - me.x);
    reason = "clear firing position";
  } else if (battle.options.difficulty === "hard") {
    const left = battle.terrain.top(me.x - 35, me.y - 35),
      right = battle.terrain.top(me.x + 35, me.y - 35);
    if (Math.min(left, right) < me.y + 6 && Math.min(left, right) > me.y - 28) {
      direction = left < right ? -1 : 1;
      reason = "take higher ground";
    }
  }
  if (!direction) return null;
  for (let d = 12; d <= 45; d += 11) {
    const y = battle.terrain.top(me.x + direction * d, me.y - 35);
    if (y >= SEA - 25 || y > me.y + 65 || y < me.y - 30) return null;
  }
  return {
    direction,
    steps: battle.options.difficulty === "hard" ? 18 : 12,
    reason,
  };
}
export function safeApproach(battle) {
  const p = movementPlan(battle, { score: 0 });
  return p?.direction || 0;
}
