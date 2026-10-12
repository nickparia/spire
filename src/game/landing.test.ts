import { describe, expect, it } from "vitest";
import {
  COMBOS,
  LANDINGS,
  TIERS,
  combosOf,
  comboWith,
  landingBlurb,
  landingOffer,
  type LandingId,
} from "./landing";

describe("the hand", () => {
  it("makes a power of two cards held, whatever their tiers", () => {
    expect(combosOf({})).toEqual([]);
    expect(combosOf({ fire: 1 })).toEqual([]);
    expect(combosOf({ fire: 1, storm: 3 })).toEqual(["firestorm"]);
    expect(combosOf({ frost: 2, stone: 1, shadow: 1, storm: 1 })).toEqual(["winter", "breath"]);
  });

  it("knows which card would complete a power", () => {
    expect(comboWith({ fire: 1 }, "storm")).toBe("firestorm");
    expect(comboWith({ fire: 1 }, "frost")).toBeNull();
    expect(comboWith({ fire: 1, storm: 1 }, "storm")).toBeNull();
  });

  it("has a blurb for every card at every tier, and every combo names two cards", () => {
    for (const def of LANDINGS) {
      for (let tier = 1; tier <= TIERS; tier++)
        expect(landingBlurb(def.id, tier).length).toBeGreaterThan(10);
    }
    const ids = new Set(LANDINGS.map((l) => l.id));
    for (const c of COMBOS) for (const id of c.of) expect(ids.has(id)).toBe(true);
  });
});

describe("the offer", () => {
  const seq = (values: number[]) => {
    let i = 0;
    return () => values[i++ % values.length]!;
  };

  it("offers two different cards", () => {
    for (let n = 0; n < 50; n++) {
      const [a, b] = landingOffer(Math.random, true);
      expect(a).not.toBe(b);
    }
  });

  it("leans towards a card that would make a power", () => {
    const hand = { fire: 1 };
    let made = 0;
    for (let n = 0; n < 200; n++) {
      const offer = landingOffer(Math.random, true, ["fire"], null, hand);
      if (offer.includes("storm")) made++;
    }
    expect(made).toBeGreaterThan(80);
  });

  it("leans towards kindling a card held below III, never one already at III", () => {
    let kindled = 0;
    for (let n = 0; n < 200; n++) {
      if (landingOffer(Math.random, true, ["frost"], null, { frost: 1 }).includes("frost"))
        kindled++;
    }
    // Rime held: a Bedrock (The Long Winter) is leaned to first, so the kindle shows about a third of the time.
    expect(kindled).toBeGreaterThan(35);
    const rand = seq([0.1, 0.1, 0.1, 0.1, 0.1, 0.1]);
    for (let n = 0; n < 20; n++) {
      const offer = landingOffer(rand, true, ["frost"], null, { frost: TIERS });
      expect(offer).not.toContain("frost" as LandingId);
    }
  });
});
