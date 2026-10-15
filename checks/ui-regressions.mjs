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
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
try {
  await page.goto(process.env.GAME_URL || "http://127.0.0.1:5173");
  await page.locator("#settings").click();
  await page.locator("#volume-option").fill("0");
  await page.getByRole("button", { name: "Back to the field" }).click();
  await page.reload();
  await page.locator("#settings").click();
  assert.equal(await page.locator("#volume-option").inputValue(), "0");
  await page.getByRole("button", { name: "Back to the field" }).click();
  await page.locator(".mode-card:has(input[value=practice])").click();
  await page.locator("#start").click();
  await page.waitForTimeout(400);
  const rect = await page.locator("#game").boundingBox();
  await page.mouse.click(rect.x + rect.width * 0.08, rect.y + 30);
  assert.equal(
    (await page.evaluate(() => window.battlefront.state)).selection.facing,
    -1,
  );
  await page.mouse.click(rect.x + rect.width * 0.9, rect.y + 50);
  assert.equal(
    (await page.evaluate(() => window.battlefront.state)).selection.facing,
    1,
  );
  await page.locator("#angle").fill("-20");
  assert.equal(
    (await page.evaluate(() => window.battlefront.state)).selection.angle,
    -20,
  );
  await page.locator("#angle").fill("40");
  await page.locator("#angle").focus();
  const x = (await page.evaluate(() => window.battlefront.state)).positions[0]
    .x;
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(120);
  await page.keyboard.up("KeyD");
  assert.ok(
    (await page.evaluate(() => window.battlefront.state)).positions[0].x > x,
  );
  await page.keyboard.press("Space");
  await page.waitForFunction(() => window.battlefront.state.phase === "summon");
  console.log(
    "UI regressions passed: zero-volume persistence, camera-aware pointer aiming, keyboard movement and firing after slider focus.",
  );
} finally {
  await browser.close();
}
