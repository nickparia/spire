import type { AudioRig } from "./audio";
import { clamp01 } from "./logic";
import type { Track } from "./themes";

export type Mood = "menu" | "play" | "fallen" | "summit";

type Chord = readonly number[];

/** i – VI – III – VII: open and unhurried. */
const CALM: readonly Chord[] = [
  [0, 3, 7],
  [8, 12, 15],
  [3, 7, 10],
  [10, 14, 17],
];

/** i – bII – i° – V: the flat second and the tritone do the worrying. */
const TENSE: readonly Chord[] = [
  [0, 3, 7],
  [1, 5, 8],
  [0, 3, 6],
  [7, 11, 14],
];

/** VI – VII – i – v: the B section, the same key seen from further off. */
const LIFT: readonly Chord[] = [
  [8, 12, 15],
  [10, 14, 17],
  [0, 3, 7],
  [7, 10, 14],
];

/** I – IV – V – I for the summit. */
const BRIGHT: readonly Chord[] = [
  [0, 4, 7],
  [5, 9, 12],
  [7, 11, 14],
  [0, 4, 7],
];

/** Lead patterns as [chord tone, octave]. Eighths, then sixteenths. */
const LEAD_8: readonly (readonly [number, number])[] = [
  [0, 0],
  [1, 0],
  [2, 0],
  [1, 0],
  [0, 1],
  [2, 0],
  [1, 0],
  [2, 0],
];

const LEAD_16: readonly (readonly [number, number])[] = [
  [0, 0],
  [2, 0],
  [1, 0],
  [2, 0],
  [0, 1],
  [2, 0],
  [1, 1],
  [2, 0],
  [0, 0],
  [2, 0],
  [1, 0],
  [2, 0],
  [2, 1],
  [1, 1],
  [0, 1],
  [2, 0],
];

const STEPS_PER_BAR = 16;

/**
 * The arrangement, in bars: A, B, A, then a short breakdown. The last bar of
 * each section carries a fill into the next.
 */
const FORM: readonly { kind: Section; bars: number }[] = [
  { kind: "a", bars: 8 },
  { kind: "b", bars: 8 },
  { kind: "a", bars: 8 },
  { kind: "break", bars: 4 },
];
const FORM_BARS = FORM.reduce((n, p) => n + p.bars, 0);

type Section = "a" | "b" | "break";

/** What the climb tells the score: how far up, how close the Dark, how clean. */
export type Climb = { progress: number; danger: number; streak: number; landings: number };
const LOOKAHEAD = 0.14;

function hz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

type Graph = {
  ctx: BaseAudioContext;
  /** Pad, lead and bass pass through here; it opens as tension rises. */
  tone: BiquadFilterNode;
  drums: GainNode;
  echo: DelayNode;
  level: GainNode;
  strain: GainNode;
  strainOscs: OscillatorNode[];
  noise: AudioBuffer;
};

function buildGraph(ctx: BaseAudioContext, out: AudioNode): Graph {
  const level = ctx.createGain();
  level.gain.value = 0.7;
  level.connect(out);

  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 700;
  tone.Q.value = 0.7;
  tone.connect(level);

  const drums = ctx.createGain();
  drums.gain.value = 1;
  drums.connect(level);

  const echo = ctx.createDelay(1.5);
  echo.delayTime.value = 0.3;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.34;
  const damp = ctx.createBiquadFilter();
  damp.type = "lowpass";
  damp.frequency.value = 2400;
  echo.connect(damp);
  damp.connect(feedback);
  feedback.connect(echo);
  damp.connect(level);

  // A held dissonance that only becomes audible near the top of the scale.
  const strain = ctx.createGain();
  strain.gain.value = 0;
  strain.connect(tone);
  const tremolo = ctx.createGain();
  tremolo.gain.value = 0.6;
  tremolo.connect(strain);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 6.5;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0.4;
  lfo.connect(lfoDepth);
  lfoDepth.connect(tremolo.gain);
  lfo.start();
  const strainOscs = [0, 1].map(() => {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.connect(tremolo);
    osc.start();
    return osc;
  });

  const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  return { ctx, tone, drums, echo, level, strain, strainOscs, noise };
}

/**
 * Generative score that follows the game. `setTension` is fed from how much
 * slab is left: a full-width slab plays a slow pad and a bell; as it narrows
 * the tempo climbs, bass and drums come in, the lead doubles up, the harmony
 * turns to the flat second and tritone, and a tremolo dissonance creeps in.
 * Forging the slab wider walks it all back down.
 */
export class Music {
  private rig: AudioRig;
  private graph: Graph | null = null;
  private track: Track;
  private mood: Mood = "menu";
  private target = 0;
  private tension = 0;
  private step = 0;
  private nextTime = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private climb: Climb = { progress: 0, danger: 0, streak: 0, landings: 0 };
  /** The score is stripped to a pad until this bar: a topple. */
  private stripUntil = -1;
  /** A swell rises through this bar into the next section: a landing. */
  private swellBar = -1;
  /** Bars are counted from here so a fresh climb starts at the top of the form. */
  private formStart = 0;

  constructor(rig: AudioRig, track: Track) {
    this.rig = rig;
    this.track = track;
  }

  /** Begin (or keep) playing. Needs the rig unlocked by a gesture first. */
  start(): void {
    const { ctx, musicBus } = this.rig;
    if (!ctx || !musicBus) return;
    // A rebuilt context needs a new graph, on the new clock.
    if (this.graph && this.graph.ctx !== ctx) {
      this.graph = null;
      this.stop();
    }
    if (!this.graph) this.graph = buildGraph(ctx, musicBus);
    if (this.timer !== null) return;
    this.nextTime = ctx.currentTime + 0.06;
    this.timer = setInterval(this.pump, 25);
  }

  stop(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }

  setTrack(track: Track): void {
    if (track === this.track) return;
    this.track = track;
    // Land the key change on a downbeat.
    this.step = Math.ceil(this.step / STEPS_PER_BAR) * STEPS_PER_BAR;
  }

  setTension(value: number): void {
    this.target = clamp01(value);
  }

  /**
   * The climb drives the score: height and the Dark's nearness set the
   * tension; landings and a streak bring layers in.
   */
  setClimb(climb: Climb): void {
    this.climb = climb;
    this.target = clamp01(
      climb.progress * 0.45 + climb.danger * 0.6 + Math.min(climb.streak, 8) * 0.012,
    );
  }

  /** A fresh climb: back to the top of the form, nothing earned yet. */
  restart(): void {
    this.formStart = Math.floor(this.step / STEPS_PER_BAR);
    this.climb = { progress: 0, danger: 0, streak: 0, landings: 0 };
    this.stripUntil = -1;
    this.swellBar = -1;
  }

  /** A landing: a swell through the next bar, then the B section. */
  landing(): void {
    const bar = Math.floor(this.step / STEPS_PER_BAR);
    this.swellBar = bar + 1;
    // Land the next section on B: move the form so bar + 2 starts it.
    this.formStart = bar + 2 - FORM[0]!.bars;
  }

  /** A topple: strip back to the pad for a few bars. */
  topple(): void {
    this.stripUntil = Math.floor(this.step / STEPS_PER_BAR) + 4;
  }

  /** Where a bar falls in the form, and whether it is the last of its section. */
  private section(bar: number): { kind: Section; fill: boolean } {
    let at = (((bar - this.formStart) % FORM_BARS) + FORM_BARS) % FORM_BARS;
    for (const part of FORM) {
      if (at < part.bars) return { kind: part.kind, fill: at === part.bars - 1 };
      at -= part.bars;
    }
    return { kind: "a", fill: false };
  }

  setMood(mood: Mood): void {
    this.mood = mood;
  }

  /** Smoothed tension as the score hears it, for anything visual that wants to follow. */
  get heard(): number {
    return this.tension;
  }

  private pump = (): void => {
    const graph = this.graph;
    if (!graph || !this.rig.musicEnabled) return;
    const now = graph.ctx.currentTime;
    if (graph.ctx.state !== "running") return;
    // After a stall (backgrounded tab) skip ahead rather than machine-gun the backlog.
    if (this.nextTime < now - 0.2) this.nextTime = now + 0.05;
    while (this.nextTime < now + LOOKAHEAD) {
      this.nextTime += this.scheduleStep(graph, this.step, this.nextTime);
      this.step += 1;
    }
  };

  /** Schedules one sixteenth at `time` and returns its length in seconds. */
  private scheduleStep(graph: Graph, step: number, time: number): number {
    const goal = this.mood === "play" ? this.target : this.mood === "summit" ? 0.42 : 0;
    this.tension += (goal - this.tension) * (goal > this.tension ? 0.22 : 0.1);
    const t = this.tension;
    const track = this.track;
    const stepDur = 60 / (track.bpm * (1 + 0.38 * t)) / 4;
    const bar = Math.floor(step / STEPS_PER_BAR);
    const s = step % STEPS_PER_BAR;
    const playing = this.mood === "play";
    const sec = this.section(bar);
    const stripped = playing && (bar < this.stripUntil || sec.kind === "break");
    const prog =
      this.mood === "summit" ? BRIGHT : t > 0.62 ? TENSE : sec.kind === "b" ? LIFT : CALM;
    const chord = prog[bar % prog.length]!;
    const climb = this.climb;
    // Layers are earned: bass and drums after the first landing (or once it
    // is tense), the melody with a streak of three.
    const bassOn = !playing || climb.landings >= 1 || t > 0.45;
    const drumsOn = !playing || climb.landings >= 2 || t > 0.5;
    const leadOn = !playing || climb.streak >= 3 || t > 0.62;

    const cutoff = this.mood === "fallen" ? 420 : stripped ? 520 : 700 * Math.pow(18, t);
    graph.tone.frequency.setTargetAtTime(cutoff, time, 0.12);
    const level = this.mood === "fallen" ? 0.35 : this.mood === "menu" ? 0.7 : 0.95;
    graph.level.gain.setTargetAtTime(level, time, 0.25);
    graph.echo.delayTime.setTargetAtTime(Math.min(1.4, stepDur * 3), time, 0.05);
    const strain = this.mood === "play" ? Math.pow(Math.max(0, (t - 0.5) / 0.5), 2) * 0.04 : 0;
    graph.strain.gain.setTargetAtTime(strain, time, 0.2);
    graph.strainOscs[0]!.frequency.setTargetAtTime(hz(track.root + 25), time, 0.05);
    graph.strainOscs[1]!.frequency.setTargetAtTime(hz(track.root + 30), time, 0.05);

    if (s === 0) this.pad(graph, time, chord, stepDur * STEPS_PER_BAR, t);
    if (bar === this.swellBar && s === 0) this.swell(graph, time, stepDur * STEPS_PER_BAR);
    if (stripped) return stepDur;
    if (leadOn) this.lead(graph, time, s, chord, stepDur, t);
    if (this.mood !== "fallen") {
      if (bassOn) this.bass(graph, time, s, chord, stepDur, Math.max(t, playing ? 0.2 : t));
      if (drumsOn) this.kit(graph, time, s, Math.max(t, playing ? 0.45 : t));
      // A fill into the next section: a roll over the last beat.
      if (playing && sec.fill && drumsOn && s >= 12) {
        this.hit(graph, time, "bandpass", 1500 + (s - 12) * 300, 0.09, 0.08 + (s - 12) * 0.03);
      }
    }
    return stepDur;
  }

  private voice(
    graph: Graph,
    dest: AudioNode,
    time: number,
    freq: number,
    type: OscillatorType,
    peak: number,
    attack: number,
    hold: number,
    release: number,
    detune = 0,
  ): OscillatorNode {
    const { ctx } = graph;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peak, time + attack);
    gain.gain.setValueAtTime(peak, time + attack + hold);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + attack + hold + release);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + attack + hold + release + 0.05);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
    return osc;
  }

  private pad(graph: Graph, time: number, chord: Chord, barDur: number, t: number): void {
    const type = this.track.pad;
    const peak = (type === "sawtooth" ? 0.03 : 0.04) * (1 - t * 0.25);
    const attack = Math.min(0.7, barDur * 0.3);
    for (const semis of chord) {
      const freq = hz(this.track.root + semis);
      this.voice(graph, graph.tone, time, freq, type, peak, attack, barDur - attack, 0.6, -7);
      this.voice(graph, graph.tone, time, freq, type, peak, attack, barDur - attack, 0.6, 7);
    }
  }

  private lead(
    graph: Graph,
    time: number,
    s: number,
    chord: Chord,
    stepDur: number,
    t: number,
  ): void {
    const lift = 12 * this.track.lift;
    let note: number | null = null;
    let peak = 0.07;
    let release = 0.9;
    if (t < 0.3) {
      if (s === 0) note = chord[0]! + 12;
      else if (s === 6) note = chord[2]!;
      else if (s === 12) note = chord[1]! + 12;
    } else if (t < 0.65) {
      if (s % 2 === 0) {
        const [tone, octave] = LEAD_8[s / 2]!;
        note = chord[tone]! + octave * 12;
        peak = s % 4 === 0 ? 0.066 : 0.05;
        release = 0.34;
      }
    } else {
      const [tone, octave] = LEAD_16[s]!;
      note = chord[tone]! + octave * 12;
      peak = s % 4 === 0 ? 0.075 : 0.05;
      release = Math.max(0.09, stepDur * 1.2);
    }
    if (note === null) return;
    const type = this.track.lead;
    if (type === "square") peak *= 0.55;
    const freq = hz(this.track.root + lift + note);
    const osc = this.voice(graph, graph.tone, time, freq, type, peak, 0.006, 0, release);
    // Send a little to the echo for space.
    const send = graph.ctx.createGain();
    send.gain.value = 0;
    send.gain.setValueAtTime(peak * 0.5, time);
    send.gain.exponentialRampToValueAtTime(0.0001, time + release);
    osc.connect(send);
    send.connect(graph.echo);
    osc.addEventListener("ended", () => send.disconnect());
  }

  private bass(
    graph: Graph,
    time: number,
    s: number,
    chord: Chord,
    stepDur: number,
    t: number,
  ): void {
    if (t < 0.12) return;
    const root = this.track.root + chord[0]! - 12;
    const low = hz(root > this.track.root - 4 ? root - 12 : root);
    // Each note carries its octave too: phone speakers can't voice the fundamental.
    if (t < 0.45) {
      if (s === 0) {
        this.voice(graph, graph.tone, time, low, "triangle", 0.2, 0.02, stepDur * 5, 0.5);
        this.voice(graph, graph.tone, time, low * 2, "sine", 0.07, 0.02, stepDur * 5, 0.5);
      }
    } else if (t < 0.7) {
      if (s === 0 || s === 6 || s === 10) {
        this.voice(graph, graph.tone, time, low, "triangle", 0.2, 0.01, stepDur * 1.6, 0.16);
        this.voice(graph, graph.tone, time, low * 2, "sine", 0.07, 0.01, stepDur * 1.6, 0.16);
      }
    } else {
      const sixteenths = t > 0.86;
      if (sixteenths || s % 2 === 0) {
        const up = s % 4 === 2;
        this.voice(
          graph,
          graph.tone,
          time,
          up ? low * 2 : low,
          "sawtooth",
          0.16,
          0.006,
          stepDur * 0.5,
          0.09,
        );
      }
    }
  }

  private kit(graph: Graph, time: number, s: number, t: number): void {
    const kick = t > 0.68 ? s % 4 === 0 || (t > 0.9 && s === 14) : t > 0.4 && (s === 0 || s === 8);
    if (kick) {
      const { ctx } = graph;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(130, time);
      osc.frequency.exponentialRampToValueAtTime(44, time + 0.11);
      gain.gain.setValueAtTime(0.55, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
      osc.connect(gain);
      gain.connect(graph.drums);
      osc.start(time);
      osc.stop(time + 0.22);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    }
    if (t > 0.75 && (s === 4 || s === 12)) this.hit(graph, time, "bandpass", 1800, 0.12, 0.2);
    let hat = 0;
    if (t > 0.8) hat = s % 2 === 0 ? 0.075 : 0.04;
    else if (t > 0.5) hat = s % 4 === 2 ? 0.07 : 0;
    else if (t > 0.28) hat = s === 4 || s === 12 ? 0.055 : 0;
    if (hat > 0) this.hit(graph, time, "highpass", 7000, 0.035, hat);
  }

  /** A rising wash of noise over one bar: the lift into a new section. */
  private swell(graph: Graph, time: number, dur: number): void {
    const { ctx } = graph;
    const src = ctx.createBufferSource();
    src.buffer = graph.noise;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(300, time);
    filter.frequency.exponentialRampToValueAtTime(7000, time + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.14, time + dur * 0.95);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.08);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(graph.drums);
    src.start(time);
    src.stop(time + dur + 0.1);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  private hit(
    graph: Graph,
    time: number,
    type: BiquadFilterType,
    freq: number,
    dur: number,
    peak: number,
  ): void {
    const { ctx } = graph;
    const src = ctx.createBufferSource();
    src.buffer = graph.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(peak, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(graph.drums);
    src.start(time);
    src.stop(time + dur + 0.01);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  /**
   * Renders a few bars at a fixed tension without touching the speakers.
   * Used to check levels and to audition a track from the console.
   */
  static async render(track: Track, tension: number, bars = 4): Promise<AudioBuffer> {
    const sampleRate = 44100;
    const seconds = (60 / track.bpm) * 4 * bars + 1;
    const ctx = new OfflineAudioContext(1, Math.ceil(sampleRate * seconds), sampleRate);
    const rig = { musicEnabled: true } as AudioRig;
    const music = new Music(rig, track);
    music.mood = "play";
    music.target = clamp01(tension);
    music.tension = clamp01(tension);
    const graph = buildGraph(ctx, ctx.destination);
    let time = 0.05;
    for (let step = 0; step < bars * STEPS_PER_BAR; step++) {
      time += music.scheduleStep(graph, step, time);
    }
    return ctx.startRendering();
  }
}
