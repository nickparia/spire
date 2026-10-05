import type { RGB } from "./logic";

export type ThemeId =
  "foundry" | "ridge" | "city" | "tide" | "canyon" | "glacier" | "eclipse" | "apex";

export type LayerKind = "ridge" | "peaks" | "skyline" | "mesa" | "works" | "cloudbank";

/** One band of scenery. `depth` 0 is pinned to the sky, 1 moves with the tower. */
export type LayerDef = {
  kind: LayerKind;
  depth: number;
  /** Tallest point, px above the layer's base. */
  height: number;
  /** Crest colour, fading to `bottom` at the base so distance reads as haze. */
  top: string;
  bottom: string;
  seed: number;
  lights?: string;
  caps?: string;
  /** Horizontal drift, px per second. */
  drift?: number;
};

export type Weather = "embers" | "gale" | "rain" | "mist" | "dust" | "snow" | "ash" | "stardust";

export type Orb = {
  kind: "sun" | "moon" | "eclipse";
  /** 0..1 across the view. */
  x: number;
  /** px above the horizon at ground level. */
  y: number;
  r: number;
  color: string;
  glow: RGB;
};

export type Track = {
  /** MIDI note of the tonic. */
  root: number;
  bpm: number;
  pad: OscillatorType;
  lead: OscillatorType;
  /** Octaves the lead sits above the pad. */
  lift: number;
};

export type Theme = {
  id: ThemeId;
  /** Sky gradient (top, middle, horizon) at ground level and at the summit. */
  skyLow: [RGB, RGB, RGB];
  skyHigh: [RGB, RGB, RGB];
  accent: RGB;
  slab: [RGB, RGB, RGB];
  ground: { top: string; body: string; deep: string };
  horizon: RGB;
  orb: Orb | null;
  /** Star brightness at ground level and at the summit. */
  stars: [number, number];
  layers: LayerDef[];
  cloud: { tint: RGB; alpha: number; count: number };
  weather: Weather;
  extra: "aurora" | "waves" | null;
  track: Track;
};

function hex(value: string): RGB {
  const n = parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function sky(top: string, mid: string, low: string): [RGB, RGB, RGB] {
  return [hex(top), hex(mid), hex(low)];
}

export const THEMES: Record<ThemeId, Theme> = {
  foundry: {
    id: "foundry",
    skyLow: sky("#0d0b0a", "#21140f", "#5a2410"),
    skyHigh: sky("#050507", "#0f0c10", "#241612"),
    accent: [255, 77, 26],
    slab: [
      [176, 78, 52],
      [255, 77, 26],
      [247, 211, 195],
    ],
    ground: { top: "#3b2a22", body: "#1c1512", deep: "#0d0a08" },
    horizon: [255, 96, 32],
    orb: { kind: "sun", x: 0.74, y: 34, r: 44, color: "#ff8a3c", glow: [255, 110, 40] },
    stars: [0.15, 0.9],
    layers: [
      { kind: "works", depth: 0.1, height: 250, top: "#2b1a14", bottom: "#4a2415", seed: 11 },
      {
        kind: "works",
        depth: 0.22,
        height: 190,
        top: "#1e130f",
        bottom: "#2f1a12",
        seed: 23,
        lights: "#ff8a3c",
      },
      {
        kind: "works",
        depth: 0.42,
        height: 130,
        top: "#140d0b",
        bottom: "#1c120e",
        seed: 37,
        lights: "#ffb060",
      },
      { kind: "ridge", depth: 0.68, height: 64, top: "#0b0807", bottom: "#0b0807", seed: 41 },
    ],
    cloud: { tint: [60, 40, 32], alpha: 0.5, count: 7 },
    weather: "embers",
    extra: null,
    track: { root: 50, bpm: 88, pad: "sawtooth", lead: "triangle", lift: 1 },
  },

  ridge: {
    id: "ridge",
    skyLow: sky("#1c2a52", "#5a5f96", "#f2a877"),
    skyHigh: sky("#0a1130", "#1f2c5c", "#56609a"),
    accent: [255, 178, 102],
    slab: [
      [92, 110, 168],
      [244, 158, 112],
      [255, 238, 214],
    ],
    ground: { top: "#59608c", body: "#262b4a", deep: "#12152a" },
    horizon: [255, 190, 140],
    orb: { kind: "sun", x: 0.27, y: 52, r: 36, color: "#ffe2b8", glow: [255, 200, 150] },
    stars: [0.05, 0.8],
    layers: [
      { kind: "ridge", depth: 0.1, height: 260, top: "#6f74a6", bottom: "#c79a9c", seed: 5 },
      {
        kind: "peaks",
        depth: 0.22,
        height: 200,
        top: "#474e80",
        bottom: "#7d7aa6",
        seed: 17,
        caps: "#ffe9d6",
      },
      {
        kind: "peaks",
        depth: 0.42,
        height: 140,
        top: "#2b3058",
        bottom: "#474a78",
        seed: 29,
        caps: "#d9d6ee",
      },
      { kind: "ridge", depth: 0.68, height: 70, top: "#161a34", bottom: "#161a34", seed: 43 },
    ],
    cloud: { tint: [255, 214, 190], alpha: 0.55, count: 9 },
    weather: "gale",
    extra: null,
    track: { root: 52, bpm: 92, pad: "triangle", lead: "sine", lift: 2 },
  },

  city: {
    id: "city",
    skyLow: sky("#0a0620", "#2c0f4e", "#7a1f74"),
    skyHigh: sky("#03020c", "#0c0624", "#22103f"),
    accent: [255, 72, 168],
    slab: [
      [124, 76, 228],
      [255, 72, 168],
      [190, 244, 255],
    ],
    ground: { top: "#4b2a78", body: "#170b30", deep: "#0a0518" },
    horizon: [255, 80, 190],
    orb: { kind: "moon", x: 0.78, y: 300, r: 24, color: "#f4eaff", glow: [200, 170, 255] },
    stars: [0.2, 0.85],
    layers: [
      {
        kind: "skyline",
        depth: 0.1,
        height: 270,
        top: "#35185e",
        bottom: "#5c2070",
        seed: 3,
        lights: "#ff9ad8",
      },
      {
        kind: "skyline",
        depth: 0.22,
        height: 210,
        top: "#21103f",
        bottom: "#34154f",
        seed: 19,
        lights: "#7ff2ff",
      },
      {
        kind: "skyline",
        depth: 0.42,
        height: 150,
        top: "#150a2c",
        bottom: "#1d0d36",
        seed: 31,
        lights: "#ffd76a",
      },
      {
        kind: "skyline",
        depth: 0.68,
        height: 76,
        top: "#0a0518",
        bottom: "#0a0518",
        seed: 47,
      },
    ],
    cloud: { tint: [150, 80, 190], alpha: 0.3, count: 6 },
    weather: "rain",
    extra: null,
    track: { root: 54, bpm: 100, pad: "sawtooth", lead: "square", lift: 1 },
  },

  tide: {
    id: "tide",
    skyLow: sky("#0a2236", "#1f6470", "#ffc98c"),
    skyHigh: sky("#040e1c", "#0b2a3c", "#1f6470"),
    accent: [86, 226, 204],
    slab: [
      [30, 124, 136],
      [86, 226, 204],
      [236, 255, 250],
    ],
    ground: { top: "#4f8f92", body: "#123a44", deep: "#081d24" },
    horizon: [255, 206, 150],
    orb: { kind: "sun", x: 0.5, y: 60, r: 40, color: "#ffe6bc", glow: [255, 210, 150] },
    stars: [0.05, 0.8],
    layers: [
      { kind: "ridge", depth: 0.08, height: 190, top: "#3c7a84", bottom: "#b9b596", seed: 7 },
      { kind: "ridge", depth: 0.16, height: 150, top: "#24545e", bottom: "#4f8a8c", seed: 13 },
    ],
    cloud: { tint: [255, 216, 176], alpha: 0.5, count: 8 },
    weather: "mist",
    extra: "waves",
    track: { root: 48, bpm: 84, pad: "triangle", lead: "sine", lift: 2 },
  },

  canyon: {
    id: "canyon",
    skyLow: sky("#3a1c4c", "#c4553c", "#ffb85e"),
    skyHigh: sky("#170d2c", "#5c2749", "#c4553c"),
    accent: [255, 174, 66],
    slab: [
      [156, 62, 42],
      [255, 146, 54],
      [255, 234, 184],
    ],
    ground: { top: "#c8683e", body: "#4a1b18", deep: "#260d0e" },
    horizon: [255, 200, 110],
    orb: { kind: "sun", x: 0.7, y: 110, r: 30, color: "#fff2c8", glow: [255, 210, 130] },
    stars: [0, 0.75],
    layers: [
      { kind: "mesa", depth: 0.1, height: 250, top: "#b0553f", bottom: "#eb9a5c", seed: 9 },
      { kind: "mesa", depth: 0.22, height: 195, top: "#8a382c", bottom: "#bd5c3c", seed: 21 },
      { kind: "mesa", depth: 0.42, height: 135, top: "#5a2020", bottom: "#7c2f26", seed: 33 },
      { kind: "ridge", depth: 0.68, height: 62, top: "#2e1014", bottom: "#2e1014", seed: 45 },
    ],
    cloud: { tint: [255, 204, 150], alpha: 0.35, count: 5 },
    weather: "dust",
    extra: null,
    track: { root: 55, bpm: 96, pad: "sawtooth", lead: "triangle", lift: 1 },
  },

  glacier: {
    id: "glacier",
    skyLow: sky("#041225", "#0c2c4e", "#22627f"),
    skyHigh: sky("#02060f", "#06142a", "#0c2c4e"),
    accent: [124, 232, 255],
    slab: [
      [54, 94, 168],
      [124, 222, 255],
      [240, 252, 255],
    ],
    ground: { top: "#a9e2f2", body: "#173a5a", deep: "#091a2c" },
    horizon: [110, 220, 230],
    orb: { kind: "moon", x: 0.2, y: 330, r: 20, color: "#eaf8ff", glow: [150, 210, 255] },
    stars: [0.55, 1],
    layers: [
      {
        kind: "peaks",
        depth: 0.1,
        height: 260,
        top: "#25476e",
        bottom: "#4b86a0",
        seed: 2,
        caps: "#d8f3ff",
      },
      {
        kind: "peaks",
        depth: 0.22,
        height: 200,
        top: "#16305a",
        bottom: "#27557a",
        seed: 14,
        caps: "#bfe8f8",
      },
      {
        kind: "peaks",
        depth: 0.42,
        height: 140,
        top: "#0c1d3a",
        bottom: "#14304f",
        seed: 26,
        caps: "#9fd4ea",
      },
      { kind: "ridge", depth: 0.68, height: 66, top: "#060f20", bottom: "#060f20", seed: 38 },
    ],
    cloud: { tint: [170, 220, 240], alpha: 0.22, count: 5 },
    weather: "snow",
    extra: "aurora",
    track: { root: 57, bpm: 80, pad: "triangle", lead: "sine", lift: 2 },
  },

  eclipse: {
    id: "eclipse",
    skyLow: sky("#040307", "#150b20", "#3a1a36"),
    skyHigh: sky("#000000", "#07040c", "#150b20"),
    accent: [255, 216, 150],
    slab: [
      [96, 78, 124],
      [216, 168, 124],
      [255, 242, 214],
    ],
    ground: { top: "#4a3a5c", body: "#120b1a", deep: "#07040b" },
    horizon: [255, 170, 120],
    orb: { kind: "eclipse", x: 0.5, y: 330, r: 52, color: "#000000", glow: [255, 214, 160] },
    stars: [0.7, 1],
    layers: [
      { kind: "ridge", depth: 0.1, height: 220, top: "#1a1026", bottom: "#3a1c3a", seed: 4 },
      { kind: "peaks", depth: 0.22, height: 180, top: "#110a1a", bottom: "#1d1028", seed: 16 },
      { kind: "ridge", depth: 0.42, height: 120, top: "#0a0610", bottom: "#100818", seed: 28 },
      { kind: "peaks", depth: 0.68, height: 70, top: "#050308", bottom: "#050308", seed: 40 },
    ],
    cloud: { tint: [90, 60, 100], alpha: 0.25, count: 4 },
    weather: "ash",
    extra: null,
    track: { root: 46, bpm: 76, pad: "sawtooth", lead: "triangle", lift: 2 },
  },

  apex: {
    id: "apex",
    skyLow: sky("#0b0b30", "#48308a", "#ff9e8c"),
    skyHigh: sky("#000006", "#07071f", "#1c1654"),
    accent: [255, 222, 124],
    slab: [
      [118, 96, 210],
      [255, 152, 142],
      [255, 246, 216],
    ],
    ground: { top: "#ffd9c8", body: "#5a418c", deep: "#2a1d4c" },
    horizon: [255, 190, 170],
    orb: { kind: "sun", x: 0.5, y: 40, r: 46, color: "#fff4d6", glow: [255, 200, 170] },
    stars: [0.45, 1],
    layers: [
      {
        kind: "cloudbank",
        depth: 0.1,
        height: 150,
        top: "#f0a6a8",
        bottom: "#b877ac",
        seed: 6,
        drift: 3,
      },
      {
        kind: "cloudbank",
        depth: 0.22,
        height: 130,
        top: "#c887b4",
        bottom: "#8d5ea6",
        seed: 18,
        drift: 6,
      },
      {
        kind: "cloudbank",
        depth: 0.42,
        height: 110,
        top: "#9567ae",
        bottom: "#664690",
        seed: 30,
        drift: 10,
      },
      {
        kind: "cloudbank",
        depth: 0.68,
        height: 80,
        top: "#6a4a98",
        bottom: "#46306e",
        seed: 42,
        drift: 16,
      },
    ],
    cloud: { tint: [255, 220, 220], alpha: 0.4, count: 6 },
    weather: "stardust",
    extra: null,
    track: { root: 47, bpm: 104, pad: "sawtooth", lead: "square", lift: 2 },
  },
};

export function rgbCss(c: RGB, a = 1): string {
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
}
