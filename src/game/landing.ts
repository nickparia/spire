/**
 * Landings: every few floors the climb stops for a beat, the stone below
 * sets for good, and you take one of two gifts whose effect you see at once.
 */

export const LANDING_EVERY = 8;

export type LandingId =
  "setstone" | "lantern" | "broad" | "braces" | "ember" | "slow" | "keel" | "push";

/** Stone helps the tower stand; Light holds the Dark back. */
export type GiftFamily = "stone" | "light";

export type LandingDef = { id: LandingId; name: string; blurb: string; family: GiftFamily };

export const LANDINGS: LandingDef[] = [
  {
    id: "setstone",
    name: "Set Stone",
    blurb: "The next five slabs set wherever they land, and count.",
    family: "stone",
  },
  {
    id: "lantern",
    name: "Lantern",
    blurb: "The Dark holds still for twelve seconds.",
    family: "light",
  },
  {
    id: "broad",
    name: "Broad Stone",
    blurb: "The next three slabs are a third wider.",
    family: "stone",
  },
  {
    id: "braces",
    name: "Two Braces",
    blurb: "Two braces, now: your next two loose drops set.",
    family: "stone",
  },
  {
    id: "ember",
    name: "Ember",
    blurb: "Heat to full. Your weapon fires on the next drop.",
    family: "light",
  },
  {
    id: "slow",
    name: "Slow Stone",
    blurb: "The next six slabs move at half speed.",
    family: "light",
  },
  {
    id: "keel",
    name: "Keel",
    blurb: "The sway is halved for the rest of this sky.",
    family: "stone",
  },
  { id: "push", name: "Light", blurb: "The Dark is driven down six floors, now.", family: "light" },
];

export const LANDING_BY_ID: Record<LandingId, LandingDef> = Object.fromEntries(
  LANDINGS.map((l) => [l.id, l]),
) as Record<LandingId, LandingDef>;

/** Two different gifts, never one that would do nothing here. */
export function landingOffer(rand: () => number, darkOn: boolean, swayOn: boolean): LandingId[] {
  const pool = LANDINGS.filter(
    (l) => (darkOn || (l.id !== "lantern" && l.id !== "push")) && (swayOn || l.id !== "keel"),
  ).map((l) => l.id);
  const a = pool.splice(Math.floor(rand() * pool.length), 1)[0]!;
  const b = pool.splice(Math.floor(rand() * pool.length), 1)[0]!;
  return [a, b];
}

/** The floor a landing falls on, counted floors; the summit is never one. */
export function isLanding(floors: number, goal: number): boolean {
  return floors > 0 && floors % LANDING_EVERY === 0 && (goal <= 0 || floors < goal);
}
