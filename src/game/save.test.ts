import { describe, expect, it } from "vitest";
import { LEVELS } from "./levels";
import {
  emptySave,
  isUnlocked,
  levelStars,
  nextLevelIndex,
  parseSave,
  recordRun,
  totalStars,
} from "./save";

const first = LEVELS[0]!.id;
const second = LEVELS[1]!.id;

describe("parseSave", () => {
  it("starts fresh with nothing in storage", () => {
    // Every fresh save mints its own player id.
    expect(parseSave(null, null)).toEqual({ ...emptySave(), playerId: expect.any(String) });
  });

  it("carries a v1 best score and mute switch forward", () => {
    const save = parseSave(null, JSON.stringify({ v: 1, best: 310, bestFloors: 22, muted: true }));
    expect(save.endless).toEqual({ best: 310, bestFloors: 22 });
    expect(save.music).toBe(false);
    expect(save.sfx).toBe(false);
  });

  it("prefers the v2 save once it exists", () => {
    const v2 = JSON.stringify({ ...emptySave(), endless: { best: 50, bestFloors: 5 } });
    const save = parseSave(v2, JSON.stringify({ best: 999 }));
    expect(save.endless.best).toBe(50);
  });

  it("survives garbage without throwing", () => {
    expect(parseSave("{not json", "also not json")).toEqual({
      ...emptySave(),
      playerId: expect.any(String),
    });
    const odd = parseSave(JSON.stringify({ levels: { [first]: { bestTime: "fast" }, x: null } }));
    expect(odd.levels[first]).toMatchObject({ clear: false, bestTime: null, runs: 0 });
    expect(odd.levels.x).toBeUndefined();
  });
});

describe("tips", () => {
  it("remember how often each one has been shown", () => {
    const save = parseSave(JSON.stringify({ ...emptySave(), tips: { bomb: 2, shield: "x" } }));
    expect(save.tips).toEqual({ bomb: 2, shield: 0 });
  });

  it("default to none for a save written before tips existed", () => {
    const old = JSON.stringify({ v: 2, music: true, sfx: true, levels: {}, endless: {} });
    expect(parseSave(old).tips).toEqual({});
  });
});

describe("wallet", () => {
  it("keeps coins, track ranks and weapon levels", () => {
    const save = parseSave(
      JSON.stringify({ ...emptySave(), coins: 340, tracks: { mason: 2 }, levels2: { chisel: 3 } }),
    );
    expect(save.coins).toBe(340);
    expect(save.tracks).toEqual({ mason: 2 });
    expect(save.levels2).toEqual({ chisel: 3 });
  });

  it("starts empty for a save written before coins existed", () => {
    const old = JSON.stringify({ v: 2, music: true, sfx: true, levels: {}, endless: {} });
    expect(parseSave(old)).toMatchObject({ coins: 0, tracks: {}, levels2: {} });
  });

  it("refunds devices from the first workshop", () => {
    const old = JSON.stringify({ ...emptySave(), coins: 10, gear: { brace: 1 } });
    expect(parseSave(old).coins).toBe(160);
  });

  it("never loads a negative or fractional balance", () => {
    expect(parseSave(JSON.stringify({ ...emptySave(), coins: -50 })).coins).toBe(0);
    expect(parseSave(JSON.stringify({ ...emptySave(), coins: 12.9 })).coins).toBe(12);
    expect(parseSave(JSON.stringify({ ...emptySave(), coins: "lots" })).coins).toBe(0);
  });
});

describe("recordRun", () => {
  it("records a first clear as a new best on both counts", () => {
    const save = emptySave();
    const out = recordRun(save, first, 20, 0.9, { clear: true, precise: true, swift: false });
    expect(out).toMatchObject({ newBestTime: true, newBestAccuracy: true, previousTime: null });
    expect(out.fresh).toEqual({ clear: true, precise: true, swift: false });
    expect(save.levels[first]).toMatchObject({ bestTime: 20, bestAccuracy: 0.9, runs: 1 });
  });

  it("tracks best time and best accuracy independently", () => {
    const save = emptySave();
    recordRun(save, first, 20, 0.95, { clear: true, precise: true, swift: false });
    const out = recordRun(save, first, 15, 0.7, { clear: true, precise: false, swift: true });
    expect(out).toMatchObject({ newBestTime: true, newBestAccuracy: false, previousTime: 20 });
    expect(save.levels[first]).toMatchObject({ bestTime: 15, bestAccuracy: 0.95, runs: 2 });
  });

  it("keeps stars once earned and flags only the new ones", () => {
    const save = emptySave();
    recordRun(save, first, 20, 0.95, { clear: true, precise: true, swift: false });
    const out = recordRun(save, first, 15, 0.7, { clear: true, precise: false, swift: true });
    expect(out.fresh).toEqual({ clear: false, precise: false, swift: true });
    expect(levelStars(save, first)).toBe(3);
  });

  it("leaves records alone on a worse run", () => {
    const save = emptySave();
    recordRun(save, first, 15, 0.95, { clear: true, precise: true, swift: true });
    const out = recordRun(save, first, 30, 0.6, { clear: true, precise: false, swift: false });
    expect(out).toMatchObject({ newBestTime: false, newBestAccuracy: false });
    expect(save.levels[first]).toMatchObject({ bestTime: 15, bestAccuracy: 0.95 });
  });
});

describe("progress", () => {
  it("opens levels one clear at a time", () => {
    const save = emptySave();
    expect(isUnlocked(save, 0)).toBe(true);
    expect(isUnlocked(save, 1)).toBe(false);
    expect(nextLevelIndex(save)).toBe(0);
    recordRun(save, first, 20, 0.9, { clear: true, precise: false, swift: false });
    expect(isUnlocked(save, 1)).toBe(true);
    expect(isUnlocked(save, 2)).toBe(false);
    expect(nextLevelIndex(save)).toBe(1);
  });

  it("adds stars up across levels", () => {
    const save = emptySave();
    recordRun(save, first, 20, 0.9, { clear: true, precise: true, swift: true });
    recordRun(save, second, 20, 0.9, { clear: true, precise: false, swift: false });
    expect(totalStars(save)).toBe(4);
  });

  it("parks on the last offered level once everything is cleared", () => {
    const save = emptySave();
    for (const level of LEVELS) {
      recordRun(save, level.id, 20, 0.9, { clear: true, precise: false, swift: false });
    }
    // The last level of the last offered world, never a parked world's.
    expect(LEVELS[nextLevelIndex(save)]!.id).toBe("apex");
  });
});

describe("nextLevelIndex", () => {
  it("never points the menu at a parked world's level", async () => {
    const { nextLevelIndex, emptySave } = await import("./save");
    const { LEVELS } = await import("./levels");
    const { WORLDS } = await import("./worlds");
    const save = emptySave();
    for (const w of WORLDS)
      for (const id of w.levelIds)
        save.levels[id] = {
          clear: true,
          precise: true,
          swift: true,
          bestTime: 1,
          bestAccuracy: 1,
          runs: 1,
        };
    const next = LEVELS[nextLevelIndex(save)]!;
    expect(WORLDS.some((w) => w.levelIds.includes(next.id))).toBe(true);
  });
});
