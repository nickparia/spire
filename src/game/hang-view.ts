import { Hang, STONE_H } from "./hang";

/**
 * How the Descent looks: one shaft, the painted depth behind, the machine at
 * the top with the wire running down from it into the tower, the Dark
 * filling the shaft above the line it has hauled the tower up to, and the
 * stone sliding below the tip. Stones are painted by the engine's own
 * painter, so they match the rest of the game.
 */

export type HangArt = {
  depth: CanvasImageSource | null;
  dark: CanvasImageSource | null;
  rig: HTMLImageElement | null;
};

/** Paints one stone with its bottom-left at (x, yBottom) in the current transform. */
export type StonePainter = (
  ctx: CanvasRenderingContext2D,
  x: number,
  yBottom: number,
  w: number,
  h: number,
  held: boolean,
  hot: boolean,
) => void;

/** Where the tip is kept on screen, as a share of the view's height. */
const TIP_Y = 0.6;
/** The stone's visible height. */
const VISUAL = 24;

const ready = (i: HTMLImageElement | null): i is HTMLImageElement =>
  !!i && i.complete && i.naturalWidth > 0;

export class HangView {
  /** The camera's y: the pivot's screen y, easing as the tower grows. */
  camY = 250;
  /** The sliding stone drawn a beat behind, so a catch reads. */
  flash = 0;
  /** A shudder, 0..1. */
  shake = 0;

  step(dt: number, h: Hang, viewH: number): void {
    // The machine stays in view until the tower has grown enough to push it up.
    const want = Math.min(viewH * 0.3, viewH * TIP_Y - h.length - STONE_H * 1.6);
    this.camY += (want - this.camY) * Math.min(1, dt * 3);
    this.flash = Math.max(0, this.flash - dt * 3);
    this.shake = Math.max(0, this.shake - dt * 2.6);
  }

  /** World (pivot at 0,0, y down) to screen. */
  to(x: number, y: number, w: number): { x: number; y: number } {
    return { x: w / 2 + x, y: this.camY + y };
  }

  draw(
    ctx: CanvasRenderingContext2D,
    h: Hang,
    art: HangArt,
    w: number,
    vh: number,
    clock: number,
    paint: StonePainter,
  ): void {
    const t = h.tune;
    const ox = w / 2 + (this.shake > 0 ? Math.sin(clock * 60) * this.shake * 7 : 0);
    const oy = this.camY;
    const fallY = h.fall >= 0 ? h.fall * h.fall * 520 : 0;
    this.drawDepth(ctx, art, w, vh, oy);
    // The shaft: darker than the rock either side, its walls where the swing is bounded.
    const g = ctx.createLinearGradient(ox - t.shaft - 40, 0, ox + t.shaft + 40, 0);
    g.addColorStop(0, "rgba(8,5,6,0)");
    g.addColorStop(0.12, "rgba(8,5,6,0.55)");
    g.addColorStop(0.5, "rgba(8,5,6,0.3)");
    g.addColorStop(0.88, "rgba(8,5,6,0.55)");
    g.addColorStop(1, "rgba(8,5,6,0)");
    ctx.fillStyle = g;
    ctx.fillRect(ox - t.shaft - 40, 0, t.shaft * 2 + 80, vh);
    this.drawDark(ctx, h, art, w, vh, ox, oy, clock);
    this.drawRig(ctx, art, ox, oy);
    this.drawWire(ctx, h, ox, oy, fallY, clock);
    this.drawTower(ctx, h, ox, oy + fallY, paint);
    if (h.fall < 0) this.drawSlider(ctx, h, ox, oy, paint);
  }

  /** The painted depth, scrolling with the camera, tiled seamlessly. */
  private drawDepth(
    ctx: CanvasRenderingContext2D,
    art: HangArt,
    w: number,
    vh: number,
    oy: number,
  ): void {
    ctx.fillStyle = "rgb(8,6,8)";
    ctx.fillRect(0, 0, w, vh);
    const img = art.depth;
    if (!img) return;
    const iw = (img as HTMLVideoElement).videoWidth || (img as HTMLImageElement).naturalWidth || 9;
    const ih =
      (img as HTMLVideoElement).videoHeight || (img as HTMLImageElement).naturalHeight || 16;
    const dw = w * 1.08;
    const dh = dw * (ih / iw);
    const scroll = (250 - oy) * 0.6;
    const first = Math.floor(scroll / dh);
    for (let k = first; ; k++) {
      const y = k * dh - scroll;
      if (y > vh) break;
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

  /** The Dark: it fills the shaft from above down to the line it has the tower hauled up to. */
  private drawDark(
    ctx: CanvasRenderingContext2D,
    h: Hang,
    art: HangArt,
    w: number,
    vh: number,
    ox: number,
    oy: number,
    clock: number,
  ): void {
    const t = h.tune;
    const front = oy + h.coat;
    const edge = new Path2D();
    edge.moveTo(ox - t.shaft - 40, -20);
    edge.lineTo(ox - t.shaft - 40, front);
    for (let x = -t.shaft - 40; x <= t.shaft + 40; x += 8) {
      const drip = Math.max(0, Math.sin(x * 0.17 + 1.3) * Math.sin(x * 0.043 + clock * 0.5)) * 16;
      edge.lineTo(ox + x, front + drip + Math.sin(x * 0.06 + clock * 1.3) * 3);
    }
    edge.lineTo(ox + t.shaft + 40, -20);
    edge.closePath();
    ctx.save();
    ctx.clip(edge);
    if (art.dark) {
      const ow = t.shaft * 2 + 80;
      const oh = ow * 1.78;
      const flow = (clock * 10) % oh;
      for (let y = front - oh * 3 + flow; y < front + 60; y += oh)
        ctx.drawImage(art.dark, ox - ow / 2, y, ow, oh);
    } else {
      ctx.fillStyle = "rgb(10,6,16)";
      ctx.fillRect(0, 0, w, vh);
    }
    ctx.fillStyle = "rgba(4,2,8,0.5)";
    ctx.fillRect(0, 0, w, vh);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(150,100,240,0.32)";
    ctx.lineWidth = 2;
    ctx.stroke(edge);
    ctx.restore();
  }

  /** The machine, squatting over the shaft at the pivot. */
  private drawRig(ctx: CanvasRenderingContext2D, art: HangArt, ox: number, oy: number): void {
    if (!ready(art.rig) || oy < -420) return;
    const rw = 400;
    const rh = rw * (art.rig.naturalHeight / art.rig.naturalWidth);
    ctx.drawImage(art.rig, ox - rw / 2, oy - rh * 0.97, rw, rh);
  }

  /** The wire from the machine to the tower: it reddens and frays as the fight is won. */
  private drawWire(
    ctx: CanvasRenderingContext2D,
    h: Hang,
    ox: number,
    oy: number,
    fallY: number,
    clock: number,
  ): void {
    const s = h.strain;
    ctx.save();
    ctx.translate(ox + h.pivotX, oy);
    ctx.rotate(-h.theta);
    if (h.fall < 0) {
      ctx.strokeStyle = `rgb(${Math.round(120 + 135 * s)},${Math.round(100 - 50 * s)},${Math.round(70 - 50 * s)})`;
      ctx.lineWidth = 7 - 4.5 * s;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(0, 60);
      ctx.stroke();
      if (s > 0.55) {
        ctx.strokeStyle = `rgba(255,200,120,${(s - 0.55) * 2})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo(0, 4 + i * 9);
          ctx.lineTo((i % 2 ? 9 : -9) * s, 9 + i * 9 + Math.sin(clock * 20 + i) * 2);
          ctx.stroke();
        }
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = `rgba(255,120,60,${(s - 0.55) * 0.8})`;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(0, 60);
        ctx.stroke();
      }
    } else {
      // Snapped: the stub whips.
      ctx.strokeStyle = "rgb(230,80,40)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(Math.sin(clock * 30) * 12, 20);
      ctx.stroke();
      ctx.translate(0, fallY);
      ctx.beginPath();
      ctx.moveTo(0, 60);
      ctx.lineTo(Math.sin(clock * 24) * 8, 34);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** The tower, in its own swinging frame: stones held by the Dark are coated. */
  private drawTower(
    ctx: CanvasRenderingContext2D,
    h: Hang,
    ox: number,
    oy: number,
    paint: StonePainter,
  ): void {
    const t = h.tune;
    ctx.save();
    ctx.translate(ox + h.pivotX, oy);
    ctx.rotate(-h.theta);
    // The mount the tower hangs from.
    ctx.fillStyle = "rgb(60,44,30)";
    ctx.fillRect(-26, 46, 52, 16);
    h.stones.forEach((s, i) => {
      const y = 60 + i * STONE_H;
      const held = y < h.coat;
      paint(ctx, s.off - t.stoneW / 2, y + VISUAL, t.stoneW, VISUAL, held, false);
    });
    if (this.flash > 0) {
      const s = h.stones[h.stones.length - 1]!;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(255,220,160,${this.flash * 0.5})`;
      ctx.fillRect(
        s.off - t.stoneW / 2 - 6,
        60 + (h.stones.length - 1) * STONE_H - 4,
        t.stoneW + 12,
        STONE_H + 6,
      );
      ctx.restore();
    }
    ctx.restore();
  }

  /** The stone sliding below the tip, and the line down from the tip's groove. */
  private drawSlider(
    ctx: CanvasRenderingContext2D,
    h: Hang,
    ox: number,
    oy: number,
    paint: StonePainter,
  ): void {
    const t = h.tune;
    const tp = h.tip();
    const sy = oy + tp.y + STONE_H * 1.5;
    const sx = ox + h.stoneX();
    paint(ctx, sx - t.stoneW / 2, sy + VISUAL, t.stoneW, VISUAL, false, true);
    ctx.save();
    ctx.strokeStyle = "rgba(255,220,160,0.3)";
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(ox + tp.x, oy + tp.y);
    ctx.lineTo(ox + tp.x, sy);
    ctx.stroke();
    ctx.restore();
  }
}
