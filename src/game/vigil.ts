import { pickEvents, type Scheduled } from "./events";
import { isLanding } from "./landing";
import { LEVELS, levelPlan, type LevelDef } from "./levels";
import { COURSE_CYCLE, type CourseId, type Plan } from "./logic";
import type { Passer, PasserKind } from "./passers";
import { hashSeed, seeded } from "./rand";
import type { Save } from "./save";
import type { ThemeId } from "./themes";

/**
 * The Vigil: one sky a day, a hundred floors, the same for every builder.
 * Everything about it is drawn from the day's seed, so two phones on the
 * same date build the same climb: the sky, the courses, the events, the
 * passers, the cards each landing deals. The day turns at midnight UTC.
 */

export const VIGIL_FLOORS = 100;
export const VIGIL_LANDING_EVERY = 20;
export const VIGIL_EVENTS = 6;
/** Where it sits on Hearth's ladder for the perfect window and the sway (see levelPlan). */
const VIGIL_TIER = 4;
/**
 * How fast the Dark climbs, px/s. Faster than any Hearth sky (Apex is 31):
 * at 24 a steady builder who never missed was twenty floors clear at the top.
 */
const VIGIL_DARK = 38;
/**
 * The air's push. A hundred welded floors bend more than forty: at Hearth's
 * tier-four sway the column crumbled near fifty, so the Vigil's air is stiller.
 */
const VIGIL_SWAY = 0.12;
/** Events the Vigil never deals: the swell doubles the sway, which a tall column cannot take. */
const VIGIL_SKIPS = new Set(["swell"]);
/** Seconds per traverse, first floor to last: gentler than Apex's start, the same at the top. */
const VIGIL_PERIOD: [number, number] = [0.9, 0.6];
const VIGIL_WIND: [number, number] = [28, 54];
/** Past this the Dark quickens. */
const VIGIL_PAR = 190;
const VIGIL_THEMES: ThemeId[] = [
  "foundry",
  "tide",
  "city",
  "canyon",
  "ridge",
  "glacier",
  "eclipse",
  "apex",
];
const PASSER_KINDS: PasserKind[] = ["birds", "cloud", "rain", "sun", "moon", "kite", "scraps"];
/** Floors between the things the climb passes, about. */
const PASSER_EVERY = 8;

export const VIGIL_LINE = "The same sky over every builder tonight. A hundred floors.";
export const VIGIL_BLURB = "One sky for everyone, until midnight.";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Today's Vigil, as a UTC date: YYYY-MM-DD. */
export function vigilDay(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function isVigilDay(day: unknown): day is string {
  return typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day);
}

/** Milliseconds until the sky turns: the next midnight UTC. */
export function untilNextVigil(now: Date = new Date()): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(0, next - now.getTime());
}

/** "5 h 12 m", or "12 m" in the last hour. */
export function formatUntil(ms: number): string {
  const minutes = Math.max(1, Math.ceil(ms / 60000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} h ${m} m` : `${m} m`;
}

/** "13 Oct": the day as the card says it. */
export function vigilDate(day: string): string {
  const [, m, d] = day.split("-").map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]}`;
}

export function vigilId(day: string): string {
  return `vigil-${day}`;
}

export function vigilSeed(day: string): number {
  return hashSeed(vigilId(day));
}

/** What a sky's painting is called: the Hearth sky painted with it. */
export function themeName(theme: ThemeId): string {
  return LEVELS.find((l) => l.theme === theme)?.name ?? theme;
}

/** The sky of one day: theme, courses, wind and passers, all from the seed. */
export function vigilLevel(day: string): LevelDef {
  const rand = seeded(vigilSeed(day));
  const theme = VIGIL_THEMES[Math.floor(rand() * VIGIL_THEMES.length)]!;
  // Five to seven courses, never the same one twice running; the split only in the last third.
  const n = 5 + Math.floor(rand() * 3);
  const courses: CourseId[] = [];
  while (courses.length < n) {
    const last = courses[courses.length - 1];
    const lastThird = courses.length >= n - Math.floor(n / 3);
    const pool = COURSE_CYCLE.filter((c) => c !== last && (c !== "split" || lastThird));
    courses.push(pool[Math.floor(rand() * pool.length)]!);
  }
  return {
    id: vigilId(day),
    name: themeName(theme),
    blurb: VIGIL_BLURB,
    line: VIGIL_LINE,
    theme,
    floors: VIGIL_FLOORS,
    courses,
    period: VIGIL_PERIOD,
    wind: courses.includes("gust") ? VIGIL_WIND : undefined,
    keystones: true,
    motes: true,
    bombs: true,
    parTime: VIGIL_PAR,
    parAccuracy: 0.85,
    tier: VIGIL_TIER,
    passers: vigilPassers(rand),
  };
}

/** Things passed on the way up: one every eight floors or so, never over a landing. */
function vigilPassers(rand: () => number): Passer[] {
  const out: Passer[] = [];
  let last: PasserKind | null = null;
  for (let at = 6; at < VIGIL_FLOORS - 4; at += PASSER_EVERY) {
    const floor = at + Math.floor(rand() * 5) - 2;
    let near = false;
    for (let d = -2; d <= 2; d++)
      if (isLanding(floor + d, VIGIL_FLOORS, VIGIL_LANDING_EVERY)) near = true;
    const pool = PASSER_KINDS.filter((k) => k !== last);
    const kind = pool[Math.floor(rand() * pool.length)]!;
    const side = rand() < 0.5 ? -1 : 1;
    if (near) continue;
    last = kind;
    out.push(
      kind === "birds" || kind === "scraps" ? { at: floor, kind, side } : { at: floor, kind },
    );
  }
  return out;
}

export function vigilPlan(day: string): Plan {
  return {
    ...levelPlan(vigilLevel(day), VIGIL_TIER),
    darkRate: VIGIL_DARK,
    sway: VIGIL_SWAY,
    landingEvery: VIGIL_LANDING_EVERY,
  };
}

/** The day's events: six, from every Hearth sky's deck but the swell, clear of the landings. */
export function vigilEvents(day: string): Scheduled[] {
  const rand = seeded(vigilSeed(day) ^ 0x5bd1e995);
  const out: Scheduled[] = [];
  // Dealt with one spare, so a swell drawn can be put back without a gap.
  for (const e of pickEvents(
    rand,
    "hearth",
    "apex",
    VIGIL_FLOORS,
    VIGIL_EVENTS + 1,
    VIGIL_LANDING_EVERY,
  )) {
    if (!VIGIL_SKIPS.has(e.id) && out.length < VIGIL_EVENTS) out.push(e);
  }
  return out;
}

/** Open once the Foundry is lit, so nobody meets it before the first sky. */
export function vigilOpen(save: Save): boolean {
  return save.tester || Boolean(save.levels.foundry?.clear);
}

/** The deal at one landing, the same for everyone who reaches that floor. */
export function vigilDeal(day: string, floor: number): () => number {
  return seeded((vigilSeed(day) ^ Math.imul(floor + 1, 0x9e3779b1)) >>> 0);
}

export type VigilRun = { floors: number; summit: boolean; time: number };

/**
 * Whether `run` ranks above `best`: a summit beats any fall; between
 * summits the quicker; between falls the higher, then the quicker.
 */
export function vigilBetter(run: VigilRun, best: VigilRun | null): boolean {
  if (!best) return true;
  if (run.summit !== best.summit) return run.summit;
  if (run.summit) return run.time < best.time;
  if (run.floors !== best.floors) return run.floors > best.floors;
  return run.time < best.time;
}
