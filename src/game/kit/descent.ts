import type { Actor, Rite, RiteWorld, Target } from "./rite";

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
      creature: { advance: 0, push: 45, calm: 0.35, light: 0.2, perfectBonus: 1.3 },
    },
    recoil: 0.16 + tier * 0.02,
    settle: 2.6,
    tick: (r, dt, rand) => crew(r, dt, rand, tier),
    onStrike: (r, t) => {
      // The creature dies in the miner's light; the miner is saved.
      const c = t.actor;
      if (c) {
        c.state = "dead";
        c.t = 0;
      }
    },
    chaser: {
      start: tier === 0 ? 380 : 300,
      pace: 13 + tier * 1.5,
      accel: 0.32 + tier * 0.04,
      missMomentum: tier === 0 ? 0.3 : 0.45,
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
        out[out.length - 1]!.dark = true;
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

/** Where the crew stand around the head, and how their lamps sweep. */
const CREW: { x: number; y: number; period: number; sweep: number }[] = [
  { x: -92, y: 30, period: 3.4, sweep: 0.6 },
  { x: 96, y: 50, period: 4.2, sweep: 0.55 },
  { x: -30, y: -50, period: 2.9, sweep: 0.45 },
];
/** A lamp's reach and width. */
const LAMP = { spread: 0.34, range: 260 };
/** A creature's pace toward its miner (px/s), and how long its lunge lasts (s). */
const CRAWL = 26;
const LUNGE = 1.5;

/**
 * The crew and the things that hunt them. The miners keep pace with the
 * machine on its chains and ledges, their lamps sweeping the rock below (only
 * what's lit can be struck). Creatures come out of the dark for them; when
 * one lunges it's caught in the lamp for a moment: strike it and the miner is
 * saved, miss the moment and the miner (and their light) is lost.
 */
function crew(r: Rite, dt: number, rand: () => number, tier: number): void {
  if (!r.actors.some((a) => a.kind === "miner")) {
    CREW.forEach((c, i) =>
      r.actors.push({
        kind: "miner",
        slot: i,
        x: c.x,
        y: c.y,
        state: "work",
        t: i * 1.3,
        face: c.x < 0 ? 1 : -1,
        lamp: { angle: 0, spread: LAMP.spread, range: LAMP.range },
      }),
    );
    // The machine's own lamp: narrow, straight down, always on.
    r.actors.push({
      kind: "rig",
      x: 0,
      y: 0,
      state: "on",
      t: 0,
      face: 1,
      lamp: { angle: 0, spread: 0.3, range: 60 },
    });
  }
  const miners = r.actors.filter((a) => a.kind === "miner" && !a.gone);
  for (const m of r.actors) {
    m.t += dt;
    if (m.kind === "miner") {
      const c = CREW[m.slot ?? 0] ?? CREW[0]!;
      if (m.state === "dead") {
        m.y += 140 * dt;
        if (m.t > 1.2) m.gone = true;
        continue;
      }
      // The lamp sweeps the rock below, toward the middle of the field.
      const toward = Math.atan2(-m.x * 0.6, 130 - m.y);
      if (m.lamp) m.lamp.angle = toward + Math.sin((m.t / c.period) * Math.PI * 2) * c.sweep;
      m.y = c.y + Math.sin(m.t * 2.1) * 2;
    } else if (m.kind === "creature") {
      const prey = r.actors.find((a) => a === (m as Actor & { prey?: Actor }).prey && !a.gone);
      if (m.state === "dead") {
        if (m.t > 0.6) m.gone = true;
        continue;
      }
      if (!prey || prey.state === "dead") {
        m.state = "leave";
        m.y += 60 * dt;
        if (m.y > 400) m.gone = true;
        continue;
      }
      const dx = prey.x - m.x;
      const dy = prey.y - m.y;
      const d = Math.hypot(dx, dy);
      m.face = dx < 0 ? -1 : 1;
      if (m.state === "crawl") {
        const pace = CRAWL + tier * 3;
        m.x += (dx / d) * pace * dt;
        m.y += (dy / d) * pace * dt;
        if (d < 46) {
          // It lunges: caught in the miner's light, a target for a moment.
          m.state = "lunge";
          m.t = 0;
          r.targets.push({ kind: "creature", x: m.x, y: m.y, r: 17, hp: 1, age: 0.4, actor: m });
        }
      } else if (m.state === "lunge") {
        const tgt = r.targets.find((t) => t.actor === m);
        if (tgt) {
          tgt.x = m.x;
          tgt.y = m.y;
        }
        if (m.t > LUNGE - tier * 0.08) {
          // Too late: the miner is taken, and their light with them.
          prey.state = "dead";
          prey.t = 0;
          prey.lamp = undefined;
          m.state = "leave";
          r.targets = r.targets.filter((t) => t.actor !== m);
        }
      }
    }
  }
  r.targets = r.targets.filter((t) => !t.actor || !t.actor.gone);
  r.actors = r.actors.filter((a) => !a.gone);
  // Creatures come for the miners, more often deeper down.
  const hunting = r.actors.some((a) => a.kind === "creature" && a.state !== "leave");
  if (!hunting && miners.length > 0 && r.time > 3 && rand() < dt / Math.max(3.5, 7 - tier * 0.5)) {
    const prey = miners[Math.floor(rand() * miners.length)]!;
    const side = prey.x < 0 ? -1 : 1;
    const c: Actor & { prey?: Actor } = {
      kind: "creature",
      x: side * (170 + rand() * 30),
      y: 230 + rand() * 40,
      state: "crawl",
      t: 0,
      face: -side,
    };
    c.prey = prey;
    r.actors.push(c);
  }
}
