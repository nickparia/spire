import { describe, expect, it } from "vitest";
import { isLanding } from "./landing";
import {
  formatUntil,
  untilNextVigil,
  vigilBetter,
  vigilDate,
  vigilDay,
  vigilDeal,
  vigilEvents,
  vigilLevel,
  vigilPlan,
  VIGIL_FLOORS,
  VIGIL_LANDING_EVERY,
} from "./vigil";

const DAYS = Array.from(
  { length: 60 },
  (_, i) => `2026-10-${String(1 + (i % 30)).padStart(2, "0")}`,
)
  .concat(Array.from({ length: 30 }, (_, i) => `2026-11-${String(1 + i).padStart(2, "0")}`))
  .filter((d, i, all) => all.indexOf(d) === i);

describe("the Vigil", () => {
  it("is the same sky for the same day, and another for another day", () => {
    expect(vigilLevel("2026-10-13")).toEqual(vigilLevel("2026-10-13"));
    expect(vigilEvents("2026-10-13")).toEqual(vigilEvents("2026-10-13"));
    const differ = DAYS.filter(
      (d) => JSON.stringify(vigilLevel(d)) !== JSON.stringify(vigilLevel("2026-10-13")),
    );
    expect(differ.length).toBeGreaterThan(DAYS.length - 3);
  });

  it("stands a hundred floors, with a landing every twenty", () => {
    const plan = vigilPlan("2026-10-13");
    expect(plan.goal).toBe(VIGIL_FLOORS);
    expect(plan.landingEvery).toBe(VIGIL_LANDING_EVERY);
    const landings = [];
    for (let f = 1; f <= VIGIL_FLOORS; f++)
      if (isLanding(f, VIGIL_FLOORS, plan.landingEvery)) landings.push(f);
    expect(landings).toEqual([20, 40, 60, 80]);
    expect(plan.pickAt(20)).toBe(false);
  });

  it("draws its courses without a repeat in a row, the split only in the last third", () => {
    for (const day of DAYS) {
      const level = vigilLevel(day);
      expect(level.courses.length).toBeGreaterThanOrEqual(5);
      expect(level.courses.length).toBeLessThanOrEqual(7);
      level.courses.forEach((c, i) => {
        if (i > 0) expect(c).not.toBe(level.courses[i - 1]);
        if (c === "split") expect(i).toBeGreaterThanOrEqual(level.courses.length - 2);
      });
      expect(level.wind !== undefined).toBe(level.courses.includes("gust"));
    }
  });

  it("deals six events clear of the landings, and passers clear of them too", () => {
    for (const day of DAYS) {
      const events = vigilEvents(day);
      expect(events.length).toBeGreaterThanOrEqual(5);
      expect(events.length).toBeLessThanOrEqual(6);
      expect(events.map((e) => e.id)).not.toContain("swell");
      for (const e of events) {
        for (let d = -3; d <= 3; d++)
          expect(isLanding(e.at + d, VIGIL_FLOORS, VIGIL_LANDING_EVERY)).toBe(false);
        expect(e.at).toBeLessThan(VIGIL_FLOORS - 3);
      }
      const passers = vigilLevel(day).passers!;
      expect(passers.length).toBeGreaterThanOrEqual(8);
      for (const p of passers) {
        for (let d = -2; d <= 2; d++)
          expect(isLanding(p.at + d, VIGIL_FLOORS, VIGIL_LANDING_EVERY)).toBe(false);
      }
    }
  });

  it("deals the same cards at the same landing", () => {
    const a = vigilDeal("2026-10-13", 20);
    const b = vigilDeal("2026-10-13", 20);
    const c = vigilDeal("2026-10-13", 40);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect([a(), a(), a()]).not.toEqual([c(), c(), c()]);
  });

  it("ranks a summit over any fall, then the quicker summit, then the higher fall", () => {
    const s1 = { floors: 100, summit: true, time: 150 };
    const s2 = { floors: 100, summit: true, time: 140 };
    const f1 = { floors: 70, summit: false, time: 90 };
    const f2 = { floors: 70, summit: false, time: 85 };
    const f3 = { floors: 80, summit: false, time: 120 };
    expect(vigilBetter(s1, null)).toBe(true);
    expect(vigilBetter(s1, f3)).toBe(true);
    expect(vigilBetter(f3, s1)).toBe(false);
    expect(vigilBetter(s2, s1)).toBe(true);
    expect(vigilBetter(s1, s2)).toBe(false);
    expect(vigilBetter(f3, f1)).toBe(true);
    expect(vigilBetter(f2, f1)).toBe(true);
    expect(vigilBetter(f1, f2)).toBe(false);
  });

  it("turns at midnight UTC", () => {
    const late = new Date("2026-10-13T23:30:00Z");
    expect(vigilDay(late)).toBe("2026-10-13");
    expect(vigilDay(new Date("2026-10-14T00:00:01Z"))).toBe("2026-10-14");
    expect(untilNextVigil(late)).toBe(30 * 60000);
    expect(formatUntil(untilNextVigil(late))).toBe("30 m");
    expect(formatUntil(5 * 3600000 + 12 * 60000)).toBe("5 h 12 m");
    expect(vigilDate("2026-10-13")).toBe("13 Oct");
  });
});
