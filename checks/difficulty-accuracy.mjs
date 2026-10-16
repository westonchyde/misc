import assert from "node:assert/strict";
import { Battle } from "../src/simulation.js";
import { planShot } from "../src/ai.js";
// Same ordinary shell, HP, sides, terrain and seeds. This measures aiming, not roster power.
const results = {};
for (const level of ["easy", "normal", "hard"]) {
  let hits = 0,
    damage = 0;
  for (let game = 0; game < 60; game++) {
    const b = new Battle({
      seed: game + 101,
      landscape: ["rolling", "valley", "basin"][game % 3],
      timer: false,
      mode: "hotseat",
      difficulty: level,
      teams: [[9], [9]],
      first: game % 2,
    });
    for (let i = 0; i < 60; i++) b.step();
    const owner = b.active,
      enemy = 1 - owner,
      hp = b.players[enemy].hp;
    b.players[owner].ammo["aqua-tail"] = 0;
    const p = planShot(b);
    assert.ok(p);
    assert.equal(p.moveIndex, 1);
    assert.ok(b.commit(p.species, p.moveIndex, p.angle, p.power));
    for (let i = 0; i < 1800 && b.phase !== "over" && b.turn === 1; i++)
      b.step();
    if (b.players[enemy].hp < hp) hits++;
    damage += hp - b.players[enemy].hp;
  }
  results[level] = {
    attempts: 60,
    hits,
    hitRate: hits / 60,
    averageDamage: Math.round((damage / 60) * 10) / 10,
  };
}
console.log(JSON.stringify(results, null, 2));
assert.ok(
  results.easy.hitRate < 0.5,
  "Rookie must visibly miss ordinary shots",
);
assert.ok(
  results.normal.hitRate > results.easy.hitRate + 0.15,
  "Trainer must out-aim Rookie",
);
assert.ok(
  results.hard.hitRate > results.normal.hitRate + 0.08,
  "Ace must out-aim Trainer",
);
