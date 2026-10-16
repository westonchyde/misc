// Original pixel art. Shared animation construction keeps cosmetic profiles stat-neutral.
export const palettes = [
  { name: "Ember", light: "#ffb16c", main: "#d55b50", dark: "#853d4d" },
  { name: "River", light: "#9be2ee", main: "#488fbc", dark: "#344f88" },
  { name: "Fern", light: "#c9e78b", main: "#649b66", dark: "#345b59" },
  { name: "Violet", light: "#e2b8ee", main: "#a373c6", dark: "#5d447e" },
  { name: "Gold", light: "#ffe7a0", main: "#d39c46", dark: "#8d6144" },
  { name: "Rose", light: "#ffbcd2", main: "#cb6794", dark: "#793e69" },
];
export const skins = ["#f5d2aa", "#d9a278", "#a96f51", "#754b3f"];
export const hairstyles = ["Cap", "Headband", "Ranger"];
export function cleanProfile(value = {}, index = 0) {
  const bounded = (v, max, fallback) =>
    Number.isInteger(+v) && +v >= 0 && +v < max ? +v : fallback;
  return {
    name:
      String(value.name || (index ? "River" : "Ember"))
        .replace(/[^\p{L}\p{N} _-]/gu, "")
        .trim()
        .slice(0, 12) || (index ? "River" : "Ember"),
    palette: bounded(value.palette, palettes.length, index),
    skin: bounded(value.skin, skins.length, 0),
    style: bounded(value.style, hairstyles.length, index),
  };
}
function rect(c, x, y, w, h, col) {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}
export function drawTrainer(
  c,
  p,
  index,
  time,
  phase = "aim",
  phaseTime = 0,
  active = false,
) {
  const profile = cleanProfile(p.profile, index),
    col = palettes[profile.palette],
    skin = skins[profile.skin],
    ink = "#202738";
  const walking = p.grounded && time - p.lastWalk < 0.13,
    frame = walking ? Math.floor(p.walk * 1.3) % 4 : 0;
  const jump = !p.grounded,
    hurt = p.hurt > 0,
    throwing = active && phase === "summon",
    victory = phase === "over" && p.hp > 0;
  const swing = walking ? [0, 2, 0, -2][frame] : 0,
    bob = walking ? frame % 2 : Math.floor(time * 1.8) % 2;
  c.save();
  c.translate(Math.round(p.x), Math.round(p.y + 19));
  c.scale(p.facing || 1, 1);
  c.fillStyle = "#142b3d55";
  c.beginPath();
  c.ellipse(0, 1, 17, 4, 0, 0, Math.PI * 2);
  c.fill();
  c.scale(2, 2);
  c.translate(-14, -34 + (jump ? -1 : 0));
  const r = (x, y, w, h, color) =>
    rect(c, x, y, w, h, hurt && Math.floor(time * 22) % 2 ? "#fff1ce" : color);
  // Backpack, legs and individually articulated boots.
  r(3, 16 + bob, 6, 11, ink);
  r(4, 17 + bob, 4, 8, col.dark);
  r(4, 18 + bob, 3, 2, col.main);
  for (const [x, offset] of [
    [9, swing],
    [15, -swing],
  ]) {
    r(x, 25, 5, 7 + offset, ink);
    r(x + 1, 26, 3, 5 + offset, "#45536b");
    r(x + 2, 26, 2, 3 + offset, "#69778e");
    r(x, 30 + offset, 7, 3, ink);
    r(x + 1, 30 + offset, 5, 2, "#e6e9d5");
    r(x + 1, 32 + offset, 6, 1, "#82959d");
  }
  r(8, 16 + bob, 12, 11, ink);
  r(9, 17 + bob, 10, 8, col.main);
  r(10, 17 + bob, 4, 7, col.light);
  r(14, 17 + bob, 2, 8, "#f7ebcf");
  r(9, 24 + bob, 10, 2, col.dark);
  r(14, 25 + bob, 2, 1, "#f6c86d");
  r(8, 17 + bob, 3, 4, col.dark);
  r(9, 17 + bob, 2, 3, col.light);
  // Head, hair, ear, face shading and two-pixel eye.
  r(9, 6 + bob, 11, 11, ink);
  r(10, 7 + bob, 9, 9, skin);
  r(10, 7 + bob, 3, 6, "#664536");
  r(10, 12 + bob, 2, 3, skin);
  r(18, 10 + bob, 3, 4, skin);
  r(16, 10 + bob, 2, 2, ink);
  r(16, 10 + bob, 1, 1, "#fff5de");
  r(17, 15 + bob, 2, 1, "#a36b5b");
  r(12, 16 + bob, 5, 2, skin);
  if (profile.style === 0) {
    r(8, 3 + bob, 11, 5, ink);
    r(9, 3 + bob, 9, 4, col.main);
    r(11, 3 + bob, 5, 2, col.light);
    r(8, 7 + bob, 14, 2, ink);
    r(10, 7 + bob, 12, 1, col.light);
    r(13, 5 + bob, 3, 2, "#f5e9c9");
  } else if (profile.style === 1) {
    r(9, 3 + bob, 8, 4, ink);
    r(8, 5 + bob, 3, 4, "#443540");
    r(11, 3 + bob, 6, 3, "#6a4a43");
    r(9, 7 + bob, 11, 2, col.main);
    r(10, 7 + bob, 9, 1, col.light);
    r(7, 9 + bob, 3, 4, col.dark);
  } else {
    r(9, 3 + bob, 10, 4, ink);
    r(10, 3 + bob, 8, 3, col.main);
    r(10, 3 + bob, 6, 1, col.light);
    r(6, 7 + bob, 17, 2, ink);
    r(7, 7 + bob, 15, 1, col.light);
    r(8, 9 + bob, 3, 6, "#624735");
  }
  // Back arm, forward arm: wind-up, release and follow-through are distinct poses.
  r(6, 20 + bob - swing / 2, 3, 6, ink);
  r(7, 20 + bob - swing / 2, 2, 4, skin);
  let handX = 21,
    handY = 24 + bob + swing;
  if (victory) {
    handX = 22;
    handY = 9;
  }
  if (throwing) {
    if (phaseTime < 0.18) {
      handX = 14;
      handY = 9;
    } else if (phaseTime < 0.42) {
      handX = 26;
      handY = 14;
    } else {
      handX = 24;
      handY = 20;
    }
  }
  const shoulder = { x: 19, y: 19 + bob };
  c.strokeStyle = ink;
  c.lineWidth = 4;
  c.lineCap = "square";
  c.beginPath();
  c.moveTo(shoulder.x, shoulder.y);
  c.lineTo(handX, handY);
  c.stroke();
  c.strokeStyle = skin;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(shoulder.x, shoulder.y);
  c.lineTo(handX, handY);
  c.stroke();
  r(handX - 1, handY - 1, 3, 3, skin);
  if (active && (phase === "aim" || (throwing && phaseTime < 0.3))) {
    r(handX, handY, 4, 4, ink);
    r(handX + 1, handY, 2, 2, "#ed6b64");
    r(handX + 1, handY + 2, 2, 1, "#fff1dc");
  }
  c.restore();
}
export function trainerPortrait(canvas, profile, index = 0) {
  const c = canvas.getContext("2d");
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.save();
  c.translate(canvas.width / 2, canvas.height - 8);
  c.scale(1.7, 1.7);
  drawTrainer(
    c,
    { x: 0, y: -19, profile, facing: 1, grounded: true, lastWalk: -10, hp: 1 },
    index,
    0,
  );
  c.restore();
}
