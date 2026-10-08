/**
 * The world kit: the one loop every world after Hearth is built on.
 *
 *   something moves (the mover) → targets wait, each with a groove →
 *   a tap commits → an outcome plays → a chaser, fed by time and by
 *   mistakes, closes in.
 *
 * A world is a definition (`RiteWorld`): how its mover moves, what targets
 * it offers, what each outcome does, how its chaser behaves. How it looks is
 * the world's own view (e.g. `descent-view.ts`), drawing over this state.
 * Everything here is in view space: px, with the mover's pivot at (0, 0),
 * x to the right and y down.
 */

export type Target = {
  /** The world's own name for it (e.g. "seam", "vein"); its outcome is looked up by it. */
  kind: string;
  x: number;
  y: number;
  /** Its size: the groove is the arc it covers from the pivot. */
  r: number;
  /** Hits still needed (hard rock takes two). */
  hp: number;
  /** Seconds since it appeared. */
  age: number;
};

/** What a hit on a kind of target does. */
export type Outcome = {
  /** Progress gained, px (the Descent: how far the machine lurches down). */
  advance: number;
  /** The chaser driven back, px. */
  push: number;
  /** Momentum taken off the chaser. */
  calm: number;
  /** Light gained, 0..1. */
  light: number;
  /** Bonus multiplier on all of the above for a perfect. */
  perfectBonus: number;
};

export type RiteWorld = {
  /** Progress to reach, px. */
  goal: number;
  /** The mover's angle at a moment, radians (0 = straight down), given its clock. */
  aim: (t: number) => number;
  /** Targets to offer when the field needs filling. Called with what's there. */
  spawn: (have: Target[], rand: () => number) => Target[];
  outcomes: Record<string, Outcome>;
  /** Share of a groove that counts as perfect. */
  perfect: number;
  chaser: {
    /** Gap it starts at, px. */
    start: number;
    /** Base pace, px/s, and how much faster per second. */
    pace: number;
    accel: number;
    /** Momentum a miss adds (scaled up for wilder misses), and how fast it fades per second. */
    missMomentum: number;
    fade: number;
    /** Momentum's cap: pace × (1 + momentum). */
    maxMomentum: number;
  };
  /** Seconds an outcome takes to play (aim is held meanwhile). */
  actTime: number;
};

export type Shot =
  | { hit: true; target: Target; perfect: boolean; broke: boolean }
  | { hit: false; x: number; y: number; wild: number };

export class Rite {
  readonly world: RiteWorld;
  /** Progress, px. */
  progress = 0;
  /** Gap between the chaser and the pivot, px. */
  gap: number;
  /** The chaser's momentum: its pace is multiplied by (1 + momentum). */
  momentum = 0;
  light = 0.6;
  /** Seconds of play (the chaser's clock) and of the mover. */
  time = 0;
  moverTime = 0;
  heading = 0;
  targets: Target[] = [];
  /** An outcome playing: its shot, and how far along (0..1). */
  acting: { shot: Shot; t: number } | null = null;
  /** Where misses cracked the walls, for the view (fade with age). */
  cracks: { x: number; y: number; size: number; age: number }[] = [];
  private rand: () => number;

  constructor(world: RiteWorld, rand: () => number = Math.random) {
    this.world = world;
    this.rand = rand;
    this.gap = world.chaser.start;
    this.fill();
  }

  /** The target in the mover's groove now, if any, and whether dead on. */
  aimed(): { target: Target; perfect: boolean } | null {
    let best: { target: Target; perfect: boolean; off: number } | null = null;
    for (const t of this.targets) {
      const dist = Math.hypot(t.x, t.y);
      const angle = Math.atan2(t.x, t.y);
      const window = Math.atan2(t.r, dist);
      const off = Math.abs(angleDiff(angle, this.heading));
      if (off <= window && (!best || off / window < best.off)) {
        best = { target: t, perfect: off <= window * this.world.perfect, off: off / window };
      }
    }
    return best ? { target: best.target, perfect: best.perfect } : null;
  }

  /** One tap. Returns what happened, or null if an outcome is still playing. */
  fire(): Shot | null {
    if (this.acting) return null;
    const hit = this.aimed();
    let shot: Shot;
    if (hit) {
      hit.target.hp -= 1;
      const broke = hit.target.hp <= 0;
      shot = { hit: true, target: hit.target, perfect: hit.perfect, broke };
      if (broke) this.apply(hit.target.kind, hit.perfect);
    } else {
      const wild = Math.min(1, this.missBy() / 4);
      const reach = 70;
      const x = Math.sin(this.heading) * reach;
      const y = Math.cos(this.heading) * reach;
      shot = { hit: false, x, y, wild };
      this.momentum = Math.min(
        this.world.chaser.maxMomentum,
        this.momentum + this.world.chaser.missMomentum * (0.6 + wild),
      );
      this.cracks.push({ x, y, size: 0.4 + wild * 0.6, age: 0 });
    }
    this.acting = { shot, t: 0 };
    return shot;
  }

  private apply(kind: string, perfect: boolean): void {
    const o = this.world.outcomes[kind];
    if (!o) return;
    const k = perfect ? o.perfectBonus : 1;
    this.progress = Math.min(this.world.goal, this.progress + o.advance * k);
    this.gap += o.push * k;
    this.momentum = Math.max(0, this.momentum - o.calm * k);
    this.light = Math.min(1, this.light + o.light * k);
  }

  /** Advances the rite; returns how it ended this step, if it did. */
  step(dt: number): "caught" | "through" | null {
    this.time += dt;
    this.light = Math.max(0.15, this.light - 0.02 * dt);
    for (const t of this.targets) t.age += dt;
    for (const c of this.cracks) c.age += dt;
    if (this.acting) {
      this.acting.t = Math.min(1, this.acting.t + dt / this.world.actTime);
      if (this.acting.t >= 1) {
        const s = this.acting.shot;
        if (s.hit && s.broke) {
          this.targets = this.targets.filter((t) => t !== s.target);
          // A lurch down carries the field with it: everything left rises.
          const adv = this.lastAdvance(s);
          for (const t of this.targets) t.y -= adv;
          for (const c of this.cracks) c.y -= adv;
          this.targets = this.targets.filter((t) => t.y > -30);
        }
        this.acting = null;
        this.fill();
      }
    } else {
      this.moverTime += dt;
    }
    this.heading = this.world.aim(this.moverTime);
    const c = this.world.chaser;
    this.momentum = Math.max(0, this.momentum - c.fade * dt);
    this.gap -= (c.pace + c.accel * this.time) * (1 + this.momentum) * dt;
    if (this.progress >= this.world.goal && !this.acting) return "through";
    if (this.gap <= 0) return "caught";
    return null;
  }

  /** How far a shot moved things down, for the field to rise by. */
  private lastAdvance(s: Shot): number {
    if (!s.hit) return 0;
    const o = this.world.outcomes[s.target.kind];
    return o ? o.advance * (s.perfect ? o.perfectBonus : 1) : 0;
  }

  private fill(): void {
    this.targets.push(...this.world.spawn(this.targets, this.rand));
  }

  /** How far off the nearest target the heading is, in grooves. */
  private missBy(): number {
    let best = Infinity;
    for (const t of this.targets) {
      const dist = Math.hypot(t.x, t.y);
      const off = Math.abs(angleDiff(Math.atan2(t.x, t.y), this.heading));
      best = Math.min(best, off / Math.atan2(t.r, dist));
    }
    return Number.isFinite(best) ? best : 4;
  }
}

export function angleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
