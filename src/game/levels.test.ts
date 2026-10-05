import { describe, expect, it } from "vitest";
import {
  ENDLESS_PLAN,
  endlessTheme,
  levelCourseAt,
  levelPlan,
  LEVELS,
  WARMUP_FLOORS,
} from "./levels";
import { courseChanges, isKeystone, shouldSpawnBomb, shouldSpawnMote } from "./logic";
import { THEMES } from "./themes";

describe("levels", () => {
  it("have unique ids, since saved progress is keyed on them", () => {
    const ids = LEVELS.map((level) => level.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each point at a real theme and a reachable goal", () => {
    for (const level of LEVELS) {
      expect(THEMES[level.theme]).toBeDefined();
      expect(level.floors).toBeGreaterThan(WARMUP_FLOORS);
      expect(level.parTime).toBeGreaterThan(0);
      expect(level.parAccuracy).toBeGreaterThan(0.5);
      expect(level.parAccuracy).toBeLessThan(1);
    }
  });

  it("open with plain floors, then play every listed course", () => {
    for (const level of LEVELS) {
      for (let f = 0; f < WARMUP_FLOORS; f++) expect(levelCourseAt(level, f)).toBe("slide");
      const seen = new Set<string>();
      for (let f = WARMUP_FLOORS; f < level.floors; f++) seen.add(levelCourseAt(level, f));
      expect([...seen]).toEqual(level.courses);
    }
  });

  it("speed up, never slow down, as the floors go by", () => {
    for (const [index, level] of LEVELS.entries()) {
      const plan = levelPlan(level, index);
      for (let f = 1; f < level.floors; f++) {
        expect(plan.periodAt(f)).toBeLessThanOrEqual(plan.periodAt(f - 1));
      }
      expect(plan.periodAt(0)).toBeCloseTo(level.period[0]);
      expect(plan.periodAt(level.floors - 1)).toBeCloseTo(level.period[1]);
    }
  });

  it("get harder in order", () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(levelPlan(LEVELS[i]!, i).difficulty).toBeGreaterThan(
        levelPlan(LEVELS[i - 1]!, i - 1).difficulty,
      );
    }
  });
});

describe("falling slabs", () => {
  const ridgeIndex = LEVELS.findIndex((l) => l.id === "ridge");
  const ridge = LEVELS[ridgeIndex]!;

  it("only appear on levels that set wind", () => {
    const foundry = levelPlan(LEVELS[0]!, 0);
    for (let f = 0; f < LEVELS[0]!.floors; f++) expect(foundry.fallAt(f)).toBeNull();
  });

  it("teach the fall in still air before the wind starts", () => {
    const plan = levelPlan(ridge, ridgeIndex);
    for (let f = 0; f < WARMUP_FLOORS; f++) {
      expect(plan.fallAt(f)).toMatchObject({ drift: 0, guide: true });
    }
  });

  it("show the landing outline for the first windy floors, then take it away", () => {
    const plan = levelPlan(ridge, ridgeIndex);
    expect(plan.fallAt(WARMUP_FLOORS)?.guide).toBe(true);
    expect(plan.fallAt(WARMUP_FLOORS + 2)?.guide).toBe(true);
    expect(plan.fallAt(WARMUP_FLOORS + 3)?.guide).toBe(false);
  });

  it("blow harder as the level goes on, within the level's range", () => {
    const plan = levelPlan(ridge, ridgeIndex);
    const [from, to] = ridge.wind!;
    let last = 0;
    for (let f = WARMUP_FLOORS; f < ridge.floors; f++) {
      const drift = plan.fallAt(f)!.drift;
      expect(drift).toBeGreaterThanOrEqual(last);
      expect(drift).toBeGreaterThanOrEqual(from);
      expect(drift).toBeLessThanOrEqual(to);
      last = drift;
    }
    expect(plan.fallAt(WARMUP_FLOORS)!.drift).toBeCloseTo(from);
    expect(plan.fallAt(ridge.floors - 1)!.drift).toBeCloseTo(to);
  });

  it("fall only during the gust stretch of a mixed level, with no outline", () => {
    const apex = LEVELS[7]!;
    const plan = levelPlan(apex, 7);
    for (let f = WARMUP_FLOORS; f < apex.floors; f++) {
      const fall = plan.fallAt(f);
      if (levelCourseAt(apex, f) === "gust") expect(fall).toMatchObject({ guide: false });
      else expect(fall).toBeNull();
    }
  });

  it("come with every gust in endless", () => {
    for (let f = 0; f < 80; f++) {
      expect(ENDLESS_PLAN.fallAt(f) !== null).toBe(ENDLESS_PLAN.courseAt(f) === "gust");
    }
  });
});

describe("hazards", () => {
  it("stay off when the level turns them off", () => {
    const plan = levelPlan(LEVELS[0]!, 0);
    for (let f = 0; f < 60; f++) {
      expect(isKeystone(plan, f)).toBe(false);
      expect(shouldSpawnMote(plan, f)).toBe(false);
      expect(shouldSpawnBomb(plan, f)).toBe(false);
    }
  });

  it("never stack a bomb, a mote or a keystone on the same floor", () => {
    for (const plan of [ENDLESS_PLAN, levelPlan(LEVELS[7]!, 7)]) {
      for (let f = 0; f < 120; f++) {
        const active = [isKeystone(plan, f), shouldSpawnMote(plan, f), shouldSpawnBomb(plan, f)];
        expect(active.filter(Boolean).length).toBeLessThanOrEqual(1);
        if (courseChanges(plan, f)) {
          expect(shouldSpawnMote(plan, f) || shouldSpawnBomb(plan, f)).toBe(false);
        }
      }
    }
  });
});

describe("endless", () => {
  it("keeps the original cadence: four plain floors, then a new course every five", () => {
    expect([0, 3, 4, 8, 9, 14, 34, 39].map(ENDLESS_PLAN.courseAt)).toEqual([
      "slide",
      "slide",
      "gust",
      "gust",
      "beat",
      "sway",
      "split",
      "gust",
    ]);
  });

  it("has a sky for every course", () => {
    for (let f = 0; f < 40; f++) {
      expect(THEMES[endlessTheme(ENDLESS_PLAN.courseAt(f))]).toBeDefined();
    }
  });

  it("never drops below the speed floor", () => {
    expect(ENDLESS_PLAN.periodAt(10_000)).toBe(0.4);
  });
});
