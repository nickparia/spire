import { levelStars, type Save } from "./save";

/**
 * Finishes: what your stars and feats earn you, worn where you can see it.
 * A stone finish is the painted stone your slabs are cut from, carried into
 * any sky; a trail is what the moving slab leaves in the air. Nothing here
 * changes how the game plays; it changes how your climb looks.
 */

export type FinishId =
  | "sky"
  | "foundry"
  | "tide"
  | "city"
  | "canyon"
  | "ridge"
  | "glacier"
  | "eclipse"
  | "apex"
  | "drill";

export type TrailId = "none" | "ember" | "frost" | "shadow" | "star";

export type FinishDef = {
  id: FinishId;
  name: string;
  /** How it's earned, for the locked tile. */
  how: string;
  unlocked: (save: Save) => boolean;
};

export type TrailDef = {
  id: TrailId;
  name: string;
  how: string;
  rgb: [number, number, number];
  unlocked: (save: Save) => boolean;
};

const stone = (id: FinishId, sky: string, name: string): FinishDef => ({
  id,
  name,
  how: `Three stars on ${sky}`,
  unlocked: (save) => levelStars(save, id) >= 3,
});

export const FINISHES: FinishDef[] = [
  { id: "sky", name: "The sky's own", how: "", unlocked: () => true },
  stone("foundry", "the Foundry", "Foundry stone"),
  stone("tide", "Tidewater", "Sea stone"),
  stone("city", "Pulse City", "City stone"),
  stone("canyon", "Red Canyon", "Canyon stone"),
  stone("ridge", "Gale Ridge", "Ridge stone"),
  stone("glacier", "the Glacier", "Glacier ice"),
  stone("eclipse", "Eclipse", "Eclipse stone"),
  stone("apex", "Apex", "Apex stone"),
  {
    id: "drill",
    name: "Boring iron",
    how: "Every sky relit",
    unlocked: (save) => Boolean(save.feats["sky-relit"]),
  },
];

export const TRAILS: TrailDef[] = [
  { id: "none", name: "None", how: "", rgb: [0, 0, 0], unlocked: () => true },
  {
    id: "ember",
    name: "Embers",
    how: "Four skies relit",
    rgb: [255, 160, 70],
    unlocked: (save) => Boolean(save.feats["half-sky"]),
  },
  {
    id: "frost",
    name: "Rime",
    how: "A summit with every drop perfect",
    rgb: [150, 225, 255],
    unlocked: (save) => Boolean(save.feats["true-column"]),
  },
  {
    id: "shadow",
    name: "Shadow",
    how: "Beat your own ghost",
    rgb: [170, 120, 255],
    unlocked: (save) => Boolean(save.feats["own-ghost"]),
  },
  {
    id: "star",
    name: "Starlight",
    how: "Every star on every sky",
    rgb: [255, 240, 200],
    unlocked: (save) => Boolean(save.feats["all-stars"]),
  },
];

export const FINISH_IDS = FINISHES.map((f) => f.id);
export const TRAIL_IDS = TRAILS.map((t) => t.id);

export function isFinishId(x: unknown): x is FinishId {
  return typeof x === "string" && (FINISH_IDS as string[]).includes(x);
}

export function isTrailId(x: unknown): x is TrailId {
  return typeof x === "string" && (TRAIL_IDS as string[]).includes(x);
}

/** The stone finish to wear: the chosen one if it's earned, else the sky's own. */
export function finishWorn(save: Save): FinishId {
  const def = FINISHES.find((f) => f.id === save.finish);
  return def && def.unlocked(save) ? def.id : "sky";
}

/** The trail to leave: the chosen one if it's earned, else none. */
export function trailWorn(save: Save): TrailDef | null {
  const def = TRAILS.find((t) => t.id === save.trail);
  return def && def.id !== "none" && def.unlocked(save) ? def : null;
}
