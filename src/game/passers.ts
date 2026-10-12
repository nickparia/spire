/**
 * Passers-by: things the climb goes past at a height — a flock, a cloud you
 * climb through, a sheet of rain, a sun or moon breaking through, a torn kite
 * on the ridge. Each is painted (art/passers/<kind>.webp, with alpha), placed
 * by a sky in its data, drawn behind the tower at a depth, and never in the
 * slab's lane. No effect on play: the sky becoming a place.
 */

export type PasserKind = "birds" | "cloud" | "rain" | "sun" | "moon" | "kite" | "scraps";

export type Passer = {
  /** The floor at which it is met. */
  at: number;
  kind: PasserKind;
  /** How far behind the tower it is, 1 at the tower's plane down to 0.1 at the horizon; sets parallax and size. */
  depth?: number;
  /** Which side it comes from (−1 left, 1 right); the kind's default otherwise. */
  side?: -1 | 1;
};

export type PasserLook = {
  /** Drawn width at depth 1, px. */
  w: number;
  /** Drift across the sky, px/s at depth 1 (0: stays put, climbs past). */
  speed: number;
  /** Gentle rise and fall, px, and its period, s. */
  bob: number;
  bobPeriod: number;
  /** Slow turn, radians either way. */
  roll: number;
  alpha: number;
  depth: number;
  /** Floors above the top of the tower it appears at when met. */
  above: number;
  /** Tiled across the width and scrolled down: rain. */
  sheet?: boolean;
  /** Painted as light on black and drawn with a screen blend: glows, cloud, rain. */
  light?: boolean;
};

export const PASSER_LOOKS: Record<PasserKind, PasserLook> = {
  birds: {
    w: 320,
    speed: 46,
    bob: 10,
    bobPeriod: 5,
    roll: 0.04,
    alpha: 0.85,
    depth: 0.7,
    above: 5,
  },
  cloud: {
    w: 520,
    speed: 14,
    bob: 4,
    bobPeriod: 9,
    roll: 0,
    alpha: 0.8,
    depth: 0.5,
    above: 4,
    light: true,
  },
  rain: {
    w: 400,
    speed: 0,
    bob: 0,
    bobPeriod: 1,
    roll: 0,
    alpha: 0.5,
    depth: 0.85,
    above: 3,
    sheet: true,
    light: true,
  },
  sun: {
    w: 360,
    speed: 3,
    bob: 0,
    bobPeriod: 1,
    roll: 0,
    alpha: 0.9,
    depth: 0.15,
    above: 9,
    light: true,
  },
  moon: {
    w: 200,
    speed: 2,
    bob: 0,
    bobPeriod: 1,
    roll: 0,
    alpha: 0.9,
    depth: 0.12,
    above: 9,
    light: true,
  },
  kite: {
    w: 180,
    speed: 22,
    bob: 18,
    bobPeriod: 3.2,
    roll: 0.25,
    alpha: 0.95,
    depth: 0.8,
    above: 5,
  },
  scraps: {
    w: 240,
    speed: 60,
    bob: 24,
    bobPeriod: 2.4,
    roll: 0.6,
    alpha: 0.9,
    depth: 0.75,
    above: 4,
  },
};
