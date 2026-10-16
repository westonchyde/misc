import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto(process.env.GAME_URL || "http://127.0.0.1:5173");
  await page.waitForFunction(
    () => window.battlefront.state.assets.ready,
    null,
    { timeout: 30000 },
  );
  const result = await page.evaluate(async () => {
    const { roster } = await import("/src/content.js"),
      { drawMoveImpact, drawProjectile } = await import("/src/effects.js"),
      { spriteCache, drawSprite, loadSprites } = await import(
        "/src/sprites.js"
      );
    if (!spriteCache.size) await loadSprites();
    const hash = (data) => {
      let h = 2166136261;
      for (const v of data) {
        h ^= v;
        h = Math.imul(h, 16777619);
      }
      return (h >>> 0).toString(16);
    };
    const spriteFrames = [...spriteCache].map(([id, s]) => ({
      id,
      count: s.frames.length,
      distinct: new Set(
        s.frames.map((f) =>
          hash(
            f.image.getContext("2d").getImageData(0, 0, s.width, s.height).data,
          ),
        ),
      ).size,
    }));
    const board = document.createElement("canvas");
    board.width = 1440;
    board.height = 1440;
    const c = board.getContext("2d");
    c.fillStyle = "#132633";
    c.fillRect(0, 0, 1440, 1440);
    const hashes = [];
    roster.forEach((s, si) =>
      s.moves.forEach((m, mi) => {
        const i = si * 2 + mi,
          x = (i % 6) * 240,
          y = Math.floor(i / 6) * 240;
        c.fillStyle = "#1d3441";
        c.fillRect(x + 4, y + 4, 232, 232);
        const sample = document.createElement("canvas");
        sample.width = 220;
        sample.height = 170;
        const sc = sample.getContext("2d");
        drawMoveImpact(sc, m.visual, 110, 125, 48, 0.38, 1, 1);
        hashes.push({
          id: m.id,
          hash: hash(sc.getImageData(0, 0, 220, 170).data),
        });
        c.drawImage(sample, x + 10, y + 28);
        drawSprite(c, s.id, x + 45, y + 205, 0.42, 1, 0.6, "attack", 0.5, m.id);
        if (!["relay", "burrow", "beam"].includes(m.kind))
          drawProjectile(c, m, x + 192, y + 55, 0.4, 0.2);
        c.fillStyle = m.color;
        c.font = "bold 12px system-ui";
        c.fillText(m.name, x + 13, y + 23);
        c.fillStyle = "#9fb7b9";
        c.font = "10px system-ui";
        c.fillText(`${s.name} / ${m.kind.toUpperCase()}`, x + 75, y + 220);
      }),
    );
    for (const child of document.body.children)
      if (child.tagName !== "SCRIPT") child.style.display = "none";
    document.body.append(board);
    document.body.style.margin = "0";
    board.style.width = "1440px";
    board.style.height = "1440px";
    return { spriteFrames, hashes };
  });
  assert.equal(result.spriteFrames.length, 18);
  assert.ok(
    result.spriteFrames.every((s) => s.count > 1 && s.distinct > 1),
    JSON.stringify(result.spriteFrames),
  );
  assert.equal(new Set(result.hashes.map((h) => h.hash)).size, 36);
  await page.screenshot({
    path: "/tmp/battlefront-move-catalog.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "Effect catalog passed: 36 distinct rendered move effects; all 18 original sprites have multiple distinct decoded animation frames.",
  );
} finally {
  await browser.close();
}
