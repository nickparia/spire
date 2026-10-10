import type { Save } from "./save";
import { WORLDS, type WorldDef } from "./worlds";

/**
 * A world's active game: where Continue picks up. Saves from before it was
 * kept fall back to the first sky not yet relit.
 */
export function nextSkyIn(save: Save, world: WorldDef): number {
  const kept = save.progress[world.id];
  if (kept !== undefined) return Math.min(kept, world.levelIds.length);
  const first = world.levelIds.findIndex((id) => !save.levels[id]?.clear);
  return first === -1 ? world.levelIds.length : first;
}

/** A world is open once the one before it has every sky relit. */
export function worldOpen(save: Save, index: number): boolean {
  if (index <= 0 || save.tester) return true;
  // A grey-box world is there to be felt by everyone testing: never gated.
  if (WORLDS[index]?.id === "ring") return true;
  const before = WORLDS[index - 1]!;
  return before.levelIds.every((id) => save.levels[id]?.clear);
}
