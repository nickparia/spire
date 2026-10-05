import { FORGE_GROW, type Goals } from "./logic";

/**
 * The economy. Every drop pays coins on the spot, a summit pays more, and
 * coins buy workshop devices that stay bought. Each device blunts one hazard
 * or sharpens one reward, so a returning player is measurably stronger than
 * they were, and later levels can ask for more.
 */

export type GearId = "windbreak" | "cutter" | "brace" | "footing" | "magnet" | "temper" | "mint";

export type GearTier = { cost: number; effect: string };

export type GearDef = {
  id: GearId;
  name: string;
  blurb: string;
  tiers: GearTier[];
};

export const GEAR: GearDef[] = [
  {
    id: "brace",
    name: "Brace",
    blurb: "Start every run with a shield already up.",
    tiers: [
      { cost: 150, effect: "1 shield" },
      { cost: 500, effect: "2 shields" },
    ],
  },
  {
    id: "windbreak",
    name: "Windbreak",
    blurb: "Wind carries a falling slab less far.",
    tiers: [
      { cost: 80, effect: "15% less drift" },
      { cost: 200, effect: "30% less drift" },
      { cost: 450, effect: "45% less drift" },
    ],
  },
  {
    id: "cutter",
    name: "Fuse Cutter",
    blurb: "Bombs burn out sooner, so you wait less.",
    tiers: [
      { cost: 80, effect: "20% shorter fuse" },
      { cost: 200, effect: "35% shorter fuse" },
      { cost: 450, effect: "50% shorter fuse" },
    ],
  },
  {
    id: "footing",
    name: "Wide Footing",
    blurb: "The first slab, and every slab after it, starts wider.",
    tiers: [
      { cost: 80, effect: "6% wider" },
      { cost: 200, effect: "12% wider" },
      { cost: 450, effect: "18% wider" },
    ],
  },
  {
    id: "magnet",
    name: "Magnet",
    blurb: "Pickups can be taken from further off their line.",
    tiers: [
      { cost: 80, effect: "Reach +33%" },
      { cost: 200, effect: "Reach +67%" },
      { cost: 450, effect: "Reach doubled" },
    ],
  },
  {
    id: "temper",
    name: "Tempered Forge",
    blurb: "A forge wins back more width.",
    tiers: [
      { cost: 80, effect: "Forge +18%" },
      { cost: 200, effect: "Forge +22%" },
      { cost: 450, effect: "Forge +26%" },
    ],
  },
  {
    id: "mint",
    name: "Mint",
    blurb: "Everything pays more coins.",
    tiers: [
      { cost: 100, effect: "20% more coins" },
      { cost: 250, effect: "40% more coins" },
      { cost: 550, effect: "60% more coins" },
    ],
  },
];

/** Tiers owned per device. Missing means none. */
export type Owned = Record<string, number>;

/** What the owned devices add up to for a run. */
export type Kit = {
  /** Multiplier on wind drift. */
  drift: number;
  /** Multiplier on bomb fuse length. */
  fuse: number;
  /** Shields a run starts with. */
  shields: number;
  /** Multiplier on the starting slab width. */
  footing: number;
  /** How far off a pickup's line still takes it, px. */
  reach: number;
  /** Width multiplier applied by a forge. */
  forgeGrow: number;
  /** Multiplier on coins earned. */
  coins: number;
};

export const BASE_REACH = 30;

function tier(owned: Owned, id: GearId): number {
  const def = GEAR.find((g) => g.id === id);
  const have = owned[id];
  if (!def || typeof have !== "number" || !Number.isFinite(have)) return 0;
  return Math.max(0, Math.min(def.tiers.length, Math.floor(have)));
}

export function kitFor(owned: Owned): Kit {
  return {
    drift: 1 - 0.15 * tier(owned, "windbreak"),
    fuse: [1, 0.8, 0.65, 0.5][tier(owned, "cutter")]!,
    shields: tier(owned, "brace"),
    footing: 1 + 0.06 * tier(owned, "footing"),
    reach: BASE_REACH + 10 * tier(owned, "magnet"),
    forgeGrow: FORGE_GROW + [0, 0.04, 0.08, 0.12][tier(owned, "temper")]!,
    coins: 1 + 0.2 * tier(owned, "mint"),
  };
}

export function ownedTier(owned: Owned, id: GearId): number {
  return tier(owned, id);
}

/** The next tier to buy, or null once a device is fully built. */
export function nextTier(owned: Owned, id: GearId): GearTier | null {
  const def = GEAR.find((g) => g.id === id);
  return def?.tiers[tier(owned, id)] ?? null;
}

/**
 * Buys the next tier if the wallet covers it. Returns the new wallet and
 * tiers, or null if it can't be bought, leaving the caller's data untouched.
 */
export function purchase(
  coins: number,
  owned: Owned,
  id: GearId,
): { coins: number; owned: Owned } | null {
  const next = nextTier(owned, id);
  if (!next || coins < next.cost) return null;
  return { coins: coins - next.cost, owned: { ...owned, [id]: tier(owned, id) + 1 } };
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
