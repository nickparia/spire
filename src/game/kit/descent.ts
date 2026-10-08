import type { RiteWorld, Target } from "./rite";

/**
 * The Descent on the world kit. You've stolen the light; the machine bores
 * down through the earth and its head fires that light to rip the rock open.
 * Seams below drive it deeper; veins of light in the walls recharge it and
 * push the ooze back. The Dark has re-formed above and pours down the shaft
 * after you: every miss cracks the walls, and it gathers momentum.
 */

/** Px of progress per HUD floor. */
export const DESCENT_FLOOR = 30;

/** How the head swings at each depth: Hearth's courses, as a pendulum. */
type Swing = "steady" | "walk" | "beat" | "rush" | "hold";

const SWINGS: Swing[] = ["steady", "walk", "beat", "rush", "hold", "walk", "beat", "rush"];

/** A pendulum of half-swing `a` and period `p`, shaped by its course. */
function swing(kind: Swing, a: number, p: number): (t: number) => number {
  const w = (Math.PI * 2) / p;
  switch (kind) {
    case "steady":
      return (t) => Math.sin(t * w) * a;
    case "walk":
      // The swing drifts: its centre wanders slowly side to side.
      return (t) => Math.sin(t * w) * a * 0.85 + Math.sin(t * w * 0.23) * a * 0.3;
    case "beat":
      // It rests, then jumps: held still for a beat each half-swing.
      return (t) => {
        const u = (t / p) % 1;
        const step = Math.floor(u * 4) / 4;
        const ease = (u * 4) % 1;
        const from = Math.sin(step * Math.PI * 2);
        const to = Math.sin((step + 0.25) * Math.PI * 2);
        const k = ease < 0.55 ? 0 : (ease - 0.55) / 0.45;
        return (from + (to - from) * k * k * (3 - 2 * k)) * a;
      };
    case "rush":
      // Slow at the edges, whipping through the middle.
      return (t) => Math.sign(Math.sin(t * w)) * Math.pow(Math.abs(Math.sin(t * w)), 0.45) * a;
    case "hold":
      // It hangs at the walls, then sweeps.
      return (t) => {
        const s = Math.sin(t * w);
        return Math.sign(s) * Math.min(1, Math.abs(s) * 1.6) * a;
      };
  }
}

/** The Descent's rite for a depth (tier 0..7) of `floors` floors. */
export function descentWorld(tier: number, floors: number): RiteWorld {
  const kind = SWINGS[Math.min(SWINGS.length - 1, tier)]!;
  // Smaller targets and a quicker swing the deeper you go.
  const seamR = Math.max(11, 17 - tier);
  const veinR = Math.max(9, 13 - tier * 0.6);
  const hard = tier >= 3;
  return {
    goal: floors * DESCENT_FLOOR,
    aim: swing(kind, 1.25, Math.max(2.6, 3.6 - tier * 0.12)),
    perfect: 0.4,
    actTime: 0.18,
    outcomes: {
      seam: { advance: 42, push: 0, calm: 0.1, light: 0, perfectBonus: 1.4 },
      vein: { advance: 0, push: 70, calm: 0.6, light: 0.35, perfectBonus: 1.4 },
    },
    chaser: {
      start: 300,
      pace: 9 + tier * 1.5,
      accel: 0.32 + tier * 0.04,
      missMomentum: 0.45,
      fade: 0.05,
      maxMomentum: 3,
    },
    spawn: (have, rand) => {
      const out: Target[] = [];
      const place = (k: string, angle: number, dist: number, r: number, hp = 1) =>
        out.push({ kind: k, x: Math.sin(angle) * dist, y: Math.cos(angle) * dist, r, hp, age: 0 });
      // Always a seam below: the way down.
      if (!have.some((t) => t.kind === "seam")) {
        place("seam", (rand() - 0.5) * 1.1, 120 + rand() * 30, seamR, hard && rand() < 0.5 ? 2 : 1);
      }
      // A vein in one wall or the other: the light, at the cost of a shot.
      if (!have.some((t) => t.kind === "vein") && rand() < 0.75) {
        const side = rand() < 0.5 ? -1 : 1;
        place("vein", side * (0.75 + rand() * 0.4), 95 + rand() * 30, veinR);
      }
      return out;
    },
  };
}
