import { Battle } from "../src/simulation.js";
import { planShot, movementPlan } from "../src/ai.js";
import { randomTeams } from "../src/draft.js";
import assert from "node:assert/strict";
const result = { ace: 0, rookie: 0, draws: 0, unfinished: 0, turns: [] };
for (let game = 0; game < 20; game++) {
  const ace = game % 2,
    b = new Battle({
      timer: false,
      mode: "hotseat",
      map: ["highlands", "sunset", "islands"][game % 3],
      seed: game + 31,
      teams: randomTeams(game + 51),
    });
  let turns = 0;
  while (b.phase !== "over" && turns < 65) {
    b.options.difficulty = b.active === ace ? "hard" : "easy";
    let plan = planShot(b);
    const movement = movementPlan(b, plan);
    if (movement) {
      for (let i = 0; i < movement.steps; i++) {
        b.move(movement.direction);
        b.step();
      }
      plan = planShot(b);
    }
    if (plan)
      assert.ok(b.commit(plan.species, plan.moveIndex, plan.angle, plan.power));
    else b.pass();
    const turn = b.turn;
    for (
      let i = 0;
      i < 2400 &&
      b.phase !== "over" &&
      (b.turn === turn || b.phase === "handoff");
      i++
    )
      b.step();
    assert.ok(["aim", "over"].includes(b.phase));
    turns++;
  }
  if (b.phase !== "over") result.unfinished++;
  else if (b.winner === -1) result.draws++;
  else if (b.winner === ace) result.ace++;
  else result.rookie++;
  result.turns.push(turns);
}
assert.equal(result.unfinished, 0);
assert.ok(
  result.ace > result.rookie,
  "Ace must outperform Rookie in this fixed regression set",
);
console.log(JSON.stringify(result, null, 2));
