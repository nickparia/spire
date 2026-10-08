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
  /** The Dark: a painting whose lower edge is its fringe of tendrils (a playing video or its still). */
  dark: CanvasImageSource | null;
  rig: HTMLImageElement | null;
  /** The rock of this depth, for the floor you're dragging the roots down to. */
  rock: HTMLImageElement | null;
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
/** The floor: how far below the tip it sits when the wire is about to snap, and how much further at the start. */
const FLOOR_GAP = 70;
const FLOOR_FAR = 380;
/** The Dark never lets go of the mount: its fringe hangs at least this far below the pivot. */
const DARK_MIN = 78;

const ready = (i: HTMLImageElement | null): i is HTMLImageElement =>
  !!i && i.complete && i.naturalWidth > 0;

export class HangView {
  /** The camera's y: the pivot's screen y, easing as the tower grows. */
  camY = 250;
  /** The sliding stone drawn a beat behind, so a catch reads. */
  flash = 0;
  /** A shudder, 0..1. */
  shake = 0;
  /** The Dark's line as drawn: it lags the true line, clinging as it's dragged off the stones. */
  coatShown = -1;
  /** The Dark roused (a miss, a surge): its eyes flare, 0..1. */
  menace = 0;
  /** A jolt of the camera when the tower is dragged down, px. */
  jolt = 0;
  /** How unlit the shaft is drawn, 0..1, eased. */
  unlit = 0;

  step(dt: number, h: Hang, viewH: number): void {
    // The machine stays in view until the tower has grown enough to push it up.
    const want = Math.min(viewH * 0.3, viewH * TIP_Y - h.length - STONE_H * 1.6);
    this.camY += (want - this.camY) * Math.min(1, dt * 3);
    this.flash = Math.max(0, this.flash - dt * 3);
    this.shake = Math.max(0, this.shake - dt * 2.6);
    this.menace = Math.max(0, this.menace - dt * 1.4);
    this.jolt *= Math.exp(-dt * 6);
    this.unlit += ((h.twist === "unlit" ? 1 : 0) - this.unlit) * Math.min(1, dt * 1.2);
    // The Dark gives ground grudgingly (slow to be dragged off), and takes it fast.
    if (this.coatShown < 0) this.coatShown = h.coat;
    const k = h.coat < this.coatShown ? 2.2 : 9;
    this.coatShown += (h.coat - this.coatShown) * Math.min(1, dt * k);
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
    const oy = this.camY + this.jolt;
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
    this.drawFloor(ctx, h, art, ox, oy, clock);
    this.drawDark(ctx, h, art, w, vh, ox, oy, clock, false);
    this.drawCrystal(ctx, h, vh, ox, clock);
    this.drawRig(ctx, art, ox, oy);
    this.drawWire(ctx, h, ox, oy, fallY, clock);
    this.drawTower(ctx, h, ox, oy + fallY, paint);
    this.drawGrip(ctx, h, ox, oy, clock);
    this.drawDark(ctx, h, art, w, vh, ox, oy, clock, true);
    if (h.fall < 0) this.drawSlider(ctx, h, ox, oy, paint);
    this.drawFlood(ctx, h, w, vh, ox, oy, clock);
    this.drawUnlit(ctx, h, w, vh, ox, oy);
  }

  /** Narrowing: crystal grows in from the walls, closing the shaft as the roots lengthen. */
  private drawCrystal(
    ctx: CanvasRenderingContext2D,
    h: Hang,
    vh: number,
    ox: number,
    clock: number,
  ): void {
    const t = h.tune;
    const grown = t.shaft - h.shaft;
    if (grown < 2) return;
    ctx.save();
    for (const side of [-1, 1]) {
      const outer = ox + side * (t.shaft + 40);
      const inner = ox + side * h.shaft;
      ctx.beginPath();
      ctx.moveTo(outer, -20);
      for (let y = -20; y <= vh + 20; y += 22) {
        const jag =
          (Math.sin(y * 0.21 + side) * 0.5 + 0.5) * grown * 0.5 +
          Math.sin(y * 0.07 + clock * 0.3) * 4;
        ctx.lineTo(inner + side * jag, y);
      }
      ctx.lineTo(outer, vh + 20);
      ctx.closePath();
      const g = ctx.createLinearGradient(outer, 0, inner, 0);
      g.addColorStop(0, "rgba(30,20,50,0.95)");
      g.addColorStop(0.7, "rgba(70,50,120,0.9)");
      g.addColorStop(1, "rgba(170,140,255,0.85)");
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = `rgba(210,190,255,${0.35 + 0.15 * Math.sin(clock * 2)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Flooded: a wash of drowned light over the shaft, bubbles rising past. */
  private drawFlood(
    ctx: CanvasRenderingContext2D,
    h: Hang,
    w: number,
    vh: number,
    ox: number,
    oy: number,
    clock: number,
  ): void {
    const f = h.flood;
    if (f < 0.02) return;
    ctx.save();
    const top = oy - 10;
    const g = ctx.createLinearGradient(0, top, 0, vh);
    g.addColorStop(0, `rgba(30,90,120,${0.1 * f})`);
    g.addColorStop(1, `rgba(10,40,70,${0.4 * f})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, top, w, vh - top);
    // The surface, lapping at the machine.
    ctx.strokeStyle = `rgba(160,220,255,${0.35 * f})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 10) ctx.lineTo(x, top + Math.sin(x * 0.05 + clock * 2) * 3);
    ctx.stroke();
    ctx.strokeStyle = `rgba(200,235,255,${0.3 * f})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 16; i++) {
      const pace = 30 + (i % 4) * 12;
      const span = vh - top + 40;
      const y = vh + 20 - ((i * 131 + clock * pace) % span);
      const x = ox + Math.sin(i * 2.3) * h.shaft * 0.85 + Math.sin(clock * 1.5 + i) * 4;
      ctx.beginPath();
      ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Unlit: the shaft goes black but for the roots' own glow, and the machine's. */
  private drawUnlit(
    ctx: CanvasRenderingContext2D,
    h: Hang,
    w: number,
    vh: number,
    ox: number,
    oy: number,
  ): void {
    const u = this.unlit;
    if (u < 0.02) return;
    const k = ctx.getTransform().a || 1;
    const layer = this.layer(Math.ceil(w * k), Math.ceil(vh * k));
    const lc = layer.getContext("2d")!;
    lc.setTransform(k, 0, 0, k, 0, 0);
    lc.globalCompositeOperation = "source-over";
    lc.fillStyle = `rgba(2,1,4,${0.94 * u})`;
    lc.fillRect(0, 0, w, vh);
    lc.globalCompositeOperation = "destination-out";
    const tp = h.tip();
    const tx = ox + tp.x;
    const ty = oy + tp.y + (h.fall >= 0 ? h.fall * h.fall * 520 : 0);
    const glow = lc.createRadialGradient(tx, ty, 30, tx, ty, 210);
    glow.addColorStop(0, "rgba(0,0,0,1)");
    glow.addColorStop(0.5, "rgba(0,0,0,0.7)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    lc.fillStyle = glow;
    lc.fillRect(0, 0, w, vh);
    // The tower itself glows faintly all the way up, and the machine's furnace at the pivot.
    const spine = lc.createLinearGradient(0, oy, 0, ty);
    spine.addColorStop(0, "rgba(0,0,0,0.5)");
    spine.addColorStop(1, "rgba(0,0,0,0.6)");
    lc.fillStyle = spine;
    lc.fillRect(ox - h.tune.stoneW, oy, h.tune.stoneW * 2, Math.max(0, ty - oy));
    const rig = lc.createRadialGradient(ox, oy, 0, ox, oy, 150);
    rig.addColorStop(0, "rgba(0,0,0,0.8)");
    rig.addColorStop(1, "rgba(0,0,0,0)");
    lc.fillStyle = rig;
    lc.fillRect(0, 0, w, vh);
    lc.setTransform(1, 0, 0, 1, 0, 0);
    lc.globalCompositeOperation = "source-over";
    ctx.drawImage(layer, 0, 0, w * k, vh * k, 0, 0, w, vh);
  }

  /** Where the floor you're breaking through sits on screen: it nears as the wire strains. */
  floorY(h: Hang, oy: number): number {
    return oy + h.length + FLOOR_GAP + (1 - h.strain) * FLOOR_FAR;
  }

  /**
   * The floor: a seam of this depth's rock sealing the shaft below, the thing
   * the roots are being dragged down to. It cracks as the wire strains, and
   * at the snap it's gone: the tower falls through where it was.
   */
  private drawFloor(
    ctx: CanvasRenderingContext2D,
    h: Hang,
    art: HangArt,
    ox: number,
    oy: number,
    clock: number,
  ): void {
    const t = h.tune;
    const y = this.floorY(h, oy);
    const left = ox - h.shaft - 40;
    const width = h.shaft * 2 + 80;
    const depth = 90;
    ctx.save();
    ctx.beginPath();
    if (h.fall >= 0) {
      // Broken open: a ragged hole the width of the tower, the rest of the seam still there.
      const hole = t.stoneW * 0.95;
      const gap = ox + h.pivotX;
      ctx.moveTo(left, y);
      for (let x = 0; x <= width; x += 14) {
        const px = left + x;
        if (px > gap - hole && px < gap + hole) continue;
        ctx.lineTo(px, y + Math.sin(x * 0.11) * 4 + Math.sin(x * 0.037 + 1) * 6);
        if (px <= gap - hole && px + 14 > gap - hole) {
          ctx.lineTo(gap - hole + 10, y + 30);
          ctx.lineTo(gap - hole - 6, y + 60);
          ctx.lineTo(gap - hole + 4, y + depth);
          ctx.lineTo(gap + hole - 4, y + depth);
          ctx.lineTo(gap + hole + 8, y + 55);
          ctx.lineTo(gap + hole - 12, y + 28);
        }
      }
      ctx.lineTo(left + width, y + depth);
      ctx.lineTo(gap + hole + 4, y + depth);
      ctx.moveTo(gap - hole - 4, y + depth);
      ctx.lineTo(left, y + depth);
    } else {
      ctx.moveTo(left, y);
      for (let x = 0; x <= width; x += 14) {
        ctx.lineTo(left + x, y + Math.sin(x * 0.11) * 4 + Math.sin(x * 0.037 + 1) * 6);
      }
      ctx.lineTo(left + width, y + depth);
      ctx.lineTo(left, y + depth);
    }
    ctx.closePath();
    if (ready(art.rock)) {
      const pat = ctx.createPattern(art.rock, "repeat");
      if (pat) {
        pat.setTransform(new DOMMatrix().translate(left, y).scale(200 / art.rock.naturalWidth));
        ctx.fillStyle = pat;
      } else ctx.fillStyle = "rgb(50,36,30)";
    } else ctx.fillStyle = "rgb(50,36,30)";
    ctx.fill();
    // Lit from above by the light the roots carry.
    const lip = ctx.createLinearGradient(0, y - 8, 0, y + depth);
    lip.addColorStop(0, `rgba(255,190,120,${0.25 + 0.35 * h.strain})`);
    lip.addColorStop(0.25, "rgba(0,0,0,0)");
    lip.addColorStop(1, "rgba(0,0,0,0.7)");
    ctx.fillStyle = lip;
    ctx.fill();
    // Cracks spread across it as the wire strains, glowing from beneath.
    const n = h.fall >= 0 ? 0 : Math.floor(h.strain * 9);
    ctx.lineCap = "round";
    for (let i = 0; i < n; i++) {
      const seed = i * 7.31;
      const cx = ox + Math.sin(seed) * h.shaft * 0.9;
      const reach = 20 + ((h.strain * 9 - i) / 2) * 30;
      ctx.beginPath();
      ctx.moveTo(cx, y + 2);
      let px = cx;
      let py = y + 2;
      for (let k = 1; k <= 4; k++) {
        px += Math.sin(seed * k + 1) * reach * 0.35;
        py += reach * 0.25;
        ctx.lineTo(px, py);
      }
      ctx.strokeStyle = "rgba(8,5,4,0.9)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,150,70,${0.05 + 0.35 * h.strain * h.strain + 0.06 * Math.sin(clock * 6 + i)})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * The Dark's grip: as the tower is dragged down, its line lags and strands
   * stretch from the line it's been pulled back to down to the stones it had,
   * thinning until they snap free.
   */
  private drawGrip(
    ctx: CanvasRenderingContext2D,
    h: Hang,
    ox: number,
    oy: number,
    clock: number,
  ): void {
    const trueFront = oy + Math.max(DARK_MIN, h.coat);
    const shownFront = oy + Math.max(DARK_MIN, this.coatShown);
    const stretch = shownFront - trueFront;
    if (stretch < 4 || h.fall >= 0) return;
    ctx.save();
    ctx.translate(ox + h.pivotX, oy);
    ctx.rotate(-h.theta);
    ctx.lineCap = "round";
    const a = Math.min(1, stretch / 40);
    for (let i = 0; i < 7; i++) {
      const x = -h.tune.stoneW / 2 + (i / 6) * h.tune.stoneW;
      const top = shownFront - oy - stretch;
      const bottom = shownFront - oy + Math.sin(clock * 9 + i) * 3;
      ctx.strokeStyle = `rgba(12,6,22,${0.85 * a})`;
      ctx.lineWidth = Math.max(0.6, 4 - stretch / 14);
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.quadraticCurveTo(x + Math.sin(clock * 5 + i) * 6, (top + bottom) / 2, x * 0.85, bottom);
      ctx.stroke();
    }
    ctx.restore();
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
    over: boolean,
  ): void {
    const t = h.tune;
    const front = oy + Math.max(DARK_MIN, this.coatShown);
    const bottom = Math.min(vh, front + 70);
    if (bottom <= 0) return;
    // Painted onto a layer (at the screen's own scale), then its fringe faded out, so there's no cut line against the shaft.
    const k = ctx.getTransform().a || 1;
    const layer = this.layer(Math.ceil(w * k), Math.ceil(bottom * k));
    const lc = layer.getContext("2d")!;
    lc.setTransform(k, 0, 0, k, 0, 0);
    lc.clearRect(0, 0, w, bottom);
    lc.fillStyle = "rgb(6,3,10)";
    lc.fillRect(ox - h.shaft - 40, 0, h.shaft * 2 + 80, bottom);
    if (art.dark) {
      const ow = t.shaft * 2 + 120;
      const oh = ow * 1.78;
      const breathe = Math.sin(clock * 0.8) * 6;
      lc.drawImage(art.dark, ox - ow / 2, front + 60 + breathe - oh, ow, oh);
    }
    if (this.menace > 0) {
      // Roused: its eyes flare violet through the black.
      lc.globalCompositeOperation = "lighter";
      const g = lc.createRadialGradient(ox, front - 140, 20, ox, front - 140, t.shaft * 1.4);
      g.addColorStop(0, `rgba(170,110,255,${0.5 * this.menace})`);
      g.addColorStop(1, "rgba(170,110,255,0)");
      lc.fillStyle = g;
      lc.fillRect(0, 0, w, bottom);
      lc.globalCompositeOperation = "source-over";
    }
    // The fade: solid to 50 px above the front, gone 60 px below it, ragged across.
    // (Built on its own canvas first: destination-in clears everything outside each shape.)
    const mask = this.layer(Math.ceil(w * k), Math.ceil(bottom * k), true);
    const mc = mask.getContext("2d")!;
    mc.setTransform(k, 0, 0, k, 0, 0);
    mc.clearRect(0, 0, w, bottom);
    for (let x = ox - h.shaft - 40; x < ox + h.shaft + 40; x += 12) {
      const rag = Math.sin(x * 0.17 + 1.3) * 10 + Math.sin(x * 0.043 + clock * 0.5) * 12;
      const f = mc.createLinearGradient(0, front - 50 + rag, 0, front + 60 + rag);
      f.addColorStop(0, over ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)");
      f.addColorStop(over ? 0.45 : 0.4, "rgba(0,0,0,1)");
      f.addColorStop(1, "rgba(0,0,0,0)");
      mc.fillStyle = f;
      mc.fillRect(x, over ? front - 50 + rag : 0, 12, over ? 110 : bottom);
    }
    lc.globalCompositeOperation = "destination-in";
    lc.setTransform(1, 0, 0, 1, 0, 0);
    lc.drawImage(mask, 0, 0);
    lc.globalCompositeOperation = "source-over";
    ctx.save();
    if (over) ctx.globalAlpha = 0.75;
    ctx.drawImage(layer, 0, 0, w * k, bottom * k, 0, 0, w, bottom);
    ctx.restore();
    if (over) return;
    // Its shadow on the shaft below the fringe.
    const sh = ctx.createLinearGradient(0, front, 0, front + 100);
    sh.addColorStop(0, "rgba(4,2,8,0.55)");
    sh.addColorStop(1, "rgba(4,2,8,0)");
    ctx.fillStyle = sh;
    ctx.fillRect(0, front, w, 100);
  }

  private layers: HTMLCanvasElement[] = [];

  /** A scratch canvas (or the second one) at least this size, kept between frames. */
  private layer(w: number, h: number, second = false): HTMLCanvasElement {
    const i = second ? 1 : 0;
    let el = this.layers[i];
    if (!el) el = this.layers[i] = document.createElement("canvas");
    if (el.width < w) el.width = w;
    if (el.height < h) el.height = h;
    return el;
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
    const heat = h.heat;
    ctx.save();
    ctx.translate(ox + h.pivotX, oy);
    ctx.rotate(-h.theta);
    if (h.fall < 0) {
      if (heat > 0.05) {
        // Hot: the wire glows through orange to white.
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = `rgba(255,${Math.round(120 + 120 * heat)},${Math.round(40 + 160 * heat)},${0.25 + 0.6 * heat})`;
        ctx.lineWidth = 6 + 10 * heat;
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(0, 60);
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.strokeStyle = `rgb(${Math.round(120 + 135 * Math.max(s, heat))},${Math.round(100 - 50 * s + 100 * heat)},${Math.round(70 - 50 * s + 100 * heat)})`;
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
    if (this.unlit > 0.5) return;
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
