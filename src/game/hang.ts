/**
 * The Descent: the Spire's roots hang from the machine, down into the Dark,
 * which grips the tower from above and hauls on it. You add stones at the
 * tip: a true catch drags the tower down a step, out of the Dark's grip; a
 * miss lets the Dark suck it back up. A tug of war on the wire, which frays
 * as you win it and snaps when you've won: the roots fall through to the
 * next depth. Let the Dark haul the whole tower up, and the light is buried.
 *
 * The tower is a real pendulum: an off-centre stone shifts its weight and
 * leans it, a stone caught against the swing throws it, and a swing wide
 * enough to strike the shaft walls breaks stones off.
 *
 * World units are px: the pivot at (0, 0), y down the shaft.
 */

export const STONE_H = 28;

/**
 * A depth's twist on the fight. Flood: the shaft is drowned, the swing slow
 * and heavy, a current pulling. Narrow: the walls close in as the roots grow.
 * Heat: a wild swing heats the wire, and a hot wire gives to the Dark. Unlit:
 * only what the roots' own glow reaches can be seen. Cycle: each in turn.
 */
export type Twist = "none" | "flood" | "narrow" | "heat" | "unlit";
const CYCLE: Twist[] = ["flood", "narrow", "heat", "unlit"];
/** Seconds each twist lasts on a cycling depth. */
export const CYCLE_EVERY = 9;
/** Narrowing: px of half width lost per stone, and the narrowest the shaft gets. */
const NARROW_PER_STONE = 6;
const NARROW_MIN = 95;

export type HangTune = {
  /** Stones' worth of drag that snaps the wire. */
  snap: number;
  /** Stone width, and the shaft's half width the swing is bounded by. */
  stoneW: number;
  shaft: number;
  /** Drag a true catch and an off-centre catch give, px; what a lost stone and a crack cost; the Dark's steady pull, px/s. */
  pullTrue: number;
  pullOff: number;
  suckMiss: number;
  suckCrack: number;
  suckIdle: number;
  /** The sliding stone's pace (shaft widths per second) at the first stone, and more per stone. */
  slide: number;
  slideGrow: number;
  /** The swing's damping; lower swings longer. */
  damping: number;
  /** Px either side of the tip's groove that count as a true catch. */
  window: number;
  /** The Dark's surges: every `surgeEvery` s it heaves `surge` px (0 for none). */
  surgeEvery: number;
  surge: number;
  /** The pivot's own sway (the machine on its mount): px of amplitude, 0 for none. */
  pivotSway: number;
  /** The depth's twist, or "cycle" for each in turn. */
  twist: Twist | "cycle";
};

export type HangEvent =
  | { kind: "true" }
  | { kind: "off"; rel: number }
  | { kind: "lost" }
  | { kind: "crack" }
  | { kind: "surge" }
  | { kind: "snap" }
  /** The wire overheated and gave: the Dark hauls. */
  | { kind: "scorch" }
  /** A cycling depth moved on to its next twist. */
  | { kind: "twist"; twist: Twist };

export class Hang {
  readonly tune: HangTune;
  /** Each stone: its offset from the tower's axis, in the tower's own frame. */
  stones: { off: number }[] = [{ off: 0 }];
  theta = 0.22;
  omega = 0;
  /** The sliding stone: -1..1 across the shaft, its direction and pace. */
  stone = { x: -1, dir: 1, speed: 1 };
  /** How far the tower has been dragged out of the Dark, px. */
  drag: number;
  time = 0;
  /** Set once the wire has snapped: the fall's age. */
  fall = -1;
  /** The pivot's sideways sway now, px. */
  pivotX = 0;
  /** The shaft's half width now (it narrows on some depths), eased. */
  shaft: number;
  /** How flooded the shaft is now, 0..1, eased. */
  flood = 0;
  /** The wire's heat, 0..1: it gives to the Dark when hot and scorches at 1. */
  heat = 0;
  private surgeT = 0;
  private twistPhase = -1;
  private rand: () => number;

  constructor(tune: HangTune, rand: () => number = Math.random) {
    this.tune = tune;
    this.rand = rand;
    this.drag = 2 * STONE_H;
    this.shaft = tune.shaft;
  }

  /** The twist in force now. */
  get twist(): Twist {
    const t = this.tune.twist;
    if (t !== "cycle") return t;
    return CYCLE[Math.floor(this.time / CYCLE_EVERY) % CYCLE.length]!;
  }

  /** The tower's length from the pivot to the tip. */
  get length(): number {
    return 60 + this.stones.length * STONE_H;
  }

  /** How far down the tower the Dark's grip reaches, from the pivot. */
  get coat(): number {
    return Math.max(0, this.length - this.drag);
  }

  /** The wire's strain, 0..1: it snaps at 1. */
  get strain(): number {
    return Math.min(1, this.drag / (this.tune.snap * STONE_H));
  }

  /** Stones the Dark holds. */
  get held(): number {
    return Math.max(0, Math.min(this.stones.length, Math.round(this.coat / STONE_H) - 2));
  }

  private comOffset(): number {
    let s = 0;
    for (const st of this.stones) s += st.off;
    return s / this.stones.length;
  }

  /** The tip: the bottom of the last stone, in world px. */
  tip(): { x: number; y: number } {
    const L = this.length;
    const last = this.stones[this.stones.length - 1]!;
    return {
      x: this.pivotX + Math.sin(this.theta) * L + Math.cos(this.theta) * last.off,
      y: Math.cos(this.theta) * L - Math.sin(this.theta) * last.off,
    };
  }

  /** The sliding stone's centre x, world px. */
  stoneX(): number {
    return this.stone.x * (this.shaft - this.tune.stoneW / 2);
  }

  /** One tap: fix the sliding stone to the tip. */
  tap(): HangEvent {
    const t = this.tune;
    const tp = this.tip();
    const rel = (this.stoneX() - tp.x) * Math.cos(this.theta);
    if (Math.abs(rel) > t.stoneW * 0.85) {
      // Missed the tip: the stone is lost to the dark, the jolt swings the tower, and the Dark gains.
      this.omega += Math.sign(rel || 1) * 0.35;
      this.drag -= t.suckMiss;
      return { kind: "lost" };
    }
    const last = this.stones[this.stones.length - 1]!;
    // The stone's momentum goes into the tower: with the swing it settles, against it the tower is thrown.
    const vStone = this.stone.dir * this.stone.speed * (t.shaft - t.stoneW / 2);
    const vTip = -Math.cos(this.theta) * this.length * this.omega;
    this.omega += -((vStone - vTip) / this.length) * 0.55;
    const perfect = Math.abs(rel) < t.window;
    let ev: HangEvent;
    if (perfect) {
      this.stones.push({ off: last.off });
      this.omega *= 0.35;
      this.drag += t.pullTrue;
      ev = { kind: "true" };
    } else {
      this.stones.push({ off: last.off + rel });
      this.omega += (rel / t.stoneW) * 1.4;
      this.drag += t.pullOff;
      ev = { kind: "off", rel };
    }
    const fromLeft = this.rand() < 0.5;
    this.stone = { x: fromLeft ? -1 : 1, dir: fromLeft ? 1 : -1, speed: this.stone.speed };
    return ev;
  }

  /** Advances the fight; returns what happened, and how it ended if it did. */
  step(dt: number): { events: HangEvent[]; end: "won" | "lost" | null } {
    const t = this.tune;
    const events: HangEvent[] = [];
    this.time += dt;
    if (this.fall >= 0) {
      this.fall += dt;
      return { events, end: this.fall > 1.5 ? "won" : null };
    }
    const L = this.length;
    const twist = this.twist;
    if (t.twist === "cycle") {
      const phase = Math.floor(this.time / CYCLE_EVERY);
      if (phase !== this.twistPhase) {
        this.twistPhase = phase;
        events.push({ kind: "twist", twist });
      }
    }
    // The twists ease in and out so a cycling depth doesn't jump.
    this.flood += ((twist === "flood" ? 1 : 0) - this.flood) * Math.min(1, dt * 1.5);
    const wantShaft =
      twist === "narrow"
        ? Math.max(NARROW_MIN, t.shaft - NARROW_PER_STONE * this.stones.length)
        : t.shaft;
    this.shaft += (wantShaft - this.shaft) * Math.min(1, dt * 2);
    this.pivotX = t.pivotSway > 0 ? Math.sin(this.time * 0.9) * t.pivotSway : 0;
    const lean = Math.atan2(this.comOffset(), L * 0.55);
    // Flooded: gravity feels less, the water drags, and a slow current pulls the tower.
    const g = 9.8 * 60 * (1 - 0.55 * this.flood);
    const damping = t.damping + 0.7 * this.flood;
    const alpha = -(g / (L * 0.66)) * Math.sin(this.theta + lean) - damping * this.omega;
    this.omega += alpha * dt + Math.sin(this.time * 0.6) * 0.5 * this.flood * dt;
    this.theta += this.omega * dt;
    // Heat: a wild swing heats the wire; hot, it gives to the Dark; at the limit it scorches.
    if (twist === "heat") {
      const wild = Math.abs(this.omega) * 0.9 + Math.abs(this.theta) * 1.2 - 0.35;
      this.heat = Math.max(0, Math.min(1, this.heat + wild * dt * 0.8));
      if (this.heat > 0.3) this.drag -= t.suckIdle * 3 * this.heat * dt;
      if (this.heat >= 1) {
        this.heat = 0.55;
        this.drag -= t.suckMiss;
        events.push({ kind: "scorch" });
      }
    } else this.heat = Math.max(0, this.heat - dt * 0.5);
    const speed = (t.slide + this.stones.length * t.slideGrow) * (1 - 0.3 * this.flood);
    this.stone.speed = speed;
    this.stone.x += this.stone.dir * speed * dt;
    if (this.stone.x > 1) {
      this.stone.x = 1;
      this.stone.dir = -1;
    } else if (this.stone.x < -1) {
      this.stone.x = -1;
      this.stone.dir = 1;
    }
    // Walls: swing too wide and the tip strikes the rock, the bottom stone breaks off, and the Dark gains.
    const tp = this.tip();
    if (Math.abs(tp.x) + t.stoneW / 2 > this.shaft && this.stones.length > 1) {
      this.stones.pop();
      this.omega *= -0.45;
      const bound = Math.asin(Math.min(1, (this.shaft - t.stoneW / 2) / this.length));
      this.theta = Math.sign(this.theta) * Math.min(Math.abs(this.theta), bound);
      this.drag -= t.suckCrack;
      events.push({ kind: "crack" });
    }
    // The Dark never lets go: it draws the tower up a little all the time, and sometimes heaves.
    this.drag -= t.suckIdle * dt;
    if (t.surgeEvery > 0) {
      this.surgeT += dt;
      if (this.surgeT >= t.surgeEvery) {
        this.surgeT = 0;
        this.drag -= t.surge;
        events.push({ kind: "surge" });
      }
    }
    if (this.drag <= 0) return { events, end: "lost" };
    if (this.strain >= 1) {
      this.fall = 0;
      events.push({ kind: "snap" });
    }
    return { events, end: null };
  }
}

/** The Descent's tuning for a depth (tier 0..7). */
export function hangTune(tier: number): HangTune {
  const deep = tier / 7;
  return {
    snap: 15 + tier * 1.5,
    stoneW: 120,
    shaft: 200 - tier * 10,
    pullTrue: 38,
    pullOff: 18 - tier,
    suckMiss: 34 + tier * 3,
    suckCrack: 26,
    suckIdle: 3.5 + tier * 1.2,
    slide: 1.05 + deep * 0.35,
    slideGrow: 0.025,
    damping: tier === 2 ? 0.5 : 0.28 - deep * 0.12,
    window: 13 - tier * 0.6,
    surgeEvery: tier === 1 ? 6 : 0,
    surge: 30,
    pivotSway: tier === 5 || tier === 7 ? 26 : 0,
    twist:
      tier === 2
        ? "flood"
        : tier === 3
          ? "narrow"
          : tier === 4
            ? "heat"
            : tier === 6
              ? "unlit"
              : tier === 7
                ? "cycle"
                : "none",
  };
}
