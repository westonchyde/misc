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
  value = value && typeof value === "object" ? value : {};
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
// Six-head-tall human proportions: small head, shoulders, articulated arms and long legs.
const frameCache = new Map();
function paint(c, profile, pose, frame) {
  const col = palettes[profile.palette],
    skin = skins[profile.skin],
    ink = "#202939",
    shade = ["#c18a68", "#af7856", "#81533f", "#51362f"][profile.skin];
  const r = (x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
  };
  const poly = (points, color) => {
    c.fillStyle = color;
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fill();
  };
  const walk = pose === "walk" ? [0, 2, 0, -2][frame % 4] : 0,
    bob = pose === "walk" ? frame % 2 : 0;
  // Rear backpack and shoulder strap.
  poly(
    [
      [7, 20 + bob],
      [10, 18 + bob],
      [13, 21 + bob],
      [12, 34 + bob],
      [7, 34 + bob],
      [6, 30 + bob],
    ],
    ink,
  );
  r(7, 23 + bob, 5, 9, col.dark);
  r(7, 24 + bob, 2, 6, col.main);
  r(7, 31 + bob, 4, 1, "#ac8a65");
  // Long separated trouser legs, knees and compact shoes.
  for (const [x, dx, dy] of [
    [12, -walk, Math.max(0, walk)],
    [19, walk, Math.max(0, -walk)],
  ]) {
    poly(
      [
        [x, 32],
        [x + 5, 32],
        [x + 5 + dx, 41],
        [x + 4 + dx, 51 - dy],
        [x + dx, 51 - dy],
        [x - 1 + dx, 42],
      ],
      ink,
    );
    poly(
      [
        [x + 1, 33],
        [x + 4, 33],
        [x + 3 + dx, 41],
        [x + 3 + dx, 49 - dy],
        [x + 1 + dx, 49 - dy],
      ],
      "#455569",
    );
    r(x + 2 + dx, 39, 2, 4, "#687d8d");
    r(x + dx, 49 - dy, 7, 3, ink);
    r(x + dx + 1, 49 - dy, 5, 2, "#dadbd2");
    r(x + dx + 1, 51 - dy, 6, 1, "#85999f");
  }
  // Jacket, tapered waist, hem, undershirt and zipper.
  poly(
    [
      [11, 18 + bob],
      [23, 18 + bob],
      [25, 24 + bob],
      [23, 34 + bob],
      [12, 34 + bob],
      [9, 24 + bob],
    ],
    ink,
  );
  poly(
    [
      [12, 19 + bob],
      [21, 19 + bob],
      [23, 25 + bob],
      [21, 32 + bob],
      [13, 32 + bob],
      [11, 24 + bob],
    ],
    col.main,
  );
  poly(
    [
      [12, 19 + bob],
      [16, 19 + bob],
      [15, 29 + bob],
      [12, 30 + bob],
    ],
    col.light,
  );
  r(16, 20 + bob, 4, 12, "#ebe7cd");
  r(17, 20 + bob, 1, 10, "#fff7df");
  r(20, 22 + bob, 2, 8, col.dark);
  r(13, 32 + bob, 9, 2, col.dark);
  r(17, 32 + bob, 2, 1, "#eac071");
  r(11, 21 + bob, 2, 10, "#c4b48b");
  r(12, 26 + bob, 2, 5, "#8f725e");
  // Neck, small 3/4 head, ear, brow, nose, mouth and shaded jaw.
  r(15, 15 + bob, 5, 5, ink);
  r(16, 15 + bob, 3, 4, skin);
  r(15, 7 + bob, 8, 10, ink);
  r(15, 6 + bob, 6, 2, ink);
  r(16, 8 + bob, 6, 8, skin);
  r(15, 9 + bob, 2, 5, shade);
  r(15, 10 + bob, 2, 3, skin);
  r(21, 10 + bob, 2, 4, skin);
  r(19, 9 + bob, 3, 1, "#5b463e");
  r(20, 10 + bob, 1, 2, "#192a37");
  r(22, 12 + bob, 1, 2, skin);
  r(20, 15 + bob, 2, 1, shade);
  r(16, 16 + bob, 4, 1, shade);
  if (profile.style === 0) {
    r(14, 4 + bob, 8, 4, ink);
    r(15, 4 + bob, 6, 3, col.main);
    r(15, 4 + bob, 4, 1, col.light);
    r(14, 7 + bob, 11, 2, ink);
    r(15, 7 + bob, 10, 1, col.light);
    r(19, 5 + bob, 2, 2, "#ede5c8");
  } else if (profile.style === 1) {
    r(15, 4 + bob, 6, 4, ink);
    r(14, 6 + bob, 3, 4, "#4f3b35");
    r(16, 4 + bob, 4, 2, "#775343");
    r(15, 7 + bob, 8, 2, col.main);
    r(16, 7 + bob, 6, 1, col.light);
    r(13, 8 + bob, 2, 5, col.dark);
  } else {
    r(15, 3 + bob, 7, 4, ink);
    r(16, 3 + bob, 5, 3, col.main);
    r(16, 3 + bob, 4, 1, col.light);
    r(12, 7 + bob, 13, 2, ink);
    r(13, 7 + bob, 11, 1, col.light);
    r(14, 9 + bob, 2, 6, "#5d4236");
  }
  // Rear arm stays behind torso; front arm uses an elbow and a small hand.
  const limb = (sx, sy, ex, ey, hx, hy) => {
    c.strokeStyle = ink;
    c.lineWidth = 4;
    c.lineJoin = "round";
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(sx, sy);
    c.lineTo(ex, ey);
    c.lineTo(hx, hy);
    c.stroke();
    c.strokeStyle = skin;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(sx, sy + 2);
    c.lineTo(ex, ey);
    c.lineTo(hx, hy);
    c.stroke();
    r(hx - 1, hy - 1, 3, 3, skin);
  };
  limb(11, 23 + bob, 8, 28 + bob - walk, 10, 34 + bob - walk);
  let elbow = [25, 27 + bob],
    hand = [24, 34 + bob + walk];
  if (pose === "throw") {
    [elbow, hand] = [
      [
        [25, 18],
        [22, 10],
      ],
      [
        [27, 20],
        [31, 17],
      ],
      [
        [26, 26],
        [29, 29],
      ],
    ][frame % 3];
  }
  if (pose === "victory") {
    elbow = [25, 15];
    hand = [24, 7];
  }
  if (pose === "jump") {
    elbow = [26, 23];
    hand = [28, 18];
  }
  if (pose === "hurt") {
    elbow = [25, 26];
    hand = [20, 29];
  }
  limb(23, 22 + bob, ...elbow, ...hand);
  r(22, 21 + bob, 3, 4, col.main);
  r(22, 21 + bob, 2, 2, col.light);
  if (pose === "idle" || (pose === "throw" && frame === 0)) {
    r(hand[0], hand[1], 3, 3, ink);
    r(hand[0] + 1, hand[1], 2, 1, "#ee7269");
    r(hand[0] + 1, hand[1] + 1, 2, 1, "#f6e6ce");
  }
  // Crisp native pixels; no softened polygon edges when enlarged.
  const data = c.getImageData(0, 0, 36, 56);
  for (let i = 3; i < data.data.length; i += 4)
    data.data[i] = data.data[i] > 110 ? 255 : 0;
  c.putImageData(data, 0, 0);
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
    walking = p.grounded && time - p.lastWalk < 0.13;
  let pose =
      p.hurt > 0 ? "hurt" : !p.grounded ? "jump" : walking ? "walk" : "idle",
    frame = walking ? Math.floor(p.walk * 1.2) % 4 : 0;
  if (active && phase === "summon") {
    pose = "throw";
    frame = phaseTime < 0.18 ? 0 : phaseTime < 0.42 ? 1 : 2;
  }
  if (phase === "over" && p.hp > 0) {
    pose = "victory";
    frame = 0;
  }
  const key = `${profile.palette}:${profile.skin}:${profile.style}:${pose}:${frame}`;
  let sprite = frameCache.get(key);
  if (!sprite) {
    sprite = document.createElement("canvas");
    sprite.width = 36;
    sprite.height = 56;
    paint(sprite.getContext("2d"), profile, pose, frame);
    frameCache.set(key, sprite);
  }
  c.save();
  c.translate(Math.round(p.x), Math.round(p.y + 19));
  c.scale(p.facing || 1, 1);
  c.fillStyle = "#18313d55";
  c.beginPath();
  c.ellipse(0, 1, 16, 4, 0, 0, Math.PI * 2);
  c.fill();
  c.imageSmoothingEnabled = false;
  c.drawImage(sprite, -29, -88, 59, 92);
  c.restore();
}
export function trainerPortrait(canvas, profile, index = 0) {
  const c = canvas.getContext("2d");
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.save();
  c.translate(canvas.width / 2, canvas.height - 8);
  c.scale(1.25, 1.25);
  drawTrainer(
    c,
    { x: 0, y: -19, profile, facing: 1, grounded: true, lastWalk: -10, hp: 1 },
    index,
    0,
  );
  c.restore();
}
