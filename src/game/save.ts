import { isWeaponId, type WeaponId } from "./build";
import { LEVELS } from "./levels";
import { starCount, type Goals } from "./logic";

const SAVE_KEY = "spire-v2";
const LEGACY_KEY = "spire-v1";

export type LevelRecord = Goals & {
  bestTime: number | null;
  bestAccuracy: number | null;
  runs: number;
};

export type Save = {
  v: 2;
  music: boolean;
  sfx: boolean;
  levels: Record<string, LevelRecord>;
  endless: { best: number; bestFloors: number };
  /** How many times each pickup or hazard has explained itself. */
  tips: Record<string, number>;
  /** Coins in the wallet. */
  coins: number;
  /** Workshop tiers owned, by device id. */
  gear: Record<string, number>;
  /** The class weapon carried into runs. */
  weapon: WeaponId;
};

export function emptySave(): Save {
  return {
    v: 2,
    music: true,
    sfx: true,
    levels: {},
    endless: { best: 0, bestFloors: 0 },
    tips: {},
    coins: 0,
    gear: {},
    weapon: "buttress",
  };
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function numOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Builds a save from whatever is in storage. Anything malformed is dropped
 * field by field, so one bad value never costs a player the rest.
 */
export function parseSave(raw: string | null, legacy: string | null = null): Save {
  const save = emptySave();
  if (raw) {
    try {
      const data = JSON.parse(raw) as Partial<Save>;
      save.music = data.music !== false;
      save.sfx = data.sfx !== false;
      save.endless.best = num(data.endless?.best, 0);
      save.endless.bestFloors = num(data.endless?.bestFloors, 0);
      save.coins = Math.max(0, Math.floor(num(data.coins, 0)));
      if (isWeaponId(data.weapon)) save.weapon = data.weapon;
      for (const [id, owned] of Object.entries(data.gear ?? {})) {
        save.gear[id] = Math.max(0, Math.floor(num(owned, 0)));
      }
      for (const [kind, shown] of Object.entries(data.tips ?? {})) {
        save.tips[kind] = num(shown, 0);
      }
      for (const [id, rec] of Object.entries(data.levels ?? {})) {
        if (!rec || typeof rec !== "object") continue;
        save.levels[id] = {
          clear: Boolean(rec.clear),
          precise: Boolean(rec.precise),
          swift: Boolean(rec.swift),
          bestTime: numOrNull(rec.bestTime),
          bestAccuracy: numOrNull(rec.bestAccuracy),
          runs: num(rec.runs, 0),
        };
      }
      return save;
    } catch {
      /* fall through to the legacy save */
    }
  }
  if (legacy) {
    // v1 was endless only: carry the best score and the mute switch across.
    try {
      const old = JSON.parse(legacy) as { best?: unknown; bestFloors?: unknown; muted?: unknown };
      save.endless.best = num(old.best, 0);
      save.endless.bestFloors = num(old.bestFloors, 0);
      if (old.muted) {
        save.music = false;
        save.sfx = false;
      }
    } catch {
      /* start fresh */
    }
  }
  return save;
}

export function loadSave(): Save {
  try {
    return parseSave(localStorage.getItem(SAVE_KEY), localStorage.getItem(LEGACY_KEY));
  } catch {
    return emptySave();
  }
}

export function storeSave(save: Save): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* private mode */
  }
}

export type RunOutcome = {
  /** Records before this run, for showing what was beaten. */
  previousTime: number | null;
  previousAccuracy: number | null;
  newBestTime: boolean;
  newBestAccuracy: boolean;
  /** Goals met for the first time on this run. */
  fresh: Goals;
};

/**
 * Folds a finished run into the save. Stars are kept once earned, and the
 * best time and best accuracy are tracked separately — a speed run and a
 * careful run can each set a record.
 */
export function recordRun(
  save: Save,
  levelId: string,
  time: number,
  accuracy: number,
  goals: Goals,
): RunOutcome {
  const prev = save.levels[levelId];
  const previousTime = prev?.bestTime ?? null;
  const previousAccuracy = prev?.bestAccuracy ?? null;
  const newBestTime = previousTime === null || time < previousTime;
  const newBestAccuracy = previousAccuracy === null || accuracy > previousAccuracy;
  save.levels[levelId] = {
    clear: Boolean(prev?.clear) || goals.clear,
    precise: Boolean(prev?.precise) || goals.precise,
    swift: Boolean(prev?.swift) || goals.swift,
    bestTime: newBestTime ? time : previousTime,
    bestAccuracy: newBestAccuracy ? accuracy : previousAccuracy,
    runs: (prev?.runs ?? 0) + 1,
  };
  return {
    previousTime,
    previousAccuracy,
    newBestTime,
    newBestAccuracy,
    fresh: {
      clear: goals.clear && !prev?.clear,
      precise: goals.precise && !prev?.precise,
      swift: goals.swift && !prev?.swift,
    },
  };
}

export function levelStars(save: Save, levelId: string): number {
  const rec = save.levels[levelId];
  return rec ? starCount(rec) : 0;
}

export function totalStars(save: Save): number {
  return LEVELS.reduce((sum, level) => sum + levelStars(save, level.id), 0);
}

/** A level opens once the one before it has been cleared. */
export function isUnlocked(save: Save, index: number): boolean {
  if (index <= 0) return true;
  const before = LEVELS[index - 1];
  return Boolean(before && save.levels[before.id]?.clear);
}

/** Where "Play" should drop you: the first level not yet cleared. */
export function nextLevelIndex(save: Save): number {
  const index = LEVELS.findIndex((level) => !save.levels[level.id]?.clear);
  return index === -1 ? LEVELS.length - 1 : index;
}
