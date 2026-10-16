import { test } from "node:test";
import assert from "node:assert/strict";
import {
  Battle,
  W,
  H,
  SEA,
  SPAWNS,
  RULES,
  advanceProjectile,
  makeProjectile,
} from "../src/simulation.js";
import { roster } from "../src/content.js";
import { planShot } from "../src/ai.js";
const all = roster.map((_, i) => i),
  create = (o) =>
    new Battle({ timer: false, mode: "hotseat", teams: [all, all], ...o });
function tick(b, n = 60) {
  for (let i = 0; i < n; i++) b.step();
}
function finish(b) {
  const t = b.turn;
  for (
    let i = 0;
    i < 2400 && b.phase !== "over" && (b.turn === t || b.phase === "handoff");
    i++
  )
    b.step();
  assert.ok(["aim", "over"].includes(b.phase), b.phase);
}
function flat(b, y = 650) {
  b.terrain.cells.fill(0);
  for (let row = y; row < SEA + 12; row++)
    b.terrain.cells.fill(1, row * W + 28, row * W + W - 28);
  b.terrain.version++;
  b.players[0].x = 500;
  b.players[1].x = 1000;
  for (const p of b.players) {
    p.y = y - 19;
    p.vx = 0;
    p.vy = 0;
  }
  tick(b);
}

test("large world doubles width and starting separation, with HP appropriate to asymmetric damage", () => {
  assert.equal(W, 2560);
  assert.equal(H, 960);
  assert.equal(SPAWNS[1] - SPAWNS[0], 1520);
  assert.equal(RULES.hp, 350);
  assert.equal(create({ hp: 250 }).maxHP, 250);
  assert.equal(create({ hp: 500 }).maxHP, 500);
  const damages = roster.flatMap((s) =>
    s.moves.map((m) => m.damage * (m.count || 1)),
  );
  assert.equal(Math.min(...damages), 0);
  assert.ok(Math.max(...damages) >= 100);
  assert.equal(roster.find((s) => s.id === "scizor").moves[0].damage * 5, 20);
  assert.equal(roster.find((s) => s.id === "octillery").moves[0].damage, 100);
});
test("Octazooka deals exactly 100 on direct contact and zero splash on a near miss", () => {
  const b = create();
  flat(b);
  const m = roster[19].moves[0],
    p = b.players[1];
  b.hit(p.x, p.y - 10, m, 1);
  assert.equal(p.hp, 250);
  const c = create();
  flat(c);
  const q = c.players[1];
  c.hit(q.x + 20, q.y - 10, m, -1);
  assert.equal(q.hp, 350);
  assert.ok(c.terrain.version > 0);
});
test("sniper direct contact at the head still deals 100 even outside splash distance", () => {
  const b = create();
  flat(b);
  const m = roster[19].moves[0],
    p = b.players[1];
  b.hit(p.x, p.y - 55, m, 1);
  assert.equal(p.hp, 250);
});
test("sniper shot is stopped by cover, not allowed to tunnel through a mountain", () => {
  const b = create();
  flat(b);
  const m = roster[19].moves[0];
  b.terrain.circle(750, 590, 70, 1);
  const shot = makeProjectile(b.players[0], 0, 70, 0, m);
  let hit = null;
  for (let i = 0; i < 300 && !hit; i++) hit = advanceProjectile(b, shot, m, 0);
  assert.ok(hit);
  assert.equal(hit.direct, false);
  assert.ok(hit.x < 850);
  assert.equal(b.players[1].hp, 350);
});
test("finite water collects in a deep pit, ticks 10 eight times, and drains before handoff", () => {
  const b = create();
  flat(b);
  b.terrain.circle(1000, 710, 110);
  tick(b, 240);
  const hp = b.players[1].hp;
  b.phase = "settle";
  b.resolveImpact(1000, b.terrain.top(1000) - 3, roster[1].moves[1]);
  assert.equal(b.pools.length, 1);
  const t = b.turn;
  let observed = 0,
    stored = false;
  for (let i = 0; i < 600 && b.turn === t; i++) {
    b.step();
    if (b.pools[0]) {
      stored ||= b.pools[0].grid.some((v) => v > 180);
      observed = b.pools[0].damage[1];
      assert.equal(b.phase, "settle");
    }
  }
  assert.ok(stored);
  assert.equal(observed, 80);
  assert.equal(hp - b.players[1].hp, 80);
  assert.equal(b.pools.length, 0);
  assert.equal(b.turn, 2);
  const drowning = b.events.filter(
    (e) => e.type === "damage" && e.x > 900 && e.damage === 10,
  );
  assert.equal(drowning.length, 8);
});
test("Water Spout cannot produce a standing damaging wall on open flat ground", () => {
  const b = create();
  flat(b);
  const hp = b.players[1].hp;
  b.phase = "settle";
  b.resolveImpact(1000, 647, roster[1].moves[1]);
  finish(b);
  assert.ok(
    hp - b.players[1].hp <= 20,
    "brief splash may hurt; a flat-field flood must spill instead of dealing its full pit damage",
  );
  assert.equal(b.pools.length, 0);
});
test("retained water settles to a level surface instead of a mound", () => {
  const b = create();
  flat(b);
  b.terrain.circle(1000, 710, 110);
  tick(b, 240);
  b.phase = "settle";
  b.resolveImpact(1000, b.terrain.top(1000) - 3, roster[1].moves[1]);
  tick(b, 120);
  const pool = b.pools[0],
    heights = [];
  assert.ok(pool);
  for (let c = 24; c <= 40; c++)
    for (let r = 0; r < pool.rows; r++)
      if (pool.grid[r * pool.cols + c] > 180) {
        heights.push(r * 8);
        break;
      }
  assert.equal(heights.length, 17);
  assert.ok(Math.max(...heights) - Math.min(...heights) <= 8);
});
test("water reservoir state survives forks and participates in replay hashes", () => {
  const b = create();
  flat(b);
  b.resolveImpact(1000, 647, roster[1].moves[1]);
  tick(b, 12);
  const copy = b.fork();
  assert.equal(copy.stateHash(), b.stateHash());
  copy.pools[0].grid[10] = 255;
  assert.notEqual(copy.stateHash(), b.stateHash());
  assert.notEqual(copy.pools[0].grid[10], b.pools[0].grid[10]);
});
test("Dugtrio spends a turn escaping a pit without damaging the opponent or teleporting instantly", () => {
  const b = create();
  flat(b);
  b.terrain.circle(500, 710, 110);
  tick(b, 240);
  const start = { x: b.players[0].x, y: b.players[0].y },
    hp = b.players[1].hp;
  assert.ok(b.commit(18, 0, 45, 55));
  while (b.phase === "summon") b.step();
  assert.equal(b.phase, "attack");
  assert.equal(b.players[0].x, start.x);
  tick(b, 45);
  assert.ok(b.players[0].x > start.x && b.players[0].x < start.x + 220);
  finish(b);
  assert.equal(b.players[1].hp, hp);
  assert.ok(b.players[0].y < start.y - 90);
  assert.ok(Math.abs(b.players[0].x - start.x - 220) < 4);
  assert.ok(!b.collides(b.players[0].x, b.players[0].y));
  assert.equal(b.players[0].ammo["dugtrio-dig"], 1);
});
test("Mud Bomb creates real earth banks with body clearance and a one-turn movement penalty", () => {
  const b = create();
  flat(b);
  const m = roster[18].moves[1],
    p = b.players[1],
    before = b.terrain.cells.slice();
  b.resolveImpact(p.x, 650, m, 1);
  assert.ok(b.terrain.cells.some((v, i) => v === 1 && before[i] === 0));
  assert.ok(!b.collides(p.x, p.y));
  assert.equal(p.muddy, 1);
  b.nextTurn();
  assert.equal(b.budget, Math.round(RULES.movement * 0.7));
  assert.equal(p.muddy, 0);
});
test("Earthquake moves far more earth than its 18-damage budget would imply", () => {
  const b = create();
  flat(b);
  const m = roster[3].moves[1];
  const before = b.terrain.cells.reduce((n, v) => n + !!v, 0);
  b.resolveImpact(1300, 650, m);
  const removed = before - b.terrain.cells.reduce((n, v) => n + !!v, 0);
  assert.ok(removed > 40000);
  assert.equal(m.damage, 18);
  assert.ok(m.terrainRadius > m.damage * 8);
});
test("guided Swift bends only in its approach radius, with weaker damage than a precision hit", () => {
  const b = create();
  flat(b);
  b.players[1].x = 1300;
  const m = roster[14].moves[0];
  const guided = { x: 1010, y: 630, vx: 400, vy: 0, age: 0.5, bounces: 0 },
    plain = { ...guided };
  advanceProjectile(b, guided, m, 0);
  advanceProjectile(b, plain, { ...m, homing: null }, 0);
  assert.ok(guided.vy < plain.vy);
  const far = { x: 600, y: 600, vx: 400, vy: 0, age: 0.5, bounces: 0 },
    farPlain = { ...far };
  advanceProjectile(b, far, m, 0);
  advanceProjectile(b, farPlain, { ...m, homing: null }, 0);
  assert.equal(far.vy, farPlain.vy);
  assert.equal(m.damage * m.count, 30);
});
test("Rookie does not run trajectory or aftermath search and uses deterministic imperfect estimates", () => {
  const a = create({ difficulty: "easy" }),
    b = create({ difficulty: "easy" });
  tick(a);
  tick(b);
  const p = planShot(a),
    q = planShot(b);
  assert.deepEqual(p, q);
  assert.equal(p.diagnostics.trajectories, 0);
  assert.equal(p.diagnostics.forecasts, 0);
  assert.ok(Math.abs(p.perception.targetX - a.players[1].x) >= 40);
  assert.equal(a.maxHP, b.maxHP);
  assert.ok(a.commit(p.species, p.moveIndex, p.angle, p.power));
});
