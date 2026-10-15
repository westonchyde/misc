import { oval, shape, line } from "./art.js";
import { roster } from "./content.js";
export const effectIds = roster.flatMap((s) => s.moves.map((m) => m.visual));
const colors = Object.fromEntries(
  roster.flatMap((s) => s.moves.map((m) => [m.id, m.color])),
);
const TAU = Math.PI * 2;
function star(c, x, y, r, color, points = 5, rotation = 0) {
  const p = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (i * Math.PI) / points + rotation - Math.PI / 2,
      d = i % 2 ? r * 0.43 : r;
    p.push([x + Math.cos(a) * d, y + Math.sin(a) * d]);
  }
  shape(c, p, color, null);
}
function ring(c, x, y, r, color, width = 2, flat = 1) {
  c.beginPath();
  c.ellipse(x, y, Math.max(0.1, r), Math.max(0.1, r * flat), 0, 0, TAU);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
function bolt(c, x, y, ex, ey, time, color = "#fff7a3", width = 4) {
  const pts = [[x, y]],
    len = Math.hypot(ex - x, ey - y);
  for (let t = 16; t < len; t += 18) {
    const q = t / len;
    pts.push([
      x + (ex - x) * q + Math.sin(t * 1.7 + Math.floor(time * 18)) * 12,
      y + (ey - y) * q,
    ]);
  }
  pts.push([ex, ey]);
  line(c, pts, color, width);
}
function rock(c, x, y, r, color, rot = 0) {
  const p = [];
  for (let i = 0; i < 7; i++) {
    const a = (i * TAU) / 7 + rot,
      rr = r * (i % 2 ? 0.8 : 1);
    p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  shape(c, p, color, "#40515d", 1.5);
  line(
    c,
    [
      [x - r * 0.6, y - r * 0.3],
      [x, y],
      [x + r * 0.4, y - r * 0.6],
    ],
    "#6f7776",
    1.3,
  );
}
function leaf(c, x, y, r, rot, color = "#a3ed80") {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  shape(
    c,
    [
      [-r, 0],
      [0, -r * 0.6],
      [r, 0],
      [0, r * 0.5],
    ],
    color,
    "#4e9473",
    1,
  );
  line(
    c,
    [
      [-r, 0],
      [r, 0],
    ],
    "#d7f8a7",
    1,
  );
  c.restore();
}
function fist(c, x, y, size, rot, color = "#d6dded") {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(size, size);
  shape(
    c,
    [
      [-9, -4],
      [-8, -11],
      [-3, -13],
      [4, -12],
      [11, -7],
      [12, 4],
      [5, 9],
      [-7, 8],
      [-12, 2],
    ],
    color,
    "#344b66",
    1.8,
  );
  line(
    c,
    [
      [-5, -9],
      [-4, -3],
      [0, -10],
      [2, -3],
      [6, -8],
      [7, -1],
    ],
    "#78889a",
    1.5,
  );
  c.restore();
}
function note(c, x, y, scale, color) {
  line(
    c,
    [
      [x, y],
      [x, y - 16 * scale],
      [x + 8 * scale, y - 12 * scale],
    ],
    color,
    3 * scale,
  );
  oval(c, x - 3 * scale, y, 5 * scale, 3 * scale, color);
}
function droplet(c, x, y, r, color) {
  shape(
    c,
    [
      [x, y - r * 1.5],
      [x - r, y],
      [x - r * 0.6, y + r],
      [x + r * 0.6, y + r],
      [x + r, y],
    ],
    color,
    null,
  );
}
function crack(c, x, y, r, t, color = "#f5d49d") {
  for (let side of [-1, 1]) {
    const pts = [[x, y]];
    for (let i = 1; i < 9; i++)
      pts.push([x + (side * r * i) / 8, y + Math.sin(i * 7) * 9 * t]);
    line(c, pts, color, 3);
  }
}
function wisps(c, x, y, r, t, color, n = 8) {
  for (let i = 0; i < n; i++) {
    const a = (i * TAU) / n + t * 2;
    oval(
      c,
      x + Math.cos(a) * r,
      y + Math.sin(a) * r * 0.7,
      3 + Math.sin(i + t) * 2,
      7,
      color,
    );
  }
}
export function drawProjectile(c, m, x, y, t, rotation = 0) {
  const id = m.visual;
  c.save();
  c.translate(x, y);
  c.rotate(rotation);
  const col = m.color;
  switch (id) {
    case "fire-blast":
      star(c, 0, 0, 19, "#ff7b32", 5, t * 2);
      star(c, 0, 0, 11, "#fff0a4", 5, t * 2);
      break;
    case "hydro-pump":
      line(
        c,
        [
          [-32, 3],
          [-18, -5],
          [0, 0],
        ],
        "#75dfffaa",
        17,
      );
      droplet(c, 4, 0, 11, "#8beaff");
      oval(c, 2, -3, 4, 4, "#fff");
      break;
    case "water-pulse":
      oval(c, 0, 0, 11, 11, "#60bfe4");
      ring(c, 0, 0, 16, "#d0fbff", 2);
      ring(c, 0, 0, 21, "#85e3ff88", 2, 0.6);
      break;
    case "electro-ball":
      oval(c, 0, 0, 11, 11, "#ffe66b");
      for (let i = 0; i < 4; i++) {
        c.rotate(Math.PI / 2);
        line(
          c,
          [
            [9, 0],
            [20, -7],
            [16, 4],
          ],
          "#fff8be",
          2,
        );
      }
      break;
    case "rock-blast":
      rock(c, 0, 0, 14, "#bcb08f", t * 3);
      break;
    case "shadow-ball":
      oval(c, 0, 0, 15, 15, "#291f5199");
      oval(c, 0, 0, 10, 10, "#61449a");
      wisps(c, 0, 0, 16, t, "#d0a4ff", 5);
      break;
    case "sludge-bomb":
      oval(c, 0, 0, 14, 12, "#a564bb");
      oval(c, 4, -6, 5, 5, "#d9a6db");
      for (let i = 0; i < 3; i++)
        droplet(c, -12 - i * 5, Math.sin(t * 5 + i) * 7, 4, "#b873c7");
      break;
    case "seed-bomb":
      oval(c, 0, 0, 12, 15, "#a0c865", "#426c49", 2);
      line(
        c,
        [
          [-4, -11],
          [1, 10],
          [6, -7],
        ],
        "#dfe4a2",
        2,
      );
      leaf(c, 0, -14, 10, t, "#a7e78a");
      break;
    case "psybeam":
      for (let i = 0; i < 9; i++) {
        const a = i * 0.8 + t * 8;
        oval(
          c,
          -i * 4,
          Math.sin(a) * 9,
          4,
          4,
          ["#f6a4dc", "#b7b3ff", "#a4f3d4"][i % 3],
        );
      }
      ring(c, 0, 0, 13, "#f1d7ff", 2, 0.65);
      break;
    case "focus-blast":
      oval(c, 0, 0, 14, 14, "#87c8ff");
      ring(c, 0, 0, 20, "#e0fbff", 3);
      ring(c, 0, 0, 26, "#64b6ff66", 2);
      star(c, 0, 0, 10, "#f7ffff", 6, t);
      break;
    case "dragon-rage":
      shape(
        c,
        [
          [-34, 4],
          [-19, -10],
          [-8, -6],
          [7, -15],
          [19, -7],
          [16, 6],
          [4, 12],
          [-7, 7],
          [-20, 12],
        ],
        "#f19b70",
        null,
      );
      shape(
        c,
        [
          [2, -9],
          [16, -5],
          [8, 5],
          [-4, 4],
        ],
        "#fbe7a1",
        null,
      );
      oval(c, 10, -5, 2, 2, "#334c6c");
      break;
    case "ice-shard":
      shape(
        c,
        [
          [-22, 0],
          [0, -9],
          [20, 0],
          [0, 10],
        ],
        "#a5efff",
        "#efffff",
        2,
      );
      line(
        c,
        [
          [-18, 0],
          [17, 0],
        ],
        "#fff",
        2,
      );
      break;
    case "draco-meteor":
      line(
        c,
        [
          [-40, -12],
          [-12, -2],
          [0, 0],
        ],
        "#ff916566",
        20,
      );
      rock(c, 0, 0, 15, "#ecab78", t * 2);
      star(c, -2, -2, 8, "#fff4bb", 4);
      break;
    case "bullet-punch":
      fist(c, 0, 0, 1, t * 0.3, "#b7d1dd");
      line(
        c,
        [
          [-28, -7],
          [-12, -7],
        ],
        "#f5faff",
        2,
      );
      line(
        c,
        [
          [-24, 7],
          [-12, 7],
        ],
        "#f5faff",
        2,
      );
      break;
    case "swift":
      star(c, 0, 0, 17, "#ffe6a0", 5, t * 4);
      star(c, -18, -4, 6, "#fff8d9", 5, -t * 5);
      break;
    case "snarl":
      ring(c, 0, 0, 14, "#514e79", 4, 0.7);
      note(c, 0, 5, 0.8, "#dfb4f1");
      note(c, -20, -1, 0.5, "#8272ab");
      break;
    case "lava-plume":
      oval(c, 0, 0, 14, 12, "#f78f48");
      for (let i = 0; i < 6; i++) {
        const a = t * 5 + i;
        oval(
          c,
          Math.cos(a) * 13,
          Math.sin(a) * 13,
          4,
          5,
          i % 2 ? "#ffca68" : "#e96e48",
        );
      }
      oval(c, -3, -3, 5, 5, "#fff0a0");
      break;
    default:
      star(c, 0, 0, 12, col, 6, t * 2);
  }
  c.restore();
}
export function drawMoveImpact(c, id, x, y, r, t, life = 1, facing = 1) {
  const col = colors[id] || "#e9f8ca",
    q = Math.min(1, t),
    grow = Math.sin((Math.min(1, q * 1.4) * Math.PI) / 2),
    fade = Math.max(0, 1 - q);
  c.save();
  c.translate(x, y);
  c.globalAlpha *= Math.min(1, fade * 2.6);
  c.lineJoin = "round";
  c.lineCap = "round";
  switch (id) {
    case "flamethrower":
      for (let i = 0; i < 14; i++) {
        const a = -0.8 + i * 0.11;
        const d = r * grow * (0.7 + Math.sin(i * 13 + t * 20) * 0.3);
        shape(
          c,
          [
            [facing * -35, -50],
            [facing * Math.cos(a) * d, Math.sin(a) * d - 20],
            [
              facing * Math.cos(a + 0.18) * d * 0.6,
              Math.sin(a + 0.18) * d * 0.6,
            ],
          ],
          i % 2 ? "#ffb44caa" : "#ff703faa",
          null,
        );
      }
      break;
    case "fire-blast":
      for (const [w, color] of [
        [18, "#ff743d"],
        [7, "#fff2a4"],
      ]) {
        line(
          c,
          [
            [0, -r * grow],
            [0, r * 0.75 * grow],
          ],
          color,
          w * fade + 1,
        );
        line(
          c,
          [
            [-r * grow, -r * 0.1],
            [r * grow, -r * 0.1],
          ],
          color,
          w * fade + 1,
        );
        line(
          c,
          [
            [0, -r * 0.2],
            [-r * 0.8 * grow, r * 0.8 * grow],
          ],
          color,
          w * fade + 1,
        );
        line(
          c,
          [
            [0, -r * 0.2],
            [r * 0.8 * grow, r * 0.8 * grow],
          ],
          color,
          w * fade + 1,
        );
      }
      break;
    case "hydro-pump":
      for (let i = 0; i < 15; i++) {
        const a = -Math.PI + i * 0.21;
        droplet(
          c,
          Math.cos(a) * r * grow + facing * q * 25,
          Math.sin(a) * r * grow,
          3 + (i % 4),
          "#a8f4ff",
        );
      }
      ring(c, 0, 0, r * grow, "#8ceaff", 5 * fade, 0.35);
      break;
    case "water-pulse":
      for (let i = 0; i < 4; i++) {
        const d = ((q + i * 0.2) % 1) * r * 1.7;
        ring(c, 0, 0, d, i % 2 ? "#7edaf2" : "#d4ffff", 3 * fade, 0.55);
      }
      break;
    case "thunderbolt":
      bolt(c, -24, -240, 0, 0, q, "#ffdc5999", 16);
      bolt(c, -24, -240, 0, 0, q, "#fffad0", 5);
      bolt(c, 0, -65, -r * 0.8, 0, q, "#ffe66b", 3);
      bolt(c, 0, -75, r * 0.8, 0, q + 1, "#ffe66b", 3);
      star(c, 0, -5, r * 0.5 * grow, "#fff1a5", 8, q);
      break;
    case "electro-ball":
      oval(c, 0, 0, r * 0.25 * fade, r * 0.25 * fade, "#fff2a0");
      for (let i = 0; i < 6; i++) {
        const a = (i * TAU) / 6 + q * 3;
        bolt(
          c,
          Math.cos(a) * r * 0.25,
          Math.sin(a) * r * 0.25,
          Math.cos(a) * r * grow,
          Math.sin(a) * r * grow,
          q,
          "#ffe777",
          3,
        );
      }
      break;
    case "rock-blast":
      for (let i = 0; i < 9; i++) {
        const a = i * 2.4;
        rock(
          c,
          Math.cos(a) * r * grow,
          Math.sin(a) * r * grow + q * q * 25,
          6 + (i % 4),
          "#c5b797",
          q * 5 + i,
        );
      }
      break;
    case "earthquake":
      crack(c, 0, 0, r * grow, 1);
      crack(c, 0, 14, r * 0.8 * grow, 0.6, "#ad9268");
      for (let i = 0; i < 8; i++)
        rock(
          c,
          (i - 3.5) * r * 0.22,
          -Math.sin(q * Math.PI) * 15,
          5,
          "#bbad8b",
          i,
        );
      break;
    case "shadow-ball":
      oval(c, 0, 0, r * 0.6 * fade, r * 0.6 * fade, "#251d4b99");
      for (let i = 0; i < 3; i++)
        ring(c, 0, 0, (0.2 + i * 0.2) * r * grow, "#b793ed", 3, 1 - i * 0.16);
      wisps(c, 0, 0, r * grow, q * 3, "#c29df2", 9);
      break;
    case "sludge-bomb":
      for (let i = 0; i < 13; i++) {
        const a = i * 2.4,
          d = r * grow;
        oval(
          c,
          Math.cos(a) * d,
          Math.sin(a) * d * 0.4 - q * 25,
          4 + (i % 8),
          5 + (i % 8),
          i % 2 ? "#b678c9aa" : "#d2a0d4aa",
        );
      }
      ring(c, 0, 4, r * grow, "#9d6ab2", 7 * fade, 0.3);
      break;
    case "body-slam":
      ring(c, 0, 5, r * 1.5 * grow, "#f3dfac", 5 * fade, 0.28);
      for (let i = 0; i < 8; i++)
        oval(
          c,
          (i - 3.5) * r * 0.3,
          -Math.sin(i * 6 + q * 2) * 12,
          9 * grow,
          5 * grow,
          "#d9cda3aa",
        );
      shape(
        c,
        [
          [-15, -5],
          [-8, -19],
          [0, -5],
          [10, -23],
          [18, -3],
        ],
        "#f7f1cd",
        null,
      );
      break;
    case "hyper-beam":
      star(c, 0, 0, r * 3 * fade, "#fff1ba88", 8, q);
      ring(c, 0, 0, r * (1 + q * 2), "#ffdb83", 8 * fade);
      star(c, 0, 0, r * 1.3 * fade, "#fffbe3", 6, -q);
      break;
    case "seed-bomb":
      for (let i = 0; i < 9; i++) {
        const a = i * 2.4;
        leaf(
          c,
          Math.cos(a) * r * grow,
          Math.sin(a) * r * grow,
          7 + (i % 4),
          q * 5 + i,
        );
        oval(
          c,
          Math.cos(a) * r * 0.7 * grow,
          Math.sin(a) * r * 0.7 * grow,
          3,
          5,
          "#e3d8a3",
        );
      }
      break;
    case "solar-beam":
      for (let i = 0; i < 8; i++)
        leaf(
          c,
          Math.cos((i * TAU) / 8) * r * grow,
          Math.sin((i * TAU) / 8) * r * grow,
          10,
          q * 3 + i,
          "#c7fba6",
        );
      ring(c, 0, 0, r * grow, "#f5ffe0", 5 * fade);
      break;
    case "psybeam":
      for (let i = 0; i < 4; i++) {
        c.save();
        c.rotate(q * 4 + i * 0.7);
        ring(
          c,
          0,
          0,
          r * (0.3 + i * 0.18) * grow,
          ["#ffc0e4", "#b5c2ff", "#b1f4dd", "#e6d2ff"][i],
          3,
          0.35,
        );
        c.restore();
      }
      break;
    case "psychic":
      for (let i = 0; i < 3; i++) {
        ring(c, 0, -q * 45 - i * 15, r * (0.4 + i * 0.2), "#e6b5f1", 2, 0.3);
        rock(
          c,
          Math.sin(i * 2 + q) * r * 0.5,
          -grow * 55 - i * 12,
          7,
          "#d1b5d5",
          q * 4,
        );
      }
      line(
        c,
        [
          [-r * 0.7, 0],
          [-r * 0.7, -r],
          [r * 0.7, -r],
          [r * 0.7, 0],
        ],
        "#bfa3ee66",
        2,
      );
      break;
    case "dynamic-punch":
      for (let i = 0; i < 4; i++) {
        const a = (i * TAU) / 4 + q;
        fist(
          c,
          Math.cos(a) * r * fade,
          Math.sin(a) * r * fade,
          1.2,
          a + Math.PI,
          "#e1c6ad",
        );
      }
      star(c, 0, 0, r * 0.8 * grow, "#ffe9af88", 10);
      break;
    case "focus-blast":
      oval(c, 0, 0, r * 0.6 * fade, r * 0.6 * fade, "#b9ebff88");
      ring(c, 0, 0, r * grow, "#d9ffff", 5 * fade);
      ring(c, 0, 0, r * 1.5 * grow, "#75bbff", 3 * fade);
      break;
    case "aqua-tail":
      c.save();
      c.scale(facing, 1);
      c.beginPath();
      c.arc(0, -20, r * grow, Math.PI * 0.05, Math.PI * 1.1);
      c.strokeStyle = "#92e8ff";
      c.lineWidth = 18 * fade + 1;
      c.stroke();
      for (let i = 0; i < 9; i++)
        droplet(
          c,
          (i - 4) * r * 0.22,
          -Math.sin(i * 0.35 + q * 2) * r * 0.7,
          5,
          "#d0faff",
        );
      c.restore();
      break;
    case "dragon-rage":
      for (let i = 0; i < 8; i++) {
        const a = (i * TAU) / 8;
        shape(
          c,
          [
            [Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2],
            [Math.cos(a + 0.15) * r * grow, Math.sin(a + 0.15) * r * grow],
            [
              Math.cos(a - 0.1) * r * 0.8 * grow,
              Math.sin(a - 0.1) * r * 0.8 * grow,
            ],
          ],
          i % 2 ? "#ffad79" : "#ffe0a3",
          null,
        );
      }
      break;
    case "ice-shard":
      for (let i = 0; i < 9; i++) {
        const a = i * 2.4,
          d = r * grow;
        c.save();
        c.translate(Math.cos(a) * d, Math.sin(a) * d);
        c.rotate(a + q * 3);
        shape(
          c,
          [
            [0, -13],
            [-5, 3],
            [0, 9],
            [5, 3],
          ],
          "#d2faff",
          "#8cdbf4",
          1,
        );
        c.restore();
      }
      break;
    case "ice-beam":
      for (let i = 0; i < 9; i++) {
        const px = (i - 4) * r * 0.35,
          h = (15 + (i % 3) * 14) * grow;
        shape(
          c,
          [
            [px - 7, 4],
            [px - 4, -h],
            [px + 2, -h - 8],
            [px + 8, 4],
          ],
          i % 2 ? "#b1e7f7" : "#e2fcff",
          "#75badc",
          1,
        );
      }
      break;
    case "hurricane":
      for (let i = 0; i < 13; i++) {
        const h = i * 9,
          rr = (14 + i * 4) * grow;
        ring(
          c,
          Math.sin(q * 12 + i * 0.5) * 7,
          -h,
          rr,
          i % 2 ? "#d4eff2aa" : "#9bc9d6aa",
          3,
          0.24,
        );
      }
      for (let i = 0; i < 7; i++)
        leaf(
          c,
          Math.sin(q * 12 + i) * r * 0.7,
          -i * 16,
          5,
          q * 10 + i,
          "#b7d8b7",
        );
      break;
    case "draco-meteor":
      for (let i = 0; i < 3; i++) {
        const px = (i - 1) * r * 1.1,
          fall = Math.min(1, q * 3 - i * 0.3);
        if (fall > 0 && fall < 1) {
          line(
            c,
            [
              [px - 20, -180 * (1 - fall) - 45],
              [px, -180 * (1 - fall)],
            ],
            "#ffcf8788",
            14,
          );
          rock(c, px, -180 * (1 - fall), 13, "#e7a36d", q * 5);
        } else if (fall >= 1)
          ring(c, px, 0, r * grow, "#ffc88f", 3 * fade, 0.5);
      }
      break;
    case "stone-edge":
      for (let i = 0; i < 7; i++) {
        const px = (i - 3) * r * 0.3,
          h = (25 + (i % 3) * 18) * grow;
        shape(
          c,
          [
            [px - 13, 7],
            [px - 5, -h],
            [px + 3, -h - 14],
            [px + 12, 5],
          ],
          i % 2 ? "#d7cfb5" : "#a8b09d",
          "#536c67",
          1.5,
        );
      }
      break;
    case "crunch":
      for (let side of [-1, 1])
        for (let i = 0; i < 7; i++) {
          const px = (i - 3) * r * 0.23,
            open = r * fade * 0.6;
          shape(
            c,
            [
              [px - 7, side * open],
              [px + 7, side * open],
              [px, side * (open - 20)],
            ],
            "#e7e4c9",
            "#506075",
            1,
          );
        }
      ring(c, 0, 0, r * grow, "#8d79a6", 3, 0.6);
      break;
    case "bullet-punch":
      for (let i = 0; i < 5; i++) {
        const a = i * 2.4,
          d = r * fade;
        fist(c, Math.cos(a) * d, Math.sin(a) * d, 0.65, a + Math.PI, "#cadde4");
      }
      star(c, 0, 0, r * 0.65 * grow, "#effaff", 6, q);
      break;
    case "x-scissor":
      for (const side of [-1, 1]) {
        line(
          c,
          [
            [-r * grow, -side * r * grow],
            [r * grow, side * r * grow],
          ],
          "#a7efbc55",
          20 * fade + 1,
        );
        line(
          c,
          [
            [-r * grow, -side * r * grow],
            [r * grow, side * r * grow],
          ],
          "#e3ffe5",
          5 * fade + 1,
        );
      }
      break;
    case "swift":
      for (let i = 0; i < 10; i++) {
        const a = (i * TAU) / 10;
        star(
          c,
          Math.cos(a) * r * grow,
          Math.sin(a) * r * grow,
          6 + (i % 4),
          "#fff0b6",
          5,
          q * 6 + i,
        );
      }
      break;
    case "psyshock":
      for (let i = 0; i < 3; i++) {
        const a = (i * TAU) / 3 + q * 7,
          d = r * fade;
        oval(c, Math.cos(a) * d, Math.sin(a) * d * 0.6, 12, 12, "#d8aff4");
        line(
          c,
          [
            [Math.cos(a) * d * 1.3, Math.sin(a) * d * 0.8],
            [0, 0],
          ],
          "#f0c9ff66",
          3,
        );
      }
      ring(c, 0, 0, r * 0.3 * grow, "#faf0ff", 5 * fade);
      break;
    case "snarl":
      for (let i = 0; i < 4; i++) {
        ring(c, 0, 0, r * (0.3 + q + i * 0.12), "#b39bd1", 3, 0.6);
        note(c, (i - 1.5) * r * 0.4, -q * r - (i % 2) * 15, 0.7, "#d5bee7");
      }
      break;
    case "dark-pulse":
      for (let i = 0; i < 5; i++)
        ring(
          c,
          0,
          -5,
          ((q + i * 0.2) % 1) * r * 1.4,
          i % 2 ? "#342e57" : "#c6a5e6",
          6 * fade,
          0.55,
        );
      oval(c, 0, -5, r * 0.25 * fade, r * 0.25 * fade, "#30294c");
      break;
    case "lava-plume":
      for (let i = 0; i < 8; i++) {
        const a = (i * TAU) / 8;
        oval(
          c,
          Math.cos(a) * r * 0.65 * grow,
          Math.sin(a) * r * 0.65 * grow,
          13 * fade + 2,
          19 * fade + 2,
          i % 2 ? "#ffb653" : "#ee7149",
        );
      }
      oval(c, 0, 0, 18 * fade, 18 * fade, "#ffe99b");
      break;
    case "eruption":
      shape(
        c,
        [
          [-r * 0.45, 5],
          [-r * 0.2, -r * 1.5 * grow],
          [r * 0.2, -r * 1.5 * grow],
          [r * 0.45, 5],
        ],
        "#ff9a4155",
        null,
      );
      for (let i = 0; i < 14; i++) {
        const a = -Math.PI + (i * Math.PI) / 14;
        oval(
          c,
          Math.cos(a) * r * grow,
          Math.sin(a) * r * 1.5 * grow + q * q * 40,
          4 + (i % 5),
          6,
          "#ffd278",
        );
      }
      crack(c, 0, 0, r * grow, 1, "#ffbd6e");
      break;
    case "dig":
      for (let d = 0; d < 6; d++) {
        ring(c, 0, d * 13, 25 + q * 10, "#ddb87f", 3, 0.3);
        rock(
          c,
          Math.sin(d * 7 + q * 5) * r * 0.6,
          -Math.sin(q * Math.PI) * 50 + d * 3,
          5 + (d % 3),
          "#bea47b",
          q * 6,
        );
      }
      break;
    case "dragon-rush":
      line(
        c,
        [
          [-facing * r * 1.5, -r * 1.7],
          [0, 0],
        ],
        "#7ca9f055",
        35 * fade + 1,
      );
      line(
        c,
        [
          [-facing * r * 1.3, -r * 1.5],
          [0, 0],
        ],
        "#cff3ff",
        8 * fade + 1,
      );
      shape(
        c,
        [
          [-facing * 25, -20],
          [0, -40],
          [facing * 30, -10],
          [facing * 14, 18],
          [-facing * 10, 10],
        ],
        "#a4d7f588",
        null,
      );
      star(c, 0, 0, r * grow, "#dbfaff88", 7, q);
      break;
    default:
      throw new Error(`Missing move effect: ${id}`);
  }
  c.restore();
}
export function drawBeam(c, m, start, end, time, progress) {
  c.save();
  const dx = end.x - start.x,
    dy = end.y - start.y,
    len = Math.hypot(dx, dy),
    nx = -dy / (len || 1),
    ny = dx / (len || 1);
  if (m.id === "hyper-beam") {
    line(
      c,
      [
        [start.x, start.y],
        [end.x, end.y],
      ],
      "#f9c66b33",
      42,
    );
    line(
      c,
      [
        [start.x, start.y],
        [end.x, end.y],
      ],
      "#ffd07e",
      22,
    );
    line(
      c,
      [
        [start.x, start.y],
        [end.x, end.y],
      ],
      "#fff9df",
      9,
    );
    for (let i = 0; i < 7; i++) {
      const q = (i / 7 + time * 2) % 1;
      ring(c, start.x + dx * q, start.y + dy * q, 20, "#fff0b2", 2);
    }
  } else if (m.id === "solar-beam") {
    line(
      c,
      [
        [start.x, start.y],
        [end.x, end.y],
      ],
      "#c9fa9a44",
      33,
    );
    line(
      c,
      [
        [start.x, start.y],
        [end.x, end.y],
      ],
      "#bcf77c",
      14,
    );
    line(
      c,
      [
        [start.x, start.y],
        [end.x, end.y],
      ],
      "#fdffe8",
      6,
    );
    for (let i = 0; i < 12; i++) {
      const q = (i / 12 + time * 1.7) % 1;
      leaf(
        c,
        start.x + dx * q + nx * Math.sin(q * 20) * 12,
        start.y + dy * q + ny * Math.sin(q * 20) * 12,
        7,
        time + i,
        "#d7f5a7",
      );
    }
  } else if (m.id === "ice-beam") {
    const pts = [[start.x, start.y]];
    for (let i = 10; i < len; i += 20) {
      const q = i / len,
        offset = Math.sin(i + time * 20) * 6;
      pts.push([
        start.x + dx * q + nx * offset,
        start.y + dy * q + ny * offset,
      ]);
    }
    pts.push([end.x, end.y]);
    line(c, pts, "#a2e5ff55", 25);
    line(c, pts, "#a9e9ff", 9);
    line(c, pts, "#f4ffff", 3);
    for (let i = 0; i < 9; i++) {
      const q = (i / 9 + time) % 1;
      star(c, start.x + dx * q, start.y + dy * q, 7, "#e8ffff", 6, time);
    }
  }
  c.restore();
}
