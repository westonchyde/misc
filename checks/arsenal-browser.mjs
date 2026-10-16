import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const state = () => page.evaluate(() => window.battlefront.state);
const ready = (t) =>
  page.waitForFunction(
    (t) => {
      const s = window.battlefront.state;
      return s.phase === "aim" && s.turn >= t;
    },
    t,
    { timeout: 30000 },
  );
async function target() {
  await page.waitForTimeout(400);
  const s = await state(),
    p = s.positions[1],
    v = s.view,
    r = await page.locator("#game").boundingBox();
  await page.mouse.click(
    r.x + ((p.x * v.zoom + v.x) / 1280) * r.width,
    r.y + ((p.y * v.zoom + v.y) / v.height) * r.height,
  );
}
try {
  await page.goto(process.env.GAME_URL || "http://127.0.0.1:5173");
  await page.waitForFunction(() => window.battlefront.state.assets.ready);
  await page.locator(".mode-card:has(input[value=hotseat])").click();
  await page.locator("#aim-style").selectOption("assisted");
  await page.locator("summary").click();
  await page.locator("#first-player").selectOption("0");
  await page.locator("#match-hp").selectOption("500");
  await page.locator("#start").click();
  // Deliberate legal snake draft: terrain, water, rescue and precision on the same team.
  for (const index of [3, 0, 2, 1, 18, 4, 5, 19, 6, 7, 8, 9]) {
    await page.locator(`#draft-pool button[data-species="${index}"]`).click();
    if (index === 19)
      assert.match(
        await page.locator("#inspect-details").innerText(),
        /100.*DIRECT ONLY/,
      );
    await page.locator("#draft-confirm").click();
  }
  await page.locator("#draft-begin").click();
  await ready(1);
  assert.equal((await state()).world.width, 2560);
  assert.equal((await state()).maxHP, 500);
  const aim = (await state()).selection;
  await page.locator("#camera-in").click();
  await page.waitForTimeout(500);
  assert.ok((await state()).view.zoom > 0.5);
  const mini = await page.locator("#minimap").boundingBox();
  await page.mouse.click(mini.x + mini.width * 0.8, mini.y + mini.height * 0.6);
  await page.waitForTimeout(400);
  assert.deepEqual(
    (await state()).selection,
    aim,
    "camera controls must not alter aim",
  );
  await page.locator("#camera-auto").click();
  await page.getByRole("button", { name: "Golem", exact: true }).click();
  await page.locator("#moves button").nth(1).click();
  await target();
  await page.locator("#fire").click();
  await ready(2);
  const pit = (await state()).positions[1];
  assert.ok((await state()).terrainVersion > 0);
  // Local hotseat pass gives the first player another legal attack.
  await page.locator("#pass").click();
  await ready(3);
  await page.getByRole("button", { name: "Blastoise", exact: true }).click();
  await page.locator("#moves button").nth(1).click();
  await target();
  const before = (await state()).hp[1];
  await page.locator("#fire").click();
  await page.waitForFunction(
    () => window.battlefront.state.pools.length > 0,
    null,
    { timeout: 20000 },
  );
  let maximum = 0;
  for (let n = 0; n < 35; n++) {
    const s = await state();
    maximum = Math.max(maximum, ...s.pools.map((p) => p.damage[1]));
    if (maximum >= 20) {
      await page.screenshot({
        path: "/tmp/battlefront-v5-water-pit.png",
        fullPage: true,
      });
      break;
    }
    await page.waitForTimeout(120);
  }
  await ready(4);
  const waterDamage = before - (await state()).hp[1];
  assert.ok(
    waterDamage >= 20,
    `pit should retain repeated water damage, got ${waterDamage}`,
  );
  assert.equal(waterDamage % 10, 0);
  assert.equal((await state()).pools.length, 0);
  await page.locator("#pass").click();
  await ready(5);
  await page.getByRole("button", { name: "Dugtrio", exact: true }).click();
  assert.ok(await page.locator("#angle").isDisabled());
  assert.ok(await page.locator("#power").isDisabled());
  const start = (await state()).positions[0].x,
    hp = (await state()).hp[1];
  await page.locator("#fire").click();
  await ready(6);
  assert.ok((await state()).positions[0].x > start + 150);
  assert.equal((await state()).hp[1], hp);
  await page.locator("#pass").click();
  await ready(7);
  await page.getByRole("button", { name: "Octillery", exact: true }).click();
  assert.ok(await page.locator("#power").isDisabled());
  assert.ok(!(await page.locator("#angle").isDisabled()));
  assert.match(await page.locator("#description").innerText(), /100/);
  await page.screenshot({
    path: "/tmp/battlefront-v5-arsenal.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      world: (await state()).world,
      pit,
      waterDamage,
      rescueDistance: (await state()).positions[0].x - start,
      errors,
    }),
  );
} finally {
  await browser.close();
}
