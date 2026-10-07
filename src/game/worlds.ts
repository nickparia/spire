import { LEVELS, type LevelDef } from "./levels";
import type { Save } from "./save";

/**
 * Worlds: each one owns a run of skies, ends on a boss, and sits on the star
 * map as a constellation. Every world keeps the verb, one tap drops one slab,
 * and changes the rest: the direction, what the slab does, the enemy, the
 * goal. The first world is the column under honest gravity.
 */
export type WorldDef = {
  /** Stable key for saved progress. Never reuse or rename. */
  id: string;
  name: string;
  blurb: string;
  /** What the Spire was here, said on the Skies screen. */
  concept: string;
  /** The skies, in order; the last is the boss. */
  levelIds: string[];
  /** One line that lands when the boss falls: why this sky went out. */
  revelation: string;
  /** Where its stars sit on the map, 0..1 of the map's width and height. */
  stars: [number, number][];
};

export const WORLDS: WorldDef[] = [
  {
    id: "hearth",
    name: "Hearth",
    blurb: "The column. Honest gravity, the Dark below.",
    concept: "This is where the Spire was cut and raised. The stone still knows the shape.",
    levelIds: ["foundry", "tide", "city", "canyon", "ridge", "glacier", "eclipse", "apex"],
    revelation: "It was never the Dark below. What put the skies out was waiting above them.",
    stars: [
      [0.18, 0.72],
      [0.27, 0.6],
      [0.33, 0.46],
      [0.42, 0.38],
      [0.5, 0.3],
      [0.6, 0.27],
      [0.69, 0.2],
      [0.78, 0.1],
    ],
  },
];

/** Worlds yet to be written sit on the map as dark patches. */
export const WORLDS_TO_COME = [
  {
    id: "descent",
    name: "The Descent",
    blurb: "Build down. Something is climbing up.",
    at: [0.82, 0.62],
  },
  { id: "wheel", name: "The Wheel", blurb: "A world that turns.", at: [0.22, 0.22] },
] as const;

export function levelsOf(world: WorldDef): LevelDef[] {
  return world.levelIds.map((id) => LEVELS.find((l) => l.id === id)!);
}

export function worldOf(levelId: string): WorldDef {
  return WORLDS.find((w) => w.levelIds.includes(levelId)) ?? WORLDS[0]!;
}

export function isBoss(levelId: string): boolean {
  const w = worldOf(levelId);
  return w.levelIds[w.levelIds.length - 1] === levelId;
}

export function skiesLitIn(save: Save, world: WorldDef): number {
  return world.levelIds.filter((id) => save.levels[id]?.clear).length;
}

export function worldDone(save: Save, world: WorldDef): boolean {
  return skiesLitIn(save, world) >= world.levelIds.length;
}
