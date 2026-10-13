import { isLanding } from "./landing";

/**
 * Events: moments that belong to a world and come at different floors every
 * climb. Two a sky, seeded per run, never near a landing. Each is announced
 * by the world a beat before, lasts seconds, and asks something of the drop.
 *
 * A handful of mechanics (`EventKind`), worn by each sky in its own clothes:
 * the ash that dims the Foundry's lane is the City's smoke, the Canyon's
 * dust, the Glacier's whiteout.
 */

export type EventKind =
  | "forge"
  | "ash"
  | "tremor"
  | "lanterns"
  | "sleep"
  | "lightning"
  | "rogue"
  | "lull"
  | "shear"
  | "drag"
  | "swell"
  | "frost";

export type EventDef = {
  id: string;
  kind: EventKind;
  /** The worlds whose skies deal it. */
  worlds: string[];
  /** Only skies whose theme is one of these (any of the world's, if empty); the Apex takes all of Hearth's. */
  themes?: string[];
  /** What the world says as it comes (whitelisted in the engine's SPOKEN). */
  omen: string;
  /** How long it is in force, seconds; 0 for one that acts once. */
  dur: number;
  /** Earliest floor it may fall at. */
  from: number;
  /** Its painting (art/events/<art>.png), where the mechanic shows one. */
  art?: string;
};

const H = ["hearth"];
const G = ["gale"];

export const EVENTS: EventDef[] = [
  // Shared by every sky of a world.
  {
    id: "lanterns",
    kind: "lanterns",
    worlds: [...H, ...G],
    omen: "LANTERNS",
    dur: 9,
    from: 5,
    art: "lanterns",
  },
  { id: "sleep", kind: "sleep", worlds: [...H, ...G], omen: "THE DARK SLEEPS", dur: 8, from: 6 },
  // The Foundry: the forge, and the crane.
  {
    id: "forge",
    kind: "forge",
    worlds: H,
    themes: ["foundry"],
    omen: "THE FORGE BREATHES",
    dur: 0,
    from: 5,
    art: "embers",
  },
  {
    id: "crane",
    kind: "drag",
    worlds: H,
    themes: ["foundry"],
    omen: "THE CRANE SWINGS",
    dur: 7,
    from: 6,
    art: "crane",
  },
  // Tidewater: the swell, and sea mist.
  {
    id: "swell",
    kind: "swell",
    worlds: H,
    themes: ["tide"],
    omen: "THE SWELL",
    dur: 7,
    from: 6,
    art: "swell",
  },
  {
    id: "mist",
    kind: "ash",
    worlds: H,
    themes: ["tide"],
    omen: "SEA MIST",
    dur: 0,
    from: 6,
    art: "ash",
  },
  // The City: smoke, and the ground giving.
  {
    id: "smoke",
    kind: "ash",
    worlds: H,
    themes: ["city"],
    omen: "SMOKE",
    dur: 0,
    from: 6,
    art: "smoke",
  },
  {
    id: "subsidence",
    kind: "tremor",
    worlds: H,
    themes: ["city"],
    omen: "THE GROUND GIVES",
    dur: 0,
    from: 6,
    art: "tremor",
  },
  // Red Canyon: rockfall, and a dust storm.
  {
    id: "rockfall",
    kind: "tremor",
    worlds: H,
    themes: ["canyon"],
    omen: "ROCKFALL",
    dur: 0,
    from: 6,
    art: "tremor",
  },
  {
    id: "dust",
    kind: "ash",
    worlds: H,
    themes: ["canyon"],
    omen: "DUST STORM",
    dur: 0,
    from: 6,
    art: "dust",
  },
  // Gale Ridge: the wind's own tricks, and a kite torn loose.
  {
    id: "ridge-gust",
    kind: "rogue",
    worlds: H,
    themes: ["ridge"],
    omen: "ROGUE GUST",
    dur: 2.6,
    from: 6,
  },
  {
    id: "ridge-shear",
    kind: "shear",
    worlds: H,
    themes: ["ridge"],
    omen: "WIND SHEAR",
    dur: 0,
    from: 7,
  },
  {
    id: "ridge-kite",
    kind: "drag",
    worlds: H,
    themes: ["ridge"],
    omen: "THE KITE",
    dur: 7,
    from: 6,
    art: "kite",
  },
  // The Glacier: hoarfrost (a help), a whiteout, an avalanche.
  {
    id: "hoarfrost",
    kind: "frost",
    worlds: H,
    themes: ["glacier"],
    omen: "HOARFROST",
    dur: 0,
    from: 5,
    art: "frost",
  },
  {
    id: "whiteout",
    kind: "ash",
    worlds: H,
    themes: ["glacier"],
    omen: "WHITEOUT",
    dur: 0,
    from: 6,
    art: "snow",
  },
  {
    id: "avalanche",
    kind: "tremor",
    worlds: H,
    themes: ["glacier"],
    omen: "AVALANCHE",
    dur: 0,
    from: 6,
    art: "tremor",
  },
  // The Eclipse: lightning, and nightfall.
  {
    id: "lightning",
    kind: "lightning",
    worlds: H,
    themes: ["eclipse"],
    omen: "LIGHTNING",
    dur: 0,
    from: 6,
    art: "bolt",
  },
  {
    id: "nightfall",
    kind: "ash",
    worlds: H,
    themes: ["eclipse"],
    omen: "NIGHTFALL",
    dur: 0,
    from: 6,
    art: "ash",
  },
  // The Gale's six skies.
  { id: "rogue", kind: "rogue", worlds: G, omen: "ROGUE GUST", dur: 2.6, from: 6 },
  { id: "lull", kind: "lull", worlds: G, omen: "THE LULL", dur: 10, from: 5 },
  { id: "shear", kind: "shear", worlds: G, omen: "WIND SHEAR", dur: 0, from: 7 },
  { id: "kite", kind: "drag", worlds: G, omen: "THE KITE", dur: 7, from: 6, art: "kite" },
];

export const EVENT_BY_ID: Record<string, EventDef> = Object.fromEntries(
  EVENTS.map((e) => [e.id, e]),
);

export type Scheduled = { at: number; id: string };

/** Floors at least this far from any landing, and from each other. */
const CLEAR = 3;
/** Floors between two events, at least. */
const APART = 5;

/** The events a sky can deal: its world's, filtered to its theme; the Apex takes every Hearth sky's. */
export function deckFor(worldId: string, theme: string): EventDef[] {
  return EVENTS.filter(
    (e) =>
      e.worlds.includes(worldId) && (!e.themes || theme === "apex" || e.themes.includes(theme)),
  );
}

/**
 * The events of one climb: two, from the sky's deck, at floors chosen by
 * `rand`, clear of the landings and of the summit, never the same two.
 */
export function pickEvents(
  rand: () => number,
  worldId: string,
  theme: string,
  goal: number,
  count = 2,
  landingEvery = 0,
): Scheduled[] {
  const deck = deckFor(worldId, theme);
  if (deck.length === 0 || goal < 12) return [];
  const taken: Scheduled[] = [];
  const clear = (f: number) => {
    for (let d = -CLEAR; d <= CLEAR; d++) if (isLanding(f + d, goal, landingEvery)) return false;
    return taken.every((t) => Math.abs(t.at - f) > APART);
  };
  const pool = [...deck];
  while (taken.length < count && pool.length > 0) {
    const def = pool.splice(Math.floor(rand() * pool.length), 1)[0]!;
    // Every floor it could fall on, then one of them at random.
    const floors: number[] = [];
    for (let f = def.from; f < goal - 3; f++) if (clear(f)) floors.push(f);
    if (floors.length === 0) continue;
    taken.push({ at: floors[Math.floor(rand() * floors.length)]!, id: def.id });
  }
  return taken.sort((a, b) => a.at - b.at);
}
