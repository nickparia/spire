import type { ThemeId } from "./themes";

export type RGB = [number, number, number];

export const MIN_W = 16;
export const FORGE_EVERY = 5;
export const FORGE_GROW = 1.14;

export type DropInput = {
  prevX: number;
  prevW: number;
  moverX: number;
  moverW: number;
  tol: number;
  startW: number;
  streak: number;
  /** Width multiplier for a forge. Defaults to FORGE_GROW. */
  forgeGrow?: number;
  /** Perfects in a row that trigger a forge. Defaults to FORGE_EVERY; 0 turns forging off. */
  forgeEvery?: number;
};

export type Scrap = { x: number; w: number };

export type DropResult =
  | { ok: false }
  | {
      ok: true;
      perfect: boolean;
      forged: boolean;
      close: boolean;
      x: number;
      w: number;
      streak: number;
      scrap: Scrap | null;
      points: number;
    };

export function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function shade(c: RGB, amount: number): RGB {
  if (amount >= 0) return mix(c, [255, 255, 255], Math.min(1, amount));
  return mix(c, [20, 14, 10], Math.min(1, -amount));
}

/** Three-stop colour ramp, `t` in 0..1. */
export function ramp(stops: readonly [RGB, RGB, RGB], t: number): RGB {
  const u = clamp01(t);
  if (u < 0.5) return mix(stops[0], stops[1], u / 0.5);
  return mix(stops[1], stops[2], (u - 0.5) / 0.5);
}

export type CourseId = "slide" | "gust" | "beat" | "sway" | "rush" | "breath" | "eclipse" | "split";

export const COURSE_CYCLE: readonly CourseId[] = [
  "gust",
  "beat",
  "sway",
  "rush",
  "breath",
  "eclipse",
  "split",
];

export function courseLabel(id: CourseId): string {
  if (id === "slide") return "Slide";
  if (id === "gust") return "Gust";
  if (id === "beat") return "Beat";
  if (id === "sway") return "Sway";
  if (id === "rush") return "Rush";
  if (id === "breath") return "Breath";
  if (id === "eclipse") return "Eclipse";
  return "Split";
}

export function courseHint(id: CourseId): string {
  if (id === "slide") return "Even pace";
  if (id === "gust") return "The wind carries the fall";
  if (id === "beat") return "Rests, then jumps";
  if (id === "sway") return "The groove walks";
  if (id === "rush") return "Bursts through center";
  if (id === "breath") return "Holds at the walls";
  if (id === "eclipse") return "Tap the flare";
  return "Two halves, two clocks";
}

/**
 * What a run asks of you, floor by floor. Levels and endless both reduce to
 * one of these, so the engine never has to know which mode it is in.
 */
/** A slab that hangs above the stack and falls when released. */
export type Fall = {
  /** How far above its seat the slab hangs, px. */
  hover: number;
  /** How far the wind carries it sideways on the way down, px. 0 is still air. */
  drift: number;
  /** Outline where it will land. On while the idea is new, then taken away. */
  guide: boolean;
};

/** Height a falling slab hangs at: three floors. */
export const HOVER = 84;
const FALL_G = 1800;

/** Seconds a slab takes to fall `hover` px from rest. */
export function fallDuration(hover: number): number {
  return Math.sqrt((2 * Math.max(0, hover)) / FALL_G);
}

/**
 * Share of the fall completed after `t` of `duration` seconds, 0..1. Gravity
 * and a steady wind both act from rest, so height lost and sideways drift
 * follow this same curve and the slab travels a straight slanted line.
 */
export function fallShare(t: number, duration: number): number {
  if (duration <= 0) return 1;
  const k = clamp01(t / duration);
  return k * k;
}

export type Plan = {
  /** Floors to place to finish. 0 means the run never ends. */
  goal: number;
  courseAt: (floors: number) => CourseId;
  /** Whether the slab on this floor falls, and how the wind treats it. */
  fallAt: (floors: number) => Fall | null;
  /** Seconds for the slab to travel one way. */
  periodAt: (floors: number) => number;
  /** Shifts the perfect window: later levels start with a tighter one. */
  difficulty: number;
  /** How fast the Dark climbs the tower, px per second; 0 keeps it away. */
  darkRate: number;
  /** How hard height pushes on the spire: a slow sideways force per metre up. */
  sway: number;
  /** Slabs are rigid bodies: they lean, slide and topple, and rubble can be built on. */
  physics: boolean;
  /**
   * The spire is built down from a ceiling (the Descent): drawn mirrored, the
   * Dark becomes things climbing up from below, and what is cut off falls on them.
   */
  descent?: boolean;
  hazardsAt: (floors: number) => Hazards;
  /** Floors one sky lasts, which paces how its backdrop deepens. */
  span: number;
  themeAt: (floors: number) => ThemeId;
  /** Where on the sky's slab colour ramp this floor sits, 0..1. */
  shadeAt: (floor: number) => number;
  /** The floor count that ends the current stretch, or 0 if nothing does. */
  gateAt: (floors: number) => number;
  /** Whether placing this many floors pauses the run for an upgrade pick. */
  pickAt: (floors: number) => boolean;
};

export type Hazards = { keystones: boolean; motes: boolean; bombs: boolean };

export function courseChanges(plan: Plan, floors: number): boolean {
  return floors > 0 && plan.courseAt(floors) !== plan.courseAt(floors - 1);
}

export function isKeystone(plan: Plan, floors: number): boolean {
  return plan.hazardsAt(floors).keystones && floors > 0 && floors % 8 === 7;
}

export function shouldSpawnMote(plan: Plan, floors: number): boolean {
  if (!plan.hazardsAt(floors).motes || floors < 5) return false;
  if (isKeystone(plan, floors) || courseChanges(plan, floors)) return false;
  return floors % 4 === 1;
}

/** A bomb parks over the groove. You wait it out before the next drop. */
export function shouldSpawnBomb(plan: Plan, floors: number): boolean {
  if (!plan.hazardsAt(floors).bombs || floors < 6) return false;
  if (isKeystone(plan, floors) || courseChanges(plan, floors) || shouldSpawnMote(plan, floors)) {
    return false;
  }
  return floors % 3 === 0;
}

/** Pulses per second. The first 58% of each pulse is motion; the rest is a hold. */
export function beatHz(period: number): number {
  return Math.min(3.4, 1.25 + 0.5 / Math.max(0.35, period));
}

export function beatPhase(clock: number, period: number): number {
  return (((clock * beatHz(period)) % 1) + 1) % 1;
}

/** How fast `u` (-1..1) moves. Each course keeps a different time. */
export function travelRate(
  course: CourseId,
  dir: number,
  wind: number,
  u: number,
  period: number,
  clock: number,
): number {
  let rate = 2 / Math.max(0.2, period);
  if (course === "gust") rate *= dir === wind ? 1.35 : 0.7;
  if (course === "rush") rate *= 0.34 + 1.2 * (1 - Math.min(1, Math.abs(u)));
  if (course === "beat") {
    const phase = beatPhase(clock, period);
    const env = phase < 0.58 ? Math.sin((phase / 0.58) * Math.PI) : 0;
    rate *= 0.05 + 1.85 * env;
  }
  if (course === "breath") {
    const edge = Math.min(1, Math.abs(u));
    rate *= edge > 0.78 ? 0.08 : 0.4 + 0.9 * (1 - edge / 0.78);
  }
  return rate;
}

export function swayOffset(course: CourseId, clock: number, w: number): number {
  if (course !== "sway") return 0;
  return Math.sin(clock * 1.55) * Math.min(34, w * 0.2);
}

/**
 * Perfect window in pixels. Tuned as a shrinking slice of time so late-game
 * speed doesn't make the zone invisible — you still have to meet it.
 */
export function tolerance(speed: number, floors: number, w: number): number {
  const windowSec = Math.max(0.056, 0.098 - floors * 0.0004);
  const px = (Math.max(1, speed) * windowSec) / 2;
  return Math.min(w * 0.42, Math.max(10, px));
}

/**
 * How far the moving slab's centre is from the groove below it. The two can
 * differ in width (a slab shrinks while it is held), so grooves, not edges,
 * are what have to line up.
 */
export function dropOffset(prevX: number, prevW: number, moverX: number, moverW: number): number {
  return moverX + moverW / 2 - (prevX + prevW / 2);
}

/**
 * Width of a held slab after `age` seconds. It keeps its full width through a
 * grace long enough for the first pass, then wastes away, never below half.
 */
export function heldWidth(
  w: number,
  age: number,
  period: number,
  scale = 1,
  extraGrace = 0,
  course: CourseId = "slide",
): number {
  const over = Math.max(0, age - graceFor(period, course) - extraGrace);
  const keep = Math.max(SHRINK_FLOOR, 1 - SHRINK_RATE * scale * over);
  return w * keep;
}

/** Seconds a held slab keeps its full width: enough for the first pass. */
export function graceFor(period: number, course: CourseId = "slide"): number {
  const base = 0.35 + 0.5 * period;
  // Courses that make the slab wait by design get the time their rhythm costs.
  if (course === "breath") return base + 1.6;
  if (course === "beat") return base + 0.5;
  return base;
}

/** How much faster the right half runs than the left when a slab is split. */
export const SPLIT_TEMPO = 1.38;

/**
 * The Dark: it climbs the tower from below, and light pushes it back. How
 * far each kind of drop pushes it down, in px.
 */
export const DARK_PUSH = {
  perfect: 42,
  clean: 12,
  fast: 10,
  keystone: 56,
  forge: 150,
} as const;

/** Where the Dark starts, px below the foundation. */
export const DARK_START = -168;

/**
 * A ghost is the trace of a best run: the second each floor was first
 * reached, index by floor, so trace[0] is 0. Its height at any moment is
 * read back off the trace, with the climb between two floors spread evenly.
 */
export type Ghost = number[];

export function ghostHeight(trace: Ghost, t: number): number {
  if (trace.length === 0) return 0;
  let f = 0;
  while (f + 1 < trace.length && trace[f + 1]! <= t) f++;
  if (f + 1 >= trace.length) return f;
  const a = trace[f]!;
  const b = trace[f + 1]!;
  return b > a ? f + (t - a) / (b - a) : f + 1;
}

/**
 * Whether a run's trace should replace the ghost: a summit beats any ghost
 * that never summited and any slower summit; short of the summit, only a
 * higher climb beats a ghost that also fell short.
 */
export function ghostBetter(old: Ghost | undefined, trace: Ghost, goal: number): boolean {
  if (trace.length < 2) return false;
  const summited = trace.length > goal;
  if (!old || old.length < 2) return true;
  const oldSummited = old.length > goal;
  if (summited && !oldSummited) return true;
  if (summited && oldSummited) return trace[goal]! < old[goal]!;
  if (!oldSummited) return trace.length > old.length;
  return false;
}

export const SHRINK_RATE = 0.07;
export const SHRINK_FLOOR = 0.5;
/** A clean drop inside the grace grows the slab by this much, up to its start. */
export const QUICK_GROW = 1.03;

export function resolveDrop(input: DropInput): DropResult {
  const { prevX, prevW, moverX, moverW, tol, startW, streak } = input;
  const dx = dropOffset(prevX, prevW, moverX, moverW);

  if (Math.abs(dx) <= tol) {
    const nextStreak = streak + 1;
    const every = input.forgeEvery ?? FORGE_EVERY;
    const forged = every > 0 && nextStreak % every === 0;
    // A perfect keeps the slab you dropped, centred on the groove: a slab that
    // wasted away while you waited stays narrow.
    let w = Math.min(prevW, moverW);
    let x = prevX + (prevW - w) / 2;
    if (forged) {
      const grown = Math.min(startW, w * (input.forgeGrow ?? FORGE_GROW));
      if (grown > w + 0.4) {
        w = grown;
        x = prevX + prevW / 2 - w / 2;
      }
    }
    const points = 10 + 10 * nextStreak + (forged ? 40 : 0);
    return {
      ok: true,
      perfect: true,
      forged,
      close: false,
      x,
      w,
      streak: nextStreak,
      scrap: null,
      points,
    };
  }

  const left = Math.max(moverX, prevX);
  const right = Math.min(moverX + moverW, prevX + prevW);
  const overlap = right - left;
  if (overlap < MIN_W) return { ok: false };

  let scrap: Scrap | null = null;
  if (moverX < prevX - 0.01) {
    scrap = { x: moverX, w: prevX - moverX };
  } else if (moverX + moverW > prevX + prevW + 0.01) {
    scrap = { x: prevX + prevW, w: moverX + moverW - (prevX + prevW) };
  }

  const close = Math.abs(dx) <= tol * 2.15;
  return {
    ok: true,
    perfect: false,
    forged: false,
    close,
    x: left,
    w: overlap,
    streak: 0,
    scrap,
    points: 10,
  };
}

/**
 * How much of the slab landed, 0..1. Anything inside the perfect window counts
 * as dead centre, so accuracy and the PERFECT call never disagree.
 */
export function dropAccuracy(dx: number, moverW: number, tol: number): number {
  const off = Math.abs(dx);
  if (off <= tol) return 1;
  return clamp01(1 - off / Math.max(1, moverW));
}

/**
 * Musical tension, 0..1, from how much of the slab is left. Full width is
 * calm; a sliver is the top of the scale. Curved so the first cuts register.
 */
export function tensionFor(w: number, startW: number): number {
  const span = Math.max(1, startW - MIN_W);
  return Math.pow(clamp01(1 - (w - MIN_W) / span), 0.8);
}

export type Goals = { clear: boolean; precise: boolean; swift: boolean };

/** Stars for a finished run: one for the summit, one for precision, one for pace. */
export function goalsFor(
  time: number,
  accuracy: number,
  parTime: number,
  parAccuracy: number,
): Goals {
  return { clear: true, precise: accuracy >= parAccuracy, swift: time <= parTime };
}

export function starCount(goals: Goals): number {
  return Number(goals.clear) + Number(goals.precise) + Number(goals.swift);
}

/** `83.42` → `1:23.42`. Run clocks are short, so hundredths matter. */
export function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds * 100 + 1e-6));
  const cs = total % 100;
  const s = Math.floor(total / 100) % 60;
  const m = Math.floor(total / 6000);
  return `${m}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

export function formatPercent(ratio: number): string {
  return `${Math.floor(clamp01(ratio) * 100 + 1e-6)}%`;
}
