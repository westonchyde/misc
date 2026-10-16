import { test } from "node:test";
import assert from "node:assert/strict";
import {
  Battle,
  Terrain,
  RULES,
  W,
  H,
  SEA,
  advanceProjectile,
  makeProjectile,
  traceShot,
} from "../src/simulation.js";
import { landscapes } from "../src/landscapes.js";
import { roster } from "../src/content.js";
import { planShot } from "../src/ai.js";
import { aimAt } from "../src/targeting.js";
const all = roster.map((_, i) => i);
const create = (options = {}) =>
  new Battle({ timer: false, mode: "hotseat", teams: [all, all], ...options });
function tick(b, n = 60) {
  for (let i = 0; i < n; i++) b.step();
}
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
  assert.ok(["aim", "over"].includes(b.phase), b.phase);
}
function flat(b, y = 450) {
  b.terrain.cells.fill(0);
  for (let row = y; row < SEA + 12; row++)
    b.terrain.cells.fill(1, row * W + 28, row * W + W - 28);
  b.terrain.heights.fill(y);
  for (const p of b.players) {
    p.y = y - 19;
    p.vx = 0;
    p.vy = 0;
  }
  tick(b, 30);
}

test("seven silhouettes, two reliefs and ten seeds have safe, stable trainer starts", () => {
  const signatures = new Set();
  for (const landscape of landscapes) {
    signatures.add(
      new Terrain(42, "highlands", landscape.id).heights.join(","),
    );
    for (const relief of ["normal", "dramatic"])
      for (const seed of [1, 7, 12, 42, 89, 123, 567, 999, 4421, 999999]) {
        const b = create({ landscape: landscape.id, relief, seed });
        tick(b, 80);
        for (const p of b.players) {
          assert.ok(p.grounded, `${landscape.id}/${relief}/${seed}`);
          assert.ok(!b.collides(p.x, p.y));
          assert.equal(p.hp, RULES.hp);
        }
      }
  }
  assert.equal(signatures.size, 7);
});
test("scenery does not secretly change an explicitly selected gameplay silhouette", () => {
  const a = new Terrain(77, "highlands", "mountain", "dramatic");
  assert.deepEqual(
    a.cells,
    new Terrain(77, "sunset", "mountain", "dramatic").cells,
  );
  assert.deepEqual(
    a.cells,
    new Terrain(77, "islands", "mountain", "dramatic").cells,
  );
  assert.deepEqual(
    a.cells,
    new Terrain(77, "highlands", "mountain", "dramatic").cells,
  );
  assert.notDeepEqual(
    a.cells,
    new Terrain(78, "highlands", "mountain", "dramatic").cells,
  );
  assert.ok(
    Math.min(...a.heights) <
      Math.min(...new Terrain(77, "highlands", "mountain", "normal").heights),
  );
});
test("trainer profiles, HP and opening owner are normalized without affecting team legality", () => {
  const b = create({
    hp: 500,
    first: 1,
    profiles: [
      { name: "<Weston!>", palette: 4, skin: 2, style: 2 },
      { name: "Rival", palette: 999 },
    ],
  });
  assert.equal(b.maxHP, 500);
  assert.equal(b.players[0].name, "WESTON");
  assert.equal(b.players[0].profile.palette, 4);
  assert.equal(b.players[1].profile.palette, 1);
  assert.equal(b.active, 1);
  assert.equal(create({ hp: 999 }).maxHP, RULES.hp);
  assert.equal(create({ mode: "practice", first: 1 }).active, 0);
});
test("previous shots retain the actual settings and nominal trace separately per owner", () => {
  const b = create();
  tick(b);
  const m = roster[0].moves[1],
    expected = traceShot(b, m, 42, 63).points;
  assert.ok(b.commit(0, 1, 42, 63));
  assert.deepEqual(b.lastShots[0].trace, expected);
  assert.equal(b.lastShots[0].power, 63);
  assert.equal(b.lastShots[1], null);
});
test("simulation forks preserve RNG and terrain without mutating live combat", () => {
  const b = create();
  tick(b);
  b.addHazard("water", 800, b.terrain.top(800), 30);
  const clone = b.fork();
  assert.equal(clone.stateHash(), b.stateHash());
  assert.equal(clone.rng(), b.rng());
  clone.terrain.circle(800, clone.terrain.top(800) + 10, 40);
  clone.hazards[0].x = 300;
  clone.players[0].hp = 1;
  assert.notDeepEqual(clone.terrain.cells, b.terrain.cells);
  assert.notEqual(clone.hazards[0].x, b.hazards[0].x);
  assert.equal(b.players[0].hp, RULES.hp);
});
test("Rock Blast physically reflects from terrain before its final collision", () => {
  const b = create();
  flat(b);
  const m = roster[3].moves[0],
    shot = {
      ...makeProjectile(b.players[0], 0, 40, 0, m),
      x: 650,
      y: 425,
      vx: 300,
      vy: 170,
    };
  let reflected = false,
    hit = null;
  for (let i = 0; i < 500 && !hit; i++) {
    hit = advanceProjectile(b, shot, m, 0);
    if (shot.bounces < 2 && shot.vy < 0) reflected = true;
  }
  assert.ok(reflected);
  assert.ok(hit);
  assert.equal(shot.bounces, 0);
  assert.ok(hit.x > 650);
});
test("Seed Bomb fragments fly, separate and collide instead of scheduling fixed blasts", () => {
  const b = create();
  flat(b);
  const m = roster[6].moves[0];
  b.currentMove = m;
  b.phase = "flight";
  b.resolveImpact(850, 448, m);
  assert.equal(b.projectiles.length, 3);
  assert.equal(b.pendingImpacts.length, 0);
  const velocities = b.projectiles.map((p) => p.vx);
  assert.deepEqual(velocities, [-105, 0, 105]);
  for (let i = 0; i < 500 && b.projectiles.length; i++) b.advanceFlights();
  const impacts = b.events.filter((e) => e.type === "impact");
  assert.equal(impacts.length, 3);
  assert.ok(new Set(impacts.map((e) => Math.round(e.x))).size >= 2);
  assert.equal(b.projectiles.length, 0);
});
test("Hydro Pump is a single strong rocket, distinct from pit-filling Water Spout", () => {
  const b = create();
  tick(b);
  const initial = b.players[1].x,
    m = roster[1].moves[0],
    aim = aimAt(b, m, b.players[1].x, b.players[1].y);
  b.commit(1, 0, aim.angle, aim.power);
  while (b.phase === "summon") b.step();
  assert.equal(b.projectiles.length, 1);
  finish(b);
  assert.equal(b.pools.length, 0);
  assert.ok(b.players[1].wet > 0);
  assert.ok(b.players[1].hp < RULES.hp);
  assert.ok(b.players[1].hp > 0);
  assert.ok(Math.abs(b.players[1].x - initial) < 200);
});
test("water extinguishes ground fire and prevents immediate reignition", () => {
  const b = create();
  flat(b);
  b.addHazard("fire", 800, 450, 25);
  assert.equal(b.hazards.length, 1);
  b.addHazard("water", 800, 450, 30);
  assert.ok(!b.hazards.some((h) => h.type === "fire"));
  b.addHazard("lava", 800, 450, 20);
  assert.ok(!b.hazards.some((h) => h.type === "lava"));
});
test("ground hazards cap overlap damage and expire on the documented turn", () => {
  const b = create();
  flat(b);
  const p = b.players[0];
  b.addHazard("fire", p.x - 14, 450, 24, 1);
  b.addHazard("fire", p.x + 14, 450, 24, 1);
  tick(b, 120);
  assert.equal(p.hp, RULES.hp - 4);
  assert.equal(b.hazards.length, 2);
  for (let i = 0; i < 4; i++) b.nextTurn();
  assert.equal(b.hazards.length, 0);
});
test("water runs downhill during settling and retains an authoritative surface location", () => {
  const b = create({ landscape: "valley" });
  tick(b);
  b.addHazard("water", 450, b.terrain.top(450), 24);
  const h = b.hazards[0],
    before = h.x;
  tick(b, 90);
  assert.ok(h.x > before);
  assert.equal(h.flow, 0);
  assert.ok(Math.abs(h.y - b.terrain.top(h.x)) < 2);
});
test("Thunderbolt conducts along connected wet ground but a dry gap interrupts it", () => {
  const b = create();
  flat(b);
  const p = b.players[1];
  p.x = 1000;
  p.wet = 2;
  for (const x of [850, 890, 930, 970]) b.addHazard("water", x, 450, 25);
  b.conduct(820, 450, roster[2].moves[0]);
  assert.equal(p.hp, RULES.hp - 21);
  assert.ok(b.events.some((e) => e.type === "conduction"));
  const c = create();
  flat(c);
  c.players[1].x = 1000;
  c.players[1].wet = 2;
  for (const x of [850, 970]) c.addHazard("water", x, 450, 25);
  c.conduct(820, 450, roster[2].moves[0]);
  assert.equal(c.players[1].hp, RULES.hp);
});
test("Ice Beam creates real temporary collision and melting preserves original ground", () => {
  const b = create();
  flat(b);
  b.addHazard("water", 750, 450, 35);
  assert.equal(b.terrain.solid(750, 445), false);
  b.freezeWater({ origin: { x: 500, y: 445 }, x: 1000, y: 445 });
  assert.equal(b.ice.length, 1);
  assert.equal(b.terrain.cells[445 * W + 750], 2);
  assert.equal(b.terrain.solid(750, 445), true);
  assert.equal(b.hazards.length, 0);
  for (let i = 0; i < 4; i++) b.nextTurn();
  assert.equal(b.ice.length, 0);
  assert.equal(b.terrain.solid(750, 445), false);
  assert.equal(b.terrain.solid(750, 455), true);
});
test("Draco Meteor and Lava Plume spawn real descending fragments with bounded force", () => {
  for (const [s, mi, count] of [
    [11, 1, 3],
    [16, 0, 4],
  ]) {
    const b = create();
    flat(b);
    const m = roster[s].moves[mi];
    b.currentMove = m;
    b.phase = "flight";
    b.resolveImpact(850, 448, m);
    assert.equal(b.projectiles.length, count);
    assert.ok(b.projectiles.every((p) => p.move.fragment));
    for (let i = 0; i < 900 && b.projectiles.length; i++) b.advanceFlights();
    assert.equal(b.projectiles.length, 0);
    if (s === 16) assert.ok(b.hazards.some((h) => h.type === "lava"));
  }
});
test("Earthquake resolves traveling ruptures before handoff", () => {
  const b = create();
  flat(b);
  const m = roster[3].moves[1];
  b.currentMove = m;
  b.phase = "settle";
  b.resolveImpact(850, 448, m);
  assert.equal(b.pendingImpacts.length, 10);
  const version = b.terrain.version;
  tick(b, 25);
  assert.ok(b.terrain.version > version);
  assert.ok(b.pendingImpacts.length > 0);
  finish(b);
  assert.equal(b.pendingImpacts.length, 0);
});
test("Dig edits its traveling underground route before the final eruption", () => {
  const b = create();
  tick(b);
  const m = roster[17].moves[0],
    aim = aimAt(b, m, b.players[1].x, b.players[1].y);
  b.commit(17, 0, aim.angle, aim.power);
  for (let i = 0; i < 900 && b.phase !== "attack"; i++) b.step();
  const before = b.terrain.version;
  while (b.phase === "attack" && b.attack.progress < 0.4) b.step();
  assert.ok(b.terrain.version > before);
  assert.ok(Number.isFinite(b.attack.burrowX));
  assert.equal(b.attack.resolved, false);
  finish(b);
});
test("AI forecasts real aftermath while preserving live HP, terrain and turn ownership", () => {
  const b = create({
    teams: [
      [0, 1, 3],
      [6, 10],
    ],
    difficulty: "hard",
  });
  tick(b);
  const before = b.terrain.cells.slice(),
    hp = b.players.map((p) => p.hp),
    turn = b.turn;
  const plan = planShot(b);
  assert.ok(plan.diagnostics.forecasts >= 3);
  assert.ok(plan.forecast);
  assert.deepEqual(b.terrain.cells, before);
  assert.deepEqual(
    b.players.map((p) => p.hp),
    hp,
  );
  assert.equal(b.turn, turn);
  assert.equal(b.phase, "aim");
  b.options.difficulty = "easy";
  assert.equal(planShot(b).diagnostics.forecasts, 0);
});
