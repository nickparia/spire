import {
  beatPhase,
  courseFor,
  courseHint,
  courseLabel,
  isKeystone,
  MIN_W,
  mix,
  periodFor,
  resolveDrop,
  shade,
  shouldSpawnBomb,
  shouldSpawnMote,
  slabRgb,
  swayOffset,
  tolerance,
  travelRate,
  type CourseId,
  type RGB,
} from "./logic";
import { Sfx } from "./sfx";

const SAVE_KEY = "spire-v1";
const STEP = 1 / 60;
const SLAB_H = 28;
const VISUAL_H = 24;
const GROUND = 156;

export type HudPhase = "boot" | "play" | "over";

export type Hud = {
  phase: HudPhase;
  score: number;
  floors: number;
  streak: number;
  perfects: number;
  best: number;
  newBest: boolean;
  muted: boolean;
  course: string;
  blurb: string;
  relic: string;
  hold: boolean;
  hint: boolean;
};

type Slab = {
  x: number;
  y: number;
  w: number;
  floor: number;
  anim: number;
  flash: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  fallDelay: number;
  falling: boolean;
  key: boolean;
};

type Scrap = {
  x: number;
  y: number;
  w: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  rgb: RGB;
  life: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  rgb: RGB;
};

type Floater = {
  text: string;
  x: number;
  y: number;
  vy: number;
  life: number;
  max: number;
  hot: boolean;
};

type Mover = {
  u: number;
  x: number;
  y: number;
  w: number;
  dir: number;
  halfSpan: number;
  center: number;
  period: number;
  pxSpeed: number;
  wind: number;
  course: CourseId;
  keystone: boolean;
};

type Mote = { x: number; y: number; kind: "shield" | "lull" };
type Bomb = { x: number; y: number; fuse: number; max: number; flash: number };

type Save = { v: 1; best: number; bestFloors: number; muted: boolean };

function loadSave(): Save {
  const empty: Save = { v: 1, best: 0, bestFloors: 0, muted: false };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<Save>;
    return {
      v: 1,
      best: typeof parsed.best === "number" ? parsed.best : 0,
      bestFloors: typeof parsed.bestFloors === "number" ? parsed.bestFloors : 0,
      muted: Boolean(parsed.muted),
    };
  } catch {
    return empty;
  }
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

function rgba(c: RGB, a = 1): string {
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
}

function hashNoise(t: number): number {
  const s = Math.sin(t * 41.2) + Math.sin(t * 17.7 + 2.1) + Math.sin(t * 7.3 + 4.2);
  return s / 3;
}

type Star = { x: number; y: number; r: number; a: number };

export class SpireEngine {
  private ctx: CanvasRenderingContext2D;
  private sfx = new Sfx();
  private onHud: (hud: Hud) => void;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private running = false;
  private reduceMotion = false;

  private viewW = 390;
  private viewH = 844;
  private dpr = 1;

  private phase: "boot" | "play" | "fall" = "boot";
  private stack: Slab[] = [];
  private mover: Mover = {
    u: 0,
    x: 0,
    y: 0,
    w: 160,
    dir: 1,
    halfSpan: 80,
    center: 0,
    period: 1,
    pxSpeed: 200,
    wind: 1,
    course: "slide",
    keystone: false,
  };
  private mote: Mote | null = null;
  private bomb: Bomb | null = null;
  private shield = false;
  private lull = false;
  private wind = 1;
  private courseSeen: CourseId = "slide";
  private beatOn = false;
  private scraps: Scrap[] = [];
  private particles: Particle[] = [];
  private floaters: Floater[] = [];
  private embers: Particle[] = [];
  private stars: Star[] = [];

  private startW = 180;
  private dir = 1;
  private floors = 0;
  private score = 0;
  private streak = 0;
  private perfects = 0;
  private best = 0;
  private bestFloors = 0;
  private ghostFloors = 0;
  private newBest = false;
  private crossed = false;
  private muted = false;
  private hint = true;
  private tol = 12;
  private wasInZone = false;
  private freeze = 0;
  private fallAge = 0;
  private camX = 0;
  private camY = 0;
  private camDrop = 0;
  private trauma = 0;
  private flash = 0;
  private clock = 0;
  private vignette: CanvasGradient | null = null;

  constructor(canvas: HTMLCanvasElement, onHud: (hud: Hud) => void) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    this.ctx = ctx;
    this.onHud = onHud;
    this.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const save = loadSave();
    this.best = save.best;
    this.bestFloors = save.bestFloors;
    this.muted = save.muted;
    this.sfx.setMuted(this.muted);
    this.seedStars();
    this.seedEmbers();
  }

  start(): void {
    this.resize();
    this.reset(true);
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    document.addEventListener("visibilitychange", this.onVisible);
  }

  destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    document.removeEventListener("visibilitychange", this.onVisible);
  }

  resize(): void {
    const canvas = this.ctx.canvas;
    const parent = canvas.parentElement;
    const w = parent?.clientWidth || window.innerWidth;
    const h = parent?.clientHeight || window.innerHeight;
    if (w < 2 || h < 2) return;
    this.viewW = w;
    this.viewH = h;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * this.dpr);
    canvas.height = Math.round(h * this.dpr);
    this.vignette = null;
  }

  tap(): void {
    this.sfx.unlock();
    if (this.phase === "fall") {
      if (this.fallAge >= 0.68) this.reset(false);
      return;
    }
    if (this.freeze > 0) return;
    if (this.bomb && this.bomb.fuse > 0) {
      this.bomb.flash = 1;
      this.sfx.sputter();
      this.float("WAIT", this.bomb.x, this.bomb.y + 30, false);
      this.trauma = Math.min(1, this.trauma + 0.15);
      return;
    }
    this.place();
  }

  toggleMute(): void {
    this.sfx.unlock();
    this.muted = !this.muted;
    this.sfx.setMuted(this.muted);
    this.persist();
    this.emit();
  }

  private onVisible = (): void => {
    if (document.visibilityState === "visible") this.sfx.unlock();
  };

  private seedStars(): void {
    this.stars.length = 0;
    for (let i = 0; i < 48; i++) {
      this.stars.push({
        x: (i * 83) % 420,
        y: (i * 137) % 920,
        r: i % 9 === 0 ? 2 : 1,
        a: 0.12 + (i % 4) * 0.07,
      });
    }
  }

  private seedEmbers(): void {
    this.embers.length = 0;
    for (let i = 0; i < 18; i++) {
      this.embers.push(this.makeEmber(i * 180));
    }
  }

  private makeEmber(y: number): Particle {
    return {
      x: -160 + ((y * 17) % 320),
      y,
      vx: -8 + (y % 16),
      vy: 18 + (y % 20),
      life: 4 + (y % 5),
      max: 6,
      size: 1.4 + (y % 3),
      rgb: y % 2 === 0 ? [255, 77, 26] : [246, 200, 160],
    };
  }

  private reset(boot: boolean): void {
    this.phase = boot ? "boot" : "play";
    this.hint = true;
    this.floors = 0;
    this.score = 0;
    this.streak = 0;
    this.perfects = 0;
    this.newBest = false;
    this.crossed = false;
    this.ghostFloors = this.bestFloors;
    this.scraps = [];
    this.particles = [];
    this.floaters = [];
    this.freeze = 0;
    this.fallAge = 0;
    this.trauma = 0;
    this.flash = 0;
    this.wasInZone = false;
    this.dir = 1;
    this.wind = 1;
    this.shield = false;
    this.lull = false;
    this.mote = null;
    this.bomb = null;
    this.courseSeen = "slide";
    this.beatOn = false;
    this.camX = 0;
    this.camY = 0;
    this.camDrop = 0;

    this.startW =
      this.viewW < 520
        ? Math.max(156, Math.min(214, this.viewW * 0.48))
        : Math.max(220, Math.min(300, this.viewW * 0.26));
    const foundation: Slab = {
      x: -this.startW / 2,
      y: 0,
      w: this.startW,
      floor: 0,
      anim: 1,
      flash: 0,
      vx: 0,
      vy: 0,
      rot: 0,
      vr: 0,
      fallDelay: 0,
      falling: false,
      key: false,
    };
    this.stack = [foundation];
    this.spawnMover();
    this.emit();
  }

  private spawnMover(): void {
    const prev = this.stack[this.stack.length - 1]!;
    const w = prev.w;
    const course = courseFor(this.floors);
    const halfSpan = Math.max(w * 0.98, 80);
    const center = prev.x + prev.w / 2;
    this.dir = -this.dir;
    const dir = this.dir;
    this.wind = -this.wind;
    const period = periodFor(this.floors) * (this.lull ? 1.8 : 1);
    this.lull = false;
    const keystone = isKeystone(this.floors);
    this.mover = {
      u: dir > 0 ? -0.56 : 0.56,
      x: 0,
      y: prev.y + SLAB_H,
      w,
      dir,
      halfSpan,
      center,
      period,
      pxSpeed: halfSpan * travelRate(course, dir, this.wind, 0, period, this.clock),
      wind: this.wind,
      course,
      keystone,
    };
    this.syncMoverX();
    this.tol = this.toleranceNow();
    this.wasInZone = false;
    this.mote = null;
    if (shouldSpawnMote(this.floors)) {
      const nudge = Math.min(halfSpan * 0.5, Math.max(this.tol + 14, w * 0.36));
      const side = this.floors % 8 === 1 ? 1 : -1;
      this.mote = {
        x: center + side * nudge,
        y: prev.y + SLAB_H + VISUAL_H + 22,
        kind: this.floors % 8 === 1 ? "shield" : "lull",
      };
    }
    this.bomb = null;
    if (!this.mote && shouldSpawnBomb(this.floors)) {
      const fuse = Math.max(0.78, 1.35 - this.floors * 0.012);
      this.bomb = {
        x: center,
        y: prev.y + SLAB_H + VISUAL_H + 46,
        fuse,
        max: fuse,
        flash: 0,
      };
    }
    if (course !== this.courseSeen) {
      this.courseSeen = course;
      this.float(courseHint(course).toUpperCase(), center, prev.y + SLAB_H + 52, true);
    } else if (keystone) {
      this.float("KEYSTONE", center, prev.y + SLAB_H + 48, true);
    }
  }

  private sway(): number {
    return swayOffset(this.mover.course, this.clock, this.mover.w);
  }

  private syncMoverX(): void {
    const m = this.mover;
    const center = m.center + this.sway();
    const leftMin = center - m.halfSpan - m.w / 2;
    const t = (Math.max(-1, Math.min(1, m.u)) + 1) / 2;
    m.x = leftMin + t * (m.halfSpan * 2);
  }

  private toleranceNow(): number {
    const m = this.mover;
    const base = 2 / Math.max(0.2, m.period);
    const peak =
      m.course === "beat" ? base * 1.9 : m.course === "breath" ? base * 1.3 : 0;
    const px = Math.max(1, peak > 0 ? m.halfSpan * peak : m.pxSpeed);
    const tol = tolerance(px, this.floors, m.w);
    return m.keystone ? tol * 0.68 : tol;
  }

  private advanceMover(dt: number): void {
    const m = this.mover;
    const rate = travelRate(m.course, m.dir, m.wind, m.u, m.period, this.clock);
    m.pxSpeed = m.halfSpan * rate;
    const du = m.dir * rate * dt;
    const steps = Math.min(8, Math.max(1, Math.ceil((Math.abs(du) * m.halfSpan) / 6)));
    const sub = du / steps;
    for (let i = 0; i < steps; i++) {
      m.u += sub;
      if (m.u >= 1) {
        m.u = 1;
        m.dir = -1;
      } else if (m.u <= -1) {
        m.u = -1;
        m.dir = 1;
      }
      this.syncMoverX();
    }
    this.tol = this.toleranceNow();
  }

  private place(): void {
    const prev = this.stack[this.stack.length - 1];
    if (!prev || this.phase === "fall") return;
    const result = resolveDrop({
      prevX: prev.x,
      prevW: prev.w,
      moverX: this.mover.x,
      moverW: this.mover.w,
      tol: this.tol,
      startW: this.startW,
      streak: this.streak,
    });

    if (!result.ok) {
      if (this.shield) this.spare(prev);
      else this.die();
      return;
    }

    const floor = this.stack.length;
    const slab: Slab = {
      x: result.x,
      y: prev.y + SLAB_H,
      w: result.w,
      floor,
      anim: 0,
      flash: 1,
      vx: 0,
      vy: 0,
      rot: 0,
      vr: 0,
      fallDelay: 0,
      falling: false,
      key: this.mover.keystone && result.perfect,
    };
    let points = result.points;
    if (this.mover.keystone && result.perfect) points += result.points;
    this.stack.push(slab);
    this.floors = floor;
    this.score += points;
    this.streak = result.streak;
    if (result.perfect) this.perfects += 1;
    this.hint = false;
    this.phase = "play";

    if (this.score > this.best) {
      this.best = this.score;
      this.newBest = true;
    }
    if (this.floors > this.bestFloors) this.bestFloors = this.floors;
    if (!this.crossed && this.ghostFloors > 0 && this.floors > this.ghostFloors) {
      this.crossed = true;
      this.sfx.best();
      this.float("NEW BEST", result.x + result.w / 2, slab.y + 46, true);
    }

    const rgb = slabRgb(floor);
    if (result.perfect) {
      this.burst(result.x + result.w / 2, slab.y + VISUAL_H / 2, rgb, result.forged ? 28 : 16, 160);
      this.flash = result.forged ? 0.45 : 0.22;
      this.trauma = Math.min(1, this.trauma + (result.forged ? 0.45 : 0.22));
      this.freeze = this.reduceMotion ? 0.02 : result.forged ? 0.09 : 0.055;
      if (result.forged) {
        this.sfx.forge();
        this.float("FORGE", result.x + result.w / 2, slab.y + 40, true);
      } else if (this.mover.keystone) {
        this.sfx.perfect(result.streak);
        this.float("KEYSTONE", result.x + result.w / 2, slab.y + 36, true);
      } else {
        this.sfx.perfect(result.streak);
        this.float(
          result.streak >= 2 ? `PERFECT ×${result.streak}` : "PERFECT",
          result.x + result.w / 2,
          slab.y + 36,
          true,
        );
      }
      this.blip(result.forged ? [18, 24, 12] : 12);
    } else {
      this.sfx.drop();
      if (result.scrap && result.scrap.w > 6) {
        this.sfx.slice();
        this.scraps.push({
          x: result.scrap.x,
          y: slab.y,
          w: result.scrap.w,
          vx: (result.scrap.x < result.x ? -1 : 1) * (90 + Math.random() * 80),
          vy: 80 + Math.random() * 60,
          rot: 0,
          vr: (result.scrap.x < result.x ? -1 : 1) * (2 + Math.random() * 3),
          rgb,
          life: 1.1,
        });
      }
      this.burst(
        result.scrap ? result.scrap.x + result.scrap.w / 2 : result.x,
        slab.y + 8,
        rgb,
        10,
        120,
      );
      this.trauma = Math.min(1, this.trauma + 0.28);
      this.freeze = this.reduceMotion ? 0.015 : 0.04;
      if (result.close) this.float("CLOSE", result.x + result.w / 2, slab.y + 34, false);
      this.blip(8);
    }

    this.collectMote(result.x + result.w / 2, slab.y);
    this.camDrop = 64;
    this.persist();
    this.spawnMover();
    this.emit();
  }

  private collectMote(x: number, y: number): void {
    const mote = this.mote;
    if (!mote) return;
    const center = this.mover.x + this.mover.w / 2;
    if (Math.abs(center - mote.x) > 30) return;
    this.mote = null;
    this.score += 15;
    this.sfx.chime();
    if (mote.kind === "shield") {
      this.shield = true;
      this.float("SHIELD", x, y + 58, false);
    } else {
      this.lull = true;
      this.float("LULL", x, y + 58, false);
    }
    this.burst(mote.x, mote.y, [255, 77, 26], 12, 140);
  }

  private spare(prev: Slab): void {
    this.shield = false;
    const w = Math.max(MIN_W + 8, prev.w * 0.46);
    const x = prev.x + (prev.w - w) / 2;
    const floor = this.stack.length;
    const slab: Slab = {
      x,
      y: prev.y + SLAB_H,
      w,
      floor,
      anim: 0,
      flash: 1,
      vx: 0,
      vy: 0,
      rot: 0,
      vr: 0,
      fallDelay: 0,
      falling: false,
      key: false,
    };
    this.stack.push(slab);
    this.floors = floor;
    this.score += 5;
    this.streak = 0;
    this.hint = false;
    this.phase = "play";
    this.mote = null;
    this.trauma = Math.min(1, this.trauma + 0.45);
    this.flash = 0.2;
    this.freeze = 0.08;
    this.sfx.slice();
    this.float("SAVED", x + w / 2, slab.y + 40, false);
    this.camDrop = 64;
    this.burst(x + w / 2, slab.y + 10, slabRgb(floor), 16, 150);
    this.persist();
    this.spawnMover();
    this.emit();
  }

  private die(): void {
    this.phase = "fall";
    this.fallAge = 0;
    this.hint = false;
    this.bomb = null;
    this.freeze = 0;
    const rgb = slabRgb(this.floors + 1);
    this.scraps.push({
      x: this.mover.x,
      y: this.mover.y,
      w: this.mover.w,
      vx: this.mover.dir * 140,
      vy: 40,
      rot: 0,
      vr: this.mover.dir * 3.2,
      rgb,
      life: 1.6,
    });
    for (let i = 0; i < this.stack.length; i++) {
      const slab = this.stack[i]!;
      const fromTop = this.stack.length - 1 - i;
      slab.falling = true;
      slab.fallDelay = fromTop * 0.028;
      slab.vx = (Math.random() - 0.5) * 160;
      slab.vy = 20 + Math.random() * 40;
      slab.vr = (Math.random() - 0.5) * 5;
    }
    this.burst(this.mover.x + this.mover.w / 2, this.mover.y, rgb, 26, 220);
    this.trauma = 1;
    this.flash = 0.35;
    this.sfx.fail();
    this.blip([24, 40, 28]);
    this.persist();
    this.emit();
  }

  private blip(pattern: number | number[]): void {
    const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
    if (typeof nav.vibrate === "function") nav.vibrate(pattern);
  }

  private float(text: string, x: number, y: number, hot: boolean): void {
    this.floaters.push({ text, x, y, vy: 42, life: 0.85, max: 0.85, hot });
  }

  private burst(x: number, y: number, rgb: RGB, n: number, speed: number): void {
    const count = this.reduceMotion ? Math.ceil(n * 0.35) : n;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random() * 0.75);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s + 40,
        life: 0.35 + Math.random() * 0.35,
        max: 0.7,
        size: 1.5 + Math.random() * 2.6,
        rgb,
      });
    }
    if (this.particles.length > 200) this.particles.splice(0, this.particles.length - 200);
  }

  private persist(): void {
    const save: Save = {
      v: 1,
      best: this.best,
      bestFloors: this.bestFloors,
      muted: this.muted,
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      /* private mode */
    }
  }

  private emit(): void {
    this.onHud({
      phase: this.phase === "fall" ? "over" : this.phase,
      score: this.score,
      floors: this.floors,
      streak: this.streak,
      perfects: this.perfects,
      best: this.best,
      newBest: this.newBest,
      muted: this.muted,
      course: this.phase === "boot" ? "" : courseLabel(this.mover.course),
      blurb: this.phase === "boot" || this.mover.course === "slide" ? "" : courseHint(this.mover.course),
      relic: this.shield ? "Shield" : "",
      hold: !!this.bomb && this.bomb.fuse > 0 && this.phase !== "fall",
      hint: this.hint && this.phase !== "fall",
    });
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.acc += dt;
    let steps = 0;
    while (this.acc >= STEP && steps < 5) {
      this.step(STEP);
      this.acc -= STEP;
      steps++;
    }
    if (steps === 5) this.acc = 0;
    this.render();
    this.raf = requestAnimationFrame(this.frame);
  };

  private step(dt: number): void {
    this.clock += dt;
    if (this.freeze > 0) this.freeze -= dt;

    if (this.phase !== "fall" && this.freeze <= 0) {
      this.advanceMover(dt);
      const prev = this.stack[this.stack.length - 1];
      if (prev) {
        const inZone = Math.abs(this.mover.x - prev.x) <= this.tol;
        if (inZone && !this.wasInZone) this.sfx.tick();
        this.wasInZone = inZone;
      }
      if (this.mover.course === "beat") {
        const moving = beatPhase(this.clock, this.mover.period) < 0.58;
        if (moving && !this.beatOn) this.sfx.pulse();
        this.beatOn = moving;
      } else {
        this.beatOn = false;
      }
    }

    if (this.bomb && this.phase !== "fall") {
      this.bomb.fuse -= dt;
      this.bomb.flash = Math.max(0, this.bomb.flash - dt * 5);
      if (this.bomb.fuse <= 0) {
        this.burst(this.bomb.x, this.bomb.y, [255, 77, 26], 14, 160);
        this.sfx.hiss();
        this.bomb = null;
        this.emit();
      }
    }

    if (this.phase === "fall") {
      this.fallAge += dt;
      for (const slab of this.stack) {
        if (!slab.falling) continue;
        slab.fallDelay -= dt;
        if (slab.fallDelay > 0) continue;
        slab.vy -= 1500 * dt;
        slab.y += slab.vy * dt;
        slab.x += slab.vx * dt;
        slab.rot += slab.vr * dt;
      }
    } else {
      for (const slab of this.stack) {
        if (slab.anim < 1) slab.anim = Math.min(1, slab.anim + dt / 0.22);
        if (slab.flash > 0) slab.flash = Math.max(0, slab.flash - dt / 0.16);
      }
    }

    for (let i = this.scraps.length - 1; i >= 0; i--) {
      const s = this.scraps[i]!;
      s.vy -= 1400 * dt;
      s.y += s.vy * dt;
      s.x += s.vx * dt;
      s.rot += s.vr * dt;
      s.life -= dt;
      if (s.life <= 0) this.scraps.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.vy -= 520 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i]!;
      f.y += f.vy * dt;
      f.life -= dt;
      if (f.life <= 0) this.floaters.splice(i, 1);
    }

    for (const e of this.embers) {
      e.y += e.vy * dt;
      e.x += e.vx * dt;
      e.life -= dt;
      if (e.life <= 0 || e.y > this.camY + this.viewH) {
        const spawn = this.makeEmber(this.camY - 40 - Math.random() * 80);
        e.x = -this.viewW * 0.45 + Math.random() * this.viewW * 0.9;
        e.y = spawn.y;
        e.life = spawn.life;
        e.vy = spawn.vy;
      }
    }

    const focus = this.stack[this.stack.length - 1];
    if (focus && this.phase !== "fall") {
      const seam = focus.y + SLAB_H;
      const targetY = Math.max(0, seam - this.viewH * 0.46 + GROUND) + this.camDrop;
      const targetX = focus.x + focus.w / 2;
      const ky = 1 - Math.exp(-5.2 * dt);
      this.camY += (targetY - this.camY) * ky;
      this.camX += (targetX - this.camX) * ky;
    }
    this.camDrop = Math.max(0, this.camDrop - dt * 110);

    this.trauma = Math.max(0, this.trauma - dt * 1.7);
    this.flash = Math.max(0, this.flash - dt * 1.8);
  }

  private worldToScreen(x: number, yBottom: number): { x: number; y: number } {
    return {
      x: this.viewW / 2 + (x - this.camX),
      y: this.viewH - GROUND - (yBottom - this.camY),
    };
  }

  private render(): void {
    const ctx = this.ctx;
    const w = this.viewW;
    const h = this.viewH;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const shakeAmp = this.reduceMotion ? 0.12 : 1;
    const mag = this.trauma * this.trauma * shakeAmp;
    const ox = hashNoise(this.clock * 23) * 11 * mag;
    const oy = hashNoise(this.clock * 19 + 2) * 8 * mag;
    const rot = hashNoise(this.clock * 15 + 5) * 0.012 * mag;

    ctx.save();
    ctx.translate(w / 2 + ox, h / 2 + oy);
    ctx.rotate(rot);
    ctx.translate(-w / 2, -h / 2);
    if (this.mover.course === "sway" && this.phase !== "fall" && !this.reduceMotion) {
      ctx.translate(w / 2, h * 0.72);
      ctx.rotate(Math.sin(this.clock * 1.55) * 0.014);
      ctx.translate(-w / 2, -h * 0.72);
    }

    this.drawSky(ctx);
    this.drawAtmosphere(ctx);
    this.drawStars(ctx);
    this.drawEmbers(ctx);
    this.drawGhost(ctx);
    this.drawPlinth(ctx);

    const prev = this.stack[this.stack.length - 1];
    const inZone =
      this.phase !== "fall" && !!prev && Math.abs(this.mover.x - prev.x) <= this.tol;

    for (const slab of this.stack) this.drawSlab(ctx, slab, inZone && slab === prev);
    for (const scrap of this.scraps) this.drawScrap(ctx, scrap);
    if (this.phase !== "fall" && this.mote) this.drawMote(ctx);

    if (this.phase !== "fall") this.drawMover(ctx, inZone);
    if (this.phase !== "fall" && this.bomb) this.drawBomb(ctx);

    for (const p of this.particles) {
      const s = this.worldToScreen(p.x, p.y);
      const a = Math.max(0, p.life / p.max);
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(p.rgb, 1);
      ctx.fillRect(s.x, s.y, p.size, p.size);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
    this.drawVignette(ctx);
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(246,241,232,${this.flash * 0.28})`;
      ctx.fillRect(0, 0, w, h);
    }
    this.drawFloaters(ctx);
  }

  private drawSky(ctx: CanvasRenderingContext2D): void {
    const g = ctx.createLinearGradient(0, 0, 0, this.viewH);
    g.addColorStop(0, "#0c0b09");
    g.addColorStop(0.55, "#141210");
    g.addColorStop(1, "#1a1410");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.viewW, this.viewH);

    const ground = this.worldToScreen(0, 0);
    if (ground.y < this.viewH + 80 && ground.y > -40) {
      const glow = ctx.createLinearGradient(0, ground.y - 120, 0, ground.y + 30);
      glow.addColorStop(0, "rgba(255,77,26,0)");
      glow.addColorStop(1, "rgba(255,77,26,0.13)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, ground.y - 120, this.viewW, 160);
    }
    if (this.mover.course === "eclipse" && this.phase !== "fall") {
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.fillRect(0, 0, this.viewW, this.viewH);
    }
  }

  private drawAtmosphere(ctx: CanvasRenderingContext2D): void {
    const course = this.mover.course;
    if (this.phase === "fall") return;
    if (course === "gust") {
      const drift = this.mover.wind * this.clock * 70;
      ctx.fillStyle = "rgba(255,77,26,0.28)";
      for (let i = 0; i < 7; i++) {
        const y = (i * 97 + this.clock * 18) % this.viewH;
        const span = this.viewW + 90;
        const raw = drift + i * 160;
        const x = ((raw % span) + span) % span - 50;
        ctx.fillRect(x, y, 42 + (i % 3) * 10, 1.5);
      }
    }
    if (course === "breath" && !this.reduceMotion) {
      const a = 0.05 + 0.04 * Math.sin(this.clock * 1.4);
      const g = ctx.createRadialGradient(this.viewW / 2, this.viewH * 0.62, 20, this.viewW / 2, this.viewH * 0.62, this.viewH * 0.5);
      g.addColorStop(0, `rgba(255,77,26,${a})`);
      g.addColorStop(1, "rgba(255,77,26,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
    }
  }

  private drawStars(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#f6f1e8";
    const spanY = this.viewH + 80;
    for (const star of this.stars) {
      const y = (((star.y - this.camY * 0.12) % spanY) + spanY) % spanY - 40;
      const x = star.x % (this.viewW + 10);
      ctx.globalAlpha = star.a;
      ctx.fillRect(x, y, star.r, star.r);
    }
    ctx.globalAlpha = 1;
  }

  private drawEmbers(ctx: CanvasRenderingContext2D): void {
    for (const e of this.embers) {
      const s = this.worldToScreen(e.x, e.y);
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = rgba(e.rgb, 1);
      ctx.fillRect(s.x, s.y, e.size, e.size);
    }
    ctx.globalAlpha = 1;
  }

  private drawGhost(ctx: CanvasRenderingContext2D): void {
    if (this.ghostFloors <= 0 || this.floors > this.ghostFloors || this.phase === "fall") return;
    const y = this.ghostFloors * SLAB_H;
    const s = this.worldToScreen(-this.viewW, y);
    if (s.y < -20 || s.y > this.viewH + 20) return;
    ctx.save();
    ctx.strokeStyle = "rgba(246,241,232,0.35)";
    ctx.setLineDash([5, 7]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(28, s.y);
    ctx.lineTo(this.viewW - 28, s.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "600 11px Outfit, system-ui, sans-serif";
    ctx.fillStyle = "rgba(246,241,232,0.55)";
    ctx.textAlign = "left";
    ctx.fillText("BEST", 28, s.y - 6);
    ctx.restore();
  }

  private drawPlinth(ctx: CanvasRenderingContext2D): void {
    const base = this.stack[0];
    if (!base) return;
    const w = base.w + 36;
    const x = base.x - 18;
    const s = this.worldToScreen(x, -6);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(s.x + w / 2, s.y + 16, w * 0.55, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    this.paintSlab(ctx, s.x, s.y, w, 16, shade(slabRgb(0), -0.45), 1, 0, false);
  }

  private drawSlab(ctx: CanvasRenderingContext2D, slab: Slab, hotGroove: boolean): void {
    const s = this.worldToScreen(slab.x, slab.y);
    if (s.y < -80 || s.y - VISUAL_H > this.viewH + 120) return;
    const settled = slab.anim >= 1 || this.reduceMotion;
    const scaleY = settled ? 1 : 0.74 + 0.26 * easeOutBack(Math.min(1, slab.anim));
    const body = slab.flash > 0 ? mix(slabRgb(slab.floor), [255, 255, 255], slab.flash * 0.82) : slabRgb(slab.floor);
    this.paintSlab(ctx, s.x, s.y, slab.w, VISUAL_H, body, scaleY, slab.rot, hotGroove);
    if (slab.key && !slab.falling) {
      ctx.fillStyle = "rgba(246,241,232,0.9)";
      ctx.fillRect(s.x + 8, s.y - VISUAL_H + 6, Math.max(8, slab.w - 16), 3);
    }
  }

  private drawMover(ctx: CanvasRenderingContext2D, inZone: boolean): void {
    const m = this.mover;
    const phase = beatPhase(this.clock, m.period);
    const kicking = m.course === "beat" && phase < 0.2;
    let rgb = m.keystone ? mix(slabRgb(this.floors + 1), [246, 241, 232], 0.45) : slabRgb(this.floors + 1);
    if (kicking) rgb = mix(rgb, [255, 255, 255], 0.55);
    const hidden = m.course === "eclipse" && !inZone;
    const holding = m.course === "breath" && Math.abs(m.u) > 0.78;
    const squash = holding && !this.reduceMotion ? 0.84 : 1;
    ctx.save();
    ctx.globalAlpha = hidden ? 0.22 : 1;
    if (!this.reduceMotion && !hidden) {
      const trail = m.course === "rush" ? 5 : 3;
      for (let i = trail; i >= 1; i--) {
        const ox = -m.dir * Math.min(m.course === "rush" ? 22 : 14, m.pxSpeed * 0.02) * i;
        const s = this.worldToScreen(m.x + ox, m.y);
        ctx.globalAlpha = 0.045 * i;
        this.paintSlab(ctx, s.x, s.y, m.w, VISUAL_H, rgb, 1, 0, false);
      }
      ctx.globalAlpha = hidden ? 0.22 : 1;
    }
    const s = this.worldToScreen(m.x, m.y);
    if (m.course === "sway") {
      const home = this.worldToScreen(m.center - m.w / 2, m.y);
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = "#f6f1e8";
      ctx.strokeRect(home.x, home.y - VISUAL_H, m.w, VISUAL_H);
      ctx.restore();
    }
    if (inZone && !this.reduceMotion) {
      ctx.save();
      ctx.shadowColor = m.course === "eclipse" ? "rgba(246,241,232,0.95)" : "rgba(255,77,26,0.8)";
      ctx.shadowBlur = m.course === "eclipse" ? 26 : 16;
      this.paintSlab(ctx, s.x, s.y, m.w, VISUAL_H, mix(rgb, [255, 255, 255], 0.35), squash, 0, true);
      ctx.restore();
    } else {
      this.paintSlab(ctx, s.x, s.y, m.w, VISUAL_H, rgb, squash, 0, false);
    }
    if (m.keystone) {
      ctx.fillStyle = "#f6f1e8";
      ctx.fillRect(s.x + 8, s.y - VISUAL_H + 6, Math.max(8, m.w - 16), 3);
    }
    if (m.course === "gust") {
      ctx.fillStyle = "rgba(255,77,26,0.9)";
      const tip = m.wind > 0 ? s.x + m.w + 8 : s.x - 8;
      for (let i = 0; i < 3; i++) {
        const y = s.y - VISUAL_H + 6 + i * 6;
        ctx.fillRect(tip - (m.wind > 0 ? 0 : 14), y, 14, 2);
      }
    }
    if (m.course === "beat") {
      const fill = phase < 0.58 ? phase / 0.58 : 0;
      const bar = this.worldToScreen(m.x + m.w / 2, m.y + VISUAL_H + 14);
      ctx.fillStyle = "rgba(246,241,232,0.28)";
      ctx.fillRect(bar.x - 22, bar.y, 44, 3);
      ctx.fillStyle = kicking ? "#f6f1e8" : "#ff4d1a";
      ctx.fillRect(bar.x - 22, bar.y, 44 * fill, 3);
    }
    if (holding) {
      ctx.fillStyle = "rgba(246,241,232,0.85)";
      ctx.fillRect(s.x - 6, s.y - VISUAL_H + 8, 2, 8);
      ctx.fillRect(s.x + m.w + 4, s.y - VISUAL_H + 8, 2, 8);
    }
    if (m.course === "eclipse" && inZone) {
      ctx.strokeStyle = "rgba(246,241,232,0.75)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(s.x - 7, s.y - VISUAL_H - 6, m.w + 14, VISUAL_H + 12);
    }
    ctx.restore();
  }

  private drawBomb(ctx: CanvasRenderingContext2D): void {
    const bomb = this.bomb;
    if (!bomb) return;
    const s = this.worldToScreen(bomb.x, bomb.y);
    const t = Math.max(0, bomb.fuse / bomb.max);
    const pulse = 1 + Math.sin(this.clock * 10) * 0.06 + bomb.flash * 0.2;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = "rgba(255,77,26,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t);
    ctx.stroke();
    ctx.fillStyle = bomb.flash > 0.2 ? "#ff4d1a" : "#1a120e";
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f6f1e8";
    ctx.fillRect(-1, -14, 2, 6);
    ctx.fillStyle = "#ff4d1a";
    ctx.beginPath();
    ctx.arc(0, -16, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawMote(ctx: CanvasRenderingContext2D): void {
    const mote = this.mote;
    if (!mote) return;
    const s = this.worldToScreen(mote.x, mote.y);
    const pulse = 1 + Math.sin(this.clock * 6) * 0.12;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = "#ff4d1a";
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 9);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f6f1e8";
    ctx.font = "700 12px Outfit, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(mote.kind === "shield" ? "SHIELD" : "LULL", 0, -16);
    ctx.restore();
  }

  private drawScrap(ctx: CanvasRenderingContext2D, scrap: Scrap): void {
    const s = this.worldToScreen(scrap.x, scrap.y);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, scrap.life));
    this.paintSlab(ctx, s.x, s.y, scrap.w, VISUAL_H, scrap.rgb, 1, scrap.rot, false);
    ctx.restore();
  }

  private paintSlab(
    ctx: CanvasRenderingContext2D,
    sx: number,
    syBottom: number,
    w: number,
    h: number,
    rgb: RGB,
    scaleY: number,
    rot: number,
    hotGroove: boolean,
  ): void {
    if (w < 0.5 || h < 0.5) return;
    const sy = Number.isFinite(scaleY) ? Math.max(0.2, scaleY) : 1;
    ctx.save();
    ctx.translate(sx + w / 2, syBottom);
    if (rot) ctx.rotate(rot);
    ctx.scale(1 / sy, sy);
    const top = shade(rgb, 0.24);
    const bot = shade(rgb, -0.32);
    ctx.fillStyle = rgba(rgb, 1);
    ctx.fillRect(-w / 2, -h, w, h);
    ctx.fillStyle = rgba(top, 1);
    ctx.fillRect(-w / 2, -h, w, Math.min(5, h * 0.28));
    ctx.fillStyle = rgba(bot, 1);
    ctx.fillRect(-w / 2, -3.5, w, 3.5);
    ctx.fillStyle = rgba(shade(rgb, -0.5), 0.85);
    ctx.fillRect(-w / 2, -h, 3, h);
    ctx.fillStyle = rgba(shade(rgb, 0.18), 0.45);
    ctx.fillRect(w / 2 - 2, -h, 2, h);
    ctx.fillStyle = hotGroove ? "#ff4d1a" : "rgba(18,12,8,0.55)";
    const grooveW = hotGroove ? 3 : 2;
    ctx.fillRect(-grooveW / 2, -h + 5, grooveW, h - 9);
    ctx.restore();
  }

  private drawVignette(ctx: CanvasRenderingContext2D): void {
    if (!this.vignette) {
      const g = ctx.createRadialGradient(
        this.viewW / 2,
        this.viewH * 0.45,
        this.viewH * 0.2,
        this.viewW / 2,
        this.viewH * 0.5,
        this.viewH * 0.78,
      );
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.45)");
      this.vignette = g;
    }
    ctx.fillStyle = this.vignette;
    ctx.fillRect(0, 0, this.viewW, this.viewH);
  }

  private drawFloaters(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.font = "700 20px Outfit, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const f of this.floaters) {
      const s = this.worldToScreen(f.x, f.y);
      const a = Math.max(0, f.life / f.max);
      ctx.globalAlpha = a;
      ctx.fillStyle = f.hot ? "#f6f1e8" : "#ff4d1a";
      ctx.fillText(f.text, s.x, s.y);
    }
    ctx.restore();
  }
}
