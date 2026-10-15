import { roster, BALLISTIC, REMOTE } from "./content.js";
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
  return 260 + power * 5.6;
}
export function originFor(player, angle) {
  const dir = Math.cos((angle * Math.PI) / 180) >= 0 ? 1 : -1;
  // Shared muzzle for preview and attacks; summons are visual actors, not extra colliders.
  return { x: player.x + dir * 55, y: player.y - 42 };
}
// One authoritative projectile integrator is used by previews, AI and live shots.
export function advanceProjectile(battle, shot, move, owner) {
  shot.age += DT;
  shot.vx += battle.wind * DT;
  shot.vy += GRAVITY * DT;
  const steps = Math.max(1, Math.ceil((Math.hypot(shot.vx, shot.vy) * DT) / 3));
  for (let i = 0; i < steps; i++) {
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
export function makeProjectile(player, angle, power, delay = 0) {
  const o = originFor(player, angle),
    d = angleVector(angle);
  return {
    ...o,
    vx: d.x * speedFor(power),
    vy: d.y * speedFor(power),
    age: 0,
    delay,
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
    o = originFor(p, angle);
  if (BALLISTIC.has(move.kind)) {
    const shot = makeProjectile(p, angle, power),
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
    this.active = 0;
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
    const o = originFor(p, angle);
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
        Math.sign(p.x - x || this.players[this.active].facing) *
          move.force *
          scale,
        -move.force * (move.pattern === "lift" ? 1.35 : 0.7) * scale,
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
    this.hit(x, y, { ...m, terrainRadius }, directIndex);
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
    if (m.pattern === "seismic" || m.pattern === "sweep")
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
      const count = m.kind === "salvo" ? m.count : 1;
      this.projectiles = Array.from({ length: count }, (_, i) =>
        makeProjectile(
          p,
          s.angle + (i - (count - 1) / 2) * (m.spread || 0),
          s.power,
          i * 0.085,
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
    if (a.progress === 1) this.setPhase("settle");
  }
  advanceFlights() {
    const m = this.currentMove,
      alive = [];
    for (const shot of this.projectiles) {
      if (shot.delay > 0) {
        shot.delay -= DT;
        alive.push(shot);
        continue;
      }
      const hit = advanceProjectile(this, shot, m, this.active);
      if (!hit) {
        alive.push(shot);
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
          duration: ["body-slam", "eruption", "dragon-rush"].includes(m.id)
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
      } else this.resolveImpact(hit.x, hit.y, m, hit.directIndex);
      this.emit("landing", { x: hit.x, y: hit.y, owner: this.active });
    }
    this.projectiles = alive;
    this.projectile = alive[0] || null;
    if (this.phase === "flight" && !alive.length) this.setPhase("settle");
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
    const waiting = [];
    for (const impact of this.pendingImpacts) {
      impact.delay -= DT;
      if (impact.delay <= 0)
        this.hit(impact.x, impact.y, impact.move, impact.directIndex);
      else waiting.push(impact);
    }
    this.pendingImpacts = waiting;
    if (this.phase === "aim") {
      if (this.checkVictory()) return;
      if (this.options.timer && this.options.mode !== "practice") {
        this.timer -= DT;
        if (this.timer <= 0) this.pass();
      }
    } else if (this.phase === "summon" && this.phaseTime >= 0.95) this.launch();
    else if (this.phase === "flight") this.advanceFlights();
    else if (this.phase === "attack") this.advanceAttack();
    else if (this.phase === "settle") {
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
    });
    for (let i = 0; i < state.length; i++) append(state.charCodeAt(i));
    return (h >>> 0).toString(16);
  }
}
