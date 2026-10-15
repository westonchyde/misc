import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  Battle,
  Terrain,
  SEA,
  W,
  RULES,
  traceShot,
  random,
} from "../src/simulation.js";
import {
  roster,
  maps,
  validateContent,
  difficultyProfiles,
} from "../src/content.js";
import { Draft, randomTeams, TEAM_SIZE, draftScore } from "../src/draft.js";
import { planShot, movementPlan } from "../src/ai.js";
const all = roster.map((_, i) => i);
const create = (o = {}) =>
  new Battle({ timer: false, mode: "hotseat", teams: [all, all], ...o });
const settle = (b, n = 60) => {
  for (let i = 0; i < n; i++) b.step();
};
function finish(b) {
  const turn = b.turn;
  for (
    let i = 0;
    i < 2400 &&
    b.phase !== "over" &&
    (b.turn === turn || b.phase === "handoff");
    i++
  )
    b.step();
  assert.ok(["aim", "over"].includes(b.phase), `stuck in ${b.phase}`);
}
function onlyMove(b, s, m) {
  for (const id of Object.keys(b.players[b.active].ammo))
    b.players[b.active].ammo[id] = id === roster[s].moves[m].id ? 3 : 0;
}
function aimed(b, s, m) {
  onlyMove(b, s, m);
  const p = planShot(b);
  assert.ok(p);
  assert.ok(b.commit(s, m, p.angle, p.power));
  return p;
}

test("18 Pokémon, 36 unique canonical move IDs and distinct visual definitions", () => {
  assert.equal(roster.length, 18);
  assert.equal(validateContent(), 36);
  assert.equal(
    new Set(roster.flatMap((s) => s.moves.map((m) => m.visual))).size,
    36,
  );
  assert.equal(
    roster.flatMap((s) => s.moves).filter((m) => m.kind === "beam").length,
    3,
  );
  assert.ok(
    !roster
      .flatMap((s) => s.moves)
      .some((m) =>
        ["Water Bomb", "Phantom Ray", "Boulder", "Rock Wall"].includes(m.name),
      ),
  );
});
test("all 18 pinned game sprites match their source checksums", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../assets/pokemon/manifest.json", import.meta.url)),
  );
  assert.equal(manifest.assets.length, 18);
  for (const a of manifest.assets) {
    const bytes = readFileSync(new URL(`../${a.file}`, import.meta.url));
    assert.equal(bytes.subarray(0, 3).toString(), "GIF");
    assert.equal(createHash("sha256").update(bytes).digest("hex"), a.sha256);
    assert.ok(a.source.includes(manifest.source_commit));
  }
});
test("random teams are repeatable, exclusive, complete and vary by seed", () => {
  const a = randomTeams(42);
  assert.deepEqual(a, randomTeams(42));
  assert.notDeepEqual(a, randomTeams(43));
  assert.deepEqual(
    a.map((t) => t.length),
    [6, 6],
  );
  assert.equal(new Set(a.flat()).size, 12);
});
test("snake draft follows 0/1/1/0 and rejects stolen/extra picks", () => {
  const d = new Draft(42, "hotseat");
  const order = [];
  for (let i = 0; i < 12; i++) {
    order.push(d.active);
    assert.ok(d.pick(i));
    assert.equal(d.pick(i), false);
  }
  assert.deepEqual(order, [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0]);
  assert.ok(d.complete);
  assert.equal(d.pick(12), false);
  assert.deepEqual(
    d.teams.map((t) => t.length),
    [6, 6],
  );
});
test("CPU drafting fills legal exclusive teams on every difficulty", () => {
  for (const level of Object.keys(difficultyProfiles)) {
    const d = new Draft(12, "solo", level);
    while (!d.complete) assert.ok(d.cpuPick());
    assert.equal(new Set(d.teams.flat()).size, 12);
    assert.deepEqual(
      d.teams.map((t) => t.length),
      [6, 6],
    );
  }
  assert.ok(draftScore(2, [1], [], "hard") > draftScore(2, [1], [], "easy"));
});
test("ownership and ammunition are enforced by authoritative commands", () => {
  const b = create({ teams: [[0], [1]] });
  assert.equal(b.commit(2, 0, 45, 55), false);
  assert.ok(b.commit(0, 0, 45, 55));
  assert.equal(b.players[0].ammo.flamethrower, 2);
  assert.equal(b.commit(0, 0, 45, 55), false);
  b.players[0].ammo.flamethrower = 0;
  b.phase = "aim";
  assert.equal(b.commit(0, 0, 45, 55), false);
});
test("invalid teams and numerical commands are rejected", () => {
  assert.throws(() => create({ teams: [[0, 0], [1]] }));
  assert.throws(() => create({ teams: [[99], [1]] }));
  const b = create();
  for (const args of [
    [99, 0, 45, 55],
    [0, 9, 45, 55],
    [0.5, 0, 45, 55],
    [0, 0, NaN, 55],
    [0, 0, -90, 55],
    [0, 0, 270, 55],
    [0, 0, 45, 101],
    [0, 0, 45, 1],
  ])
    assert.equal(b.commit(...args), false);
  assert.equal(b.players[0].shots, 0);
});
test("seeded terrain, wind and random generators reproduce", () => {
  assert.deepEqual(new Terrain(42).cells, new Terrain(42).cells);
  assert.notDeepEqual(new Terrain(42).cells, new Terrain(43).cells);
  const a = random(9),
    b = random(9);
  for (let i = 0; i < 30; i++) assert.equal(a(), b());
  assert.equal(create().wind, create().wind);
});
test("all map spawns settle collision-free without free fall damage", () => {
  for (const map of maps) {
    const b = create({ map: map.id });
    settle(b);
    for (const p of b.players) {
      assert.ok(p.grounded);
      assert.ok(!b.collides(p.x, p.y));
      assert.equal(p.hp, RULES.hp);
    }
  }
});
test("terrain changes, jumps, movement budgets and support loss behave", () => {
  const b = create();
  settle(b);
  const p = b.players[0],
    y = p.y;
  assert.ok(b.jump());
  assert.equal(b.budget, RULES.movement - RULES.jumpCost);
  settle(b, 150);
  assert.ok(p.grounded);
  assert.equal(p.hp, RULES.hp);
  for (let i = 0; i < 300; i++) b.move(1);
  assert.ok(b.budget < 1);
  assert.equal(b.move(1), false);
  b.terrain.circle(p.x, p.y + 40, 70);
  settle(b, 250);
  assert.ok(p.y > y);
  assert.ok(!b.collides(p.x, p.y));
});
test("large falls hurt, sea kills and simultaneous death draws", () => {
  let b = create();
  b.players[0].y = 100;
  settle(b, 300);
  assert.ok(b.players[0].hp < RULES.hp);
  b = create();
  b.players[0].y = SEA;
  b.step();
  assert.equal(b.winner, 1);
  b = create();
  b.players.forEach((p) => (p.hp = 0));
  b.step();
  assert.equal(b.winner, -1);
});
test("water extinguishes burns and electricity/ice punish wetness", () => {
  let b = create();
  b.players[1].burn = 2;
  b.damagePlayer(1, 10, 0, 0, 0, "wet");
  assert.equal(b.players[1].burn, 0);
  b.damagePlayer(1, 20, 0, 0, 0, "electric");
  assert.equal(b.players[1].hp, RULES.hp - 40);
  b.damagePlayer(1, 20, 0, 0, 0, "chill");
  assert.equal(b.players[1].hp, RULES.hp - 68);
});
test("poison ticks twice, Snarl weakens one attack turn, curse/ice reduce movement", () => {
  const b = create();
  b.damagePlayer(1, 0, 0, 0, 0, "poison");
  b.damagePlayer(1, 0, 0, 0, 0, "weaken");
  b.players[1].chill = 1;
  b.nextTurn();
  assert.equal(b.players[1].hp, RULES.hp - 4);
  assert.equal(b.budget, Math.round(RULES.movement * 0.65));
  b.damagePlayer(0, 20, 1);
  assert.equal(b.players[0].hp, RULES.hp - 16);
  b.nextTurn();
  b.players[1].curse = 1;
  b.nextTurn();
  assert.equal(b.players[1].hp, RULES.hp - 8);
  assert.equal(b.budget, Math.round(RULES.movement * 0.5));
  assert.equal(b.players[1].weaken, 0);
  const c = create();
  c.players[0].weaken = 2;
  c.players[1].burn = 1;
  c.nextTurn();
  assert.equal(
    c.players[1].hp,
    RULES.hp - 4,
    "Snarl must not reduce periodic burn damage",
  );
});
test("secondaries recharge and exhausted supplies finish by remaining HP", () => {
  const b = create();
  b.commit(0, 1, 45, 55);
  finish(b);
  b.pass();
  finish(b);
  assert.equal(b.available(0, 1), false);
  b.pass();
  finish(b);
  b.pass();
  finish(b);
  assert.equal(b.available(0, 1), true);
  b.players.forEach((p) => {
    for (const id of Object.keys(p.ammo)) p.ammo[id] = 0;
  });
  b.players[0].hp = 90;
  b.players[1].hp = 80;
  b.nextTurn();
  assert.equal(b.phase, "over");
  assert.equal(b.winner, 0);
});
test("relay Pokémon arrive at the impact point before applying their move", () => {
  const b = create({ difficulty: "hard" });
  settle(b);
  aimed(b, 0, 0);
  for (let i = 0; i < 1000 && b.phase !== "attack"; i++) b.step();
  assert.equal(b.phase, "attack");
  assert.ok(b.attack.remote);
  assert.ok(Math.abs(b.summon.x - b.players[1].x) < 90);
  const hp = b.players[1].hp;
  assert.equal(hp, RULES.hp);
  finish(b);
  assert.ok(b.players[1].hp < hp);
});
test("salvos launch multiple real projectiles and clusters resolve all fragments", () => {
  let b = create({ difficulty: "hard" });
  settle(b);
  aimed(b, 3, 0);
  while (b.phase === "summon") b.step();
  assert.equal(b.projectiles.length, 3);
  finish(b);
  assert.ok(b.players[1].hp < RULES.hp);
  b = create({ difficulty: "hard" });
  settle(b);
  aimed(b, 6, 0);
  finish(b);
  assert.equal(b.pendingImpacts.length, 0);
  assert.ok(b.players[1].hp < RULES.hp);
});
test("Dig makes deep shafts and Stone Edge creates actual cover", () => {
  for (const [s, m, type] of [
    [17, 0, "dig"],
    [12, 0, "spikes"],
  ]) {
    const b = create({ difficulty: "hard" });
    settle(b);
    const before = b.terrain.cells.slice();
    aimed(b, s, m);
    finish(b);
    assert.ok(b.terrain.version > 0);
    if (type === "spikes")
      assert.ok(
        b.terrain.cells.some((v, i) => v === 1 && before[i] === 0),
        "Stone Edge must create new solid cover",
      );
    if (type === "dig") {
      const hit = b.events.find((e) => e.type === "impact");
      assert.ok(!b.terrain.solid(hit.x, Math.min(SEA - 1, hit.y + 65)));
    } else assert.ok(b.events.some((e) => e.kind === "stone-edge"));
  }
});
test("preview and live projectile use identical wind and collision integration", () => {
  const b = create();
  settle(b);
  const move = roster[0].moves[1],
    trace = traceShot(b, move, 40, 55);
  b.commit(0, 1, 40, 55);
  finish(b);
  const hit = b.events.find((e) => e.type === "impact");
  assert.ok(Math.hypot(hit.x - trace.x, hit.y - trace.y) < 3);
});
test("replay hashes include resources, random state and deterministic commands", () => {
  function run() {
    const b = create();
    settle(b);
    b.move(1);
    b.commit(1, 0, 40, 55);
    finish(b);
    return b.stateHash();
  }
  assert.equal(run(), run());
  const a = create(),
    b = create();
  a.players[0].ammo.flamethrower--;
  assert.notEqual(a.stateHash(), b.stateHash());
});
test("timer, pause-independent model and practice handoff rules", () => {
  const b = new Battle({ timer: true });
  b.timer = 0.01;
  b.step();
  assert.equal(b.phase, "settle");
  finish(b);
  assert.equal(b.active, 1);
  const c = create({ timer: true, mode: "practice" });
  settle(c, 3000);
  assert.equal(c.turn, 1);
  c.pass();
  finish(c);
  assert.equal(c.active, 0);
});
for (const map of maps)
  for (const owner of [0, 1])
    test(`every move can damage the opponent from spawn: ${map.name}, player ${owner + 1}`, () => {
      for (let s = 0; s < 18; s++)
        for (let m = 0; m < 2; m++) {
          const b = create({ map: map.id, difficulty: "hard" });
          settle(b);
          b.active = owner;
          const p = aimed(b, s, m);
          finish(b);
          assert.ok(
            b.players[1 - owner].hp < RULES.hp,
            `${roster[s].name}: ${roster[s].moves[m].name} cannot reach; angle ${p.angle}, power ${p.power}`,
          );
          for (const actor of b.players)
            if (actor.hp > 0)
              assert.ok(!b.collides(actor.x, actor.y), roster[s].moves[m].name);
        }
    });
test("difficulties change search effort, tactics, conservation and movement", () => {
  const results = [];
  for (const level of ["easy", "normal", "hard"]) {
    const b = create({ teams: randomTeams(41), difficulty: level });
    results.push(planShot(b));
  }
  assert.ok(
    results[0].diagnostics.trajectories < results[1].diagnostics.trajectories,
  );
  assert.ok(
    results[1].diagnostics.trajectories < results[2].diagnostics.trajectories,
  );
  assert.equal(results[0].diagnostics.conserve, false);
  assert.equal(results[2].diagnostics.conserve, true);
  const b = create({ difficulty: "hard" });
  b.players[0].x = 80;
  assert.equal(movementPlan(b, { score: 30 }).reason, "escape sea edge");
  b.options.difficulty = "easy";
  assert.equal(movementPlan(b, { score: 0 }), null);
});
for (const map of maps)
  test(`drafted AI match completes legally on ${map.name}`, () => {
    const b = create({
      teams: randomTeams(43),
      map: map.id,
      difficulty: "hard",
    });
    settle(b);
    let turns = 0;
    while (b.phase !== "over" && turns < 65) {
      const p = planShot(b);
      if (p) assert.ok(b.commit(p.species, p.moveIndex, p.angle, p.power));
      else b.pass();
      finish(b);
      turns++;
    }
    assert.equal(b.phase, "over");
    assert.ok(turns >= 3);
    assert.ok([0, 1, -1].includes(b.winner));
  });
test("pointer assistance finds a playable long-range arc on every map", async () => {
  const { aimAt } = await import("../src/targeting.js");
  for (const map of maps)
    for (const owner of [0, 1]) {
      const b = create({ map: map.id });
      settle(b);
      b.active = owner;
      const rival = b.players[1 - owner],
        move = roster[0].moves[0],
        aim = aimAt(b, move, rival.x, rival.y);
      const t = traceShot(b, move, aim.angle, aim.power);
      assert.ok(Math.hypot(t.x - rival.x, t.y - rival.y) < 55, map.id);
      assert.ok(b.commit(0, 0, aim.angle, aim.power));
      finish(b);
      assert.ok(b.players[1 - owner].hp < RULES.hp);
    }
});
