import type { Rite, Target } from "./rite";

/**
 * How the Descent looks, drawn over the rite's state. A fixed view down one
 * shaft: the painted depth behind, the machine's body coming down from above
 * with its head near the middle of the screen, the targets in the rock below
 * and beside it, and the ooze filling the shaft above, coming down after you.
 */

export type DescentArt = {
  /** The depth's painting (a playing video or its still). */
  depth: CanvasImageSource | null;
  /** The ooze (a playing video or its still). */
  ooze: CanvasImageSource | null;
  rig: HTMLImageElement | null;
  column: HTMLImageElement | null;
  /** The head's spin, frames side by side. */
  head: HTMLImageElement | null;
  seam: HTMLImageElement | null;
  vein: HTMLImageElement | null;
  /** The crew's run and the creatures' crawl, frames side by side. */
  miner: HTMLImageElement | null;
  creature: HTMLImageElement | null;
};

/** Where the head's pivot sits, as shares of the view. */
export const PIVOT_Y = 0.6;
/** How much bigger than its rite numbers the view is drawn. */
export const SCALE = 1.5;
const HEAD_FRAMES = 24;
/** Seconds a bolt of light flares on screen. */
const BOLT_TIME = 0.32;
const HEAD_H = 150;

const ready = (i: HTMLImageElement | null): i is HTMLImageElement =>
  !!i && i.complete && i.naturalWidth > 0;

export class DescentView {
  /** Progress as drawn: it catches up with the rite in a lurch. */
  shown = 0;
  /** How far the ooze has churned, for its flow. */
  churn = 0;
  /** The last shot's bolt, kept on screen for its own flare, whatever the rite's timing. */
  private bolt: { shot: import("./rite").Shot; age: number } | null = null;
  private seen: unknown = null;

  step(dt: number, r: Rite): void {
    // The machine lurches down: quick, then settling.
    this.shown += (r.progress - this.shown) * Math.min(1, dt * 5);
    // The ooze churns faster with momentum.
    this.churn += dt * (12 + 30 * r.momentum);
    if (r.acting && r.acting !== this.seen) {
      this.seen = r.acting;
      this.bolt = { shot: r.acting.shot, age: 0 };
    }
    if (this.bolt) {
      this.bolt.age += dt;
      if (this.bolt.age > BOLT_TIME) this.bolt = null;
    }
  }

  /** View position of a rite point (the pivot is (0,0)). */
  to(x: number, y: number, w: number, h: number): { x: number; y: number } {
    return { x: w / 2 + x * SCALE, y: h * PIVOT_Y + y * SCALE };
  }

  draw(
    ctx: CanvasRenderingContext2D,
    r: Rite,
    art: DescentArt,
    w: number,
    h: number,
    clock: number,
  ): void {
    const px = w / 2;
    const py = h * PIVOT_Y;
    this.drawDepth(ctx, art, w, h);
    // The surface (and the machine standing on it) until it's left behind.
    const surface = py - 230 - this.shown * SCALE;
    this.drawMachine(ctx, art, w, h, px, py, surface, clock);
    this.drawCracks(ctx, r, w, h, clock);
    this.drawLight(ctx, r, w, h, px, py);
    this.drawLamps(ctx, r, w, h, clock);
    this.drawTargets(ctx, r, art, w, h, clock);
    this.drawActors(ctx, r, art, w, h, clock);
    this.drawBolt(ctx, r, w, h, px, py, clock);
    this.drawHead(ctx, r, art, px, py, clock);
    this.drawOoze(ctx, r, art, w, h, py, clock);
  }

  /** The painted depth behind, scrolling up as you go down, the shaft dark down its middle. */
  private drawDepth(ctx: CanvasRenderingContext2D, art: DescentArt, w: number, h: number): void {
    ctx.fillStyle = "rgb(8,6,8)";
    ctx.fillRect(0, 0, w, h);
    const img = art.depth;
    if (img) {
      const iw =
        (img as HTMLVideoElement).videoWidth || (img as HTMLImageElement).naturalWidth || 9;
      const ih =
        (img as HTMLVideoElement).videoHeight || (img as HTMLImageElement).naturalHeight || 16;
      const dw = w * 1.08;
      const dh = dw * (ih / iw);
      // Alternate tiles are flipped, so each meets the next at the same edge: no seam.
      const scroll = this.shown * 0.5;
      const first = Math.floor(scroll / dh);
      for (let k = first; ; k++) {
        const y = k * dh - scroll;
        if (y > h) break;
        if (k % 2 === 0) ctx.drawImage(img, (w - dw) / 2, y, dw, dh);
        else {
          ctx.save();
          ctx.translate(0, y + dh);
          ctx.scale(1, -1);
          ctx.drawImage(img, (w - dw) / 2, 0, dw, dh);
          ctx.restore();
        }
      }
    }
    // The bore: darker down the middle, so the machine and the shots read first.
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "rgba(6,4,6,0.35)");
    g.addColorStop(0.3, "rgba(6,4,6,0.6)");
    g.addColorStop(0.5, "rgba(6,4,6,0.72)");
    g.addColorStop(0.7, "rgba(6,4,6,0.6)");
    g.addColorStop(1, "rgba(6,4,6,0.35)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  /** The machine: its body down from the top (or from the rig on the surface) to the head. */
  private drawMachine(
    ctx: CanvasRenderingContext2D,
    art: DescentArt,
    w: number,
    h: number,
    px: number,
    py: number,
    surface: number,
    clock: number,
  ): void {
    const top = Math.max(-20, surface);
    const collar = py - 46;
    // The column, tiled down from the top (or the surface) to the head's collar.
    if (ready(art.column) && collar > top) {
      const cw = 120;
      const ch = cw * (art.column.naturalHeight / art.column.naturalWidth);
      const off = (this.shown * SCALE) % ch;
      ctx.save();
      ctx.beginPath();
      ctx.rect(px - cw, top, cw * 2, collar - top);
      ctx.clip();
      for (let y = collar - ch + off - ch * 4; y < collar; y += ch) {
        ctx.drawImage(art.column, px - cw / 2, y, cw, ch);
      }
      ctx.restore();
    }
    // The rig on the surface, while the surface is in view.
    if (ready(art.rig) && surface > -300) {
      const rw = Math.min(w * 1.05, 420);
      const rh = rw * (art.rig.naturalHeight / art.rig.naturalWidth);
      ctx.drawImage(art.rig, px - rw / 2, surface - rh * 0.97, rw, rh);
      // The ground it stands on.
      ctx.fillStyle = "rgba(20,14,12,0.9)";
      ctx.fillRect(0, surface, px - 70, 6);
      ctx.fillRect(px + 70, surface, w - px - 70, 6);
    }
    void h;
    void clock;
  }

  /** The light the machine carries: a pool around the head, brighter with more light. */
  private drawLight(
    ctx: CanvasRenderingContext2D,
    r: Rite,
    w: number,
    h: number,
    px: number,
    py: number,
  ): void {
    const reach = 110 + r.light * 160;
    const g = ctx.createRadialGradient(px, py, 0, px, py, reach * 1.6);
    g.addColorStop(0, `rgba(255,200,130,${0.12 + 0.18 * r.light})`);
    g.addColorStop(1, "rgba(255,200,130,0)");
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  private drawTargets(
    ctx: CanvasRenderingContext2D,
    r: Rite,
    art: DescentArt,
    w: number,
    h: number,
    clock: number,
  ): void {
    const aim = r.acting ? null : r.aimed();
    for (const t of r.targets) {
      const s = this.to(t.x, t.y, w, h);
      const grow = Math.min(1, t.age / 0.4);
      const on = aim?.target === t;
      if (t.kind === "creature") continue;
      // Dark until a lamp finds it: then it's there to strike, and glows a moment after.
      const seen = !t.dark || t.lit || (t.glow ?? 0) > 0;
      ctx.save();
      ctx.globalAlpha = seen ? 1 : 0.22;
      const size = t.r * SCALE * 2.6 * grow;
      const img = t.kind === "seam" ? art.seam : art.vein;
      // Its glow, stronger in your sights.
      const tint = t.kind === "seam" ? "255,140,60" : "255,226,150";
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, size);
      g.addColorStop(0, `rgba(${tint},${on ? 0.45 : 0.22})`);
      g.addColorStop(1, `rgba(${tint},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(s.x - size, s.y - size, size * 2, size * 2);
      if (ready(img)) {
        const pulse = t.kind === "vein" ? 1 + 0.05 * Math.sin(clock * 3 + t.x) : 1;
        ctx.drawImage(
          img,
          s.x - (size / 2) * pulse,
          s.y - (size / 2) * pulse,
          size * pulse,
          size * pulse,
        );
      }
      // Hard rock that has taken a blow shows the crack.
      if (t.hp > 1) {
        ctx.strokeStyle = "rgba(20,12,8,0.9)";
        ctx.lineWidth = 3;
        ctx.strokeRect(s.x - size * 0.45, s.y - size * 0.3, size * 0.9, size * 0.6);
      }
      ctx.restore();
      if (on) {
        ctx.strokeStyle = aim.perfect ? "rgba(255,240,200,0.95)" : "rgba(255,200,140,0.75)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(2, size * 0.55 + Math.sin(clock * 8) * 2), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  /** The crew's lamps: warm cones sweeping the rock. */
  private drawLamps(
    ctx: CanvasRenderingContext2D,
    r: Rite,
    w: number,
    h: number,
    clock: number,
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const c of r.lights()) {
      const o = this.to(c.x, c.y, w, h);
      const len = c.range * SCALE;
      const flick = 0.85 + 0.15 * Math.sin(clock * 13 + c.x);
      const g = ctx.createRadialGradient(o.x, o.y, 4, o.x, o.y, len);
      g.addColorStop(0, `rgba(255,200,120,${0.2 * flick})`);
      g.addColorStop(0.6, `rgba(255,190,110,${0.08 * flick})`);
      g.addColorStop(1, "rgba(255,190,110,0)");
      ctx.fillStyle = g;
      // Canvas angles run from +x; the rite's run from straight down (+y).
      const a = Math.PI / 2 - c.angle;
      // Soft-edged: three widening cones layered, so the beam feathers out.
      for (const k of [1, 0.7, 0.4]) {
        ctx.globalAlpha = k === 1 ? 0.45 : 0.55;
        ctx.beginPath();
        ctx.moveTo(o.x, o.y);
        ctx.arc(
          o.x,
          o.y,
          len,
          a - (c.spread / 2) * (1 + (1 - k)),
          a + (c.spread / 2) * (1 + (1 - k)),
        );
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  /** The miners on their ledges and chains, and what comes out of the dark for them. */
  private drawActors(
    ctx: CanvasRenderingContext2D,
    r: Rite,
    art: DescentArt,
    w: number,
    h: number,
    clock: number,
  ): void {
    for (const a of r.actors) {
      if (a.kind === "rig") continue;
      const s = this.to(a.x, a.y, w, h);
      const sheet = a.kind === "miner" ? art.miner : art.creature;
      const size = a.kind === "miner" ? 96 : 104;
      ctx.save();
      if (a.kind === "miner") {
        // A ledge or chain under them.
        ctx.fillStyle = "rgba(30,20,14,0.95)";
        if (a.slot === 2) {
          ctx.strokeStyle = "rgba(150,110,60,0.8)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y - size * 0.55);
          ctx.lineTo(w / 2, h * PIVOT_Y - 60);
          ctx.stroke();
        } else ctx.fillRect(s.x - 34, s.y + size * 0.42, 68, 6);
        if (a.state === "dead") ctx.globalAlpha = Math.max(0, 1 - a.t / 1.2);
      } else {
        if (a.state === "dead") ctx.globalAlpha = Math.max(0, 1 - a.t / 0.6);
        if (a.state === "lunge") {
          // Caught in the light: a ring and a pulse, strike now.
          const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, size);
          g.addColorStop(0, `rgba(255,120,90,${0.35 + 0.2 * Math.sin(clock * 14)})`);
          g.addColorStop(1, "rgba(255,120,90,0)");
          ctx.fillStyle = g;
          ctx.fillRect(s.x - size, s.y - size, size * 2, size * 2);
        } else ctx.globalAlpha *= 0.75;
      }
      if (ready(sheet)) {
        const frames = Math.max(1, Math.round(sheet.naturalWidth / sheet.naturalHeight));
        const cw = sheet.naturalWidth / frames;
        const fps =
          a.kind === "miner" ? (a.state === "work" ? 6 : 12) : a.state === "lunge" ? 20 : 12;
        const frame = Math.floor((clock + (a.slot ?? 0)) * fps) % frames;
        ctx.translate(s.x, s.y);
        ctx.scale(a.face, 1);
        ctx.drawImage(
          sheet,
          frame * cw,
          0,
          cw,
          sheet.naturalHeight,
          -size / 2,
          -size / 2,
          size,
          size,
        );
      } else {
        ctx.fillStyle = a.kind === "miner" ? "rgb(200,150,90)" : "rgb(210,200,220)";
        ctx.beginPath();
        ctx.arc(s.x, s.y, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  /** A shot: a bolt of the stolen light from the head to where it struck, flaring and fading. */
  private drawBolt(
    ctx: CanvasRenderingContext2D,
    r: Rite,
    w: number,
    h: number,
    px: number,
    py: number,
    clock: number,
  ): void {
    const b = this.bolt;
    if (!b) return;
    const s = b.shot;
    const end = s.hit ? this.to(s.target.x, s.target.y, w, h) : this.to(s.x, s.y, w, h);
    const fade = 1 - b.age / BOLT_TIME;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    const pts: [number, number][] = [];
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const j = i === 0 || i === n ? 0 : Math.sin(i * 12.3 + Math.floor(clock * 30)) * 7;
      const nx = -(end.y - py);
      const ny = end.x - px;
      const len = Math.hypot(nx, ny) || 1;
      pts.push([px + (end.x - px) * t + (nx / len) * j, py + (end.y - py) * t + (ny / len) * j]);
    }
    const colour = s.hit ? "255,236,190" : "190,150,255";
    for (const [lw, al] of [
      [16, 0.18],
      [6, 0.5],
      [2.4, 1],
    ] as const) {
      ctx.strokeStyle = `rgba(${colour},${al * fade})`;
      ctx.lineWidth = lw;
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();
    }
    ctx.restore();
  }

  /** The head, pivoting at the base of the machine, aimed where it will fire. */
  private drawHead(
    ctx: CanvasRenderingContext2D,
    r: Rite,
    art: DescentArt,
    px: number,
    py: number,
    clock: number,
  ): void {
    const firing = r.acting !== null;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-r.heading);
    if (ready(art.head)) {
      const cw = art.head.naturalWidth / HEAD_FRAMES;
      const ch = art.head.naturalHeight;
      const frame = Math.floor(clock * (firing ? 32 : 12)) % HEAD_FRAMES;
      const hw = HEAD_H * (cw / ch);
      ctx.drawImage(art.head, frame * cw, 0, cw, ch, -hw / 2, -HEAD_H * 0.55, hw, HEAD_H);
    } else {
      ctx.fillStyle = "rgb(150,100,48)";
      ctx.beginPath();
      ctx.moveTo(-16, -20);
      ctx.lineTo(16, -20);
      ctx.lineTo(0, 40);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Where misses cracked the walls: the ooze seeping in through them. */
  private drawCracks(
    ctx: CanvasRenderingContext2D,
    r: Rite,
    w: number,
    h: number,
    clock: number,
  ): void {
    for (const c of r.cracks) {
      const s = this.to(c.x, c.y, w, h);
      if (s.y < -40) continue;
      const grow = Math.min(1, c.age / 0.8);
      const rad = (10 + c.size * 24) * grow;
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, rad * 1.7);
      g.addColorStop(0, "rgba(6,3,10,0.95)");
      g.addColorStop(1, "rgba(6,3,10,0)");
      ctx.fillStyle = g;
      ctx.fillRect(s.x - rad * 2, s.y - rad * 2, rad * 4, rad * 4);
      ctx.strokeStyle = "rgba(8,4,14,0.9)";
      ctx.lineCap = "round";
      for (let i = 0; i < 3; i++) {
        const len = rad * (1.4 + i * 0.6) * (0.7 + 0.3 * Math.sin(clock * 1.2 + i + c.x));
        ctx.lineWidth = 3 - i * 0.7;
        ctx.beginPath();
        ctx.moveTo(s.x + (i - 1) * rad * 0.35, s.y);
        ctx.lineTo(s.x + (i - 1) * rad * 0.45, s.y + len);
        ctx.stroke();
      }
    }
  }

  /**
   * The ooze: the shaft above filled with it, its front coming down. It
   * churns faster with momentum, its edge glows hotter, drips reach further.
   */
  private drawOoze(
    ctx: CanvasRenderingContext2D,
    r: Rite,
    art: DescentArt,
    w: number,
    h: number,
    py: number,
    clock: number,
  ): void {
    // Off above the view at the start; it comes into sight as the gap closes.
    const front = py - 40 - r.gap * SCALE * 1.3;
    if (front < -60) {
      // Out of sight above: a dark stain at the top edge, heavier as it nears.
      const near = Math.max(0, 1 - (-60 - front) / 300);
      const g = ctx.createLinearGradient(0, 0, 0, 30 + near * 60);
      g.addColorStop(0, `rgba(6,3,12,${0.5 + near * 0.45})`);
      g.addColorStop(1, "rgba(6,3,12,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, 30 + near * 60);
      return;
    }
    const m = r.momentum;
    const edge = new Path2D();
    edge.moveTo(-10, -10);
    edge.lineTo(-10, front);
    for (let x = -10; x <= w + 10; x += 8) {
      const drip =
        Math.max(0, Math.sin(x * 0.17 + 1.3) * Math.sin(x * 0.043 + clock * 0.5)) * (20 + m * 14);
      const wobble = Math.sin(x * 0.05 + clock * (1 + m)) * (3 + m * 2);
      edge.lineTo(x, front + drip + wobble);
    }
    edge.lineTo(w + 10, -10);
    edge.closePath();
    ctx.save();
    ctx.clip(edge);
    if (art.ooze) {
      const ow = w * 1.1;
      const oh = ow * 1.78;
      const off = this.churn % oh;
      for (let y = front - oh * 3 + off; y < front + 80; y += oh)
        ctx.drawImage(art.ooze, -w * 0.05, y, ow, oh);
    }
    ctx.fillStyle = "rgba(4,2,8,0.55)";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    // Its wet edge, hotter with momentum.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(150,100,240,${0.25 + Math.min(0.5, m * 0.18)})`;
    ctx.lineWidth = 2 + m;
    ctx.stroke(edge);
    ctx.restore();
  }
}

export type { Target };
