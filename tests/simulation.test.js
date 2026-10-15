import { test } from "node:test";
import assert from "node:assert/strict";
import {
  Battle,
  Terrain,
  SEA,
  RULES,
  traceShot,
  blastDamage,
  random,
} from "../src/simulation.js";
import { roster, maps, validateContent } from "../src/content.js";
import { planShot } from "../src/ai.js";
const create = (extra = {}) =>
  new Battle({ timer: false, mode: "hotseat", ...extra });
function finishAttack(b, limit = 1800) {
  const turn = b.turn;
  for (
    let i = 0;
    i < limit &&
    b.phase !== "over" &&
    (b.turn === turn || b.phase === "handoff");
    i++
  )
    b.step();
  assert.ok(
    b.phase === "aim" || b.phase === "over",
    `Attack stuck in ${b.phase}`,
  );
}
function settle(b, ticks = 100) {
  for (let i = 0; i < ticks; i++) b.step();
}

test("six species and twelve unique validated moves", () => {
  assert.equal(roster.length, 6);
  assert.equal(validateContent(), 12);
  assert.equal(
    new Set(roster.flatMap((s) => s.moves.map((m) => m.kind))).size,
    9,
  );
});
test("seeded random and terrain are repeatable across map styles", () => {
  const a = random(22),
    b = random(22);
  for (let i = 0; i < 50; i++) assert.equal(a(), b());
  for (const map of maps)
    assert.deepEqual(
      new Terrain(42, map.id).cells,
      new Terrain(42, map.id).cells,
    );
  assert.notDeepEqual(new Terrain(42).cells, new Terrain(43).cells);
});
test("all map spawns have collision-free standing bodies", () => {
  for (const map of maps) {
    const b = create({ map: map.id });
    settle(b);
    for (const p of b.players) {
      assert.ok(p.grounded, map.id);
      assert.ok(!b.collides(p.x, p.y), map.id);
      assert.equal(p.hp, RULES.hp);
    }
  }
});
test("terrain edits immediately alter collision and preserve water gaps", () => {
  const t = new Terrain();
  const y = t.top(450) + 35;
  assert.ok(t.solid(450, y));
  t.circle(450, y, 20);
  assert.ok(!t.solid(450, y));
  t.circle(450, y, 12, 1);
  assert.ok(t.solid(450, y));
  assert.equal(new Terrain(42, "islands").top(640), SEA);
});
test("falloff is bounded at center and edge", () => {
  assert.equal(blastDamage(40, 0, 60), 40);
  assert.equal(blastDamage(40, 30, 60), 20);
  assert.equal(blastDamage(40, 90, 60), 0);
});
test("invalid commands do not consume a turn", () => {
  const b = create();
  for (const command of [
    [99, 0, 45, 50],
    [0, 8, 45, 50],
    [0, 0, NaN, 50],
    [0, 0, 45, Infinity],
    [0, 0, -90, 50],
    [0, 0, 45, 1],
    [0.5, 0, 45, 50],
  ])
    assert.equal(b.commit(...command), false);
  assert.equal(b.phase, "aim");
  assert.equal(b.players[0].shots, 0);
});
test("all twelve moves execute and settle without embedded survivors", () => {
  for (let s = 0; s < 6; s++)
    for (let m = 0; m < 2; m++) {
      const b = create();
      settle(b);
      assert.ok(b.commit(s, m, 35, 80));
      assert.equal(b.commit(s, m, 35, 80), false);
      finishAttack(b);
      for (const p of b.players)
        if (p.hp > 0) {
          assert.ok(p.grounded, roster[s].moves[m].name);
          assert.ok(!b.collides(p.x, p.y), roster[s].moves[m].name);
        }
    }
});
test("movement budget is enforced and inputs cannot move during attacks", () => {
  const b = create();
  settle(b);
  for (let i = 0; i < 300; i++) b.move(1);
  assert.ok(b.budget < 1);
  const x = b.players[0].x;
  assert.equal(b.move(1), false);
  b.commit(0, 0, 50, 75);
  assert.equal(b.move(1), false);
  assert.equal(b.players[0].x, x);
});
test("jump consumes budget and returns to stable terrain", () => {
  const b = create();
  settle(b);
  const y = b.players[0].y;
  assert.ok(b.jump());
  assert.equal(b.budget, RULES.movement - RULES.jumpCost);
  assert.equal(b.jump(), false);
  settle(b, 150);
  assert.ok(b.players[0].grounded);
  assert.ok(Math.abs(b.players[0].y - y) < 2);
});
test("crater support loss makes a body fall and settle without embedding", () => {
  const b = create();
  settle(b);
  const p = b.players[0],
    y = p.y;
  b.terrain.circle(p.x, p.y + 40, 72);
  settle(b, 240);
  assert.ok(p.y > y + 40);
  assert.ok(p.grounded);
  assert.ok(!b.collides(p.x, p.y));
});
test("large falls deal damage, small jumps do not", () => {
  const b = create();
  const p = b.players[0];
  p.y = 100;
  settle(b, 300);
  assert.ok(p.hp < RULES.hp);
  assert.ok(p.grounded);
});
test("terrain creation cannot entomb a nearby trainer", () => {
  const b = create();
  settle(b);
  const p = b.players[0];
  b.terrain.circle(p.x, p.y, 35, 1);
  settle(b);
  assert.ok(!b.collides(p.x, p.y));
  assert.ok(p.grounded);
});
test("wet electric combos amplify damage and water extinguishes fire", () => {
  const b = create();
  b.players[1].wet = 3;
  b.damagePlayer(1, 30, 0, 0, 0, "electric");
  assert.equal(b.players[1].hp, RULES.hp - 45);
  b.players[1].burn = 2;
  b.damagePlayer(1, 5, 0, 0, 0, "wet");
  assert.equal(b.players[1].burn, 0);
});
test("burn ticks on exactly two owner turns; curse halves one movement budget", () => {
  const b = create();
  b.players[1].burn = 2;
  b.players[1].curse = 1;
  b.nextTurn();
  assert.equal(b.players[1].hp, RULES.hp - 4);
  assert.equal(b.budget, Math.round(RULES.movement / 2));
  b.nextTurn();
  b.nextTurn();
  assert.equal(b.players[1].hp, RULES.hp - 8);
  assert.equal(b.budget, RULES.movement);
  assert.equal(b.players[1].burn, 0);
});
test("cooldowns prohibit repeating a powerful move on the next owner turn", () => {
  const b = create();
  b.commit(1, 0, 20, 60);
  finishAttack(b);
  b.pass();
  finishAttack(b);
  assert.equal(b.active, 0);
  assert.equal(b.available(1, 0), false);
  assert.equal(b.commit(1, 0, 20, 60), false);
  b.pass();
  finishAttack(b);
  b.pass();
  finishAttack(b);
  assert.equal(b.available(1, 0), true);
});
test("terrain blocks Thunderbolt while Phantom Ray damages through it", () => {
  for (const [s, m, expected] of [
    [2, 0, false],
    [4, 1, true],
  ]) {
    const b = create();
    settle(b);
    const p = b.players[0],
      q = b.players[1];
    b.terrain.cells.fill(0);
    for (let y = 460; y < SEA + 12; y++)
      b.terrain.cells.fill(1, y * 1280, (y + 1) * 1280);
    p.x = 260;
    p.y = 442;
    q.x = 460;
    q.y = 442;
    b.terrain.circle(350, 420, 35, 1);
    b.commit(s, m, 0, 75);
    finishAttack(b);
    assert.equal(q.hp < RULES.hp, expected);
  }
});
test("rock wall adds solid cover and Dig removes an underground path", () => {
  const b = create();
  settle(b);
  const t = traceShot(b, roster[3].moves[1], 0, 75);
  assert.equal(b.terrain.solid(t.x, t.y - 60), false);
  b.commit(3, 1, 0, 75);
  finishAttack(b);
  assert.ok(b.terrain.solid(t.x, t.y - 60));
  const c = create();
  settle(c);
  const p = c.players[0];
  const x = p.x + 100,
    y = p.y + 20;
  c.terrain.circle(x, y, 30, 1);
  c.commit(5, 1, 0, 75);
  finishAttack(c);
  assert.equal(c.terrain.solid(x, y), false);
});
test("ballistic preview and actual impact share wind/gravity/collision", () => {
  const b = create();
  settle(b);
  const trace = traceShot(b, roster[0].moves[0], 40, 78);
  b.events = [];
  b.commit(0, 0, 40, 78);
  finishAttack(b);
  const hit = b.events.find((e) => e.type === "impact");
  assert.ok(hit);
  assert.ok(Math.hypot(hit.x - trace.x, hit.y - trace.y) < 4);
});
test("sea death, simultaneous death and burn death decide results", () => {
  let b = create();
  b.players[0].y = SEA;
  b.step();
  assert.equal(b.winner, 1);
  b = create();
  b.players.forEach((p) => (p.hp = 0));
  b.step();
  assert.equal(b.winner, -1);
  b = create();
  b.players[1].hp = 3;
  b.players[1].burn = 1;
  b.nextTurn();
  assert.equal(b.winner, 0);
});
test("turn timer passes once and practice has no timer or return fire", () => {
  const b = new Battle({ timer: true });
  b.timer = 0.01;
  b.step();
  assert.equal(b.phase, "settle");
  finishAttack(b);
  assert.equal(b.turn, 2);
  const c = new Battle({ mode: "practice", timer: true });
  settle(c, 3000);
  assert.equal(c.turn, 1);
  c.commit(0, 0, 45, 50);
  finishAttack(c);
  assert.equal(c.active, 0);
});
test("same seed and commands replay to the same state hash", () => {
  function run() {
    const b = create({ seed: 57 });
    settle(b);
    for (let i = 0; i < 15; i++) b.move(1);
    b.commit(0, 0, 42, 80);
    finishAttack(b);
    return b.stateHash();
  }
  assert.equal(run(), run());
});
for (const map of maps)
  test(`AI plays a complete legal match on ${map.name}`, () => {
    const b = create({ map: map.id, difficulty: "hard" });
    let turns = 0;
    while (b.phase !== "over" && turns < 40) {
      const plan = planShot(b);
      assert.ok(b.commit(plan.species, plan.moveIndex, plan.angle, plan.power));
      finishAttack(b);
      turns++;
    }
    assert.equal(b.phase, "over");
    assert.ok(turns >= 3);
    assert.ok(b.players.some((p) => p.hp === 0));
  });
test("replay hashes include pending commands, cooldowns and random state", () => {
  const a = create(),
    b = create();
  assert.equal(a.stateHash(), b.stateHash());
  a.players[0].cooldowns.boulder = 1;
  assert.notEqual(a.stateHash(), b.stateHash());
  delete a.players[0].cooldowns.boulder;
  a.rng();
  assert.notEqual(a.stateHash(), b.stateHash());
});

test("downhill jet aiming reaches a trainer on lower ground", () => {
  const b = create();
  b.terrain.cells.fill(0);
  for (let x = 0; x < 1280; x++)
    for (let y = x < 400 ? 380 : 480; y < SEA + 12; y++)
      b.terrain.cells[y * 1280 + x] = 1;
  const p = b.players[0],
    q = b.players[1];
  p.x = 260;
  p.y = 362;
  q.x = 600;
  q.y = 462;
  const angle = (Math.atan2(p.y - 25 - q.y, q.x - (p.x + 55)) * 180) / Math.PI;
  assert.ok(angle < 0);
  assert.ok(b.commit(1, 0, angle, 75));
  finishAttack(b);
  assert.ok(q.hp < RULES.hp);
});
