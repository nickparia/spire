import { describe, expect, it } from "vitest";
import { ghostBetter, ghostHeight } from "./logic";
import { parseSave } from "./save";

describe("ghostHeight", () => {
  it("reads the floor reached by a moment, spreading the climb between floors", () => {
    const trace = [0, 2, 4, 8];
    expect(ghostHeight(trace, 0)).toBe(0);
    expect(ghostHeight(trace, 1)).toBe(0.5);
    expect(ghostHeight(trace, 4)).toBe(2);
    expect(ghostHeight(trace, 6)).toBe(2.5);
    expect(ghostHeight(trace, 99)).toBe(3);
    expect(ghostHeight([], 5)).toBe(0);
  });
});

describe("ghostBetter", () => {
  const goal = 3;
  it("takes any run over no ghost, and a summit over a fall", () => {
    expect(ghostBetter(undefined, [0, 1, 2], goal)).toBe(true);
    expect(ghostBetter([0, 1, 2], [0, 1, 2, 3], goal)).toBe(true);
    expect(ghostBetter([0, 1, 2, 3], [0, 1, 2], goal)).toBe(false);
  });
  it("takes a faster summit, and a higher fall over a lower one", () => {
    expect(ghostBetter([0, 1, 2, 3], [0, 1, 2, 2.5], goal)).toBe(true);
    expect(ghostBetter([0, 1, 2, 3], [0, 1, 2, 3.5], goal)).toBe(false);
    expect(ghostBetter([0, 1], [0, 1, 2], goal)).toBe(true);
    expect(ghostBetter([0, 1, 2], [0, 1], goal)).toBe(false);
    expect(ghostBetter(undefined, [0], goal)).toBe(false);
  });
});

describe("save ghosts", () => {
  it("keeps well-formed traces and drops the rest", () => {
    const save = parseSave(
      JSON.stringify({
        v: 2,
        ghosts: { foundry: [0, 1.5, 3], tide: [0, 2, 1], city: "no", canyon: [0] },
      }),
    );
    expect(save.ghosts).toEqual({ foundry: [0, 1.5, 3], tide: [0, 2] });
  });
});
