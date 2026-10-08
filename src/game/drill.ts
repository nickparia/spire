/**
 * The Descent: the Spire as a drill boring down through the earth. Its head
 * swings back and forth like a pendulum; the targets around it (seams that
 * take you deeper, veins of ore that feed the light) each have a groove, a
 * narrow window of headings that counts as true. One tap fires the drill
 * along its heading and it bores to whatever it was pointing at.
 *
 * The Dark follows as oil, pouring down the tunnel you have dug. Careless
 * drilling (firing at nothing) shakes the earth and the oil runs faster.
 * World units are px, x across from the centre, y down from the surface.
 */

export type DrillTargetKind = "seam" | "ore";

export type DrillTarget = {
  kind: DrillTargetKind;
  x: number;
  y: number;
  /** Its size: the wider it is, the wider its groove. */
  r: number;
  /** Seconds since it appeared, for its entrance and its pulse. */
  age: number;
};

export type DrillFire = {
  /** What it hit: a target's kind, or nothing ("miss"). */
  kind: DrillTargetKind | "miss";
  perfect: boolean;
  /** Where the bore ends, in world px. */
  x: number;
  y: number;
};

export type DrillStep = "caught" | "through" | null;

/** Px of depth that count as one floor on the HUD. */
export const DRILL_FLOOR = 36;

/** Tuning for one depth. */
export type DrillTuning = {
  /** Floors down to break through. */
  floors: number;
  /** The pendulum's half-swing, radians, and seconds per full swing. */
  swing: number;
  period: number;
  /** The oil's pace, px per second, and how much faster per second of the run. */
  oil: number;
  oilAccel: number;
};

const SEAM_R = 30;
/** How far below the head a seam opens, px, and the spread. */
const SEAM_NEAR = 62;
const SEAM_SPREAD = 36;
const ORE_R = 20;
/** Share of a groove that counts as perfect. */
const PERFECT = 0.45;
/** Seconds a bore takes. */
const BORE_TIME = 0.28;
/** Px a shot at nothing still bores. */
const MISS_BORE = 30;
/** The extra flow a leak lets in: a near miss's, and a wild shot's. */
const LEAK_MIN = 0.08;
const LEAK_MAX = 0.3;
/** Light an ore gives, and how far (px of tunnel) it drives the oil back. */
const ORE_LIGHT = 0.35;
const ORE_PUSH = 90;
/** A perfect seam's push on the oil, px. */
const SEAM_PUSH = 30;
/** Light fades this much per second without ore. */
const LIGHT_FADE = 0.03;

export class Drill {
  readonly tune: DrillTuning;
  /** The tunnel so far: the head's path from the surface. */
  path: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  /** Length of the tunnel, px. */
  length = 0;
  /** How far down the tunnel the oil has run, px. */
  oil = -420;
  /**
   * Leaks: where a careless shot broke into the oil-soaked rock. Each lets
   * more of the Dark in, and more Dark runs faster. Size grows with how far
   * off the shot was.
   */
  leaks: { x: number; y: number; size: number; age: number }[] = [];
  /** How strong the light is, 0..1. */
  light = 0.6;
  /** Seconds of play. */
  time = 0;
  /** Pendulum phase. */
  private phase = 0;
  /** The heading now: 0 straight down, positive toward the right. */
  heading = 0;
  targets: DrillTarget[] = [];
  /** A bore under way: from, to, and how far along. */
  bore: { fx: number; fy: number; tx: number; ty: number; t: number } | null = null;
  /** Camera centre, px. */
  camX = 0;
  camY = 0;
  /** A shudder after each blow, 0..1. */
  shake = 0;

  constructor(tune: DrillTuning) {
    this.tune = tune;
    this.refill();
  }

  get head(): { x: number; y: number } {
    return this.path[this.path.length - 1]!;
  }

  /** Floors of depth reached. */
  get floors(): number {
    return Math.max(0, Math.floor(this.head.y / DRILL_FLOOR));
  }

  /** Px of tunnel between the oil and the head. */
  get gap(): number {
    return this.length - this.oil;
  }

  /** How much Dark is pouring in: 1, plus every leak opened. */
  get volume(): number {
    return 1 + this.leaks.reduce((n, l) => n + l.size, 0);
  }

  /** How far off the nearest target the heading is, in grooves (0 = dead on). */
  private missBy(): number {
    const h = this.head;
    let best = Infinity;
    for (const t of this.targets) {
      const dist = Math.hypot(t.x - h.x, t.y - h.y);
      const off = Math.abs(angleDiff(Math.atan2(t.x - h.x, t.y - h.y), this.heading));
      best = Math.min(best, off / Math.atan2(t.r, dist));
    }
    return Number.isFinite(best) ? best : 4;
  }

  /** The target the drill would hit if fired now, and whether dead on. */
  aimed(): { target: DrillTarget; perfect: boolean } | null {
    const h = this.head;
    let best: { target: DrillTarget; perfect: boolean; off: number } | null = null;
    for (const t of this.targets) {
      const dx = t.x - h.x;
      const dy = t.y - h.y;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dx, dy);
      const window = Math.atan2(t.r, dist);
      const off = Math.abs(angleDiff(angle, this.heading));
      if (off <= window && (!best || off / window < best.off)) {
        best = { target: t, perfect: off <= window * PERFECT, off: off / window };
      }
    }
    return best ? { target: best.target, perfect: best.perfect } : null;
  }

  /** One tap: bore along the heading, to the target if there is one. */
  fire(): DrillFire | null {
    if (this.bore) return null;
    const h = this.head;
    const hit = this.aimed();
    let tx: number;
    let ty: number;
    let kind: DrillFire["kind"];
    if (hit) {
      tx = hit.target.x;
      ty = hit.target.y;
      kind = hit.target.kind;
      this.targets = this.targets.filter((t) => t !== hit.target);
      if (kind === "ore") {
        this.light = Math.min(1, this.light + ORE_LIGHT * (hit.perfect ? 1.3 : 1));
        this.oil -= ORE_PUSH * (hit.perfect ? 1.3 : 1);
      } else if (hit.perfect) this.oil -= SEAM_PUSH;
    } else {
      tx = h.x + Math.sin(this.heading) * MISS_BORE;
      ty = Math.max(4, h.y + Math.cos(this.heading) * MISS_BORE);
      kind = "miss";
      // The further off any target, the bigger the hole it tears.
      const size = LEAK_MIN + (LEAK_MAX - LEAK_MIN) * Math.min(1, this.missBy() / 4);
      this.leaks.push({ x: tx, y: ty, size, age: 0 });
    }
    this.bore = { fx: h.x, fy: h.y, tx, ty, t: 0 };
    this.shake = 1;
    return { kind, perfect: !!hit?.perfect, x: tx, y: ty };
  }

  step(dt: number, viewW: number, viewH: number): DrillStep {
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 4);
    this.light = Math.max(0.15, this.light - LIGHT_FADE * dt);
    for (const t of this.targets) t.age += dt;
    for (const l of this.leaks) l.age += dt;
    // The pendulum: slow at the ends of its swing, quick through the middle.
    this.phase += (dt / this.tune.period) * Math.PI * 2;
    this.heading = Math.sin(this.phase) * this.tune.swing;
    if (this.bore) {
      const b = this.bore;
      b.t = Math.min(1, b.t + dt / BORE_TIME);
      const e = 1 - (1 - b.t) ** 3;
      const x = b.fx + (b.tx - b.fx) * e;
      const y = b.fy + (b.ty - b.fy) * e;
      if (b.t >= 1) {
        const prev = this.path[this.path.length - 1]!;
        this.length += Math.hypot(x - prev.x, y - prev.y);
        this.path.push({ x, y });
        this.bore = null;
        this.refill();
      }
    }
    // The oil pours down the tunnel, faster the more of it the leaks let in.
    const speed = (this.tune.oil + this.tune.oilAccel * this.time) * this.volume;
    this.oil += speed * dt;
    // The camera keeps the head a little above the middle, with room below.
    const h = this.boreHead();
    const k = 1 - Math.exp(-4 * dt);
    this.camX += (h.x * 0.7 - this.camX) * k;
    this.camY += (h.y + viewH * 0.08 - this.camY) * k;
    void viewW;
    if (this.head.y >= this.tune.floors * DRILL_FLOOR && !this.bore) return "through";
    if (this.gap <= 0) return "caught";
    return null;
  }

  /** Where the head is drawn: partway along a bore that's under way. */
  boreHead(): { x: number; y: number } {
    const b = this.bore;
    if (!b) return this.head;
    const e = 1 - (1 - b.t) ** 3;
    return { x: b.fx + (b.tx - b.fx) * e, y: b.fy + (b.ty - b.fy) * e };
  }

  /** World to screen, for a view of the given size. */
  toScreen(x: number, y: number, viewW: number, viewH: number): { x: number; y: number } {
    return { x: viewW / 2 + (x - this.camX), y: viewH * 0.42 + (y - this.camY) };
  }

  /**
   * Keeps the head offered a choice: always a seam below to go deeper, and
   * ore off to the sides, all within the swing.
   */
  private refill(): void {
    const h = this.head;
    // Drop targets left behind above.
    this.targets = this.targets.filter((t) => t.y > h.y - 20);
    const within = (a: number) =>
      Math.max(-this.tune.swing * 0.9, Math.min(this.tune.swing * 0.9, a));
    const place = (kind: DrillTargetKind, angle: number, dist: number): void => {
      const a = within(angle);
      this.targets.push({
        kind,
        x: h.x + Math.sin(a) * dist,
        y: h.y + Math.cos(a) * dist,
        r: kind === "seam" ? SEAM_R : ORE_R,
        age: 0,
      });
    };
    if (!this.targets.some((t) => t.kind === "seam")) {
      place("seam", (Math.random() - 0.5) * 0.9, SEAM_NEAR + Math.random() * SEAM_SPREAD);
    }
    while (this.targets.filter((t) => t.kind === "ore").length < 2) {
      const side = this.targets.some((t) => t.kind === "ore" && t.x < h.x) ? 1 : -1;
      place("ore", side * (1.0 + Math.random() * 0.5), 75 + Math.random() * 40);
    }
  }
}

/** The signed difference between two angles, in -π..π. */
function angleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Draws the run: the earth in cross-section, the tunnel, the oil in it,
 * the targets, and the drill head with its aim.
 */
export function drawDrill(
  ctx: CanvasRenderingContext2D,
  d: Drill,
  w: number,
  h: number,
  clock: number,
  rock: HTMLImageElement | null,
  /** The painted drill head's spin, frames side by side; the drawn head stands in without it. */
  head: HTMLImageElement | null = null,
  /** The painted oil (a playing video, or its still), for the Dark in the tunnel. */
  oil: CanvasImageSource | null = null,
  /** The painted machine on the surface. */
  rig: HTMLImageElement | null = null,
): void {
  const at = (x: number, y: number) => d.toScreen(x, y, w, h);
  const shake = d.shake * 2.5 * Math.sin(clock * 70);
  ctx.save();
  ctx.translate(0, shake);
  // The earth.
  const surface = at(0, 0).y;
  ctx.fillStyle = "rgb(10,7,9)";
  ctx.fillRect(-40, -40, w + 80, Math.max(0, surface + 40));
  let earth: string | CanvasPattern = "rgb(44,32,26)";
  if (rock && rock.complete && rock.naturalWidth > 0) {
    const p = ctx.createPattern(rock, "repeat");
    if (p) {
      const o = at(0, 0);
      p.setTransform(new DOMMatrix().translate(o.x, o.y).scale(240 / rock.naturalWidth));
      earth = p;
    }
  }
  ctx.fillStyle = earth;
  ctx.fillRect(-40, surface, w + 80, h - surface + 80);
  // Darker away from the light around the head.
  const hd = at(d.boreHead().x, d.boreHead().y);
  const reach = 90 + d.light * 170;
  const dark = ctx.createRadialGradient(hd.x, hd.y, reach * 0.35, hd.x, hd.y, reach * 2.2);
  dark.addColorStop(0, "rgba(0,0,0,0)");
  dark.addColorStop(1, "rgba(0,0,0,0.78)");
  ctx.fillStyle = dark;
  ctx.fillRect(-40, -40, w + 80, h + 80);

  // The tunnel.
  const pts = d.path.map((p) => at(p.x, p.y));
  pts.push(hd);
  const line = (width: number, style: string): void => {
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y - 30) : ctx.lineTo(p.x, p.y)));
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = width;
    ctx.strokeStyle = style;
    ctx.stroke();
  };
  line(46, "rgba(120,90,70,0.55)");
  line(40, "rgb(14,9,9)");

  // The machine's body, run down the tunnel behind the head: a ribbed brass
  // spine, with mechanical tendrils driven into the walls as it went.
  drawSpine(ctx, pts, clock);
  drawTendrils(ctx, d, at, clock);
  // The machine itself, squatting on the surface over the hole.
  if (rig && rig.complete && rig.naturalWidth > 0) {
    const s0 = at(0, 0);
    const rw = Math.min(w * 0.95, 360);
    const rh = rw * (rig.naturalHeight / rig.naturalWidth);
    ctx.drawImage(rig, s0.x - rw / 2, s0.y - rh * RIG_BASE, rw, rh);
  }

  // The oil, while it's still above the view: it drips in from the top edge,
  // heavier as it nears, so you always know it's coming.
  {
    const front = alongPath(
      d.path.map((p) => at(p.x, p.y)),
      d.oil + 30,
    ).pop();
    const above = front ? front.y < 0 : true;
    if (above) {
      const near = Math.max(0, Math.min(1, 1 - d.gap / 700));
      const h = 18 + near * 70;
      const g = ctx.createLinearGradient(0, -shake, 0, h - shake);
      g.addColorStop(0, "rgba(6,3,12,0.95)");
      g.addColorStop(1, "rgba(6,3,12,0)");
      ctx.fillStyle = g;
      ctx.fillRect(-40, -shake - 2, w + 80, h);
      ctx.fillStyle = "rgba(8,4,14,0.92)";
      for (let i = 0; i < 9; i++) {
        const x = ((i + 0.5) / 9) * w + Math.sin(i * 7.1) * 18;
        const len = (10 + near * 46) * (0.6 + 0.4 * Math.sin(clock * 1.4 + i * 2.3));
        ctx.beginPath();
        ctx.ellipse(x, -shake + len * 0.5, 3 + near * 3, len * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // The leaks: black ooze welling out of the rock where careless shots broke in.
  for (const l of d.leaks) {
    const s = at(l.x, l.y);
    const grow = Math.min(1, l.age / 0.6);
    const r = (8 + l.size * 26) * grow;
    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 1.6);
    g.addColorStop(0, "rgba(6,3,10,0.95)");
    g.addColorStop(0.6, "rgba(10,5,18,0.7)");
    g.addColorStop(1, "rgba(10,5,18,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r * 1.6, 0, Math.PI * 2);
    ctx.fill();
    // Runs of it trickling down from the hole.
    ctx.strokeStyle = "rgba(8,4,14,0.9)";
    ctx.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      const len = r * (1.2 + i * 0.5) * (0.7 + 0.3 * Math.sin(clock * 1.3 + i + l.x));
      ctx.lineWidth = 3 - i * 0.6;
      ctx.beginPath();
      ctx.moveTo(s.x + (i - 1) * r * 0.4, s.y);
      ctx.lineTo(s.x + (i - 1) * r * 0.5, s.y + len);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(140,90,220,${0.2 + 0.1 * Math.sin(clock * 2 + l.y)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
  }

  // The oil, as far down the tunnel as it has run: the painted oil, seen
  // through the shape of the tunnel it fills (a chain of discs along its run).
  const oilPts = alongPath(pts, d.oil + 30);
  if (oilPts.length > 1) {
    const r = Math.min(23, 17 + d.volume * 2);
    const shape = new Path2D();
    const first = oilPts[0]!;
    shape.rect(first.x - r, first.y - 80, r * 2, 80);
    for (let k = 1; k < oilPts.length; k++) {
      const a = oilPts[k - 1]!;
      const b = oilPts[k]!;
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const n = Math.max(1, Math.ceil(len / 6));
      for (let q = 0; q <= n; q++) {
        const t = q / n;
        const cx = a.x + (b.x - a.x) * t;
        const cy = a.y + (b.y - a.y) * t;
        shape.moveTo(cx + r, cy);
        shape.arc(cx, cy, r, 0, Math.PI * 2);
      }
    }
    const front = oilPts[oilPts.length - 1]!;
    shape.moveTo(front.x + r + 4, front.y);
    shape.arc(front.x, front.y, r + 4 + Math.sin(clock * 5) * 2, 0, Math.PI * 2);
    ctx.save();
    ctx.clip(shape);
    if (oil) {
      // The painted oil, pouring: it scrolls down so it flows.
      const ow = w + 80;
      const oh = ow * 1.78;
      const flow = (clock * 40) % oh;
      ctx.drawImage(oil, -40, -40 + flow - oh, ow, oh);
      ctx.drawImage(oil, -40, -40 + flow, ow, oh);
    } else {
      ctx.fillStyle = "rgb(8,5,14)";
      ctx.fillRect(-40, -40, w + 80, h + 80);
    }
    ctx.restore();
  }

  // The targets, lit when the aim is in their groove.
  const aim = d.bore ? null : d.aimed();
  for (const t of d.targets) {
    const s = at(t.x, t.y);
    const on = aim?.target === t;
    const grow = Math.min(1, t.age / 0.35);
    if (t.kind === "seam") drawSeam(ctx, s.x, s.y, t.r * grow, on, clock);
    else drawOre(ctx, s.x, s.y, t.r * grow, on, clock);
    // What it does, under it: plain words, brighter when it's the one in your sights.
    ctx.save();
    ctx.globalAlpha = (on ? 1 : 0.62) * grow;
    ctx.font = '800 10px "Nunito Variable", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.75)";
    const label = t.kind === "seam" ? "SEAM ▾ deeper" : "ORE ✦ light, oil back";
    ctx.strokeText(label, s.x, s.y + t.r + 6);
    ctx.fillStyle = t.kind === "seam" ? "rgb(255,190,120)" : "rgb(255,226,140)";
    ctx.fillText(label, s.x, s.y + t.r + 6);
    ctx.restore();
  }

  // In a groove: the tunnel you'd cut, ghosted in, and a ring on the target.
  if (aim && !d.bore) {
    const from = hd;
    const to = at(aim.target.x, aim.target.y);
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = 40;
    ctx.strokeStyle = `rgba(255,200,140,${aim.perfect ? 0.16 : 0.1})`;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = aim.perfect ? "rgba(255,236,190,0.95)" : "rgba(255,200,140,0.7)";
    ctx.beginPath();
    ctx.arc(to.x, to.y, aim.target.r + 8 + Math.sin(clock * 8) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // The aim: a beam of light along the heading, brighter in a groove.
  if (!d.bore) {
    const len = 175;
    const ex = hd.x + Math.sin(d.heading) * len;
    const ey = hd.y + Math.cos(d.heading) * len;
    const g = ctx.createLinearGradient(hd.x, hd.y, ex, ey);
    const a = aim ? (aim.perfect ? 0.85 : 0.6) : 0.28;
    g.addColorStop(0, `rgba(255,214,150,${a})`);
    g.addColorStop(1, "rgba(255,214,150,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = aim ? 3 : 2;
    ctx.setLineDash(aim ? [] : [6, 6]);
    ctx.beginPath();
    ctx.moveTo(hd.x, hd.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // The drill head: a bronze crown of teeth, spinning, pointing along its heading.
  const heading = d.bore ? Math.atan2(d.bore.tx - d.bore.fx, d.bore.ty - d.bore.fy) : d.heading;
  if (head && head.complete && head.naturalWidth > 0) {
    drawPaintedHead(ctx, head, hd.x, hd.y, heading, clock, d.bore !== null);
  } else drawHead(ctx, hd.x, hd.y, heading, clock, d.bore !== null);
  ctx.restore();
}

/** Where the machine's base sits in its painting, as a share of its height. */
const RIG_BASE = 0.975;

/** The spine: a ribbed brass trunk following the tunnel down to the head. */
function drawSpine(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  clock: number,
): void {
  if (pts.length < 2) return;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const trace = (): void => {
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y - 20) : ctx.lineTo(p.x, p.y)));
  };
  trace();
  ctx.lineWidth = 18;
  ctx.strokeStyle = "rgb(46,30,18)";
  ctx.stroke();
  trace();
  ctx.lineWidth = 12;
  ctx.strokeStyle = "rgb(120,82,40)";
  ctx.stroke();
  // Its ribs, rolling down it as the machine feeds the drill.
  trace();
  ctx.lineWidth = 14;
  ctx.setLineDash([3, 9]);
  ctx.lineDashOffset = -clock * 30;
  ctx.strokeStyle = "rgb(210,160,80)";
  ctx.stroke();
  ctx.setLineDash([]);
  // Violet light pulsing down its core.
  trace();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 40]);
  ctx.lineDashOffset = -clock * 120;
  ctx.strokeStyle = "rgba(170,110,255,0.7)";
  ctx.stroke();
  ctx.restore();
}

/**
 * Tendrils: at each bend of the tunnel the machine has driven jointed
 * mechanical arms out into the rock either side, gripping; the newest one is
 * still reaching.
 */
function drawTendrils(
  ctx: CanvasRenderingContext2D,
  d: Drill,
  at: (x: number, y: number) => { x: number; y: number },
  clock: number,
): void {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 1; i < d.path.length; i++) {
    const a = d.path[i - 1]!;
    const b = d.path[i]!;
    const p = at(b.x, b.y);
    const dir = Math.atan2(b.y - a.y, b.x - a.x);
    const newest = i === d.path.length - 1;
    const reach = newest ? Math.min(1, (d.time % 9999) * 0 + 1) : 1;
    for (const side of [-1, 1]) {
      const seed = i * 2.17 + side;
      const out = dir + side * (Math.PI / 2) + Math.sin(seed) * 0.4;
      const len = (34 + Math.abs(Math.sin(seed * 3)) * 22) * reach;
      const sway = Math.sin(clock * 1.3 + seed) * 0.06;
      const j1 = {
        x: p.x + Math.cos(out + sway) * len * 0.55,
        y: p.y + Math.sin(out + sway) * len * 0.55,
      };
      const j2 = {
        x: j1.x + Math.cos(out + 0.5 * side + sway) * len * 0.5,
        y: j1.y + Math.sin(out + 0.5 * side + sway) * len * 0.5,
      };
      ctx.strokeStyle = "rgb(40,26,16)";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(j1.x, j1.y);
      ctx.lineTo(j2.x, j2.y);
      ctx.stroke();
      ctx.strokeStyle = "rgb(150,104,52)";
      ctx.lineWidth = 4;
      ctx.stroke();
      // The joint and the claw bitten into the stone.
      ctx.fillStyle = "rgb(190,140,70)";
      ctx.beginPath();
      ctx.arc(j1.x, j1.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(170,110,255,0.8)";
      ctx.beginPath();
      ctx.arc(j2.x, j2.y, 2.2 + Math.sin(clock * 3 + seed) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Points along a polyline from its start, out to `dist` px. */
function alongPath(pts: { x: number; y: number }[], dist: number): { x: number; y: number }[] {
  if (dist <= 0 || pts.length === 0) return [];
  const out = [pts[0]!];
  let left = dist;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (seg >= left) {
      const t = seg > 0 ? left / seg : 0;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      return out;
    }
    out.push(b);
    left -= seg;
  }
  return out;
}

/**
 * A seam: a crack in the rock with molten light inside, the way down. It's
 * drawn as a split in the stone (a dark jagged gap with light in its depths)
 * so it reads as something a blow would burst open.
 */
function drawSeam(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  on: boolean,
  clock: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2);
  glow.addColorStop(0, `rgba(255,140,50,${on ? 0.5 : 0.28})`);
  glow.addColorStop(1, "rgba(255,140,50,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(-r * 2.2, -r * 2.2, r * 4.4, r * 4.4);
  // The split: a jagged lens of dark, wider in the middle.
  const half = r * 1.35;
  const open = on ? 1.25 : 1;
  const edge = (side: number) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const px = (t - 0.5) * half * 2;
      const width = Math.sin(Math.PI * t) * r * 0.32 * open;
      const jag = Math.sin(t * 31 + side * 2) * r * 0.08;
      pts.push([px, side * (width + jag)]);
    }
    return pts;
  };
  const top = edge(-1);
  const bot = edge(1).reverse();
  ctx.beginPath();
  [...top, ...bot].forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.closePath();
  const inside = ctx.createLinearGradient(0, -r * 0.4, 0, r * 0.4);
  inside.addColorStop(0, "rgb(20,8,4)");
  inside.addColorStop(0.5, `rgb(${on ? 255 : 230},${on ? 170 : 120},${on ? 80 : 50})`);
  inside.addColorStop(1, "rgb(20,8,4)");
  ctx.fillStyle = inside;
  ctx.fill();
  ctx.strokeStyle = "rgba(10,5,3,0.9)";
  ctx.lineWidth = 2;
  ctx.stroke();
  // Hairline cracks running off its ends.
  ctx.strokeStyle = `rgba(255,170,90,${on ? 0.8 : 0.45})`;
  ctx.lineWidth = 1;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * half, 0);
    ctx.lineTo(s * (half + r * 0.5), r * 0.25 * Math.sin(clock + s));
    ctx.lineTo(s * (half + r * 0.9), -r * 0.15);
    ctx.stroke();
  }
  ctx.restore();
}

/** Ore: a cluster of glowing crystals that feeds the light. */
function drawOre(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  on: boolean,
  clock: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  const pulse = 0.75 + 0.25 * Math.sin(clock * 3 + x);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.2);
  glow.addColorStop(0, `rgba(255,214,110,${(on ? 0.6 : 0.3) * pulse})`);
  glow.addColorStop(1, "rgba(255,214,110,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(-r * 2.4, -r * 2.4, r * 4.8, r * 4.8);
  ctx.fillStyle = on ? "rgb(255,236,170)" : "rgb(240,190,90)";
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4;
    const cx = Math.cos(a) * r * 0.45;
    const cy = Math.sin(a) * r * 0.45;
    const s = r * (0.28 + (i % 2) * 0.1);
    ctx.beginPath();
    ctx.moveTo(cx, cy - s);
    ctx.lineTo(cx + s * 0.55, cy);
    ctx.lineTo(cx, cy + s);
    ctx.lineTo(cx - s * 0.55, cy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Frames in the painted head's spin, and its height on screen, px. */
export const HEAD_FRAMES = 24;
const HEAD_H = 120;
/** Where the drill's tip is in its painting, as a share of its height from the top. */
const HEAD_TIP = 0.96;

/**
 * The painted drill head, its tip on the end of the tunnel and its body (with
 * the cables trailing) behind, turned to its heading; it spins faster boring.
 */
function drawPaintedHead(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  x: number,
  y: number,
  heading: number,
  clock: number,
  boring: boolean,
): void {
  const cw = sheet.naturalWidth / HEAD_FRAMES;
  const ch = sheet.naturalHeight;
  const frame = Math.floor(clock * (boring ? 34 : 14)) % HEAD_FRAMES;
  const h = HEAD_H;
  const w = h * (cw / ch);
  ctx.save();
  ctx.translate(x, y);
  // The painting points down the screen, as does a heading of 0; the aim runs
  // along (sin h, cos h), which a canvas turn of -h gives its "down".
  ctx.rotate(-heading);
  // A glow of its own violet light around it.
  const glow = ctx.createRadialGradient(0, -h * 0.45, 0, 0, -h * 0.45, h * 0.8);
  glow.addColorStop(0, "rgba(150,90,230,0.22)");
  glow.addColorStop(1, "rgba(150,90,230,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(-h, -h * 1.3, h * 2, h * 1.6);
  ctx.drawImage(sheet, frame * cw, 0, cw, ch, -w / 2, -h * HEAD_TIP, w, h);
  ctx.restore();
}

/** The head: bronze, its teeth turning, pointed along its heading. */
function drawHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  heading: number,
  clock: number,
  boring: boolean,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-heading);
  // The body behind, the cutting cone in front (pointing down the screen at heading 0).
  ctx.fillStyle = "rgb(70,46,26)";
  ctx.fillRect(-11, -24, 22, 22);
  ctx.strokeStyle = "rgb(190,130,60)";
  ctx.lineWidth = 2;
  ctx.strokeRect(-11, -24, 22, 22);
  const spin = clock * (boring ? 30 : 9);
  ctx.fillStyle = "rgb(150,100,48)";
  ctx.beginPath();
  ctx.moveTo(-13, -2);
  ctx.lineTo(13, -2);
  ctx.lineTo(0, 22);
  ctx.closePath();
  ctx.fill();
  // The spiral flutes, moving.
  ctx.strokeStyle = "rgba(255,210,140,0.8)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const o = ((spin / 6 + i / 3) % 1) * 22;
    const half = 13 * (1 - o / 22);
    ctx.beginPath();
    ctx.moveTo(-half, -2 + o);
    ctx.lineTo(half, -2 + o + 3);
    ctx.stroke();
  }
  ctx.restore();
}
