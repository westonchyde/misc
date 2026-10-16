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
import { landscapes } from "./landscapes.js";
import {
  cleanProfile,
  palettes,
  skins,
  hairstyles,
  trainerPortrait,
} from "./trainers.js";

const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const defaults = {
  version: 2,
  sound: false,
  volume: 0.35,
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  guide: true,
  guideLength: "short",
  targeting: false,
  history: true,
  landscape: "rolling",
  relief: "normal",
  hp: 240,
  profiles: [cleanProfile({}, 0), cleanProfile({}, 1)],
  map: "highlands",
  difficulty: "normal",
};
let saved = {};
try {
  const value = JSON.parse(localStorage.getItem("battlefront.settings"));
  if ([1, 2].includes(value?.version)) saved = value;
} catch {
  /* Storage may be disabled. */
}
const prefs = { ...defaults, ...saved, version: 2 };
if (saved.version === 1) prefs.guideLength = "full";
prefs.profiles = [0, 1].map((i) => cleanProfile(prefs.profiles?.[i], i));
if (!landscapes.some((p) => p.id === prefs.landscape))
  prefs.landscape = "rolling";
if (!difficultyProfiles[prefs.difficulty]) prefs.difficulty = "normal";
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
  roundRecorded = false;
  $("#tutorial-card").hidden = !tutorial;
  $("#shot-summary").textContent = "";
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
    `${landscapes.find((l) => l.id === battle.terrain.profile)?.name.toUpperCase()} / SEED ${options.seed}`;
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
  tutorial = null;
  demo = null;
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
    drawMapThumbnail(
      el.getContext("2d"),
      m.id,
      Number($("#seed").value) || 42,
      prefs.landscape,
      prefs.relief,
    );
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
  $("#map-description").textContent =
    maps.find((m) => m.id === mapId).name + " · scenery";
  drawMapThumbnail(
    $("#terrain-preview").getContext("2d"),
    mapId,
    Number($("#seed").value) || 42,
    prefs.landscape,
    prefs.relief,
  );
  $("#landscape-hint").textContent = landscapes.find(
    (l) => l.id === prefs.landscape,
  ).hint;
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
let series = null,
  roundRecorded = false,
  tutorial = null,
  inspected = 0,
  inspectMove = 0,
  demo = null;
const demoRenderer = new Renderer($("#inspect-preview"), {
  reduced: true,
  guide: false,
  history: false,
});
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
      el.innerHTML = `<div class="name-row"><span class="player-name">${i ? "◆" : "●"} ${player.name}</span><span class="hp-value">${player.hp} <small>/ ${battle.maxHP} HP</small></span></div><div class="health-track" role="meter" aria-label="${player.name} health" aria-valuemin="0" aria-valuemax="${battle.maxHP}" aria-valuenow="${player.hp}"><i style="width:${(player.hp / battle.maxHP) * 100}%"></i></div><div class="status-row"><span>${opponent}</span>${player.wet ? `<span class="status-pill">WET ${player.wet}</span>` : ""}${player.burn ? `<span class="status-pill">BURN ${player.burn}</span>` : ""}${player.curse ? '<span class="status-pill">CURSED</span>' : ""}${player.poison ? `<span class="status-pill">POISON ${player.poison}</span>` : ""}${player.chill ? '<span class="status-pill">CHILLED</span>' : ""}${player.weaken ? '<span class="status-pill">WEAKENED</span>' : ""}</div>`;
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
      ? `${p.name} is reading the terrain…`
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
          ? `${p.name} IS PLANNING A SHOT`
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
  $("#guide-toggle").textContent = prefs.guide
    ? `◎ ${prefs.guideLength === "short" ? "Short arc" : "Full guide"}`
    : "◎ Direction only";
  const last = battle.lastShots[battle.active];
  $("#shot-summary").textContent = last
    ? `Previous shot · ${roster[last.species].moves[last.move].name} · ${Math.round(last.angle <= 90 ? last.angle : 180 - last.angle)}° / ${Math.round(last.power)}%${prefs.targeting ? " · Assisted aiming" : " · Classic aiming"}`
    : `${prefs.targeting ? "ASSISTED · click a landing area to solve an arc" : "CLASSIC · adjust angle and power; the arrow stays visible"} · ${battle.players[battle.opening].name} opened${series ? ` · Round ${series.round}` : ""}`;
  updateLesson();
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
      battle.addLog(
        `${battle.players[battle.active].name} moves to ${movement.reason}.`,
      );
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
      if (!roundRecorded && series && battle.winner >= 0) {
        series.wins[battle.winner]++;
        roundRecorded = true;
      }
      const complete = series && Math.max(...series.wins) >= series.target;
      $("#series-score").textContent =
        series && series.target > 1
          ? `${battle.players[0].name} ${series.wins[0]} — ${series.wins[1]} ${battle.players[1].name}${complete ? " · SERIES COMPLETE" : " · FIRST TO TWO"}`
          : "";
      $("#rematch").textContent = complete
        ? "New series →"
        : series?.target > 1
          ? "Next round →"
          : "Rematch →";
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
  $("#guide-length").value = prefs.guideLength;
  $("#history-option").checked = prefs.history !== false;
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
  tutorial = null;
  demo = null;
  inspected = 0;
  inspectMove = 0;
  prefs.hp = +$("#match-hp").value;
  savePrefs();
  const seed = Math.max(
    1,
    Math.min(999999, Math.floor(Number($("#seed").value) || 42)),
  );
  const first =
    $("#first-player").value === "random"
      ? (Math.imul(seed, 2654435761) >>> 4) % 2
      : +$("#first-player").value;
  series = {
    wins: [0, 0],
    target: $("#series-option").checked ? 2 : 1,
    round: 1,
  };
  draftOptions = {
    landscape: prefs.landscape,
    relief: prefs.relief,
    profiles: prefs.profiles.map((p) => ({ ...p })),
    hp: prefs.hp,
    first,
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
    { landscape: draftOptions.landscape },
  );
  if ($("input[name=team-mode]:checked").value === "random") draft.randomize();
  $("#home").hidden = true;
  $("#battle-screen").hidden = true;
  $("#draft-screen").hidden = false;
  $("#pause").hidden = true;
  document.body.classList.remove("in-battle");
  drawMapThumbnail(
    $("#draft-map-preview").getContext("2d"),
    mapId,
    seed,
    prefs.landscape,
    prefs.relief,
  );
  $("#draft-map-name").textContent =
    landscapes.find((l) => l.id === prefs.landscape).name +
    " · " +
    maps.find((m) => m.id === mapId).name;
  $("#draft-map-info").textContent =
    `${landscapes.find((l) => l.id === prefs.landscape).hint} Seed ${seed} · ${prefs.hp} HP · ${prefs.profiles[first].name} opens.`;
  renderDraft();
  inspectSpecies(inspected);
  window.scrollTo({ top: 0, behavior: "instant" });
}
function renderDraft() {
  clearTimeout(draftTimer);
  const cpu = !draft.complete && draft.mode !== "hotseat" && draft.active === 1;
  $("#draft-turn").textContent = draft.complete
    ? "TEAMS READY · SIX PARTNERS EACH"
    : `${draftOptions.profiles[draft.active].name.toUpperCase()} PICKS${cpu ? " · CPU IS THINKING…" : ""} · PICK ${draft.picks.length + 1} / 12`;
  $("#draft-order").textContent =
    `A shared snake draft: ${draftOptions.profiles[0].name}, ${draftOptions.profiles[1].name}, ${draftOptions.profiles[1].name}, ${draftOptions.profiles[0].name}. Inspect first, then confirm a pick.`;
  $("#draft-last").textContent = draft.picks.length
    ? `Last pick: ${roster[draft.picks.at(-1)].name}`
    : "Choose coverage, combos and a few heavy hitters.";
  for (let owner = 0; owner < 2; owner++) {
    $(`#draft-name-${owner}`).textContent =
      `${owner ? "◆" : "●"} ${draftOptions.profiles[owner].name.toUpperCase()}`;
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
    const types = new Set(
      draft.teams[owner].flatMap((s) => roster[s].moves.map((m) => m.family)),
    );
    let coverage = $(`#draft-team-${owner}`).parentElement.querySelector(
      ".team-coverage",
    );
    if (!coverage) {
      coverage = document.createElement("p");
      coverage.className = "team-coverage";
      $(`#draft-team-${owner}`).after(coverage);
    }
    coverage.textContent = types.size
      ? `Coverage · ${[...types].slice(0, 5).join(" / ")}`
      : "Inspect a Pokémon to see how its moves work.";
  }
  $("#draft-pool").innerHTML = "";
  for (const index of draft.pool) {
    const s = roster[index],
      picked = draft.picks.includes(index),
      button = document.createElement("button");
    button.className = `draft-card ${index === inspected ? "inspecting" : ""}`;
    button.style.setProperty("--partner", s.color);
    button.dataset.species = index;
    button.disabled = cpu;
    button.setAttribute("aria-label", `Inspect ${s.name}`);
    button.innerHTML = `<span class="draft-type">${s.element}</span><img src="${spriteURL(s.id)}" alt="" draggable="false"><strong>${s.name}</strong><small>${s.role}</small><span class="draft-moves">${s.moves.map((m) => m.name).join(" / ")}</span>${picked ? `<span class="picked-label">${draftOptions.profiles[draft.teams[0].includes(index) ? 0 : 1].name.toUpperCase()} PICK</span>` : ""}`;
    button.onclick = () => {
      inspectSpecies(index);
    };
    $("#draft-pool").append(button);
  }
  $("#draft-begin").disabled = !draft.complete;
  $("#draft-help").textContent = draft.complete
    ? "Your drafted moves have limited shots. Make them count."
    : `Snake order: ${draftOptions.profiles[0].name} → ${draftOptions.profiles[1].name} → ${draftOptions.profiles[1].name} → ${draftOptions.profiles[0].name}. Both moves come with each pick.`;
  updateInspector();
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
  draft = new Draft(draft.seed, draft.mode, draft.difficulty, draft.context);
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
$("#rematch").onclick = () => nextRound(false);
$("#new-seed").onclick = () => nextRound(true);
$("#redraft").onclick = () => {
  closeDialogs();
  playing = false;
  $("#seed").value = matchOptions.seed;
  showDraft();
};
$("#return-menu").onclick = $("#result-menu").onclick = home;
$("#result").addEventListener("cancel", (e) => e.preventDefault());
$("#sound-option").onchange = (e) => {
  prefs.sound = e.target.checked;
  $("#setup-sound").checked = prefs.sound;
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
  $("#aim-style").value = prefs.targeting ? "assisted" : "classic";
  savePrefs();
};
$("#guide-toggle").onclick = () => {
  if (!prefs.guide) {
    prefs.guide = true;
    prefs.guideLength = "short";
  } else if (prefs.guideLength === "short") prefs.guideLength = "full";
  else prefs.guide = false;
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
  } else if (!$("#draft-screen").hidden && demo) {
    const n = Math.min(6, Math.ceil(elapsed / DT));
    for (let i = 0; i < n; i++) {
      demo.step();
      for (const event of demo.events.splice(0)) demoRenderer.event(event);
      demoRenderer.tick(DT);
    }
    demoRenderer.draw(
      demo,
      {
        species: inspected,
        move: inspectMove,
        angle: 45,
        power: 55,
        facing: 1,
      },
      false,
    );
    if (demo.phase === "over" || demo.turn > 1) {
      demo.wait = (demo.wait || 0) + elapsed;
      if (demo.wait > 1.2) resetDemo();
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
function nextRound(newSeed = false) {
  if (!series || Math.max(...series.wins) >= series.target)
    series = {
      wins: [0, 0],
      round: 1,
      target: $("#series-option").checked ? 2 : 1,
    };
  else series.round++;
  const options = {
    ...matchOptions,
    first: 1 - battle.opening,
    seed: newSeed ? matchOptions.seed + 1 : matchOptions.seed,
  };
  start(options);
}
function buildTrainers() {
  $("#trainer-customization").innerHTML = "";
  prefs.profiles.forEach((p, i) => {
    const editor = document.createElement("div");
    editor.className = "trainer-editor";
    editor.innerHTML = `<canvas width="110" height="140" aria-label="Player ${i + 1} trainer preview"></canvas><label>Player ${i + 1} name<input data-profile="name" maxlength="12" value="${p.name}"></label><label>Look<select data-profile="style">${hairstyles.map((name, j) => `<option value="${j}" ${p.style === j ? "selected" : ""}>${name}</option>`).join("")}</select></label><label>Skin<select data-profile="skin">${skins.map((_, j) => `<option value="${j}" ${p.skin === j ? "selected" : ""}>Tone ${j + 1}</option>`).join("")}</select></label><div class="swatches">${palettes.map((col, j) => `<button type="button" class="swatch" style="background:${col.main}" aria-label="Player ${i + 1} ${col.name} outfit" aria-pressed="${p.palette === j}" data-palette="${j}"></button>`).join("")}</div>`;
    for (const input of editor.querySelectorAll("[data-profile]"))
      input.addEventListener("change", () => {
        p[input.dataset.profile] =
          input.dataset.profile === "name" ? input.value : +input.value;
        prefs.profiles[i] = cleanProfile(p, i);
        savePrefs();
        buildTrainers();
      });
    for (const button of editor.querySelectorAll("[data-palette]"))
      button.onclick = () => {
        p.palette = +button.dataset.palette;
        savePrefs();
        buildTrainers();
      };
    $("#trainer-customization").append(editor);
    trainerPortrait(editor.querySelector("canvas"), p, i);
  });
}
function inspectSpecies(index) {
  inspected = index;
  inspectMove = 0;
  updateInspector();
  resetDemo();
  for (const button of $("#draft-pool").children)
    button.classList.toggle("inspecting", +button.dataset.species === index);
}
function updateInspector() {
  if (!draft) return;
  const species = roster[inspected],
    m = species.moves[inspectMove];
  $("#inspect-name").textContent = species.name;
  $("#inspect-role").textContent = species.role;
  $("#inspect-move-tabs").innerHTML = species.moves
    .map(
      (move, i) =>
        `<button data-demo-move="${i}" class="${i === inspectMove ? "selected" : ""}" aria-pressed="${i === inspectMove}">${move.name}</button>`,
    )
    .join("");
  for (const button of $("#inspect-move-tabs").children)
    button.onclick = () => {
      inspectMove = +button.dataset.demoMove;
      updateInspector();
      resetDemo();
    };
  $("#inspect-details").innerHTML =
    `<p class="move-facts">${m.family.toUpperCase()} · ${m.damage}${m.count ? " × " + m.count : ""} BASE · ${m.ammo} USES</p><p>${m.description}</p><p><strong>Ground:</strong> ${m.terrain}</p><p class="muted">${m.counter}${m.cooldown ? " Recharge: " + m.cooldown + " owner turn" + (m.cooldown === 1 ? "" : "s") + "." : ""}</p>`;
  const cpu = draft.mode !== "hotseat" && draft.active === 1,
    picked = draft.picks.includes(inspected);
  $("#draft-confirm").disabled = draft.complete || cpu || picked;
  $("#draft-confirm").textContent = picked
    ? "Already drafted"
    : `Draft ${species.name} →`;
  $("#inspect-reason").textContent = draft.complete
    ? "Both teams are ready. You can still inspect every move."
    : picked
      ? "This partner belongs to a team. Inspect another choice."
      : cpu
        ? "The computer is making its pick."
        : `${draftOptions.profiles[draft.active].name}'s choice. Inspection does not use your pick.`;
}
function resetDemo() {
  if (!draftOptions || !spriteStatus.ready) return;
  demo = new Battle({
    seed: 42,
    map: draftOptions.map,
    landscape: "rolling",
    timer: false,
    mode: "practice",
    teams: [[inspected], [1]],
    hp: 300,
    profiles: draftOptions.profiles,
  });
  for (let i = 0; i < 30; i++) demo.step();
  demo.wind = 0;
  const target = demo.players[1],
    aim = aimAt(demo, roster[inspected].moves[inspectMove], target.x, target.y);
  demo.commit(inspected, inspectMove, aim.angle, aim.power);
  demoRenderer.clear();
}
$("#draft-confirm").onclick = () => {
  if (draft.pick(inspected)) {
    audio.unlock();
    audio.tone(470, 640, 0.12);
    renderDraft();
  }
};
$("#landscape").innerHTML = landscapes
  .map((l) => `<option value="${l.id}">${l.name}</option>`)
  .join("");
$("#landscape").value = prefs.landscape;
$("#relief").value = prefs.relief;
for (const id of ["landscape", "relief"])
  $("#" + id).onchange = (e) => {
    prefs[id] = e.target.value;
    savePrefs();
    buildMaps();
  };
$("#seed").oninput = buildMaps;
$("#reroll-map").onclick = () => {
  $("#seed").value = 1 + Math.floor(Math.random() * 999998);
  buildMaps();
};
$("#match-hp").value = [180, 240, 300].includes(prefs.hp) ? prefs.hp : 240;
$("#aim-style").value = prefs.targeting ? "assisted" : "classic";
$("#aim-style").onchange = (e) => {
  prefs.targeting = e.target.value === "assisted";
  prefs.guide = true;
  prefs.guideLength = prefs.targeting ? "full" : "short";
  savePrefs();
};
$("#guide-length").onchange = (e) => {
  prefs.guideLength = e.target.value;
  savePrefs();
};
$("#history-option").onchange = (e) => {
  prefs.history = e.target.checked;
  savePrefs();
};
$("#setup-sound").checked = prefs.sound;
$("#setup-sound").onchange = (e) => {
  prefs.sound = e.target.checked;
  savePrefs();
  audio.unlock();
  audio.tone(420, 640, 0.15);
};
const lessons = [
  {
    title: "Find your angle",
    body: "Move the elevation slider. The gold direction arrow stays visible even without a full trajectory. A higher angle gives a taller arc.",
    check: () => Math.abs(current().angle - 45) > 8,
  },
  {
    title: "Set the power",
    body: "Change power by at least 10%. Power changes range. The short dots are the beginning of the arc; they do not reveal the landing.",
    check: () => Math.abs(current().power - 55) >= 10,
  },
  {
    title: "Throw a shot",
    body: "Use Flamethrower and press Summon & attack (or Space). Watch Charizard appear, launch and recall. A miss is useful information.",
    check: () => battle.turn >= 2 && battle.phase === "aim",
  },
  {
    title: "Correct your shot",
    body: "Your previous path and settings remain on the field. Adjust angle or power to correct it. The guide button cycles short arc, full guide and direction only.",
    check: () => battle.turn >= 3 && battle.phase === "aim",
  },
  {
    title: "Change the battlefield",
    body: "Try Blastoise’s Hydro Pump, then Pikachu’s Thunderbolt. Water pushes and leaves wet ground; lightning conducts through connected wet patches. Practice freely or return to setup.",
    check: () => true,
  },
];
function updateLesson() {
  if (!tutorial) return;
  const lesson = lessons[tutorial.step];
  $("#lesson-count").textContent =
    `FIELD SCHOOL · ${tutorial.step + 1} / ${lessons.length}`;
  $("#lesson-title").textContent = lesson.title;
  $("#lesson-body").textContent = lesson.body;
  $("#lesson-next").disabled = !lesson.check();
  $("#lesson-next").textContent =
    tutorial.step === lessons.length - 1 ? "Finish lesson →" : "Next →";
}
$("#learn").onclick = () => {
  if (!spriteStatus.ready) return;
  series = null;
  tutorial = { step: 0 };
  prefs.targeting = false;
  prefs.guide = true;
  prefs.guideLength = "short";
  start({
    seed: 42,
    map: "highlands",
    landscape: "rolling",
    mode: "practice",
    timer: false,
    hp: 300,
    teams: [[0, 1, 2, 3, 6, 17], [1]],
    profiles: prefs.profiles,
  });
  current().move = 0;
  buildMoves();
  updateHUD();
};
$("#lesson-next").onclick = () => {
  if (tutorial.step === lessons.length - 1) {
    tutorial = null;
    $("#tutorial-card").hidden = true;
  } else {
    tutorial.step++;
    updateLesson();
  }
};
$("#lesson-exit").onclick = home;
buildTrainers();
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
          maxHP: battle.maxHP,
          opening: battle.opening,
          profiles: battle.players.map((p) => ({ ...p.profile })),
          landscape: battle.terrain.profile,
          relief: battle.terrain.relief,
          hazards: battle.hazards.map((h) => ({ ...h })),
          ice: battle.ice.length,
          aim: {
            guide: prefs.guide,
            guideLength: prefs.guideLength,
            targeting: prefs.targeting,
          },
          lastShots: battle.lastShots,
          series,
          tutorial: tutorial ? { ...tutorial } : null,
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
