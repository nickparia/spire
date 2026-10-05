import { Body, Box, Vec2, World } from "planck";

/**
 * A rigid-body stage for the spire: slabs are boxes with weight and
 * friction, the ground and foundation are fixed, and the engine reads back
 * where everything has come to rest. Pixels in, pixels out; metres inside.
 */

/** Pixels per metre. Box2D is happiest with bodies between 0.1 and 10 m. */
const SCALE = 32;
/** Fixed sub-step for a deterministic, stable stack whatever the frame rate. */
const STEP = 1 / 120;
/** Below this speed, in px per second, a body counts as still. */
const REST = 6;
/** Seconds a body must be still before it counts as resting. */
const REST_TIME = 0.2;
/** Seconds at rest on the ground before a slab is set in place as rubble. */
const SET_TIME = 0.8;
/** Spin, in rad/s, that turns a resting slab into a topple. */
const TOPPLE_SPIN = 1.2;

export type BodyView = {
  /** Centre, world px. */
  cx: number;
  cy: number;
  w: number;
  h: number;
  /** Radians, anticlockwise. */
  angle: number;
  resting: boolean;
};

export class Stage {
  private world: World;
  private bodies = new Map<number, Body>();
  private sizes = new Map<number, { w: number; h: number }>();
  private nextId = 1;
  private carry = 0;
  /** Seconds each body has been still. */
  private still = new Map<number, number>();
  private toppled = false;

  constructor() {
    this.world = new World({ gravity: new Vec2(0, -30) });
    const ground = this.world.createBody({ position: new Vec2(0, -1) });
    ground.createFixture(new Box(200, 1), { friction: 1 });
  }

  /** A fixed slab, such as the foundation. Bottom-left corner in px. */
  addStatic(x: number, y: number, w: number, h: number): number {
    const id = this.nextId++;
    const body = this.world.createBody({
      position: new Vec2((x + w / 2) / SCALE, (y + h / 2) / SCALE),
    });
    body.createFixture(new Box(w / 2 / SCALE, h / 2 / SCALE), { friction: 1 });
    this.bodies.set(id, body);
    this.sizes.set(id, { w, h });
    return id;
  }

  /** A slab let go at rest, bottom-left corner in px. It falls from here. */
  drop(x: number, y: number, w: number, h: number): number {
    const id = this.nextId++;
    const body = this.world.createBody({
      type: "dynamic",
      position: new Vec2((x + w / 2) / SCALE, (y + h / 2) / SCALE),
      linearDamping: 0.4,
      angularDamping: 1.2,
      bullet: true,
    });
    body.createFixture(new Box(w / 2 / SCALE, h / 2 / SCALE), {
      density: 1,
      friction: 1,
      restitution: 0,
    });
    this.bodies.set(id, body);
    this.sizes.set(id, { w, h });
    this.still.set(id, 0);
    return id;
  }

  remove(id: number): void {
    const body = this.bodies.get(id);
    if (body) this.world.destroyBody(body);
    this.bodies.delete(id);
    this.sizes.delete(id);
    this.still.delete(id);
  }

  step(dt: number): void {
    this.carry += dt;
    let steps = 0;
    while (this.carry >= STEP && steps < 12) {
      this.world.step(STEP, 10, 4);
      this.carry -= STEP;
      steps++;
    }
    if (steps === 12) this.carry = 0;
    for (const [id, body] of this.bodies) {
      if (!body.isDynamic()) continue;
      const v = body.getLinearVelocity();
      const speed = Math.hypot(v.x, v.y) * SCALE;
      const spin = Math.abs(body.getAngularVelocity());
      const was = this.still.get(id) ?? 0;
      if (speed < REST && spin < 0.2) {
        const now = was + dt;
        this.still.set(id, now);
        // Rubble on the ground is set in place once it stops, so a heap
        // becomes a base you can read. The column above stays live.
        if (now >= SET_TIME && this.onGround(id)) body.setStatic();
      } else {
        if (was >= REST_TIME && spin > TOPPLE_SPIN) this.toppled = true;
        this.still.set(id, 0);
      }
    }
  }

  private onGround(id: number): boolean {
    const view = this.read(id);
    if (!view) return false;
    const c = Math.abs(Math.cos(view.angle));
    const s = Math.abs(Math.sin(view.angle));
    const bottom = view.cy - (view.h / 2) * c - (view.w / 2) * s;
    return bottom < 3;
  }

  /** True once since the last call if a resting slab has started to go over. */
  takeTopple(): boolean {
    const t = this.toppled;
    this.toppled = false;
    return t;
  }

  /** True when nothing on the stage is still moving. */
  settled(): boolean {
    for (const [id, body] of this.bodies) {
      if (body.isDynamic() && (this.still.get(id) ?? 0) < REST_TIME) return false;
    }
    return true;
  }

  read(id: number): BodyView | null {
    const body = this.bodies.get(id);
    const size = this.sizes.get(id);
    if (!body || !size) return null;
    const p = body.getPosition();
    return {
      cx: p.x * SCALE,
      cy: p.y * SCALE,
      w: size.w,
      h: size.h,
      angle: body.getAngle(),
      resting: !body.isDynamic() || (this.still.get(id) ?? 0) >= REST_TIME,
    };
  }

  /** Highest point, in px, of a body's box as it currently sits. */
  topOf(id: number): number {
    const view = this.read(id);
    if (!view) return 0;
    const c = Math.abs(Math.cos(view.angle));
    const s = Math.abs(Math.sin(view.angle));
    return view.cy + (view.h / 2) * c + (view.w / 2) * s;
  }
}
