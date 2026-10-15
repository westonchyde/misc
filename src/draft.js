import { roster, difficultyProfiles } from "./content.js";
import { random } from "./simulation.js";
export const TEAM_SIZE = 6;
export function shuffle(items, rng) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function randomTeams(seed = 42) {
  const all = shuffle(
    roster.map((_, i) => i),
    random(seed),
  );
  return [all.slice(0, TEAM_SIZE), all.slice(TEAM_SIZE, TEAM_SIZE * 2)];
}
export function draftScore(index, own = [], rival = [], difficulty = "normal") {
  const s = roster[index],
    profile = difficultyProfiles[difficulty] || difficultyProfiles.normal;
  let value = s.moves.reduce(
    (v, m) => v + m.damage * (m.count || 1) * 0.025 + m.radius * 0.015,
    0,
  );
  if (own.some((i) => roster[i].element === s.element)) value -= 5;
  if (profile.statusWeight) {
    const ownEffects = own.flatMap((i) => roster[i].moves.map((m) => m.effect));
    if (
      s.moves.some((m) => m.effect === "electric") &&
      ownEffects.includes("wet")
    )
      value += 6 * profile.statusWeight;
    if (
      s.moves.some((m) => m.effect === "wet") &&
      ownEffects.includes("electric")
    )
      value += 5 * profile.statusWeight;
    const ownKinds = own.flatMap((i) => roster[i].moves.map((m) => m.kind));
    if (s.moves.some((m) => m.kind === "beam") && !ownKinds.includes("beam"))
      value += 3;
    if (s.moves.some((m) => m.kind === "relay") && !ownKinds.includes("relay"))
      value += 2;
    if (
      difficulty === "hard" &&
      rival.some((i) => roster[i].element === s.element)
    )
      value += 0.5;
  }
  return value;
}
export class Draft {
  constructor(seed = 42, mode = "solo", difficulty = "normal") {
    this.seed = seed;
    this.mode = mode;
    this.difficulty = difficulty;
    this.rng = random(seed + 700);
    this.pool = shuffle(
      roster.map((_, i) => i),
      this.rng,
    );
    this.teams = [[], []];
    this.picks = [];
  }
  get active() {
    const n = this.picks.length;
    return n % 4 === 0 || n % 4 === 3 ? 0 : 1;
  }
  get complete() {
    return this.picks.length === TEAM_SIZE * 2;
  }
  pick(index) {
    if (
      this.complete ||
      !this.pool.includes(index) ||
      this.picks.includes(index)
    )
      return false;
    this.teams[this.active].push(index);
    this.picks.push(index);
    return true;
  }
  cpuPick() {
    if (this.complete) return false;
    const available = this.pool.filter((i) => !this.picks.includes(i));
    let index;
    if (this.difficulty === "easy")
      index = available[Math.floor(this.rng() * available.length)];
    else
      index = available.sort(
        (a, b) =>
          draftScore(
            b,
            this.teams[this.active],
            this.teams[1 - this.active],
            this.difficulty,
          ) -
          draftScore(
            a,
            this.teams[this.active],
            this.teams[1 - this.active],
            this.difficulty,
          ),
      )[0];
    return this.pick(index);
  }
  randomize() {
    this.teams = randomTeams(this.seed + Math.floor(this.rng() * 100000));
    this.picks = this.teams.flat();
  }
}
