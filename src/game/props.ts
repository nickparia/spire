import type { RGB } from "./logic";
import { rgbCss } from "./themes";

/**
 * Pickups, hazards and the cues that explain each course. Every one keeps the
 * same colour and shape in every sky, so what a thing is never depends on
 * which level you are in: blue shield, green hourglass, red bomb.
 */
export const SHIELD_RGB: RGB = [110, 200, 255];
export const LULL_RGB: RGB = [132, 240, 170];
export const BOMB_RGB: RGB = [255, 72, 48];
export const EMBER_RGB: RGB = [255, 178, 66];

export type PickupKind = "shield" | "lull" | "ember";

export function pickupRgb(kind: PickupKind): RGB {
  return kind === "shield" ? SHIELD_RGB : kind === "lull" ? LULL_RGB : EMBER_RGB;
}

function flamePath(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.9, -s * 0.2, s * 0.7, s * 0.4);
  ctx.quadraticCurveTo(s * 0.5, s * 1.05, 0, s * 1.05);
  ctx.quadraticCurveTo(-s * 0.75, s * 1.05, -s * 0.7, s * 0.3);
  ctx.quadraticCurveTo(-s * 0.65, -s * 0.2, -s * 0.2, -s * 0.45);
  ctx.quadraticCurveTo(-s * 0.1, -s * 0.1, 0.1 * s, 0);
  ctx.quadraticCurveTo(s * 0.2, -s * 0.5, 0, -s);
  ctx.closePath();
}

const TAU = Math.PI * 2;
const FONT = 'system-ui, -apple-system, "Helvetica Neue", sans-serif';

function shieldPath(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.86, -s * 0.62);
  ctx.lineTo(s * 0.86, s * 0.06);
  ctx.quadraticCurveTo(s * 0.8, s * 0.72, 0, s * 1.06);
  ctx.quadraticCurveTo(-s * 0.8, s * 0.72, -s * 0.86, s * 0.06);
  ctx.lineTo(-s * 0.86, -s * 0.62);
  ctx.closePath();
}

function hourglassPath(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.moveTo(-s * 0.72, -s);
  ctx.lineTo(s * 0.72, -s);
  ctx.lineTo(s * 0.12, 0);
  ctx.lineTo(s * 0.72, s);
  ctx.lineTo(-s * 0.72, s);
  ctx.lineTo(-s * 0.12, 0);
  ctx.closePath();
}

export type PickupView = {
  kind: PickupKind;
  /** Screen position of the badge. */
  x: number;
  y: number;
  /** Screen y of the top of the stack, where the plumb line ends. */
  floorY: number;
  /** True while the slab's groove is close enough to take it. */
  armed: boolean;
  clock: number;
  calm: boolean;
};

/**
 * A pickup hangs on a plumb line. Put the slab's groove under the line and
 * drop: that is the whole rule, and the line is there to say so.
 */
export function drawPickup(ctx: CanvasRenderingContext2D, v: PickupView): void {
  const rgb = pickupRgb(v.kind);
  const bob = v.calm ? 0 : Math.sin(v.clock * 3.2) * 3;
  const y = v.y + bob;
  const r = 15;

  ctx.save();
  // The plumb line and the notch it lands on.
  ctx.strokeStyle = rgbCss(rgb, v.armed ? 0.95 : 0.5);
  ctx.lineWidth = v.armed ? 2 : 1.5;
  if (!v.armed) {
    ctx.setLineDash([4, 5]);
    ctx.lineDashOffset = v.calm ? 0 : -v.clock * 18;
  }
  ctx.beginPath();
  ctx.moveTo(v.x, y + r + 2);
  ctx.lineTo(v.x, v.floorY - 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = rgbCss(rgb, v.armed ? 1 : 0.7);
  ctx.beginPath();
  ctx.moveTo(v.x, v.floorY - 1);
  ctx.lineTo(v.x - 5, v.floorY - 8);
  ctx.lineTo(v.x + 5, v.floorY - 8);
  ctx.closePath();
  ctx.fill();

  ctx.translate(v.x, y);
  const scale = v.armed ? 1.22 : 1;
  ctx.scale(scale, scale);

  const halo = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 2.6);
  halo.addColorStop(0, rgbCss(rgb, v.armed ? 0.55 : 0.28));
  halo.addColorStop(1, rgbCss(rgb, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(-r * 2.6, -r * 2.6, r * 5.2, r * 5.2);

  ctx.fillStyle = "rgba(14,11,9,0.88)";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgbCss(rgb);
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = rgbCss(rgb);
  if (v.kind === "shield") {
    shieldPath(ctx, 7.5);
    ctx.fill();
    ctx.fillStyle = "rgba(14,11,9,0.55)";
    ctx.fillRect(-0.8, -5.5, 1.6, 11);
  } else if (v.kind === "lull") {
    hourglassPath(ctx, 7);
    ctx.fill();
  } else {
    flamePath(ctx, 7.5);
    ctx.fill();
    ctx.fillStyle = "#fff4d6";
    ctx.beginPath();
    ctx.arc(0, 3.5, 2.4, 0, TAU);
    ctx.fill();
  }

  ctx.font = `700 11px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(10,8,6,0.6)";
  const label = v.kind === "shield" ? "SHIELD" : v.kind === "lull" ? "LULL" : "EMBER";
  ctx.strokeText(label, 0, -r - 6);
  ctx.fillStyle = "#f6f1e8";
  ctx.fillText(label, 0, -r - 6);
  ctx.restore();
}

/** The bubble a held shield throws over the top of the stack. */
export function drawShieldDome(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  clock: number,
  age: number,
): void {
  const grow = Math.min(1, age / 0.25);
  const rx = (w / 2 + 20) * grow;
  const ry = 34 * grow;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const fill = ctx.createRadialGradient(x, y, ry * 0.2, x, y, rx);
  fill.addColorStop(0, rgbCss(SHIELD_RGB, 0));
  fill.addColorStop(1, rgbCss(SHIELD_RGB, 0.2));
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgbCss(SHIELD_RGB, 0.75);
  ctx.lineWidth = 2;
  ctx.stroke();
  // A bright arc that travels round the rim.
  const a = clock * 2.2;
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, a, a + 0.7);
  ctx.stroke();
  ctx.restore();
}

export type BombView = {
  x: number;
  y: number;
  /** Screen y of the top of the stack. */
  floorY: number;
  /** Width of the slab it is guarding. */
  w: number;
  /** 1 when lit, falling to 0 as the fuse burns down. */
  fuse: number;
  flash: number;
  clock: number;
  calm: boolean;
};

/** A lit bomb, the column it forbids, and how long is left on the fuse. */
export function drawBomb(ctx: CanvasRenderingContext2D, v: BombView): void {
  const throb = v.calm ? 0.7 : 0.55 + 0.45 * Math.sin(v.clock * 11);
  ctx.save();

  // The no-drop column over the stack.
  const half = v.w / 2 + 12;
  const top = v.y - 34;
  const zone = ctx.createLinearGradient(0, top, 0, v.floorY);
  zone.addColorStop(0, rgbCss(BOMB_RGB, 0));
  zone.addColorStop(1, rgbCss(BOMB_RGB, 0.1 + 0.12 * throb + v.flash * 0.25));
  ctx.fillStyle = zone;
  ctx.fillRect(v.x - half, top, half * 2, v.floorY - top);
  ctx.fillStyle = rgbCss(BOMB_RGB, 0.5 + 0.4 * throb);
  ctx.fillRect(v.x - half, v.floorY - 2, half * 2, 2);

  ctx.translate(v.x, v.y);
  const scale = 1 + (v.calm ? 0 : Math.sin(v.clock * 11) * 0.05) + v.flash * 0.25;
  ctx.scale(scale, scale);

  const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, 46);
  halo.addColorStop(0, rgbCss(BOMB_RGB, 0.45 * throb + v.flash * 0.4));
  halo.addColorStop(1, rgbCss(BOMB_RGB, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(-46, -46, 92, 92);

  // Countdown ring: it empties as the fuse burns.
  ctx.strokeStyle = "rgba(246,241,232,0.18)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 21, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = rgbCss(BOMB_RGB);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 0, 21, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0, v.fuse));
  ctx.stroke();

  // Body, with a highlight so it reads as a ball rather than a dot.
  ctx.fillStyle = v.flash > 0.2 ? rgbCss(BOMB_RGB) : "#16110f";
  ctx.beginPath();
  ctx.arc(0, 2, 12, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.arc(-4, -2, 3.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#3a302b";
  ctx.fillRect(-3.5, -13, 7, 5);

  // Fuse and spark.
  ctx.strokeStyle = "#cdb89a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.quadraticCurveTo(7, -22, 11, -16);
  ctx.stroke();
  const spark = 3 + throb * 2.5;
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "#ffd27a";
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + v.clock * 9;
    const r = i % 2 === 0 ? spark * 1.7 : spark * 0.6;
    ctx.lineTo(11 + Math.cos(a) * r, -16 + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  ctx.font = `700 12px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(10,8,6,0.65)";
  ctx.strokeText("WAIT", 0, -30);
  ctx.fillStyle = rgbCss(BOMB_RGB);
  ctx.fillText("WAIT", 0, -30);
  ctx.restore();
}

/**
 * Wind you can read: curling gusts streaming along the slab's lane and
 * chevrons marching the way it blows. The slab is fast with these and slow
 * against them.
 */
export function drawWindLane(
  ctx: CanvasRenderingContext2D,
  left: number,
  right: number,
  y: number,
  dir: number,
  clock: number,
  rgb: RGB,
): void {
  const span = right - left + 120;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const rows = [-40, -27, 9, 22, -52, 34];
  for (let i = 0; i < rows.length; i++) {
    const p = (((clock * (0.75 + (i % 3) * 0.14) + i * 0.37) % 1) + 1) % 1;
    const head = dir > 0 ? left - 60 + p * span : right + 60 - p * span;
    const len = 54 + (i % 3) * 16;
    const hy = y + rows[i]!;
    ctx.globalAlpha = Math.sin(p * Math.PI) * 0.8;
    ctx.strokeStyle = "#fbf6ee";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(head - dir * len, hy + 3);
    ctx.quadraticCurveTo(head - dir * len * 0.4, hy - 4, head, hy);
    // The curl at the head is what makes a streak read as wind.
    const r = 5;
    ctx.arc(head, hy - r, r, Math.PI / 2, dir > 0 ? -Math.PI : Math.PI * 2, dir > 0);
    ctx.stroke();
  }

  // Chevrons at the downwind end.
  const march = (((clock * 1.8) % 1) + 1) % 1;
  const edge = dir > 0 ? right + 14 : left - 14;
  ctx.strokeStyle = rgbCss(rgb);
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const t = (i + march) / 3;
    const cx = edge + dir * t * 30;
    ctx.globalAlpha = Math.sin(t * Math.PI) * 0.95;
    ctx.beginPath();
    ctx.moveTo(cx - dir * 5, y - 20);
    ctx.lineTo(cx + dir * 3, y - 12);
    ctx.lineTo(cx - dir * 5, y - 4);
    ctx.stroke();
  }
  ctx.restore();
}

/** The two walls the slab rests against in Breath. `held` is -1, 0 or 1. */
export function drawWalls(
  ctx: CanvasRenderingContext2D,
  left: number,
  right: number,
  y: number,
  h: number,
  held: number,
  clock: number,
  rgb: RGB,
): void {
  ctx.save();
  for (const side of [-1, 1]) {
    const x = side < 0 ? left - 9 : right + 5;
    const on = held === side;
    if (on) {
      const swell = 0.5 + 0.5 * Math.sin(clock * 5);
      const glow = ctx.createRadialGradient(x + 2, y - h / 2, 2, x + 2, y - h / 2, 40 + swell * 14);
      glow.addColorStop(0, rgbCss(rgb, 0.55));
      glow.addColorStop(1, rgbCss(rgb, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(x - 56, y - h / 2 - 56, 116, 112);
    }
    ctx.fillStyle = on ? rgbCss(rgb) : "rgba(246,241,232,0.5)";
    ctx.fillRect(x, y - h - 7, 4, h + 14);
    ctx.fillRect(x - 3, y - h - 7, 10, 3);
    ctx.fillRect(x - 3, y + 4, 10, 3);
  }
  ctx.restore();
}

/** Rush: the stretch through the middle where the slab bolts. */
export function drawRushLane(
  ctx: CanvasRenderingContext2D,
  cx: number,
  half: number,
  y: number,
  h: number,
  dir: number,
  clock: number,
  rgb: RGB,
): void {
  ctx.save();
  const top = y - h - 12;
  const tall = h + 24;
  const band = ctx.createLinearGradient(cx - half, 0, cx + half, 0);
  band.addColorStop(0, "rgba(255,255,255,0)");
  band.addColorStop(0.5, "rgba(255,255,255,0.16)");
  band.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = band;
  ctx.fillRect(cx - half, top, half * 2, tall);
  // Posts mark where the fast stretch starts and ends.
  ctx.fillStyle = rgbCss(rgb, 0.9);
  ctx.fillRect(cx - half - 1, top, 2, tall);
  ctx.fillRect(cx + half - 1, top, 2, tall);
  // Chevrons race through it the way the slab is heading.
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < 4; i++) {
    const p = (((clock * 1.9 + i / 4) % 1) + 1) % 1;
    const x = cx + dir * (p - 0.5) * half * 2;
    ctx.globalAlpha = Math.sin(p * Math.PI) * 0.8;
    ctx.beginPath();
    ctx.moveTo(x - dir * 7, y - h - 4);
    ctx.lineTo(x + dir * 3, y - h / 2);
    ctx.lineTo(x - dir * 7, y + 4);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * The streamer under a hanging slab. It hangs straight in still air and is
 * blown sideways by wind, and its weighted end shows where the slab will land.
 */
export function drawStreamer(
  ctx: CanvasRenderingContext2D,
  x: number,
  top: number,
  bottom: number,
  lean: number,
  clock: number,
  rgb: RGB,
  calm: boolean,
): void {
  const steps = 12;
  ctx.save();
  ctx.strokeStyle = "rgba(251,246,238,0.85)";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  let ex = x;
  let ey = top;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Pinned at the slab, freer toward the end, and livelier the harder it blows.
    const flutter = calm ? 0 : Math.sin(clock * 9 - t * 5) * t * Math.min(5, Math.abs(lean) * 0.12);
    ex = x + lean * t + flutter;
    ey = top + (bottom - top) * t;
    if (i === 0) ctx.moveTo(ex, ey);
    else ctx.lineTo(ex, ey);
  }
  ctx.stroke();
  ctx.fillStyle = rgbCss(rgb);
  ctx.beginPath();
  ctx.moveTo(ex, ey + 5);
  ctx.lineTo(ex - 5, ey - 4);
  ctx.lineTo(ex + 5, ey - 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Dashed outline of where a hanging slab will come to rest. */
export function drawLandingGhost(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rgb: RGB,
  clock: number,
): void {
  ctx.save();
  ctx.fillStyle = rgbCss(rgb, 0.12);
  ctx.fillRect(x, y - h, w, h);
  ctx.strokeStyle = rgbCss(rgb, 0.9);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  ctx.lineDashOffset = -clock * 20;
  ctx.strokeRect(x + 0.75, y - h + 0.75, w - 1.5, h - 1.5);
  ctx.restore();
}

/** A clock face that rides a slowed slab. */
export function drawSlowBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  clock: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(14,11,9,0.85)";
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgbCss(LULL_RGB);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -6);
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(clock * 1.2) * 4.5, Math.sin(clock * 1.2) * 4.5);
  ctx.stroke();
  ctx.restore();
}
