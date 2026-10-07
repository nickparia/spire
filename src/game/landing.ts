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
 * Two different gifts, never one that would do nothing here, and ones not
 * yet taken this run first.
 */
export function landingOffer(
  rand: () => number,
  darkOn: boolean,
  taken: readonly LandingId[] = [],
): LandingId[] {
  const usable = LANDINGS.filter((l) => darkOn || !l.needsDark).map((l) => l.id);
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
