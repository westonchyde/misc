import { roster, BALLISTIC, REMOTE } from "./content.js";
import { makeHeights } from "./landscapes.js";
import { cleanProfile } from "./trainers.js";
export const W = 1280,
  H = 680,
  SEA = 632,
  GROUND = SEA,
  DT = 1 / 60,
  GRAVITY = 440;
export const RULES = {
  hp: 180,
  movement: 125,
  turnTime: 45,
  jumpCost: 18,
  maxFallDamage: 35,
  impulseScale: 0.58,
};
export function random(seed) {
  const rng = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  Object.defineProperty(rng, "state", { get: () => seed >>> 0 });
  return rng;
}
export function blastDamage(base, distance, radius) {
  return Math.round(base * Math.max(0, 1 - distance / radius));
}
export class Terrain {
  constructor(seed = 42, map = "highlands", profile, relief = "normal") {
    this.cells = new Uint8Array(W * H);
    this.map = map;
    this.profile =
      profile ||
      (map === "islands" ? "islands" : map === "sunset" ? "valley" : "rolling");
    this.relief = relief;
    this.version = 0;
    this.heights = makeHeights(seed, this.profile, relief);
    for (let x = 28; x < W - 28; x++) {
      if (this.profile === "islands" && x > 585 && x < 695) continue;
      for (let y = this.surface(x); y < SEA + 12; y++)
        this.cells[y * W + x] = 1;
    }
  }
  surface(x) {
    return this.heights[Math.max(0, Math.min(W - 1, Math.floor(x)))];
  }
  solid(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    return x >= 0 && x < W && y >= 0 && y < H && this.cells[y * W + x] > 0;
  }
  circle(x, y, r, fill = 0) {
    let changed = false;
    for (
      let j = Math.max(0, Math.floor(y - r));
      j < Math.min(SEA + 12, Math.ceil(y + r));
      j++
    )
      for (
        let i = Math.max(0, Math.floor(x - r));
        i < Math.min(W, Math.ceil(x + r));
        i++
      ) {
        if (
          (i - x) ** 2 + (j - y) ** 2 <= r * r &&
          this.cells[j * W + i] !== fill
        ) {
          this.cells[j * W + i] = fill;
          changed = true;
        }
      }
    if (changed) this.version++;
  }
  top(x, from = 0) {
    for (let y = Math.max(0, Math.floor(from)); y < SEA; y++)
      if (this.solid(x, y)) return y;
    return SEA;
  }
  lineBlocked(x, y, ex, ey) {
    const n = Math.ceil(Math.hypot(ex - x, ey - y) / 4);
    for (let i = 1; i < n; i++)
      if (this.solid(x + ((ex - x) * i) / n, y + ((ey - y) * i) / n))
        return true;
    return false;
  }
}
export function angleVector(angle) {
  const a = (angle * Math.PI) / 180;
  return { x: Math.cos(a), y: -Math.sin(a) };
}
export function speedFor(power) {
  return 260 + power * 5.6;
}
export function originFor(player, angle, move) {
  const dir = Math.cos((angle * Math.PI) / 180) >= 0 ? 1 : -1;
  // Shared muzzle for preview and attacks; summons are visual actors, not extra colliders.
  const anchor = move && !REMOTE.has(move.kind) ? move.anchor : null;
  return {
    x: player.x + dir * (anchor?.[0] || 55),
    y: player.y + (anchor?.[1] || -42),
  };
}
// One authoritative projectile integrator is used by previews, AI and live shots.
export function advanceProjectile(battle, shot, move, owner) {
  shot.age += DT;
  shot.vx += battle.wind * DT;
  shot.vy += GRAVITY * (move.gravityScale || 1) * DT;
  const steps = Math.max(1, Math.ceil((Math.hypot(shot.vx, shot.vy) * DT) / 3));
  for (let i = 0; i < steps; i++) {
    const previousX = shot.x,
      previousY = shot.y;
    shot.x += (shot.vx * DT) / steps;
    shot.y += (shot.vy * DT) / steps;
    const rival = battle.players[1 - owner];
    const direct =
      rival.hp > 0 &&
      Math.abs(rival.x - shot.x) < 12 &&
      Math.abs(rival.y - shot.y) < 22;
    const terrain =
      battle.terrain.solid(shot.x, shot.y) &&
      (move.kind !== "phase" || (shot.vy > 0 && shot.age > 0.2));
    if (
      terrain &&
      !direct &&
      shot.bounces > 0 &&
      Math.hypot(shot.vx, shot.vy) > 100 &&
      shot.age > 0.12
    ) {
      shot.bounces--;
      const wall =
        battle.terrain.solid(shot.x, previousY - 5) &&
        !battle.terrain.solid(previousX, previousY - 5);
      shot.x = previousX;
      shot.y = previousY - 3;
      if (wall) shot.vx *= -0.62;
      else {
        shot.vx *= 0.72;
        shot.vy = -Math.abs(shot.vy) * 0.48 - 26;
      }
      if (wall) shot.vy = -Math.abs(shot.vy) * 0.35 - 30;
      return null;
    }
    if (
      direct ||
      terrain ||
      shot.y >= SEA ||
      shot.x < 0 ||
      shot.x > W ||
      shot.age >= 9
    )
      return {
        x: shot.x,
        y: shot.y,
        direct,
        directIndex: direct ? 1 - owner : -1,
      };
  }
  return null;
}
export function makeProjectile(player, angle, power, delay = 0, move) {
  const o = originFor(player, angle, move),
    d = angleVector(angle);
  return {
    ...o,
    vx: d.x * speedFor(power),
    vy: d.y * speedFor(power),
    age: 0,
    delay,
    bounces: move?.behavior === "bounce" ? 2 : 0,
    history: [],
  };
}
export function traceShot(
  battle,
  move,
  angle,
  power,
  owner = battle.active,
  samples = true,
) {
  const p = battle.players[owner],
    o = originFor(p, angle, move);
  if (BALLISTIC.has(move.kind)) {
    const shot = makeProjectile(p, angle, power, 0, move),
      points = [{ ...o }];
    for (let tick = 0; tick < 540; tick++) {
      const hit = advanceProjectile(battle, shot, move, owner);
      if (hit)
        return {
          ...hit,
          points: [...points, { x: hit.x, y: hit.y }],
          ticks: tick + 1,
        };
      if (samples && tick % 4 === 0) points.push({ x: shot.x, y: shot.y });
    }
    return { ...shot, points, direct: false, ticks: 540 };
  }
  const d = angleVector(angle);
  let x = o.x,
    y = o.y;
  for (let t = 0; t <= move.range; t += 4) {
    x = o.x + d.x * t;
    y = o.y + d.y * t;
    if (x < 0 || x > W || y > SEA) break;
  }
  return { points: [o, { x, y }], x, y, direct: true };
}
export class Battle {
  constructor(options = {}) {
    if (typeof options === "number") options = { seed: options };
    this.options = {
      seed: 42,
      map: "highlands",
      mode: "solo",
      difficulty: "normal",
      timer: true,
      ...options,
    };
    const teams = this.options.teams || [
      roster.slice(0, 6).map((_, i) => i),
      roster.slice(0, 6).map((_, i) => i),
    ];
    if (
      !Array.isArray(teams) ||
      teams.length !== 2 ||
      teams.some(
        (team) =>
          !Array.isArray(team) ||
          team.length < 1 ||
          team.length > 18 ||
          new Set(team).size !== team.length ||
          team.some((i) => !Number.isInteger(i) || !roster[i]),
      )
    )
      throw new Error("Invalid drafted teams");
    this.options.teams = teams.map((team) => [...team]);
    this.rng = random(this.options.seed + 19);
    this.terrain = new Terrain(
      this.options.seed,
      this.options.map,
      this.options.landscape,
      this.options.relief,
    );
    this.players = [260, 1020].map((x, i) => ({
      x,
      y: this.terrain.top(x) - 19,
      vx: 0,
      vy: 0,
      hp: [180, 240, 300].includes(+options.hp) ? +options.hp : RULES.hp,
      profile: cleanProfile(options.profiles?.[i], i),
      name: cleanProfile(options.profiles?.[i], i).name.toUpperCase(),
      wet: 0,
      burn: 0,
      curse: 0,
      grounded: true,
      facing: i ? -1 : 1,
      cooldowns: {},
      team: [...teams[i]],
      ammo: Object.fromEntries(
        teams[i].flatMap((s) => roster[s].moves.map((m) => [m.id, m.ammo])),
      ),
      poison: 0,
      chill: 0,
      weaken: 0,
      damage: 0,
      hits: 0,
      shots: 0,
      walk: 0,
      lastWalk: -1,
      hurt: 0,
    }));
    this.maxHP = this.players[0].hp;
    this.active =
      this.options.mode === "practice" ? 0 : options.first === 1 ? 1 : 0;
    this.opening = this.active;
    this.hazards = [];
    this.ice = [];
    this.lastShots = [null, null];
    this.phase = "aim";
    this.phaseTime = 0;
    this.budget = RULES.movement;
    this.timer = RULES.turnTime;
    this.turn = 1;
    this.events = [];
    this.projectile = null;
    this.projectiles = [];
    this.pendingImpacts = [];
    this.clock = 0;
    this.wind = Math.round((this.rng() - 0.5) * 24);
    this.winner = null;
    this.currentMove = null;
    this.summon = null;
    this.attack = null;
    this.stable = 0;
    this.log = [];
    this.addLog("Choose a partner. Aim, summon, make your move.");
  }
  emit(type, data = {}) {
    this.events.push({ type, ...data });
  }
  addLog(message) {
    this.log.unshift(message);
    this.log = this.log.slice(0, 24);
    this.emit("log", { message });
  }
  setPhase(phase) {
    this.phase = phase;
    this.phaseTime = 0;
  }
  collides(x, y) {
    return [-7, 0, 7].some((dx) =>
      [-16, -4, 8, 17].some((dy) => this.terrain.solid(x + dx, y + dy)),
    );
  }
  canAct() {
    return this.phase === "aim" && this.players[this.active].hp > 0;
  }
  move(dir) {
    if (!this.canAct() || ![-1, 1].includes(dir) || this.budget <= 0)
      return false;
    const p = this.players[this.active],
      dx = dir * Math.min(2.4, this.budget);
    p.facing = dir;
    if (p.x + dx < 10 || p.x + dx > W - 10) return false;
    for (let up = 0; up <= (p.grounded ? 6 : 0); up++)
      if (!this.collides(p.x + dx, p.y - up)) {
        p.x += dx;
        p.y -= up;
        this.budget -= Math.abs(dx);
        p.walk += 0.22;
        p.lastWalk = this.clock;
        return true;
      }
    return false;
  }
  jump() {
    const p = this.players[this.active];
    if (!this.canAct() || !p.grounded || this.budget < RULES.jumpCost)
      return false;
    p.vy = -235;
    p.grounded = false;
    this.budget -= RULES.jumpCost;
    this.emit("jump", { x: p.x, y: p.y });
    return true;
  }
  available(speciesIndex, moveIndex, owner = this.active) {
    const m = roster[speciesIndex]?.moves[moveIndex];
    return (
      !!m &&
      !!this.players[owner] &&
      this.players[owner].team.includes(speciesIndex) &&
      this.players[owner].ammo[m.id] > 0 &&
      !(this.players[owner].cooldowns[m.id] > 0)
    );
  }
  commit(speciesIndex, moveIndex, angle, power) {
    if (
      !this.canAct() ||
      !Number.isInteger(speciesIndex) ||
      !Number.isInteger(moveIndex) ||
      !this.available(speciesIndex, moveIndex) ||
      !Number.isFinite(angle) ||
      !Number.isFinite(power) ||
      angle < -65 ||
      angle > 245 ||
      power < 20 ||
      power > 100
    )
      return false;
    const p = this.players[this.active],
      species = roster[speciesIndex],
      m = species.moves[moveIndex];
    p.facing = Math.cos((angle * Math.PI) / 180) >= 0 ? 1 : -1;
    this.currentMove = m;
    this.setPhase("summon");
    this.attack = null;
    this.stable = 0;
    const o = originFor(p, angle, m);
    this.summon = {
      species,
      speciesIndex,
      x: p.x + p.facing * 25,
      y: p.y + 17,
      angle,
      power,
      owner: this.active,
      remote: REMOTE.has(m.kind),
    };
    this.projectile = null;
    p.shots++;
    p.ammo[m.id]--;
    p.cooldowns[m.id] = m.cooldown + 1;
    this.lastShots[this.active] = {
      angle,
      power,
      species: speciesIndex,
      move: moveIndex,
      trace: traceShot(this, m, angle, power).points,
    };
    this.addLog(`${p.name} summoned ${species.name} · ${m.name}`);
    this.emit("summon", { x: o.x, y: p.y - 20, color: species.color });
    return true;
  }
  pass() {
    if (!this.canAct()) return false;
    this.addLog(`${this.players[this.active].name} passed.`);
    this.summon = null;
    this.setPhase("settle");
    return true;
  }
  damagePlayer(
    index,
    amount,
    source,
    forceX = 0,
    forceY = 0,
    effect = null,
    periodic = false,
  ) {
    const p = this.players[index];
    if (p.hp <= 0) return;
    if (
      !periodic &&
      source !== null &&
      source !== index &&
      this.players[source].weaken
    )
      amount *= 0.8;
    if (effect === "chill" && p.wet) {
      amount += 8;
      this.emit("combo", { x: p.x, y: p.y - 40, text: "WET + ICE!" });
    }
    amount = Math.max(0, Math.round(amount));
    if (effect === "electric" && p.wet) {
      amount = Math.round(amount * 1.5);
      this.emit("combo", { x: p.x, y: p.y - 40, text: "WET + ELECTRIC!" });
    }
    p.hp = Math.max(0, p.hp - amount);
    p.vx += forceX * RULES.impulseScale;
    p.vy += forceY * RULES.impulseScale;
    p.hurt = 0.45;
    if (effect === "wet") {
      p.wet = 3;
      p.burn = 0;
    }
    if (effect === "burn" && !p.wet) p.burn = 2;
    if (effect === "curse") p.curse = 1;
    if (effect === "poison") p.poison = 2;
    if (effect === "chill") p.chill = 1;
    if (effect === "weaken") p.weaken = 2;
    if (source !== index && source !== null) {
      this.players[source].damage += amount;
      if (amount) this.players[source].hits++;
    }
    if (amount)
      this.emit("damage", { x: p.x, y: p.y - 20, damage: amount, index });
  }
  hit(x, y, move, directIndex = -1) {
    // Sample cover before terrain removal; near direct hits are never hidden by their impact surface.
    for (let i = 0; i < 2; i++) {
      const p = this.players[i],
        d = Math.hypot(p.x - x, p.y - y),
        reach = move.radius + 32;
      if (p.hp <= 0 || d >= reach) continue;
      let scale = Math.max(0, 1 - Math.max(0, d - 15) / reach);
      if (
        d > 32 &&
        !["seismic", "tunnel"].includes(move.pattern) &&
        this.terrain.lineBlocked(x, y - 5, p.x, p.y - 8)
      )
        scale *= 0.55;
      const damage = i === directIndex ? move.damage : move.damage * scale;
      this.damagePlayer(
        i,
        damage,
        this.active,
        (move.impactDX ??
          Math.sign(p.x - x || this.players[this.active].facing)) *
          move.force *
          scale,
        -move.force *
          (move.behavior === "stream"
            ? 0.35
            : move.pattern === "lift"
              ? 1.35
              : 0.7) *
          scale,
        move.effect,
      );
    }
    this.terrain.circle(x, y, move.terrainRadius ?? move.radius);
    this.emit("impact", {
      x,
      y,
      color: move.color,
      radius: move.radius,
      kind: move.id,
      visual: move.visual,
      fragment: !!move.fragment,
      facing: this.players[this.active].facing,
    });
  }
  resolveImpact(x, y, m, directIndex = -1) {
    if (m.behavior === "seeds" && !m.fragment) {
      this.emit("burst", {
        x,
        y,
        color: m.color,
        radius: m.radius,
        kind: m.id,
        visual: m.visual,
      });
      for (const [i, vx] of [-105, 0, 105].entries())
        this.projectiles.push({
          x,
          y: y - 12,
          vx,
          vy: -140 - i * 17,
          age: 0,
          delay: 0,
          bounces: 0,
          history: [],
          move: {
            ...m,
            behavior: "fragment",
            kind: "fragment",
            fragment: true,
            damage: m.damage / 3,
            force: m.force * 0.4,
            radius: 34,
            terrainRadius: 22,
          },
        });
      return;
    }
    if (m.behavior === "meteors" && !m.fragment) {
      this.emit("burst", {
        x,
        y,
        color: m.color,
        radius: m.radius,
        kind: m.id,
        visual: m.visual,
      });
      for (const [i, dx] of [-62, 0, 62].entries())
        this.projectiles.push({
          x: Math.max(8, Math.min(W - 8, x + dx - 35)),
          y: Math.max(-80, y - 270),
          vx: 55,
          vy: 210,
          age: 0,
          delay: i * 0.15,
          bounces: 0,
          history: [],
          move: {
            ...m,
            behavior: "meteor-fragment",
            kind: "fragment",
            fragment: true,
            damage: m.damage / 3,
            force: m.force * 0.4,
            terrainRadius: 26,
          },
        });
      return;
    }
    if (m.kind === "cluster") {
      const offsets = m.pattern === "meteor" ? [-62, 0, 62] : [-38, 0, 38];
      offsets.forEach((dx, i) => {
        const px = Math.max(4, Math.min(W - 4, x + dx));
        this.pendingImpacts.push({
          delay: 0.12 + i * 0.18,
          x: px,
          y: this.terrain.top(px, Math.max(0, y - 60)) - 2,
          move: {
            ...m,
            kind: "fragment",
            fragment: true,
            damage: m.damage / 3,
            radius: m.radius,
            terrainRadius: m.radius * 0.7,
          },
          directIndex: -1,
        });
      });
      this.emit("burst", {
        x,
        y,
        color: m.color,
        radius: m.radius,
        kind: m.id,
        visual: m.visual,
      });
      return;
    }
    const terrainRadius = [
      "ring",
      "seismic",
      "lift",
      "spikes",
      "sweep",
      "eruption",
      "tunnel",
    ].includes(m.pattern)
      ? Math.min(40, m.radius)
      : m.radius;
    this.hit(
      x,
      y,
      { ...m, terrainRadius: m.behavior === "stream" ? 18 : terrainRadius },
      directIndex,
    );
    if (["stream", "water"].includes(m.behavior))
      for (const dx of [-24, 0, 24])
        this.addHazard("water", x + dx, y, m.behavior === "water" ? 36 : 26);
    if (m.behavior === "tidal")
      for (let dx = -100; dx <= 100; dx += 25)
        this.addHazard("water", x + dx, y, 25);
    if (m.behavior === "firecross")
      for (const dx of [-48, 0, 48])
        this.addHazard("fire", x + dx, y, 16, this.active, 2);
    if (m.behavior === "flame")
      for (const dx of [-55, -28, 0, 28, 55])
        this.addHazard("fire", x + dx, y, 20);
    if (m.behavior === "sludge") this.addHazard("poison", x, y, 34);
    if (m.behavior === "lava" && !m.fragment) {
      for (const [i, vx] of [-120, -55, 55, 120].entries())
        this.projectiles.push({
          x,
          y: y - 14,
          vx,
          vy: -160 - (i % 2) * 30,
          age: 0,
          delay: 0,
          bounces: 0,
          history: [],
          move: {
            ...m,
            fragment: true,
            behavior: "ember",
            kind: "fragment",
            damage: 3,
            force: 35,
            radius: 22,
            terrainRadius: 12,
          },
        });
    }
    if (m.behavior === "ember") this.addHazard("lava", x, y, 24);
    if (m.behavior === "lightning") this.conduct(x, y, m);
    if (m.pattern === "cross")
      for (const [dx, dy] of [
        [-48, 0],
        [48, 0],
        [0, -48],
        [0, 48],
      ])
        this.terrain.circle(x + dx, y + dy, 23);
    if (m.pattern === "crosscut")
      for (let t = -62; t <= 62; t += 5) {
        this.terrain.circle(x + t, y + t, 13);
        this.terrain.circle(x + t, y - t, 13);
      }
    if (m.behavior === "quake") {
      for (let d = 24; d <= 120; d += 24)
        for (const sign of [-1, 1]) {
          const px = x + d * sign,
            py = this.terrain.top(px, Math.max(0, y - 65));
          this.pendingImpacts.push({
            delay: d / 180,
            x: px,
            y: py + 3,
            move: {
              ...m,
              damage: 0,
              force: 18,
              radius: 20,
              terrainRadius: 18,
              fragment: true,
            },
            directIndex: -1,
          });
        }
    }
    if (
      (m.pattern === "seismic" && m.behavior !== "quake") ||
      m.pattern === "sweep"
    )
      for (let dx = -120; dx <= 120; dx += 22) {
        const px = x + dx,
          py = this.terrain.top(px, Math.max(0, y - 65));
        this.terrain.circle(px, py + 3, 18);
      }
    if (m.pattern === "tunnel" || m.pattern === "eruption") {
      for (let d = 0; d < 110; d += 9)
        this.terrain.circle(x, y + d, m.pattern === "tunnel" ? 24 : 18);
      if (m.pattern === "tunnel")
        for (let dx = -65; dx <= 65; dx += 8)
          this.terrain.circle(x + dx, y + 48, 20);
    }
    if (m.pattern === "spikes")
      for (const dx of [-65, 65]) {
        const px = x + dx,
          py = this.terrain.top(px, Math.max(0, y - 70));
        if (
          py < SEA &&
          !this.players.some((p) => p.hp > 0 && Math.abs(p.x - px) < 34)
        )
          for (let h = 0; h < 48; h += 8)
            this.terrain.circle(px, py - h, Math.max(7, 18 - h * 0.2), 1);
      }
  }
  launch() {
    const s = this.summon,
      m = this.currentMove,
      p = this.players[this.active];
    this.emit("attack", { kind: m.kind, visual: m.visual, color: m.color });
    if (BALLISTIC.has(m.kind)) {
      const count =
        m.behavior === "stream" ? 4 : m.kind === "salvo" ? m.count : 1;
      this.projectiles = Array.from({ length: count }, (_, i) =>
        makeProjectile(
          p,
          s.angle + (i - (count - 1) / 2) * (m.spread || 0),
          s.power,
          i * (m.behavior === "stream" ? 0.07 : 0.085),
          m,
        ),
      );
      this.projectile = this.projectiles[0];
      this.setPhase("flight");
      return;
    }
    const target = traceShot(this, m, s.angle, s.power);
    this.attack = {
      ...target,
      origin: target.points[0],
      progress: 0,
      hit: [],
      duration: m.id === "hyper-beam" ? 1.1 : 0.9,
      resolved: false,
    };
    this.setPhase("attack");
  }
  advanceAttack() {
    const a = this.attack,
      m = this.currentMove,
      prev = a.progress;
    a.progress = Math.min(1, this.phaseTime / a.duration);
    if (a.remote) {
      if (m.behavior === "burrow" && a.progress > 0.22 && a.progress < 0.6) {
        const q = Math.min(1, (a.progress - 0.22) / 0.36),
          dir = this.players[this.active].facing;
        a.burrowX = a.x - dir * 130 * (1 - q);
        a.burrowY = a.y + 44;
        this.terrain.circle(a.burrowX, a.burrowY, 25);
        if (q < 0.15)
          for (let y = a.y - 5; y < a.y + 45; y += 8)
            this.terrain.circle(a.x - dir * 130, y, 23);
      }
      if (m.behavior === "levitate" && a.progress > 0.24 && a.progress < 0.58)
        for (const p of this.players) {
          if (p.hp > 0 && Math.hypot(p.x - a.x, p.y - a.y) < m.radius + 35) {
            p.vy = -55;
            p.vx *= 0.98;
          }
        }
      if (m.behavior === "vortex" && a.progress > 0.25 && a.progress < 0.85)
        for (const p of this.players) {
          if (p.hp > 0 && Math.hypot(p.x - a.x, p.y - a.y) < m.radius + 55) {
            p.vx += (a.x - p.x) * DT * 2;
            p.vy -= 160 * DT;
          }
        }
      if (a.progress >= 0.58 && !a.resolved) {
        a.resolved = true;
        this.resolveImpact(a.x, a.y, m, a.directIndex);
      }
    } else {
      const len = Math.hypot(a.x - a.origin.x, a.y - a.origin.y),
        dx = (a.x - a.origin.x) / (len || 1),
        dy = (a.y - a.origin.y) / (len || 1);
      for (let t = prev * len; t <= a.progress * len; t += 3) {
        const x = a.origin.x + dx * t,
          y = a.origin.y + dy * t;
        for (let i = 0; i < 2; i++)
          if (
            i !== this.active &&
            !a.hit.includes(i) &&
            this.players[i].hp > 0 &&
            Math.hypot(this.players[i].x - x, this.players[i].y - y) <
              m.radius + 19
          ) {
            this.damagePlayer(
              i,
              m.damage,
              this.active,
              dx * m.force,
              Math.min(-35, dy * m.force - 35),
              m.effect,
            );
            a.hit.push(i);
          }
        this.terrain.circle(x, y, m.radius);
      }
    }
    if (a.progress === 1) {
      if (m.behavior === "freeze") this.freezeWater(a);
      this.setPhase("settle");
    }
  }
  advanceFlights() {
    const flying = this.projectiles;
    this.projectiles = [];
    for (const shot of flying) {
      const m = shot.move || this.currentMove;
      if (shot.delay > 0) {
        shot.delay -= DT;
        this.projectiles.push(shot);
        continue;
      }
      shot.history.push({ x: shot.x, y: shot.y });
      if (shot.history.length > (m.behavior === "stream" ? 240 : 30))
        shot.history.shift();
      const hit = advanceProjectile(this, shot, m, this.active);
      if (!hit) {
        this.projectiles.push(shot);
        continue;
      }
      if (REMOTE.has(m.kind)) {
        const y =
          Math.min(SEA, this.terrain.top(hit.x, Math.max(0, hit.y - 12))) - 2;
        this.attack = {
          ...hit,
          y,
          origin: { x: this.summon.x, y: this.summon.y },
          progress: 0,
          duration: ["body-slam", "eruption", "dragon-rush", "dig"].includes(
            m.id,
          )
            ? 1.35
            : 1.1,
          remote: true,
          resolved: false,
        };
        this.summon.x = hit.x;
        this.summon.y = y;
        this.emit("arrival", {
          x: hit.x,
          y: y - 30,
          color: m.color,
          visual: m.visual,
        });
        this.setPhase("attack");
      } else {
        const impact =
          m.behavior === "stream"
            ? {
                ...m,
                damage: m.damage / 4,
                force: m.force * 0.24,
                impactDX: Math.sign(shot.vx),
              }
            : m;
        this.resolveImpact(hit.x, hit.y, impact, hit.directIndex);
      }
      this.emit("landing", { x: hit.x, y: hit.y, owner: this.active });
    }
    this.projectile = this.projectiles[0] || null;
    if (this.phase === "flight" && !this.projectiles.length)
      this.setPhase("settle");
  }
  addHazard(type, x, y, radius, owner = this.active, life = 4) {
    if (x < 28 || x > W - 28) return;
    y = Math.min(SEA - 2, this.terrain.top(x, Math.max(0, y - 35)));
    if (type === "water")
      this.hazards = this.hazards.filter(
        (h) =>
          !["fire", "lava"].includes(h.type) ||
          Math.abs(h.x - x) > h.radius + radius,
      );
    if (
      ["fire", "lava"].includes(type) &&
      this.hazards.some(
        (h) =>
          h.type === "water" &&
          Math.abs(h.x - x) < h.radius + radius &&
          Math.abs(h.y - y) < 45,
      )
    )
      return;
    const prior = this.hazards.find(
      (h) =>
        h.type === type && Math.abs(h.x - x) < 22 && Math.abs(h.y - y) < 30,
    );
    if (prior) {
      prior.expires = Math.max(prior.expires, this.turn + life);
      return;
    }
    if (this.hazards.length >= 100) this.hazards.shift();
    this.hazards.push({
      type,
      x,
      y,
      radius,
      owner,
      expires: this.turn + life,
      flow: type === "water" ? 1 : 0,
      hit: [-1, -1],
    });
  }
  updateHazards() {
    for (const h of this.hazards) {
      if (h.flow > 0) {
        h.flow = Math.max(0, h.flow - DT);
        const base = this.terrain.top(h.x, Math.max(0, h.y - 28)),
          left = this.terrain.top(h.x - 12, Math.max(0, h.y - 28)),
          right = this.terrain.top(h.x + 12, Math.max(0, h.y - 28));
        const dir = left > right ? -1 : 1;
        if (Math.max(left, right) > base + 1)
          h.x = Math.max(29, Math.min(W - 29, h.x + dir * 65 * DT));
      }
      h.y = Math.min(SEA - 2, this.terrain.top(h.x, Math.max(0, h.y - 28)));
      for (let i = 0; i < 2; i++) {
        const p = this.players[i];
        if (
          p.hp <= 0 ||
          Math.abs(p.x - h.x) > h.radius + 7 ||
          Math.abs(p.y + 18 - h.y) > 30
        )
          continue;
        if (h.type === "water") {
          p.wet = Math.max(2, p.wet);
          p.burn = 0;
        } else if (
          this.phase === "aim" &&
          this.active === i &&
          h.hit[i] !== this.turn
        ) {
          // One ground-hazard hit per trainer per turn, even across overlapping patches.
          if (
            !this.hazards.some(
              (other) =>
                other !== h &&
                other.type !== "water" &&
                other.hit[i] === this.turn,
            )
          )
            this.damagePlayer(
              i,
              h.type === "lava" ? 6 : h.type === "poison" ? 3 : 4,
              h.owner,
              0,
              0,
              null,
              true,
            );
          h.hit[i] = this.turn;
        }
      }
    }
  }
  conduct(x, y, m) {
    const wet = this.hazards.filter((h) => h.type === "water"),
      connected = new Set(
        wet.filter((h) => Math.hypot(h.x - x, h.y - y) < h.radius + m.radius),
      );
    let changed = true;
    while (changed) {
      changed = false;
      for (const h of wet)
        if (
          !connected.has(h) &&
          [...connected].some(
            (a) => Math.hypot(a.x - h.x, a.y - h.y) < a.radius + h.radius + 12,
          )
        ) {
          connected.add(h);
          changed = true;
        }
    }
    for (const h of connected)
      this.emit("conduction", { x, y, ex: h.x, ey: h.y, color: m.color });
    for (let i = 0; i < 2; i++) {
      const p = this.players[i];
      if (
        p.hp > 0 &&
        Math.hypot(p.x - x, p.y - y) > m.radius + 32 &&
        [...connected].some(
          (h) =>
            Math.abs(p.x - h.x) < h.radius + 10 &&
            Math.abs(p.y + 18 - h.y) < 38,
        )
      )
        this.damagePlayer(i, 14, this.active, 0, -35, "electric");
    }
  }
  freezeWater(a) {
    for (const h of this.hazards.filter((h) => h.type === "water")) {
      const dx = a.x - a.origin.x,
        dy = a.y - a.origin.y,
        l = dx * dx + dy * dy;
      const q = Math.max(
        0,
        Math.min(
          1,
          ((h.x - a.origin.x) * dx + (h.y - a.origin.y) * dy) / (l || 1),
        ),
      );
      if (Math.hypot(a.origin.x + dx * q - h.x, a.origin.y + dy * q - h.y) > 38)
        continue;
      const cells = [];
      for (
        let x = Math.max(28, Math.floor(h.x - h.radius));
        x < Math.min(W - 28, h.x + h.radius);
        x++
      )
        for (let y = Math.max(0, Math.floor(h.y - 8)); y < h.y + 2; y++) {
          const idx = y * W + x;
          if (!this.terrain.cells[idx]) {
            this.terrain.cells[idx] = 2;
            cells.push(idx);
          }
        }
      this.ice.push({
        cells,
        x: h.x,
        y: h.y,
        radius: h.radius,
        expires: this.turn + 4,
      });
      this.terrain.version++;
      h.expires = this.turn;
    }
    this.hazards = this.hazards.filter((h) => h.expires > this.turn);
  }
  physics() {
    for (let index = 0; index < 2; index++) {
      const p = this.players[index];
      if (p.hp <= 0) continue;
      p.hurt = Math.max(0, p.hurt - DT);
      p.vy += GRAVITY * DT;
      // Terrain edits should never strand a living body inside a solid cell.
      if (this.collides(p.x, p.y)) {
        let found = false;
        for (let up = 1; up < 95; up++)
          if (!this.collides(p.x, p.y - up)) {
            p.y -= up;
            found = true;
            break;
          }
        if (!found) this.terrain.circle(p.x, p.y, 25);
      }
      const n = Math.max(
        1,
        Math.ceil((Math.max(Math.abs(p.vx), Math.abs(p.vy)) * DT) / 2),
      );
      p.grounded = false;
      for (let i = 0; i < n; i++) {
        const nx = p.x + (p.vx * DT) / n;
        if (!this.collides(nx, p.y)) p.x = nx;
        else p.vx = 0;
        const ny = p.y + (p.vy * DT) / n;
        if (!this.collides(p.x, ny)) p.y = ny;
        else if (p.vy >= 0) {
          if (p.vy > 320) {
            const dmg = Math.min(
              RULES.maxFallDamage,
              Math.round((p.vy - 320) * 0.16),
            );
            this.damagePlayer(index, dmg, null);
            this.addLog(`${p.name} took ${dmg} fall damage.`);
          }
          p.vy = 0;
          p.grounded = true;
        } else p.vy = 0;
      }
      p.vx *= p.grounded ? 0.82 : 0.994;
      if (Math.abs(p.vx) < 1) p.vx = 0;
      if (p.y > SEA - 3 || p.x < -10 || p.x > W + 10) {
        p.hp = 0;
        this.emit("splash", {
          x: Math.max(0, Math.min(W, p.x)),
          y: SEA,
          color: "#a4edff",
          radius: 45,
        });
        this.addLog(`${p.name} fell into the sea.`);
      }
    }
  }
  step() {
    if (this.phase === "over") return;
    this.clock += DT;
    this.phaseTime += DT;
    this.physics();
    this.updateHazards();
    const waiting = [];
    for (const impact of this.pendingImpacts) {
      impact.delay -= DT;
      if (impact.delay <= 0) {
        this.hit(impact.x, impact.y, impact.move, impact.directIndex);
        if (impact.move.behavior === "sludge")
          this.addHazard("poison", impact.x, impact.y, 26);
      } else waiting.push(impact);
    }
    this.pendingImpacts = waiting;
    if (this.phase === "aim") {
      if (this.checkVictory()) return;
      if (this.options.timer && this.options.mode !== "practice") {
        this.timer -= DT;
        if (this.timer <= 0) this.pass();
      }
    } else if (
      this.phase === "summon" &&
      this.phaseTime >= (this.summon.remote ? 0.45 : 0.95)
    )
      this.launch();
    else if (this.phase === "flight") this.advanceFlights();
    else if (this.phase === "attack") this.advanceAttack();
    else if (this.phase === "settle") {
      if (this.projectiles.length) {
        this.advanceFlights();
        return;
      }
      const settled = this.players.every(
        (p) => p.hp <= 0 || (p.grounded && Math.abs(p.vx) < 1 && p.vy === 0),
      );
      this.stable = settled ? this.stable + DT : 0;
      if (
        this.stable > 0.25 &&
        this.phaseTime > 0.45 &&
        !this.pendingImpacts.length
      )
        this.setPhase("recall");
      // Cancel only negligible numerical drift; never advance over a falling body.
      if (this.phaseTime > 10)
        for (const p of this.players)
          if (p.grounded && Math.abs(p.vx) < 8) p.vx = 0;
    } else if (this.phase === "recall" && this.phaseTime > 0.45)
      this.nextTurn();
    else if (this.phase === "handoff" && this.phaseTime > 0.7)
      this.setPhase("aim");
  }
  checkVictory() {
    const alive = this.players
      .map((p, i) => (p.hp > 0 ? i : -1))
      .filter((i) => i >= 0);
    if (alive.length === 2) return false;
    this.winner = alive.length ? alive[0] : -1;
    this.setPhase("over");
    this.emit("victory");
    return true;
  }
  nextTurn() {
    if (this.checkVictory()) return;
    if (
      this.players.every((p) => Object.values(p.ammo).every((n) => n === 0))
    ) {
      this.winner =
        this.players[0].hp === this.players[1].hp
          ? -1
          : this.players[0].hp > this.players[1].hp
            ? 0
            : 1;
      this.addLog("All moves exhausted. Remaining HP decides the result.");
      this.setPhase("over");
      this.emit("victory");
      return;
    }
    this.active = this.options.mode === "practice" ? 0 : 1 - this.active;
    this.turn++;
    this.hazards = this.hazards.filter((h) => h.expires > this.turn);
    for (const shelf of this.ice)
      if (shelf.expires <= this.turn) {
        for (const idx of shelf.cells)
          if (this.terrain.cells[idx] === 2) this.terrain.cells[idx] = 0;
        this.terrain.version++;
      }
    this.ice = this.ice.filter((s) => s.expires > this.turn);
    const p = this.players[this.active];
    for (const id of Object.keys(p.cooldowns))
      p.cooldowns[id] = Math.max(0, p.cooldowns[id] - 1);
    if (p.burn) {
      this.damagePlayer(this.active, 4, 1 - this.active, 0, 0, null, true);
      p.burn--;
      this.addLog(`${p.name} took 4 burn damage.`);
    }
    if (p.poison) {
      this.damagePlayer(this.active, 4, 1 - this.active, 0, 0, null, true);
      p.poison--;
      this.addLog(`${p.name} took 4 poison damage.`);
    }
    if (p.weaken) p.weaken--;
    if (p.wet) p.wet--;
    this.budget = Math.round(
      RULES.movement * (p.curse ? 0.5 : p.chill ? 0.65 : 1),
    );
    p.chill = 0;
    p.curse = 0;
    if (this.checkVictory()) return;
    this.timer = RULES.turnTime;
    this.wind = Math.round((this.rng() - 0.5) * 24);
    this.summon = null;
    this.attack = null;
    this.setPhase("handoff");
    this.addLog(`Turn ${this.turn} · ${p.name} takes the field.`);
    this.emit("turn");
  }
  fork() {
    const copy = Object.create(Battle.prototype);
    for (const key of Object.keys(this))
      if (!["terrain", "rng", "events"].includes(key))
        copy[key] = structuredClone(this[key]);
    copy.terrain = Object.create(Terrain.prototype);
    Object.assign(copy.terrain, this.terrain, {
      cells: this.terrain.cells.slice(),
      heights: this.terrain.heights.slice(),
    });
    copy.rng = random(this.rng.state);
    copy.events = [];
    return copy;
  }
  stateHash() {
    let h = 2166136261;
    const append = (v) => {
      h ^= v;
      h = Math.imul(h, 16777619);
    };
    for (const value of this.terrain.cells) append(value);
    const state = JSON.stringify({
      players: this.players,
      phase: this.phase,
      phaseTime: this.phaseTime,
      clock: this.clock,
      turn: this.turn,
      active: this.active,
      wind: this.wind,
      budget: this.budget,
      timer: this.timer,
      random: this.rng.state,
      projectiles: this.projectiles,
      pendingImpacts: this.pendingImpacts,
      attack: this.attack,
      summon: this.summon && {
        ...this.summon,
        species: this.summon.species.id,
      },
      winner: this.winner,
      hazards: this.hazards,
      ice: this.ice,
      lastShots: this.lastShots,
    });
    for (let i = 0; i < state.length; i++) append(state.charCodeAt(i));
    return (h >>> 0).toString(16);
  }
}
