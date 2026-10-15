import "./style.css";
import { Battle, W, H, DT, RULES, traceShot } from "./simulation.js";
import { roster, maps, BALLISTIC, difficultyProfiles } from "./content.js";
import { creature } from "./art.js";
import { Renderer, drawMapThumbnail, drawHero } from "./renderer.js";
import { planShot, movementPlan } from "./ai.js";
import { AudioFX } from "./audio.js";
import { aimAt } from "./targeting.js";
import { Draft, TEAM_SIZE } from "./draft.js";
import { loadSprites, spriteStatus, spriteURL } from "./sprites.js";

const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const defaults = {
  version: 1,
  sound: false,
  volume: 0.35,
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  guide: true,
  targeting: true,
  map: "highlands",
  difficulty: "normal",
};
let saved = {};
try {
  const value = JSON.parse(localStorage.getItem("battlefront.settings"));
  if (value?.version === 1) saved = value;
} catch {
  /* Storage may be disabled. */
}
const prefs = { ...defaults, ...saved };
if (!maps.some((m) => m.id === prefs.map)) prefs.map = "highlands";
prefs.volume = Number.isFinite(Number(prefs.volume))
  ? Math.max(0, Math.min(1, Number(prefs.volume)))
  : 0.35;
function savePrefs() {
  try {
    localStorage.setItem("battlefront.settings", JSON.stringify(prefs));
  } catch {
    /* Play still works without storage. */
  }
}
const audio = new AudioFX(prefs),
  renderer = new Renderer($("#game"), prefs);
let battle = null,
  playing = false,
  mapId = prefs.map,
  matchOptions,
  ai = null;
let selections = [],
  keys = new Set(),
  pointerMove = 0,
  last = 0,
  accumulator = 0,
  hudTick = 0,
  hudPhase = "",
  heroTick = 0,
  shownSpecies = -1;
const freshSelections = () =>
  battle.players.map((p, i) => ({
    species: p.team[0],
    move: 0,
    angle: i ? 135 : 45,
    power: 55,
    facing: i ? -1 : 1,
  }));
const current = () => selections[battle?.active || 0];
const modalOpen = () => !!$("dialog[open]");
const human = () =>
  !!battle && !(battle.options.mode === "solo" && battle.active === 1);
const canInput = () => playing && !modalOpen() && human() && battle.canAct();
function setElevation(value) {
  const s = current(),
    elevation = Math.max(-65, Math.min(85, value));
  s.angle = s.facing === 1 ? elevation : 180 - elevation;
}
function face(direction) {
  if (!canInput()) return;
  const s = current(),
    elevation = s.facing === 1 ? s.angle : 180 - s.angle;
  s.facing = direction;
  s.angle = direction === 1 ? elevation : 180 - elevation;
  battle.players[battle.active].facing = direction;
  updateHUD();
}
function chooseSpecies(index) {
  if (!canInput() || !battle.players[battle.active].team.includes(index))
    return;
  current().species = index;
  current().move = 0;
  buildMoves();
  updateHUD();
}
function chooseMove(index) {
  if (!canInput()) return;
  current().move = index;
  updateHUD();
}
function fire() {
  if (!canInput()) return;
  audio.unlock();
  const s = current();
  if (battle.commit(s.species, s.move, s.angle, s.power)) {
    keys.clear();
    pointerMove = 0;
  }
  updateHUD();
}
function closeDialogs() {
  $$("dialog[open]").forEach((d) => d.close());
  keys.clear();
  pointerMove = 0;
}
function openDialog(id) {
  keys.clear();
  pointerMove = 0;
  if (!$(`#${id}`).open) $(`#${id}`).showModal();
}
function start(options) {
  closeDialogs();
  matchOptions = options;
  battle = new Battle(options);
  playing = true;
  selections = freshSelections();
  ai = null;
  shownSpecies = -1;
  renderer.clear();
  keys.clear();
  document.body.classList.add("in-battle");
  $("#home").hidden = true;
  $("#draft-screen").hidden = true;
  $("#battle-screen").hidden = false;
  $("#pause").hidden = false;
  $("#map-name").textContent = maps.find((m) => m.id === options.map).name;
  $("#map-tag").textContent =
    `${maps.find((m) => m.id === options.map).tag} / SEED ${options.seed}`;
  $("#stage-tag").textContent = maps
    .find((m) => m.id === options.map)
    .name.toUpperCase();
  $("#mode-name").textContent = {
    solo: "SOLO EXPEDITION",
    hotseat: "LOCAL HOT-SEAT",
    practice: "TARGET PRACTICE",
  }[options.mode];
  buildRoster();
  buildMoves();
  updateHUD();
  audio.unlock();
  window.scrollTo({ top: 0, behavior: "instant" });
  $("#game").focus({ preventScroll: true });
}
function home() {
  clearTimeout(draftTimer);
  closeDialogs();
  $("#draft-screen").hidden = true;
  playing = false;
  document.body.classList.remove("in-battle");
  $("#home").hidden = false;
  $("#battle-screen").hidden = true;
  $("#pause").hidden = true;
  ai = null;
  window.scrollTo({ top: 0, behavior: "instant" });
}
function buildMaps() {
  $("#map-picker").innerHTML = "";
  maps.forEach((m) => {
    const button = document.createElement("button");
    button.className = `map-option ${m.id === mapId ? "selected" : ""}`;
    button.setAttribute("aria-pressed", String(m.id === mapId));
    const el = document.createElement("canvas");
    el.width = 180;
    el.height = 85;
    drawMapThumbnail(el.getContext("2d"), m.id);
    button.append(
      el,
      document.createTextNode(
        m.name
          .replace("Verdant ", "")
          .replace("Copper ", "")
          .replace("Moonlit ", ""),
      ),
    );
    button.title = m.name;
    button.onclick = () => {
      mapId = m.id;
      prefs.map = mapId;
      savePrefs();
      buildMaps();
    };
    $("#map-picker").append(button);
  });
  $("#map-description").textContent = maps.find(
    (m) => m.id === mapId,
  ).description;
}
function buildRoster() {
  if (!battle) return;
  $("#roster").innerHTML = "";
  battle.players[battle.active].team.forEach((index, slot) => {
    const species = roster[index],
      button = document.createElement("button");
    button.className = "partner";
    button.dataset.species = index;
    button.style.setProperty("--partner", species.color);
    button.title = `${slot + 1} · ${species.name} · ${species.role}`;
    button.setAttribute("aria-label", species.name);
    button.innerHTML = `<span class="number">${slot + 1}</span><img src="${spriteURL(species.id)}" alt="" draggable="false"><strong>${species.name}</strong><small>${species.element}</small>`;
    button.onclick = () => chooseSpecies(index);
    $("#roster").append(button);
  });
}
function buildMoves() {
  if (!battle) return;
  const s = current();
  shownSpecies = s.species;
  $("#moves").innerHTML = "";
  roster[s.species].moves.forEach((m, i) => {
    const button = document.createElement("button");
    button.className = "move-button";
    button.setAttribute("aria-label", m.name);
    button.innerHTML = `<strong>${m.name}</strong><small>${m.kind === "salvo" ? `${m.damage} × ${m.count}` : `${m.damage} DMG`} · ${m.kind === "relay" ? "RELAY" : m.kind.toUpperCase()}</small><small class="cooldown"></small>`;
    button.onclick = () => chooseMove(i);
    $("#moves").append(button);
  });
}
let signatures = ["", ""];
function updateHUD() {
  if (!battle || !playing) return;
  const s = current(),
    p = battle.players[battle.active],
    m = roster[s.species].moves[s.move];
  if (shownSpecies !== s.species) buildMoves();
  battle.players.forEach((player, i) => {
    const signature = `${player.hp}|${player.wet}|${player.burn}|${player.curse}|${player.poison}|${player.chill}|${player.weaken}|${battle.active}|${player.name}|${battle.turn}`;
    const el = $(`#p${i}`);
    el.classList.toggle(
      "active",
      i === battle.active && battle.phase !== "over",
    );
    if (signatures[i] !== signature || !el.children.length) {
      signatures[i] = signature;
      const opponent =
        i === 1 && battle.options.mode === "solo"
          ? "CPU TRAINER"
          : i === 1 && battle.options.mode === "practice"
            ? "PRACTICE TARGET"
            : `PLAYER ${i + 1}`;
      el.innerHTML = `<div class="name-row"><span class="player-name">${i ? "◆" : "●"} ${player.name}</span><span class="hp-value">${player.hp} <small>/ ${RULES.hp} HP</small></span></div><div class="health-track" role="meter" aria-label="${player.name} health" aria-valuemin="0" aria-valuemax="${RULES.hp}" aria-valuenow="${player.hp}"><i style="width:${(player.hp / RULES.hp) * 100}%"></i></div><div class="status-row"><span>${opponent}</span>${player.wet ? `<span class="status-pill">WET ${player.wet}</span>` : ""}${player.burn ? `<span class="status-pill">BURN ${player.burn}</span>` : ""}${player.curse ? '<span class="status-pill">CURSED</span>' : ""}${player.poison ? `<span class="status-pill">POISON ${player.poison}</span>` : ""}${player.chill ? '<span class="status-pill">CHILLED</span>' : ""}${player.weaken ? '<span class="status-pill">WEAKENED</span>' : ""}</div>`;
    }
  });
  $("#turn-label").textContent = `TURN ${String(battle.turn).padStart(2, "0")}`;
  $("#turn-owner").textContent =
    battle.phase === "over" ? "MATCH COMPLETE" : `${p.name}’S TURN`;
  $("#wind").textContent =
    `${battle.wind < 0 ? "←" : "→"} Wind ${Math.abs(battle.wind)}`;
  $("#timer").textContent =
    battle.options.timer && battle.options.mode !== "practice"
      ? `◷ ${Math.max(0, Math.ceil(battle.timer))}s`
      : "◷ No timer";
  $("#timer").classList.toggle("urgent", battle.timer < 10);
  const phaseText = {
    aim: !human()
      ? "River is reading the terrain…"
      : "Choose your partner. Make your mark.",
    summon: `${p.name}: “${battle.summon?.species.name}, I choose you!”`,
    flight: `${battle.currentMove?.name} — watch the landing!`,
    attack: `${battle.currentMove?.name}!`,
    settle: "The battlefield is settling…",
    recall: "Great work. Return!",
    handoff: `${p.name}, you’re up.`,
    over: "The dust has settled.",
  };
  $("#announcement").textContent = phaseText[battle.phase];
  $("#turn-banner").textContent =
    battle.phase === "handoff"
      ? `${p.name} · YOUR TURN`
      : battle.phase === "summon"
        ? `${battle.summon.species.name.toUpperCase()} / ${battle.currentMove.name.toUpperCase()}`
        : !human() && battle.phase === "aim"
          ? "RIVER IS PLANNING A SHOT"
          : "";
  $("#movement").textContent =
    `↔ ${Math.round(battle.budget)} / ${RULES.movement} movement`;
  [...$("#roster").children].forEach((button, i) => {
    button.classList.toggle("selected", +button.dataset.species === s.species);
    button.setAttribute(
      "aria-pressed",
      String(+button.dataset.species === s.species),
    );
    button.disabled = !canInput();
  });
  [...$("#moves").children].forEach((button, i) => {
    const move = roster[s.species].moves[i],
      cd = p.cooldowns[move.id] || 0;
    button.classList.toggle("selected", i === s.move);
    button.setAttribute("aria-pressed", String(i === s.move));
    button.disabled = !canInput();
    const shots = p.ammo[move.id];
    button.querySelector(".cooldown").textContent =
      `${shots} SHOT${shots === 1 ? "" : "S"}${cd ? ` · WAIT ${cd} TURN${cd === 1 ? "" : "S"}` : move.cooldown ? ` · ${move.cooldown} TURN RECHARGE` : ""}`;
    button.classList.toggle("exhausted", shots === 0);
  });
  $("#description").textContent = m.description;
  $("#angle").value = s.facing === 1 ? s.angle : 180 - s.angle;
  $("#angle-value").textContent = `${Math.round(+$("#angle").value)}°`;
  $("#power").value = s.power;
  $("#power-value").textContent = `${Math.round(s.power)}%`;
  const usesPower = BALLISTIC.has(m.kind);
  $("#power").disabled = !canInput() || !usesPower;
  $("#power-label").style.opacity = usesPower ? "1" : ".4";
  $("#angle").disabled = !canInput();
  $("#face-left").classList.toggle("selected", s.facing === -1);
  $("#face-right").classList.toggle("selected", s.facing === 1);
  $("#face-left").disabled = $("#face-right").disabled = !canInput();
  const cd = p.cooldowns[m.id] || 0;
  const exhausted = !(p.ammo[m.id] > 0);
  $("#fire").disabled = !canInput() || cd > 0 || exhausted;
  $("#fire-reason").textContent = !human()
    ? "The computer is taking its turn"
    : battle.phase !== "aim"
      ? "Resolving attack — controls return next turn"
      : exhausted
        ? "Out of shots. Choose another move."
        : cd
          ? `Recharges in ${cd} turn${cd === 1 ? "" : "s"}. Choose another.`
          : usesPower
            ? `${p.ammo[m.id]} shots left · SPACE to commit`
            : "Full-arena beam · power fixed · SPACE to commit";
  $("#pass").disabled = !canInput();
  ["#move-left", "#move-right", "#jump"].forEach((id) => {
    $(id).disabled = !canInput() || battle.budget <= 0;
  });
  $("#guide-toggle").setAttribute("aria-pressed", String(prefs.guide));
}
function tickAI() {
  if (!playing || modalOpen() || human() || battle.phase !== "aim") {
    if (battle?.phase !== "aim") ai = null;
    return;
  }
  if (!ai) ai = { time: 0, plan: null, moved: false, walking: 0 };
  ai.time += DT;
  if (ai.time < 0.6) return;
  if (!ai.plan) {
    ai.plan = planShot(battle);
    if (!ai.plan) {
      battle.pass();
      ai = null;
      return;
    }
    const movement = !ai.moved ? movementPlan(battle, ai.plan) : null;
    if (movement) {
      ai.walking = movement.steps;
      ai.direction = movement.direction;
      ai.moved = true;
      battle.addLog(`RIVER moves to ${movement.reason}.`);
    }
    const s = current();
    s.species = ai.plan.species;
    s.move = ai.plan.moveIndex;
    s.angle = ai.plan.angle;
    s.power = ai.plan.power;
    s.facing = s.angle <= 90 ? 1 : -1;
    buildMoves();
  }
  if (ai.walking > 0) {
    if (ai.direction) battle.move(ai.direction);
    ai.walking--;
    if (ai.walking === 0) {
      ai.plan = null;
      ai.time = 0.3;
    }
    return;
  }
  if (ai.time > 1.5) {
    const plan = ai.plan;
    if (!battle.commit(plan.species, plan.moveIndex, plan.angle, plan.power))
      battle.pass();
    ai = null;
  }
}
function handleEvents() {
  for (const event of battle.events.splice(0)) {
    renderer.event(event);
    audio.event(event);
    if (event.type === "turn") {
      ai = null;
      shownSpecies = -1;
      buildRoster();
      keys.clear();
      pointerMove = 0;
    }
    if (event.type === "victory") {
      $("#winner").textContent =
        battle.winner === -1
          ? "A perfect draw."
          : `${battle.players[battle.winner].name} wins!`;
      $("#result-subtitle").textContent =
        battle.options.mode === "practice"
          ? "Practice makes a better trainer."
          : `A rivalry settled in ${battle.turn} turns. Ready for another?`;
      $("#result-stats").innerHTML = battle.players
        .map(
          (p) =>
            `<div><strong>${p.name}</strong><p>${p.hp} HP remaining<br>${p.damage} damage dealt<br>${p.shots} summons</p></div>`,
        )
        .join("");
      openDialog("result");
    }
  }
}
function showSettings() {
  $("#sound-option").checked = prefs.sound;
  $("#volume-option").value = prefs.volume * 100;
  $("#volume-value").textContent = `${Math.round(prefs.volume * 100)}%`;
  $("#motion-option").checked = prefs.reduced;
  $("#guide-option").checked = prefs.guide;
  $("#targeting-option").checked = prefs.targeting;
  openDialog("settings-dialog");
}
let draft = null,
  draftOptions = null,
  draftTimer = null;
function showDraft() {
  if (!spriteStatus.ready) return;
  playing = false;
  clearTimeout(draftTimer);
  signatures = ["", ""];
  draftOptions = {
    mode: $("input[name=mode]:checked").value,
    map: mapId,
    seed: Math.max(
      1,
      Math.min(999999, Math.floor(Number($("#seed").value) || 42)),
    ),
    difficulty: $("#difficulty").value,
    timer: $("#timer-option").checked,
  };
  draft = new Draft(
    draftOptions.seed,
    draftOptions.mode,
    draftOptions.difficulty,
  );
  if ($("input[name=team-mode]:checked").value === "random") draft.randomize();
  $("#home").hidden = true;
  $("#battle-screen").hidden = true;
  $("#draft-screen").hidden = false;
  $("#pause").hidden = true;
  document.body.classList.remove("in-battle");
  renderDraft();
  window.scrollTo({ top: 0, behavior: "instant" });
}
function renderDraft() {
  clearTimeout(draftTimer);
  const cpu = !draft.complete && draft.mode !== "hotseat" && draft.active === 1;
  $("#draft-turn").textContent = draft.complete
    ? "TEAMS READY · SIX PARTNERS EACH"
    : `${draft.active === 0 ? "EMBER" : "RIVER"} PICKS${cpu ? " · CPU IS THINKING…" : ""} · PICK ${draft.picks.length + 1} / 12`;
  $("#draft-last").textContent = draft.picks.length
    ? `Last pick: ${roster[draft.picks.at(-1)].name}`
    : "Choose coverage, combos and a few heavy hitters.";
  for (let owner = 0; owner < 2; owner++) {
    $(`#draft-count-${owner}`).textContent =
      `${draft.teams[owner].length} / ${TEAM_SIZE}`;
    $(`#draft-team-${owner}`).innerHTML = Array.from(
      { length: TEAM_SIZE },
      (_, i) => {
        const index = draft.teams[owner][i],
          s = roster[index];
        return s
          ? `<div class="draft-slot filled"><img src="${spriteURL(s.id)}" alt=""><span>${s.name}</span></div>`
          : `<div class="draft-slot"><b>${i + 1}</b><span>YOUR PICK</span></div>`;
      },
    ).join("");
  }
  $("#draft-pool").innerHTML = "";
  for (const index of draft.pool) {
    const s = roster[index],
      picked = draft.picks.includes(index),
      button = document.createElement("button");
    button.className = "draft-card";
    button.style.setProperty("--partner", s.color);
    button.dataset.species = index;
    button.disabled = cpu || picked || draft.complete;
    button.setAttribute("aria-label", `Draft ${s.name}`);
    button.innerHTML = `<span class="draft-type">${s.element}</span><img src="${spriteURL(s.id)}" alt="" draggable="false"><strong>${s.name}</strong><small>${s.role}</small><span class="draft-moves">${s.moves.map((m) => m.name).join(" / ")}</span>${picked ? `<span class="picked-label">${draft.teams[0].includes(index) ? "EMBER" : "RIVER"} PICK</span>` : ""}`;
    button.onclick = () => {
      if (draft.pick(index)) {
        audio.unlock();
        audio.tone(470, 640, 0.12);
        renderDraft();
      }
    };
    $("#draft-pool").append(button);
  }
  $("#draft-begin").disabled = !draft.complete;
  $("#draft-help").textContent = draft.complete
    ? "Your drafted moves have limited shots. Make them count."
    : "Snake order: Ember → River → River → Ember. Both moves come with each pick.";
  if (draft.complete) $("#draft-begin").focus({ preventScroll: true });
  else if (!cpu)
    $("#draft-pool button:not(:disabled)")?.focus({ preventScroll: true });
  if (cpu)
    draftTimer = setTimeout(() => {
      draft.cpuPick();
      renderDraft();
    }, 480);
}
$("#start").onclick = showDraft;
$("#draft-begin").onclick = () => {
  if (draft.complete) {
    clearTimeout(draftTimer);
    start({ ...draftOptions, teams: draft.teams.map((t) => [...t]) });
  }
};
$("#draft-back").onclick = home;
$("#draft-reset").onclick = () => {
  draft = new Draft(draft.seed, draft.mode, draft.difficulty);
  renderDraft();
};
$("#draft-random").onclick = () => {
  draft.randomize();
  renderDraft();
};
$$("input[name=team-mode]").forEach(
  (input) =>
    (input.onchange = () => {
      $("#start").innerHTML =
        $("input[name=team-mode]:checked").value === "draft"
          ? "Draft your team <span>→</span>"
          : "Review random teams <span>→</span>";
    }),
);
$$("input[name=mode]").forEach(
  (el) =>
    (el.onchange = () => {
      $("#difficulty-label").hidden =
        $("input[name=mode]:checked").value !== "solo";
    }),
);
$("#difficulty").value = prefs.difficulty;
$("#difficulty").onchange = () => {
  prefs.difficulty = $("#difficulty").value;
  savePrefs();
  $("#difficulty-description").textContent =
    difficultyProfiles[$("#difficulty").value].description;
};
$("#brand").onclick = (e) => {
  e.preventDefault();
  if (playing) openDialog("pause-dialog");
  else home();
};
$("#help").onclick = () => openDialog("help-dialog");
$("#settings").onclick = showSettings;
$$("[data-close]").forEach(
  (button) => (button.onclick = () => $(`#${button.dataset.close}`).close()),
);
$("#pause").onclick = () => openDialog("pause-dialog");
$("#resume").onclick = () => $("#pause-dialog").close();
$("#restart").onclick = $("#rematch").onclick = () => {
  signatures = ["", ""];
  start(matchOptions);
};
$("#return-menu").onclick = $("#result-menu").onclick = home;
$("#result").addEventListener("cancel", (e) => e.preventDefault());
$("#sound-option").onchange = (e) => {
  prefs.sound = e.target.checked;
  savePrefs();
  audio.unlock();
  audio.tone(440, 660, 0.2);
};
$("#volume-option").oninput = (e) => {
  prefs.volume = +e.target.value / 100;
  $("#volume-value").textContent = `${e.target.value}%`;
  savePrefs();
};
$("#motion-option").onchange = (e) => {
  prefs.reduced = e.target.checked;
  savePrefs();
};
$("#guide-option").onchange = (e) => {
  prefs.guide = e.target.checked;
  savePrefs();
};
$("#targeting-option").onchange = (e) => {
  prefs.targeting = e.target.checked;
  savePrefs();
};
$("#guide-toggle").onclick = () => {
  prefs.guide = !prefs.guide;
  savePrefs();
  updateHUD();
};
$("#log-toggle").onclick = () => {
  $("#battle-log").innerHTML = battle.log
    .map((message) => `<li>${message}</li>`)
    .join("");
  openDialog("log-dialog");
};
$("#face-left").onclick = () => face(-1);
$("#face-right").onclick = () => face(1);
$("#angle").oninput = (e) => {
  if (canInput()) {
    setElevation(+e.target.value);
    updateHUD();
  }
};
$("#power").oninput = (e) => {
  if (canInput()) {
    current().power = +e.target.value;
    updateHUD();
  }
};
$("#fire").onclick = fire;
$("#pass").onclick = () => {
  if (canInput()) {
    battle.pass();
    updateHUD();
  }
};
$("#jump").onclick = () => {
  if (canInput()) battle.jump();
};
for (const [id, dir] of [
  ["#move-left", -1],
  ["#move-right", 1],
]) {
  $(id).addEventListener("pointerdown", (e) => {
    if (!canInput()) return;
    e.preventDefault();
    pointerMove = dir;
    $(id).setPointerCapture(e.pointerId);
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) =>
    $(id).addEventListener(type, () => {
      pointerMove = 0;
    }),
  );
}
function pointerAim(e) {
  if (!canInput()) return;
  const rect = $("#game").getBoundingClientRect(),
    point = renderer.worldPoint(
      ((e.clientX - rect.left) * W) / rect.width,
      ((e.clientY - rect.top) * $("#game").height) / rect.height,
    ),
    x = point.x,
    y = point.y,
    p = battle.players[battle.active],
    s = current();
  s.facing = x >= p.x ? 1 : -1;
  if (prefs.targeting && !e.shiftKey) {
    const target = aimAt(battle, roster[s.species].moves[s.move], x, y);
    s.angle = target.angle;
    s.power = target.power;
  } else {
    const elevation =
      (Math.atan2(p.y - 42 - y, Math.abs(x - p.x)) * 180) / Math.PI;
    setElevation(elevation);
    s.power = Math.round(
      Math.max(20, Math.min(100, Math.hypot(x - p.x, y - p.y) / 4.5)),
    );
  }
  p.facing = s.facing;
  updateHUD();
}
$("#game").addEventListener("pointerdown", (e) => {
  if (!canInput()) return;
  e.preventDefault();
  $("#game").focus({ preventScroll: true });
  $("#game").setPointerCapture(e.pointerId);
  pointerAim(e);
});
$("#game").addEventListener("pointermove", (e) => {
  if (e.buttons === 1) pointerAim(e);
});
$("#fullscreen").onclick = async () => {
  try {
    if (!document.fullscreenElement) await document.body.requestFullscreen();
    else await document.exitFullscreen();
  } catch {
    $("#announcement").textContent =
      "Fullscreen is unavailable in this browser. You can still play normally.";
  }
};
window.addEventListener("keydown", (e) => {
  if (e.code === "Escape" && playing && !modalOpen()) {
    e.preventDefault();
    openDialog("pause-dialog");
    return;
  }
  if (
    !canInput() ||
    e.target.matches("select,textarea,input:not([type=range])")
  )
    return;
  if (e.target.matches("input[type=range]") && e.code.startsWith("Arrow"))
    return;
  const controls = [
    "KeyA",
    "KeyD",
    "KeyW",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Space",
    "KeyQ",
    "KeyE",
    "KeyF",
    "Digit1",
    "Digit2",
    "Digit3",
    "Digit4",
    "Digit5",
    "Digit6",
  ];
  if (!controls.includes(e.code)) return;
  e.preventDefault();
  keys.add(e.code);
  if (e.repeat) return;
  if (e.code === "Space") fire();
  if (e.code === "KeyW") battle.jump();
  if (e.code === "KeyF") face(-current().facing);
  if (e.code === "KeyQ") chooseMove(0);
  if (e.code === "KeyE") chooseMove(1);
  if (/^Digit[1-6]$/.test(e.code))
    chooseSpecies(battle.players[battle.active].team[+e.code.at(-1) - 1]);
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => {
  keys.clear();
  pointerMove = 0;
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && playing && !modalOpen() && battle.phase !== "over")
    openDialog("pause-dialog");
});
function frame(now) {
  const elapsed = Math.min(0.1, (now - last) / 1000 || 0);
  last = now;
  accumulator += elapsed;
  while (accumulator >= DT) {
    if (playing && !modalOpen()) {
      if (canInput()) {
        if (keys.has("KeyA") || pointerMove === -1) battle.move(-1);
        if (keys.has("KeyD") || pointerMove === 1) battle.move(1);
        if (keys.has("ArrowLeft"))
          setElevation(
            (current().facing === 1 ? current().angle : 180 - current().angle) +
              0.5,
          );
        if (keys.has("ArrowRight"))
          setElevation(
            (current().facing === 1 ? current().angle : 180 - current().angle) -
              0.5,
          );
        if (keys.has("ArrowUp"))
          current().power = Math.min(100, current().power + 0.4);
        if (keys.has("ArrowDown"))
          current().power = Math.max(20, current().power - 0.4);
      }
      tickAI();
      battle.step();
      handleEvents();
      renderer.tick(DT);
    }
    accumulator -= DT;
  }
  if (playing) {
    renderer.draw(battle, current(), human());
    hudTick += elapsed;
    if (hudTick > 0.08 || hudPhase !== battle.phase) {
      updateHUD();
      hudTick = 0;
      hudPhase = battle.phase;
    }
  } else if (!$("#home").hidden) {
    heroTick += elapsed;
    if (heroTick > 1 / 15) {
      drawHero($("#hero-art").getContext("2d"), prefs.reduced ? 0 : now / 1000);
      heroTick = 0;
    }
  }
  requestAnimationFrame(frame);
}
buildMaps();
$("#difficulty-description").textContent = (
  difficultyProfiles[prefs.difficulty] || difficultyProfiles.normal
).description;
$("#start").disabled = true;
loadSprites()
  .then(() => {
    $("#asset-status").textContent =
      "18 original animated sprites loaded · works offline";
    $("#start").disabled = false;
  })
  .catch((error) => {
    $("#asset-status").textContent =
      `Sprites could not load: ${error.message}. Reload the game.`;
  });
drawHero($("#hero-art").getContext("2d"));
requestAnimationFrame(frame);
// Read-only telemetry: browser checks exercise real UI commands, never mutate simulation state.
window.battlefront = {
  get state() {
    return playing && battle
      ? {
          playing,
          teams: battle.players.map((p) => [...p.team]),
          ammo: battle.players.map((p) => ({ ...p.ammo })),
          assets: { ...spriteStatus },
          view: renderer.view
            ? { ...renderer.view, height: $("#game").height }
            : null,
          phase: battle.phase,
          turn: battle.turn,
          active: battle.active,
          hp: battle.players.map((p) => p.hp),
          positions: battle.players.map((p) => ({
            x: p.x,
            y: p.y,
            grounded: p.grounded,
          })),
          terrainVersion: battle.terrain.version,
          budget: battle.budget,
          timer: battle.timer,
          mode: battle.options.mode,
          selection: { ...current() },
          log: [...battle.log],
          winner: battle.winner,
        }
      : {
          playing: false,
          assets: { ...spriteStatus },
          draft: draft
            ? {
                teams: draft.teams.map((t) => [...t]),
                active: draft.active,
                complete: draft.complete,
                picks: [...draft.picks],
              }
            : null,
        };
  },
};
