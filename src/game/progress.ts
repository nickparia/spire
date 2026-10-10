import type { Save } from "./save";
import { starCount } from "./logic";
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
  const world = WORLDS[index]!;
  if (world.opensWith) {
    // An element's world: three stars on its sky in Hearth opens it.
    const rec = save.levels[world.opensWith];
    return !!rec && starCount(rec) >= 3;
  }
  const before = WORLDS[index - 1]!;
  return before.levelIds.every((id) => save.levels[id]?.clear);
}
