import { type RGB } from "./logic";
import { rgbCss } from "./themes";

/** World (x, y-up) to screen. Supplied by the engine each frame. */
export type Project = (x: number, y: number) => { x: number; y: number };

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  rgb: RGB;
  gravity: number;
  drag: number;
  /** Glowing sparks are drawn additively with a short tail. */
  glow: boolean;
};

/** A flash along a seam: a line of light that spreads from the centre and fades. */
type Seam = { x: number; y: number; w: number; life: number; max: number; rgb: RGB };

type Ring = {
  x: number;
  y: number;
  life: number;
  max: number;
  reach: number;
  rgb: RGB;
  width: number;
};
type Rays = {
  x: number;
  y: number;
  life: number;
  max: number;
  reach: number;
  rgb: RGB;
  count: number;
  spin: number;
};

type Confetto = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  rgb: RGB;
  life: number;
  phase: number;
};

/** A stain left where something burst. */
type Splat = { x: number; y: number; r: number; rgb: RGB; life: number; max: number };

const MAX_SPARKS = 420;
const TAU = Math.PI * 2;

/** The reward layer: everything that exists only to make a good drop feel good. */
export class Fx {
  private sparks: Spark[] = [];
  private rings: Ring[] = [];
  private seams: Seam[] = [];
  private rays: Rays[] = [];
  private confetti: Confetto[] = [];
  /** Scales particle counts down for prefers-reduced-motion. */
  calm = false;
  /** -1 when the world is drawn mirrored (the Descent), so things still fall down the screen. */
  down = 1;
  private splats: Splat[] = [];

  clear(): void {
    this.sparks.length = 0;
    this.rings.length = 0;
    this.seams.length = 0;
    this.rays.length = 0;
    this.confetti.length = 0;
    this.splats.length = 0;
  }

  /**
   * Something crushed: dark blood sprayed out under gravity, a few heavy
   * gobbets, and a stain that lingers where it burst.
   */
  blood(x: number, y: number, rgb: RGB, n: number, speed: number, stain = true): void {
    for (let i = this.count(n); i > 0; i--) {
      const a = Math.random() * TAU;
      const s = speed * (0.3 + Math.random() * 0.9);
      const heavy = Math.random() < 0.18;
      const life = 0.7 + Math.random() * 0.7;
      this.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.abs(Math.sin(a)) * s * 0.9 + 60,
        life,
        max: life,
        size: heavy ? 3.5 + Math.random() * 2.5 : 1.4 + Math.random() * 1.8,
        rgb,
        gravity: 900,
        drag: 0.6,
        glow: false,
      });
    }
    if (!stain) return;
    const blobs = this.calm ? 3 : 7;
    for (let i = 0; i < blobs; i++) {
      this.splats.push({
        x: x + (Math.random() - 0.5) * 34,
        y: y + (Math.random() - 0.5) * 16,
        r: 4 + Math.random() * 9,
        rgb,
        life: 2.4,
        max: 2.4,
      });
    }
  }

  private count(n: number): number {
    return this.calm ? Math.ceil(n * 0.35) : n;
  }

  /** Chips of slab thrown off by a landing. */
  burst(x: number, y: number, rgb: RGB, n: number, speed: number): void {
    for (let i = this.count(n); i > 0; i--) {
      const a = Math.random() * TAU;
      const s = speed * (0.35 + Math.random() * 0.75);
      this.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s + 40,
        life: 0.35 + Math.random() * 0.35,
        max: 0.7,
        size: 1.5 + Math.random() * 2.6,
        rgb,
        gravity: 520,
        drag: 0,
        glow: false,
      });
    }
  }

  /** Bright motes that fan up off the seam on a perfect. */
  sparkle(x: number, y: number, span: number, rgb: RGB, n: number): void {
    for (let i = this.count(n); i > 0; i--) {
      const a = Math.PI * (0.15 + Math.random() * 0.7);
      const s = 90 + Math.random() * 210;
      const life = 0.45 + Math.random() * 0.5;
      this.push({
        x: x + (Math.random() - 0.5) * span,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life,
        max: life,
        size: 1.6 + Math.random() * 2,
        rgb,
        gravity: 260,
        drag: 1.6,
        glow: true,
      });
    }
  }

  seam(x: number, y: number, w: number, rgb: RGB): void {
    this.seams.push({ x, y, w, life: 0.32, max: 0.32, rgb });
  }

  ring(x: number, y: number, rgb: RGB, reach: number, width = 3): void {
    this.rings.push({ x, y, life: 0.5, max: 0.5, reach, rgb, width });
  }

  rayBurst(x: number, y: number, rgb: RGB, reach: number, count = 14): void {
    if (this.calm) return;
    this.rays.push({ x, y, life: 0.7, max: 0.7, reach, rgb, count, spin: Math.random() * TAU });
  }

  /** A shell bursting in the sky. */
  firework(x: number, y: number, rgb: RGB, size = 1): void {
    const n = this.count(Math.round(34 * size));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + Math.random() * 0.2;
      const s = (130 + Math.random() * 110) * size;
      const life = 0.8 + Math.random() * 0.6;
      this.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life,
        max: life,
        size: 2 + Math.random() * 1.6,
        rgb: Math.random() < 0.25 ? [255, 255, 255] : rgb,
        gravity: 150,
        drag: 1.9,
        glow: true,
      });
    }
    this.ring(x, y, rgb, 70 * size, 2);
  }

  /** Paper from the top of the view. Screen space, so it ignores the camera. */
  confettiRain(viewW: number, palette: RGB[], n: number): void {
    for (let i = this.count(n); i > 0; i--) {
      this.confetti.push({
        x: Math.random() * viewW,
        y: -20 - Math.random() * 260,
        vx: (Math.random() - 0.5) * 60,
        vy: 90 + Math.random() * 130,
        rot: Math.random() * TAU,
        vr: (Math.random() - 0.5) * 9,
        w: 5 + Math.random() * 5,
        h: 3 + Math.random() * 3,
        rgb: palette[i % palette.length]!,
        life: 4.5 + Math.random() * 2,
        phase: Math.random() * TAU,
      });
    }
  }

  private push(spark: Spark): void {
    this.sparks.push(spark);
    if (this.sparks.length > MAX_SPARKS) this.sparks.splice(0, this.sparks.length - MAX_SPARKS);
  }

  step(dt: number): void {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const p = this.sparks[i]!;
      const damp = Math.max(0, 1 - p.drag * dt);
      p.vx *= damp;
      p.vy = p.vy * damp - p.gravity * this.down * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.sparks.splice(i, 1);
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i]!;
      r.life -= dt;
      if (r.life <= 0) this.rings.splice(i, 1);
    }
    for (let i = this.splats.length - 1; i >= 0; i--) {
      const sp = this.splats[i]!;
      sp.life -= dt;
      if (sp.life <= 0) this.splats.splice(i, 1);
    }
    for (let i = this.seams.length - 1; i >= 0; i--) {
      const f = this.seams[i]!;
      f.life -= dt;
      if (f.life <= 0) this.seams.splice(i, 1);
    }
    for (let i = this.rays.length - 1; i >= 0; i--) {
      const r = this.rays[i]!;
      r.life -= dt;
      if (r.life <= 0) this.rays.splice(i, 1);
    }
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i]!;
      c.x += (c.vx + Math.sin(c.life * 3 + c.phase) * 40) * dt;
      c.y += c.vy * dt;
      c.rot += c.vr * dt;
      c.life -= dt;
      if (c.life <= 0) this.confetti.splice(i, 1);
    }
  }

  /** World-space effects. Call inside the camera transform. */
  draw(ctx: CanvasRenderingContext2D, project: Project): void {
    for (const sp of this.splats) {
      const s = project(sp.x, sp.y);
      const a = Math.min(1, (sp.life / sp.max) * 1.6) * 0.85;
      ctx.fillStyle = rgbCss(sp.rgb, a);
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, sp.r * 1.3, sp.r * 0.75, 0, 0, TAU);
      ctx.fill();
    }
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const r of this.rays) {
      const s = project(r.x, r.y);
      const age = 1 - r.life / r.max;
      const len = r.reach * (0.25 + 0.75 * Math.sqrt(age));
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(r.spin + age * 0.5);
      const fade = ctx.createLinearGradient(0, 0, len, 0);
      fade.addColorStop(0, rgbCss(r.rgb, 0.5 * (1 - age)));
      fade.addColorStop(1, rgbCss(r.rgb, 0));
      ctx.fillStyle = fade;
      for (let i = 0; i < r.count; i++) {
        ctx.rotate(TAU / r.count);
        ctx.beginPath();
        ctx.moveTo(8, -3.5);
        ctx.lineTo(len, 0);
        ctx.lineTo(8, 3.5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    for (const f of this.seams) {
      const s = project(f.x, f.y);
      const age = 1 - f.life / f.max;
      const spread = 1 - (1 - age) ** 2;
      const half = (f.w / 2) * spread;
      const g = ctx.createLinearGradient(s.x - half, 0, s.x + half, 0);
      g.addColorStop(0, rgbCss(f.rgb, 0));
      g.addColorStop(0.5, rgbCss(f.rgb, 0.95 * (1 - age)));
      g.addColorStop(1, rgbCss(f.rgb, 0));
      ctx.fillStyle = g;
      ctx.fillRect(s.x - half, s.y - 2, half * 2, 4);
      ctx.fillStyle = rgbCss(f.rgb, 0.35 * (1 - age));
      ctx.fillRect(s.x - half, s.y - 7, half * 2, 14);
    }
    for (const r of this.rings) {
      const s = project(r.x, r.y);
      const age = 1 - r.life / r.max;
      const eased = 1 - (1 - age) * (1 - age);
      ctx.strokeStyle = rgbCss(r.rgb, 0.75 * (1 - age));
      ctx.lineWidth = Math.max(0.5, r.width * (1 - age));
      ctx.beginPath();
      // Flattened, so it reads as a shockwave along the seam rather than a bubble.
      ctx.ellipse(s.x, s.y, r.reach * eased, r.reach * eased * 0.42, 0, 0, TAU);
      ctx.stroke();
    }
    for (const p of this.sparks) {
      if (!p.glow) continue;
      const s = project(p.x, p.y);
      const a = Math.max(0, p.life / p.max);
      ctx.strokeStyle = rgbCss(p.rgb, a * 0.6);
      ctx.lineWidth = p.size * 0.7;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - p.vx * 0.045, s.y + p.vy * 0.045);
      ctx.stroke();
      ctx.fillStyle = rgbCss(p.rgb, a);
      ctx.fillRect(s.x - p.size / 2, s.y - p.size / 2, p.size, p.size);
    }
    ctx.restore();

    for (const p of this.sparks) {
      if (p.glow) continue;
      const s = project(p.x, p.y);
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = rgbCss(p.rgb);
      ctx.fillRect(s.x, s.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  /** Screen-space effects. Call outside the camera transform. */
  drawScreen(ctx: CanvasRenderingContext2D): void {
    for (const c of this.confetti) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      // Squash on one axis as it tumbles, so flat paper appears to flip.
      ctx.scale(1, Math.cos(c.life * 6 + c.phase));
      ctx.globalAlpha = Math.min(1, c.life);
      ctx.fillStyle = rgbCss(c.rgb);
      ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}
