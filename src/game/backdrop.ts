import { clamp01, mix, type RGB } from "./logic";
import { rgbCss, type LayerDef, type Orb, type Theme, type Weather } from "./themes";

/** Everything the backdrop needs to know about the camera this frame. */
export type BackdropView = {
  w: number;
  h: number;
  /** Screen y of the ground line when the camera is at rest. */
  horizon: number;
  camX: number;
  camY: number;
  /** 0 at ground level, 1 at the summit. Drives the sky's colour. */
  altitude: number;
  clock: number;
  /** 0..1 flash of light for a reward. */
  pulse: number;
  /** 0..1, lights the eclipse's diamond ring. */
  flare: number;
  reduceMotion: boolean;
};

type Star = { x: number; y: number; r: number; a: number; speed: number; phase: number };
type Cloud = {
  x: number;
  alt: number;
  depth: number;
  scale: number;
  speed: number;
  sprite: number;
};
type Fleck = { x: number; y: number; z: number; size: number; phase: number };

type WeatherSpec = { count: number; vx: number; vy: number };

const WEATHER: Record<Weather, WeatherSpec> = {
  embers: { count: 40, vx: 6, vy: -36 },
  gale: { count: 26, vx: 430, vy: 26 },
  rain: { count: 60, vx: -70, vy: 640 },
  mist: { count: 34, vx: 10, vy: -12 },
  dust: { count: 44, vx: 48, vy: 5 },
  snow: { count: 54, vx: 12, vy: 46 },
  ash: { count: 36, vx: -7, vy: 18 },
  stardust: { count: 44, vx: 4, vy: -7 },
};

const PAD = 32;
const CLOUD_W = 320;
const CLOUD_H = 104;
const TAU = Math.PI * 2;

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function makeCanvas(
  w: number,
  h: number,
  scale: number,
): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(w * scale));
  canvas.height = Math.max(1, Math.ceil(h * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  return [canvas, ctx];
}

/* ------------------------------------------------------------------ layers */

function paintRidge(ctx: CanvasRenderingContext2D, W: number, H: number, rand: () => number): void {
  // Integer frequencies over the tile width, so the silhouette wraps cleanly.
  const waves = [1, 2, 3, 5, 8, 13].map((f) => ({
    f,
    a: 1 / Math.pow(f, 0.85),
    p: rand() * TAU,
    ridged: f <= 3,
  }));
  const norm = waves.reduce((sum, w) => sum + w.a, 0);
  ctx.beginPath();
  ctx.moveTo(0, H + 2);
  for (let x = 0; x <= W + 3; x += 3) {
    let n = 0;
    for (const w of waves) {
      const u = x / W;
      n += w.ridged
        ? w.a * (1 - 2 * Math.abs(Math.sin(Math.PI * w.f * u + w.p)))
        : w.a * Math.sin(TAU * w.f * u + w.p);
    }
    const h = H * Math.max(0.16, Math.min(1, 0.56 + (0.75 * n) / norm));
    ctx.lineTo(x, H - h);
  }
  ctx.lineTo(W + 3, H + 2);
  ctx.closePath();
  ctx.fill();
}

function paintPeaks(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  rand: () => number,
  caps: string | undefined,
): void {
  type Peak = { lx: number; lh: number; ax: number; ah: number; rx: number; rh: number };
  const peaks: Peak[] = [];
  const firstValley = H * (0.2 + rand() * 0.14);
  let x = 0;
  let valley = firstValley;
  while (x < W) {
    let end = x + H * (0.5 + rand() * 0.6);
    if (W - end < H * 0.45) end = W;
    const ax = x + (end - x) * (0.36 + rand() * 0.28);
    const ah = H * (0.58 + rand() * 0.42);
    const nextValley = end >= W ? firstValley : H * (0.18 + rand() * 0.2);
    peaks.push({ lx: x, lh: valley, ax, ah, rx: end, rh: nextValley });
    x = end;
    valley = nextValley;
  }

  ctx.beginPath();
  ctx.moveTo(0, H + 2);
  ctx.lineTo(0, H - firstValley);
  for (const p of peaks) {
    // A shoulder on each slope keeps the faces from reading as plain triangles.
    const ls = 0.45 + rand() * 0.2;
    const rs = 0.45 + rand() * 0.2;
    ctx.lineTo(p.lx + (p.ax - p.lx) * ls, H - (p.lh + (p.ah - p.lh) * (ls - 0.12)));
    ctx.lineTo(p.ax, H - p.ah);
    ctx.lineTo(p.ax + (p.rx - p.ax) * rs, H - (p.ah + (p.rh - p.ah) * (rs + 0.12)));
    ctx.lineTo(p.rx, H - p.rh);
  }
  ctx.lineTo(W, H + 2);
  ctx.closePath();
  ctx.fill();

  if (!caps) return;
  ctx.fillStyle = caps;
  ctx.globalAlpha = 0.82;
  for (const p of peaks) {
    const drop = p.ah * (0.16 + rand() * 0.1);
    const lt = Math.min(0.4, drop / Math.max(1, p.ah - p.lh));
    const rt = Math.min(0.4, drop / Math.max(1, p.ah - p.rh));
    const lx = p.ax + (p.lx - p.ax) * lt;
    const rx = p.ax + (p.rx - p.ax) * rt;
    const y = H - p.ah;
    ctx.beginPath();
    ctx.moveTo(p.ax, y);
    ctx.lineTo(lx, y + drop);
    const teeth = 4;
    for (let i = 1; i < teeth; i++) {
      const tx = lx + ((rx - lx) * i) / teeth;
      ctx.lineTo(tx, y + drop * (i % 2 === 1 ? 0.58 : 1.12));
    }
    ctx.lineTo(rx, y + drop);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function paintSkyline(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  rand: () => number,
  lights: string | undefined,
): void {
  const unit = Math.max(18, Math.min(54, H * 0.22));
  const windows: [number, number, number][] = [];
  let x = 0;
  while (x < W) {
    const bw = Math.min(W - x, unit * (0.6 + rand() * 1.1));
    const bh = Math.min(H * 0.86, H * (0.34 + rand() * 0.44) + (rand() < 0.16 ? H * 0.16 : 0));
    const top = H - bh;
    ctx.fillRect(x, top, bw + 0.5, bh + 2);
    let crown = top;
    if (bw > 20 && rand() < 0.45) {
      const sw = bw * (0.4 + rand() * 0.25);
      const sh = H * (0.03 + rand() * 0.06);
      crown = top - sh;
      ctx.fillRect(x + (bw - sw) / 2, crown, sw, sh + 1);
    }
    if (rand() < 0.3) {
      const mast = H * (0.04 + rand() * 0.07);
      ctx.fillRect(x + bw / 2 - 0.75, crown - mast, 1.5, mast + 1);
    }
    for (let wy = top + 7; wy < H - 8; wy += 9) {
      for (let wx = x + 4; wx < x + bw - 6; wx += 7) {
        if (rand() < 0.3) windows.push([wx, wy, 0.35 + rand() * 0.65]);
      }
    }
    x += bw + (rand() < 0.22 ? 2 + rand() * 5 : 0);
  }
  if (!lights) return;
  ctx.fillStyle = lights;
  for (const [wx, wy, a] of windows) {
    ctx.globalAlpha = a;
    ctx.fillRect(wx, wy, 3, 4);
  }
  ctx.globalAlpha = 1;
}

function paintMesa(ctx: CanvasRenderingContext2D, W: number, H: number, rand: () => number): void {
  const floor = H * (0.18 + rand() * 0.08);
  ctx.beginPath();
  ctx.moveTo(0, H + 2);
  ctx.lineTo(0, H - floor);
  let x = 0;
  while (x < W) {
    x += 14 + rand() * 40;
    ctx.lineTo(x, H - floor - rand() * 4);
    const top = H * (0.5 + rand() * 0.5);
    const cliff = 6 + rand() * 10;
    ctx.lineTo(x + cliff * 0.4, H - top * 0.56);
    ctx.lineTo(x + cliff * 0.4 + 6, H - top * 0.6);
    ctx.lineTo(x + cliff + 6, H - top);
    x += cliff + 6 + H * (0.28 + rand() * 0.6);
    ctx.lineTo(x, H - top + rand() * 5);
    ctx.lineTo(x + cliff * 0.5, H - top * 0.5);
    ctx.lineTo(x + cliff * 0.5 + 5, H - top * 0.45);
    x += cliff + 5;
    ctx.lineTo(x, H - floor);
  }
  ctx.lineTo(Math.max(W, x), H + 2);
  ctx.closePath();
  ctx.fill();

  // Strata: thin bands laid across the rock only.
  ctx.globalCompositeOperation = "source-atop";
  for (let i = 0; i < 5; i++) {
    const y = H - H * (0.26 + i * 0.15);
    ctx.fillStyle = "rgba(0,0,0,0.13)";
    ctx.fillRect(0, y, W, 2.5);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(0, y + 2.5, W, 1.5);
  }
  ctx.globalCompositeOperation = "source-over";
}

function paintWorks(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  rand: () => number,
  lights: string | undefined,
): void {
  const glows: [number, number, number, number, number][] = [];
  ctx.fillRect(0, H - H * 0.14, W, H * 0.14 + 2);
  let x = 0;
  while (x < W) {
    const roll = rand();
    if (roll < 0.3) {
      const w = Math.max(4, H * (0.035 + rand() * 0.025));
      const h = H * (0.6 + rand() * 0.4);
      ctx.fillRect(x, H - h, w, h);
      ctx.fillRect(x - 2, H - h, w + 4, 4);
      glows.push([x + w / 2 - 1.5, H - h - 5, 3, 3, 0.9]);
      x += w + 8 + rand() * 16;
    } else if (roll < 0.66) {
      const w = H * (0.36 + rand() * 0.36);
      const h = H * (0.2 + rand() * 0.2);
      const top = H - h;
      ctx.fillRect(x, top, w, h);
      const teeth = Math.max(2, Math.round(w / (H * 0.14)));
      const tw = w / teeth;
      ctx.beginPath();
      for (let i = 0; i < teeth; i++) {
        ctx.moveTo(x + i * tw, top + 1);
        ctx.lineTo(x + (i + 1) * tw, top - tw * 0.5);
        ctx.lineTo(x + (i + 1) * tw, top + 1);
      }
      ctx.closePath();
      ctx.fill();
      for (let wx = x + 5; wx < x + w - 8; wx += 10) {
        if (rand() < 0.55) glows.push([wx, top + h * 0.35, 5, 3, 0.35 + rand() * 0.5]);
      }
      x += w + rand() * 6;
    } else if (roll < 0.86) {
      const w = H * (0.16 + rand() * 0.1);
      const h = H * (0.45 + rand() * 0.25);
      const top = H - h;
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.lineTo(x + w * 0.14, top + w * 0.36);
      ctx.arc(x + w / 2, top + w * 0.36, w * 0.36, Math.PI, 0);
      ctx.lineTo(x + w, H);
      ctx.closePath();
      ctx.fill();
      glows.push([x + w * 0.3, top + h * 0.58, w * 0.4, 2.5, 0.8]);
      ctx.fillRect(x + w - 2, H - h * 0.5, 18, 3);
      x += w + 5;
    } else {
      const w = H * 0.14;
      const h = H * (0.24 + rand() * 0.1);
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.lineTo(x, H - h + w / 2);
      ctx.arc(x + w / 2, H - h + w / 2, w / 2, Math.PI, 0);
      ctx.lineTo(x + w, H);
      ctx.closePath();
      ctx.fill();
      x += w + 7;
    }
  }
  if (!lights) return;
  ctx.fillStyle = lights;
  for (const [gx, gy, gw, gh, a] of glows) {
    ctx.globalAlpha = a;
    ctx.fillRect(gx, gy, gw, gh);
  }
  ctx.globalAlpha = 1;
}

function paintCloudbank(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  rand: () => number,
): void {
  ctx.fillRect(0, H * 0.62, W, H * 0.38 + 2);
  const puffs: [number, number, number][] = [];
  let x = 0;
  while (x < W) {
    const r = H * (0.2 + rand() * 0.26);
    const crest = H * (0.5 + rand() * 0.5);
    puffs.push([x, H - crest + r, r]);
    x += r * (0.8 + rand() * 0.5);
  }
  for (const [px, py, r] of puffs) {
    // Drawn three times so puffs that cross the tile edge wrap around.
    for (const offset of [-W, 0, W]) {
      ctx.beginPath();
      ctx.arc(px + offset, py, r, 0, TAU);
      ctx.fill();
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px + offset, py, r - 1, Math.PI * 1.18, Math.PI * 1.82);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function buildLayer(def: LayerDef, tileW: number, scale: number): HTMLCanvasElement {
  const H = def.height;
  const [canvas, ctx] = makeCanvas(tileW, H + 2, scale);
  const rand = rng(def.seed * 7919 + 13);
  const fill = ctx.createLinearGradient(0, 0, 0, H);
  fill.addColorStop(0, def.top);
  fill.addColorStop(1, def.bottom);
  ctx.fillStyle = fill;
  if (def.kind === "ridge") paintRidge(ctx, tileW, H, rand);
  else if (def.kind === "peaks") paintPeaks(ctx, tileW, H, rand, def.caps);
  else if (def.kind === "skyline") paintSkyline(ctx, tileW, H, rand, def.lights);
  else if (def.kind === "mesa") paintMesa(ctx, tileW, H, rand);
  else if (def.kind === "works") paintWorks(ctx, tileW, H, rand, def.lights);
  else paintCloudbank(ctx, tileW, H, rand);
  return canvas;
}

function buildCloudSprite(tint: RGB, seed: number): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(CLOUD_W, CLOUD_H, 1);
  const rand = rng(seed);
  for (let i = 0; i < 7; i++) {
    // Kept well inside the sprite so no puff is cut off at its edge.
    const cx = 90 + rand() * 140;
    const cy = 50 + rand() * 14;
    const rx = 34 + rand() * 40;
    const ry = 14 + rand() * 14;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, rgbCss(tint, 0.5));
    g.addColorStop(1, rgbCss(tint, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  return canvas;
}

/* ---------------------------------------------------------------- backdrop */

/**
 * One level's sky: a gradient that deepens with altitude, a sun or moon,
 * drifting cloud, bands of scenery that slide past at their own depth, and
 * weather in front of and behind the tower.
 *
 * Scenery is painted once into tiles and blitted each frame, so the per-frame
 * cost stays flat however detailed a skyline is.
 */
export class Backdrop {
  readonly theme: Theme;
  private w = 0;
  private h = 0;
  private tileW = 0;
  private layers: { def: LayerDef; canvas: HTMLCanvasElement }[] = [];
  private sprites: HTMLCanvasElement[] = [];
  private clouds: Cloud[] = [];
  private stars: Star[] = [];
  private flecks: Fleck[] = [];

  constructor(theme: Theme) {
    this.theme = theme;
    const rand = rng(theme.layers.length * 97 + theme.track.root);
    for (let i = 0; i < 96; i++) {
      this.stars.push({
        x: rand(),
        y: rand(),
        r: rand() < 0.14 ? 1.8 : 1,
        a: 0.35 + rand() * 0.65,
        speed: 0.6 + rand() * 2.2,
        phase: rand() * TAU,
      });
    }
    const spec = WEATHER[theme.weather];
    for (let i = 0; i < spec.count; i++) {
      this.flecks.push({
        x: rand(),
        y: rand(),
        z: 0.45 + rand() * 1.1,
        size: rand(),
        phase: rand() * TAU,
      });
    }
    for (let i = 0; i < 3; i++) this.sprites.push(buildCloudSprite(theme.cloud.tint, 101 + i * 31));
  }

  /** `climb` is how far the camera will rise, so cloud is spread over the whole ascent. */
  resize(w: number, h: number, dpr: number, climb: number): void {
    const tileW = Math.ceil(w + 240);
    // Wide desktop views would need very large tiles at 2x; soften them instead.
    const scale = w > 900 ? 1 : Math.min(2, dpr);
    if (tileW !== this.tileW || this.layers.length === 0) {
      this.tileW = tileW;
      this.layers = this.theme.layers.map((def) => ({
        def,
        canvas: buildLayer(def, tileW, scale),
      }));
    }
    this.w = w;
    this.h = h;
    const rand = rng(this.theme.track.bpm * 31 + 7);
    this.clouds = [];
    for (let i = 0; i < this.theme.cloud.count; i++) {
      const depth = 0.14 + rand() * 0.5;
      this.clouds.push({
        x: rand(),
        alt: 150 + rand() * (climb * depth + h * 0.55),
        depth,
        scale: 0.7 + depth * 1.6,
        speed: 3 + depth * 16,
        sprite: i % this.sprites.length,
      });
    }
  }

  /** Sky, scenery and the weather behind the tower. */
  draw(ctx: CanvasRenderingContext2D, v: BackdropView): void {
    const theme = this.theme;
    const clock = v.reduceMotion ? 0 : v.clock;
    this.drawSky(ctx, v);
    this.drawStars(ctx, v, clock);
    if (theme.orb) this.drawOrb(ctx, v, theme.orb, clock);
    if (theme.extra === "aurora") this.drawAurora(ctx, v, clock);
    this.drawClouds(ctx, v, clock, false);
    this.drawGlow(ctx, v);
    for (const layer of this.layers) this.drawLayer(ctx, v, layer.def, layer.canvas, clock);
    if (theme.extra === "waves") this.drawWaves(ctx, v, clock);
    this.drawClouds(ctx, v, clock, true);
    if (!v.reduceMotion) this.drawWeather(ctx, v, false);
  }

  /** Weather that falls between the tower and the lens. */
  drawFront(ctx: CanvasRenderingContext2D, v: BackdropView): void {
    if (!v.reduceMotion) this.drawWeather(ctx, v, true);
  }

  private drawSky(ctx: CanvasRenderingContext2D, v: BackdropView): void {
    const t = clamp01(v.altitude);
    const { skyLow, skyHigh } = this.theme;
    const foot = Math.max(v.h * 0.5, Math.min(v.h, v.horizon + v.camY * 0.1));
    const g = ctx.createLinearGradient(0, 0, 0, foot);
    g.addColorStop(0, rgbCss(mix(skyLow[0], skyHigh[0], t)));
    g.addColorStop(0.55, rgbCss(mix(skyLow[1], skyHigh[1], t)));
    g.addColorStop(1, rgbCss(mix(skyLow[2], skyHigh[2], t)));
    ctx.fillStyle = g;
    ctx.fillRect(-PAD, -PAD, v.w + PAD * 2, v.h + PAD * 2);
  }

  private drawGlow(ctx: CanvasRenderingContext2D, v: BackdropView): void {
    const foot = v.horizon + v.camY * 0.1;
    if (foot < -40) return;
    const reach = v.h * 0.34;
    const a = 0.26 * (1 - clamp01(v.altitude) * 0.5) + v.pulse * 0.3;
    const g = ctx.createLinearGradient(0, foot - reach, 0, foot);
    g.addColorStop(0, rgbCss(this.theme.horizon, 0));
    g.addColorStop(1, rgbCss(this.theme.horizon, a));
    ctx.fillStyle = g;
    ctx.fillRect(-PAD, foot - reach, v.w + PAD * 2, reach);
  }

  private drawStars(ctx: CanvasRenderingContext2D, v: BackdropView, clock: number): void {
    const [low, high] = this.theme.stars;
    const level = low + (high - low) * clamp01(v.altitude);
    if (level < 0.03) return;
    const spanY = v.h + 60;
    ctx.fillStyle = "#ffffff";
    for (const star of this.stars) {
      const twinkle = 0.72 + 0.28 * Math.sin(clock * star.speed + star.phase);
      const a = star.a * level * twinkle;
      if (a < 0.03) continue;
      const y = mod(star.y * spanY + v.camY * 0.05, spanY) - 30;
      const x = mod(star.x * (v.w + 20) - v.camX * 0.04, v.w + 20) - 10;
      ctx.globalAlpha = a;
      ctx.fillRect(x, y, star.r, star.r);
    }
    ctx.globalAlpha = 1;

    // A meteor every so often, once the sky is dark enough to show one.
    if (level > 0.5 && !v.reduceMotion) {
      const cycle = Math.floor(clock / 7.5);
      const age = clock - cycle * 7.5;
      if (age < 0.7) {
        const rand = rng(cycle * 53 + 5);
        const sx = v.w * (0.15 + rand() * 0.7);
        const sy = v.h * (0.06 + rand() * 0.3);
        const dir = rand() < 0.5 ? -1 : 1;
        const p = age / 0.7;
        const hx = sx + dir * p * 190;
        const hy = sy + p * 90;
        const tail = ctx.createLinearGradient(hx, hy, hx - dir * 76, hy - 36);
        tail.addColorStop(0, `rgba(255,255,255,${0.85 * Math.sin(p * Math.PI) * level})`);
        tail.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = tail;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx - dir * 76, hy - 36);
        ctx.stroke();
      }
    }
  }

  private drawOrb(ctx: CanvasRenderingContext2D, v: BackdropView, orb: Orb, clock: number): void {
    const x = orb.x * v.w - v.camX * 0.03;
    // Keep it clear of the top edge on short screens.
    const y = Math.max(orb.r + 70, v.horizon - orb.y) + v.camY * 0.04;
    if (y - orb.r * 4 > v.h) return;
    const lift = 1 + v.pulse * 0.5;

    const halo = ctx.createRadialGradient(x, y, orb.r * 0.6, x, y, orb.r * 4.2);
    halo.addColorStop(0, rgbCss(orb.glow, Math.min(0.8, 0.42 * lift)));
    halo.addColorStop(0.4, rgbCss(orb.glow, 0.12 * lift));
    halo.addColorStop(1, rgbCss(orb.glow, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(x - orb.r * 4.2, y - orb.r * 4.2, orb.r * 8.4, orb.r * 8.4);

    if (orb.kind === "eclipse") {
      ctx.save();
      ctx.translate(x, y);
      ctx.globalCompositeOperation = "lighter";
      const rays = 12;
      for (let i = 0; i < rays; i++) {
        const angle = (i / rays) * TAU + clock * 0.05;
        const len = orb.r * (1.9 + 0.6 * Math.sin(clock * 0.7 + i * 1.7) + v.flare * 0.8);
        ctx.save();
        ctx.rotate(angle);
        const ray = ctx.createLinearGradient(0, 0, len, 0);
        ray.addColorStop(0, rgbCss(orb.glow, 0.32));
        ray.addColorStop(1, rgbCss(orb.glow, 0));
        ctx.fillStyle = ray;
        ctx.beginPath();
        ctx.moveTo(orb.r * 0.9, -orb.r * 0.16);
        ctx.lineTo(len, 0);
        ctx.lineTo(orb.r * 0.9, orb.r * 0.16);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(0, 0, orb.r, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgbCss(orb.glow, 0.85);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, orb.r + 0.75, 0, TAU);
      ctx.stroke();
      if (v.flare > 0.02) {
        // The diamond ring: a bead of light on the limb when the slab lines up.
        const bx = Math.cos(-0.8) * orb.r;
        const by = Math.sin(-0.8) * orb.r;
        const size = orb.r * (0.5 + v.flare * 0.9);
        const bead = ctx.createRadialGradient(bx, by, 0, bx, by, size);
        bead.addColorStop(0, `rgba(255,255,255,${v.flare})`);
        bead.addColorStop(0.3, rgbCss(orb.glow, 0.6 * v.flare));
        bead.addColorStop(1, rgbCss(orb.glow, 0));
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = bead;
        ctx.fillRect(bx - size, by - size, size * 2, size * 2);
      }
      ctx.restore();
      return;
    }

    ctx.fillStyle = orb.color;
    ctx.beginPath();
    ctx.arc(x, y, orb.r, 0, TAU);
    ctx.fill();
    if (orb.kind === "moon") {
      ctx.fillStyle = "rgba(20,24,60,0.2)";
      for (const [dx, dy, r] of [
        [-0.3, -0.2, 0.22],
        [0.28, 0.24, 0.16],
        [0.1, -0.42, 0.11],
      ] as const) {
        ctx.beginPath();
        ctx.arc(x + dx * orb.r, y + dy * orb.r, r * orb.r, 0, TAU);
        ctx.fill();
      }
    }
  }

  private drawAurora(ctx: CanvasRenderingContext2D, v: BackdropView, clock: number): void {
    const tints: RGB[] = [
      [80, 255, 180],
      [90, 220, 255],
      [176, 124, 255],
    ];
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const step = (v.w + PAD * 2) / 26;
    for (let i = 0; i < tints.length; i++) {
      const tint = tints[i]!;
      const top = v.h * (0.13 + i * 0.065) + v.camY * 0.04;
      const depth = 130 + i * 34;
      const strength = 0.15 + 0.06 * Math.sin(clock * 0.5 + i * 2.1) + v.pulse * 0.2;
      const g = ctx.createLinearGradient(0, top - 30, 0, top + depth + 20);
      g.addColorStop(0, rgbCss(tint, 0));
      g.addColorStop(0.22, rgbCss(tint, strength));
      g.addColorStop(1, rgbCss(tint, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      for (let k = 0; k <= 26; k++) {
        const x = -PAD + k * step;
        const y =
          top +
          Math.sin(x * 0.008 + clock * 0.25 + i * 2) * 26 +
          Math.sin(x * 0.021 - clock * 0.4 + i) * 10;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let k = 26; k >= 0; k--) {
        const x = -PAD + k * step;
        ctx.lineTo(x, top + depth + Math.sin(x * 0.012 + clock * 0.3 + i * 3) * 18);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawClouds(
    ctx: CanvasRenderingContext2D,
    v: BackdropView,
    clock: number,
    near: boolean,
  ): void {
    const alpha = this.theme.cloud.alpha;
    for (const cloud of this.clouds) {
      if (cloud.depth >= 0.34 !== near) continue;
      const cw = CLOUD_W * cloud.scale;
      const ch = CLOUD_H * cloud.scale;
      const y = v.horizon - cloud.alt + v.camY * cloud.depth - ch / 2;
      if (y > v.h || y + ch < 0) continue;
      const span = v.w + cw * 2;
      const x = mod(cloud.x * span + clock * cloud.speed - v.camX * cloud.depth, span) - cw;
      ctx.globalAlpha = alpha * (0.6 + cloud.depth * 0.7);
      ctx.drawImage(this.sprites[cloud.sprite]!, x, y, cw, ch);
    }
    ctx.globalAlpha = 1;
  }

  private drawLayer(
    ctx: CanvasRenderingContext2D,
    v: BackdropView,
    def: LayerDef,
    canvas: HTMLCanvasElement,
    clock: number,
  ): void {
    const base = v.horizon + v.camY * def.depth;
    const top = base - def.height;
    if (top > v.h + PAD) return;
    const shift = v.camX * def.depth - (def.drift ?? 0) * clock;
    const start = -mod(shift, this.tileW);
    for (let x = start - this.tileW; x < v.w + PAD; x += this.tileW) {
      if (x + this.tileW < -PAD) continue;
      ctx.drawImage(
        canvas,
        Math.round(x * 2) / 2,
        Math.round(top * 2) / 2,
        this.tileW,
        def.height + 2,
      );
    }
    if (base < v.h + PAD) {
      ctx.fillStyle = def.bottom;
      ctx.fillRect(-PAD, base, v.w + PAD * 2, v.h - base + PAD);
    }
  }

  private drawWaves(ctx: CanvasRenderingContext2D, v: BackdropView, clock: number): void {
    const bands = [
      { depth: 0.26, rise: 104, color: "#1c5d68", amp: 4, k: 0.018, speed: 0.5 },
      { depth: 0.4, rise: 78, color: "#144a55", amp: 6, k: 0.014, speed: 0.75 },
      { depth: 0.56, rise: 52, color: "#0e3944", amp: 8, k: 0.011, speed: 1 },
      { depth: 0.76, rise: 26, color: "#092a33", amp: 10, k: 0.009, speed: 1.3 },
    ];
    const step = 14;
    for (let i = 0; i < bands.length; i++) {
      const band = bands[i]!;
      const base = v.horizon - band.rise + v.camY * band.depth;
      if (base - 20 > v.h) continue;
      const shift = v.camX * band.depth;
      ctx.beginPath();
      ctx.moveTo(-PAD, v.h + PAD);
      for (let x = -PAD; x <= v.w + PAD + step; x += step) {
        const wx = x + shift;
        const y =
          base +
          Math.sin(wx * band.k + clock * band.speed + i * 1.9) * band.amp +
          Math.sin(wx * band.k * 2.7 - clock * band.speed * 1.4 + i) * band.amp * 0.4;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(v.w + PAD, v.h + PAD);
      ctx.closePath();
      ctx.fillStyle = band.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.stroke();

      if (i === 0 && this.theme.orb) {
        // Sun glitter on the far water.
        const sx = this.theme.orb.x * v.w - v.camX * 0.03;
        ctx.fillStyle = rgbCss(this.theme.orb.glow, 1);
        for (let j = 0; j < 9; j++) {
          const gw = 46 - j * 3 + Math.sin(clock * 2.6 + j * 1.3) * 9;
          ctx.globalAlpha = 0.3 - j * 0.02 + v.pulse * 0.2;
          ctx.fillRect(sx - gw / 2, base + 8 + j * 9, gw, 2);
        }
        ctx.globalAlpha = 1;
      }
    }
  }

  private drawWeather(ctx: CanvasRenderingContext2D, v: BackdropView, front: boolean): void {
    const kind = this.theme.weather;
    const spec = WEATHER[kind];
    const spanX = v.w + 120;
    const spanY = v.h + 120;
    const clock = v.clock;
    ctx.save();
    for (const f of this.flecks) {
      if (f.z >= 1 !== front) continue;
      let x = f.x * spanX + spec.vx * clock * f.z - v.camX * f.z;
      let y = f.y * spanY + spec.vy * clock * f.z + v.camY * f.z * 0.6;
      if (kind === "snow" || kind === "embers" || kind === "ash") {
        x += Math.sin(clock * 0.9 + f.phase) * 16;
      }
      x = mod(x, spanX) - 60;
      y = mod(y, spanY) - 60;
      const size = 1 + f.size * 2.2 * f.z;
      const flicker = 0.6 + 0.4 * Math.sin(clock * (2 + f.size * 4) + f.phase);

      if (kind === "embers") {
        ctx.globalAlpha = (front ? 0.75 : 0.5) * flicker;
        ctx.fillStyle = f.size > 0.5 ? "#ff6a2a" : "#ffc48a";
        ctx.fillRect(x, y, size, size);
      } else if (kind === "snow") {
        ctx.globalAlpha = front ? 0.85 : 0.55;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, size * 0.6, 0, TAU);
        ctx.fill();
      } else if (kind === "rain") {
        ctx.globalAlpha = front ? 0.34 : 0.18;
        ctx.strokeStyle = "#a8c8ff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 2.2 * f.z, y + 18 * f.z);
        ctx.stroke();
      } else if (kind === "gale") {
        if (f.size < 0.34) {
          // A leaf, tumbling as it goes.
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(clock * (5 + f.size * 9) + f.phase);
          ctx.globalAlpha = front ? 0.9 : 0.6;
          ctx.fillStyle = f.phase > 3 ? "#ffcf9a" : "#f29a6b";
          ctx.beginPath();
          ctx.ellipse(0, 0, 4.5 * f.z, 2 * f.z, 0, 0, TAU);
          ctx.fill();
          ctx.restore();
        } else {
          // A gust: a long tapering stroke with a curl at its head.
          const len = (60 + f.size * 80) * f.z;
          const r = 5 * f.z;
          ctx.globalAlpha = (front ? 0.55 : 0.32) * (0.6 + 0.4 * flicker);
          ctx.strokeStyle = "#fff4e6";
          ctx.lineWidth = (1 + f.size * 1.3) * f.z;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x - len, y + 4);
          ctx.quadraticCurveTo(x - len * 0.4, y - 5 * f.z, x, y);
          if (f.size > 0.6) ctx.arc(x, y - r, r, Math.PI / 2, -Math.PI, true);
          ctx.stroke();
        }
      } else if (kind === "dust") {
        ctx.globalAlpha = (front ? 0.5 : 0.3) * flicker;
        ctx.fillStyle = "#ffd9a0";
        ctx.fillRect(x, y, size * 0.8, size * 0.8);
      } else if (kind === "mist") {
        ctx.globalAlpha = (front ? 0.3 : 0.18) * flicker;
        ctx.fillStyle = "#d9fff6";
        ctx.beginPath();
        ctx.arc(x, y, size, 0, TAU);
        ctx.fill();
      } else if (kind === "ash") {
        ctx.globalAlpha = (front ? 0.5 : 0.3) * flicker;
        ctx.fillStyle = f.size > 0.6 ? "#ffd896" : "#8d7c9c";
        ctx.fillRect(x, y, size, size * 0.6);
      } else {
        const a = (front ? 0.9 : 0.55) * Math.max(0, flicker * 1.4 - 0.4);
        ctx.globalAlpha = a;
        ctx.fillStyle = "#fff6d8";
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
