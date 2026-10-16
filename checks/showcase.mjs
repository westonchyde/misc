import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const p = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await p.goto(process.env.GAME_URL || "http://127.0.0.1:5173/");
  await p.waitForFunction(() => window.battlefront.state.assets.ready);
  const result = await p.evaluate(async () => {
    const { Battle } = await import("/src/simulation.js"),
      { roster } = await import("/src/content.js"),
      { Renderer } = await import("/src/renderer.js"),
      { loadSprites } = await import("/src/sprites.js"),
      { aimAt } = await import("/src/targeting.js");
    await loadSprites();
    for (const child of document.body.children)
      if (child.tagName !== "SCRIPT") child.style.display = "none";
    const wrap = document.createElement("div");
    wrap.style.cssText = "width:1280px;margin:20px auto";
    document.body.append(wrap);
    const records = [];
    for (const [si, mi, frame] of [
      [0, 0, "flame"],
      [1, 0, "water"],
      [3, 0, "rock"],
      [17, 0, "dig"],
    ]) {
      const header = document.createElement("h2");
      header.textContent = roster[si].moves[mi].name;
      header.style.cssText =
        "font:700 22px system-ui;color:#e7efc7;margin:20px 0 8px";
      wrap.append(header);
      const c = document.createElement("canvas");
      c.width = 1280;
      c.height = 680;
      c.style.cssText = "width:1280px;display:block;border-radius:12px";
      wrap.append(c);
      const b = new Battle({
        seed: 42,
        landscape: "rolling",
        timer: false,
        mode: "practice",
        hp: 240,
        teams: [[si], [1]],
      });
      for (let i = 0; i < 60; i++) b.step();
      b.wind = 0;
      const aim = aimAt(
        b,
        roster[si].moves[mi],
        b.players[1].x,
        b.players[1].y,
      );
      b.commit(si, mi, aim.angle, aim.power);
      const r = new Renderer(c, {
        guide: false,
        reduced: false,
        history: false,
      });
      let captured = false;
      for (let i = 0; i < 1200; i++) {
        b.step();
        for (const e of b.events.splice(0)) r.event(e);
        r.tick(1 / 60);
        if (
          frame === "flame" &&
          b.phase === "attack" &&
          b.attack.progress > 0.49
        ) {
          captured = true;
          break;
        }
        if (
          frame === "water" &&
          b.phase === "flight" &&
          b.projectiles.some((p) => p.x > 750 && p.x < 850)
        ) {
          captured = true;
          break;
        }
        if (
          frame === "rock" &&
          b.phase === "flight" &&
          b.projectiles.some((p) => p.x > 750 && p.x < 850)
        ) {
          captured = true;
          break;
        }
        if (
          frame === "dig" &&
          b.phase === "attack" &&
          b.attack.progress > 0.42
        ) {
          captured = true;
          break;
        }
      }
      r.draw(
        b,
        {
          species: si,
          move: mi,
          angle: aim.angle,
          power: aim.power,
          facing: 1,
        },
        false,
      );
      records.push({
        move: roster[si].moves[mi].name,
        captured,
        phase: b.phase,
        progress: b.attack?.progress,
      });
    }
    return records;
  });
  await p.screenshot({
    path: "/tmp/battlefront-v4-attack-showcase.png",
    fullPage: true,
  });
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
