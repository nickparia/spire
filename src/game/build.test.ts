import { describe, expect, it } from "vitest";
import {
  BASE_TUNING,
  CAPSTONE_AT,
  familyCount,
  FAST_WINDOW,
  hasCapstone,
  offer,
  tuneFor,
  UPGRADES,
  upgrade,
  windowFor,
  type Picks,
} from "./build";

describe("upgrades", () => {
  it("have unique ids and four per family", () => {
    expect(new Set(UPGRADES.map((u) => u.id)).size).toBe(UPGRADES.length);
    for (const family of ["mason", "striker", "runner"] as const) {
      expect(UPGRADES.filter((u) => u.family === family)).toHaveLength(4);
    }
  });

  it("count toward their family and its capstone", () => {
    const picks: Picks = { keen: 2, spark: 1 };
    expect(familyCount(picks, "striker")).toBe(3);
    expect(familyCount(picks, "mason")).toBe(0);
    expect(hasCapstone(picks, "striker")).toBe(true);
    expect(hasCapstone({ keen: 2 }, "striker")).toBe(false);
  });
});

describe("tuneFor", () => {
  it("changes nothing with no picks", () => {
    expect(tuneFor({})).toEqual(BASE_TUNING);
  });

  it("stacks a repeated pick", () => {
    expect(tuneFor({ keen: 1 }).window).toBeCloseTo(1.15);
    expect(tuneFor({ keen: 2 }).window).toBeCloseTo(1.3);
    expect(tuneFor({ lee: 2 }).drift).toBeCloseTo(0.49);
  });

  it("lets an anchored miss cost nothing", () => {
    expect(tuneFor({ anchor: 1 }).heatMiss).toBe(0);
  });

  it("adds the capstone at three of a family", () => {
    expect(tuneFor({ shield: 2 }).shieldEvery).toBe(0);
    expect(tuneFor({ shield: 2, broad: 1 }).shieldEvery).toBe(8);
    expect(tuneFor({ crit: 2, spark: 1 }).perfectPay).toBeCloseTo(4);
    const flow = tuneFor({ quick: 1, lee: 1, snips: 1 });
    expect(flow.fastWindow).toBeGreaterThan(FAST_WINDOW);
    expect(flow.heatFast).toBeCloseTo(2.4);
  });

  it("widens the window with a steady streak, up to a cap", () => {
    const t = tuneFor({ steady: 1 });
    expect(windowFor(t, 0)).toBeCloseTo(1);
    expect(windowFor(t, 5)).toBeCloseTo(1.15);
    expect(windowFor(t, 50)).toBeCloseTo(1.3);
    expect(windowFor(tuneFor({}), 50)).toBe(1);
  });
});

describe("offer", () => {
  const seeded = (seed: number) => () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  it("offers three distinct upgrades, one from each family", () => {
    for (let s = 1; s < 40; s++) {
      const ids = offer(seeded(s), {});
      expect(new Set(ids).size).toBe(3);
      expect(new Set(ids.map((id) => upgrade(id).family)).size).toBe(3);
    }
  });

  it("never offers an upgrade already taken to its limit", () => {
    const picks: Picks = { shield: 2, broad: 2, footing: 2, anchor: 1 };
    for (let s = 1; s < 40; s++) {
      for (const id of offer(seeded(s), picks)) expect(upgrade(id).family).not.toBe("mason");
    }
  });

  it("fills from other families once one is exhausted", () => {
    const picks: Picks = { shield: 2, broad: 2, footing: 2, anchor: 1 };
    expect(offer(seeded(7), picks)).toHaveLength(3);
  });

  it("offers what is left when fewer than three remain", () => {
    const picks: Picks = {};
    for (const u of UPGRADES) picks[u.id] = u.max;
    picks.tempo = 1;
    expect(offer(seeded(3), picks)).toEqual(["tempo"]);
  });

  it("knows the capstone threshold", () => {
    expect(CAPSTONE_AT).toBe(3);
  });
});
