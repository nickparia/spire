/**
 * Landings: once or twice a sky the climb stops for a beat, the stone below
 * sets for good, and you take one of two elemental gifts. Each one changes
 * the world where you can see it: the slabs, the Dark, the sky.
 */

export type LandingId =
  "fire" | "frost" | "storm" | "stone" | "shadow" | "keystone" | "sight" | "ember";

/** A card builds: taken again it is kindled to II, then III. */
export const TIERS = 3;
export const TIER_NAMES = ["I", "II", "III"] as const;

export type LandingDef = {
  id: LandingId;
  name: string;
  blurb: string;
  /** What it does kindled to II and to III. */
  kindled: [string, string];
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
    kindled: [
      "Twelve slabs blaze, and each burns the Dark back two floors.",
      "Every slab to the summit blazes, each burning the Dark back two floors.",
    ],
    rgb: [255, 140, 50],
    needsDark: true,
  },
  {
    id: "frost",
    name: "Rime",
    blurb:
      "The Dark freezes for ten seconds. Your next five slabs freeze to whatever they land on.",
    kindled: [
      "The Dark freezes for sixteen seconds; ten slabs freeze where they land.",
      "The Dark freezes for twenty-four seconds; every slab freezes where it lands.",
    ],
    rgb: [120, 220, 255],
    needsDark: false,
  },
  {
    id: "storm",
    name: "Starfall",
    blurb: "Your next three perfects call down lightning that blasts the Dark three floors down.",
    kindled: [
      "Six perfects strike, each blasting the Dark four floors down.",
      "Every perfect to the summit strikes, five floors down.",
    ],
    rgb: [255, 236, 170],
    needsDark: true,
  },
  {
    id: "stone",
    name: "Bedrock",
    blurb:
      "Buttresses rise to brace the tower. The sway is halved, and your next four slabs are broad.",
    kindled: [
      "The sway drops to a third; eight slabs are broad.",
      "The sway drops to a quarter; every slab to the summit is broad.",
    ],
    rgb: [255, 190, 110],
    needsDark: false,
  },
  {
    id: "shadow",
    name: "Stillness",
    blurb: "Time thickens. The world slows for your next six slabs.",
    kindled: ["The world slows for twelve slabs.", "The world slows all the way to the summit."],
    rgb: [180, 140, 255],
    needsDark: false,
  },
  {
    id: "keystone",
    name: "Keystone",
    blurb:
      "Your next three slabs are keystones: narrow to land, and each perfect pushes the Dark twice.",
    kindled: [
      "Six keystones, each perfect pushing twice.",
      "Every slab to the summit a keystone, each perfect pushing twice.",
    ],
    rgb: [236, 226, 200],
    needsDark: false,
  },
  {
    id: "sight",
    name: "Second Sight",
    blurb: "The perfect moment shows itself: the cue stays lit for your next six slabs.",
    kindled: ["The cue stays lit for twelve slabs.", "The cue stays lit to the summit."],
    rgb: [170, 230, 220],
    needsDark: false,
  },
  {
    id: "ember",
    name: "Ember Trail",
    blurb:
      "A streak burns: from the second perfect in a row, each pushes the Dark half a floor more.",
    kindled: [
      "From the second perfect in a row, each pushes the Dark a floor more.",
      "From the second perfect in a row, each pushes the Dark a floor and a half more.",
    ],
    rgb: [255, 110, 70],
    needsDark: true,
  },
];

/** What a card does at a tier (1..3). */
export function landingBlurb(id: LandingId, tier: number): string {
  const def = LANDING_BY_ID[id];
  return tier <= 1 ? def.blurb : def.kindled[Math.min(TIERS, tier) - 2]!;
}

/** Two cards held together become a named power of their own. */
export type ComboId = "firestorm" | "winter" | "breath";
export type ComboDef = {
  id: ComboId;
  name: string;
  blurb: string;
  of: [LandingId, LandingId];
  rgb: [number, number, number];
};
export const COMBOS: ComboDef[] = [
  {
    id: "firestorm",
    name: "Firestorm",
    blurb:
      "Forge-fire and Starfall together: while the stone burns, every landing calls the lightning.",
    of: ["fire", "storm"],
    rgb: [255, 190, 90],
  },
  {
    id: "winter",
    name: "The Long Winter",
    blurb: "Rime and Bedrock together: while the buttresses stand, the Dark stays frozen.",
    of: ["frost", "stone"],
    rgb: [170, 220, 255],
  },
  {
    id: "breath",
    name: "Held Breath",
    blurb: "Stillness and Starfall together: in slow time the lightning strikes twice as deep.",
    of: ["shadow", "storm"],
    rgb: [210, 190, 255],
  },
];
export const COMBO_BY_ID: Record<ComboId, ComboDef> = Object.fromEntries(
  COMBOS.map((c) => [c.id, c]),
) as Record<ComboId, ComboDef>;

/** The hand: each card held and its tier. */
export type Hand = Partial<Record<LandingId, number>>;

/** The powers a hand has made. */
export function combosOf(hand: Hand): ComboId[] {
  return COMBOS.filter((c) => (hand[c.of[0]] ?? 0) > 0 && (hand[c.of[1]] ?? 0) > 0).map(
    (c) => c.id,
  );
}

/** The combo taking `id` would complete, given the hand; null if none. */
export function comboWith(hand: Hand, id: LandingId): ComboId | null {
  if ((hand[id] ?? 0) > 0) return null;
  const made = COMBOS.find(
    (c) => c.of.includes(id) && (hand[c.of[0] === id ? c.of[1] : c.of[0]] ?? 0) > 0,
  );
  return made ? made.id : null;
}

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
  hand: Hand = {},
): LandingId[] {
  const usable = LANDINGS.filter((l) => darkOn || !l.needsDark).map((l) => l.id);
  const pick = (from: LandingId[]): LandingId | undefined => {
    const fresh = from.filter((id) => !taken.includes(id));
    const pool = fresh.length > 0 ? fresh : from;
    return pool[Math.floor(rand() * pool.length)];
  };
  // The offer leans towards building: a card held but not yet at III, or one
  // that would make a power with a card held. Building is a choice, not luck.
  const kindle = usable.filter((id) => (hand[id] ?? 0) > 0 && (hand[id] ?? 0) < TIERS);
  const makes = usable.filter((id) => comboWith(hand, id) !== null);
  const lean = (): LandingId | undefined => {
    if (makes.length > 0 && rand() < 0.6) return makes[Math.floor(rand() * makes.length)];
    if (kindle.length > 0 && rand() < 0.75) return kindle[Math.floor(rand() * kindle.length)];
    return undefined;
  };
  if (trial) {
    const counters = TRIALS[trial].counters.filter((id) => usable.includes(id));
    const a = pick(counters);
    const leaned = lean();
    const b =
      leaned && leaned !== a
        ? leaned
        : pick(usable.filter((id) => id !== a && !counters.includes(id)));
    if (a && b) return [a, b];
  }
  const leaned = lean();
  const fresh = usable.filter((id) => !taken.includes(id) && id !== leaned);
  const pool = fresh.length >= 2 ? fresh : usable.filter((id) => id !== leaned);
  const a = leaned ?? pool.splice(Math.floor(rand() * pool.length), 1)[0]!;
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
