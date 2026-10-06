/**
 * Feats: the moments worth a medal. Each is earned once, kept in the save,
 * and announced on the summit card the moment it happens.
 */

export type FeatId =
  | "first-light"
  | "half-sky"
  | "sky-relit"
  | "three-stars"
  | "true-column"
  | "own-ghost"
  | "rival-ghost"
  | "on-the-board"
  | "all-stars";

export type FeatDef = { id: FeatId; name: string; blurb: string };

export const FEATS: FeatDef[] = [
  { id: "first-light", name: "First Light", blurb: "Relit your first sky" },
  { id: "half-sky", name: "Half the Sky", blurb: "Four skies relit" },
  { id: "sky-relit", name: "The Sky Relit", blurb: "Every sky burning again" },
  { id: "three-stars", name: "Three Stars", blurb: "Every star on one sky" },
  { id: "all-stars", name: "Constellation", blurb: "Every star on every sky" },
  { id: "true-column", name: "True Column", blurb: "A summit with every drop perfect" },
  { id: "own-ghost", name: "Faster Than Yourself", blurb: "Beat your own ghost" },
  { id: "rival-ghost", name: "Outbuilt", blurb: "Beat a rival's ghost" },
  { id: "on-the-board", name: "On the Board", blurb: "Top ten on a leaderboard" },
];

export const FEAT_BY_ID: Record<FeatId, FeatDef> = Object.fromEntries(
  FEATS.map((f) => [f.id, f]),
) as Record<FeatId, FeatDef>;

export type FeatContext = {
  skiesLit: number;
  skies: number;
  starsOnThisSky: number;
  totalStars: number;
  perfects: number;
  floors: number;
  ghost: { beaten: boolean; rival: boolean } | null;
};

/** The feats a summit earns, in the order they should be announced. */
export function featsFor(ctx: FeatContext): FeatId[] {
  const out: FeatId[] = [];
  if (ctx.skiesLit >= 1) out.push("first-light");
  if (ctx.skiesLit >= Math.ceil(ctx.skies / 2)) out.push("half-sky");
  if (ctx.skiesLit >= ctx.skies) out.push("sky-relit");
  if (ctx.starsOnThisSky >= 3) out.push("three-stars");
  if (ctx.totalStars >= ctx.skies * 3) out.push("all-stars");
  if (ctx.floors > 0 && ctx.perfects >= ctx.floors) out.push("true-column");
  if (ctx.ghost?.beaten && !ctx.ghost.rival) out.push("own-ghost");
  if (ctx.ghost?.beaten && ctx.ghost.rival) out.push("rival-ghost");
  return out;
}

/** Marks feats as earned; returns only the ones that were new. */
export function earn(feats: Record<string, number>, ids: FeatId[], now: number): FeatId[] {
  const fresh: FeatId[] = [];
  for (const id of ids) {
    if (feats[id]) continue;
    feats[id] = now;
    fresh.push(id);
  }
  return fresh;
}
