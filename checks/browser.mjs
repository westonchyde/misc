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
const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const state = () => page.evaluate(() => window.battlefront.state);
const ready = async (turn) =>
  page.waitForFunction(
    (t) => {
      const s = window.battlefront.state;
      return s.playing && s.phase === "aim" && s.turn >= t;
    },
    turn,
    { timeout: 25000 },
  );
async function targetRival() {
  await page.waitForTimeout(450);
  const s = await state(),
    r = s.positions[1 - s.active],
    v = s.view,
    rect = await page.locator("#game").boundingBox();
  await page.mouse.click(
    rect.x + ((r.x * v.zoom + v.x) / 1280) * rect.width,
    rect.y + ((r.y * v.zoom + v.y) / v.height) * rect.height,
  );
}
async function menu() {
  await page.locator("#pause").click();
  await page.locator("#return-menu").click();
}
async function randomDraft(mode) {
  await page.locator(`.mode-card:has(input[value=${mode}])`).click();
  await page.locator("#timer-option").uncheck();
  await page.locator("#start").click();
  await page.locator("#draft-random").click();
  assert.ok((await state()).draft.complete);
  await page.locator("#draft-begin").click();
  await ready(1);
}
try {
  await page.goto(process.env.GAME_URL || "http://127.0.0.1:5173");
  await page.waitForFunction(
    () => window.battlefront.state.assets.ready,
    null,
    { timeout: 30000 },
  );
  assert.equal((await state()).assets.loaded, 18);
  await page.screenshot({
    path: "/tmp/battlefront-v4-menu.png",
    fullPage: true,
  });
  await page.locator("#settings").click();
  await page.locator("#volume-option").fill("0");
  await page.locator("#motion-option").check();
  await page.getByRole("button", { name: "Back to the field" }).click();
  await page.reload();
  await page.waitForFunction(() => window.battlefront.state.assets.ready);
  await page.locator("#settings").click();
  assert.equal(await page.locator("#volume-option").inputValue(), "0");
  assert.ok(await page.locator("#motion-option").isChecked());
  await page.getByRole("button", { name: "Back to the field" }).click();
  await page.locator("#aim-style").selectOption("assisted");
  await page.locator("summary").click();
  await page.locator("#first-player").selectOption("0");
  await page.locator(".mode-card:has(input[value=hotseat])").click();
  await page.locator("#timer-option").uncheck();
  await page.locator("#start").click();
  assert.equal(await page.locator("#draft-pool button").count(), 18);
  assert.ok(await page.locator("#draft-begin").isDisabled());
  await page.screenshot({
    path: "/tmp/battlefront-v4-draft.png",
    fullPage: true,
  });
  for (let index = 0; index < 12; index++) {
    const before = (await state()).draft;
    await page.locator(`#draft-pool button[data-species="${index}"]`).click();
    assert.equal(
      (await state()).draft.picks.length,
      before.picks.length,
      "inspection must not commit a pick",
    );
    await page.locator("#draft-confirm").click();
    const after = (await state()).draft;
    assert.equal(
      after.teams[before.active].length,
      before.teams[before.active].length + 1,
    );
    assert.ok(await page.locator("#draft-confirm").isDisabled());
  }
  const teams = (await state()).draft.teams;
  assert.deepEqual(
    teams.map((t) => t.length),
    [6, 6],
  );
  assert.equal(new Set(teams.flat()).size, 12);
  await page.locator("#draft-begin").click();
  await ready(1);
  assert.deepEqual((await state()).teams, teams);
  assert.equal(await page.locator("#roster button").count(), 6);
  assert.ok(
    await page
      .getByRole("button", { name: "Charizard", exact: true })
      .isVisible(),
  );
  await page.screenshot({
    path: "/tmp/battlefront-v4-battle.png",
    fullPage: true,
  });
  await page.locator("#angle").fill("-20");
  await page.locator("#angle").focus();
  assert.equal((await state()).selection.angle, -20);
  const x = (await state()).positions[0].x;
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(120);
  await page.keyboard.up("KeyD");
  assert.ok((await state()).positions[0].x > x);
  await page.locator("#jump").click();
  await page.waitForTimeout(1200);
  assert.ok((await state()).budget < 125);
  await page.locator("#pause").click();
  const snapshot = await state();
  await page.waitForTimeout(400);
  const paused = await state();
  assert.deepEqual(paused.positions, snapshot.positions);
  assert.equal(paused.timer, snapshot.timer);
  assert.equal(paused.phase, snapshot.phase);
  await page.locator("#resume").click();
  await targetRival();
  await page.locator("#power").focus();
  await page.keyboard.press("Space");
  await page.waitForFunction(
    () => window.battlefront.state.phase === "attack",
    null,
    { timeout: 15000 },
  );
  await page.waitForTimeout(450);
  await page.screenshot({
    path: "/tmp/battlefront-v4-relay.png",
    fullPage: true,
  });
  await ready(2);
  assert.ok((await state()).hp[1] < (await state()).maxHP);
  assert.equal((await state()).ammo[0].flamethrower, 2);
  assert.equal((await state()).active, 1);
  await page.getByRole("button", { name: "Blastoise", exact: true }).click();
  await targetRival();
  await page.locator("#fire").click();
  await ready(3);
  assert.ok((await state()).hp[0] < (await state()).maxHP);
  await page.locator("#log-toggle").click();
  assert.ok((await page.locator("#battle-log li").count()) >= 4);
  await page.getByRole("button", { name: "Close battle log" }).click();
  await menu();
  // Solo drafting must make real CPU picks, including two consecutive snake picks.
  await page.locator(".mode-card:has(input[value=solo])").click();
  await page.locator("#difficulty").selectOption("hard");
  await page.locator("#start").click();
  await page
    .getByRole("button", { name: "Inspect Charizard", exact: true })
    .click();
  await page.locator("#draft-confirm").click();
  await page.waitForFunction(
    () => window.battlefront.state.draft.picks.length === 3,
    null,
    { timeout: 5000 },
  );
  assert.equal((await state()).draft.teams[1].length, 2);
  await page.locator("#draft-random").click();
  const first = (await state()).draft.teams;
  await page.locator("#draft-random").click();
  assert.notDeepEqual((await state()).draft.teams, first);
  await page.locator("#draft-begin").click();
  await ready(1);
  for (let round = 0; round < 24; round++) {
    const s = await state();
    if (s.phase === "over") break;
    await page.locator("#pass").click();
    await page.waitForFunction(
      (t) => {
        const s = window.battlefront.state;
        return (
          s.phase === "over" ||
          (s.phase === "aim" && s.active === 0 && s.turn > t)
        );
      },
      s.turn,
      { timeout: 25000 },
    );
  }
  assert.equal((await state()).phase, "over");
  assert.equal((await state()).winner, 1);
  await page.locator("#result").waitFor({ state: "visible" });
  await page.screenshot({
    path: "/tmp/battlefront-v4-results.png",
    fullPage: true,
  });
  const oldTeams = (await state()).teams,
    opening = (await state()).opening;
  assert.deepEqual((await state()).series.wins, [0, 1]);
  await page.locator("#rematch").click();
  await ready(1);
  assert.deepEqual((await state()).hp, [
    (await state()).maxHP,
    (await state()).maxHP,
  ]);
  assert.deepEqual((await state()).teams, oldTeams);
  assert.equal((await state()).opening, 1 - opening);
  assert.equal((await state()).series.round, 2);
  assert.deepEqual((await state()).series.wins, [0, 1]);
  await menu();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("input[name=team-mode][value=random]").check();
  await randomDraft("practice");
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: "/tmp/battlefront-v4-mobile.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "Browser suite passed: 18 real animated sprites, exclusive snake draft, CPU picks, random rerolls, drafted ownership, long-range relay and projectile hits, ammo, movement/aiming, pause, solo AI victory, rematch, preferences, mobile overflow, no page errors.",
  );
} finally {
  await browser.close();
}
