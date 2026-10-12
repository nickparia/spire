import { describe, expect, it } from "vitest";
import { EVENTS, EVENT_BY_ID, deckFor, pickEvents } from "./events";
import { isLanding } from "./landing";

describe("events", () => {
  it("deals two from the world's deck, apart, clear of the landings and the summit", () => {
    for (let n = 0; n < 200; n++) {
      const goal = 24 + (n % 20);
      const picked = pickEvents(Math.random, "hearth", "foundry", goal);
      expect(picked.length).toBe(2);
      expect(picked[0]!.id).not.toBe(picked[1]!.id);
      for (const p of picked) {
        expect(EVENT_BY_ID[p.id]!.worlds).toContain("hearth");
        expect(p.at).toBeLessThan(goal - 3);
        expect(p.at).toBeGreaterThanOrEqual(EVENT_BY_ID[p.id]!.from);
        for (let d = -3; d <= 3; d++) expect(isLanding(p.at + d, goal)).toBe(false);
      }
      expect(Math.abs(picked[0]!.at - picked[1]!.at)).toBeGreaterThan(5);
    }
  });

  it("gives each Hearth sky its own deck, and the Apex all of them", () => {
    const foundry = deckFor("hearth", "foundry").map((e) => e.id);
    expect(foundry).toEqual(expect.arrayContaining(["lanterns", "sleep", "forge", "crane"]));
    expect(foundry).not.toContain("lightning");
    expect(foundry).not.toContain("whiteout");
    expect(deckFor("hearth", "glacier").map((e) => e.id)).toContain("hoarfrost");
    expect(deckFor("hearth", "eclipse").map((e) => e.id)).toContain("lightning");
    const apex = deckFor("hearth", "apex").map((e) => e.id);
    for (const e of EVENTS.filter((e) => e.worlds.includes("hearth"))) expect(apex).toContain(e.id);
    for (let n = 0; n < 100; n++) {
      const gale = pickEvents(Math.random, "gale", "ridge", 26).map((p) => p.id);
      for (const id of gale) expect(EVENT_BY_ID[id]!.worlds).toContain("gale");
    }
  });

  it("deals nothing on a short sky", () => {
    expect(pickEvents(Math.random, "hearth", "foundry", 10)).toEqual([]);
  });
});
