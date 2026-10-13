import { describe, expect, it } from "vitest";
import { hashSeed, seeded } from "./rand";

describe("seeded", () => {
  it("gives the same numbers for the same seed, and others for another", () => {
    const a = seeded(hashSeed("vigil-2026-10-13"));
    const b = seeded(hashSeed("vigil-2026-10-13"));
    const c = seeded(hashSeed("vigil-2026-10-14"));
    const xs = Array.from({ length: 8 }, () => a());
    expect(Array.from({ length: 8 }, () => b())).toEqual(xs);
    expect(Array.from({ length: 8 }, () => c())).not.toEqual(xs);
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});
