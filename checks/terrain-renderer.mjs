import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  await page.goto(process.env.GAME_URL || "http://127.0.0.1:5173");
  await page.waitForFunction(() => window.battlefront?.state.assets.ready);
  const result = await page.evaluate(async () => {
    const { Battle, W, H } = await import("/src/simulation.js"),
      { Renderer } = await import("/src/renderer.js");
    const b = new Battle({ timer: false, mode: "practice" }),
      inc = new Renderer(document.createElement("canvas"), {}),
      full = new Renderer(document.createElement("canvas"), {}),
      timings = [];
    inc.cacheTerrain(b);
    for (const [x, y, r, fill] of [
      [600, 590, 85, 0],
      [610, 570, 50, 1],
      [1300, 620, 180, 0],
      [2030, 690, 110, 0],
      [900, 380, 45, 2],
    ]) {
      b.terrain.circle(x, y, r, fill);
      const t = performance.now();
      inc.cacheTerrain(b);
      timings.push(performance.now() - t);
      full.terrain = null;
      full.cacheTerrain(b);
      const a = inc.lc.getImageData(0, 0, W, H).data,
        c = full.lc.getImageData(0, 0, W, H).data;
      let differences = 0,
        maxDelta = 0,
        samples = [];
      for (let i = 0; i < a.length; i++)
        if (a[i] !== c[i]) {
          differences++;
          maxDelta = Math.max(maxDelta, Math.abs(a[i] - c[i]));
          if (samples.length < 8)
            samples.push({
              x: Math.floor(i / 4) % W,
              y: Math.floor(i / 4 / W),
              channel: i % 4,
              a: a[i],
              c: c[i],
            });
        }
      if (differences)
        return {
          match: false,
          differences,
          maxDelta,
          samples,
          edit: [x, y, r, fill],
        };
    }
    return {
      match: true,
      edits: timings.length,
      incrementalMs: timings.map((v) => Math.round(v * 10) / 10),
    };
  });
  assert.ok(result.match, JSON.stringify(result));
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
