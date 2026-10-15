import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
const executablePath =
  process.env.CHROMIUM_PATH ||
  (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const url = process.env.GAME_URL || "http://127.0.0.1:5173";
const state = () => page.evaluate(() => window.battlefront.state);
async function ready(turn) {
  await page.waitForFunction(
    (t) =>
      window.battlefront.state.phase === "aim" &&
      window.battlefront.state.turn >= t,
    turn,
    { timeout: 20000 },
  );
}
try {
  await page.goto(url);
  await page.getByRole("heading", { name: "Pick your battle." }).waitFor();
  await page.screenshot({ path: "/tmp/battlefront-menu.png", fullPage: true });
  await page.locator("#settings").click();
  await page.locator("#motion-option").check();
  await page.locator("#volume-option").fill("22");
  await page.getByRole("button", { name: "Back to the field" }).click();
  await page.reload();
  await page.locator("#settings").click();
  assert.ok(await page.locator("#motion-option").isChecked());
  assert.equal(await page.locator("#volume-option").inputValue(), "22");
  await page.getByRole("button", { name: "Back to the field" }).click();
  await page.locator(".mode-card:has(input[value=practice])").click();
  await page.locator("#start").click();
  await ready(1);
  await page.screenshot({
    path: "/tmp/battlefront-battle.png",
    fullPage: true,
  });
  const r = await page.locator("#game").boundingBox();
  assert.ok(
    Math.abs(
      r.width / r.height -
        (await page.locator("#game").evaluate((c) => c.width / c.height)),
    ) < 0.02,
    "Canvas keeps correct aspect ratio",
  );
  const fireRect = await page.locator("#fire").boundingBox();
  assert.ok(
    fireRect.y + fireRect.height <= 1000,
    "Attack controls stay visible on a laptop screen",
  );
  await page.locator("#game").focus();
  const x = (await state()).positions[0].x;
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(200);
  await page.keyboard.up("KeyD");
  assert.ok((await state()).positions[0].x > x);
  const budget = (await state()).budget;
  await page.locator("#jump").click();
  await page.waitForTimeout(600);
  assert.ok((await state()).budget < budget);
  const timer = (await state()).timer;
  await page.locator("#pause").click();
  const paused = await state();
  await page.waitForTimeout(400);
  assert.deepEqual(await state(), paused);
  await page.locator("#resume").click();
  assert.equal((await state()).timer, timer);
  await page.locator("#help").click();
  await page.getByRole("heading", { name: "Know your ground." }).waitFor();
  await page.getByRole("button", { name: "Got it. Let’s battle →" }).click();
  // Every content definition is selected and fired through the real controls.
  const names = [
    "Charizard",
    "Blastoise",
    "Pikachu",
    "Golem",
    "Gengar",
    "Snorlax",
  ];
  let turn = 1;
  for (let species = 0; species < 6; species++)
    for (let move = 0; move < 2; move++) {
      await ready(turn);
      await page
        .getByRole("button", { name: names[species], exact: true })
        .click();
      await page.locator("#moves button").nth(move).click();
      if (await page.locator("#angle").isEnabled())
        await page.locator("#angle").fill("60");
      if (await page.locator("#power").isEnabled())
        await page.locator("#power").fill("30");
      if (await page.locator("#fire").isDisabled()) {
        await page.locator("#face-left").click();
      }
      await page.locator("#fire").click();
      await page.waitForFunction(
        () => window.battlefront.state.phase === "summon",
      );
      if (species === 0 && move === 0) {
        await page.waitForTimeout(740);
        await page.screenshot({
          path: "/tmp/battlefront-summon.png",
          fullPage: true,
        });
      }
      await ready(++turn);
      assert.equal((await state()).active, 0);
      console.log(`Browser move verified: ${names[species]} / ${move + 1}`);
    }
  assert.ok((await state()).terrainVersion > 0);
  await page.locator("#log-toggle").click();
  assert.ok((await page.locator("#battle-log li").count()) > 5);
  await page.getByRole("button", { name: "Close battle log" }).click();
  await page.locator("#pause").click();
  await page.locator("#return-menu").click();
  await page.locator(".mode-card:has(input[value=hotseat])").click();
  await page.locator("#timer-option").uncheck();
  await page.locator("#start").click();
  await ready(1);
  await page.locator("#pass").click();
  await ready(2);
  assert.equal((await state()).active, 1);
  assert.ok(await page.locator("#fire").isEnabled());
  await page.locator("#pause").click();
  await page.locator("#return-menu").click();
  await page.locator(".mode-card:has(input[value=solo])").click();
  await page.locator("#difficulty").selectOption("hard");
  await page.locator("#start").click();
  await ready(1);
  // Let the AI demonstrate actual damage, a complete victory, and rematch through the UI.
  for (let round = 0; round < 10; round++) {
    const s = await state();
    if (s.phase === "over") break;
    await page.locator("#pass").click();
    await page.waitForFunction(
      (turn) => {
        const s = window.battlefront.state;
        return (
          s.phase === "over" ||
          (s.phase === "aim" && s.active === 0 && s.turn > turn)
        );
      },
      s.turn,
      { timeout: 25000 },
    );
  }
  assert.equal((await state()).phase, "over");
  assert.equal((await state()).winner, 1);
  assert.ok((await state()).hp[0] <= 0);
  await page.locator("#result").waitFor({ state: "visible" });
  await page.screenshot({
    path: "/tmp/battlefront-results.png",
    fullPage: true,
  });
  await page.locator("#rematch").click();
  await ready(1);
  assert.deepEqual((await state()).hp, [140, 140]);
  await page.locator("#pause").click();
  await page.locator("#return-menu").click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/tmp/battlefront-mobile-menu.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.locator("#start").click();
  await page.screenshot({
    path: "/tmp/battlefront-mobile-battle.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  assert.deepEqual(errors, []);
  console.log(
    "Browser suite passed: settings persistence, menus, controls, pause, 12 moves, hot-seat handoff, AI victory, rematch, mobile overflow, no runtime errors.",
  );
} finally {
  await browser.close();
}
