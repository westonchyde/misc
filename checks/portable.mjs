import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
    viewport: { width: 1366, height: 900 },
    offline: true,
  }),
  errors = [],
  requests = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (/^https?:/.test(r.url())) requests.push(r.url());
});
try {
  // Administrator policy blocks file://. Load the exact portable bytes as a browser document.
  await page.setContent(
    await readFile(new URL("../play.html", import.meta.url), "utf8"),
  );
  await page.waitForFunction(
    () => window.battlefront?.state.assets.ready,
    null,
    { timeout: 30000 },
  );
  assert.equal(
    (await page.evaluate(() => window.battlefront.state)).assets.loaded,
    20,
  );
  await page.locator("#aim-style").selectOption("assisted");
  await page.locator(".mode-card:has(input[value=practice])").click();
  await page.locator("#start").click();
  await page.locator("#draft-random").click();
  await page.locator("#draft-begin").click();
  await page.waitForTimeout(500);
  const s = await page.evaluate(() => window.battlefront.state),
    r = s.positions[1],
    v = s.view,
    rect = await page.locator("#game").boundingBox();
  await page.mouse.click(
    rect.x + ((r.x * v.zoom + v.x) / 1280) * rect.width,
    rect.y + ((r.y * v.zoom + v.y) / v.height) * rect.height,
  );
  await page.locator("#fire").click();
  await page.waitForFunction(
    () => {
      const s = window.battlefront.state;
      return s.turn === 2 && s.phase === "aim";
    },
    null,
    { timeout: 20000 },
  );
  const final = await page.evaluate(() => window.battlefront.state);
  assert.ok(final.hp[1] < final.maxHP);
  assert.ok(final.terrainVersion > 0);
  assert.equal(final.active, 0);
  assert.deepEqual(requests, []);
  assert.deepEqual(errors, []);
  const fire = await page.locator("#fire").boundingBox();
  assert.ok(fire.y + fire.height <= 900);
  await page.screenshot({
    path: "/tmp/battlefront-v5-portable.png",
    fullPage: true,
  });
  console.log(
    "Portable build passed: all 20 animated sprites decoded offline; draft, aimed long-range attack, damage, terrain edit and turn handoff; zero HTTP requests and no runtime errors.",
  );
} finally {
  await browser.close();
}
