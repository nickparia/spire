import { Hang, LINK_H, LINK_W, SINK, STONE_H } from "./hang";

/**
 * How the Descent looks: one shaft, the painted depth behind, the drill in
 * the opening at the top sinking into the rock as the fight is won, the
 * chains running down from it through the slabs, the Dark filling the shaft
 * above the line it has hauled the drill up to, its claws out of the walls,
 * and the stone sliding below the tip. Slabs are painted by the engine's own
 * painter, so they match the rest of the game.
 */

export type HangArt = {
  depth: CanvasImageSource | null;
  /** The Dark: a painting whose lower edge is its fringe of tendrils (a playing video or its still). */
  dark: CanvasImageSource | null;
  rig: HTMLImageElement | null;
  /** The rock of this depth, for the floor you're dragging the roots down to. */
  rock: HTMLImageElement | null;
  /** The Dark's arm, a sprite sheet (square cells): reaching in from the left, grasping, drawing back. */
  claw: { img: HTMLImageElement; cell: number; frames: number } | null;
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

  step(dt: number, h: Hang, viewH: number): void {
    // The machine stays in view until the tower has grown enough to push it up.
    const want = Math.min(viewH * 0.3, viewH * TIP_Y - h.length - STONE_H * 1.6);
    this.camY += (want - this.camY) * Math.min(1, dt * 3);
    this.flash = Math.max(0, this.flash - dt * 3);
    this.shake = Math.max(0, this.shake - dt * 2.6);
    this.menace = Math.max(0, this.menace - dt * 1.4);
    this.jolt *= Math.exp(-dt * 6);
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
    this.drawRig(ctx, h, art, ox, oy);
    this.drawChain(ctx, h, ox, oy, clock);
    this.drawTower(ctx, h, ox, oy, paint);
    this.drawGrip(ctx, h, ox, oy, clock);
    this.drawDark(ctx, h, art, w, vh, ox, oy, clock, true);
    this.drawClaws(ctx, h, art, ox, oy, clock);
    this.drawLip(ctx, h, art, ox, oy);
    if (h.fall < 0) this.drawSlider(ctx, h, ox, oy, paint);
  }

  /**
   * The Dark's claws: arms out of the rock walls, reaching for the chain and
   * drawing back. Painted for now; the Higgsfield sheets replace them.
   */
  private drawClaws(
    ctx: CanvasRenderingContext2D,
    h: Hang,
    art: HangArt,
    ox: number,
    oy: number,
    clock: number,
  ): void {
    const t = h.tune;
    if (art.claw) {
      // The painted arm: its cell spans the shaft, its wrist at the wall it came through.
      const { img, cell, frames } = art.claw;
      const size = t.shaft * 1.9;
      for (const c of h.claws) {
        const frame = Math.min(frames - 1, Math.floor(c.t * frames));
        const x0 = ox + c.side * (t.shaft + 40);
        ctx.save();
        ctx.translate(x0, oy + c.y);
        ctx.scale(-c.side, 1);
        // Bursts in and fades as it withdraws: the sheet's own motion carries the reach.
        ctx.globalAlpha = c.t < 0.1 ? c.t / 0.1 : c.t > 0.85 ? (1 - c.t) / 0.15 : 1;
        ctx.drawImage(img, frame * cell, 0, cell, cell, -size * 0.08, -size / 2, size, size);
        ctx.restore();
      }
      return;
    }
    for (const c of h.claws) {
      const reach = Math.sin(Math.min(1, c.t) * Math.PI) * (t.shaft * 0.75);
      const x0 = ox + c.side * (t.shaft + 40);
      const y = oy + c.y;
      const dir = -c.side;
      ctx.save();
      ctx.translate(x0, y);
      ctx.scale(dir, 1);
      // The arm: thick at the wall, tapering, with a glossy ridge.
      const arm = ctx.createLinearGradient(0, 0, reach, 0);
      arm.addColorStop(0, "rgb(18,8,30)");
      arm.addColorStop(1, "rgb(40,18,60)");
      ctx.fillStyle = arm;
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.quadraticCurveTo(reach * 0.5, -30 + Math.sin(clock * 7) * 3, reach * 0.82, -12);
      // Three talons.
      for (const [dy, len] of [
        [-12, 1],
        [0, 1.12],
        [12, 0.95],
      ] as const) {
        ctx.lineTo(reach * 0.82, dy - 5);
        ctx.quadraticCurveTo(
          reach * (0.82 + 0.1 * len),
          dy - 2,
          reach * (0.82 + 0.18 * len),
          dy + 4,
        );
        ctx.quadraticCurveTo(reach * (0.82 + 0.08 * len), dy + 3, reach * 0.82, dy + 6);
      }
      ctx.lineTo(reach * 0.82, 12);
      ctx.quadraticCurveTo(reach * 0.5, 30 + Math.sin(clock * 6) * 3, 0, 36);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(150,100,220,0.35)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(4, -20);
      ctx.quadraticCurveTo(reach * 0.5, -16, reach * 0.8, -6);
      ctx.stroke();
      // The rock it came through, cracked.
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, -40 + i * 26);
        ctx.lineTo(-18 - (i % 2) * 10, -50 + i * 26 + Math.sin(i * 3) * 8);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /** The lip of the opening: drawn over the drill, so it reads as sunk into the rock. */
  private drawLip(
    ctx: CanvasRenderingContext2D,
    h: Hang,
    art: HangArt,
    ox: number,
    oy: number,
  ): void {
    const t = h.tune;
    const sink = h.sink;
    const top = oy - SINK - 30;
    const left = ox - t.shaft - 40;
    const width = t.shaft * 2 + 80;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(left, top - 200);
    ctx.lineTo(left + width, top - 200);
    ctx.lineTo(left + width, top + sink);
    for (let x = width; x >= 0; x -= 12) {
      ctx.lineTo(left + x, top + sink + Math.sin(x * 0.13) * 4 + Math.sin(x * 0.041 + 2) * 7);
    }
    ctx.closePath();
    if (ready(art.rock)) {
      const pat = ctx.createPattern(art.rock, "repeat");
      if (pat) {
        pat.setTransform(new DOMMatrix().translate(left, top).scale(200 / art.rock.naturalWidth));
        ctx.fillStyle = pat;
      } else ctx.fillStyle = "rgb(40,28,24)";
    } else ctx.fillStyle = "rgb(40,28,24)";
    ctx.fill();
    const shade = ctx.createLinearGradient(0, top + sink - 40, 0, top + sink + 10);
    shade.addColorStop(0, "rgba(0,0,0,0)");
    shade.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = shade;
    ctx.fill();
    // The broken edge of the opening, lit from the drill's furnace below it.
    ctx.strokeStyle = "rgba(255,190,120,0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 12) {
      ctx.lineTo(left + x, top + sink + Math.sin(x * 0.13) * 4 + Math.sin(x * 0.041 + 2) * 7);
    }
    ctx.stroke();
    ctx.restore();
  }

  /** Where the floor you're breaking through sits on screen: it nears as the drill strains. */
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
    const left = ox - t.shaft - 40;
    const width = t.shaft * 2 + 80;
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
      const cx = ox + Math.sin(seed) * t.shaft * 0.9;
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
    const tp = h.tip();
    ctx.save();
    ctx.translate(ox + tp.x * (this.coatShown / Math.max(1, h.length)), oy);
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
    lc.fillRect(ox - t.shaft - 40, 0, t.shaft * 2 + 80, bottom);
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
    for (let x = ox - t.shaft - 40; x < ox + t.shaft + 40; x += 12) {
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

  /** The drill, in the opening at the top of the shaft; the mount's hook is at (pivotX, 0). */
  private drawRig(
    ctx: CanvasRenderingContext2D,
    h: Hang,
    art: HangArt,
    ox: number,
    oy: number,
  ): void {
    if (!ready(art.rig) || oy < -420) return;
    const rw = 400;
    const rh = rw * (art.rig.naturalHeight / art.rig.naturalWidth);
    const fallY = h.fall >= 0 ? h.fall * h.fall * 520 : 0;
    ctx.drawImage(art.rig, ox + h.pivotX - rw / 2, oy - rh * 0.97 + fallY, rw, rh);
  }

  /** The chains: every link where the physics has it, a hook nub at its foot. */
  private drawChain(
    ctx: CanvasRenderingContext2D,
    h: Hang,
    ox: number,
    oy: number,
    clock: number,
  ): void {
    const s = h.strain;
    ctx.save();
    ctx.lineCap = "round";
    const hot = s > 0.55 ? (s - 0.55) * 2 : 0;
    for (const l of h.linkPoses()) {
      ctx.save();
      ctx.translate(ox + l.x, oy + l.y);
      ctx.rotate(l.angle);
      ctx.strokeStyle = `rgb(${Math.round(110 + 120 * hot)},${Math.round(88 - 30 * hot)},${Math.round(60 - 30 * hot)})`;
      ctx.lineWidth = LINK_W;
      ctx.beginPath();
      ctx.moveTo(0, -LINK_H / 2 + 1);
      ctx.lineTo(0, LINK_H / 2 - 1);
      ctx.stroke();
      ctx.fillStyle = "rgb(200,165,105)";
      ctx.fillRect(-4, LINK_H / 2 - 3, 8, 3);
      ctx.restore();
    }
    if (hot > 0) {
      // Near the limit the whole chain glows, straining.
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(255,120,60,${hot * 0.5 + Math.sin(clock * 12) * 0.08})`;
      ctx.lineWidth = 9;
      for (const l of h.linkPoses()) {
        ctx.beginPath();
        ctx.moveTo(ox + l.x, oy + l.y - LINK_H / 2);
        ctx.lineTo(ox + l.x, oy + l.y + LINK_H / 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /** The slabs, each where the physics has it: those held by the Dark are coated. */
  private drawTower(
    ctx: CanvasRenderingContext2D,
    h: Hang,
    ox: number,
    oy: number,
    paint: StonePainter,
  ): void {
    const t = h.tune;
    const coat = h.coat;
    const poses = h.slabPoses();
    poses.forEach((p, i) => {
      ctx.save();
      ctx.translate(ox + p.x, oy + p.y);
      ctx.rotate(p.angle);
      paint(ctx, -t.stoneW / 2, VISUAL / 2, t.stoneW, VISUAL, p.y < coat, false);
      if (this.flash > 0 && i === poses.length - 1) {
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(255,220,160,${this.flash * 0.5})`;
        ctx.fillRect(-t.stoneW / 2 - 6, -VISUAL / 2 - 4, t.stoneW + 12, VISUAL + 6);
      }
      ctx.restore();
    });
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
    const sy = oy + tp.y + 2 * LINK_H + 6;
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
