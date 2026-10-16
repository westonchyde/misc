import { roster } from "./content.js";
export class AudioFX {
  constructor(prefs) {
    this.prefs = prefs;
    this.context = null;
  }
  unlock() {
    if (!this.prefs.sound) return;
    this.context ||= new (window.AudioContext || window.webkitAudioContext)();
    this.context.resume();
  }
  tone(freq, end, duration, type = "sine", delay = 0, loudness = 1) {
    if (!this.prefs.sound || !this.context) return;
    const a = this.context,
      now = a.currentTime + delay,
      o = a.createOscillator(),
      g = a.createGain();
    o.type = type;
    o.connect(g);
    g.connect(a.destination);
    o.frequency.setValueAtTime(freq, now);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + duration);
    g.gain.setValueAtTime(
      Math.max(0.0001, this.prefs.volume * 0.12 * loudness),
      now,
    );
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    o.start(now);
    o.stop(now + duration);
  }
  noise(duration, low = 900) {
    if (!this.prefs.sound || !this.context) return;
    const a = this.context,
      buffer = a.createBuffer(1, a.sampleRate * duration, a.sampleRate),
      data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++)
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = a.createBufferSource(),
      filter = a.createBiquadFilter(),
      gain = a.createGain();
    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.value = low;
    gain.gain.value = this.prefs.volume * 0.2;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(a.destination);
    source.start();
  }
  event(e) {
    if (e.type === "summon") {
      this.tone(430, 620, 0.12);
      this.tone(620, 840, 0.18, "sine", 0.12);
    }
    const move = e.visual
      ? roster.flatMap((s) => s.moves).find((m) => m.visual === e.visual)
      : null;
    if (e.type === "attack" && move) {
      const type = move.effect,
        behavior = move.behavior;
      if (behavior === "sniper") {
        this.tone(1500, 90, 0.12, "sawtooth", 0, 0.6);
        this.noise(0.08, 4200);
      } else if (["rescue", "mud"].includes(behavior)) {
        this.noise(0.5, 420);
        this.tone(120, 40, 0.4, "triangle");
      } else if (
        ["stream", "water", "flood", "hydro-rocket", "bubbles"].includes(
          behavior,
        )
      ) {
        this.noise(0.7, 2800);
        this.tone(190, 85, 0.55, "sine");
      } else if (
        ["flame", "lava", "ember"].includes(behavior) ||
        type === "burn"
      ) {
        this.noise(0.65, 1200);
        this.tone(75, 40, 0.45, "sawtooth", 0, 0.5);
      } else if (type === "electric") {
        [0, 0.09, 0.2].forEach((d, i) =>
          this.tone(1300 + i * 300, 130, 0.13, "sawtooth", d, 0.55),
        );
        this.noise(0.14, 4800);
      } else if (
        ["bounce", "burrow", "slam"].includes(behavior) ||
        move.species === "golem"
      ) {
        this.noise(0.3, 450);
        this.tone(90, 27, 0.45, "triangle", 0, 1.6);
      } else if (move.kind === "beam") {
        this.tone(160, 940, 0.3, "sine");
        this.tone(820, 160, 0.5, "triangle", 0.3, 0.65);
      } else if (["poison", "curse", "weaken"].includes(type)) {
        this.tone(240, 480, 0.45, "sine");
        this.tone(247, 470, 0.45, "sine");
      } else this.tone(380, 90, 0.28, "triangle");
    }
    if (e.type === "attack" && !move) {
      this.tone(
        e.kind === "bolt" ? 900 : 290,
        100,
        0.35,
        e.kind === "ghost" ? "sine" : "triangle",
      );
      if (["cone", "jet", "dig"].includes(e.kind))
        this.noise(0.4, e.kind === "jet" ? 2200 : 900);
    }
    if (e.type === "impact") {
      const water = ["stream", "water", "freeze"].includes(move?.behavior);
      this.noise(
        water ? 0.2 : 0.3,
        water ? 3100 : move?.effect === "electric" ? 4200 : 700,
      );
      this.tone(
        water ? 260 : 100,
        water ? 100 : 30,
        0.25,
        "triangle",
        0,
        water ? 0.65 : 1.2,
      );
    }
    if (e.type === "splash") this.noise(0.4, 2500);
    if (e.type === "damage") this.tone(280, 120, 0.12, "triangle");
    if (e.type === "turn") this.tone(500, 650, 0.12);
    if (e.type === "jump") this.tone(150, 300, 0.14);
    if (e.type === "victory")
      [330, 440, 550, 660].forEach((f, i) =>
        this.tone(f, f, 0.4, "triangle", i * 0.15),
      );
  }
}
