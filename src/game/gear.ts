import type { Goals } from "./logic";
import type { Family, WeaponId } from "./build";

/**
 * The economy. Every drop pays coins on the spot and a summit pays a purse.
 * Coins go two places, each with a different feel:
 *
 * - Stat tracks: one per class, five ranks bought in order, always on. Many
 *   small steps, so every run leaves you a little stronger.
 * - Weapon levels: five per weapon. You carry one weapon, so this is where
 *   you commit to a class.
 */

export type Rank = { name: string; effect: string; cost: number };

export type TrackDef = { family: Family; name: string; blurb: string; ranks: Rank[] };

/**
 * Skies that must be lit before each rank, and each weapon level, can be
 * bought. The workshop opens up over the whole game rather than all at once.
 */
export const RANK_UNLOCKS = [0, 1, 2, 4, 6];

/**
 * Ranks are quality of life: a spare life, a clearer view, more coin. They
 * never change how the slab moves or how Heat builds; that is what the run's
 * picks are for.
 */
export const TRACKS: TrackDef[] = [
  {
    family: "mason",
    name: "Mason",
    blurb: "Lives, and a steadier slab.",
    ranks: [
      { name: "Brace", effect: "Start every run with a shield", cost: 120 },
      { name: "Second Wind", effect: "The first fall of each run is forgiven", cost: 260 },
      { name: "Wide Footing", effect: "Start 6% wider", cost: 450 },
      { name: "Keel", effect: "A held slab wastes away a quarter slower", cost: 750 },
      { name: "Bulwark", effect: "Start every run with two shields", cost: 1200 },
    ],
  },
  {
    family: "striker",
    name: "Striker",
    blurb: "See more, get paid more.",
    ranks: [
      { name: "Sight", effect: "The perfect window is drawn on the stack", cost: 120 },
      { name: "Magnet", effect: "Pickups taken from 50% further off", cost: 260 },
      { name: "Crit", effect: "Perfects pay 25% more", cost: 450 },
      { name: "Mark", effect: "In wind, the landing outline never goes away", cost: 750 },
      { name: "Assay", effect: "Perfects pay 50% more", cost: 1200 },
    ],
  },
  {
    family: "runner",
    name: "Runner",
    blurb: "Less waiting, more coin.",
    ranks: [
      { name: "Fuse Cutter", effect: "Bomb fuses 25% shorter", cost: 120 },
      { name: "Glide", effect: "A held slab keeps its width 0.3 s longer", cost: 260 },
      { name: "Mint", effect: "Everything pays 20% more coins", cost: 450 },
      { name: "Quick Hands", effect: "The fast-drop window is 0.2 s wider", cost: 750 },
      { name: "Snuffer", effect: "Bomb fuses halved", cost: 1200 },
    ],
  },
];

export const WEAPON_LEVELS = 5;
export const WEAPON_COSTS = [0, 200, 400, 700, 1100];
/** Skies lit before each weapon level can be bought; index 0 is level 1. */
export const LEVEL_UNLOCKS = [0, 0, 2, 4, 6];

/** What each weapon level adds. Index 0 is level 1, which every weapon starts at. */
export const WEAPON_PERKS: Record<WeaponId, string[]> = {
  buttress: [
    "Rebuilds the slab to full width at full Heat",
    "Heat builds 10% faster",
    "Firing also raises a shield",
    "Heat builds 25% faster",
    "Firing also pays 20 coins",
  ],
  chisel: [
    "Charges at full Heat: the next perfect pays triple",
    "Heat builds 10% faster",
    "A charged perfect pays four times",
    "Heat builds 25% faster",
    "A charge lasts for two perfects",
  ],
  slipstream: [
    "Slows the next three slabs at full Heat",
    "Heat builds 10% faster",
    "Slows four slabs",
    "Heat builds 25% faster",
    "Slows five slabs, and the wind drops entirely",
  ],
};

/** Ranks owned per track, by family. Missing means none. */
export type Tracks = Partial<Record<Family, number>>;
/** Level per weapon. Missing means level 1. */
export type Levels = Partial<Record<WeaponId, number>>;

/** Everything the permanent build changes about a run. */
export type Kit = {
  shields: number;
  /** The first fall of a run is forgiven. */
  secondWind: boolean;
  footing: number;
  /** Multiplier on how fast a held slab wastes away. */
  shrink: number;
  /** The perfect window is drawn on the stack. */
  sight: boolean;
  reach: number;
  perfectPay: number;
  /** The wind landing outline stays on. */
  mark: boolean;
  fuse: number;
  /** Seconds added to a held slab's grace. */
  grace: number;
  coins: number;
  /** Seconds added to the fast-drop window. */
  fastBonus: number;
  /** Multiplier on all Heat gained, from the weapon's level. */
  charge: number;
  /** Weapon perks by level. */
  fireShield: boolean;
  fireCoins: number;
  chiselPay: number;
  chiselCharges: number;
  slipSlabs: number;
  slipCalm: boolean;
};

export const BASE_REACH = 30;

export function rankOf(tracks: Tracks, family: Family): number {
  const n = tracks[family];
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(RANK_UNLOCKS.length, Math.floor(n)));
}

export function levelOf(levels: Levels, weapon: WeaponId): number {
  const n = levels[weapon];
  if (typeof n !== "number" || !Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(WEAPON_LEVELS, Math.floor(n)));
}

export function kitFor(tracks: Tracks, levels: Levels, weapon: WeaponId): Kit {
  const m = rankOf(tracks, "mason");
  const s = rankOf(tracks, "striker");
  const r = rankOf(tracks, "runner");
  const lv = levelOf(levels, weapon);
  return {
    shields: m >= 5 ? 2 : m >= 1 ? 1 : 0,
    secondWind: m >= 2,
    footing: m >= 3 ? 1.06 : 1,
    shrink: m >= 4 ? 0.75 : 1,
    sight: s >= 1,
    reach: BASE_REACH * (s >= 2 ? 1.5 : 1),
    perfectPay: s >= 5 ? 1.5 : s >= 3 ? 1.25 : 1,
    mark: s >= 4,
    fuse: r >= 5 ? 0.5 : r >= 1 ? 0.75 : 1,
    grace: r >= 2 ? 0.3 : 0,
    coins: r >= 3 ? 1.2 : 1,
    fastBonus: r >= 4 ? 0.2 : 0,
    charge: lv >= 4 ? 1.25 : lv >= 2 ? 1.1 : 1,
    fireShield: weapon === "buttress" && lv >= 3,
    fireCoins: weapon === "buttress" && lv >= 5 ? 20 : 0,
    chiselPay: weapon === "chisel" && lv >= 3 ? 4 : 3,
    chiselCharges: weapon === "chisel" && lv >= 5 ? 2 : 1,
    slipSlabs: weapon === "slipstream" ? (lv >= 5 ? 5 : lv >= 3 ? 4 : 3) : 3,
    slipCalm: weapon === "slipstream" && lv >= 5,
  };
}

/** The next rank on a track, or null once it is complete. */
export function nextRank(tracks: Tracks, family: Family): Rank | null {
  const track = TRACKS.find((t) => t.family === family);
  return track?.ranks[rankOf(tracks, family)] ?? null;
}

/** Skies that must be lit before the next rank opens; 0 when it is open. */
export function rankNeeds(tracks: Tracks, family: Family, lit: number): number {
  const need = RANK_UNLOCKS[rankOf(tracks, family)] ?? 0;
  return Math.max(0, need - lit);
}

/** Cost of the weapon's next level, or null at the top. */
export function nextLevelCost(levels: Levels, weapon: WeaponId): number | null {
  const lv = levelOf(levels, weapon);
  return lv >= WEAPON_LEVELS ? null : WEAPON_COSTS[lv]!;
}

export function levelNeeds(levels: Levels, weapon: WeaponId, lit: number): number {
  const need = LEVEL_UNLOCKS[levelOf(levels, weapon)] ?? 0;
  return Math.max(0, need - lit);
}

/** Buys the next rank if it is open and the wallet covers it; null leaves the caller's data untouched. */
export function buyRank(
  coins: number,
  tracks: Tracks,
  family: Family,
  lit: number,
): { coins: number; tracks: Tracks } | null {
  const next = nextRank(tracks, family);
  if (!next || coins < next.cost || rankNeeds(tracks, family, lit) > 0) return null;
  return { coins: coins - next.cost, tracks: { ...tracks, [family]: rankOf(tracks, family) + 1 } };
}

export function buyLevel(
  coins: number,
  levels: Levels,
  weapon: WeaponId,
  lit: number,
): { coins: number; levels: Levels } | null {
  const cost = nextLevelCost(levels, weapon);
  if (cost === null || coins < cost || levelNeeds(levels, weapon, lit) > 0) return null;
  return { coins: coins - cost, levels: { ...levels, [weapon]: levelOf(levels, weapon) + 1 } };
}

export type DropPay = {
  perfect: boolean;
  streak: number;
  forged: boolean;
  keystone: boolean;
  accuracy: number;
};

/**
 * Coins for one landed slab. A perfect pays, a streak pays more, and a clean
 * near-miss still pays something; a sloppy one pays nothing.
 */
export function dropCoins(d: DropPay): number {
  if (!d.perfect) return d.accuracy >= 0.75 ? 1 : 0;
  const chain = Math.min(4, Math.max(0, d.streak - 1));
  return 2 + chain + (d.forged ? 5 : 0) + (d.keystone ? 5 : 0);
}

export type Payout = {
  /** Earned slab by slab during the run. */
  drops: number;
  clear: number;
  accuracy: number;
  pace: number;
  stars: number;
  total: number;
};

/** The purse for reaching a summit, before the Mint's multiplier. */
export function summitCoins(
  levelIndex: number,
  accuracy: number,
  goals: Goals,
  fresh: Goals,
): Omit<Payout, "drops" | "total"> {
  const newStars = Number(fresh.clear) + Number(fresh.precise) + Number(fresh.swift);
  return {
    clear: 20 + levelIndex * 5,
    accuracy: Math.round(Math.max(0, Math.min(1, accuracy) - 0.6) * 100),
    pace: goals.swift ? 20 : 0,
    stars: newStars * 30,
  };
}

/**
 * The first workshop sold standalone devices. A save that still has them is
 * refunded at what they cost, so early testers lose nothing in the change.
 */
const OLD_DEVICE_COSTS: Record<string, number[]> = {
  brace: [150, 500],
  windbreak: [80, 200, 450],
  cutter: [80, 200, 450],
  footing: [80, 200, 450],
  magnet: [80, 200, 450],
  temper: [80, 200, 450],
  mint: [100, 250, 550],
};

export function refundDevices(gear: Record<string, unknown>): number {
  let total = 0;
  for (const [id, owned] of Object.entries(gear)) {
    const costs = OLD_DEVICE_COSTS[id];
    const tiers = typeof owned === "number" && Number.isFinite(owned) ? Math.floor(owned) : 0;
    if (!costs) continue;
    for (let i = 0; i < Math.min(tiers, costs.length); i++) total += costs[i]!;
  }
  return total;
}
