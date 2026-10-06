import { clamp01, COURSE_CYCLE, HOVER, type CourseId, type Fall, type Plan } from "./logic";
import type { ThemeId } from "./themes";

export type LevelDef = {
  /** Stable key for saved progress. Never reuse or rename. */
  id: string;
  name: string;
  blurb: string;
  theme: ThemeId;
  /** Floors to place to reach the summit. */
  floors: number;
  /** Courses after the warm-up, split evenly across the remaining floors. */
  courses: CourseId[];
  /** Seconds per traverse on the first and last floor. */
  period: [number, number];
  /**
   * Sideways drift, in px, of a falling slab on the first and last windy
   * floor. Set on levels with a gust course: there the slab hangs and falls.
   */
  wind?: [number, number];
  /** Floors between upgrade picks. Omit for a level with no picks. */
  picks?: number;
  keystones: boolean;
  motes: boolean;
  bombs: boolean;
  /**
   * Finish at or under this many seconds for the pace star. Set three quarters
   * of the way from a flawless run that takes every slab on its first pass to
   * one that always waits for the second, so it asks for nerve, not perfection.
   */
  parTime: number;
  /** Finish at or over this accuracy (0..1) for the precision star. */
  parAccuracy: number;
};

/** Every level opens with a few plain floors so the new rhythm is a reveal. */
export const WARMUP_FLOORS = 3;

export const LEVELS: LevelDef[] = [
  {
    id: "foundry",
    name: "The Foundry",
    blurb: "Even pace. Learn the groove.",
    theme: "foundry",
    floors: 20,
    courses: ["slide"],
    period: [0.94, 0.83],
    keystones: false,
    motes: false,
    bombs: false,
    parTime: 24,
    parAccuracy: 0.86,
  },
  {
    id: "tide",
    name: "Tidewater",
    blurb: "The groove walks. Follow it.",
    theme: "tide",
    floors: 28,
    courses: ["sway"],
    period: [0.85, 0.73],
    picks: 8,
    keystones: false,
    motes: true,
    bombs: false,
    parTime: 32,
    parAccuracy: 0.88,
  },
  {
    id: "city",
    name: "Pulse City",
    blurb: "It rests, then it jumps. Count it in.",
    theme: "city",
    floors: 26,
    courses: ["beat"],
    period: [0.87, 0.77],
    picks: 9,
    keystones: true,
    motes: true,
    bombs: false,
    parTime: 43,
    parAccuracy: 0.88,
  },
  {
    id: "canyon",
    name: "Red Canyon",
    blurb: "It bursts through the centre. A bomb means wait.",
    theme: "canyon",
    floors: 30,
    courses: ["rush"],
    period: [0.82, 0.7],
    picks: 8,
    keystones: true,
    motes: true,
    bombs: true,
    parTime: 40,
    parAccuracy: 0.89,
  },
  {
    id: "ridge",
    name: "Gale Ridge",
    blurb: "The slab falls now, and the wind carries it.",
    theme: "ridge",
    floors: 34,
    courses: ["gust"],
    period: [0.9, 0.75],
    wind: [26, 56],
    picks: 6,
    keystones: false,
    motes: true,
    bombs: false,
    parTime: 59,
    parAccuracy: 0.82,
  },
  {
    id: "glacier",
    name: "The Glacier",
    blurb: "It holds at the walls. Breathe with it.",
    theme: "glacier",
    floors: 30,
    courses: ["breath"],
    period: [0.8, 0.68],
    picks: 8,
    keystones: true,
    motes: true,
    bombs: true,
    parTime: 96,
    parAccuracy: 0.89,
  },
  {
    id: "eclipse",
    name: "Eclipse",
    blurb: "The slab goes dark. Tap the flare.",
    theme: "eclipse",
    floors: 34,
    courses: ["eclipse"],
    period: [0.8, 0.68],
    picks: 8,
    keystones: true,
    motes: true,
    bombs: true,
    parTime: 40,
    parAccuracy: 0.9,
  },
  {
    id: "apex",
    name: "Apex",
    blurb: "Every sky, one after another.",
    theme: "apex",
    floors: 44,
    courses: ["gust", "beat", "sway", "rush", "breath", "eclipse", "split"],
    period: [0.77, 0.58],
    wind: [40, 48],
    picks: 8,
    keystones: true,
    motes: true,
    bombs: true,
    parTime: 105,
    parAccuracy: 0.9,
  },
];

export function levelCourseAt(level: LevelDef, floors: number): CourseId {
  if (floors < WARMUP_FLOORS || level.courses.length === 0) return "slide";
  const span = Math.max(1, level.floors - WARMUP_FLOORS);
  const each = span / level.courses.length;
  const index = Math.min(level.courses.length - 1, Math.floor((floors - WARMUP_FLOORS) / each));
  return level.courses[index]!;
}

/** Floors the landing outline stays on once the wind starts. */
const GUIDE_FLOORS = 3;

export function levelFallAt(level: LevelDef, floors: number): Fall | null {
  if (!level.wind) return null;
  if (levelCourseAt(level, floors) !== "gust") {
    // A level that opens on wind teaches the fall in still air first.
    const opening = floors < WARMUP_FLOORS && level.courses[0] === "gust";
    return opening ? { hover: HOVER, drift: 0, guide: true } : null;
  }
  const each = Math.max(1, level.floors - WARMUP_FLOORS) / level.courses.length;
  const start = WARMUP_FLOORS + level.courses.indexOf("gust") * each;
  const [from, to] = level.wind;
  const t = clamp01((floors - start) / Math.max(1, each - 1));
  return {
    hover: HOVER,
    drift: from + (to - from) * t,
    // Only the level that introduces wind holds your hand.
    guide: level.courses.length === 1 && floors - start < GUIDE_FLOORS,
  };
}

export function levelPlan(level: LevelDef, index: number): Plan {
  const [from, to] = level.period;
  return {
    goal: level.floors,
    courseAt: (floors) => levelCourseAt(level, floors),
    fallAt: (floors) => levelFallAt(level, floors),
    periodAt: (floors) => {
      const t = Math.min(1, Math.max(0, floors / Math.max(1, level.floors - 1)));
      return from + (to - from) * t;
    },
    difficulty: index * 6,
    sway: 0.1 + index * 0.025,
    // Slow enough to outbuild with steady play, never slow enough to ignore.
    darkRate: Math.min(20, 16 + index),
    physics: true,
    hazardsAt: () => ({ keystones: level.keystones, motes: level.motes, bombs: level.bombs }),
    span: level.floors,
    themeAt: () => level.theme,
    shadeAt: (floor) => floor / level.floors,
    gateAt: () => level.floors,
    pickAt: (floors) =>
      !!level.picks && floors > 0 && floors < level.floors && floors % level.picks === 0,
  };
}

const ENDLESS_SPAN = 5;

function endlessCourseAt(floors: number): CourseId {
  if (floors < 4) return "slide";
  return COURSE_CYCLE[Math.floor((floors - 4) / ENDLESS_SPAN) % COURSE_CYCLE.length]!;
}

/** The original climb: plain flights first, then the sky changes every five floors. */
export const ENDLESS_PLAN: Plan = {
  goal: 0,
  courseAt: endlessCourseAt,
  fallAt: (floors) =>
    endlessCourseAt(floors) === "gust"
      ? { hover: HOVER, drift: Math.min(56, 30 + floors * 0.4), guide: floors < 7 }
      : null,
  periodAt: (floors) => Math.max(0.4, 1.06 * Math.pow(0.988, floors)),
  difficulty: 0,
  sway: 0.18,
  darkRate: 18,
  physics: true,
  hazardsAt: () => ({ keystones: true, motes: true, bombs: true }),
  span: ENDLESS_SPAN,
  themeAt: (floors) => endlessTheme(endlessCourseAt(floors)),
  // Each sky paints its own band up the tower.
  shadeAt: (floor) => (floor < 5 ? (floor / 5) * 0.6 : 0.1 + (((floor - 5) % 5) / 4) * 0.8),
  gateAt: () => 0,
  pickAt: () => false,
};

const COURSE_THEME: Record<CourseId, ThemeId> = {
  slide: "foundry",
  gust: "ridge",
  beat: "city",
  sway: "tide",
  rush: "canyon",
  breath: "glacier",
  eclipse: "eclipse",
  split: "apex",
};

/** In endless each course brings its own sky. */
export function endlessTheme(course: CourseId): ThemeId {
  return COURSE_THEME[course];
}
