import { describe, expect, it } from "vitest";
import {
  BASE_REACH,
  dropCoins,
  GEAR,
  kitFor,
  nextTier,
  ownedTier,
  purchase,
  summitCoins,
} from "./gear";
import { FORGE_GROW, resolveDrop } from "./logic";

const none = { clear: false, precise: false, swift: false };
const all = { clear: true, precise: true, swift: true };

describe("dropCoins", () => {
  it("pays a perfect, and pays a streak more, up to a cap", () => {
    const pay = (streak: number) =>
      dropCoins({ perfect: true, streak, forged: false, keystone: false, accuracy: 1 });
    expect(pay(1)).toBe(2);
    expect(pay(3)).toBe(4);
    expect(pay(5)).toBe(6);
    expect(pay(40)).toBe(6);
  });

  it("pays extra for a forge and for a keystone", () => {
    const base = { perfect: true, streak: 5, accuracy: 1 };
    expect(dropCoins({ ...base, forged: true, keystone: false })).toBe(11);
    expect(dropCoins({ ...base, forged: false, keystone: true })).toBe(11);
  });

  it("pays one coin for a clean near-miss and nothing for a sloppy one", () => {
    const miss = { perfect: false, streak: 0, forged: false, keystone: false };
    expect(dropCoins({ ...miss, accuracy: 0.8 })).toBe(1);
    expect(dropCoins({ ...miss, accuracy: 0.74 })).toBe(0);
  });
});

describe("summitCoins", () => {
  it("pays more for later levels", () => {
    expect(summitCoins(0, 0.9, all, none).clear).toBe(20);
    expect(summitCoins(7, 0.9, all, none).clear).toBe(55);
  });

  it("scales the accuracy purse from 60% up", () => {
    expect(summitCoins(0, 0.5, all, none).accuracy).toBe(0);
    expect(summitCoins(0, 0.85, all, none).accuracy).toBe(25);
    expect(summitCoins(0, 1, all, none).accuracy).toBe(40);
  });

  it("pays for pace only when the par was beaten", () => {
    expect(summitCoins(0, 0.9, all, none).pace).toBe(20);
    expect(summitCoins(0, 0.9, { ...all, swift: false }, none).pace).toBe(0);
  });

  it("pays for each star once, the first time it is earned", () => {
    expect(summitCoins(0, 0.9, all, all).stars).toBe(90);
    expect(summitCoins(0, 0.9, all, { ...none, swift: true }).stars).toBe(30);
    expect(summitCoins(0, 0.9, all, none).stars).toBe(0);
  });
});

describe("workshop", () => {
  it("has unique device ids and rising prices", () => {
    expect(new Set(GEAR.map((g) => g.id)).size).toBe(GEAR.length);
    for (const gear of GEAR) {
      for (let i = 1; i < gear.tiers.length; i++) {
        expect(gear.tiers[i]!.cost).toBeGreaterThan(gear.tiers[i - 1]!.cost);
      }
    }
  });

  it("sells the next tier when the wallet covers it", () => {
    const deal = purchase(100, {}, "windbreak");
    expect(deal).toEqual({ coins: 20, owned: { windbreak: 1 } });
    expect(purchase(200, { windbreak: 1 }, "windbreak")).toEqual({
      coins: 0,
      owned: { windbreak: 2 },
    });
  });

  it("refuses when short, and leaves the caller's data alone", () => {
    const owned = { windbreak: 1 };
    expect(purchase(199, owned, "windbreak")).toBeNull();
    expect(owned).toEqual({ windbreak: 1 });
  });

  it("stops selling once a device is fully built", () => {
    expect(nextTier({ brace: 2 }, "brace")).toBeNull();
    expect(purchase(99_999, { brace: 2 }, "brace")).toBeNull();
  });

  it("ignores tiers a save could not have earned", () => {
    expect(ownedTier({ brace: 99 }, "brace")).toBe(2);
    expect(ownedTier({ brace: -3 }, "brace")).toBe(0);
    expect(ownedTier({ brace: Number.NaN }, "brace")).toBe(0);
  });
});

describe("kitFor", () => {
  it("changes nothing with an empty workshop", () => {
    expect(kitFor({})).toEqual({
      drift: 1,
      fuse: 1,
      shields: 0,
      footing: 1,
      reach: BASE_REACH,
      forgeGrow: FORGE_GROW,
      coins: 1,
    });
  });

  it("makes every device better with every tier", () => {
    const one = kitFor({
      windbreak: 1,
      cutter: 1,
      brace: 1,
      footing: 1,
      magnet: 1,
      temper: 1,
      mint: 1,
    });
    const top = kitFor({
      windbreak: 3,
      cutter: 3,
      brace: 2,
      footing: 3,
      magnet: 3,
      temper: 3,
      mint: 3,
    });
    const base = kitFor({});
    expect(one.drift).toBeLessThan(base.drift);
    expect(top.drift).toBeLessThan(one.drift);
    expect(top.drift).toBeGreaterThan(0);
    expect(top.fuse).toBeLessThan(one.fuse);
    expect(top.shields).toBeGreaterThan(one.shields);
    expect(top.footing).toBeGreaterThan(one.footing);
    expect(top.reach).toBeGreaterThan(one.reach);
    expect(top.forgeGrow).toBeGreaterThan(one.forgeGrow);
    expect(top.coins).toBeGreaterThan(one.coins);
  });

  it("feeds a stronger forge into the drop rules", () => {
    const drop = { prevX: 0, prevW: 100, moverX: 0, moverW: 100, tol: 10, startW: 200, streak: 4 };
    const plain = resolveDrop(drop);
    const tempered = resolveDrop({ ...drop, forgeGrow: kitFor({ temper: 3 }).forgeGrow });
    expect(plain.ok && plain.w).toBeCloseTo(114);
    expect(tempered.ok && tempered.w).toBeCloseTo(126);
  });
});
