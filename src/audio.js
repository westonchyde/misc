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
    if (e.type === "attack") {
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
      this.noise(0.3);
      this.tone(100, 30, 0.3, "triangle", 0, 1.4);
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
