import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { cleanName, newPlayerId } from "./board";
import { isWeaponId, type WeaponId } from "./build";
import { refundDevices, type Levels, type Tracks } from "./gear";
import { LEVELS } from "./levels";
import { starCount, type Ghost, type Goals } from "./logic";

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
  /** Stat track ranks owned, by class. */
  tracks: Tracks;
  /** Weapon levels, by weapon. Missing means level 1. */
  levels2: Levels;
  /** The class weapon carried into runs. */
  weapon: WeaponId;
  /** The best run's trace on each level, to race against. */
  ghosts: Record<string, Ghost>;
  /** A random id made once: this device on the leaderboard, never a person. */
  playerId: string;
  /** The name shown on the board; empty until chosen. */
  name: string;
  /** Someone from the board whose ghosts you race instead of your own. */
  rival: { id: string; name: string } | null;
  /** The rival's traces by level, fetched when they were picked. */
  rivalGhosts: Record<string, Ghost>;
  /** Feats earned, by id, with when. */
  feats: Record<string, number>;
  /** Shade up to this moment (ISO) has been shown. */
  shadeSeen: string;
  /** The last build whose what's-new window was shown. */
  whatsNewSeen: number;
  /** The premise has been read once. */
  storySeen: boolean;
  /** Chapters told, by id. */
  chaptersSeen: string[];
  /** An update prompt for this build was dismissed. */
  updateSnoozed: number;
  /** Whether others may challenge you. */
  challengesOn: boolean;
  /** Tester tools: every sky open, and the boss a tap away. */
  tester: boolean;
  /** Practice: the Dark stays away; runs are not posted or kept as ghosts. */
  practice: boolean;
  /**
   * Each world's active game: the index of the next sky to play there.
   * New sets it back to 0; stars and records are never touched by it.
   */
  progress: Record<string, number>;
  /** When this save was last written, ms since the epoch. */
  savedAt: number;
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
    tracks: {},
    levels2: {},
    weapon: "buttress",
    ghosts: {},
    playerId: newPlayerId(),
    name: "",
    rival: null,
    rivalGhosts: {},
    feats: {},
    shadeSeen: new Date(0).toISOString(),
    whatsNewSeen: 0,
    storySeen: false,
    chaptersSeen: [],
    updateSnoozed: 0,
    challengesOn: true,
    tester: false,
    practice: false,
    progress: {},
    savedAt: 0,
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
      for (const family of ["mason", "striker", "runner"] as const) {
        const n = num(data.tracks?.[family], 0);
        if (n > 0) save.tracks[family] = Math.floor(n);
      }
      for (const weapon of ["buttress", "chisel", "slipstream"] as const) {
        const n = num(data.levels2?.[weapon], 1);
        if (n > 1) save.levels2[weapon] = Math.floor(n);
      }
      // Saves from the first workshop: hand the device money back.
      const gear = (data as { gear?: Record<string, unknown> }).gear;
      if (gear && typeof gear === "object") save.coins += refundDevices(gear);
      for (const [kind, shown] of Object.entries(data.tips ?? {})) {
        save.tips[kind] = num(shown, 0);
      }
      if (typeof data.playerId === "string" && data.playerId.length >= 8)
        save.playerId = data.playerId;
      if (typeof data.name === "string") save.name = cleanName(data.name);
      const rival = data.rival;
      if (rival && typeof rival.id === "string" && typeof rival.name === "string") {
        save.rival = { id: rival.id, name: cleanName(rival.name) };
        for (const [id, trace] of Object.entries(data.rivalGhosts ?? {})) {
          if (Array.isArray(trace) && trace.every((t) => typeof t === "number")) {
            save.rivalGhosts[id] = trace as number[];
          }
        }
      }
      if (typeof data.shadeSeen === "string" && !Number.isNaN(Date.parse(data.shadeSeen))) {
        save.shadeSeen = data.shadeSeen;
      }
      save.challengesOn = data.challengesOn !== false;
      save.tester = data.tester === true;
      for (const [id, n] of Object.entries(data.progress ?? {})) {
        if (typeof n === "number" && n >= 0) save.progress[id] = Math.floor(n);
      }
      save.practice = data.practice === true;
      save.savedAt = Math.max(0, num(data.savedAt, 0));
      save.whatsNewSeen = Math.max(0, Math.floor(num(data.whatsNewSeen, 0)));
      save.storySeen = data.storySeen === true;
      if (Array.isArray(data.chaptersSeen)) {
        save.chaptersSeen = data.chaptersSeen.filter((x): x is string => typeof x === "string");
      }
      save.updateSnoozed = Math.max(0, Math.floor(num(data.updateSnoozed, 0)));
      for (const [id, at] of Object.entries(data.feats ?? {})) {
        if (typeof at === "number" && at > 0) save.feats[id] = at;
      }
      for (const [id, trace] of Object.entries(data.ghosts ?? {})) {
        if (!Array.isArray(trace) || trace.length < 2) continue;
        const clean: number[] = [];
        for (const t of trace) {
          if (typeof t !== "number" || !Number.isFinite(t) || t < (clean[clean.length - 1] ?? 0))
            break;
          clean.push(t);
        }
        if (clean.length >= 2) save.ghosts[id] = clean;
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

/**
 * Written twice: to the page's storage, which is instant, and to the native
 * store on a phone, which survives the WebView's storage being dropped.
 */
export function storeSave(save: Save): void {
  save.savedAt = Date.now();
  let text = "";
  try {
    text = JSON.stringify(save);
    localStorage.setItem(SAVE_KEY, text);
  } catch {
    /* private mode */
  }
  if (text && Capacitor.isNativePlatform()) {
    Preferences.set({ key: SAVE_KEY, value: text }).catch(() => undefined);
  }
}

/** The native copy, if it is newer than what the page has. */
export async function restoreNativeSave(current: Save): Promise<Save | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { value } = await Preferences.get({ key: SAVE_KEY });
    if (!value) return null;
    const native = parseSave(value);
    return native.savedAt > current.savedAt ? native : null;
  } catch {
    return null;
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

/** Skies relit so far: what the workshop's locks count. */
export function skiesLit(save: Save): number {
  return LEVELS.filter((level) => save.levels[level.id]?.clear).length;
}

/** A level opens once the one before it has been cleared. */
export function isUnlocked(save: Save, index: number): boolean {
  if (index <= 0 || save.tester) return true;
  const before = LEVELS[index - 1];
  return Boolean(before && save.levels[before.id]?.clear);
}

/** Where "Play" should drop you: the first level not yet cleared. */
export function nextLevelIndex(save: Save): number {
  const index = LEVELS.findIndex((level) => !save.levels[level.id]?.clear);
  return index === -1 ? LEVELS.length - 1 : index;
}
