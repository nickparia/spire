import { Body, Box, RevoluteJoint, Vec2, World } from "planck";

/**
 * The Descent: the drill sits in the opening at the top of the shaft, and the
 * Spire's roots hang from it on chains, down into the Dark, which hauls on
 * them from above. You add slabs at the tip: a true catch drags the drill a
 * step deeper into the rock, out of the Dark's grip; a miss lets it be hauled
 * back up. A tug of war on the drill: at the limit it tears through the floor
 * to the next depth. Let the Dark haul it all the way out, and the light is
 * buried.
 *
 * The chain is real physics (planck). Each slab hangs on two short chains
 * hooked onto the slab above at the x where it was caught, so it stays level
 * and its weight sits where you put it, shifting the whole column's balance.
 * The Dark fights physically too: claws burst from the walls and shove the
 * chain, and blows to the rock whip the drill's mount.
 *
 * World units are px: the mount's hook at (0, 0), y down the shaft; physics
 * runs in metres at PPM px each.
 */

export const STONE_H = 28;
/** The chain: two links of this height hang each slab, LINK_W wide. */
export const LINK_H = 14;
export const LINK_W = 6;
/** The two chains hang this far either side of where the slab was caught. */
const HOOK = 40;
const PPM = 60;
/** Mount-to-slab for the first slab, then slab-to-slab. */
const MOUNT_DROP = 8;
/** How far the drill sinks into the opening between the start and the limit, px. */
export const SINK = 110;
/** One slab's share of the chain: a slab and its two links. */
const PITCH = STONE_H + 2 * LINK_H;

export type HangTune = {
  /** Slabs' worth of drag that breaks through. */
  snap: number;
  /** Slab width, and the shaft's half width the chain swings in. */
  stoneW: number;
  shaft: number;
  /** Drag a true catch and an off-centre catch give, px; what a lost stone and a wall knock cost; the Dark's steady pull, px/s. */
  pullTrue: number;
  pullOff: number;
  suckMiss: number;
  suckCrack: number;
  suckIdle: number;
  /** The sliding stone's pace (shaft widths per second) at the first stone, and more per stone. */
  slide: number;
  slideGrow: number;
  /** Px either side of the tip's hook that count as a true catch. */
  window: number;
  /** The Dark's surges: every `surgeEvery` s it heaves `surge` px (0 for none). */
  surgeEvery: number;
  surge: number;
  /** The mount's own sway (the machine on its mount): px of amplitude, 0 for none. */
  pivotSway: number;
  /** Claws from the walls: every `clawEvery` s (0 for none), shoving with `clawPush` (N·s, plus per slab). */
  clawEvery: number;
  clawPush: number;
  /** Blows to the rock: every `strikeEvery` s (0 for none), the mount whipped at `strikeKick` m/s. */
  strikeEvery: number;
  strikeKick: number;
};

export type HangEvent =
  | { kind: "true" }
  | { kind: "off"; rel: number }
  | { kind: "lost" }
  /** A slab knocked the rock wall. */
  | { kind: "crack" }
  | { kind: "surge" }
  | { kind: "snap" }
  /** A claw burst from a wall (side −1 left, 1 right) at y px below the mount and shoved the chain. */
  | { kind: "claw"; side: number; y: number }
  /** A blow to the rock: the mount whipped toward `side`. */
  | { kind: "strike"; side: number };

export type Pose = { x: number; y: number; angle: number };

export class Hang {
  readonly tune: HangTune;
  /** Each slab: how far off the hook above it was caught, and its body. */
  stones: { off: number; body: Body }[] = [];
  /** The sliding stone: -1..1 across the shaft, its direction and pace. */
  stone = { x: -1, dir: 1, speed: 1 };
  /** How far the drill has been dragged out of the Dark, px. */
  drag: number;
  time = 0;
  /** Set once the drill has torn through: the fall's age. */
  fall = -1;
  /** The mount's sideways sway now, px. */
  pivotX = 0;
  /** The claws out of the walls right now, for the view: side, y below the mount, age. */
  claws: { side: number; y: number; t: number }[] = [];
  private world: World;
  private mount: Body;
  private links: Body[] = [];
  private surgeT = 0;
  private clawT: number;
  private strikeT: number;
  private strike: { side: number; t: number } | null = null;
  private wallT = -1;
  private wallHit = false;
  private rand: () => number;

  constructor(tune: HangTune, rand: () => number = Math.random) {
    this.tune = tune;
    this.rand = rand;
    this.drag = 2 * STONE_H;
    this.clawT = tune.clawEvery > 0 ? tune.clawEvery * 0.6 : 0;
    this.strikeT = tune.strikeEvery > 0 ? tune.strikeEvery * 0.8 : 0;
    this.world = new World({ gravity: new Vec2(0, 9.8) });
    this.mount = this.world.createBody({ type: "kinematic", position: new Vec2(0, 0) });
    this.mount.createFixture(new Box(m(60), m(MOUNT_DROP)), { filterMaskBits: 0 });
    for (const side of [-1, 1]) {
      // Tall enough for the longest chain a depth can reach.
      const wall = this.world.createBody({
        position: new Vec2(m(side * (tune.shaft + 20)), m(2500)),
      });
      wall.createFixture(new Box(m(20), m(4000)), { friction: 0.4 });
    }
    this.world.on("begin-contact", (c) => {
      const a = c.getFixtureA().getBody();
      const b = c.getFixtureB().getBody();
      if (a.isStatic() || b.isStatic()) this.wallHit = true;
    });
    this.addSlab(0);
  }

  /** The mount's world position, px: it sinks into the opening as the fight is won. */
  get sink(): number {
    return this.strain * SINK;
  }

  /** The tower's length: the mount's hook to the tip, px. */
  get length(): number {
    return this.tip().y;
  }

  /** How far down the tower the Dark's grip reaches, from the mount: the drag is in slabs' worth. */
  get coat(): number {
    return Math.max(0, this.length - (this.drag / STONE_H) * PITCH);
  }

  /** The drill's strain, 0..1: it tears through at 1. */
  get strain(): number {
    return Math.min(1, this.drag / (this.tune.snap * STONE_H));
  }

  /** Slabs the Dark holds. */
  get held(): number {
    const coat = this.coat;
    let n = 0;
    for (const s of this.stones) if (this.pose(s.body).y < coat) n += 1;
    return n;
  }

  /** A body's pose in px, relative to the mount's hook. */
  private pose(b: Body): Pose {
    const p = b.getPosition();
    const mp = this.mount.getPosition();
    return { x: px(p.x - mp.x) + this.pivotX, y: px(p.y - mp.y), angle: b.getAngle() };
  }

  /** The slabs' poses (centres), in order from the mount down. */
  slabPoses(): Pose[] {
    return this.stones.map((s) => this.pose(s.body));
  }

  /** The chain links' poses (centres). */
  linkPoses(): Pose[] {
    return this.links.map((l) => this.pose(l));
  }

  /** The tip: the lowest slab's bottom centre, where the next one hooks on. */
  tip(): Pose {
    const b = this.stones[this.stones.length - 1]!.body;
    const p = b.getWorldPoint(new Vec2(0, m(STONE_H / 2)));
    const mp = this.mount.getPosition();
    return { x: px(p.x - mp.x) + this.pivotX, y: px(p.y - mp.y), angle: b.getAngle() };
  }

  /** The sliding stone's centre x, world px. */
  stoneX(): number {
    return this.stone.x * (this.tune.shaft - this.tune.stoneW / 2);
  }

  /** A chain of two links hung from `body` at local point `at` (metres); returns the lower link. */
  private addLinks(body: Body, at: Vec2): Body {
    let prev = body;
    let anchor = body.getWorldPoint(at);
    for (let i = 0; i < 2; i++) {
      const link = this.world.createBody({
        type: "dynamic",
        position: new Vec2(anchor.x, anchor.y + m(LINK_H / 2)),
        angle: body.getAngle(),
        linearDamping: 0.3,
        angularDamping: 0.8,
      });
      // Links are heavy for their size: the solver keeps a chain together only when the
      // masses along it are within a few times of each other.
      link.createFixture(new Box(m(LINK_W / 2), m(LINK_H / 2)), { density: 14, filterMaskBits: 0 });
      this.world.createJoint(new RevoluteJoint({}, prev, link, anchor));
      this.links.push(link);
      prev = link;
      anchor = link.getWorldPoint(new Vec2(0, m(LINK_H / 2)));
    }
    return prev;
  }

  /** A slab hung under the lowest slab (or the mount) on two chains, hooked on `off` px to the side. */
  private addSlab(off: number): void {
    const t = this.tune;
    const last = this.stones[this.stones.length - 1];
    const parent = last ? last.body : this.mount;
    const bottom = last ? STONE_H / 2 : MOUNT_DROP;
    const edge = t.stoneW / 2 - 2;
    const hx = [
      Math.max(-edge, Math.min(edge, off - HOOK)),
      Math.max(-edge, Math.min(edge, off + HOOK)),
    ];
    const links = hx.map((x) => this.addLinks(parent, new Vec2(m(x), m(bottom))));
    const c = parent.getWorldPoint(new Vec2(m(off), m(bottom + 2 * LINK_H + STONE_H / 2)));
    const slab = this.world.createBody({
      type: "dynamic",
      position: c,
      angle: parent.getAngle(),
      linearDamping: 0.2,
      angularDamping: 0.5,
    });
    slab.createFixture(new Box(m(t.stoneW / 2), m(STONE_H / 2)), { density: 1, friction: 0.6 });
    for (const link of links) {
      const a = link.getWorldPoint(new Vec2(0, m(LINK_H / 2)));
      this.world.createJoint(new RevoluteJoint({}, link, slab, a));
    }
    this.stones.push({ off, body: slab });
  }

  /** One tap: hook the sliding stone onto the tip. */
  tap(): HangEvent {
    const t = this.tune;
    const tp = this.tip();
    const rel = this.stoneX() - tp.x;
    let ev: HangEvent;
    if (Math.abs(rel) > t.stoneW * 0.85) {
      // Missed the tip: the stone is lost to the Dark, which gains; the chain is knocked.
      this.drag -= t.suckMiss;
      const last = this.stones[this.stones.length - 1]!.body;
      last.applyLinearImpulse(new Vec2(Math.sign(rel || 1) * 2.5, 0), last.getWorldCenter(), true);
      ev = { kind: "lost" };
    } else {
      const perfect = Math.abs(rel) < t.window;
      this.addSlab(perfect ? 0 : rel);
      this.drag += perfect ? t.pullTrue : t.pullOff;
      // The stone's momentum goes into the chain.
      const b = this.stones[this.stones.length - 1]!.body;
      b.applyLinearImpulse(
        new Vec2(this.stone.dir * this.stone.speed * 1.2, 0),
        b.getWorldCenter(),
        true,
      );
      ev = perfect ? { kind: "true" } : { kind: "off", rel };
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
    for (const c of this.claws) c.t += dt;
    this.claws = this.claws.filter((c) => c.t < 1);
    if (this.fall >= 0) {
      this.fall += dt;
      this.world.step(1 / 60, 20, 10);
      return { events, end: this.fall > 1.5 ? "won" : null };
    }
    // The mount: its sway, a blow's whip, and the drill sinking as the fight is won.
    this.pivotX = t.pivotSway > 0 ? Math.sin(this.time * 0.9) * t.pivotSway : 0;
    let vx = 0;
    if (this.strike) {
      this.strike.t += dt;
      vx =
        this.strike.t < 0.12
          ? this.strike.side * t.strikeKick
          : this.strike.t < 0.24
            ? -this.strike.side * t.strikeKick
            : 0;
      if (this.strike.t >= 0.24) this.strike = null;
    }
    const mp = this.mount.getPosition();
    this.mount.setLinearVelocity(
      new Vec2(vx + (vx === 0 ? -mp.x * 4 : 0), (m(this.sink) - mp.y) * 6),
    );
    const speed = t.slide + this.stones.length * t.slideGrow;
    this.stone.speed = speed;
    this.stone.x += this.stone.dir * speed * dt;
    if (this.stone.x > 1) {
      this.stone.x = 1;
      this.stone.dir = -1;
    } else if (this.stone.x < -1) {
      this.stone.x = -1;
      this.stone.dir = 1;
    }
    this.wallHit = false;
    this.world.step(1 / 60, 20, 10);
    // A slab knocking the rock: the Dark gains a little (one knock per half second).
    if (this.wallHit && this.time - this.wallT > 0.5) {
      this.wallT = this.time;
      this.drag -= t.suckCrack;
      events.push({ kind: "crack" });
    }
    // The Dark never lets go: it draws the drill up a little all the time, and sometimes heaves.
    this.drag -= t.suckIdle * dt;
    if (t.surgeEvery > 0) {
      this.surgeT += dt;
      if (this.surgeT >= t.surgeEvery) {
        this.surgeT = 0;
        this.drag -= t.surge;
        events.push({ kind: "surge" });
      }
    }
    // Its claws, and its blows to the rock.
    if (t.clawEvery > 0 && this.stones.length > 1) {
      this.clawT -= dt;
      if (this.clawT <= 0) {
        this.clawT = t.clawEvery * (0.7 + this.rand() * 0.6);
        const side = this.rand() < 0.5 ? -1 : 1;
        const i = Math.floor(this.rand() * this.stones.length);
        const b = this.stones[i]!.body;
        b.applyLinearImpulse(
          new Vec2(-side * (t.clawPush + this.stones.length * 0.12), 0.5),
          b.getWorldCenter(),
          true,
        );
        const y = this.pose(b).y;
        this.claws.push({ side, y, t: 0 });
        events.push({ kind: "claw", side, y });
      }
    }
    if (t.strikeEvery > 0) {
      this.strikeT -= dt;
      if (this.strikeT <= 0) {
        this.strikeT = t.strikeEvery * (0.7 + this.rand() * 0.6);
        const side = this.rand() < 0.5 ? -1 : 1;
        this.strike = { side, t: 0 };
        events.push({ kind: "strike", side });
      }
    }
    if (this.drag <= 0) return { events, end: "lost" };
    if (this.strain >= 1) {
      // Through: the drill is let go and falls with the chain.
      this.fall = 0;
      this.mount.setType("dynamic");
      this.mount.createFixture(new Box(m(40), m(30)), { density: 8, filterMaskBits: 0 });
      events.push({ kind: "snap" });
    }
    return { events, end: null };
  }
}

const m = (pxv: number): number => pxv / PPM;
const px = (mv: number): number => mv * PPM;

/** The Descent's tuning for a depth (tier 0..7). */
export function hangTune(tier: number): HangTune {
  const deep = tier / 7;
  return {
    snap: 14 + tier,
    stoneW: 120,
    shaft: 200 - tier * 10,
    pullTrue: 38,
    pullOff: 26 - tier,
    suckMiss: 34 + tier * 3,
    suckCrack: 10,
    suckIdle: 3.5 + tier * 1.2,
    slide: 1.05 + deep * 0.35,
    slideGrow: 0.025,
    window: 13 - tier * 0.6,
    surgeEvery: tier === 1 ? 6 : 0,
    surge: 30,
    pivotSway: tier === 5 || tier === 7 ? 26 : 0,
    clawEvery: [0, 0, 8, 7, 6, 7, 6, 5][tier] ?? 5,
    clawPush: 1.6 + deep * 0.8,
    strikeEvery: [0, 0, 0, 12, 10, 9, 9, 8][tier] ?? 8,
    strikeKick: 4 + deep * 2,
  };
}
