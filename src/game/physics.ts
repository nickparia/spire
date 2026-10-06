import { Body, Box, Vec2, WeldJoint, World } from "planck";

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
/** Seconds at rest, on the ground or crooked, before a slab is lost. */
const SET_TIME = 0.5;
/** Radians a slab can tilt and still be built on. */
export const LEVEL_TILT = 0.2;
/** Metres of height over which the sway grows before it levels off. */
const SWAY_REACH = 5;
/** Seconds a slab can sit crooked, moving or not, before it crumbles. */
const CROOKED_TIME = 0.6;
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
  /** Px per second. */
  speed: number;
  resting: boolean;
  /** True once the body has come down onto something; it stays true however it creeps after. */
  landed: boolean;
};

export class Stage {
  private world: World;
  private bodies = new Map<number, Body>();
  private sizes = new Map<number, { w: number; h: number }>();
  private nextId = 1;
  private carry = 0;
  /** Seconds each body has been still. */
  private still = new Map<number, number>();
  /** Seconds each body has been tilted past LEVEL_TILT. */
  private crooked = new Map<number, number>();
  private landed = new Set<number>();
  private toppled = false;
  private lost: number[] = [];
  /** Bodies waiting to set onto the body they were dropped on, once they land. */
  private setting = new Map<number, number>();
  private clock = 0;
  /** Sideways force per metre of height, swinging slowly from side to side. */
  sway = 0;

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

  /**
   * A slab let go at rest, bottom-left corner in px. It falls from here. A
   * perfect drop names the slab it was seated on: once it lands it sets to
   * it and the two move as one. Anything else stays loose, a hinge in the
   * tower.
   */
  drop(x: number, y: number, w: number, h: number, onto: number | null = null): number {
    const id = this.nextId++;
    const body = this.world.createBody({
      type: "dynamic",
      position: new Vec2((x + w / 2) / SCALE, (y + h / 2) / SCALE),
      linearDamping: 0.1,
      angularDamping: 0.3,
      bullet: true,
    });
    body.createFixture(new Box(w / 2 / SCALE, h / 2 / SCALE), {
      density: 1,
      friction: 0.6,
      restitution: 0,
    });
    this.bodies.set(id, body);
    this.sizes.set(id, { w, h });
    this.still.set(id, 0);
    this.crooked.set(id, 0);
    if (onto !== null && this.bodies.has(onto)) this.setting.set(id, onto);
    return id;
  }

  /** A sideways shove at a slab's top edge, in px/s of speed, enough to start a lean. */
  shove(id: number, vx: number): void {
    const body = this.bodies.get(id);
    const size = this.sizes.get(id);
    if (!body || !size || !body.isDynamic()) return;
    body.setAwake(true);
    const p = body.getPosition();
    const at = new Vec2(p.x, p.y + size.h / 2 / SCALE);
    body.applyLinearImpulse(new Vec2((vx / SCALE) * body.getMass(), 0), at, true);
  }

  remove(id: number): void {
    const body = this.bodies.get(id);
    if (body) this.world.destroyBody(body);
    this.bodies.delete(id);
    this.sizes.delete(id);
    this.still.delete(id);
    this.crooked.delete(id);
    this.setting.delete(id);
    this.landed.delete(id);
  }

  step(dt: number): void {
    this.carry += dt;
    let steps = 0;
    while (this.carry >= STEP && steps < 12) {
      this.clock += STEP;
      if (this.sway > 0) {
        // A breath of air that swings sides every few seconds: never enough
        // to move a true column, enough to finish off a lean. It grows with
        // height up the first few floors and no further.
        const push = this.sway * Math.sin(this.clock * 0.6);
        for (const body of this.bodies.values()) {
          if (!body.isDynamic()) continue;
          const p = body.getPosition();
          const lift = Math.min(p.y, SWAY_REACH);
          body.applyForceToCenter(new Vec2(push * lift * body.getMass(), 0), true);
        }
      }
      this.world.step(STEP, 10, 4);
      this.carry -= STEP;
      steps++;
    }
    if (steps === 12) this.carry = 0;
    const sim = steps * STEP;
    for (const [id, body] of this.bodies) {
      if (!body.isDynamic()) continue;
      // Crooked for long enough, resting or not, and it crumbles: a slab
      // balanced askew on the column is not a floor and must not block one.
      if (Math.abs(body.getAngle()) > LEVEL_TILT) {
        const tilt = (this.crooked.get(id) ?? 0) + sim;
        this.crooked.set(id, tilt);
        if (tilt >= CROOKED_TIME) {
          this.lost.push(id);
          continue;
        }
      } else this.crooked.set(id, 0);
      const v = body.getLinearVelocity();
      const speed = Math.hypot(v.x, v.y) * SCALE;
      const spin = Math.abs(body.getAngularVelocity());
      // Landed: it has touched something. Creeping afterwards does not undo it.
      if (!this.landed.has(id)) {
        for (let ce = body.getContactList(); ce; ce = ce.next) {
          if (ce.contact.isTouching()) {
            this.landed.add(id);
            break;
          }
        }
      }
      const was = this.still.get(id) ?? 0;
      if (speed < REST && spin < 0.2) {
        const now = was + dt;
        this.still.set(id, now);
        if (now >= REST_TIME) this.set(id);
        // Rubble on the ground is set in place once it stops, so a heap
        // becomes a base you can read. The column above stays live.
        // What settles on the ground is gone too: the base you keep
        // is whatever still lies level enough to build on.
        if (now >= SET_TIME && this.onGround(id)) this.lost.push(id);
      } else {
        if (was >= REST_TIME && spin > TOPPLE_SPIN) this.toppled = true;
        this.still.set(id, 0);
      }
    }
  }

  /** Welds a resting slab to another at once, whatever its tilt: a brace. */
  weld(id: number, onto: number): void {
    const body = this.bodies.get(id);
    const base = this.bodies.get(onto);
    if (!body || !base || !body.isDynamic()) return;
    this.setting.delete(id);
    this.world.createJoint(new WeldJoint({}, base, body, body.getPosition()));
  }

  /** Gives a slab a new width about its centre, keeping its weight per metre. */
  resize(id: number, w: number): void {
    const body = this.bodies.get(id);
    const size = this.sizes.get(id);
    if (!body || !size) return;
    for (let f = body.getFixtureList(); f; f = f.getNext()) body.destroyFixture(f);
    body.createFixture(new Box(w / 2 / SCALE, size.h / 2 / SCALE), {
      density: 1,
      friction: body.isDynamic() ? 0.6 : 1,
      restitution: 0,
    });
    this.sizes.set(id, { w, h: size.h });
  }

  /** Welds a landed slab to the one it was seated on. */
  private set(id: number): void {
    const onto = this.setting.get(id);
    if (onto === undefined) return;
    this.setting.delete(id);
    const body = this.bodies.get(id);
    const base = this.bodies.get(onto);
    if (!body || !base || Math.abs(body.getAngle()) > LEVEL_TILT) return;
    this.world.createJoint(new WeldJoint({}, base, body, body.getPosition()));
  }

  private onGround(id: number): boolean {
    const view = this.read(id);
    if (!view) return false;
    const c = Math.abs(Math.cos(view.angle));
    const s = Math.abs(Math.sin(view.angle));
    const bottom = view.cy - (view.h / 2) * c - (view.w / 2) * s;
    return bottom < 3;
  }

  /** Bodies that have come to rest on the ground since the last call. */
  takeLost(): number[] {
    const ids = this.lost;
    this.lost = [];
    return ids;
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
    const v = body.getLinearVelocity();
    return {
      cx: p.x * SCALE,
      cy: p.y * SCALE,
      w: size.w,
      h: size.h,
      angle: body.getAngle(),
      speed: Math.hypot(v.x, v.y) * SCALE,
      landed: !body.isDynamic() || this.landed.has(id),
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
