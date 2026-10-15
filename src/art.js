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
export function creature(
  c,
  id,
  x,
  feet,
  scale = 1,
  facing = 1,
  time = 0,
  action = "idle",
  progress = 0,
) {
  c.save();
  c.translate(x, feet);
  c.scale(scale * facing, scale);
  c.lineJoin = "round";
  c.lineCap = "round";
  const attack =
    action === "attack" ? Math.sin(Math.min(1, progress) * Math.PI) : 0;
  const breath = Math.sin(time * 3) * 1.3;
  c.translate(attack * 6, breath);
  oval(c, 0, 0, 38, 7, "#142d3e33");
  if (id === "charizard") {
    const flap = Math.sin(time * 5) * 6 - attack * 8;
    shape(
      c,
      [
        [-5, -54],
        [-43, -96 + flap],
        [-57, -46],
        [-32, -58],
        [-20, -37],
      ],
      "#f49a48",
    );
    shape(
      c,
      [
        [-15, -53],
        [-43, -84 + flap],
        [-48, -52],
        [-31, -64],
      ],
      "#428c91",
    );
    shape(
      c,
      [
        [7, -52],
        [35, -101 - flap],
        [56, -48],
        [34, -61],
        [21, -37],
      ],
      "#f49a48",
    );
    shape(
      c,
      [
        [15, -53],
        [35, -88 - flap],
        [47, -53],
        [33, -67],
      ],
      "#428c91",
    );
    line(
      c,
      [
        [-18, -13],
        [-39, -5],
        [-52, -22],
        [-50, -39],
      ],
      "#d27839",
      12,
    );
    shape(
      c,
      [
        [-57, -35],
        [-60, -48],
        [-52, -60 + Math.sin(time * 12) * 3],
        [-49, -51],
        [-43, -54],
        [-44, -37],
      ],
      "#ffb63b",
      "#bc622f",
      1.5,
    );
    shape(
      c,
      [
        [-54, -38],
        [-51, -51],
        [-47, -39],
      ],
      "#fff2a2",
      null,
    );
    oval(c, 0, -33, 24, 32, "#ed9647", ink);
    oval(c, 6, -28, 14, 23, "#f6d59a");
    shape(
      c,
      [
        [-7, -62],
        [-9, -88],
        [3, -80],
        [15, -90],
        [17, -68],
        [25, -61],
        [37, -60],
        [33, -48],
        [9, -46],
      ],
      "#f2a254",
    );
    eye(c, 14, -70, 4);
    line(
      c,
      [
        [12, -78],
        [20, -76],
      ],
      ink,
      2.5,
    );
    if (attack > 0.2) oval(c, 33, -53, 6, 5, "#6c3e36", ink, 1.4);
    else
      line(
        c,
        [
          [21, -53],
          [32, -54],
        ],
        "#8e5938",
        2,
      );
    line(
      c,
      [
        [-17, -47],
        [-28, -31],
        [-20, -26],
      ],
      "#d7803e",
      9,
    );
    line(
      c,
      [
        [19, -43],
        [29 + attack * 8, -35],
      ],
      "#f5a557",
      9,
    );
    oval(c, -16, -3, 12, 7, "#e8994d", ink);
    oval(c, 18, -3, 12, 7, "#e8994d", ink);
    for (const x of [-19, -14, 16, 21])
      shape(
        c,
        [
          [x, -3],
          [x + 3, 2],
          [x - 2, 2],
        ],
        "#f7e8cb",
        null,
      );
  } else if (id === "blastoise") {
    oval(c, -8, -39, 34, 38, "#755b49", ink);
    oval(c, -11, -41, 26, 30, "#9a7f62", "#d6c29a", 4);
    for (const a of [-1, 0, 1])
      line(
        c,
        [
          [-34, -42 + a * 15],
          [-9, -49 + a * 15],
          [12, -39 + a * 15],
        ],
        "#685344",
        2,
      );
    for (const x of [-26, 21]) {
      shape(
        c,
        [
          [x - 5, -54],
          [x - 3, -90 + attack * 5],
          [x + 9, -89 + attack * 5],
          [x + 10, -50],
        ],
        "#a6bdc7",
      );
      oval(c, x + 3, -89 + attack * 5, 7, 4, "#405364", ink, 1.5);
    }
    oval(c, 5, -32, 25, 33, "#69acd3", ink);
    oval(c, 14, -31, 16, 25, "#e9d7a8", ink, 1.8);
    for (let i = 0; i < 3; i++)
      line(
        c,
        [
          [2, -42 + i * 11],
          [26, -42 + i * 11],
        ],
        "#c7b88c",
        1.5,
      );
    oval(c, 11, -68, 20, 18, "#76bde0", ink);
    shape(
      c,
      [
        [22, -71],
        [37, -63],
        [32, -54],
        [10, -52],
      ],
      "#79bce0",
    );
    eye(c, 19, -73, 4);
    line(
      c,
      [
        [13, -81],
        [24, -79],
      ],
      ink,
      3,
    );
    line(
      c,
      [
        [23, -59],
        [32, -59],
      ],
      ink,
      1.6,
    );
    oval(c, -21, -30, 12, 19, "#70b5d6", ink);
    oval(c, 28 + attack * 4, -27, 11, 17, "#70b5d6", ink);
    oval(c, -14, -2, 14, 8, "#76b7d3", ink);
    oval(c, 23, -2, 14, 8, "#76b7d3", ink);
  } else if (id === "pikachu") {
    shape(
      c,
      [
        [-20, -20],
        [-43, -30],
        [-33, -45],
        [-51, -55],
        [-49, -69],
        [-24, -51],
        [-34, -36],
        [-15, -31],
      ],
      "#f9d44b",
    );
    oval(c, 0, -27, 22, 28, "#f5cf48", ink);
    line(
      c,
      [
        [-19, -24],
        [-10, -20],
      ],
      "#a87b42",
      6,
    );
    shape(
      c,
      [
        [-17, -56],
        [-28, -95],
        [-20, -103],
        [-5, -63],
      ],
      "#f8d74c",
    );
    shape(
      c,
      [
        [-25, -85],
        [-28, -95],
        [-20, -103],
        [-15, -86],
      ],
      ink,
      null,
    );
    shape(
      c,
      [
        [10, -59],
        [25, -100],
        [33, -96],
        [24, -56],
      ],
      "#f8d74c",
    );
    shape(
      c,
      [
        [22, -88],
        [25, -100],
        [33, -96],
        [30, -84],
      ],
      ink,
      null,
    );
    oval(c, 3, -58, 27, 23, "#ffe05b", ink);
    eye(c, -5, -61, 3.7, ink);
    eye(c, 16, -61, 3.7, ink);
    oval(c, -17, -49, 6, 5, "#ef7057");
    oval(c, 25, -49, 6, 5, "#ef7057");
    shape(
      c,
      [
        [5, -53],
        [10, -53],
        [8, -50],
      ],
      ink,
      null,
    );
    line(
      c,
      [
        [2, -46],
        [7, -43],
        [13, -46],
      ],
      "#745b36",
      1.8,
    );
    line(
      c,
      [
        [-17, -29],
        [-28 - attack * 8, -43],
      ],
      "#f5cc44",
      9,
    );
    line(
      c,
      [
        [18, -30],
        [29 + attack * 8, -43],
      ],
      "#f5cc44",
      9,
    );
    oval(c, -15, -2, 13, 6, "#e9bf3a", ink);
    oval(c, 15, -2, 13, 6, "#e9bf3a", ink);
  } else if (id === "golem") {
    oval(c, 0, -37, 39, 38, "#7d796c", ink, 3);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      shape(
        c,
        [
          [Math.cos(a) * 37, -37 + Math.sin(a) * 35],
          [Math.cos(a + 0.65) * 35, -37 + Math.sin(a + 0.65) * 34],
          [Math.cos(a + 0.32) * 17, -37 + Math.sin(a + 0.32) * 15],
        ],
        i % 2 ? "#b5aa8d" : "#9e957d",
        "#706e63",
        2,
      );
    }
    shape(
      c,
      [
        [-37, -30],
        [-51 - attack * 7, -18],
        [-44, -7],
        [-28, -19],
      ],
      "#adab8d",
    );
    shape(
      c,
      [
        [29, -31],
        [49 + attack * 7, -24],
        [47, -10],
        [31, -17],
      ],
      "#adab8d",
    );
    oval(c, 8, -49, 21, 18, "#b8b090", ink);
    eye(c, 4, -52, 3);
    eye(c, 19, -52, 3);
    line(
      c,
      [
        [0, -60],
        [9, -58],
      ],
      ink,
      3,
    );
    line(
      c,
      [
        [15, -58],
        [24, -61],
      ],
      ink,
      3,
    );
    line(
      c,
      [
        [0, -40],
        [22, -40],
      ],
      ink,
      2,
    );
    oval(c, -22, -1, 17, 9, "#a7a58b", ink);
    oval(c, 23, -1, 17, 9, "#a7a58b", ink);
  } else if (id === "gengar") {
    c.translate(0, Math.sin(time * 4) * 3 - 5);
    shape(
      c,
      [
        [-30, -44],
        [-37, -75],
        [-17, -64],
        [-7, -79],
        [3, -66],
        [17, -77],
        [22, -59],
        [36, -67],
        [30, -36],
      ],
      "#9070c5",
    );
    oval(c, 0, -33, 36, 34, "#9372c6", ink, 3);
    oval(c, 10, -26, 22, 21, "#9d7dd1");
    shape(
      c,
      [
        [-31, -35],
        [-51 - attack * 6, -20],
        [-44, -12],
        [-24, -21],
      ],
      "#9372c6",
    );
    shape(
      c,
      [
        [30, -36],
        [48 + attack * 9, -30],
        [52, -18],
        [30, -19],
      ],
      "#9372c6",
    );
    shape(
      c,
      [
        [-24, -48],
        [-5, -42],
        [-13, -34],
        [-22, -37],
      ],
      "#ff8aa9",
    );
    shape(
      c,
      [
        [7, -42],
        [26, -49],
        [24, -36],
        [14, -33],
      ],
      "#ff8aa9",
    );
    line(
      c,
      [
        [-17, -43],
        [-14, -37],
      ],
      "#8d325f",
      3,
    );
    line(
      c,
      [
        [17, -41],
        [18, -36],
      ],
      "#8d325f",
      3,
    );
    shape(
      c,
      [
        [-24, -27],
        [-7, -23],
        [10, -23],
        [27, -30],
        [19, -9],
        [-10, -6],
      ],
      "#fff0d6",
    );
    for (const x of [-14, -3, 9, 20])
      line(
        c,
        [
          [x, -25],
          [x - 2, -9],
        ],
        "#aa8aab",
        1.2,
      );
    oval(c, -22, 0, 15, 7, "#8261b4", ink);
    oval(c, 22, 0, 15, 7, "#8261b4", ink);
  } else if (id === "snorlax") {
    oval(c, 0, -35, 42, 40, "#497e85", ink, 3);
    oval(c, 4, -29, 32, 32, "#f2e4bd", ink, 2);
    shape(
      c,
      [
        [-30, -60],
        [-33, -91],
        [-13, -79],
        [15, -79],
        [33, -92],
        [30, -57],
      ],
      "#497e85",
    );
    oval(c, 0, -65, 29, 22, "#f1e5c3", ink);
    shape(
      c,
      [
        [-9, -83],
        [0, -73],
        [8, -83],
      ],
      "#497e85",
      null,
    );
    line(
      c,
      [
        [-20, -66],
        [-11, -64],
        [-6, -66],
      ],
      ink,
      2.5,
    );
    line(
      c,
      [
        [8, -66],
        [16, -64],
        [22, -67],
      ],
      ink,
      2.5,
    );
    line(
      c,
      [
        [-7, -54],
        [8, -54],
      ],
      ink,
      2,
    );
    shape(
      c,
      [
        [-4, -54],
        [-1, -49],
        [1, -54],
      ],
      "#fff",
      null,
    );
    oval(c, -35 - attack * 7, -33, 15, 25, "#477d83", ink);
    oval(c, 36 + attack * 7, -32, 15, 25, "#477d83", ink);
    oval(c, -26, 0, 20, 12, "#e1d5b2", ink);
    oval(c, 26, 0, 20, 12, "#e1d5b2", ink);
    oval(c, -26, 1, 9, 6, "#b69a84");
    oval(c, 26, 1, 9, 6, "#b69a84");
  }
  c.restore();
}
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
