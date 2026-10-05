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
/** Below this speed, in px per second, a body counts as resting. */
const REST = 6;

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

  constructor() {
    this.world = new World({ gravity: new Vec2(0, -22) });
    const ground = this.world.createBody({ position: new Vec2(0, -1) });
    ground.createFixture(new Box(200, 1), { friction: 0.9 });
  }

  /** A fixed slab, such as the foundation. Bottom-left corner in px. */
  addStatic(x: number, y: number, w: number, h: number): number {
    const id = this.nextId++;
    const body = this.world.createBody({
      position: new Vec2((x + w / 2) / SCALE, (y + h / 2) / SCALE),
    });
    body.createFixture(new Box(w / 2 / SCALE, h / 2 / SCALE), { friction: 0.9 });
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
      linearDamping: 0.15,
      angularDamping: 0.6,
      bullet: true,
    });
    body.createFixture(new Box(w / 2 / SCALE, h / 2 / SCALE), {
      density: 1,
      friction: 0.9,
      restitution: 0,
    });
    this.bodies.set(id, body);
    this.sizes.set(id, { w, h });
    return id;
  }

  remove(id: number): void {
    const body = this.bodies.get(id);
    if (body) this.world.destroyBody(body);
    this.bodies.delete(id);
    this.sizes.delete(id);
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
  }

  read(id: number): BodyView | null {
    const body = this.bodies.get(id);
    const size = this.sizes.get(id);
    if (!body || !size) return null;
    const p = body.getPosition();
    const v = body.getLinearVelocity();
    const speed = Math.hypot(v.x, v.y) * SCALE;
    const spin = Math.abs(body.getAngularVelocity());
    return {
      cx: p.x * SCALE,
      cy: p.y * SCALE,
      w: size.w,
      h: size.h,
      angle: body.getAngle(),
      resting: !body.isDynamic() || !body.isAwake() || (speed < REST && spin < 0.2),
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
