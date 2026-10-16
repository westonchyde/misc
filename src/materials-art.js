import { SEA } from "./world.js";
// Layered, textured material effects. Presentation never changes combat state.
import { line, shape } from "./art.js";
const snap = (v) => Math.round(v / 2) * 2;
const rect = (c, x, y, w, h, col) => {
  c.fillStyle = col;
  c.fillRect(snap(x), snap(y), Math.max(2, snap(w)), Math.max(2, snap(h)));
};
function flame(c, x, y, height, time, seed = 0) {
  const sway = Math.sin(time * 12 + seed) * 5;
  for (const [scale, col, width] of [
    [1, "#743345", 12],
    [0.87, "#d54b32", 11],
    [0.65, "#ff913c", 8],
    [0.38, "#ffdb76", 5],
    [0.17, "#fff5c3", 3],
  ]) {
    const h = height * scale,
      w = (width * height) / 30;
    shape(
      c,
      [
        [snap(x - w), snap(y)],
        [snap(x - w * 0.7), snap(y - h * 0.4)],
        [snap(x - w * 0.8 + sway), snap(y - h * 0.7)],
        [snap(x + sway), snap(y - h)],
        [snap(x + w * 0.3 + sway), snap(y - h * 0.5)],
        [snap(x + w), snap(y - h * 0.25)],
        [snap(x + w * 0.7), snap(y)],
      ],
      col,
      null,
    );
  }
  for (let i = 0; i < 3; i++) {
    const q = (time * 0.75 + i * 0.3 + seed * 0.17) % 1;
    rect(
      c,
      x + Math.sin(seed + i * 3) * 15 + q * 4,
      y - height * q * 1.7,
      2 + (i % 2) * 2,
      2,
      "#ffd57a",
    );
  }
}
export function drawHazards(c, b, reduced = false) {
  const labelled = [];
  const time = reduced ? 0 : b.clock;
  for (const h of b.hazards) {
    const left = h.x - h.radius,
      right = h.x + h.radius;
    if (h.type === "water") {
      for (let x = left; x < right; x += 4) {
        const y = Math.min(SEA - 2, b.terrain.top(x, Math.max(0, h.y - 28)));
        if (Math.abs(y - h.y) > 25) continue;
        rect(c, x, y - 5, 4, 5, "#3587b5b0");
        rect(c, x, y - 5, 4, 2, "#a2e8eb");
        if (Math.floor(x / 4) % 3 === 0)
          rect(c, x + Math.sin(time * 2 + x) * 2, y - 3, 2, 2, "#e1ffff");
      }
    } else if (h.type === "poison") {
      for (let x = left; x < right; x += 6) {
        const y = b.terrain.top(x, Math.max(0, h.y - 28));
        if (Math.abs(y - h.y) > 25) continue;
        rect(c, x, y - 4, 6, 5, "#6f456d");
        rect(c, x, y - 5, 4, 2, "#bd84bc");
      }
      for (let i = 0; i < 4; i++) {
        const x = h.x + Math.sin(i * 3) * h.radius * 0.7,
          q = (time * 0.4 + i * 0.23) % 1;
        rect(c, x, h.y - 7 - q * 12, 4, 4, "#ce9cce88");
      }
    } else {
      for (let x = left; x < right; x += 8) {
        const y = b.terrain.top(x, Math.max(0, h.y - 28));
        if (Math.abs(y - h.y) > 28) continue;
        rect(c, x, y - 2, 8, 4, h.type === "lava" ? "#f18b3d" : "#583a39");
        flame(
          c,
          x + 4,
          y - 2,
          14 + 9 * Math.sin(x * 2 + time * 6) ** 2,
          time,
          x * 0.07,
        );
      }
    }
    if (
      labelled.some(
        (a) =>
          a.type === h.type &&
          Math.abs(a.x - h.x) < 70 &&
          Math.abs(a.y - h.y) < 40,
      )
    )
      continue;
    labelled.push(h);
    const turns = h.expires - b.turn;
    c.font = "bold 8px system-ui";
    c.textAlign = "center";
    c.fillStyle = "#172b3deb";
    c.fillRect(h.x - 19, h.y + 10, 38, 11);
    c.fillStyle =
      h.type === "water"
        ? "#a0e4fa"
        : h.type === "poison"
          ? "#e8b8f8"
          : "#ffcf8f";
    c.fillText(
      `${h.type === "water" ? "WET" : h.type === "poison" ? "TOXIC" : "FIRE"} ${turns}`,
      h.x,
      h.y + 18,
    );
  }
  for (const shelf of b.ice) {
    c.font = "bold 8px system-ui";
    c.textAlign = "center";
    c.fillStyle = "#173649e6";
    c.fillRect(shelf.x - 20, shelf.y + 10, 40, 11);
    c.fillStyle = "#c4f8ff";
    c.fillText(`ICE ${shelf.expires - b.turn}`, shelf.x, shelf.y + 18);
  }
}
export function drawWaterStream(c, p, time) {
  const points = [...(p.history || []), p];
  if (points.length < 2) return;
  c.save();
  c.lineJoin = "round";
  const coords = points.map((v) => [snap(v.x), snap(v.y)]);
  line(c, coords, "#285a8688", 20);
  line(c, coords, "#358dbbc0", 15);
  line(c, coords, "#78d8ed", 8);
  line(c, coords, "#d5fcf5", 3);
  for (let i = 0; i < points.length; i += 3) {
    const v = points[i];
    rect(
      c,
      v.x + Math.sin(time * 12 + i) * 9,
      v.y - 7,
      3,
      3,
      i % 2 ? "#eefdf7" : "#7dcee8",
    );
  }
  c.restore();
}
function lightning(c, x, y, ex, ey, time, width = 4) {
  const pts = [[x, y]],
    count = 12,
    dx = ex - x,
    dy = ey - y;
  for (let i = 1; i < count; i++) {
    const q = i / count,
      w = Math.sin(i * 4.1 + Math.floor(time * 18)) * 18;
    pts.push([snap(x + dx * q + w), snap(y + dy * q)]);
  }
  pts.push([ex, ey]);
  line(c, pts, "#d3a64399", width + 7);
  line(c, pts, "#ffdc63", width + 3);
  line(c, pts, "#fffad6", width);
}
export function drawConduction(c, e, t) {
  c.save();
  c.globalAlpha = 1 - t;
  lightning(c, e.x, e.y - 7, e.ex, e.ey - 7, t * 3, 2);
  c.restore();
}
export function drawSignature(c, b, reduced = false) {
  const time = reduced ? 0 : b.clock;
  const a = b.attack,
    m = b.currentMove;
  if (a?.rescue && b.phase === "attack") {
    for (let i = 0; i < 16; i++) {
      const x = b.players[b.active].x + Math.sin(i * 3) * 60,
        y =
          b.players[b.active].y + 18 - Math.abs(Math.sin(i + b.clock * 8)) * 18;
      rect(c, x, y, 3 + (i % 3), 3, i % 2 ? "#d3b27b" : "#8b6c52");
    }
    return;
  }
  if (!a?.remote || b.phase !== "attack") return;
  const q = a.progress,
    dir = b.players[b.active].facing,
    x = a.x,
    y = a.y;
  if (m.behavior === "flame" && q > 0.22 && q < 0.88) {
    const strength = Math.min(1, (q - 0.22) * 8, (0.88 - q) * 8),
      ox = x - dir * 31,
      oy = y - 69;
    for (let i = 0; i < 22; i++) {
      const u = i / 21,
        px = ox + dir * u * 133,
        py = oy + u * 65;
      flame(c, px, py, (12 + u * 43) * strength, time + i * 0.04, i * 0.7);
      if (i % 3 === 0) rect(c, px, py - 8, 6, 5, "#fff4b3");
    }
  }
  if (m.behavior === "lightning" && q > 0.32 && q < 0.78) {
    const cheekX = x - dir * 12,
      cheekY = y - 58;
    lightning(c, cheekX, cheekY, x - dir * 35, y - 125, time, 2);
    lightning(c, x - 30, Math.max(0, y - 370), x, y - 10, time, 5);
    lightning(c, x - 18, y - 190, x + 60, y - 56, time + 0.13, 2);
    lightning(c, x - 24, y - 255, x - 80, y - 100, time + 0.32, 2);
    if (!reduced && Math.floor(q * 35) % 3 === 0) {
      c.fillStyle = "#fff6ba22";
      c.fillRect(x - 100, y - 350, 200, 350);
    }
  }
  if (m.behavior === "burrow" && a.burrowX !== undefined && q < 0.64) {
    for (let i = 0; i < 12; i++) {
      const dx = (i - 6) * 7,
        xx = a.burrowX + dx,
        yy = b.terrain.top(xx, Math.max(0, a.y - 30));
      rect(
        c,
        xx,
        yy - 4 - Math.sin(q * 30 + i) * 5,
        6,
        4,
        i % 2 ? "#bfaa7a" : "#e2ca92",
      );
    }
  }
  if (m.behavior === "slam" && q > 0.5 && q < 0.8) {
    for (const sign of [-1, 1])
      for (let i = 0; i < 7; i++) {
        const r = (q - 0.5) * 300 + i * 5;
        line(
          c,
          [
            [x + sign * r, y],
            [x + sign * (r + 8), y - 5],
            [x + sign * (r + 16), y],
          ],
          i % 2 ? "#c7ad7d" : "#4b4244",
          3,
        );
      }
  }
}
export function drawMaterialImpact(c, m, x, y, r, t) {
  if (
    ![
      "flame",
      "stream",
      "water",
      "lava",
      "ember",
      "bounce",
      "seeds",
      "lightning",
      "slam",
      "burrow",
      "freeze",
    ].includes(m.behavior)
  )
    return;
  c.save();
  c.globalAlpha = Math.max(0, 1 - t);
  if (["flame", "lava", "ember"].includes(m.behavior)) {
    for (let i = 0; i < 12; i++)
      flame(
        c,
        x + (i - 5.5) * r * 0.15,
        y + Math.sin(i * 3) * 8,
        22 + (1 - t) * 35,
        t * 3,
        i,
      );
  } else if (["stream", "water", "freeze"].includes(m.behavior)) {
    for (let i = 0; i < 26; i++) {
      const a = i * 2.4,
        dist = r * (0.3 + t) * (0.5 + (i % 5) * 0.13),
        px = x + Math.cos(a) * dist,
        py = y - Math.abs(Math.sin(a)) * dist * (1 - t);
      rect(
        c,
        px,
        py,
        4 + (i % 3) * 2,
        5 + (i % 4) * 2,
        i % 3 ? "#86ddeb" : "#e4ffff",
      );
    }
    line(
      c,
      [
        [x - r * t, y],
        [x, y - 4],
        [x + r * t, y],
      ],
      "#daffff",
      4,
    );
  } else if (["bounce", "seeds", "burrow", "slam"].includes(m.behavior)) {
    for (let i = 0; i < 22; i++) {
      const a = i * 2.4,
        dist = r * (0.2 + t) * (0.6 + (i % 3) * 0.2);
      rect(
        c,
        x + Math.cos(a) * dist,
        y - Math.abs(Math.sin(a)) * dist + t * t * 20,
        3 + (i % 4) * 2,
        4 + (i % 3) * 2,
        m.behavior === "seeds"
          ? i % 2
            ? "#a7ce70"
            : "#e2e6a6"
          : i % 2
            ? "#d7c69c"
            : "#817761",
      );
    }
  }
  c.restore();
}
export function drawFlightTexture(c, m, p, time) {
  if (m.behavior === "stream") return;
  if (m.behavior === "hydro-rocket") {
    const points = (p.history || []).slice(-15);
    if (points.length > 1) {
      line(
        c,
        points.map((v) => [v.x, v.y]),
        "#2384bdbb",
        16,
      );
      line(
        c,
        points.map((v) => [v.x, v.y]),
        "#b6f4ed",
        6,
      );
    }
    return;
  }
  const path = p.history || [],
    burn = m.effect === "burn" || m.behavior === "meteor-fragment",
    ghost = m.kind === "phase",
    sludge = m.effect === "poison";
  c.save();
  for (let i = 0; i < path.length; i += 2) {
    const v = path[i],
      q = i / Math.max(1, path.length - 1);
    c.globalAlpha = q * 0.65;
    if (burn) {
      flame(c, v.x, v.y, 5 + q * 15, time + i * 0.08, i * 0.2);
    } else if (sludge) {
      rect(
        c,
        v.x + Math.sin(i * 2 + time * 4) * 5,
        v.y + Math.sin(i + time * 5) * 6,
        3 + q * 4,
        4 + q * 5,
        i % 3 ? "#9a5c9d" : "#d19cc9",
      );
    } else if (ghost) {
      rect(
        c,
        v.x + Math.sin(i * 0.7 - time * 7) * 12,
        v.y + Math.cos(i * 0.7 - time * 7) * 10,
        4 + q * 5,
        4 + q * 5,
        i % 2 ? "#8062bc" : "#baa1e5",
      );
    } else if (m.id === "dragon-rage") {
      rect(
        c,
        v.x,
        v.y + Math.sin(i * 0.5 - time * 10) * 9,
        5 + q * 6,
        3 + q * 4,
        i % 3 ? "#e4814a" : "#ffd18b",
      );
    } else if (m.behavior === "bounce") {
      if (i % 6 === 0) rect(c, v.x, v.y, 2, 2, "#b8aa84");
    } else if (m.effect === "electric") {
      if (i % 4 === 0)
        line(
          c,
          [
            [v.x - 4, v.y - 5],
            [v.x + 4, v.y],
            [v.x - 2, v.y + 6],
          ],
          "#fff4a5",
          2,
        );
    } else if (i % 4 === 0) {
      rect(c, v.x, v.y, 2 + q * 2, 2 + q * 2, m.color);
    }
  }
  c.restore();
}
export function drawCharge(c, b) {
  const s = b.summon,
    m = b.currentMove;
  if (!s || s.remote || b.phase !== "summon" || b.phaseTime < 0.55) return;
  const dir = b.players[s.owner].facing,
    x = b.players[s.owner].x + dir * (m.anchor?.[0] || 55),
    y = b.players[s.owner].y + (m.anchor?.[1] || -42),
    q = (b.phaseTime - 0.55) / 0.4;
  c.save();
  for (let i = 0; i < 12; i++) {
    const a = i * 2.4 + b.clock * 3,
      dist = (1 - q) * 38 + 7;
    rect(
      c,
      x + Math.cos(a) * dist,
      y + Math.sin(a) * dist,
      2 + (i % 2) * 2,
      2 + (i % 2) * 2,
      i % 3 ? m.color : "#fff3cc",
    );
  }
  if (m.kind === "beam") {
    c.globalAlpha = q * 0.8;
    rect(c, x - 5, y - 5, 10, 10, "#fff5d5");
  }
  c.restore();
}
