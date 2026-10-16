import assert from "node:assert/strict";
import { Battle } from "../src/simulation.js";
import { roster } from "../src/content.js";
import { landscapes } from "../src/landscapes.js";
import { planShot } from "../src/ai.js";
let checked = 0,
  corrections = 0;
for (const landscape of landscapes)
  for (const relief of ["normal", "dramatic"])
    for (const seed of [42, 197])
      for (const owner of [0, 1])
        for (let s = 0; s < roster.length; s++)
          for (let mi = 0; mi < 2; mi++) {
            const b = new Battle({
              seed,
              landscape: landscape.id,
              relief,
              timer: false,
              mode: "hotseat",
              difficulty: "hard",
              teams: [[s], [s]],
            });
            for (let i = 0; i < 60; i++) b.step();
            b.active = owner;
            for (const id of Object.keys(b.players[owner].ammo))
              b.players[owner].ammo[id] = id === roster[s].moves[mi].id ? 3 : 0;
            const plan = planShot(b);
            assert.ok(plan);
            let reached = false;
            // Test range, not guaranteed CPU accuracy. Bounded adjustments establish a legal damaging shot.
            for (const [da, dp] of [
              [0, 0],
              [-1, 0],
              [1, 0],
              [0, -2],
              [0, 2],
              [-2, -2],
              [2, 2],
              [-1, 2],
              [1, -2],
            ]) {
              const sim = b.fork(),
                angle = Math.max(-65, Math.min(245, plan.angle + da)),
                power = Math.max(20, Math.min(100, plan.power + dp));
              sim.commit(s, mi, angle, power);
              for (
                let i = 0;
                i < 2400 && sim.phase !== "over" && sim.turn === 1;
                i++
              )
                sim.step();
              if (sim.players[1 - owner].hp < sim.maxHP) {
                reached = true;
                if (da || dp) corrections++;
                break;
              }
            }
            assert.ok(
              reached,
              `${landscape.id}/${relief}/seed ${seed}/owner ${owner}: ${roster[s].moves[mi].name} has no damaging shot near ${plan.angle}/${plan.power}`,
            );
            checked++;
          }
console.log(
  JSON.stringify({
    checked,
    landscapes: 7,
    reliefs: 2,
    seeds: 2,
    sides: 2,
    moves: 36,
    requiredSmallAimCorrection: corrections,
  }),
);
