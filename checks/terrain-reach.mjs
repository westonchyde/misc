import assert from "node:assert/strict";
import { Battle, traceShot } from "../src/simulation.js";
import { roster } from "../src/content.js";
import { landscapes } from "../src/landscapes.js";
import { planShot } from "../src/ai.js";
let checked = 0,
  corrections = 0;
const roles = { damage: 0, flood: 0, rescue: 0, sniperHit: 0, sniperCover: 0 };
for (const landscape of landscapes)
  for (const relief of ["normal", "dramatic"])
    for (const seed of [42, 197])
      for (const owner of [0, 1])
        for (let s = 0; s < roster.length; s++)
          for (let mi = 0; mi < 2; mi++) {
            const move = roster[s].moves[mi],
              b = new Battle({
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
              b.players[owner].ammo[id] = id === move.id ? 3 : 0;
            const plan = planShot(b);
            assert.ok(plan);
            let reached = false;
            const trace = traceShot(
              b,
              move,
              plan.angle,
              plan.power,
              owner,
              false,
            );
            // A direct-hit sniper intentionally cannot clear hills: test its real blocking surface.
            if (
              move.directOnly &&
              !trace.direct &&
              b.terrain.solid(trace.x, trace.y)
            ) {
              const rival = b.players[1 - owner];
              const lineClear = [rival.y - 55, rival.y - 22, rival.y + 10].some(
                (y) =>
                  !b.terrain.lineBlocked(
                    b.players[owner].x +
                      Math.sign(rival.x - b.players[owner].x) * 66,
                    b.players[owner].y - 44,
                    rival.x,
                    y,
                  ),
              );
              if (!lineClear) {
                roles.sniperCover++;
                reached = true;
              }
            }
            if (!reached)
              for (const [da, dp] of [
                [0, 0],
                [-0.5, 0],
                [0.5, 0],
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
                const start = { ...sim.players[owner] };
                assert.ok(sim.commit(s, mi, angle, power));
                for (
                  let i = 0;
                  i < 2400 &&
                  sim.phase !== "over" &&
                  (sim.turn === 1 || sim.phase === "handoff");
                  i++
                )
                  sim.step();
                assert.ok(
                  ["aim", "over"].includes(sim.phase),
                  "turn must finish",
                );
                if (move.kind === "utility") {
                  reached =
                    sim.terrain.version > 0 &&
                    Math.abs(sim.players[owner].x - start.x) > 150 &&
                    sim.players[1 - owner].hp === sim.maxHP;
                  if (reached) roles.rescue++;
                } else if (move.behavior === "flood") {
                  const e = sim.events.find((e) => e.type === "flood-start");
                  reached =
                    e &&
                    Math.abs(e.x - b.players[1 - owner].x) < 160 &&
                    sim.events.some(
                      (e) => e.type === "flood-end" && e.pulses === 8,
                    ) &&
                    !sim.pools.length;
                  if (reached) roles.flood++;
                } else {
                  reached = sim.players[1 - owner].hp < sim.maxHP;
                  if (reached)
                    roles[move.directOnly ? "sniperHit" : "damage"]++;
                }
                if (reached) {
                  if (da || dp) corrections++;
                  break;
                }
              }
            assert.ok(
              reached,
              `${landscape.id}/${relief}/seed ${seed}/owner ${owner}: ${move.name} fails its ${move.family} role near ${plan.angle}/${plan.power}`,
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
    moves: 40,
    roles,
    requiredSmallAimCorrection: corrections,
  }),
);
