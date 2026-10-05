/**
 * The one AudioContext, with a bus each for effects and music so they can be
 * switched independently. Created inside the gesture that calls unlock(), which
 * is what iOS needs before it will make a sound.
 */
export class AudioRig {
  ctx: AudioContext | null = null;
  sfxBus: GainNode | null = null;
  musicBus: GainNode | null = null;
  private sfxOn = true;
  private musicOn = true;
  private held = false;

  /** Returns true once the context exists. Safe to call on every tap. */
  unlock(): boolean {
    const w = window as Window & { webkitAudioContext?: typeof AudioContext };
    const AC = window.AudioContext ?? w.webkitAudioContext;
    if (!AC) return false;
    if (!this.ctx) {
      const ctx = new AC({ latencyHint: "interactive" });
      // A limiter on the way out: stacked effects over the score never clip.
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -9;
      limiter.knee.value = 8;
      limiter.ratio.value = 12;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.2;
      limiter.connect(ctx.destination);
      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = this.sfxOn ? 0.9 : 0;
      this.sfxBus.connect(limiter);
      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = this.musicOn ? 1 : 0;
      this.musicBus.connect(limiter);
      this.ctx = ctx;
    }
    if (!this.held && this.ctx.state !== "running") void this.ctx.resume();
    return true;
  }

  get sfxEnabled(): boolean {
    return this.sfxOn;
  }

  get musicEnabled(): boolean {
    return this.musicOn;
  }

  setSfx(on: boolean): void {
    this.sfxOn = on;
    if (this.ctx && this.sfxBus) {
      this.sfxBus.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.02);
    }
  }

  setMusic(on: boolean): void {
    this.musicOn = on;
    if (this.ctx && this.musicBus) {
      this.musicBus.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, 0.08);
    }
  }

  /** Silence everything while the app is in the background. */
  hold(): void {
    this.held = true;
    if (this.ctx && this.ctx.state === "running") void this.ctx.suspend();
  }

  release(): void {
    this.held = false;
    if (this.ctx && this.ctx.state !== "running") void this.ctx.resume();
  }
}
