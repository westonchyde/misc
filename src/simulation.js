import { roster } from "./content.js";
export const W = 1280,
  H = 680,
  SEA = 632,
  GROUND = SEA,
  DT = 1 / 60,
  GRAVITY = 440;
export const RULES = {
  hp: 140,
  movement: 125,
  turnTime: 45,
  jumpCost: 18,
  maxFallDamage: 35,
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
  constructor(seed = 42, map = "highlands") {
    this.cells = new Uint8Array(W * H);
    this.map = map;
    this.version = 0;
    this.phase = random(seed)() * 6;
    for (let x = 28; x < W - 28; x++) {
      if (map === "islands" && x > 585 && x < 695) continue;
      const y = this.surface(x);
      for (let j = y; j < SEA + 12; j++) this.cells[j * W + x] = 1;
    }
    // Spawn shelves: flat, wide, with unobstructed headroom.
    for (const x of [260, 1020]) {
      const y = this.surface(x);
      for (let i = x - 37; i <= x + 37; i++)
        for (let j = 0; j < SEA + 12; j++)
          this.cells[j * W + i] = j >= y ? 1 : 0;
    }
  }
  surface(x) {
    if (this.map === "sunset")
      return Math.floor(
        370 + 82 * Math.sin(x / 310 - 0.5) + 18 * Math.sin(x / 65 + this.phase),
      );
    if (this.map === "islands")
      return Math.floor(
        410 + 32 * Math.sin(x / 150 + this.phase) + 18 * Math.cos(x / 57),
      );
    return Math.floor(
      430 + 48 * Math.sin(x / 180 + this.phase) + 22 * Math.sin(x / 75),
    );
  }
  solid(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    return x >= 0 && x < W && y >= 0 && y < H && this.cells[y * W + x] === 1;
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
  return 240 + power * 4.2;
}
export function originFor(player, angle) {
  const dir = Math.cos((angle * Math.PI) / 180) >= 0 ? 1 : -1;
  // Shared muzzle for preview and attacks; summons are visual actors, not extra colliders.
  return { x: player.x + dir * 55, y: player.y - 25 };
}
export function traceShot(battle, move, angle, power, owner = battle.active) {
  const p = battle.players[owner],
    o = originFor(p, angle),
    d = angleVector(angle),
    points = [{ ...o }];
  if (move.kind === "wall") {
    const x = Math.max(55, Math.min(W - 55, p.x + Math.sign(d.x) * move.range));
    return { points, x, y: battle.terrain.top(x), direct: false };
  }
  if (move.kind === "slam") {
    const x = Math.max(
      25,
      Math.min(
        W - 25,
        p.x + Math.sign(d.x) * (70 + (power * (move.range - 70)) / 100),
      ),
    );
    return { points, x, y: battle.terrain.top(x), direct: false };
  }
  if (["lob", "phase"].includes(move.kind)) {
    let x = o.x,
      y = o.y,
      vx = d.x * speedFor(power),
      vy = d.y * speedFor(power),
      crossed = false;
    for (let tick = 0; tick < 540; tick++) {
      vx += battle.wind * DT;
      vy += GRAVITY * DT;
      const steps = Math.max(1, Math.ceil((Math.hypot(vx, vy) * DT) / 3));
      for (let s = 0; s < steps; s++) {
        x += (vx * DT) / steps;
        y += (vy * DT) / steps;
        const rival = battle.players[1 - owner];
        const direct =
          rival.hp > 0 &&
          Math.abs(rival.x - x) < 12 &&
          Math.abs(rival.y - y) < 22;
        const terrain = battle.terrain.solid(x, y);
        if (y < o.y - 5) crossed = true;
        // Spectral shots ignore terrain until descending to their starting level.
        const phaseEnd =
          move.kind === "phase" && crossed && vy > 0 && y >= o.y + 25;
        if (
          direct ||
          (move.kind !== "phase" && terrain) ||
          phaseEnd ||
          y >= SEA ||
          x < 0 ||
          x > W
        )
          return {
            points: [...points, { x, y }],
            x,
            y,
            direct,
            ticks: tick + 1,
          };
      }
      if (tick % 4 === 0) points.push({ x, y });
    }
    return { points, x, y, direct: false, ticks: 540 };
  }
  let x = o.x,
    y = o.y;
  if (move.kind === "dig") {
    y = p.y + 20;
    d.x = Math.sign(d.x);
    d.y = 0;
  }
  const start = { x, y };
  points[0] = start;
  for (let t = 0; t <= move.range; t += 4) {
    x = start.x + d.x * t;
    y = start.y + d.y * t;
    if (move.kind === "bolt" && battle.terrain.solid(x, y)) break;
    if (x < 0 || x > W || y > SEA) break;
  }
  return { points: [start, { x, y }], x, y, direct: true };
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
    this.rng = random(this.options.seed + 19);
    this.terrain = new Terrain(this.options.seed, this.options.map);
    this.players = [260, 1020].map((x, i) => ({
      x,
      y: this.terrain.top(x) - 19,
      vx: 0,
      vy: 0,
      hp: RULES.hp,
      name: i ? "RIVER" : "EMBER",
      wet: 0,
      burn: 0,
      curse: 0,
      grounded: true,
      facing: i ? -1 : 1,
      cooldowns: {},
      damage: 0,
      hits: 0,
      shots: 0,
      walk: 0,
      lastWalk: -1,
      hurt: 0,
    }));
    this.active = 0;
    this.phase = "aim";
    this.phaseTime = 0;
    this.budget = RULES.movement;
    this.timer = RULES.turnTime;
    this.turn = 1;
    this.events = [];
    this.projectile = null;
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
    return !!m && !(this.players[owner].cooldowns[m.id] > 0);
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
    if (m.kind === "wall") {
      const t = traceShot(this, m, angle, power);
      if (t.y >= SEA || this.players.some((q) => Math.abs(q.x - t.x) < 48))
        return false;
    }
    p.facing = Math.cos((angle * Math.PI) / 180) >= 0 ? 1 : -1;
    this.currentMove = m;
    this.setPhase("summon");
    this.attack = null;
    this.stable = 0;
    const o = originFor(p, angle);
    this.summon = {
      species,
      speciesIndex,
      x: p.x + p.facing * 25,
      y: p.y + 17,
      angle,
      power,
      owner: this.active,
    };
    this.projectile = null;
    p.shots++;
    p.cooldowns[m.id] = m.cooldown + 1;
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
  damagePlayer(index, amount, source, forceX = 0, forceY = 0, effect = null) {
    const p = this.players[index];
    if (p.hp <= 0) return;
    amount = Math.max(0, Math.round(amount));
    if (effect === "electric" && p.wet) {
      amount = Math.round(amount * 1.5);
      this.emit("combo", { x: p.x, y: p.y - 40, text: "WET + ELECTRIC!" });
    }
    p.hp = Math.max(0, p.hp - amount);
    p.vx += forceX;
    p.vy += forceY;
    p.hurt = 0.45;
    if (effect === "wet") {
      p.wet = 3;
      p.burn = 0;
    }
    if (effect === "burn" && !p.wet) p.burn = 2;
    if (effect === "curse") p.curse = 1;
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
      if (d > 32 && this.terrain.lineBlocked(x, y - 5, p.x, p.y - 8))
        scale *= 0.55;
      const damage = i === directIndex ? move.damage : move.damage * scale;
      this.damagePlayer(
        i,
        damage,
        this.active,
        Math.sign(p.x - x || this.players[this.active].facing) *
          move.force *
          scale,
        -move.force * 0.7 * scale,
        move.effect,
      );
    }
    this.terrain.circle(x, y, move.radius);
    this.emit("impact", {
      x,
      y,
      color: move.color,
      radius: move.radius,
      kind: move.id,
    });
  }
  launch() {
    const s = this.summon,
      m = this.currentMove,
      p = this.players[this.active],
      d = angleVector(s.angle),
      o = originFor(p, s.angle);
    this.emit("attack", { kind: m.kind, color: m.color });
    if (["lob", "phase"].includes(m.kind)) {
      const trace = traceShot(this, m, s.angle, s.power);
      this.projectile = {
        ...o,
        vx: d.x * speedFor(s.power),
        vy: d.y * speedFor(s.power),
        age: 0,
        targetY: o.y + 25,
        crossed: false,
        trace,
      };
      this.setPhase("flight");
      return;
    }
    const target = traceShot(this, m, s.angle, s.power);
    this.attack = {
      ...target,
      origin: target.points[0],
      progress: 0,
      hit: [],
      duration: m.kind === "slam" ? 1.05 : 0.65,
    };
    this.setPhase("attack");
  }
  advanceAttack() {
    const a = this.attack,
      m = this.currentMove,
      p = this.players[this.active];
    const prev = a.progress;
    a.progress = Math.min(1, this.phaseTime / a.duration);
    if (m.kind === "wall") {
      if (!prev) {
        if (a.y >= SEA || this.players.some((q) => Math.abs(q.x - a.x) < 48))
          this.addLog("No room for a rock wall there.");
        else {
          for (let j = 0; j < 85; j += 7)
            this.terrain.circle(a.x, a.y - j, 24, 1);
          this.emit("wall", { x: a.x, y: a.y, color: m.color });
        }
      }
    } else if (m.kind === "slam") {
      if (a.progress === 1 && prev < 1) {
        this.hit(a.x, a.y - 3, m);
        this.summon.x = a.x;
        this.summon.y = a.y;
      }
    } else {
      const length = Math.hypot(a.x - a.origin.x, a.y - a.origin.y),
        d = {
          x: (a.x - a.origin.x) / (length || 1),
          y: (a.y - a.origin.y) / (length || 1),
        };
      for (let t = prev * length; t <= a.progress * length; t += 3) {
        const x = a.origin.x + d.x * t,
          y = a.origin.y + d.y * t;
        const radius =
          m.kind === "cone" ? 7 + m.radius * (t / length) : m.radius;
        for (let i = 0; i < 2; i++) {
          if (i === this.active || a.hit.includes(i)) continue;
          const q = this.players[i];
          if (Math.hypot(q.x - x, q.y - y) < radius + 19) {
            this.damagePlayer(
              i,
              m.damage,
              this.active,
              d.x * m.force,
              Math.min(-35, d.y * m.force - 35),
              m.effect,
            );
            a.hit.push(i);
          }
        }
        if (!["ghost", "bolt"].includes(m.kind))
          this.terrain.circle(x, y, radius);
      }
    }
    if (a.progress === 1) {
      if (m.kind === "dig") {
        this.summon.x = a.x;
        this.summon.y = this.terrain.top(a.x);
      }
      this.setPhase("settle");
      this.emit("attackEnd");
    }
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
    if (this.phase === "aim") {
      if (this.checkVictory()) return;
      if (this.options.timer && this.options.mode !== "practice") {
        this.timer -= DT;
        if (this.timer <= 0) this.pass();
      }
    } else if (this.phase === "summon" && this.phaseTime >= 0.95) this.launch();
    else if (this.phase === "flight") {
      const b = this.projectile,
        m = this.currentMove;
      b.age += DT;
      b.vx += this.wind * DT;
      b.vy += GRAVITY * DT;
      const n = Math.max(1, Math.ceil((Math.hypot(b.vx, b.vy) * DT) / 3));
      for (let i = 0; i < n; i++) {
        b.x += (b.vx * DT) / n;
        b.y += (b.vy * DT) / n;
        if (b.y < this.players[this.active].y - 27) b.crossed = true;
        const rivalIndex = 1 - this.active,
          rival = this.players[rivalIndex];
        const direct =
          rival.hp > 0 &&
          Math.abs(rival.x - b.x) < 12 &&
          Math.abs(rival.y - b.y) < 22;
        const collide = m.kind !== "phase" && this.terrain.solid(b.x, b.y);
        const endPhase =
          m.kind === "phase" && b.crossed && b.vy > 0 && b.y >= b.targetY;
        if (
          direct ||
          collide ||
          endPhase ||
          b.y > SEA ||
          b.x < 0 ||
          b.x > W ||
          b.age > 9
        ) {
          this.hit(b.x, b.y, m, direct ? rivalIndex : -1);
          this.projectile = null;
          this.setPhase("settle");
          break;
        }
      }
    } else if (this.phase === "attack") this.advanceAttack();
    else if (this.phase === "settle") {
      const settled = this.players.every(
        (p) => p.hp <= 0 || (p.grounded && Math.abs(p.vx) < 1 && p.vy === 0),
      );
      this.stable = settled ? this.stable + DT : 0;
      if (this.stable > 0.25 && this.phaseTime > 0.45) this.setPhase("recall");
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
    this.active = this.options.mode === "practice" ? 0 : 1 - this.active;
    this.turn++;
    const p = this.players[this.active];
    for (const id of Object.keys(p.cooldowns))
      p.cooldowns[id] = Math.max(0, p.cooldowns[id] - 1);
    if (p.burn) {
      this.damagePlayer(this.active, 4, 1 - this.active);
      p.burn--;
      this.addLog(`${p.name} took 4 burn damage.`);
    }
    if (p.wet) p.wet--;
    this.budget = p.curse ? Math.round(RULES.movement / 2) : RULES.movement;
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
      projectile: this.projectile,
      attack: this.attack,
      summon: this.summon && {
        ...this.summon,
        species: this.summon.species.id,
      },
      winner: this.winner,
    });
    for (let i = 0; i < state.length; i++) append(state.charCodeAt(i));
    return (h >>> 0).toString(16);
  }
}
