import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const state = () => page.evaluate(() => window.battlefront.state);
async function ready() {
  await page.waitForFunction(() => window.battlefront.state.assets.ready);
}
try {
  await page.goto(process.env.GAME_URL || "http://127.0.0.1:5173/");
  await ready();
  const silhouettes = [];
  for (const profile of [
    "rolling",
    "mountain",
    "valley",
    "peaks",
    "mesa",
    "basin",
    "islands",
  ]) {
    await page.locator("#landscape").selectOption(profile);
    silhouettes.push(
      await page.locator("#terrain-preview").evaluate((c) => c.toDataURL()),
    );
  }
  assert.equal(new Set(silhouettes).size, 7);
  await page.locator("#landscape").selectOption("mountain");
  await page.locator("#relief").selectOption("dramatic");
  await page.locator("#aim-style").selectOption("classic");
  await page.locator("summary").click();
  await page.locator("[data-profile=name]").nth(0).fill("Weston");
  await page.locator("[data-profile=name]").nth(0).dispatchEvent("change");
  await page
    .getByRole("button", { name: "Player 1 Fern outfit", exact: true })
    .click();
  await page.locator("[data-profile=style]").nth(0).selectOption("2");
  await page.locator("[data-profile=skin]").nth(0).selectOption("2");
  await page.reload();
  await ready();
  await page.locator("summary").click();
  assert.equal(
    await page.locator("[data-profile=name]").nth(0).inputValue(),
    "Weston",
  );
  assert.equal(
    await page.locator("[data-profile=style]").nth(0).inputValue(),
    "2",
  );
  await page.locator("#first-player").selectOption("1");
  await page.locator("#match-hp").selectOption("300");
  await page.locator("#timer-option").uncheck();
  await page.locator(".mode-card:has(input[value=hotseat])").click();
  await page.screenshot({
    path: "/tmp/battlefront-v4-customization.png",
    fullPage: true,
  });
  await page.locator("#start").click();
  const before = (await state()).draft.picks.length;
  await page
    .getByRole("button", { name: "Inspect Blastoise", exact: true })
    .click();
  assert.equal((await state()).draft.picks.length, before);
  assert.match(
    await page.locator("#inspect-details").innerText(),
    /Pressure stream/i,
  );
  await page.locator('[data-demo-move="1"]').click();
  assert.match(
    await page.locator("#inspect-details").innerText(),
    /Expanding pulse/i,
  );
  await page.locator("#draft-confirm").click();
  assert.equal((await state()).draft.picks.length, before + 1);
  await page.screenshot({
    path: "/tmp/battlefront-v4-draft-inspection.png",
    fullPage: true,
  });
  await page.locator("#draft-random").click();
  await page.locator("#draft-begin").click();
  await page.waitForTimeout(500);
  const s = await state();
  assert.equal(s.active, 1);
  assert.equal(s.opening, 1);
  assert.equal(s.maxHP, 300);
  assert.equal(s.profiles[0].palette, 2);
  assert.equal(s.landscape, "mountain");
  assert.equal(s.relief, "dramatic");
  assert.equal(s.aim.targeting, false);
  // Cycle short -> full -> direction only. Turning assistance off must not change camera scale.
  const viewBefore = s.view;
  await page.locator("#guide-toggle").click();
  await page.locator("#guide-toggle").click();
  await page.waitForTimeout(300);
  assert.equal((await state()).aim.guide, false);
  assert.equal((await state()).view.zoom, viewBefore.zoom);
  assert.equal((await state()).view.y, viewBefore.y);
  const gold = await page.locator("#game").evaluate((c) => {
    const data = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 0; i < data.length; i += 4)
      if (
        data[i] > 240 &&
        data[i + 1] > 225 &&
        data[i + 2] > 145 &&
        data[i + 2] < 190
      )
        n++;
    return n;
  });
  assert.ok(
    gold > 12,
    `direction arrow must remain drawn without prediction (gold pixels: ${gold})`,
  );
  await page.locator("#angle").fill("65");
  assert.equal(Math.round((await state()).selection.angle), 115);
  await page.screenshot({
    path: "/tmp/battlefront-v4-mountain-direction.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/tmp/battlefront-v4-mobile.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator("#pause").click();
  await page.locator("#return-menu").click();
  await page.locator("#learn").click();
  assert.equal((await state()).tutorial.step, 0);
  assert.ok(await page.locator("#lesson-next").isDisabled());
  await page.locator("#angle").fill("60");
  assert.ok(await page.locator("#lesson-next").isEnabled());
  await page.locator("#lesson-next").click();
  await page.locator("#power").fill("72");
  await page.locator("#lesson-next").click();
  assert.equal((await state()).tutorial.step, 2);
  await page.locator("#fire").click();
  await page.waitForFunction(
    () =>
      window.battlefront.state.turn >= 2 &&
      window.battlefront.state.phase === "aim",
    null,
    { timeout: 20000 },
  );
  await page.locator("#lesson-next").click();
  assert.equal((await state()).tutorial.step, 3);
  assert.ok((await state()).lastShots[0]);
  await page.locator("#angle").fill("40");
  await page.locator("#fire").click();
  await page.waitForFunction(
    () =>
      window.battlefront.state.turn >= 3 &&
      window.battlefront.state.phase === "aim",
    null,
    { timeout: 20000 },
  );
  await page.locator("#lesson-next").click();
  assert.equal((await state()).tutorial.step, 4);
  await page.screenshot({
    path: "/tmp/battlefront-v4-tutorial.png",
    fullPage: true,
  });
  await page.locator("#lesson-next").click();
  assert.equal((await state()).tutorial, null);
  assert.deepEqual(errors, []);
  console.log(
    "Revision browser checks passed: seven previews, saved pixel trainer profiles, map-aware inspection/confirmation, opening/HP settings, persistent aim arrow, camera stability, mobile layout, and complete interactive aiming lesson.",
  );
} finally {
  await browser.close();
}
