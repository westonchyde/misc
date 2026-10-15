// Original procedural fan silhouettes. No external sprite sheets or character artwork.
export function oval(c, x, y, rx, ry, fill, stroke = null, width = 2.5) {
  c.beginPath();
  c.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
export function shape(c, points, fill, stroke = "#263b45", width = 2.5) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
export function line(c, points, color, width = 2) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
const ink = "#24323e";
function eye(c, x, y, wide = 4, color = "#eefaff") {
  oval(c, x, y, wide, 5, color, ink, 1.4);
  oval(c, x + 1.5, y + 0.5, 1.7, 3, ink);
  oval(c, x + 1, y - 1, 0.8, 1, "#fff");
}
export function ball(c, x, y, scale = 1, rotation = 0, open = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(rotation);
  c.scale(scale, scale);
  oval(c, 0, open * 6, 8, 8, "#f6f2e7", ink, 2);
  c.save();
  c.translate(0, -open * 9);
  c.beginPath();
  c.arc(0, 0, 8, Math.PI, 0);
  c.closePath();
  c.fillStyle = "#ef6d65";
  c.fill();
  c.strokeStyle = ink;
  c.lineWidth = 2;
  c.stroke();
  c.restore();
  line(
    c,
    [
      [-7, 0],
      [7, 0],
    ],
    ink,
    2,
  );
  oval(c, 0, 0, 3, 3, "#fff8df", ink, 1.5);
  c.restore();
}
export { drawSprite as creature } from "./sprites.js";
export function trainer(
  c,
  p,
  index,
  time,
  phase = "aim",
  phaseTime = 0,
  active = false,
) {
  c.save();
  c.translate(p.x, p.y);
  c.scale(p.facing, 1);
  c.lineJoin = "round";
  c.lineCap = "round";
  const walk =
      Math.sin(p.walk) * (p.grounded && time - p.lastWalk < 0.1 ? 5 : 0),
    hurt = p.hurt > 0;
  const color = index ? "#65bdeb" : "#f49777";
  oval(c, 0, 20, 15, 4, "#1a353b44");
  line(
    c,
    [
      [-5, 6],
      [-6 - walk, 17],
    ],
    "#354859",
    7,
  );
  line(
    c,
    [
      [5, 6],
      [6 + walk, 17],
    ],
    "#354859",
    7,
  );
  oval(c, -7 - walk, 18, 6, 3, "#eff1d8", ink, 1.5);
  oval(c, 7 + walk, 18, 6, 3, "#eff1d8", ink, 1.5);
  shape(
    c,
    [
      [-9, -15],
      [6, -15],
      [11, 6],
      [-9, 7],
    ],
    hurt ? "#fff5d3" : color,
    ink,
    2,
  );
  shape(
    c,
    [
      [-10, -15],
      [-17, -12],
      [-17, 1],
      [-10, 3],
    ],
    index ? "#405e88" : "#a85a4d",
    ink,
    1.5,
  );
  line(
    c,
    [
      [-4, -14],
      [0, 6],
    ],
    "#f1e5bf",
    2,
  );
  oval(c, 1, -25, 10, 12, "#f0c39f", ink, 2);
  shape(
    c,
    [
      [-8, -26],
      [-8, -37],
      [6, -39],
      [12, -30],
      [18, -29],
      [18, -25],
    ],
    index ? "#4c79ae" : "#c85e50",
  );
  oval(c, 8, -25, 1.5, 2, ink);
  line(
    c,
    [
      [4, -17],
      [10, -18],
    ],
    "#ae816a",
    1,
  );
  let arm =
    phase === "over" || (phase === "summon" && phaseTime < 0.35) ? -32 : -2;
  line(
    c,
    [
      [7, -11],
      [14, arm],
    ],
    "#f0c39f",
    6,
  );
  line(
    c,
    [
      [-8, -10],
      [-12, -1 + walk * 0.4],
    ],
    "#f0c39f",
    6,
  );
  if (active && phase === "aim") ball(c, 15, -1, 0.5);
  c.restore();
}
