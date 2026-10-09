import type { AudioRig } from "./audio";

/** The recorded effects in public/sfx/<name>.m4a (made with Higgsfield's Mirelo). */
const SAMPLES = [
  "drop",
  "perfect",
  "slice",
  "fall",
  "splash",
  "rubble",
  "squash",
  "topple",
  "landing",
  "summit",
  "card",
  "fire",
  "quench",
  "frost",
  "thunder",
  "bedrock",
  "stillness",
  "taken",
  "door",
  "fuse",
  "blast",
  "tap",
] as const;
type Sample = (typeof SAMPLES)[number];

/**
 * The game's one-shot sounds: recorded effects once they have loaded, with
 * the old synth tones standing in until then (or if one can't be had).
 */
export class Sfx {
  private rig: AudioRig;
  private samples = new Map<Sample, AudioBuffer>();
  private loading = false;

  constructor(rig: AudioRig) {
    this.rig = rig;
  }

  /** Fetches and decodes every recorded effect, once, after audio is unlocked. */
  load(): void {
    const ctx = this.rig.ctx;
    if (!ctx || this.loading) return;
    this.loading = true;
    for (const name of SAMPLES) {
      fetch(`sfx/${name}.m4a`)
        .then((r) =>
          okResponse(r) ? r.arrayBuffer() : Promise.reject(new Error(String(r.status))),
        )
        .then(
          (data) =>
            new Promise<AudioBuffer>((resolve, reject) => {
              const p = ctx.decodeAudioData(data, resolve, reject);
              if (p && typeof p.catch === "function") p.catch(() => undefined);
            }),
        )
        .then((buffer) => this.samples.set(name, buffer))
        .catch(() => undefined);
    }
  }

  /** Plays a recorded effect; false if it isn't loaded (the caller falls back to a tone). */
  private play(name: Sample, gain = 1, rate = 1, delay = 0): boolean {
    const { ctx, sfxBus } = this.rig;
    const buffer = this.samples.get(name);
    if (!ctx || !sfxBus || !buffer) return false;
    if (!this.rig.sfxEnabled) return true;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g);
    g.connect(sfxBus);
    src.start(ctx.currentTime + delay);
    src.onended = () => {
      src.disconnect();
      g.disconnect();
    };
    return true;
  }

  /** A little variety, so a run of the same sound isn't a machine gun. */
  private vary(spread = 0.08): number {
    return 1 - spread / 2 + Math.random() * spread;
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType,
    peak: number,
    slideTo?: number,
    delay = 0,
  ): void {
    const { ctx, sfxBus } = this.rig;
    if (!ctx || !sfxBus || !this.rig.sfxEnabled) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + dur);
    }
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(sfxBus);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  private noise(dur: number, peak: number, cutoff: number, delay = 0): void {
    const { ctx, sfxBus } = this.rig;
    if (!ctx || !sfxBus || !this.rig.sfxEnabled) return;
    const t = ctx.currentTime + delay;
    const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(Math.max(0.0002, peak), t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(sfxBus);
    src.start(t);
    src.stop(t + dur);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  /** The moving slab turning at the end of its run: a breath of air. */
  swish(): void {
    if (this.play("slice", 0.16, 1.5)) return;
    this.noise(0.04, 0.05, 900);
  }

  /** The weight under a landing: a low thud that deepens with the tower's height. */
  thud(height: number): void {
    const deep = Math.min(1, height / 30);
    if (this.play("bedrock", 0.14 + 0.1 * deep, 1.9 - 0.5 * deep)) return;
    this.tone(70 - 20 * deep, 0.12, "sine", 0.12, 40);
  }

  drop(): void {
    if (this.play("drop", 0.8, this.vary())) return;
    const wobble = 0.94 + Math.random() * 0.12;
    this.tone(170 * wobble, 0.09, "sine", 0.2, 64);
    this.noise(0.05, 0.1, 700);
  }

  slice(): void {
    if (this.play("slice", 0.7, this.vary())) return;
    this.noise(0.07, 0.14, 1400);
    this.tone(380, 0.05, "triangle", 0.05, 140);
  }

  perfect(streak: number): void {
    // The chime climbs as the streak builds.
    if (this.play("perfect", 0.75, 1 + Math.min(streak, 10) * 0.035)) return;
    const base = 494 + Math.min(streak, 8) * 28;
    this.tone(base, 0.12, "sine", 0.13);
    this.tone(base * 1.26, 0.16, "sine", 0.07);
  }

  forge(): void {
    this.tone(523, 0.18, "triangle", 0.14);
    this.tone(659, 0.22, "sine", 0.09);
    this.tone(784, 0.26, "sine", 0.07);
  }

  tick(): void {
    this.tone(1480, 0.028, "sine", 0.035);
  }

  pulse(): void {
    this.tone(196, 0.045, "triangle", 0.07);
  }

  sputter(): void {
    if (this.play("fuse", 0.5, this.vary())) return;
    this.noise(0.04, 0.07, 1100);
    this.tone(120, 0.05, "square", 0.04);
  }

  hiss(): void {
    if (this.play("quench", 0.6, this.vary())) return;
    this.noise(0.14, 0.05, 420);
  }

  chime(): void {
    if (this.play("landing", 0.7)) return;
    this.tone(698, 0.09, "sine", 0.11);
    this.tone(988, 0.14, "sine", 0.06);
  }

  best(): void {
    this.tone(880, 0.12, "sine", 0.1);
    this.tone(1174, 0.18, "sine", 0.06);
  }

  fail(): void {
    if (this.play("taken", 0.85)) return;
    this.tone(196, 0.38, "sawtooth", 0.05, 48);
    this.noise(0.28, 0.12, 500);
  }

  /** Summit: a rising major arpeggio with a shimmer on top. */
  summit(): void {
    if (this.play("summit", 0.9)) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, i) => {
      this.tone(freq, 0.34, "triangle", 0.12, undefined, i * 0.085);
      this.tone(freq * 2, 0.4, "sine", 0.04, undefined, i * 0.085);
    });
    this.tone(1568, 0.9, "sine", 0.07, undefined, 0.44);
    this.noise(0.5, 0.05, 6000, 0.44);
  }

  /** One star landing on the results card. `index` raises the pitch. */
  star(index: number): void {
    const freq = [784, 988, 1318.5][Math.min(2, Math.max(0, index))]!;
    this.tone(freq, 0.22, "sine", 0.13);
    this.tone(freq * 1.5, 0.3, "sine", 0.05, undefined, 0.03);
  }

  firework(): void {
    this.noise(0.22, 0.07, 2400);
    this.tone(240 + Math.random() * 120, 0.16, "sine", 0.05, 90);
  }

  /** A weapon firing at full Heat. */
  fire(): void {
    if (this.play("fire", 0.8)) return;
    this.tone(220, 0.4, "sawtooth", 0.08, 880);
    this.tone(1760, 0.5, "sine", 0.08, undefined, 0.1);
    this.noise(0.3, 0.1, 3000, 0.05);
  }

  /** An upgrade taken. */
  pick(): void {
    if (this.play("card", 0.7)) return;
    this.tone(523, 0.1, "triangle", 0.1);
    this.tone(784, 0.14, "triangle", 0.1, undefined, 0.08);
    this.tone(1047, 0.3, "sine", 0.08, undefined, 0.16);
  }

  /** Coins paid for a drop. Brighter the more it paid. */
  coin(amount: number): void {
    const lift = Math.min(6, amount) * 40;
    this.tone(1320 + lift, 0.05, "square", 0.025);
    this.tone(1760 + lift, 0.09, "sine", 0.05, undefined, 0.045);
  }

  /** Something bought in the workshop. */
  buy(): void {
    this.tone(660, 0.08, "triangle", 0.1);
    this.tone(990, 0.1, "triangle", 0.1, undefined, 0.07);
    this.tone(1320, 0.22, "sine", 0.1, undefined, 0.14);
    this.noise(0.12, 0.05, 7000, 0.14);
  }

  /** A hanging slab let go. */
  release(): void {
    this.noise(0.2, 0.07, 1600);
    this.tone(520, 0.2, "sine", 0.05, 180);
  }

  /** The slab's groove has come under a pickup's line. */
  lock(): void {
    this.tone(1175, 0.05, "triangle", 0.07);
    this.tone(1568, 0.07, "sine", 0.05, undefined, 0.04);
  }

  shieldUp(): void {
    this.tone(392, 0.3, "triangle", 0.13, 784);
    this.tone(1175, 0.4, "sine", 0.07, undefined, 0.12);
    this.noise(0.3, 0.04, 5000, 0.1);
  }

  shieldBreak(): void {
    this.noise(0.32, 0.2, 7000);
    this.tone(1568, 0.3, "triangle", 0.1, 196);
    this.tone(880, 0.22, "square", 0.04, 110, 0.03);
  }

  /** Time winding down. */
  slow(): void {
    if (this.play("stillness", 0.8)) return;
    this.tone(880, 0.5, "sine", 0.12, 220);
    this.tone(660, 0.55, "triangle", 0.06, 165, 0.03);
  }

  boom(): void {
    if (this.play("blast", 0.85, this.vary())) return;
    this.noise(0.5, 0.34, 900);
    this.noise(0.12, 0.2, 5000);
    this.tone(110, 0.45, "sine", 0.3, 36);
  }

  /** Starfall's lightning. */
  thunder(): void {
    if (!this.play("thunder", 0.9, this.vary())) this.boom();
  }

  /** Bedrock's buttresses grinding up out of the ground. */
  bedrock(): void {
    if (!this.play("bedrock", 0.85)) this.boom();
  }

  /** Rime: the Dark freezing over. */
  frost(): void {
    if (!this.play("frost", 0.8)) this.slow();
  }

  /** A climber crushed under a falling piece. */
  squash(): void {
    if (!this.play("squash", 0.8, this.vary(0.14))) this.drop();
  }

  /** Something plunging into the Dark. */
  splash(): void {
    if (!this.play("splash", 0.7, this.vary(0.12))) this.hiss();
  }

  /** Something tumbling away down the shaft. */
  fall(): void {
    this.play("fall", 0.55, this.vary(0.12));
  }

  /** A slab crumbling to rubble on the ground. */
  rubble(): void {
    if (!this.play("rubble", 0.7, this.vary(0.12))) this.drop();
  }

  /** The tower going over. */
  topple(): void {
    this.play("topple", 0.75);
  }

  /** Something living taken by the dark: the presence, close and low. */
  taken(): void {
    if (!this.play("taken", 0.6, 0.85)) this.fail();
  }

  /** The Descent's door bursting open. */
  door(): void {
    if (!this.play("door", 0.95)) this.boom();
  }

  /** The Dark quickening: the same presence, quieter and higher. */
  quicken(): void {
    if (!this.play("taken", 0.35, 1.25)) this.hiss();
  }

  /** The fuse is out: clear to drop. */
  go(): void {
    this.tone(784, 0.07, "triangle", 0.09);
    this.tone(1175, 0.12, "sine", 0.08, undefined, 0.06);
  }

  /** The title wakes: a sub boom, a rush rising out of it, and a high chord over the top. */
  awaken(): void {
    this.tone(72, 2.8, "sine", 0.4, 34);
    this.tone(144, 1.6, "triangle", 0.08, 70);
    this.noise(1.8, 0.12, 600);
    for (const [f, d] of [
      [1318.5, 0.18],
      [1760, 0.3],
      [2637, 0.42],
    ] as const) {
      this.tone(f, 2.4, "sine", 0.035, undefined, d);
    }
  }

  ui(): void {
    if (this.play("tap", 0.6, this.vary(0.1))) return;
    this.tone(660, 0.05, "sine", 0.06);
  }
}

/**
 * Whether a fetch of a bundled file worked. The iOS app serves its files with
 * status 0 (not 200) even when the bytes arrive, so 0 counts as fine there.
 */
function okResponse(r: Response): boolean {
  return r.ok || r.status === 0;
}
