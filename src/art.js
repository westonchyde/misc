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
export { drawTrainer as trainer } from "./trainers.js";
