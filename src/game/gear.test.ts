import { describe, expect, it } from "vitest";
import {
  BASE_REACH,
  buyLevel,
  buyRank,
  dropCoins,
  forgeOffers,
  houseOf,
  kitFor,
  levelNeeds,
  levelOf,
  nextLevelCost,
  nextRank,
  priceFor,
  RANK_UNLOCKS,
  rankNeeds,
  rankOf,
  refundDevices,
  summitCoins,
  TRACKS,
  WEAPON_COSTS,
  WEAPON_LEVELS,
  WEAPON_PERKS,
} from "./gear";

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

  it("pays one coin for a clean near-miss and nothing for a sloppy one", () => {
    const miss = { perfect: false, streak: 0, forged: false, keystone: false };
    expect(dropCoins({ ...miss, accuracy: 0.8 })).toBe(1);
    expect(dropCoins({ ...miss, accuracy: 0.74 })).toBe(0);
  });
});

describe("summitCoins", () => {
  it("pays more for later levels and for each first-time star", () => {
    expect(summitCoins(0, 0.9, all, none).clear).toBe(20);
    expect(summitCoins(7, 0.9, all, none).clear).toBe(55);
    expect(summitCoins(0, 0.9, all, all).stars).toBe(90);
    expect(summitCoins(0, 0.9, all, none).stars).toBe(0);
  });

  it("scales the accuracy purse from 60% up", () => {
    expect(summitCoins(0, 0.5, all, none).accuracy).toBe(0);
    expect(summitCoins(0, 1, all, none).accuracy).toBe(40);
  });
});

describe("tracks", () => {
  it("have five ranks each at rising prices, and stay quality of life", () => {
    expect(TRACKS).toHaveLength(3);
    for (const track of TRACKS) {
      expect(track.ranks).toHaveLength(5);
      for (let i = 1; i < track.ranks.length; i++) {
        expect(track.ranks[i]!.cost).toBeGreaterThan(track.ranks[i - 1]!.cost);
      }
    }
  });

  it("sell ranks in order, only when open and the wallet covers them", () => {
    expect(nextRank({}, "mason")?.name).toBe("Brace");
    // Bought outside your house: full price.
    const first = buyRank(150, {}, "mason", 0, "runner");
    expect(first).toEqual({ coins: 30, tracks: { mason: 1 } });
    expect(nextRank(first!.tracks, "mason")?.name).toBe("Second Wind");
    // The second rank needs a sky lit first.
    expect(rankNeeds(first!.tracks, "mason", 0)).toBe(1);
    expect(buyRank(999, first!.tracks, "mason", 0, "runner")).toBeNull();
    expect(buyRank(999, first!.tracks, "mason", 1, "runner")).toEqual({
      coins: 999 - 260,
      tracks: { mason: 2 },
    });
    expect(buyRank(259, first!.tracks, "mason", 1, "runner")).toBeNull();
  });

  it("open up across the game", () => {
    expect(RANK_UNLOCKS).toEqual([0, 1, 2, 4, 6]);
    expect(rankNeeds({ mason: 4 }, "mason", 3)).toBe(3);
    expect(rankNeeds({ mason: 4 }, "mason", 6)).toBe(0);
  });

  it("stop at the top and ignore ranks a save could not have", () => {
    expect(nextRank({ mason: 5 }, "mason")).toBeNull();
    expect(buyRank(99_999, { mason: 5 }, "mason", 8)).toBeNull();
    expect(rankOf({ mason: 42 }, "mason")).toBe(5);
    expect(rankOf({ mason: -1 }, "mason")).toBe(0);
    expect(rankOf({ mason: Number.NaN }, "mason")).toBe(0);
  });
});

describe("weapon levels", () => {
  it("start at one and climb to five", () => {
    expect(levelOf({}, "chisel")).toBe(1);
    expect(levelOf({ chisel: 9 }, "chisel")).toBe(WEAPON_LEVELS);
    expect(WEAPON_COSTS).toHaveLength(WEAPON_LEVELS);
    for (const perks of Object.values(WEAPON_PERKS)) expect(perks).toHaveLength(WEAPON_LEVELS);
  });

  it("sell the next level when open, and stop at mastery", () => {
    expect(nextLevelCost({}, "buttress")).toBe(200);
    expect(buyLevel(200, {}, "buttress", 0, "runner")).toEqual({
      coins: 0,
      levels: { buttress: 2 },
    });
    expect(buyLevel(199, {}, "buttress", 0, "runner")).toBeNull();
    expect(levelNeeds({ buttress: 2 }, "buttress", 1)).toBe(1);
    expect(buyLevel(999, { buttress: 2 }, "buttress", 1, "runner")).toBeNull();
    expect(buyLevel(999, { buttress: 2 }, "buttress", 2, "runner")).not.toBeNull();
    expect(nextLevelCost({ buttress: 5 }, "buttress")).toBeNull();
  });
});

describe("houses", () => {
  it("name the class you have built most, with the carried weapon breaking ties", () => {
    expect(houseOf({}, "chisel")).toBe("striker");
    expect(houseOf({ mason: 2, runner: 1 }, "chisel")).toBe("mason");
    expect(houseOf({ mason: 2, runner: 2 }, "slipstream")).toBe("runner");
  });

  it("charge a quarter less within your house", () => {
    expect(priceFor(200, "mason", "mason")).toBe(150);
    expect(priceFor(200, "mason", "striker")).toBe(200);
    expect(buyRank(90, {}, "mason", 0, "mason")).toEqual({ coins: 0, tracks: { mason: 1 } });
    expect(buyRank(89, {}, "mason", 0, "mason")).toBeNull();
  });

  it("put the next rank of every track and the carried weapon's next level on the table", () => {
    const offers = forgeOffers(500, { striker: 1 }, {}, "chisel", 1);
    expect(offers.map((o) => o.kind + ":" + o.family).sort()).toEqual([
      "level:striker",
      "rank:mason",
      "rank:runner",
      "rank:striker",
    ]);
    const magnet = offers.find((o) => o.name === "Magnet")!;
    expect(magnet.house).toBe(true);
    expect(magnet.price).toBe(195);
    expect(offers.find((o) => o.name === "Brace")!.price).toBe(120);
  });

  it("lead with what is open and affordable, and still show what is locked", () => {
    const offers = forgeOffers(100, {}, {}, "buttress", 0);
    expect(offers[0]!.needs).toBe(0);
    expect(offers[0]!.affordable).toBe(true);
    const locked = forgeOffers(9999, { mason: 1 }, {}, "buttress", 0).find(
      (o) => o.family === "mason" && o.kind === "rank",
    )!;
    expect(locked.needs).toBe(1);
  });
});

describe("kitFor", () => {
  it("changes nothing with an empty workshop", () => {
    expect(kitFor({}, {}, "buttress")).toMatchObject({
      shields: 0,
      secondWind: false,
      footing: 1,
      sway: 1,
      sight: false,
      reach: BASE_REACH,
      perfectPay: 1,
      mark: false,
      fuse: 1,
      breather: 0,
      coins: 1,
      fastBonus: 0,
      charge: 1,
      fireShield: false,
      chiselPay: 3,
      slipSlabs: 3,
    });
  });

  it("makes each track better rank by rank", () => {
    const m = [0, 1, 2, 3, 4, 5].map((n) => kitFor({ mason: n }, {}, "buttress"));
    expect(m[1]!.shields).toBe(1);
    expect(m[2]!.secondWind).toBe(true);
    expect(m[3]!.footing).toBeGreaterThan(1);
    expect(m[4]!.sway).toBeLessThan(1);
    expect(m[5]!.shields).toBe(2);
    const s = kitFor({ striker: 5 }, {}, "chisel");
    expect(s.sight).toBe(true);
    expect(s.reach).toBe(45);
    expect(s.perfectPay).toBe(1.5);
    expect(s.mark).toBe(true);
    const r = kitFor({ runner: 5 }, {}, "slipstream");
    expect(r.fuse).toBe(0.5);
    expect(r.breather).toBe(3);
    expect(r.coins).toBe(1.2);
    expect(r.fastBonus).toBe(0.2);
  });

  it("gives weapon perks only to the weapon carried", () => {
    expect(kitFor({}, { buttress: 5 }, "buttress")).toMatchObject({
      charge: 1.25,
      fireShield: true,
      fireCoins: 20,
    });
    expect(kitFor({}, { buttress: 5 }, "chisel")).toMatchObject({
      charge: 1,
      fireShield: false,
      fireCoins: 0,
    });
    expect(kitFor({}, { chisel: 3 }, "chisel")).toMatchObject({ chiselPay: 4, chiselCharges: 1 });
    expect(kitFor({}, { chisel: 5 }, "chisel")).toMatchObject({ chiselCharges: 2 });
    expect(kitFor({}, { slipstream: 5 }, "slipstream")).toMatchObject({
      slipSlabs: 5,
      slipCalm: true,
    });
  });
});

describe("refundDevices", () => {
  it("hands back what the old devices cost", () => {
    expect(refundDevices({ brace: 1, windbreak: 2 })).toBe(150 + 80 + 200);
    expect(refundDevices({})).toBe(0);
    expect(refundDevices({ unknown: 3, mint: "x" })).toBe(0);
  });
});
