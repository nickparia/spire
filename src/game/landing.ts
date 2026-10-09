/**
 * Landings: once or twice a sky the climb stops for a beat, the stone below
 * sets for good, and you take one of two elemental gifts. Each one changes
 * the world where you can see it: the slabs, the Dark, the sky.
 */

export type LandingId = "fire" | "frost" | "storm" | "stone" | "shadow";

export type LandingDef = {
  id: LandingId;
  name: string;
  blurb: string;
  /** The element's colour, for its light in the world. */
  rgb: [number, number, number];
  /** Whether it needs the Dark to be rising to do anything. */
  needsDark: boolean;
};

export const LANDINGS: LandingDef[] = [
  {
    id: "fire",
    name: "Forge-fire",
    blurb: "Your next six slabs blaze. Each one that lands burns the Dark back a floor.",
    rgb: [255, 140, 50],
    needsDark: true,
  },
  {
    id: "frost",
    name: "Rime",
    blurb:
      "The Dark freezes for ten seconds. Your next five slabs freeze to whatever they land on.",
    rgb: [120, 220, 255],
    needsDark: false,
  },
  {
    id: "storm",
    name: "Starfall",
    blurb: "Your next three perfects call down lightning that blasts the Dark three floors down.",
    rgb: [255, 236, 170],
    needsDark: true,
  },
  {
    id: "stone",
    name: "Bedrock",
    blurb:
      "Buttresses rise to brace the tower. The sway is halved, and your next four slabs are broad.",
    rgb: [255, 190, 110],
    needsDark: false,
  },
  {
    id: "shadow",
    name: "Stillness",
    blurb: "Time thickens. The world slows for your next six slabs.",
    rgb: [180, 140, 255],
    needsDark: false,
  },
];

export const LANDING_BY_ID: Record<LandingId, LandingDef> = Object.fromEntries(
  LANDINGS.map((l) => [l.id, l]),
) as Record<LandingId, LandingDef>;

/**
 * A trial: what the next flight brings, announced at the landing. Each is the
 * sky's own course turned up until the next landing or the summit: the Dark
 * heaves, the groove's walk widens, the beat quickens, the rush and the
 * breath shorten, the gale rises, the sky darkens, the column splits wider.
 */
export type TrialId = "heave" | "walk" | "beat" | "rush" | "breath" | "gale" | "dusk" | "split";

export type TrialDef = {
  id: TrialId;
  /** What the world says as it comes. */
  omen: string;
  /** How the flight is turned up: the Dark's pace, the groove's walk, the mover's period, the gust's drift, the air's sway. */
  dark: number;
  walk: number;
  period: number;
  drift: number;
  sway: number;
  /** The gifts that answer it. */
  counters: LandingId[];
};

export const TRIALS: Record<TrialId, TrialDef> = {
  heave: {
    id: "heave",
    omen: "THE DARK HEAVES",
    dark: 1.6,
    walk: 1,
    period: 1,
    drift: 1,
    sway: 1,
    counters: ["fire", "frost", "storm"],
  },
  walk: {
    id: "walk",
    omen: "THE GROOVE WALKS",
    dark: 1,
    walk: 2,
    period: 1,
    drift: 1,
    sway: 1.2,
    counters: ["stone", "shadow"],
  },
  beat: {
    id: "beat",
    omen: "THE BEAT QUICKENS",
    dark: 1,
    walk: 1,
    period: 0.78,
    drift: 1,
    sway: 1,
    counters: ["shadow"],
  },
  rush: {
    id: "rush",
    omen: "THE RUSH",
    dark: 1,
    walk: 1,
    period: 0.78,
    drift: 1,
    sway: 1,
    counters: ["shadow"],
  },
  breath: {
    id: "breath",
    omen: "THE BREATH SHORTENS",
    dark: 1,
    walk: 1,
    period: 0.78,
    drift: 1,
    sway: 1,
    counters: ["shadow"],
  },
  gale: {
    id: "gale",
    omen: "THE GALE RISES",
    dark: 1,
    walk: 1,
    period: 1,
    drift: 1.7,
    sway: 1.6,
    counters: ["stone"],
  },
  dusk: {
    id: "dusk",
    omen: "THE SKY DARKENS",
    dark: 1.5,
    walk: 1,
    period: 1,
    drift: 1,
    sway: 1,
    counters: ["storm", "fire", "frost"],
  },
  split: {
    id: "split",
    omen: "THE COLUMN SPLITS",
    dark: 1,
    walk: 1,
    period: 1,
    drift: 1,
    sway: 1.5,
    counters: ["stone"],
  },
};

/** The trial a flight on this course brings. */
export function trialFor(course: string): TrialId {
  switch (course) {
    case "sway":
      return "walk";
    case "beat":
      return "beat";
    case "rush":
      return "rush";
    case "breath":
      return "breath";
    case "gust":
      return "gale";
    case "eclipse":
      return "dusk";
    case "split":
      return "split";
    default:
      return "heave";
  }
}

/**
 * Two different gifts, never one that would do nothing here, and ones not
 * yet taken this run first. With a trial coming, the first answers it and
 * the second doesn't: the choice is safe or greedy.
 */
export function landingOffer(
  rand: () => number,
  darkOn: boolean,
  taken: readonly LandingId[] = [],
  trial: TrialId | null = null,
): LandingId[] {
  const usable = LANDINGS.filter((l) => darkOn || !l.needsDark).map((l) => l.id);
  const pick = (from: LandingId[]): LandingId | undefined => {
    const fresh = from.filter((id) => !taken.includes(id));
    const pool = fresh.length > 0 ? fresh : from;
    return pool[Math.floor(rand() * pool.length)];
  };
  if (trial) {
    const counters = TRIALS[trial].counters.filter((id) => usable.includes(id));
    const a = pick(counters);
    const b = pick(usable.filter((id) => id !== a && !counters.includes(id)));
    if (a && b) return [a, b];
  }
  const fresh = usable.filter((id) => !taken.includes(id));
  const pool = fresh.length >= 2 ? fresh : usable;
  const a = pool.splice(Math.floor(rand() * pool.length), 1)[0]!;
  const b = pool.splice(Math.floor(rand() * pool.length), 1)[0]!;
  return [a, b];
}

/** A sky this many floors tall or more has two landings; shorter ones have one, halfway. */
export const LONG_SKY = 30;
/** Endless has no summit: a landing every this many floors. */
export const ENDLESS_LANDING = 12;

/** The floor a landing falls on, counted floors; the summit is never one. */
export function isLanding(floors: number, goal: number): boolean {
  if (floors <= 0) return false;
  if (goal <= 0) return floors % ENDLESS_LANDING === 0;
  if (goal < LONG_SKY) return floors === Math.round(goal / 2);
  return floors === Math.round(goal / 3) || floors === Math.round((goal * 2) / 3);
}
