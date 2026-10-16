import { W, H, SEA, traceShot } from "./simulation.js";
import { roster, maps, BALLISTIC, REMOTE } from "./content.js";
import { oval, shape, line, ball, creature, trainer } from "./art.js";
import { drawProjectile, drawMoveImpact, drawBeam } from "./effects.js";
import { Terrain, originFor, angleVector } from "./simulation.js";
import {
  drawHazards,
  drawWaterStream,
  drawSignature,
  drawMaterialImpact,
  drawConduction,
  drawFlightTexture,
  drawCharge,
} from "./materials-art.js";

const movesByVisual = new Map(
  roster.flatMap((s) => s.moves.map((m) => [m.visual, m])),
);
const materialImpacts = new Set([
  "flame",
  "stream",
  "water",
  "lava",
  "ember",
  "bounce",
  "seeds",
  "burrow",
  "slam",
]);

function ringAura(c, x, y, r, color, t) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = 1.5;
  c.beginPath();
  c.arc(x, y, r + (t % 1) * 3, t * 3, t * 3 + Math.PI * 1.3);
  c.stroke();
  c.restore();
}
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
export function drawMapThumbnail(c, id, seed = 42, profile, relief = "normal") {
  const t = new Terrain(seed, id, profile, relief),
    config = maps.find((m) => m.id === id);
  c.clearRect(0, 0, c.canvas.width, c.canvas.height);
  c.save();
  c.scale(c.canvas.width / W, c.canvas.height / H);
  background(c, id);
  for (const [left, right] of t.profile === "islands"
    ? [
        [28, 585],
        [696, W - 28],
      ]
    : [[28, W - 28]]) {
    const edge = [];
    for (let x = left; x <= right; x += 2) edge.push([x, t.surface(x)]);
    shape(
      c,
      [[left, SEA + 12], ...edge, [right, SEA + 12]],
      `rgb(${config.soil})`,
      null,
    );
    line(c, edge, `rgb(${config.grass})`, 6);
  }
  c.fillStyle = "#548ba5";
  c.fillRect(0, SEA, W, H - SEA);
  for (const [i, x] of [260, 1020].entries()) {
    const y = t.top(x);
    c.fillStyle = i ? "#9ee3ff" : "#ffbb8a";
    c.fillRect(x - 7, y - 30, 14, 25);
    c.fillStyle = "#20344b";
    c.fillRect(x - 18, y - 49, 36, 17);
    c.fillStyle = "#fff5de";
    c.font = "bold 14px system-ui";
    c.textAlign = "center";
    c.fillText(String(i + 1), x, y - 36);
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
    if (["damage", "combo", "conduction"].includes(e.type))
      this.effects.push({ ...e, life: 1.35, max: 1.35 });
    if (
      ["impact", "splash", "wall", "summon", "arrival", "burst"].includes(
        e.type,
      )
    ) {
      this.effects.push({
        ...e,
        visual: e.type === "arrival" ? null : e.visual,
        radius: e.type === "arrival" ? 30 : e.radius || 36,
        life: e.visual ? 1.2 : 0.7,
        max: e.visual ? 1.2 : 0.7,
      });
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
        const nx = Math.floor(x / 3),
          ny = Math.floor(y / 3);
        const noise = ((nx * 73 + ny * 137 + ((nx * ny) % 29)) % 17) - 8;
        const base =
          cells[y * W + x] === 2
            ? [137, 215, 229]
            : exposed
              ? config.grass
              : config.soil;
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
    if (b.phase !== "aim") return;
    const c0 = this.c,
      p = b.players[b.active],
      move = roster[selection.species].moves[selection.move];
    const o = originFor(p, selection.angle, move),
      v = angleVector(selection.angle),
      len = 40 + selection.power * 0.38;
    c0.save();
    if (this.prefs.history !== false && b.lastShots[b.active]) {
      const last = b.lastShots[b.active],
        pts = last.trace;
      c0.globalAlpha = 0.34;
      c0.setLineDash([3, 7]);
      line(
        c0,
        pts.map((p) => [p.x, p.y]),
        "#f0dfac",
        1.5,
      );
      c0.setLineDash([]);
      const end = pts.at(-1);
      c0.fillStyle = "#fff0b5";
      c0.font = "9px system-ui";
      c0.textAlign = "center";
      c0.fillText(
        `LAST ${Math.round(last.angle <= 90 ? last.angle : 180 - last.angle)}° / ${Math.round(last.power)}%`,
        Math.max(100, Math.min(W - 100, end.x)),
        Math.max(25, Math.min(SEA - 18, end.y - 16)),
      );
    }
    c0.globalAlpha = 1;
    line(
      c0,
      [
        [o.x - v.x * 8, o.y - v.y * 8],
        [o.x + v.x * len, o.y + v.y * len],
      ],
      "#183044",
      7,
    );
    line(
      c0,
      [
        [o.x - v.x * 8, o.y - v.y * 8],
        [o.x + v.x * len, o.y + v.y * len],
      ],
      "#fff3b0",
      3,
    );
    const ex = o.x + v.x * len,
      ey = o.y + v.y * len;
    shape(
      c0,
      [
        [ex, ey],
        [ex - v.x * 13 - v.y * 6, ey - v.y * 13 + v.x * 6],
        [ex - v.x * 13 + v.y * 6, ey - v.y * 13 - v.x * 6],
      ],
      "#fff3b0",
      "#183044",
      1,
    );
    const lx = Math.max(60, Math.min(W - 60, o.x + v.x * 45)),
      ly = Math.max(24, o.y - 35);
    c0.fillStyle = "#172c40e6";
    c0.fillRect(lx - 45, ly - 11, 90, 17);
    c0.fillStyle = "#fff4c4";
    c0.font = "bold 10px system-ui";
    c0.textAlign = "center";
    c0.fillText(
      `${Math.round(selection.facing === 1 ? selection.angle : 180 - selection.angle)}° · ${move.kind === "beam" ? "BEAM" : Math.round(selection.power) + "%"}`,
      lx,
      ly + 1,
    );
    c0.restore();
    if (!this.prefs.guide) return;
    const c = this.c,
      m = roster[selection.species].moves[selection.move],
      trace = traceShot(b, m, selection.angle, selection.power);
    c.save();
    c.globalAlpha = 0.8;
    if (BALLISTIC.has(m.kind)) {
      const guideLength =
        this.prefs.guideLength === "short"
          ? Math.min(10, trace.points.length)
          : trace.points.length;
      for (let i = 1; i < guideLength; i += 2) {
        const p = trace.points[i];
        oval(
          c,
          p.x,
          p.y,
          i % 4 === 1 ? 2 : 1.3,
          i % 4 === 1 ? 2 : 1.3,
          "#fff9d6",
        );
      }
      if (m.kind === "salvo")
        for (const sign of [-1, 1]) {
          const side = traceShot(
            b,
            m,
            selection.angle + ((sign * (m.count - 1)) / 2) * m.spread,
            selection.power,
          );
          c.globalAlpha = 0.28;
          for (let i = 1; i < side.points.length; i += 4) {
            const p = side.points[i];
            oval(c, p.x, p.y, 1.4, 1.4, m.color);
          }
          c.globalAlpha = 0.8;
        }
    } else {
      const [a, z] = trace.points;
      c.setLineDash([5, 8]);
      line(
        c,
        [
          [a.x, a.y],
          [z.x, z.y],
        ],
        "#fffce2",
        1.6,
      );
      c.setLineDash([]);
    }
    if (this.prefs.guideLength === "short") {
      c.restore();
      return;
    }
    const x = clamp(trace.x, 8, W - 8),
      y = clamp(trace.y, 18, SEA - 3),
      col =
        trace.y >= SEA ||
        Math.hypot(
          trace.x - b.players[b.active].x,
          trace.y - b.players[b.active].y,
        ) <
          m.radius + 32
          ? "#ffb496"
          : m.color;
    c.strokeStyle = col;
    c.lineWidth = 1.4;
    c.setLineDash([4, 5]);
    const offsets = m.kind === "cluster" ? [-38, 0, 38] : [0];
    for (const dx of offsets) {
      c.beginPath();
      c.ellipse(
        x + dx,
        y,
        Math.max(12, m.radius),
        Math.max(8, m.radius * 0.3),
        0,
        0,
        Math.PI * 2,
      );
      c.stroke();
    }
    c.setLineDash([]);
    line(
      c,
      [
        [x - 8, y],
        [x + 8, y],
      ],
      "#fffbdc",
      1.5,
    );
    line(
      c,
      [
        [x, y - 8],
        [x, y + 8],
      ],
      "#fffbdc",
      1.5,
    );
    if (REMOTE.has(m.kind)) {
      c.font = "bold 9px system-ui";
      c.textAlign = "center";
      c.fillStyle = "#fffde6";
      c.fillText("SUMMON HERE", x, y - 15);
    }
    c.restore();
  }
  summon(b) {
    const s = b.summon;
    if (!s || ["aim", "handoff", "over"].includes(b.phase)) return;
    const c = this.c,
      p = b.players[s.owner],
      m = b.currentMove,
      dir = p.facing;
    let x = s.x,
      y = s.y,
      scale = 0.92,
      action = "idle",
      progress = 0;
    if (s.remote && ["summon", "flight"].includes(b.phase)) {
      if (b.phase === "summon")
        ball(
          c,
          p.x + dir * 18,
          p.y - 16 - Math.sin(b.phaseTime * 7) * 8,
          1.1,
          b.phaseTime * 5,
        );
      return;
    }
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
        oval(c, s.x, s.y - 30, 30 * q, 40 * q, "#f4ffdf55");
      }
      scale *= clamp((t - 0.43) / 0.26, 0, 1);
      action = t > 0.73 ? "attack" : "idle";
      progress = (t - 0.73) / 0.3;
    }
    if (b.phase === "attack" || b.phase === "flight") {
      action = "attack";
      progress =
        b.phase === "attack"
          ? b.attack.progress
          : Math.min(1, b.phaseTime / 0.8);
    }
    if (b.phase === "attack" && b.attack.remote) {
      const q = b.attack.progress;
      scale *= clamp(q / 0.2, 0, 1);
      if (q < 0.22) {
        ball(c, s.x, s.y - 25, 0.8, 0, q / 0.22);
        oval(
          c,
          s.x,
          s.y - 40,
          25 * (1 - q / 0.22),
          35 * (1 - q / 0.22),
          "#fff5dd88",
        );
      }
      x -= dir * (m.behavior === "flame" ? 70 : 35);
      if (m.id === "body-slam") {
        x = s.x;
        y -= Math.max(0, 1 - q / 0.58) * 150;
        scale *= 1 + Math.sin(q * Math.PI) * 0.15;
      }
      if (
        ["dynamic-punch", "crunch", "x-scissor", "dragon-rush"].includes(m.id)
      ) {
        x =
          s.x -
          dir * Math.max(0, 1 - q / 0.58) * (m.id === "dragon-rush" ? 190 : 95);
        y -= Math.max(0, 1 - q / 0.58) * (m.id === "dragon-rush" ? 150 : 35);
      }
      if (["psychic", "hurricane", "psyshock"].includes(m.id))
        y -= Math.sin(q * Math.PI) * 25;
      if (m.id === "dig") {
        scale *= 0.85;
        if (q > 0.22 && q < 0.56) {
          scale *= 0.35;
          x = b.attack.burrowX || x;
          y += 65;
        } else if (q >= 0.56) {
          x = s.x;
          y -= Math.sin(Math.min(1, (q - 0.56) / 0.3) * Math.PI) * 45;
        }
      }
      if (q > 0.2 && q < 0.58) {
        c.save();
        c.globalAlpha = 0.25;
        oval(c, x, y - 55, 16 + q * 12, 16 + q * 12, m.color);
        c.restore();
      }
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
          [x, y - 40 * q],
        ],
        "#ffb9c2aa",
        3,
      );
      ball(c, p.x + dir * 14, p.y - 10, 0.65);
    }
    oval(c, x, y + 2, 37 * scale, 7 * scale, "#142d3e33");
    creature(
      c,
      s.species.id,
      x,
      y,
      scale,
      dir,
      this.prefs.reduced ? 0 : b.clock,
      action,
      progress,
      m.visual,
    );
    if (b.phase === "summon" && b.phaseTime > 0.5) {
      c.save();
      c.globalAlpha = 0.4 * (1 - clamp((b.phaseTime - 0.5) / 0.45, 0, 1));
      oval(c, x, y - 45, 35, 48, "#fffde7");
      c.restore();
    }
  }
  beam(b) {
    if (!b.attack || b.attack.remote || !["attack", "settle"].includes(b.phase))
      return;
    if (b.phase === "settle" && b.phaseTime > 0.18) return;
    const a = b.attack,
      c = this.c;
    c.save();
    if (b.phase === "settle") c.globalAlpha = 1 - b.phaseTime / 0.18;
    const end = {
      x: a.origin.x + (a.x - a.origin.x) * a.progress,
      y: a.origin.y + (a.y - a.origin.y) * a.progress,
    };
    drawBeam(c, b.currentMove, a.origin, end, b.clock, a.progress);
    c.restore();
  }
  projectile(b) {
    if (!b.projectiles.length) return;
    const c = this.c,
      m = b.currentMove;
    for (const p of b.projectiles) {
      if (p.delay > 0) continue;
      this.trail.push({ x: p.x, y: p.y, life: 0.25 });
      const top = (12 - this.view.y) / this.view.zoom;
      if (p.y < top) {
        shape(
          c,
          [
            [p.x - 5, top + 6],
            [p.x, top - 3],
            [p.x + 5, top + 6],
          ],
          m.color,
          null,
        );
        continue;
      }
      if (REMOTE.has(m.kind)) {
        ball(c, p.x, p.y, 1.05, p.age * 8);
        ringAura(c, p.x, p.y, 12, m.color, p.age);
      } else {
        if (m.behavior === "stream") drawWaterStream(c, p, b.clock);
        const shown = p.move || m;
        drawFlightTexture(c, shown, p, b.clock);
        drawProjectile(c, shown, p.x, p.y, p.age, Math.atan2(p.vy, p.vx));
      }
    }
    for (const p of this.trail) {
      c.globalAlpha = p.life * 1.3;
      oval(c, p.x, p.y, 3, 3, m.color);
    }
    c.globalAlpha = 1;
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
    const highest = Math.min(...b.terrain.heights);
    const top = Math.max(
      0,
      Math.min(
        highest - 145,
        ...b.players.filter((p) => p.hp > 0).map((p) => p.y - 155),
      ),
    );
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
    drawHazards(c, b, this.prefs.reduced);
    if (human) this.preview(b, selection);
    for (let i = 0; i < 2; i++) {
      const p = b.players[i];
      if (p.hp <= 0) continue;
      trainer(c, p, i, b.clock, b.phase, b.phaseTime, i === b.active);
      const labelY = p.y - 72;
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
    drawCharge(c, b);
    this.beam(b);
    drawSignature(c, b, this.prefs.reduced);
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
      if (e.type === "conduction") drawConduction(c, e, q);
      else if (e.type === "damage" || e.type === "combo") {
        c.font =
          e.type === "combo" ? "bold 12px system-ui" : "900 26px system-ui";
        c.textAlign = "center";
        c.lineWidth = 4;
        c.strokeStyle = "#183346";
        const text = e.type === "combo" ? e.text : `−${e.damage}`;
        c.strokeText(text, e.x, e.y - 25 - q * 35);
        c.fillStyle = e.type === "combo" ? "#fff4a8" : "#fff5d6";
        c.fillText(text, e.x, e.y - 25 - q * 35);
      } else if (e.visual) {
        const m = movesByVisual.get(e.visual);
        if (
          e.fragment &&
          m &&
          ["seeds", "lava", "meteors"].includes(m.behavior)
        ) {
          drawMaterialImpact(
            c,
            m.behavior === "meteors" ? { ...m, behavior: "bounce" } : m,
            e.x,
            e.y,
            e.radius,
            q,
          );
        } else if (e.fragment) {
          drawProjectile(
            c,
            { id: e.kind, visual: e.visual, color: e.color },
            e.x,
            e.y,
            q * 2,
          );
          ringAura(c, e.x, e.y, e.radius * q, e.color, q);
        } else {
          if (!materialImpacts.has(m?.behavior))
            drawMoveImpact(
              c,
              e.visual,
              e.x,
              e.y,
              e.radius,
              q,
              1,
              e.facing || 1,
            );
          if (m) drawMaterialImpact(c, m, e.x, e.y, e.radius, q);
        }
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
