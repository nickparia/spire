export type RGB = [number, number, number];

export const MIN_W = 16;
export const FORGE_EVERY = 5;
export const FORGE_GROW = 1.14;

const CLAY: RGB = [176, 78, 52];
const EMBER: RGB = [255, 77, 26];
const BONE: RGB = [246, 241, 232];

export type DropInput = {
  prevX: number;
  prevW: number;
  moverX: number;
  moverW: number;
  tol: number;
  startW: number;
  streak: number;
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

export function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function shade(c: RGB, amount: number): RGB {
  if (amount >= 0) return mix(c, [255, 255, 255], Math.min(1, amount));
  return mix(c, [20, 14, 10], Math.min(1, -amount));
}

export function slabRgb(floor: number): RGB {
  const t = 1 - Math.exp(-Math.max(0, floor) / 36);
  if (t < 0.5) return mix(CLAY, EMBER, t / 0.5);
  return mix(EMBER, BONE, ((t - 0.5) / 0.5) * 0.82);
}

export type CourseId = "slide" | "gust" | "beat" | "sway" | "rush" | "breath" | "eclipse";

const COURSE_CYCLE: CourseId[] = ["gust", "beat", "sway", "rush", "breath", "eclipse"];
const COURSE_SPAN = 5;

/** First flights are plain. Then the sky changes every five floors. */
export function courseFor(floors: number): CourseId {
  if (floors < 4) return "slide";
  return COURSE_CYCLE[Math.floor((floors - 4) / COURSE_SPAN) % COURSE_CYCLE.length]!;
}

export function courseChanges(floors: number): boolean {
  return floors >= 4 && (floors - 4) % COURSE_SPAN === 0;
}

export function courseLabel(id: CourseId): string {
  if (id === "slide") return "Slide";
  if (id === "gust") return "Gust";
  if (id === "beat") return "Beat";
  if (id === "sway") return "Sway";
  if (id === "rush") return "Rush";
  if (id === "breath") return "Breath";
  return "Eclipse";
}

export function courseHint(id: CourseId): string {
  if (id === "slide") return "Even pace";
  if (id === "gust") return "Fast with the wind";
  if (id === "beat") return "Rests, then jumps";
  if (id === "sway") return "The groove walks";
  if (id === "rush") return "Bursts through center";
  if (id === "breath") return "Holds at the walls";
  return "Tap the flare";
}

export function isKeystone(floors: number): boolean {
  return floors > 0 && floors % 8 === 7;
}

export function shouldSpawnMote(floors: number): boolean {
  if (floors < 5 || isKeystone(floors) || courseChanges(floors)) return false;
  return floors % 4 === 1;
}

/** A bomb parks over the groove. You wait it out before the next drop. */
export function shouldSpawnBomb(floors: number): boolean {
  if (floors < 6 || isKeystone(floors) || courseChanges(floors) || shouldSpawnMote(floors)) return false;
  return floors % 3 === 0;
}

/** Pulses per second. The first 58% of each pulse is motion; the rest is a hold. */
export function beatHz(period: number): number {
  return Math.min(3.4, 1.25 + 0.5 / Math.max(0.35, period));
}

export function beatPhase(clock: number, period: number): number {
  return ((clock * beatHz(period)) % 1 + 1) % 1;
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
  if (course === "gust") rate *= dir === wind ? 1.85 : 0.52;
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

/** Seconds for the slab to travel one way. Eases in, then hardens. */
export function periodFor(floors: number): number {
  return Math.max(0.4, 1.06 * Math.pow(0.988, floors));
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

export function resolveDrop(input: DropInput): DropResult {
  const { prevX, prevW, moverX, moverW, tol, startW, streak } = input;
  const dx = moverX - prevX;

  if (Math.abs(dx) <= tol) {
    const nextStreak = streak + 1;
    const forged = nextStreak % FORGE_EVERY === 0;
    let w = prevW;
    let x = prevX;
    if (forged) {
      const grown = Math.min(startW, prevW * FORGE_GROW);
      if (grown > prevW + 0.4) {
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
