import { W, H, SEA, traceShot } from "./simulation.js";
import { roster, maps } from "./content.js";
import { oval, shape, line, ball, creature, trainer } from "./art.js";

function canvas(w, h) {
  const el = document.createElement("canvas");
  el.width = w;
  el.height = h;
  return el;
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function pine(c, x, y, s, color) {
  c.fillStyle = "#364f4a";
  c.fillRect(x - s * 2, y - s * 42, s * 4, s * 43);
  for (let i = 0; i < 3; i++)
    shape(
      c,
      [
        [x, y - s * (85 - i * 19)],
        [x - s * (20 + i * 7), y - s * (30 - i * 12)],
        [x + s * (20 + i * 7), y - s * (30 - i * 12)],
      ],
      color,
      null,
    );
}
export function background(c, map = "highlands", time = 0) {
  const config = maps.find((m) => m.id === map) || maps[0];
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, config.sky[0]);
  g.addColorStop(1, config.sky[1]);
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  if (map === "islands") {
    for (let i = 0; i < 60; i++)
      oval(
        c,
        (i * 137 + 39) % W,
        (i * 71 + 29) % 250,
        i % 3 ? 1 : 1.8,
        i % 3 ? 1 : 1.8,
        "#e7f8ed99",
      );
    oval(c, 1040, 110, 40, 40, "#e6f2d2");
    oval(c, 1053, 100, 36, 36, config.sky[0]);
  } else {
    const glow = c.createRadialGradient(1030, 120, 10, 1030, 120, 155);
    glow.addColorStop(0, "#fff4c7aa");
    glow.addColorStop(1, "#fff4c700");
    c.fillStyle = glow;
    c.fillRect(850, 0, 380, 320);
    oval(c, 1030, 120, 40, 40, "#fff5c5");
    for (let i = 0; i < 7; i++) {
      const x = (i * 227 + 54) % W,
        y = 60 + (i % 3) * 47;
      oval(c, x, y, 64, 8, "#f5f9e745");
      oval(c, x + 30, y - 6, 30, 10, "#f5f9e745");
    }
  }
  const colors =
    map === "sunset"
      ? ["#8d829e66", "#987a9066", "#9c737ccc", "#936c76"]
      : map === "islands"
        ? ["#43648b66", "#446c8c77", "#426e8fcc", "#447987"]
        : ["#579eab55", "#5a9ca080", "#518e90bb", "#578d80"];
  for (let layer = 0; layer < 4; layer++) {
    const points = [[-20, H]];
    for (let x = -20; x <= W + 20; x += 14)
      points.push([
        x,
        290 +
          layer * 55 +
          Math.sin(x / (190 - layer * 24) + layer * 1.8) * (60 - layer * 7) +
          Math.cos(x / 64 + layer * 2) * 16,
      ]);
    points.push([W + 20, H]);
    shape(c, points, colors[layer], null);
  }
  for (let i = 0; i < 29; i++) {
    const x = i * 49 - 20;
    pine(
      c,
      x,
      455 + Math.sin(x / 150) * 35,
      0.5 + (i % 3) * 0.1,
      map === "sunset" ? "#79657555" : "#396d7166",
    );
  }
  const mist = c.createLinearGradient(0, 400, 0, 610);
  mist.addColorStop(0, "#d9f1df00");
  mist.addColorStop(1, map === "islands" ? "#a6cdd020" : "#c2dec044");
  c.fillStyle = mist;
  c.fillRect(0, 400, W, 210);
}
export function drawMapThumbnail(c, id) {
  c.save();
  c.scale(c.canvas.width / W, c.canvas.height / H);
  background(c, id);
  const pts = [[0, H]];
  for (let x = 0; x <= W; x += 20)
    pts.push([x, 410 + 60 * Math.sin(x / 160 + (id === "sunset" ? 1 : 3))]);
  pts.push([W, H]);
  shape(
    c,
    pts,
    id === "sunset" ? "#956958" : id === "islands" ? "#41677a" : "#607d4d",
    null,
  );
  if (id === "islands") {
    c.fillStyle = "#568fa7";
    c.fillRect(580, 300, 120, H);
  }
  c.restore();
}
export function drawHero(c, time = 0) {
  c.save();
  c.scale(c.canvas.width / 900, c.canvas.height / 720);
  c.save();
  c.scale(900 / W, 720 / H);
  background(c, "highlands");
  c.restore();
  // A foreground ridge anchors the lineup and leaves the title legible above.
  shape(
    c,
    [
      [0, 590],
      [110, 566],
      [210, 565],
      [320, 578],
      [420, 596],
      [540, 578],
      [670, 564],
      [780, 582],
      [900, 558],
      [900, 720],
      [0, 720],
    ],
    "#526c4d",
    null,
  );
  line(
    c,
    [
      [0, 590],
      [110, 566],
      [210, 565],
      [320, 578],
      [420, 596],
      [540, 578],
      [670, 564],
      [780, 582],
      [900, 558],
    ],
    "#a5c66f",
    9,
  );
  for (let i = 0; i < 80; i++) {
    const x = (i * 79) % 900,
      y = 610 + ((i * 17) % 110);
    oval(c, x, y, 1.5, 1, i % 2 ? "#7f9166" : "#3d5444");
  }
  const lineup = [
    ["golem", 95, 568, 0.95],
    ["gengar", 245, 570, 0.95],
    ["charizard", 410, 590, 1.6],
    ["pikachu", 565, 574, 1.04],
    ["blastoise", 700, 566, 1.2],
    ["snorlax", 835, 575, 1.05],
  ];
  lineup.forEach(([id, x, y, s], i) =>
    creature(c, id, x, y, s, i < 3 ? 1 : -1, time, "idle"),
  );
  const vignette = c.createLinearGradient(0, 600, 0, 720);
  vignette.addColorStop(0, "#112b2a00");
  vignette.addColorStop(1, "#112b2abb");
  c.fillStyle = vignette;
  c.fillRect(0, 600, 900, 120);
  c.restore();
}
export class Renderer {
  constructor(el, prefs) {
    this.canvas = el;
    this.c = el.getContext("2d");
    this.prefs = prefs;
    this.land = canvas(W, H);
    this.lc = this.land.getContext("2d");
    this.bg = canvas(W, H);
    this.bc = this.bg.getContext("2d");
    this.terrain = null;
    this.version = -1;
    this.map = null;
    this.effects = [];
    this.particles = [];
    this.trail = [];
    this.shake = 0;
  }
  clear() {
    this.terrain = null;
    this.version = -1;
    this.view = null;
    this.effects = [];
    this.particles = [];
    this.trail = [];
    this.shake = 0;
  }
  event(e) {
    if (["damage", "combo"].includes(e.type))
      this.effects.push({ ...e, life: 1.35, max: 1.35 });
    if (["impact", "splash", "wall", "summon"].includes(e.type)) {
      this.effects.push({ ...e, radius: e.radius || 36, life: 0.7, max: 0.7 });
      const n = this.prefs.reduced ? 10 : e.type === "impact" ? 36 : 18;
      for (let i = 0; i < n; i++) {
        const a = i * 2.39996,
          speed = 45 + ((i * 137) % 210);
        this.particles.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed - 80,
          color: i % 3 ? e.color : "#efe4b8",
          size: 2 + (i % 4),
          life: 0.6 + (i % 4) * 0.1,
          max: 1,
        });
      }
      if (e.type === "impact" && !this.prefs.reduced) this.shake = 5;
    }
  }
  tick(dt) {
    this.shake *= 0.87;
    for (const e of this.effects) e.life -= dt;
    this.effects = this.effects.filter((e) => e.life > 0);
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0).slice(-240);
    for (const p of this.trail) p.life -= dt;
    this.trail = this.trail.filter((p) => p.life > 0);
  }
  cacheTerrain(b) {
    if (this.terrain === b.terrain && this.version === b.terrain.version)
      return;
    this.terrain = b.terrain;
    this.version = b.terrain.version;
    const config = maps.find((m) => m.id === b.options.map),
      image = this.lc.createImageData(W, H),
      data = image.data,
      cells = b.terrain.cells;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (!cells[y * W + x]) continue;
        const i = (y * W + x) * 4,
          exposed = y < 7 || !cells[(y - 7) * W + x],
          edge = y < 2 || !cells[(y - 2) * W + x];
        const noise = ((x * 73 + y * 137 + ((x * y) % 29)) % 17) - 8;
        const base = exposed ? config.grass : config.soil;
        const depth = Math.max(0, y - b.terrain.surface(x));
        const strata =
          !exposed && (Math.sin(y / 27 + Math.sin(x / 110)) > 0.87 ? -16 : 0);
        for (let j = 0; j < 3; j++)
          data[i + j] = clamp(
            base[j] +
              noise +
              strata -
              Math.min(18, depth / 15) +
              (edge ? 24 : 0),
            0,
            255,
          );
        data[i + 3] = 255;
      }
    this.lc.putImageData(image, 0, 0);
    // Fine grass blades only where ground still exists, so craters never leave floating scenery.
    const c = this.lc;
    for (let x = 35; x < W - 30; x += 9) {
      const y = b.terrain.top(x);
      if (y >= SEA) continue;
      line(
        c,
        [
          [x - 2, y],
          [x - 3, y - 4 - (x % 5)],
          [x, y - 2],
          [x + 3, y - 6],
        ],
        `rgb(${config.grass.map((v) => v + 10).join(",")})`,
        1,
      );
      if (x % 27 === 8) oval(c, x, y - 5, 1.8, 1.8, "#e6de9a");
    }
    for (let i = 0; i < 75; i++) {
      const x = 50 + ((i * 137) % (W - 100)),
        y = 460 + ((i * 83) % 170);
      if (b.terrain.solid(x, y)) {
        c.save();
        c.globalAlpha = 0.3;
        shape(
          c,
          [
            [x - 5, y],
            [x - 2, y - 4],
            [x + 5, y - 2],
            [x + 7, y + 3],
            [x - 2, y + 4],
          ],
          "#344b48",
          "#c2c1a1",
          0.7,
        );
        c.restore();
      }
    }
  }
  water(time, map) {
    const c = this.c,
      g = c.createLinearGradient(0, SEA, 0, H);
    g.addColorStop(0, map === "sunset" ? "#7798aa" : "#568eac");
    g.addColorStop(1, "#2b597c");
    c.fillStyle = g;
    c.fillRect(0, SEA, W, H - SEA);
    c.fillStyle = "#b7e9ecaa";
    c.fillRect(0, SEA, W, 2);
    for (let i = 0; i < 34; i++) {
      const x = (i * 87 + time * (i % 2 ? 5 : -5) + W) % W,
        y = SEA + 8 + (i % 4) * 10;
      line(
        c,
        [
          [x, y],
          [x + 15 + (i % 3) * 9, y],
        ],
        "#caedf04a",
        1,
      );
    }
  }
  preview(b, selection) {
    if (!this.prefs.guide || b.phase !== "aim") return;
    const c = this.c,
      m = roster[selection.species].moves[selection.move],
      trace = traceShot(b, m, selection.angle, selection.power),
      p = b.players[b.active];
    c.save();
    c.globalAlpha = 0.8;
    if (["lob", "phase"].includes(m.kind)) {
      for (let i = 1; i < trace.points.length; i += 2) {
        const q = trace.points[i];
        if (q.y > 18)
          oval(
            c,
            q.x,
            q.y,
            i % 4 === 1 ? 2.1 : 1.4,
            i % 4 === 1 ? 2.1 : 1.4,
            "#f9ffdf",
          );
      }
    } else if (m.kind === "slam") {
      c.setLineDash([4, 9]);
      const start = { x: p.x, y: p.y - 20 };
      c.beginPath();
      c.moveTo(start.x, start.y);
      c.quadraticCurveTo(
        (start.x + trace.x) / 2,
        Math.min(start.y, trace.y) - 180,
        trace.x,
        trace.y,
      );
      c.strokeStyle = "#effed2";
      c.lineWidth = 1.5;
      c.stroke();
      c.setLineDash([]);
    } else if (m.kind !== "wall") {
      const [a, e] = trace.points;
      c.setLineDash([5, 8]);
      line(
        c,
        [
          [a.x, a.y],
          [e.x, e.y],
        ],
        "#f1ffda",
        1.5,
      );
      c.setLineDash([]);
      if (m.kind === "cone") {
        const a2 = Math.atan2(e.y - a.y, e.x - a.x),
          r = m.radius + 7;
        line(
          c,
          [
            [e.x - Math.sin(a2) * r, e.y + Math.cos(a2) * r],
            [a.x, a.y],
            [e.x + Math.sin(a2) * r, e.y - Math.cos(a2) * r],
          ],
          "#f1ffda66",
          1,
        );
      }
    }
    const ex = clamp(trace.x, 10, W - 10),
      ey = clamp(trace.y, 18, SEA - 4),
      color = trace.y >= SEA ? "#ffb09a" : "#f4ffcf";
    c.strokeStyle = color;
    c.lineWidth = 1.2;
    c.setLineDash([4, 5]);
    c.beginPath();
    c.ellipse(
      ex,
      ey,
      Math.max(10, m.radius),
      Math.max(7, m.radius * 0.45),
      0,
      0,
      Math.PI * 2,
    );
    c.stroke();
    c.setLineDash([]);
    line(
      c,
      [
        [ex - 7, ey],
        [ex + 7, ey],
      ],
      color,
      1.5,
    );
    line(
      c,
      [
        [ex, ey - 7],
        [ex, ey + 7],
      ],
      color,
      1.5,
    );
    if (m.kind === "wall") {
      c.strokeStyle = "#e9f8bf99";
      c.strokeRect(ex - 24, ey - 100, 48, 100);
    }
    c.restore();
  }
  summon(b) {
    const s = b.summon;
    if (!s || ["aim", "handoff", "over"].includes(b.phase)) return;
    const c = this.c,
      p = b.players[s.owner],
      dir = Math.cos((s.angle * Math.PI) / 180) >= 0 ? 1 : -1;
    let x = s.x,
      y = s.y,
      scale = 0.86,
      action = "idle",
      progress = 0;
    if (b.phase === "summon") {
      const t = b.phaseTime;
      if (t < 0.36) {
        const q = t / 0.36;
        ball(
          c,
          p.x + (s.x - p.x) * q,
          p.y - 22 - Math.sin(q * Math.PI) * 50,
          0.9,
          q * 6,
        );
        return;
      }
      if (t < 0.55) {
        const q = (t - 0.36) / 0.19;
        ball(c, s.x, s.y - 24, 0.8, 0, q);
        oval(c, s.x, s.y - 25, 26 * q, 35 * q, "#f4ffdc55");
      }
      scale *= clamp((t - 0.43) / 0.26, 0, 1);
      action = t > 0.75 ? "attack" : "idle";
      progress = (t - 0.75) / 0.4;
      c.save();
      c.globalAlpha = 0.35;
      c.strokeStyle = s.species.color;
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(s.x, s.y + 3, 40, 10, 0, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }
    if (b.phase === "attack" || b.phase === "flight") {
      action = "attack";
      progress =
        b.phase === "attack"
          ? b.attack.progress
          : Math.min(1, b.phaseTime / 0.7);
    }
    if (b.phase === "attack" && b.currentMove.kind === "slam") {
      const q = b.attack.progress;
      x = s.x + (b.attack.x - s.x) * q;
      y = s.y + (b.attack.y - s.y) * q - Math.sin(q * Math.PI) * 210;
      scale *= 1 + Math.sin(q * Math.PI) * 0.12;
    }
    if (b.phase === "attack" && b.currentMove.kind === "dig") {
      const a = b.attack;
      x = a.origin.x + (a.x - a.origin.x) * a.progress;
      y = a.origin.y + 20;
      scale *= 0.65;
    }
    if (b.phase === "recall") {
      const q = clamp(1 - b.phaseTime / 0.45, 0, 1);
      scale *= q;
      x = p.x + (s.x - p.x) * q;
      y = p.y + (s.y - p.y) * q;
      line(
        c,
        [
          [p.x + dir * 14, p.y - 10],
          [x, y - 35 * q],
        ],
        "#ffb9c2aa",
        3,
      );
      ball(c, p.x + dir * 14, p.y - 10, 0.6);
    }
    creature(c, s.species.id, x, y, scale, dir, b.clock, action, progress);
    if (b.phase === "summon" && b.phaseTime > 0.5) {
      c.save();
      c.globalAlpha = 0.65 * (1 - clamp((b.phaseTime - 0.5) / 0.45, 0, 1));
      oval(c, x, y - 40, 30, 42, "#fffde7");
      c.restore();
    }
  }
  beam(b) {
    if (!b.attack || !["attack", "settle"].includes(b.phase)) return;
    if (b.phase === "settle" && b.phaseTime > 0.2) return;
    const a = b.attack,
      m = b.currentMove,
      c = this.c;
    if (["wall", "slam"].includes(m.kind)) return;
    const start = a.origin,
      end = {
        x: start.x + (a.x - start.x) * a.progress,
        y: start.y + (a.y - start.y) * a.progress,
      };
    const dx = end.x - start.x,
      dy = end.y - start.y,
      length = Math.hypot(dx, dy),
      nx = -dy / (length || 1),
      ny = dx / (length || 1);
    c.save();
    if (b.phase === "settle") c.globalAlpha = 1 - b.phaseTime / 0.2;
    if (m.kind === "cone") {
      const r = 7 + m.radius * a.progress;
      shape(
        c,
        [
          [start.x, start.y],
          [end.x + nx * r, end.y + ny * r],
          [end.x - nx * r, end.y - ny * r],
        ],
        "#ff9a3755",
        null,
      );
      for (let i = 0; i < 25; i++) {
        const q = (i / 25 + b.clock * 1.5) % 1,
          spread = Math.sin(i * 17) * r * q;
        oval(
          c,
          start.x + dx * q + nx * spread,
          start.y + dy * q + ny * spread,
          4 + q * 9,
          3 + q * 7,
          i % 3 ? "#ffaf45aa" : "#ffe998cc",
        );
      }
    } else if (m.kind === "bolt") {
      const pts = [[start.x, start.y]];
      for (let t = 14; t < length; t += 18) {
        const jitter = Math.sin(t * 1.3 + Math.floor(b.clock * 20)) * 9;
        pts.push([
          start.x + (dx * t) / length + nx * jitter,
          start.y + (dy * t) / length + ny * jitter,
        ]);
      }
      pts.push([end.x, end.y]);
      line(c, pts, "#ffe97b55", 16);
      line(c, pts, "#ffe86b", 5);
      line(c, pts, "#ffffe9", 2);
    } else if (m.kind === "dig") {
      for (let i = 0; i < 10; i++)
        oval(
          c,
          end.x + Math.sin(i * 17) * 23,
          end.y + Math.cos(i * 7) * 18,
          5,
          4,
          "#c8ad7bbb",
        );
      line(
        c,
        [
          [start.x, start.y],
          [end.x, end.y],
        ],
        "#c9a97233",
        18,
      );
    } else {
      line(
        c,
        [
          [start.x, start.y],
          [end.x, end.y],
        ],
        m.kind === "ghost" ? "#b48bfa33" : "#81e6ff44",
        m.radius * 2.5,
      );
      line(
        c,
        [
          [start.x, start.y],
          [end.x, end.y],
        ],
        m.color,
        m.kind === "ghost" ? 5 : 10,
      );
      line(
        c,
        [
          [start.x, start.y],
          [end.x, end.y],
        ],
        "#f0ffffcc",
        3,
      );
      for (let i = 0; i < 12; i++) {
        const q = (i / 12 + b.clock * 1.3) % 1,
          wave =
            Math.sin(q * 30 + b.clock * 15) * (m.kind === "ghost" ? 12 : 6);
        oval(
          c,
          start.x + dx * q + nx * wave,
          start.y + dy * q + ny * wave,
          5,
          3,
          m.color,
        );
      }
    }
    c.restore();
  }
  projectile(b) {
    const p = b.projectile;
    if (!p) return;
    const c = this.c,
      m = b.currentMove;
    this.trail.push({ x: p.x, y: p.y, life: 0.27 });
    for (const t of this.trail) {
      c.globalAlpha = t.life * 1.8;
      oval(c, t.x, t.y, 5 * t.life + 2, 5 * t.life + 2, m.color);
    }
    c.globalAlpha = 1;
    const x = clamp(p.x, 8, W - 8),
      y = Math.max((14 - this.view.y) / this.view.zoom, p.y);
    if (p.y < (8 - this.view.y) / this.view.zoom) {
      shape(
        c,
        [
          [x - 6, y + 3],
          [x, y - 7],
          [x + 6, y + 3],
        ],
        m.color,
        "#253649",
        1,
      );
      return;
    }
    c.save();
    c.translate(x, y);
    c.rotate(p.age * 5);
    if (m.id === "boulder") {
      shape(
        c,
        [
          [-14, -7],
          [-7, -16],
          [8, -14],
          [17, -1],
          [10, 12],
          [-5, 15],
          [-16, 5],
        ],
        "#b7a180",
        "#45505a",
        3,
      );
      line(
        c,
        [
          [-9, -6],
          [0, -1],
          [8, -11],
        ],
        "#766e60",
        2,
      );
      line(
        c,
        [
          [0, -1],
          [4, 10],
        ],
        "#766e60",
        2,
      );
    } else if (m.effect === "wet") {
      oval(c, 0, 0, 12, 12, "#7cdeef", "#e2ffff", 2);
      oval(c, -4, -4, 4, 3, "#e8ffff");
    } else if (m.effect === "electric") {
      oval(c, 0, 0, 10, 10, "#ffe761", "#fff9d5", 2);
      for (let i = 0; i < 5; i++) {
        c.rotate((Math.PI * 2) / 5);
        line(
          c,
          [
            [8, -1],
            [18, -5],
            [14, 2],
          ],
          "#fff3ac",
          2,
        );
      }
    } else if (m.effect === "curse") {
      oval(c, 0, 0, 15, 15, "#a175dd44");
      oval(c, 0, 0, 10, 10, "#624a96", "#d5b7ff", 2);
      line(
        c,
        [
          [-8, 0],
          [-2, -8],
          [8, 0],
          [1, 7],
        ],
        "#c5a0f7",
        2,
      );
    } else {
      oval(c, 0, 0, 13, 13, "#ff8b37aa");
      oval(c, 0, 0, 9, 9, "#ffd25d");
      oval(c, -2, -1, 4, 4, "#fff8c3");
    }
    c.restore();
  }
  worldPoint(x, y) {
    const v = this.view || { x: 0, y: 0, zoom: 1 };
    return { x: (x - v.x) / v.zoom, y: (y - v.y) / v.zoom };
  }
  fitCamera(b, selection, human) {
    const width = this.canvas.parentElement.clientWidth;
    const desired =
      innerWidth <= 800
        ? H
        : clamp(
            Math.round(
              ((innerHeight - (document.fullscreenElement ? 400 : 475)) /
                width) *
                W,
            ),
            260,
            H,
          );
    if (this.canvas.height !== desired) this.canvas.height = desired;
    let top = Math.min(
      ...b.players.filter((p) => p.hp > 0).map((p) => p.y - 160),
      350,
    );
    if (human && b.phase === "aim" && this.prefs.guide) {
      const m = roster[selection.species].moves[selection.move];
      const trace = traceShot(b, m, selection.angle, selection.power);
      top = Math.min(top, ...trace.points.map((p) => p.y - 25));
    }
    top = Math.max(0, top);
    const zoom = clamp((desired - 20) / (SEA + 35 - top), 0.55, 1);
    const target = {
      x: (W - W * zoom) / 2,
      y: desired - (SEA + 35) * zoom,
      zoom,
    };
    if (
      b.projectile &&
      !this.prefs.reduced &&
      b.projectile.y * zoom + target.y < 45
    )
      target.y = 45 - b.projectile.y * zoom;
    if (!this.view || this.prefs.reduced) this.view = target;
    else
      for (const key of ["x", "y", "zoom"])
        this.view[key] += (target[key] - this.view[key]) * 0.14;
  }
  draw(b, selection, human = true) {
    const c = this.c;
    if (this.map !== b.options.map) {
      this.map = b.options.map;
      background(this.bc, this.map);
    }
    this.fitCamera(b, selection, human);
    const config = maps.find((m) => m.id === this.map),
      v = this.view;
    const sky = c.createLinearGradient(0, 0, 0, this.canvas.height);
    sky.addColorStop(0, config.sky[0]);
    sky.addColorStop(1, config.sky[1]);
    c.fillStyle = sky;
    c.fillRect(0, 0, W, this.canvas.height);
    // Extend edge columns of the landscape into the camera margins seamlessly.
    if (v.x > 0) {
      c.drawImage(this.bg, 0, 0, 1, H, 0, v.y, v.x + 1, H * v.zoom);
      c.drawImage(
        this.bg,
        W - 1,
        0,
        1,
        H,
        W - v.x - 1,
        v.y,
        v.x + 1,
        H * v.zoom,
      );
    }
    c.fillStyle = "#477c9a";
    c.fillRect(0, SEA * v.zoom + v.y, W, this.canvas.height);
    c.save();
    c.translate(v.x, v.y);
    c.scale(v.zoom, v.zoom);
    if (this.shake > 0.2 && !this.prefs.reduced)
      c.translate(
        Math.sin(b.clock * 97) * this.shake,
        Math.cos(b.clock * 83) * this.shake * 0.5,
      );
    c.drawImage(this.bg, 0, 0);
    this.cacheTerrain(b);
    c.drawImage(this.land, 0, 0);
    // Water is drawn over the terrain at the shoreline and is always a visible hazard.
    this.water(b.clock, this.map);
    if (human) this.preview(b, selection);
    for (let i = 0; i < 2; i++) {
      const p = b.players[i];
      if (p.hp <= 0) continue;
      trainer(c, p, i, b.clock, b.phase, b.phaseTime, i === b.active);
      const labelY = p.y - 65;
      c.font = "bold 10px system-ui";
      c.textAlign = "center";
      c.fillStyle = "#163144bb";
      c.fillRect(p.x - 28, labelY - 11, 56, 17);
      c.fillStyle = i ? "#a3e1ff" : "#ffd0a1";
      c.fillText(p.name, p.x, labelY + 1);
      if (b.phase === "aim" && i === b.active)
        shape(
          c,
          [
            [p.x - 4, labelY - 20],
            [p.x + 4, labelY - 20],
            [p.x, labelY - 15],
          ],
          "#e4f9aa",
          null,
        );
      if (p.wet) {
        oval(c, p.x - 19, p.y - 20, 3, 5, "#84e7ff");
      }
      if (p.burn) {
        shape(
          c,
          [
            [p.x + 18, p.y - 10],
            [p.x + 13, p.y - 18],
            [p.x + 19, p.y - 28],
            [p.x + 24, p.y - 15],
          ],
          "#ffb155",
          null,
        );
      }
    }
    this.summon(b);
    this.beam(b);
    this.projectile(b);
    for (const p of this.particles) {
      c.globalAlpha = clamp(p.life / 0.5, 0, 1);
      c.fillStyle = p.color;
      c.fillRect(p.x, p.y, p.size, p.size);
    }
    c.globalAlpha = 1;
    for (const e of this.effects) {
      const q = 1 - e.life / e.max;
      c.save();
      c.globalAlpha = Math.min(1, e.life * 3);
      if (e.type === "damage" || e.type === "combo") {
        c.font =
          e.type === "combo" ? "bold 12px system-ui" : "900 26px system-ui";
        c.textAlign = "center";
        c.lineWidth = 4;
        c.strokeStyle = "#183346";
        const text = e.type === "combo" ? e.text : `−${e.damage}`;
        c.strokeText(text, e.x, e.y - 25 - q * 35);
        c.fillStyle = e.type === "combo" ? "#fff4a8" : "#fff5d6";
        c.fillText(text, e.x, e.y - 25 - q * 35);
      } else {
        const r = (e.radius || 35) * (0.4 + q * 1.1);
        oval(
          c,
          e.x,
          e.y,
          r,
          r * (e.type === "splash" ? 0.35 : 1),
          `${e.color || "#eaffd4"}22`,
        );
        c.strokeStyle = e.color || "#fff7d4";
        c.lineWidth = (1 - q) * 5;
        c.beginPath();
        c.arc(e.x, e.y, r, 0, Math.PI * 2);
        c.stroke();
        if (q < 0.3) oval(c, e.x, e.y, r * 0.5, r * 0.5, "#fff9db99");
      }
      c.restore();
    }
    c.restore();
  }
}
