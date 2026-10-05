/**
 * The build: Heat, the three classes, their weapons, and the upgrades picked
 * during a run.
 *
 * Heat is the one meter. Good drops raise it, bad ones cost it, and when it
 * fills the forge fires along with your weapon. Each class feeds Heat a
 * different way, so which upgrades you take is what decides how you play.
 */

export type Family = "mason" | "striker" | "runner";

export const FAMILIES: Record<Family, { name: string; blurb: string }> = {
  mason: { name: "Mason", blurb: "Clean landings build Heat. Hard to topple." },
  striker: { name: "Striker", blurb: "Only perfects build Heat, and they pay big." },
  runner: { name: "Runner", blurb: "Fast drops build Heat. Keep moving." },
};

export type WeaponId = "buttress" | "chisel" | "slipstream";

export const WEAPONS: Record<WeaponId, { family: Family; name: string; blurb: string }> = {
  buttress: {
    family: "mason",
    name: "Buttress",
    blurb: "At full Heat the slab is rebuilt to full width.",
  },
  chisel: {
    family: "striker",
    name: "Chisel",
    blurb: "At full Heat it charges. Your next perfect pays triple and no bomb can land.",
  },
  slipstream: {
    family: "runner",
    name: "Slipstream",
    blurb: "At full Heat time slows and the wind drops for your next three slabs.",
  },
};

export type UpgradeId =
  | "shield"
  | "broad"
  | "footing"
  | "anchor"
  | "keen"
  | "crit"
  | "spark"
  | "steady"
  | "quick"
  | "lee"
  | "snips"
  | "tempo";

export type UpgradeDef = {
  id: UpgradeId;
  family: Family;
  name: string;
  blurb: string;
  /** How many times it can be taken in one run. */
  max: number;
};

export const UPGRADES: UpgradeDef[] = [
  { id: "shield", family: "mason", name: "Shield", blurb: "Raise a shield now.", max: 2 },
  {
    id: "broad",
    family: "mason",
    name: "Broad Shoulders",
    blurb: "Widen the slab 8% now, and every forge adds 6% more.",
    max: 2,
  },
  {
    id: "footing",
    family: "mason",
    name: "Sure Footing",
    blurb: "Clean landings build half again as much Heat.",
    max: 2,
  },
  { id: "anchor", family: "mason", name: "Anchor", blurb: "A miss costs no Heat.", max: 1 },
  {
    id: "keen",
    family: "striker",
    name: "Keen Eye",
    blurb: "The perfect window is 15% wider.",
    max: 2,
  },
  { id: "crit", family: "striker", name: "Crit", blurb: "Perfects pay 50% more coins.", max: 2 },
  { id: "spark", family: "striker", name: "Spark", blurb: "Perfects build 30% more Heat.", max: 2 },
  {
    id: "steady",
    family: "striker",
    name: "Steady Hand",
    blurb: "Each perfect in a row widens the window 3%, up to 30%.",
    max: 1,
  },
  {
    id: "quick",
    family: "runner",
    name: "Quick",
    blurb: "Fast drops build 60% more Heat.",
    max: 2,
  },
  { id: "lee", family: "runner", name: "Lee", blurb: "Wind carries the slab 30% less.", max: 2 },
  { id: "snips", family: "runner", name: "Snips", blurb: "Bomb fuses are 35% shorter.", max: 2 },
  { id: "tempo", family: "runner", name: "Tempo", blurb: "Fast drops pay 2 extra coins.", max: 2 },
];

/** Three picks from one family unlock its capstone for the rest of the run. */
export const CAPSTONE_AT = 3;

export const CAPSTONES: Record<Family, { name: string; blurb: string }> = {
  mason: { name: "Bulwark", blurb: "A new shield every eight floors." },
  striker: { name: "Deadeye", blurb: "Perfects pay double." },
  runner: {
    name: "Flow",
    blurb: "The fast-drop window opens wide, and fast drops build more Heat.",
  },
};

/** Times each upgrade has been taken this run. */
export type Picks = Partial<Record<UpgradeId, number>>;

/** Heat added per event, before upgrades. The meter runs 0..1. */
export const HEAT = {
  perfect: 0.2,
  /** A landing at 90% accuracy or better that is not a perfect. */
  clean: 0.08,
  /** A landing within the fast window of the one before. */
  fast: 0.1,
  miss: -0.12,
  saved: -0.3,
} as const;

/** Seconds after a landing in which the next landing counts as fast. */
export const FAST_WINDOW = 0.9;

/** What the run's picks add up to. Multipliers unless stated. */
export type Tuning = {
  window: number;
  /** Extra window per streak step, and its cap. */
  steadyStep: number;
  steadyCap: number;
  heatPerfect: number;
  heatClean: number;
  heatFast: number;
  /** Multiplier on the Heat a miss costs. */
  heatMiss: number;
  fastWindow: number;
  perfectPay: number;
  fastPay: number;
  drift: number;
  fuse: number;
  /** Added to the forge's width multiplier. */
  forgeBonus: number;
  /** Floors between free shields; 0 for none. */
  shieldEvery: number;
};

export const BASE_TUNING: Tuning = {
  window: 1,
  steadyStep: 0,
  steadyCap: 0,
  heatPerfect: 1,
  heatClean: 1,
  heatFast: 1,
  heatMiss: 1,
  fastWindow: FAST_WINDOW,
  perfectPay: 1,
  fastPay: 0,
  drift: 1,
  fuse: 1,
  forgeBonus: 0,
  shieldEvery: 0,
};

export function upgrade(id: UpgradeId): UpgradeDef {
  return UPGRADES.find((u) => u.id === id)!;
}

export function familyCount(picks: Picks, family: Family): number {
  let n = 0;
  for (const def of UPGRADES) if (def.family === family) n += picks[def.id] ?? 0;
  return n;
}

export function hasCapstone(picks: Picks, family: Family): boolean {
  return familyCount(picks, family) >= CAPSTONE_AT;
}

export function tuneFor(picks: Picks): Tuning {
  const n = (id: UpgradeId) => picks[id] ?? 0;
  const t: Tuning = { ...BASE_TUNING };
  t.forgeBonus = 0.06 * n("broad");
  t.heatClean = 1 + 0.5 * n("footing");
  if (n("anchor") > 0) t.heatMiss = 0;
  t.window = 1 + 0.15 * n("keen");
  t.perfectPay = 1 + 0.5 * n("crit");
  t.heatPerfect = 1 + 0.3 * n("spark");
  if (n("steady") > 0) {
    t.steadyStep = 0.03;
    t.steadyCap = 0.3;
  }
  t.heatFast = 1 + 0.6 * n("quick");
  t.drift = Math.pow(0.7, n("lee"));
  t.fuse = Math.pow(0.65, n("snips"));
  t.fastPay = 2 * n("tempo");
  if (hasCapstone(picks, "mason")) t.shieldEvery = 8;
  if (hasCapstone(picks, "striker")) t.perfectPay *= 2;
  if (hasCapstone(picks, "runner")) {
    t.fastWindow = 1.4;
    t.heatFast *= 1.5;
  }
  return t;
}

/** Perfect window multiplier for the current streak. */
export function windowFor(t: Tuning, streak: number): number {
  return t.window * (1 + Math.min(t.steadyCap, t.steadyStep * Math.max(0, streak)));
}

/**
 * Three upgrades to choose from: one from each family where it can, so a
 * pick is always a choice of direction, not just of strength.
 */
export function offer(rand: () => number, picks: Picks): UpgradeId[] {
  const open = UPGRADES.filter((u) => (picks[u.id] ?? 0) < u.max);
  const out: UpgradeId[] = [];
  const take = (pool: UpgradeDef[]) => {
    const left = pool.filter((u) => !out.includes(u.id));
    if (left.length === 0) return;
    out.push(left[Math.floor(rand() * left.length)]!.id);
  };
  const families: Family[] = ["mason", "striker", "runner"];
  for (let i = families.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [families[i], families[j]] = [families[j]!, families[i]!];
  }
  for (const family of families) take(open.filter((u) => u.family === family));
  while (out.length < 3 && out.length < open.length) take(open);
  return out;
}

export function isWeaponId(id: unknown): id is WeaponId {
  return id === "buttress" || id === "chisel" || id === "slipstream";
}
