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
});
const errors = [],
  requests = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (/^https?:/.test(r.url())) requests.push(r.url());
});
try {
  // Cloud Chromium blocks file:// navigation by administrator policy.
  // Validate the same standalone bytes as a document without a server or network.
  await page.setContent(
    await readFile(new URL("../play.html", import.meta.url), "utf8"),
  );
  await page.getByRole("heading", { name: "Pick your battle." }).waitFor();
  await page.locator(".mode-card:has(input[value=practice])").click();
  await page.locator("#start").click();
  await page.locator("#fire").click();
  await page.waitForFunction(
    () =>
      window.battlefront.state.turn === 2 &&
      window.battlefront.state.phase === "aim",
    null,
    { timeout: 20000 },
  );
  assert.ok(
    (await page.evaluate(() => window.battlefront.state)).terrainVersion > 0,
  );
  const stage = await page.locator("#game").boundingBox(),
    fire = await page.locator("#fire").boundingBox();
  assert.ok(
    Math.abs(
      stage.width / stage.height -
        (await page.locator("#game").evaluate((c) => c.width / c.height)),
    ) < 0.02,
  );
  assert.ok(fire.y + fire.height <= 900);
  await page.screenshot({
    path: "/tmp/battlefront-portable.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  console.log(
    "Portable build passed: standalone HTML document, offline, zero HTTP requests, summon → terrain impact → next turn, correct responsive camera proportions, visible attack controls, no runtime errors.",
  );
} finally {
  await browser.close();
}
