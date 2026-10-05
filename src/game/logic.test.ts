import { describe, expect, it } from "vitest";
import {
  dropAccuracy,
  dropOffset,
  fallDuration,
  graceFor,
  heldWidth,
  fallShare,
  formatPercent,
  formatTime,
  goalsFor,
  MIN_W,
  resolveDrop,
  starCount,
  tensionFor,
} from "./logic";

const base = { prevX: 0, prevW: 100, moverW: 100, tol: 10, startW: 120, streak: 0 };

describe("resolveDrop", () => {
  it("snaps a drop inside the window onto the slab below", () => {
    const r = resolveDrop({ ...base, moverX: 8 });
    expect(r).toMatchObject({ ok: true, perfect: true, x: 0, w: 100, streak: 1, scrap: null });
  });

  it("trims the overhang and resets the streak on a miss-by-a-bit", () => {
    const r = resolveDrop({ ...base, moverX: 30, streak: 3 });
    expect(r).toMatchObject({ ok: true, perfect: false, x: 30, w: 70, streak: 0 });
    expect(r.ok && r.scrap).toEqual({ x: 100, w: 30 });
  });

  it("drops the scrap on the left when the slab lands short", () => {
    const r = resolveDrop({ ...base, moverX: -25 });
    expect(r).toMatchObject({ ok: true, x: 0, w: 75 });
    expect(r.ok && r.scrap).toEqual({ x: -25, w: 25 });
  });

  it("fails when too little is left standing", () => {
    expect(resolveDrop({ ...base, moverX: 100 - MIN_W + 1 })).toEqual({ ok: false });
  });

  it("forges the slab wider on every fifth perfect, up to the starting width", () => {
    const r = resolveDrop({ ...base, moverX: 0, streak: 4 });
    expect(r).toMatchObject({ ok: true, forged: true, streak: 5 });
    expect(r.ok && r.w).toBeCloseTo(114);
    expect(r.ok && r.x).toBeCloseTo(-7);
    const capped = resolveDrop({ ...base, prevW: 118, moverW: 118, moverX: 0, streak: 9 });
    expect(capped.ok && capped.w).toBe(120);
  });

  it("pays more for a longer streak", () => {
    const first = resolveDrop({ ...base, moverX: 0, streak: 0 });
    const third = resolveDrop({ ...base, moverX: 0, streak: 2 });
    expect(first.ok && first.points).toBe(20);
    expect(third.ok && third.points).toBe(40);
  });
});

describe("a held slab", () => {
  it("keeps its width through the grace, then wastes away to a floor", () => {
    expect(heldWidth(100, 0, 1)).toBe(100);
    expect(heldWidth(100, 0.85, 1)).toBe(100);
    expect(heldWidth(100, 1.85, 1)).toBeCloseTo(93);
    expect(heldWidth(100, 60, 1)).toBe(50);
  });

  it("has a grace that scales with the slab's pace", () => {
    expect(graceFor(1)).toBeCloseTo(0.85);
    expect(heldWidth(100, graceFor(1), 1)).toBe(100);
  });

  it("gets a shorter grace when the slab moves faster", () => {
    expect(heldWidth(100, 1, 0.5)).toBeLessThan(heldWidth(100, 1, 1.1));
  });

  it("lands a shrunken perfect centred on the groove, and keeps it narrow", () => {
    const r = resolveDrop({ ...base, moverW: 80, moverX: 10 });
    expect(dropOffset(0, 100, 10, 80)).toBe(0);
    expect(r).toMatchObject({ ok: true, perfect: true, x: 10, w: 80 });
  });

  it("judges by the groove, not the left edge", () => {
    expect(resolveDrop({ ...base, moverW: 60, moverX: 20 }).ok && true).toBe(true);
    const r = resolveDrop({ ...base, moverW: 60, moverX: 20 });
    expect(r.ok && r.perfect).toBe(true);
  });
});

describe("dropAccuracy", () => {
  it("is 100% anywhere inside the perfect window", () => {
    expect(dropAccuracy(0, 100, 10)).toBe(1);
    expect(dropAccuracy(-10, 100, 10)).toBe(1);
  });

  it("is the share of the slab that landed otherwise", () => {
    expect(dropAccuracy(25, 100, 10)).toBeCloseTo(0.75);
    expect(dropAccuracy(-40, 100, 10)).toBeCloseTo(0.6);
  });

  it("never goes below zero", () => {
    expect(dropAccuracy(400, 100, 10)).toBe(0);
  });
});

describe("falling", () => {
  it("takes longer from higher up, and no time from the seat", () => {
    expect(fallDuration(0)).toBe(0);
    expect(fallDuration(84)).toBeGreaterThan(fallDuration(28));
    expect(fallDuration(84)).toBeCloseTo(0.3055, 3);
  });

  it("starts slow and lands exactly at the end", () => {
    const T = fallDuration(84);
    expect(fallShare(0, T)).toBe(0);
    expect(fallShare(T / 2, T)).toBeCloseTo(0.25);
    expect(fallShare(T, T)).toBe(1);
    expect(fallShare(T * 3, T)).toBe(1);
  });

  it("counts a slab with nowhere to fall as already landed", () => {
    expect(fallShare(0, 0)).toBe(1);
  });
});

describe("tensionFor", () => {
  it("is calm at full width and maxed at the minimum", () => {
    expect(tensionFor(180, 180)).toBe(0);
    expect(tensionFor(MIN_W, 180)).toBe(1);
  });

  it("rises as the slab narrows", () => {
    const widths = [180, 150, 110, 70, 30];
    const tension = widths.map((w) => tensionFor(w, 180));
    for (let i = 1; i < tension.length; i++) expect(tension[i]).toBeGreaterThan(tension[i - 1]!);
  });

  it("stays in range for widths outside the expected span", () => {
    expect(tensionFor(400, 180)).toBe(0);
    expect(tensionFor(0, 180)).toBe(1);
  });
});

describe("goals", () => {
  it("awards a star each for the summit, precision and pace", () => {
    expect(starCount(goalsFor(20, 0.95, 22, 0.9))).toBe(3);
    expect(goalsFor(25, 0.95, 22, 0.9)).toEqual({ clear: true, precise: true, swift: false });
    expect(goalsFor(20, 0.8, 22, 0.9)).toEqual({ clear: true, precise: false, swift: true });
  });

  it("counts a run exactly on par as met", () => {
    expect(goalsFor(22, 0.9, 22, 0.9)).toEqual({ clear: true, precise: true, swift: true });
  });
});

describe("formatting", () => {
  it("formats run clocks to hundredths", () => {
    expect(formatTime(0)).toBe("0:00.00");
    expect(formatTime(9.5)).toBe("0:09.50");
    expect(formatTime(83.42)).toBe("1:23.42");
  });

  it("never rounds a percentage up past what was earned", () => {
    expect(formatPercent(0.899)).toBe("89%");
    expect(formatPercent(1)).toBe("100%");
    expect(formatPercent(0.9)).toBe("90%");
  });
});
