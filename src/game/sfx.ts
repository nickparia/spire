/**
 * Tiny synth. Nodes are created inside the gesture that calls unlock()
 * so iOS will actually make a sound.
 */
export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;

  unlock(): void {
    const w = window as Window & { webkitAudioContext?: typeof AudioContext };
    const AC = window.AudioContext ?? w.webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) {
      this.ctx = new AC({ latencyHint: "interactive" });
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.02);
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType,
    peak: number,
    slideTo?: number,
  ): void {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + dur);
    }
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  private noise(dur: number, peak: number, cutoff: number): void {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime;
    const n = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(Math.max(0.0002, peak), t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t);
    src.stop(t + dur);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  drop(): void {
    const wobble = 0.94 + Math.random() * 0.12;
    this.tone(170 * wobble, 0.09, "sine", 0.2, 64);
    this.noise(0.05, 0.1, 700);
  }

  slice(): void {
    this.noise(0.07, 0.14, 1400);
    this.tone(380, 0.05, "triangle", 0.05, 140);
  }

  perfect(streak: number): void {
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
    this.noise(0.04, 0.07, 1100);
    this.tone(120, 0.05, "square", 0.04);
  }

  hiss(): void {
    this.noise(0.14, 0.05, 420);
  }

  chime(): void {
    this.tone(698, 0.09, "sine", 0.11);
    this.tone(988, 0.14, "sine", 0.06);
  }

  best(): void {
    this.tone(880, 0.12, "sine", 0.1);
    this.tone(1174, 0.18, "sine", 0.06);
  }

  fail(): void {
    this.tone(196, 0.38, "sawtooth", 0.05, 48);
    this.noise(0.28, 0.12, 500);
  }
}
