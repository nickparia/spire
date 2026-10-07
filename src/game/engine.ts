import { AudioRig } from "./audio";
import { Backdrop, type BackdropView } from "./backdrop";
import {
  BASE_TUNING,
  CAPSTONES,
  familyCount,
  styleOf,
  hasCapstone,
  HEAT,
  offer,
  tuneFor,
  upgrade,
  WEAPONS,
  windowFor,
  type Family,
  type Picks,
  type Tuning,
  type UpgradeId,
  type WeaponId,
} from "./build";
import { Fx } from "./fx";
import {
  BASE_REACH,
  buyLevel,
  buyRank,
  dropCoins,
  forgeOffers,
  houseOf,
  kitFor,
  summitCoins,
  type Kit,
  type Offer,
  type Payout,
} from "./gear";
import { haptics } from "./haptics";
import { ENDLESS_PLAN, endlessTheme, LEVELS, levelPlan } from "./levels";
import {
  type CourseId,
  DARK_PUSH,
  DARK_START,
  type DropResult,
  FORGE_GROW,
  type Ghost,
  type Goals,
  MIN_W,
  type Plan,
  QUICK_GROW,
  type RGB,
  SPLIT_TEMPO,
  beatPhase,
  clamp01,
  courseHint,
  courseLabel,
  dropAccuracy,
  dropOffset,
  fallDuration,
  fallShare,
  ghostBetter,
  ghostHeight,
  goalsFor,
  graceFor,
  heldWidth,
  isKeystone,
  mix,
  ramp,
  resolveDrop,
  shade,
  shouldSpawnBomb,
  shouldSpawnMote,
  starCount,
  swayOffset,
  tensionFor,
  tolerance,
  travelRate,
} from "./logic";
import { Music } from "./music";
import { earn, featsFor, type FeatId } from "./feats";
import { LEVEL_TILT, Stage } from "./physics";
import { isBoss, worldOf, WORLDS } from "./worlds";
import { isLanding, LANDING_BY_ID, landingOffer, type LandingId } from "./landing";
import {
  BOMB_RGB,
  drawBomb,
  drawLandingGhost,
  drawPickup,
  drawRushLane,
  drawShieldDome,
  drawSlowBadge,
  drawStreamer,
  drawWalls,
  drawWindLane,
  LULL_RGB,
  pickupRgb,
  SHIELD_RGB,
  type PickupKind,
} from "./props";
import {
  type RunOutcome,
  type Save,
  emptySave,
  loadSave,
  nextLevelIndex,
  recordRun,
  skiesLit,
  storeSave,
  totalStars,
} from "./save";
import { Sfx } from "./sfx";
import { rgbCss, THEMES, type Theme } from "./themes";

const STEP = 1 / 60;
const SLAB_H = 28;
/** The dust rubble is drawn in. */
const RUBBLE_RGB: RGB = [112, 100, 94];
/** The fight: surges to beat, floors below the top the Dark must be driven, seconds between takings. */
const BOSS_SURGES = 3;
const BOSS_DEPTH = 12;
const BOSS_START = 6;
const BOSS_TENDRIL = 4;
/**
 * The escape: floors above the top the source starts, its speed and
 * acceleration on the first world in floors per second, floors a charged slab
 * drives it back, and the combo of quick breaks that makes a surge.
 */
const ESCAPE_START = 7;
const ESCAPE_SPEED = 0.9;
const ESCAPE_ACCEL = 0.015;
const ESCAPE_CHARGE = 0.6;
const ESCAPE_SURGE_AT = 6;
const ESCAPE_COMBO_GAP = 0.42;
/**
 * Bindings: a slab wrapped in every few floors of the tower at the start,
 * seconds between new tendrils during the run, and taps to tear one free.
 * Seconds the first-time briefing shows before the countdown.
 */
const ESCAPE_BIND_EVERY = 7;
const ESCAPE_BIND_INTERVAL = 3.6;
const ESCAPE_BIND_TAPS = 3;
const ESCAPE_BRIEF = 5.5;
/**
 * The escape's rhythm: seconds per pulse of the light, how far either side
 * of a pulse a tap still counts as on it, what share of a slab an off-pulse
 * tap breaks, and floors the source lunges when it sees you move.
 */
const ESCAPE_BEAT = 0.42;
const ESCAPE_BEAT_WINDOW = 0.1;
const ESCAPE_OFFBEAT = 0.34;
const ESCAPE_LUNGE = 6;
/** Seconds the summit sting plays, when it is there. */
/** How far down the painted Dark its surface lies, as a share of its height. */
const DARK_ART_SURFACE = 0.2;
/** Down the screen the Descent's tip sits, as a share of the view. */
const DESCENT_SEAT = 0.42;
/** Skies with a living painted plate in public/art/sky/; the rest are drawn. */
const PAINTED_SKIES: readonly string[] = ["foundry"];
type SlabLook = "fire" | "ice" | "charge";
/** Each living slab's box inside its sheet's frames, as shares of the frame. */
const SLAB_LOOKS: Record<SlabLook, { l: number; r: number; top: number; bot: number }> = {
  fire: { l: 0.016, r: 0.983, top: 0.367, bot: 0.929 },
  ice: { l: 0.012, r: 0.989, top: 0.058, bot: 0.692 },
  charge: { l: 0.013, r: 0.988, top: 0.122, bot: 0.85 },
};
const SLAB_LOOK_FRAMES = 12;
const SLAB_LOOK_FPS = 10;
/** A perfect streak this long sets the top slab alight; each perfect after spreads it a floor, to this many. */
const FIRE_STREAK = 4;
const FIRE_MAX = 5;
type ClimberKind = "swarm" | "mite" | "brute" | "lantern";
/** Size, in px, of each kind of climber at the front. */
const CLIMBER_SIZE: Record<ClimberKind, number> = { swarm: 84, mite: 50, brute: 116, lantern: 86 };
/** Frames per second of each kind's crawl. */
const CLIMBER_FPS: Record<ClimberKind, number> = { swarm: 9, mite: 15, brute: 6, lantern: 11 };
/** Seconds a crushed climber stays flattened, and before another takes its place. */
const CLIMBER_SQUASH = 0.45;
const CLIMBER_RESPAWN = 3;

/** One climber in the swarm, fixed by its index: where it is, what it is. */
function climber(i: number): {
  kind: ClimberKind;
  x: number;
  depth: number;
  r: number;
  flip: boolean;
} {
  const h = (n: number) => {
    const v = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  const kind: ClimberKind =
    i % 13 === 12 ? "lantern" : i % 9 === 8 ? "brute" : i % 5 === 3 ? "mite" : "swarm";
  return { kind, x: h(1), depth: h(2), r: h(3), flip: h(4) < 0.5 };
}
/** What spills when a climber is crushed. */
const BLOOD_RGB: RGB = [150, 18, 24];
const BLOOD_DEEP_RGB: RGB = [70, 6, 12];
/** The painted slab's end caps and centre mark, as shares of its width. */
const SLAB_CAP = 0.058;
const SLAB_MID = 0.07;
/** Climbers drawn at the front. */
const CLIMBERS = 20;
/** Floors behind the tip the climbers are held within, however fast you build. */
const DESCENT_REACH = 7;
/** Floors a cut-off piece knocks the climbers back, plus more for a wide one. */
const SQUASH_PUSH = 0.6;
const SQUASH_PER_WIDTH = 1.6;
const ESCAPE_STING = 5;
/** Seconds between slabs in a chain of perfects going off. */
const ESCAPE_CHAIN_STEP = 0.07;
/** Floors below the top that light can drive the Dark, and no further. */
const DARK_REACH = 12;
/** Past par, the Dark climbs this much faster per second over, called out every QUICKEN_EVERY seconds. */
const QUICKEN_RATE = 0.04;
const QUICKEN_EVERY = 10;
/** Coins for beating your own ghost to the summit. */
const GHOST_PURSE = 25;
/** Seconds the top must stand at goal height before the summit counts. */
const SUMMIT_HOLD = 0.45;
const VISUAL_H = 24;
const GROUND = 156;
/** How far below the top of the view the stack's top sits, as a share of view height. */
const LEAD = 0.22;
/** In the menus the ground rides a little higher, clear of the buttons. */
const MENU_LIFT = 56;
/** Room the results card needs at the foot of the view, px. */
const CARD_H = 560;
const GOLD = "#ffd24a";
const GOLD_RGB: RGB = [255, 210, 74];
/** A run can carry this many shields at once. */
const MAX_SHIELDS = 3;
const BONE: RGB = [246, 241, 232];
/** How many times each pickup or hazard explains itself before going quiet. */
const TIP_SHOWS = 3;

const TIPS = {
  shield:
    "Brace: good. Land the slab on the outline under it to take it. Your next loose drop sets.",
  lull: "Lull: good. Land the slab on the outline under it. The next slab moves slowly.",
  bomb: "Bomb: bad. Don't tap. Wait for the fuse to burn out; tap early and it takes a bite.",
  fall: "The slab hangs above the stack now. Tap and it falls.",
  loose:
    "Loose: it landed off the groove, so it sits unset and tips under weight. A perfect on top sets it.",
  dark: "The Dark is rising from below. Perfects and the forge push it back. Don't let it reach the top.",
  split: "Split: the slab is two halves on two clocks. Drop when both sit over their own side.",
  ember:
    "Ember: good. Land the slab on the outline under it to claim an upgrade. Miss it and it's gone.",
  wind: "Wind carries the slab as it falls. Drop when the streamer's tip is over the groove.",
} as const;

export type HudPhase = "menu" | "ready" | "play" | "pick" | "over" | "won";
export type RunMode = "level" | "endless";

export type LevelResult = {
  levelIndex: number;
  time: number;
  accuracy: number;
  perfects: number;
  floors: number;
  bestStreak: number;
  goals: Goals;
  outcome: RunOutcome;
  coins: Payout;
  /** The run used a paid rebuild, which forfeits the pace star. */
  rebuilt: boolean;
  /** What the forge has on the table, priced for your house. */
  offers: Offer[];
  /** The ghost's summit time, whose it was, and whether this run beat it. Null the first time. */
  ghost: { time: number; beaten: boolean; name: string } | null;
  /** This run's trace, for the leaderboard. */
  trace: Ghost;
  /** Feats earned on this summit, newest last. */
  feats: FeatId[];
  /** Skies relit after this one, and the total. */
  lit: number;
  /** This summit beat a world's boss. */
  boss: boolean;
  /** Practice or a boss-only run: shown, not posted. */
  unranked: boolean;
};

export type Hud = {
  phase: HudPhase;
  paused: boolean;
  mode: RunMode;
  levelIndex: number;
  floors: number;
  /** Floors to the summit; 0 in endless. */
  goal: number;
  score: number;
  streak: number;
  perfects: number;
  /** Mean landing accuracy so far, 0..1. */
  accuracy: number;
  /** Run clock, frozen at the moment the run ended. */
  time: number;
  best: number;
  newBest: boolean;
  course: string;
  blurb: string;
  relic: string;
  hold: boolean;
  hint: boolean;
  /** One line explaining the pickup or hazard on screen, or empty. */
  tip: string;
  /** Coins earned so far this run. */
  runCoins: number;
  /** The Heat meter, 0..1. */
  heat: number;
  weapon: WeaponId;
  /** The Chisel is charged and waiting for a perfect. */
  charged: boolean;
  /** Slabs still slowed by the Slipstream. */
  slip: number;
  /** Workshop ranks owned, by class. */
  ranks: Record<Family, number>;
  /** Upgrades taken this run, by family. */
  families: Record<Family, number>;
  /** Upgrades on offer while the run is paused for a pick. */
  offers: UpgradeId[];
  /** How the run was climbed, once it has ended. */
  style: Family | null;
  /** The class you have built most: your house. */
  house: Family;
  /** Coins in the wallet. */
  coins: number;
  /** Floors between the Dark and the top of the stack; null when it isn't rising. */
  darkGap: number | null;
  /** Built down: the Dark is the climbers. */
  descent: boolean;
  /** The current sky's accent, as a CSS colour. */
  accent: string;
  result: LevelResult | null;
  /** A paid rebuild on offer after a fall, with the seconds left to take it. */
  rescue: { price: number; seconds: number } | null;
  /** True when the Dark, not a missed drop, ended the run. */
  taken: boolean;
  /** Floors ahead of the ghost, negative when behind; null without one. */
  ghostGap: number | null;
  /** Whose ghost: "BEST" for your own, else the rival's name. */
  ghostName: string;
  /** The fight at the top of a boss sky: which surge, of how many. */
  boss: { surge: number; of: number } | null;
  /** The escape: floors left to the ground, and the combo toward a surge. */
  escape: {
    left: number;
    combo: number;
    briefing: boolean;
    sting: boolean;
    gaze: "shut" | "stir" | "watch";
    /** Seconds the eye stirs before it opens. */
    stirFor: number;
    count: number;
    bound: number;
  } | null;
  /** A landing to choose from. */
  landing: { floor: number; offers: LandingId[] } | null;
};

export type EngineEvents = {
  onHud: (hud: Hud) => void;
  onSave: (save: Save) => void;
};

/** A snapshot for automated play-testing: enough to time a tap, nothing more. */
export type Probe = {
  phase: HudPhase;
  floors: number;
  offset: number;
  tol: number;
  blocked: boolean;
  /** Signed distance from the slab's groove to a pickup's line, or null if there is none. */
  pickup: number | null;
  time: number;
};

type Slab = {
  x: number;
  y: number;
  w: number;
  floor: number;
  rgb: RGB;
  anim: number;
  flash: number;
  /** Seconds until a queued flash fires; negative when none is queued. */
  ripple: number;
  /** A widening in progress: the width it grew from and how far along it is. */
  grow: { from: number; t: number } | null;
  /** A split floor: the two pieces it is made of, when they don't touch. */
  pieces: Piece[] | null;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  fallDelay: number;
  falling: boolean;
  key: boolean;
  /** Its rigid body on the physics stage, when the sky runs one. */
  body: number | null;
  /** On the stage: landed off the groove, so it sits unset, a hinge in the tower. */
  loose: boolean;
  /** On the stage: landed close enough to the groove to be a floor. Anything else is rubble. */
  counts: boolean;
};

type Piece = { x: number; w: number };

/** One slab of the tower as it stood when the sky was lit: what the escape runs down. */
type EscapeSlab = {
  x: number;
  y: number;
  w: number;
  rot: number;
  floor: number;
  rgb: RGB;
  /** Set true by a perfect: breaking it releases light that drives the source back. */
  charged: boolean;
  /** Loose or rubble: takes two taps. */
  heavy: boolean;
};

type Scrap = {
  x: number;
  y: number;
  w: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  rgb: RGB;
  life: number;
  /** Down the Descent: it has already landed on the climbers. */
  squashed?: boolean;
};

type Floater = {
  text: string;
  x: number;
  y: number;
  vy: number;
  life: number;
  max: number;
  hot: boolean;
  size: number;
  /** Overrides the colour, and draws a coin beside the text. */
  coin: boolean;
};

type Mover = {
  u: number;
  x: number;
  y: number;
  w: number;
  dir: number;
  halfSpan: number;
  center: number;
  period: number;
  pxSpeed: number;
  wind: number;
  course: CourseId;
  keystone: boolean;
  /** Slowed by a lull picked up on the floor below. */
  slowed: boolean;
  /** Height it hangs above its seat; 0 for a slab that slides in at seat level. */
  hover: number;
  /** Sideways distance the wind will carry it on the way down. */
  drift: number;
  guide: boolean;
  /** Seconds into the fall, or -1 while it is still hanging. */
  fallT: number;
  fallTime: number;
  fallFrom: number;
  /** Width when it appeared; it shrinks from this the longer it is held. */
  w0: number;
  /** Seconds it has been held. */
  age: number;
  /** Width lost since the last chunk broke off, and which end breaks next. */
  crumb: number;
  crumbSide: number;
  /** Split: the slab is two halves. `x` is the left half; these drive the right. */
  split: boolean;
  u2: number;
  dir2: number;
  x2: number;
};

type Mote = { x: number; y: number; kind: PickupKind };
type Bomb = { x: number; y: number; fuse: number; max: number; flash: number };

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function hashNoise(t: number): number {
  const s = Math.sin(t * 41.2) + Math.sin(t * 17.7 + 2.1) + Math.sin(t * 7.3 + 4.2);
  return s / 3;
}

export class SpireEngine {
  private ctx: CanvasRenderingContext2D;
  private events: EngineEvents;
  private rig = new AudioRig();
  private sfx = new Sfx(this.rig);
  private music: Music;
  private fx = new Fx();
  private save: Save;

  private raf = 0;
  private last = 0;
  private acc = 0;
  private running = false;
  private paused = false;
  private reduceMotion = false;

  private viewW = 390;
  private viewH = 844;
  private dpr = 1;
  /** View size in world units: the real view divided by the zoom. */
  private vw = 390;
  private vh = 844;
  private horizonY = 844 - GROUND;

  private mode: RunMode = "level";
  private levelIndex = 0;
  private plan: Plan = levelPlan(LEVELS[0]!, 0);
  private theme: Theme = THEMES.foundry;
  private backdrop: Backdrop;
  private anchor = 0;
  private fading: { backdrop: Backdrop; anchor: number } | null = null;
  private fade = 1;
  private fadeCanvas: HTMLCanvasElement | null = null;
  /** Black overlay that covers a hard cut between runs. */
  private curtain = 0;

  private phase: "menu" | "ready" | "play" | "pick" | "fall" | "won" = "menu";
  private stack: Slab[] = [];
  private mover: Mover = {
    u: 0,
    x: 0,
    y: 0,
    w: 160,
    dir: 1,
    halfSpan: 80,
    center: 0,
    period: 1,
    pxSpeed: 200,
    wind: 1,
    course: "slide",
    keystone: false,
    slowed: false,
    hover: 0,
    drift: 0,
    guide: false,
    fallT: -1,
    fallTime: 0,
    fallFrom: 0,
    w0: 160,
    age: 0,
    crumb: 0,
    crumbSide: 1,
    split: false,
    u2: 0,
    dir2: 1,
    x2: 0,
  };
  private mote: Mote | null = null;
  private bomb: Bomb | null = null;
  private kit: Kit = kitFor({}, {}, "buttress");
  private tune: Tuning = BASE_TUNING;
  private picks: Picks = {};
  private offers: UpgradeId[] = [];
  private weapon: WeaponId = "buttress";
  private heat = 0;
  /** Run clock at the last landing; -1 before the first. */
  private lastLand = -1;
  private charged = false;
  /** Chisel strikes left on the current charge. */
  private charges = 0;
  private slip = 0;
  private shields = 0;
  private shieldAge = 0;
  private secondWindUsed = false;
  /** The paid continue: offered once, and it costs the pace star. */
  private rescue: { price: number; until: number; stack: { x: number; y: number }[] } | null = null;
  private rebuilt = false;
  private taken = false;
  private fastDrops = 0;
  /** The rigid-body stage, on skies that run physics. */
  private stage: Stage | null = null;
  /** Height of the Dark's surface, world px, and where it is drawn as it eases there. */
  private dark = DARK_START;
  private darkShown = DARK_START;
  private calledCutter = false;
  /** The title's self-building spire. */
  private demoAge = 0;
  private demoNext = 0;
  private demoLit = false;
  private runCoins = 0;
  private lull = false;
  private moteArmed = false;
  private slow = 0;
  private tip = "";
  private wind = 1;
  /** The floor the wind last turned on; the lane is shown for two floors after. */
  private windTurnedAt = -9;
  private courseSeen: CourseId = "slide";
  private beatOn = false;
  private scraps: Scrap[] = [];
  private floaters: Floater[] = [];

  private startW = 180;
  private dir = 1;
  private floors = 0;
  private score = 0;
  private streak = 0;
  private bestStreak = 0;
  private perfects = 0;
  private drops = 0;
  private accuracySum = 0;
  private runTime = 0;
  private ghostFloors = 0;
  private newBest = false;
  private crossed = false;
  private hint = true;
  private result: LevelResult | null = null;

  private tol = 12;
  private wasInZone = false;
  private freeze = 0;
  private fallAge = 0;
  private wonAge = 0;
  private camAtWin = 0;
  private fitZoom = 1;
  private pull = 0;
  private shellsLeft = 0;
  private nextShell = 0;
  private starCues: number[] = [];
  private camX = 0;
  /** On the stage: where the camera, the held slab and the floor count rest, updated only once the slabs have settled. */
  private seat = { x: 0, y: SLAB_H };
  /** Seconds of slow motion left while a topple plays out. */
  private slowmo = 0;
  /** Seconds the settled top has stood at or above the goal. */
  private summitHold = 0;
  /** A practice or boss-only run: not posted, not kept as a ghost. */
  private unranked = false;
  /** The last ten-second step past par the Dark was called out quickening on. */
  private quickStep = -1;
  /** Seconds the Dark holds still after a topple, for the Runner's Breather. */
  private breather = 0;
  /**
   * The boss at the top of a world's last sky: the Dark awake. It rises in
   * surges; each is driven back by light until it falls below the line, and
   * the third sends it under for good. It climbs on your mistakes.
   */
  private boss: { surge: number; tendril: number; eye: number; crown: number } | null = null;
  /**
   * The escape: the sky is lit, its source comes down for the light, and the
   * light runs down the tower it was carried up, breaking it floor by floor.
   */
  private escape: {
    /** World y of the source's lower edge; it comes down. */
    source: number;
    speed: number;
    accel: number;
    /** Seconds before it moves: the beat of lighting the sky. */
    hold: number;
    /** Taps left to break the top slab. */
    hits: number;
    combo: number;
    lastBreak: number;
    charged: Set<Slab>;
    heavy: Set<Slab>;
    total: number;
    eye: number;
    /** A chain of charged slabs going off one after another: seconds to the next. */
    chain: number | null;
    chained: number;
    /** Slabs a tendril has wrapped: taps left to tear each free, and when it took hold. */
    bound: Map<Slab, { taps: number; at: number }>;
    /** Seconds to the next tendril reaching in. */
    bindT: number;
    bindEvery: number;
    /** The briefing is showing (first time only); then the countdown. */
    briefing: boolean;
    /** The painted sting is playing. */
    sting: boolean;
    /** The great eye: shut, stirring (about to open), or watching. */
    gaze: "shut" | "stir" | "watch";
    /** Seconds left in the current gaze state. */
    gazeT: number;
    /** The source's rhythm for this world: seconds shut, stirring, watching. */
    gazeShut: number;
    gazeStir: number;
    gazeWatch: number;
    /** Seconds into the light's pulse. */
    beatT: number;
    /** Seconds the eye flares red after catching you moving. */
    seen: number;
    /** Whole seconds left on the countdown, or 0 once running. */
    count: number;
  } | null = null;
  /** Where the source's great eye is on screen this frame. */
  private eyeAt = { x: 0, y: 0, r: 15 };
  /** The painted source (public/art/source.mp4), drawn into the chase when it has loaded. */
  private sourceArt: HTMLVideoElement | null = null;
  private sourceArtReady = false;
  private sourceMask: HTMLCanvasElement | null = null;
  /** Living painted skies by theme: the plate's loop, and its near ruins. */
  private skies = new Map<
    string,
    { video: HTMLVideoElement; fg: HTMLImageElement; ready: boolean }
  >();
  /** How the slab being painted looks: alight, frozen, charged, or plain. */
  private slabLookNow: SlabLook | null = null;
  /** Sprite sheets (public/art/sprites/<name>.webp), one row of square frames. */
  private sprites = new Map<string, HTMLImageElement>();
  /** Climbers crushed, by index, with the clock when it happened. */
  private climberDead = new Map<number, number>();
  /** The painted slab (public/art/slab-hearth.png), cut so it fits any width. */
  private slabArt: HTMLImageElement | null = null;
  /** The Descent's painted shaft, behind everything when building down. */
  private shaftArt: HTMLImageElement | null = null;
  /** The painted Dark (public/art/dark-<world>.mp4), drawn beneath its edge once loaded. */
  private darkArt: HTMLVideoElement | null = null;
  private darkArtReady = false;
  private darkMask: HTMLCanvasElement | null = null;
  /** The summit sting (public/art/escape-sting.mp4) is there to play. */
  private stingReady = false;
  /** The tower as it stood at the summit, kept so a failed escape can be retried from there. */
  private escapeTower: EscapeSlab[] | null = null;
  /** The landing being chosen from, if the climb is stopped at one. */
  private landing: { floor: number; offers: LandingId[] } | null = null;
  /** Landings already taken this run, by floor. */
  private landed = new Set<number>();
  /** Gifts in effect: slabs left that set wherever they land, wide, or slow. */
  private gift = { set: 0, broad: 0, slow: 0 };
  /** This run's trace: the second each floor was first reached. */
  private trace: number[] = [0];
  /** The run to race on this level, your own best or a rival's; null the first time. */
  private ghost: Ghost | null = null;
  /** Who the ghost is: "BEST" for your own, else the rival's name. */
  private ghostName = "BEST";
  private camY = 0;
  private camDrop = 0;
  private look = 0;
  private trauma = 0;
  private flash = 0;
  private pulse = 0;
  private flare = 0;
  private strain = 0;
  private clock = 0;
  private vignette: CanvasGradient | null = null;

  constructor(canvas: HTMLCanvasElement, events: EngineEvents) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    this.ctx = ctx;
    this.events = events;
    this.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.fx.calm = this.reduceMotion;
    this.save = loadSave();
    this.loadSourceArt();
    this.loadDarkArt();
    this.rig.setMusic(this.save.music);
    this.rig.setSfx(this.save.sfx);
    this.music = new Music(this.rig, this.theme.track);
    this.backdrop = new Backdrop(this.theme);
  }

  /* ----------------------------------------------------------- lifecycle */

  start(): void {
    this.resize();
    this.showMenu(nextLevelIndex(this.save));
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    document.addEventListener("visibilitychange", this.onVisible);
    this.events.onSave(this.save);
  }

  destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    document.removeEventListener("visibilitychange", this.onVisible);
    this.music.stop();
    this.rig.hold();
  }

  resize(): void {
    const canvas = this.ctx.canvas;
    const parent = canvas.parentElement;
    const w = parent?.clientWidth || window.innerWidth;
    const h = parent?.clientHeight || window.innerHeight;
    if (w < 2 || h < 2) return;
    this.viewW = w;
    this.viewH = h;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * this.dpr);
    canvas.height = Math.round(h * this.dpr);
    this.vignette = null;
    this.fadeCanvas = null;
    this.backdrop.resize(w, h, this.dpr, this.climb());
    this.fading?.backdrop.resize(w, h, this.dpr, this.climb());
  }

  private onVisible = (): void => {
    if (document.visibilityState === "visible") {
      this.rig.release();
      this.last = performance.now();
      return;
    }
    // Backgrounded: stop the clock and the sound rather than play on unseen.
    this.rig.hold();
    this.pause();
  };

  /* -------------------------------------------------------------- inputs */

  /** Call from any user gesture so the audio can start. */
  wake(): void {
    if (this.rig.unlock()) this.music.start();
  }

  /** The title is tapped: the sting, and the score swells in. */
  awaken(): void {
    this.wake();
    this.music.swellIn();
    this.sfx.awaken();
  }

  tap(): void {
    this.wake();
    if (this.paused || this.phase === "menu" || this.phase === "won" || this.phase === "pick") {
      return;
    }
    if (this.phase === "fall") {
      // While a rebuild is on offer, a stray tap must not throw it away.
      // After the escape, frantic tapping must not skip what happened.
      const wait = this.escapeTower ? 1.6 : 0.68;
      if (this.fallAge >= wait && !this.rescueOpen()) this.retry();
      return;
    }
    if (this.escape) {
      this.breakTop();
      return;
    }
    if (this.freeze > 0 || this.mover.fallT >= 0) return;
    if (this.bomb && this.bomb.fuse > 0) {
      this.detonate();
      return;
    }
    if (this.mover.hover > 0) this.release();
    else this.place();
  }

  /** Back to the menus, with the given level's sky behind them. */
  showMenu(levelIndex: number): void {
    this.escapeTower = null;
    this.mode = "level";
    this.levelIndex = Math.max(0, Math.min(LEVELS.length - 1, levelIndex));
    const level = LEVELS[this.levelIndex]!;
    this.plan = levelPlan(level, this.levelIndex);
    const cut = this.phase !== "menu";
    this.setTheme(THEMES[level.theme], 0, !cut);
    this.resetRun("menu", cut);
    this.music.setTrack(this.theme.track);
    this.music.setMood("menu");
  }

  /**
   * Tester tools: a boss sky started at its summit on a finished, set tower,
   * straight into the fight. The run is unranked.
   */
  startBoss(levelIndex: number): void {
    this.startLevel(levelIndex);
    if (!this.stage) return;
    this.unranked = true;
    const goal = this.plan.goal;
    const x = -this.startW / 2;
    for (let f = 1; f <= goal; f++) {
      const slab = this.makeSlab(x, f * SLAB_H, this.startW, f, 0, 0);
      slab.body = this.stage.addStatic(x, f * SLAB_H, this.startW, SLAB_H);
      this.stack.push(slab);
    }
    this.floors = goal;
    this.mark(goal);
    this.seat = { x: 0, y: (goal + 1) * SLAB_H };
    this.camY = Math.max(0, this.seat.y - this.viewH * LEAD);
    this.phase = "play";
    this.hint = false;
    this.lightTheSky();
  }

  startLevel(levelIndex: number): void {
    this.mode = "level";
    this.levelIndex = Math.max(0, Math.min(LEVELS.length - 1, levelIndex));
    const level = LEVELS[this.levelIndex]!;
    this.plan = levelPlan(level, this.levelIndex);
    this.setTheme(THEMES[level.theme], 0, false);
    this.begin();
  }

  startEndless(): void {
    this.mode = "endless";
    this.plan = ENDLESS_PLAN;
    this.setTheme(THEMES.foundry, 0, false);
    this.begin();
  }

  retry(): void {
    if (this.mode === "endless") this.startEndless();
    else if (this.escapeTower && isBoss(LEVELS[this.levelIndex]!.id)) {
      // A failed escape is retried from the summit, on the same tower.
      const tower = this.escapeTower;
      const unranked = this.unranked;
      this.startLevel(this.levelIndex);
      this.unranked = unranked;
      this.beginEscape(tower, false);
    } else this.startLevel(this.levelIndex);
  }

  pause(): void {
    if (this.paused || (this.phase !== "ready" && this.phase !== "play")) return;
    this.paused = true;
    this.music.setMood("menu");
    this.emit();
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.last = performance.now();
    this.acc = 0;
    this.music.setMood("play");
    this.emit();
  }

  setMusic(on: boolean): void {
    this.wake();
    this.save.music = on;
    this.rig.setMusic(on);
    this.commit();
  }

  setSfx(on: boolean): void {
    this.wake();
    this.save.sfx = on;
    this.rig.setSfx(on);
    if (on) this.sfx.ui();
    this.commit();
  }

  /** Takes one of the upgrades on offer and resumes the run. */
  choose(index: number): void {
    if (this.phase !== "pick") return;
    if (this.landing) {
      this.takeLanding(index);
      return;
    }
    const id = this.offers[index];
    if (!id) return;
    const def = upgrade(id);
    const family = def.family;
    const before = hasCapstone(this.picks, family);
    this.picks[id] = (this.picks[id] ?? 0) + 1;
    this.tune = tuneFor(this.picks);
    this.offers = [];
    const top = this.peak()!;
    const cx = top.x + top.w / 2;
    if (id === "shield") {
      this.shields = Math.min(MAX_SHIELDS, this.shields + 1);
      this.shieldAge = 0;
      this.sfx.shieldUp();
    }
    if (id === "broad") this.widen(top, Math.min(this.startW, top.w * 1.08));
    this.float(def.name.toUpperCase(), cx, top.y + 60, true, 22);
    if (!before && hasCapstone(this.picks, family)) {
      // Three of a kind: the capstone lands with a flourish.
      const cap = CAPSTONES[family];
      this.float(cap.name.toUpperCase(), cx, top.y + 96, true, 28);
      this.fx.rayBurst(cx, top.y + VISUAL_H / 2, this.theme.accent, 200, 16);
      this.pulse = 1;
      this.sfx.summit();
      haptics.success();
    } else {
      this.sfx.pick();
      haptics.medium();
    }
    this.phase = "play";
    this.spawnMover();
    this.emit();
  }

  /** Takes a save restored from elsewhere, when nothing is being played. */
  adoptSave(save: Save): void {
    if (this.phase !== "menu") return;
    this.save = save;
    this.kit = kitFor(this.save.tracks, this.save.levels2, this.save.weapon);
    this.commit();
    this.showMenu(this.levelIndex);
  }

  /** Awards a feat earned outside a summit; true when it is new. */
  award(id: FeatId): boolean {
    const fresh = earn(this.save.feats, [id], Date.now()).length > 0;
    if (fresh) this.commit();
    return fresh;
  }

  /** The shell's way to change what the leaderboard needs: name and rival. */
  updateSave(
    patch: Pick<
      Partial<Save>,
      | "name"
      | "rival"
      | "rivalGhosts"
      | "shadeSeen"
      | "whatsNewSeen"
      | "updateSnoozed"
      | "challengesOn"
      | "tester"
      | "practice"
      | "progress"
      | "storySeen"
      | "chaptersSeen"
    >,
  ): void {
    Object.assign(this.save, patch);
    this.commit();
  }

  setWeapon(id: WeaponId): void {
    this.wake();
    if (this.save.weapon !== id) {
      this.save.weapon = id;
      this.sfx.ui();
      this.commit();
    }
  }

  /** Buys the next tier of a workshop device. Returns false if it can't be afforded. */
  /** Wipes progress and starts again. Sound settings survive. */
  resetProgress(): void {
    this.wake();
    const { music, sfx } = this.save;
    this.save = { ...emptySave(), music, sfx };
    this.commit();
    this.sfx.slice();
    this.showMenu(0);
  }

  /** Buys the next rank on a class track. Returns false if it can't be afforded. */
  /** Takes one of the forge's offers on the summit card. Returns false if it can't be bought. */
  forge(index: number): boolean {
    const result = this.result;
    const offer = result?.offers[index];
    if (!result || !offer || offer.needs > 0) return false;
    this.wake();
    const house = houseOf(this.save.tracks, this.save.weapon);
    const lit = skiesLit(this.save);
    if (offer.kind === "rank") {
      const deal = buyRank(this.save.coins, this.save.tracks, offer.family, lit, house);
      if (!deal) {
        this.sfx.sputter();
        return false;
      }
      this.save.coins = deal.coins;
      this.save.tracks = deal.tracks;
    } else {
      const deal = buyLevel(this.save.coins, this.save.levels2, this.save.weapon, lit, house);
      if (!deal) {
        this.sfx.sputter();
        return false;
      }
      this.save.coins = deal.coins;
      this.save.levels2 = deal.levels;
    }
    this.sfx.buy();
    haptics.medium();
    this.result = { ...result, offers: this.offersNow() };
    this.commit();
    this.emit();
    return true;
  }

  private offersNow(): Offer[] {
    return forgeOffers(
      this.save.coins,
      this.save.tracks,
      this.save.levels2,
      this.save.weapon,
      skiesLit(this.save),
    );
  }

  click(): void {
    this.wake();
    this.sfx.ui();
  }

  /** Seconds on the run clock. Read every frame by the HUD. */
  get time(): number {
    return this.runTime;
  }

  /** The offset a bot should close: the worse half when the slab is split. */
  private probeOffset(prev: Slab): number {
    if (!this.mover.split) return dropOffset(prev.x, prev.w, this.landingX(), this.mover.w);
    const [l, r] = this.splitOffsets(prev);
    return Math.abs(l) >= Math.abs(r) ? l : r;
  }

  probe(): Probe {
    const prev = this.peak();
    return {
      phase: this.hudPhase(),
      floors: this.floors,
      offset: prev ? this.probeOffset(prev) : 0,
      tol: this.tol,
      blocked:
        this.paused ||
        this.freeze > 0 ||
        this.mover.fallT >= 0 ||
        (!!this.bomb && this.bomb.fuse > 0),
      pickup: this.mote ? this.landingCenter() - this.mote.x : null,
      time: this.runTime,
    };
  }

  /* ---------------------------------------------------------------- runs */

  private climb(): number {
    return this.plan.goal > 0 ? this.plan.goal * SLAB_H : 5 * SLAB_H;
  }

  private setTheme(theme: Theme, anchor: number, crossfade: boolean): void {
    if (this.backdrop.theme.id === theme.id) {
      if (!crossfade) {
        this.anchor = anchor;
        this.fading = null;
        this.fade = 1;
      }
      this.theme = theme;
      return;
    }
    this.fading = crossfade ? { backdrop: this.backdrop, anchor: this.anchor } : null;
    this.fade = crossfade ? 0 : 1;
    this.theme = theme;
    this.anchor = anchor;
    this.backdrop = new Backdrop(theme);
    this.backdrop.resize(this.viewW, this.viewH, this.dpr, this.climb());
  }

  private begin(): void {
    this.resetRun("ready", true);
    this.music.setTrack(this.theme.track);
    this.music.setMood("play");
    this.music.setTension(0);
    this.music.restart();
    // Ranks announce themselves where they act, starting with the ones that act at once.
    const base = this.stack[0]!;
    if (this.kit.shields > 0) {
      this.float(this.kit.shields > 1 ? "BULWARK" : "BRACE", 0, base.y + 70, true, 18);
    }
    if (this.kit.footing > 1) this.float("WIDE FOOTING", 0, base.y + 96, false, 16);
  }

  private resetRun(phase: "menu" | "ready", cut: boolean): void {
    this.phase = phase;
    this.paused = false;
    this.hint = phase === "ready";
    this.floors = 0;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.perfects = 0;
    this.drops = 0;
    this.accuracySum = 0;
    this.runTime = 0;
    this.newBest = false;
    this.crossed = false;
    this.result = null;
    this.ghostFloors = this.mode === "endless" ? this.save.endless.bestFloors : 0;
    this.scraps = [];
    this.floaters = [];
    this.fx.clear();
    this.freeze = 0;
    this.fallAge = 0;
    this.wonAge = 0;
    this.pull = 0;
    this.shellsLeft = 0;
    this.starCues = [];
    this.trauma = 0;
    this.flash = 0;
    this.pulse = 0;
    this.strain = 0;
    this.wasInZone = false;
    this.dir = 1;
    this.wind = 1;
    this.weapon = this.save.weapon;
    this.kit = kitFor(this.save.tracks, this.save.levels2, this.weapon);
    this.tune = BASE_TUNING;
    this.picks = {};
    this.offers = [];
    this.heat = 0;
    this.lastLand = -1;
    this.charged = false;
    this.charges = 0;
    this.slip = 0;
    this.shields = phase === "ready" ? this.kit.shields : 0;
    this.secondWindUsed = false;
    this.calledCutter = false;
    this.rescue = null;
    this.rebuilt = false;
    this.fastDrops = 0;
    this.dark = DARK_START;
    this.darkShown = DARK_START;
    this.shieldAge = 0;
    this.runCoins = 0;
    this.lull = false;
    this.moteArmed = false;
    this.slow = 0;
    this.tip = "";
    this.mote = null;
    this.bomb = null;
    this.courseSeen = "slide";
    this.beatOn = false;
    this.camX = 0;
    this.camY = 0;
    this.camDrop = 0;
    this.look = 0;
    if (cut) this.curtain = 1;
    this.backdrop.resize(this.viewW, this.viewH, this.dpr, this.climb());

    this.startW =
      this.viewW < 520
        ? Math.max(156, Math.min(214, this.viewW * 0.48))
        : Math.max(220, Math.min(300, this.viewW * 0.26));
    this.startW *= this.kit.footing;
    this.stack = [this.makeSlab(-this.startW / 2, 0, this.startW, 0, 1, 0)];
    this.stage = null;
    if (this.plan.physics && phase === "ready") {
      this.stage = new Stage();
      this.stage.sway = this.plan.sway * this.kit.sway;
      this.stack[0]!.body = this.stage.addStatic(-this.startW / 2, 0, this.startW, SLAB_H);
    }
    this.seat = { x: 0, y: SLAB_H };
    this.slowmo = 0;
    this.summitHold = 0;
    this.quickStep = -1;
    this.unranked = phase === "ready" && this.save.practice;
    this.breather = 0;
    this.boss = null;
    this.escape = null;
    this.landing = null;
    this.landed.clear();
    this.gift = { set: 0, broad: 0, slow: 0 };
    this.trace = [0];
    this.ghost = null;
    this.ghostName = "BEST";
    if (phase === "ready" && this.mode === "level") {
      const id = LEVELS[this.levelIndex]!.id;
      const rival = this.save.rival ? this.save.rivalGhosts[id] : undefined;
      if (rival) {
        this.ghost = rival;
        this.ghostName = this.save.rival!.name;
      } else this.ghost = this.save.ghosts[id] ?? null;
    }
    this.taken = false;
    this.demoAge = 0;
    this.demoNext = 0.8;
    this.demoLit = false;
    this.spawnMover();
    this.emit();
  }

  /**
   * The title's living spire: behind the menu a stack builds itself, lights
   * its beacon, and after a moment begins again. It is the game's promise
   * shown rather than told.
   */
  private attract(dt: number): void {
    const goal = 12;
    this.demoAge += dt;
    const top = this.peak()!;
    if (!this.demoLit) {
      if (this.stack.length <= goal) {
        this.demoNext -= dt;
        if (this.demoNext > 0) return;
        const n = this.stack.length;
        const drift = this.reduceMotion ? 0 : (Math.random() - 0.5) * 8;
        const slab = this.makeSlab(top.x + drift, top.y + SLAB_H, top.w, n, 0, 1);
        slab.rgb = ramp(this.theme.slab, n / goal);
        this.stack.push(slab);
        const cx = slab.x + slab.w / 2;
        this.fx.seam(cx, slab.y, slab.w * 1.3, mix(this.theme.accent, BONE, 0.5));
        this.fx.sparkle(cx, slab.y + 2, slab.w, mix(this.theme.accent, BONE, 0.55), 6);
        this.pulse = Math.max(this.pulse, 0.3);
        this.camDrop = 40;
        this.demoNext = 0.5 + Math.random() * 0.3;
        return;
      }
      this.demoLit = true;
      this.demoAge = 0;
      const cx = top.x + top.w / 2;
      const crown = top.y + VISUAL_H;
      this.fx.rayBurst(cx, crown, this.theme.accent, 240, 18);
      this.fx.ring(cx, crown, BONE, 200, 5);
      this.fx.sparkle(cx, crown, top.w, mix(this.theme.accent, BONE, 0.5), 30);
      for (let i = 0; i < this.stack.length; i++) this.stack[i]!.ripple = i * 0.035;
      this.pulse = 1;
      this.shellsLeft = this.reduceMotion ? 1 : 5;
      this.nextShell = 0.5;
      return;
    }
    if (this.shellsLeft > 0 && this.demoAge >= this.nextShell) {
      this.shellsLeft -= 1;
      this.nextShell += 0.4 + Math.random() * 0.4;
      const palette: RGB[] = [this.theme.accent, BONE, this.theme.slab[1]];
      this.fx.firework(
        this.camX + (Math.random() - 0.5) * this.vw * 0.7,
        top.y + 80 + Math.random() * 140,
        palette[this.shellsLeft % palette.length]!,
        0.7 + Math.random() * 0.4,
      );
    }
    if (this.demoAge > 6) {
      // Begin again: the camera eases back down to a fresh foundation.
      this.stack = [this.makeSlab(-this.startW / 2, 0, this.startW, 0, 1, 0)];
      this.fx.clear();
      this.demoLit = false;
      this.demoAge = 0;
      this.demoNext = 1.2;
      this.curtain = 0.5;
    }
  }

  private makeSlab(
    x: number,
    y: number,
    w: number,
    floor: number,
    anim: number,
    flash: number,
  ): Slab {
    return {
      x,
      y,
      w,
      floor,
      rgb: this.slabColor(floor),
      anim,
      flash,
      ripple: -1,
      grow: null,
      pieces: null,
      vx: 0,
      vy: 0,
      rot: 0,
      vr: 0,
      fallDelay: 0,
      falling: false,
      key: false,
      body: null,
      loose: false,
      counts: true,
    };
  }

  /** Levels run one ramp base to summit; in endless each sky paints its own band. */
  private slabColor(floor: number): RGB {
    if (this.plan.goal > 0) return ramp(this.theme.slab, floor / this.plan.goal);
    if (floor < 5) return ramp(this.theme.slab, (floor / 5) * 0.6);
    return ramp(this.theme.slab, 0.1 + (((floor - 5) % 5) / 4) * 0.8);
  }

  private spawnMover(): void {
    const prev = this.peak()!;
    let w = prev.w;
    if (this.gift.broad > 0) {
      this.gift.broad -= 1;
      w = Math.min(this.startW * 1.6, w * 1.33);
    }
    const course: CourseId = this.boss ? "slide" : this.plan.courseAt(this.floors);
    const halfSpan = Math.max(w * 0.98, 80);
    const center = prev.x + prev.w / 2;
    this.dir = -this.dir;
    const dir = this.dir;
    const fall = this.plan.fallAt(this.floors);
    // Wind that carries a falling slab holds for six floors, so it can be
    // read and relied on; a shift is called out and shown for two floors.
    const turned = !fall || fall.drift <= 0 || this.floors % 6 === 0;
    if (turned) {
      this.wind = -this.wind;
      this.windTurnedAt = this.floors;
    }
    const slipping = this.slip > 0;
    const slowGift = this.gift.slow > 0;
    if (slowGift) this.gift.slow -= 1;
    const slowed = this.lull || slipping || slowGift;
    const period = this.plan.periodAt(this.floors) * (slowed ? 1.8 : 1);
    this.lull = false;
    if (slipping) this.slip -= 1;
    const keystone = isKeystone(this.plan, this.floors);
    this.mover = {
      u: dir > 0 ? -0.92 : 0.92,
      x: 0,
      y: this.seatY() + (fall?.hover ?? 0) + (this.stage ? SLAB_H * 3 : 0),
      w,
      dir,
      halfSpan,
      center,
      period,
      pxSpeed: halfSpan * travelRate(course, dir, this.wind, 0, period, this.clock),
      wind: this.wind,
      course,
      keystone,
      slowed,
      hover: fall?.hover ?? 0,
      drift:
        (fall?.drift ?? 0) *
        this.tune.drift *
        (slipping && this.kit.slipCalm ? 0 : slowed ? 0.5 : 1),
      guide: fall?.guide ?? false,
      fallT: -1,
      fallTime: fallDuration(fall?.hover ?? 0),
      fallFrom: 0,
      w0: w,
      age: 0,
      crumb: 0,
      crumbSide: 1,
      split: course === "split",
      u2: dir > 0 ? 0.56 : -0.56,
      dir2: -dir,
      x2: 0,
    };

    if (this.floors === 2 && this.plan.darkRate > 0) this.explain("dark");
    this.syncMoverX();
    this.tol = this.toleranceNow();
    this.wasInZone = false;
    this.mote = null;
    this.moteArmed = false;
    this.tip = "";
    if (fall) {
      this.explain(fall.drift > 0 ? "wind" : "fall");
      const firstGust = fall.drift > 0 && course !== this.courseSeen;
      if (fall.drift > 0 && turned && !firstGust && this.phase !== "menu") {
        this.float("WIND SHIFTS", center, prev.y + SLAB_H + fall.hover + 62, false, 18);
      }
    }
    const ember = this.plan.pickAt(this.floors) && this.phase !== "menu";
    if (ember || shouldSpawnMote(this.plan, this.floors)) {
      // Just outside the perfect window: taking it costs a sliver of slab,
      // and the outline on the stack shows exactly which sliver.
      const nudge = Math.min(halfSpan * 0.5, Math.max(this.tol + 26, w * 0.22));
      const side = this.floors % 8 === 1 ? 1 : -1;
      this.mote = {
        x: center + side * nudge,
        y: prev.y + SLAB_H + VISUAL_H + 34,
        kind: ember ? "ember" : this.floors % 8 === 1 ? "shield" : "lull",
      };
      this.explain(this.mote.kind);
    }
    this.bomb = null;
    // A charged Chisel lets no bomb land.
    if (!this.mote && !this.charged && shouldSpawnBomb(this.plan, this.floors)) {
      const fuse = Math.max(0.78, 1.35 - this.floors * 0.012) * this.kit.fuse * this.tune.fuse;
      this.bomb = {
        x: center,
        y: prev.y + SLAB_H + VISUAL_H + 50,
        fuse,
        max: fuse,
        flash: 0,
      };
      this.explain("bomb");
      if (this.kit.fuse < 1 && !this.calledCutter) {
        this.calledCutter = true;
        const name = this.kit.fuse <= 0.5 ? "SNUFFER" : "FUSE CUTTER";
        this.float(name, center, prev.y + SLAB_H + 110, false, 16);
      }
    }
    if (course !== this.courseSeen) {
      this.courseSeen = course;
      if (this.mode === "endless") {
        // A new course brings a new sky, anchored where the camera is now.
        this.setTheme(THEMES[endlessTheme(course)], this.camY, true);
        this.music.setTrack(this.theme.track);
      }
      this.float(
        courseHint(course).toUpperCase(),
        center,
        prev.y + SLAB_H + (fall?.hover ?? 0) + 88,
        true,
        17,
      );
    } else if (keystone && this.phase !== "menu") {
      this.float("KEYSTONE", center, prev.y + SLAB_H + 48, true);
    }
  }

  /** Shows a one-line tip the first few times a pickup or hazard turns up. */
  private explain(kind: keyof typeof TIPS): void {
    if (this.phase === "menu") return;
    const shown = this.save.tips[kind] ?? 0;
    if (shown >= TIP_SHOWS) return;
    this.save.tips[kind] = shown + 1;
    storeSave(this.save);
    this.tip = TIPS[kind];
  }

  /**
   * Tapping while a bomb is lit sets it off. It bites a fifth off the top
   * slab and ends the streak, so waiting out the fuse is a real choice.
   */
  private detonate(): void {
    const bomb = this.bomb;
    const top = this.peak();
    if (!bomb || !top) return;
    this.bomb = null;
    this.tip = "";
    if (this.stage) {
      // With weight in play a blast shoves the top of the spire sideways.
      const side = bomb.x < top.x + top.w / 2 ? 1 : -1;
      if (top.body !== null) this.stage.shove(top.body, side * 150);
      for (let i = 0; i < 2; i++) {
        this.scraps.push({
          x: top.x + (side < 0 ? top.w - 12 : 0),
          y: top.y + 4,
          w: 12,
          vx: side * (120 + Math.random() * 80),
          vy: 160 + Math.random() * 60,
          rot: 0,
          vr: side * 5,
          rgb: top.rgb,
          life: 1,
        });
      }
      top.flash = 1;
      this.trauma = Math.min(1, this.trauma + 0.5);
      this.float("BLAST", top.x + top.w / 2, top.y + 48, false, 24);
      return;
    }
    const w = Math.max(Math.min(top.w, MIN_W + 8), top.w * 0.8);
    const cut = (top.w - w) / 2;
    if (cut > 0.5) {
      for (const side of [-1, 1]) {
        this.scraps.push({
          x: side < 0 ? top.x : top.x + top.w - cut,
          y: top.y,
          w: cut,
          vx: side * (150 + Math.random() * 90),
          vy: 170 + Math.random() * 80,
          rot: 0,
          vr: side * (4 + Math.random() * 4),
          rgb: top.rgb,
          life: 1.2,
        });
      }
      top.x += cut;
      top.w = w;
      const m = this.mover;
      m.w = w;
      m.w0 = w;
      m.halfSpan = Math.max(w * 0.98, 80);
      this.syncMoverX();
    }
    top.flash = 1;
    this.streak = 0;
    this.heat = 0;
    this.fx.burst(bomb.x, bomb.y, BOMB_RGB, 34, 300);
    this.fx.burst(bomb.x, bomb.y, [255, 200, 120], 18, 220);
    this.fx.ring(bomb.x, bomb.y, BOMB_RGB, 150, 6);
    this.fx.rayBurst(bomb.x, bomb.y, BOMB_RGB, 170, 12);
    this.float("BOOM", bomb.x, bomb.y + 10, false, 30);
    this.flash = 0.55;
    this.trauma = 1;
    this.freeze = this.reduceMotion ? 0.03 : 0.12;
    this.sfx.boom();
    haptics.heavy();
    this.music.setTension(tensionFor(top.w, this.startW));
    this.emit();
  }

  /**
   * The slab everything builds on: the highest one at rest. Without physics
   * that is simply the last one placed.
   */
  private peak(): Slab {
    if (!this.stage) return this.stack[this.stack.length - 1]!;
    let best = this.stack[0]!;
    let top = -Infinity;
    for (const slab of this.stack) {
      if (slab.body === null) continue;
      const view = this.stage.read(slab.body);
      // The top is the top however it creeps: once a slab has landed it is
      // the one you build on. A slab still falling is not there yet, and a
      // crooked one, about to crumble, is passed over.
      if (!view || !view.landed || Math.abs(view.angle) > LEVEL_TILT) continue;
      const t = this.stage.topOf(slab.body);
      if (t > top) {
        top = t;
        best = slab;
      }
    }
    return best;
  }

  /** World height a new slab's bottom sits at when it lands on the peak. */
  private seatY(): number {
    const top = this.peak();
    if (this.stage && top.body !== null) return this.stage.topOf(top.body);
    return top.y + SLAB_H;
  }

  /** Floors of height reached: on the stage, measured; otherwise counted. */
  /**
   * The highest point of anything still standing, crooked or not, settled or
   * not. The Dark has to reach this, whatever the state of the top.
   */
  private crownY(): number {
    if (!this.stage) return this.peak().y + SLAB_H;
    let top = this.seat.y;
    for (const slab of this.stack) {
      if (slab.body === null) continue;
      top = Math.max(top, this.stage.topOf(slab.body));
    }
    return top;
  }

  /**
   * Floors are slabs that landed close to the groove and still stand level
   * on something anchored to the base. Rubble is real but is not height.
   */
  private floorsNow(): number {
    if (!this.stage) return this.floors;
    let n = 0;
    for (const slab of this.stack) {
      if (slab.floor === 0 || !slab.counts || slab.body === null) continue;
      const view = this.stage.read(slab.body);
      if (view && view.landed && Math.abs(view.angle) <= LEVEL_TILT) n++;
    }
    return n;
  }

  /** Steps the stage and reads the bodies back into their slabs. */
  private settle(dt: number): void {
    const stage = this.stage;
    if (!stage) return;
    // A topple plays out slowly enough to watch.
    this.slowmo = Math.max(0, this.slowmo - dt);
    stage.step(this.slowmo > 0 ? dt * 0.3 : dt);
    if (stage.takeTopple() && this.phase === "play") {
      this.slowmo = 0.8;
      this.music.topple();
      if (this.kit.breather > 0) {
        this.breather = this.kit.breather;
        this.float("BREATHER", 0, this.dark + 40, false, 18);
      }
      const top = this.peak();
      this.float("TOPPLE", top.x + top.w / 2, top.y + 50, false, 22);
      this.sfx.fail();
    }
    const lost = new Set(stage.takeLost());
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const slab = this.stack[i]!;
      if (slab.body === null) continue;
      const view = stage.read(slab.body);
      if (!view) continue;
      if (i > 0 && (lost.has(slab.body) || view.cy < -300 || Math.abs(view.cx) > 1600)) {
        // Down on the ground, or over the edge of the world: it crumbles.
        this.scraps.push({
          x: view.cx - view.w / 2,
          y: view.cy - view.h / 2,
          w: view.w,
          vx: 0,
          vy: 0,
          rot: view.angle,
          vr: 0,
          rgb: slab.rgb,
          life: 0.7,
        });
        stage.remove(slab.body);
        this.stack.splice(i, 1);
        continue;
      }
      slab.x = view.cx - view.w / 2;
      slab.y = view.cy - view.h / 2;
      slab.rot = view.angle;
    }
    {
      const top = this.peak();
      this.seat = { x: top.x + top.w / 2, y: this.seatY() };
    }
    if ((this.phase === "play" || this.phase === "ready") && this.mover.fallT < 0) {
      // The held slab rides two floors above the settled top.
      const want = this.seat.y + SLAB_H * 2;
      this.mover.y += (want - this.mover.y) * Math.min(1, dt * 6);
    }
    if (this.phase === "play") {
      const reached = this.floorsNow();
      if (reached !== this.floors) {
        this.floors = reached;
        this.mark(reached);
        this.emit();
        if (
          this.mode === "level" &&
          !this.boss &&
          isLanding(reached, this.plan.goal) &&
          !this.landed.has(reached) &&
          this.mover.fallT < 0
        ) {
          this.openLanding(reached);
          return;
        }
      }
      // The summit counts once the top has stood at goal height for a
      // moment: not in passing, and not while a crooked slab beneath it is
      // about to crumble.
      this.summitHold = this.plan.goal > 0 && reached >= this.plan.goal ? this.summitHold + dt : 0;
      if (this.plan.goal > 0 && this.summitHold >= SUMMIT_HOLD && !this.boss) {
        if (this.mode === "level" && isBoss(LEVELS[this.levelIndex]!.id)) this.lightTheSky();
        else this.win();
      }
    }
  }

  /** Notes the first time a floor is reached, for the ghost. */
  private mark(floor: number): void {
    for (let f = this.trace.length; f <= floor; f++) this.trace[f] = this.runTime;
  }

  /** Where the ghost stands right now, in floors; null without one. */
  private ghostNow(): number | null {
    return this.ghost ? ghostHeight(this.ghost, this.runTime) : null;
  }

  /** Keeps this run's trace as the ghost if it is the better run. */
  private keepGhost(): void {
    if (this.mode !== "level" || this.unranked) return;
    const id = LEVELS[this.levelIndex]!.id;
    if (ghostBetter(this.save.ghosts[id], this.trace, this.plan.goal)) {
      this.save.ghosts[id] = this.trace.slice();
      storeSave(this.save);
    }
  }

  /**
   * A landing: the climb stops, the stone below sets for good, and one of
   * two gifts is chosen. The Dark waits while you choose.
   */
  private openLanding(floor: number): void {
    this.landed.add(floor);
    this.music.landing();
    const set = this.setSpire();
    this.phase = "pick";
    this.landing = {
      floor,
      offers: landingOffer(Math.random, this.plan.darkRate > 0, this.plan.sway > 0),
    };
    this.offers = [];
    this.mote = null;
    this.bomb = null;
    this.tip = "";
    const cx = this.seat.x;
    this.float("LANDING", cx, this.seat.y + 70, true, 26);
    if (set > 0) this.float(`${set} SET`, cx, this.seat.y + 40, false, 16);
    this.fx.ring(cx, this.seat.y, BONE, 220, 5);
    for (let i = 0; i < this.stack.length; i++)
      this.stack[i]!.ripple = (this.stack.length - i) * 0.02;
    this.flash = 0.35;
    this.sfx.chime();
    haptics.medium();
    this.emit();
  }

  /** Takes a landing's gift; the climb goes on. */
  private takeLanding(index: number): void {
    const id = this.landing?.offers[index];
    if (!id) return;
    this.landing = null;
    this.applyGift(id);
    this.sfx.pick();
    this.phase = "play";
    this.spawnMover();
    this.emit();
  }

  /** A gift takes effect at once, and says so. */
  private applyGift(id: LandingId): void {
    const cx = this.seat.x;
    const y = this.seat.y + 60;
    switch (id) {
      case "setstone":
        this.gift.set = 5;
        break;
      case "lantern":
        this.breather = Math.max(this.breather, 12);
        break;
      case "broad":
        this.gift.broad = 3;
        break;
      case "braces":
        this.shields = Math.min(MAX_SHIELDS, this.shields + 2);
        this.shieldAge = 0;
        this.sfx.shieldUp();
        break;
      case "ember":
        this.heat = 1;
        break;
      case "slow":
        this.gift.slow = 6;
        break;
      case "keel":
        if (this.stage) this.stage.sway *= 0.5;
        break;
      case "push":
        this.pushDark(SLAB_H * 6);
        this.fx.rayBurst(cx, this.dark, [150, 80, 220], 160, 10);
        break;
    }
    this.float(LANDING_BY_ID[id].name.toUpperCase(), cx, y, true, 24);
    const rgb: RGB = LANDING_BY_ID[id].family === "stone" ? [255, 190, 120] : [190, 160, 255];
    this.fx.rayBurst(cx, this.seat.y, rgb, 220, 18);
    this.fx.sparkle(cx, this.seat.y, 160, rgb, 30);
    for (let i = 0; i < this.stack.length; i++)
      this.stack[i]!.ripple = (this.stack.length - i) * 0.025;
    this.flash = Math.max(this.flash, 0.4);
    haptics.heavy();
  }

  /**
   * The summit of a boss sky: the sky is lit, the tower stops moving, and the
   * escape begins on it as it stands.
   */
  private lightTheSky(): void {
    const tower: EscapeSlab[] = [];
    for (const slab of this.stack) {
      if (slab.floor === 0) continue;
      tower.push({
        x: slab.x,
        y: slab.y,
        w: slab.w,
        rot: slab.rot,
        floor: slab.floor,
        rgb: slab.rgb,
        charged: !slab.loose && slab.counts,
        heavy: slab.loose || !slab.counts,
      });
    }
    tower.sort((a, b) => a.y - b.y);
    this.escapeTower = tower;
    this.beginEscape(tower, true);
  }

  /** Lays the tower out frozen and sets the source above it. */
  private beginEscape(tower: EscapeSlab[], fresh: boolean): void {
    const base = this.stack[0]!;
    base.body = null;
    // The physics stops here: nothing falls during the escape.
    this.stage = null;
    const charged = new Set<Slab>();
    const heavy = new Set<Slab>();
    this.stack = [base];
    for (const t of tower) {
      const slab = this.makeSlab(t.x, t.y, t.w, t.floor, 0, 0);
      slab.rot = t.rot;
      slab.rgb = t.rgb;
      if (t.charged) charged.add(slab);
      if (t.heavy) heavy.add(slab);
      this.stack.push(slab);
    }
    const top = this.stack[this.stack.length - 1]!;
    const world = Math.max(0, WORLDS.indexOf(worldOf(LEVELS[this.levelIndex]!.id)));
    this.escape = {
      source: top.y + SLAB_H * ESCAPE_START,
      // Hearth's source is the gentlest; each later world's comes faster.
      speed: SLAB_H * (ESCAPE_SPEED + world * 0.7),
      accel: SLAB_H * (ESCAPE_ACCEL + world * 0.03),
      hold: 0,
      hits: heavy.has(top) ? 2 : 1,
      combo: 0,
      lastBreak: -9,
      charged,
      heavy,
      total: tower.length,
      eye: 0,
      chain: null,
      chained: 0,
      bound: new Map(),
      bindT: 0,
      bindEvery: Math.max(0.9, ESCAPE_BIND_INTERVAL - world * 0.25),
      briefing: false,
      sting: false,
      gaze: "shut",
      gazeT: 0,
      // Hearth's eye is slow to open and quick to close; later worlds stare longer.
      gazeShut: Math.max(2.2, 4.6 - world * 0.6),
      gazeStir: Math.max(0.5, 1.3 - world * 0.15),
      gazeWatch: 1.5 + world * 0.3,
      beatT: 0,
      seen: 0,
      count: 3,
    };
    const esc = this.escape;
    // The source has already wrapped some of the tower: one slab in every few floors.
    const every = Math.max(3, ESCAPE_BIND_EVERY - world);
    for (let i = this.stack.length - 1 - 3; i > 0; i -= every) {
      esc.bound.set(this.stack[i]!, { taps: ESCAPE_BIND_TAPS + Math.floor(world / 2), at: -9 });
    }
    // First time: the rules, then the count. After that, just the count.
    esc.briefing = (this.save.tips["escape"] ?? 0) < 1;
    if (esc.briefing) {
      this.save.tips["escape"] = 1;
      storeSave(this.save);
    }
    // The first time the sky is lit, the painted sting plays before anything else.
    esc.sting = fresh && this.stingReady;
    esc.hold = (esc.sting ? ESCAPE_STING : 0) + (esc.briefing ? ESCAPE_BRIEF : 0) + 3;
    // The first stare comes a little after the run starts.
    esc.gazeT = esc.gazeShut * 0.8;
    // Always ask it to play: iOS loads nothing for a hidden video until it plays.
    void this.sourceArt?.play().catch(() => undefined);
    this.tip = "";
    // The slab that was coming next is put away: the light is what moves now.
    this.mover.fallT = -1;
    this.mover.hover = 0;
    this.phase = "play";
    this.hint = false;
    this.mote = null;
    this.bomb = null;
    this.camY = Math.max(0, top.y + SLAB_H - this.viewH * LEAD);
    const cx = top.x + top.w / 2;
    this.float("THE SKY IS LIT", cx, top.y + 110, true, 26);
    this.fx.rayBurst(cx, top.y + SLAB_H, this.theme.accent, 320, 22);
    this.fx.ring(cx, top.y + SLAB_H, BONE, 260, 6);
    this.flash = 0.7;
    this.pulse = 1;
    this.trauma = 0.6;
    this.music.setClimb({ progress: 1, danger: 1, streak: 9, landings: 9 });
    haptics.heavy();
    this.emit();
  }

  /** A tap in the escape: the light breaks the slab it is in and drops to the next. */
  private breakTop(): void {
    const esc = this.escape;
    if (!esc || this.phase !== "play" || esc.hold > 0 || this.stack.length <= 1) return;
    // A chain is going off: the light is already falling.
    if (esc.chain !== null) return;
    const top = this.stack[this.stack.length - 1]!;
    if (esc.gaze === "watch") {
      // It sees the light move: it lunges, and the rhythm is broken.
      esc.source -= SLAB_H * ESCAPE_LUNGE;
      esc.combo = 0;
      esc.seen = 0.6;
      this.float("IT SEES YOU", top.x + top.w / 2, top.y + 110, false, 26);
      this.trauma = Math.min(1, this.trauma + 0.6);
      this.flash = Math.max(this.flash, 0.3);
      this.sfx.fail();
      haptics.heavy();
      this.emit();
      return;
    }
    // On the light's pulse a tap breaks a slab; off it, a tap only chips.
    const phase = esc.beatT / ESCAPE_BEAT;
    const onBeat = Math.min(phase, 1 - phase) * ESCAPE_BEAT <= ESCAPE_BEAT_WINDOW;
    const dmg = onBeat ? 1 : ESCAPE_OFFBEAT;
    const bind = esc.bound.get(top);
    if (bind) {
      // A bound slab: each tap tears at the tendril; the last tears it free.
      bind.taps -= dmg;
      top.flash = 1;
      this.fx.burst(top.x + top.w / 2, top.y + VISUAL_H / 2, [170, 90, 255], 12, 170);
      this.trauma = Math.min(1, this.trauma + 0.18);
      haptics.medium();
      if (bind.taps > 0.001) {
        this.sfx.hiss();
        this.emit();
        return;
      }
      esc.bound.delete(top);
      this.float("TORN FREE", top.x + top.w / 2, top.y + 70, true, 20);
      esc.hits = 1;
    }
    esc.hits -= dmg;
    if (esc.hits > 0.001) {
      top.flash = onBeat ? 1 : 0.4;
      this.fx.burst(top.x + top.w / 2, top.y + VISUAL_H / 2, top.rgb, 8, 120);
      this.sfx.tick();
      haptics.light();
      return;
    }
    // Only taps on the pulse build toward a surge.
    const quick = this.runTime - esc.lastBreak < ESCAPE_COMBO_GAP + ESCAPE_BEAT;
    esc.combo = onBeat ? (quick ? esc.combo + 1 : 1) : 0;
    esc.lastBreak = this.runTime;
    const charged = esc.charged.has(top);
    this.shatter(top);
    // Perfects laid in a row are one fuse: the rest of the run goes off by itself.
    const fuse = this.stack[this.stack.length - 1];
    if (charged && fuse && this.stack.length > 1 && esc.charged.has(fuse) && !esc.bound.has(fuse)) {
      esc.chain = ESCAPE_CHAIN_STEP;
      esc.chained = 1;
      esc.combo = 0;
      this.emit();
      return;
    }
    if (esc.combo >= ESCAPE_SURGE_AT) {
      // A surge: the light blows out the next floors at once.
      esc.combo = 0;
      for (let i = 0; i < 3 && this.stack.length > 1; i++)
        this.shatter(this.stack[this.stack.length - 1]!);
      esc.source += SLAB_H * 4;
      const t = this.stack[this.stack.length - 1]!;
      this.float("SURGE", t.x + t.w / 2, t.y + 80, true, 30);
      this.fx.rayBurst(t.x + t.w / 2, t.y + SLAB_H, BONE, 260, 20);
      this.flash = Math.max(this.flash, 0.5);
      this.trauma = Math.min(1, this.trauma + 0.5);
      this.sfx.forge();
      haptics.heavy();
    }
    if (this.stack.length <= 1) {
      this.escaped();
      return;
    }
    const next = this.stack[this.stack.length - 1]!;
    esc.hits = esc.heavy.has(next) ? 2 : 1;
    this.emit();
  }

  /** One slab goes: in pieces, and in light if a perfect put light in it. */
  private shatter(slab: Slab): void {
    const esc = this.escape!;
    const cx = slab.x + slab.w / 2;
    for (let i = 0; i < 4; i++) {
      this.scraps.push({
        x: slab.x + (slab.w / 4) * i,
        y: slab.y,
        w: slab.w / 4,
        vx: (i - 1.5) * (90 + Math.random() * 80),
        vy: 120 + Math.random() * 120,
        rot: slab.rot,
        vr: (i - 1.5) * (3 + Math.random() * 3),
        rgb: slab.rgb,
        life: 1.1,
      });
    }
    this.fx.burst(cx, slab.y + VISUAL_H / 2, slab.rgb, 14, 200);
    if (esc.charged.has(slab)) {
      esc.source += SLAB_H * ESCAPE_CHARGE;
      this.fx.rayBurst(cx, slab.y + VISUAL_H / 2, BONE, 150, 10);
      this.fx.sparkle(cx, slab.y + VISUAL_H, slab.w, [255, 230, 180], 10);
      this.sfx.perfect(Math.min(8, esc.combo));
    } else this.sfx.drop();
    this.stack.pop();
    this.trauma = Math.min(1, this.trauma + 0.12);
    haptics.light();
  }

  /** The source comes down; if it reaches the light, the escape fails. */
  private chase(dt: number): void {
    const esc = this.escape!;
    esc.eye += dt;
    esc.beatT = (esc.beatT + dt) % ESCAPE_BEAT;
    esc.seen = Math.max(0, esc.seen - dt);
    if (esc.hold > 0) {
      esc.hold -= dt;
      const count = esc.hold > 3 ? 3 : Math.max(0, Math.ceil(esc.hold));
      if (esc.sting && esc.hold <= (esc.briefing ? ESCAPE_BRIEF : 0) + 3) {
        esc.sting = false;
        this.emit();
      }
      if (esc.hold <= 3 && esc.briefing) {
        esc.briefing = false;
        this.emit();
      }
      if (count !== esc.count) {
        esc.count = count;
        if (count > 0) this.sfx.tick();
        this.emit();
      }
      if (esc.hold <= 0) {
        esc.count = 0;
        const top = this.stack[this.stack.length - 1]!;
        this.float("RUN", top.x + top.w / 2, top.y + 150, true, 34);
        this.sfx.fail();
        haptics.heavy();
        this.emit();
      }
      return;
    }
    // The great eye: shut, then it stirs, then it watches.
    esc.gazeT -= dt;
    if (esc.gazeT <= 0) {
      if (esc.gaze === "shut") {
        esc.gaze = "stir";
        esc.gazeT = esc.gazeStir;
        this.sfx.hiss();
        haptics.medium();
      } else if (esc.gaze === "stir") {
        esc.gaze = "watch";
        esc.gazeT = esc.gazeWatch;
        haptics.heavy();
      } else {
        esc.gaze = "shut";
        esc.gazeT = esc.gazeShut * (0.75 + Math.random() * 0.5);
        haptics.light();
      }
      this.emit();
    }
    if (esc.gaze === "stir") this.trauma = Math.max(this.trauma, 0.12);
    // Tendrils keep reaching in and wrapping slabs just below the light.
    esc.bindT -= dt;
    if (esc.bindT <= 0) {
      esc.bindT = esc.bindEvery;
      const n = this.stack.length;
      for (let d = 3; d <= 6; d++) {
        const slab = this.stack[n - 1 - d];
        if (!slab || slab.floor === 0 || esc.bound.has(slab)) continue;
        esc.bound.set(slab, { taps: ESCAPE_BIND_TAPS, at: this.clock });
        this.sfx.hiss();
        break;
      }
    }
    if (esc.chain !== null) {
      esc.chain -= dt;
      while (esc.chain !== null && esc.chain <= 0) {
        const top = this.stack[this.stack.length - 1];
        if (!top || this.stack.length <= 1 || !esc.charged.has(top) || esc.bound.has(top)) {
          // The run of perfects is spent.
          if (esc.chained >= 3) {
            const t = this.stack[this.stack.length - 1]!;
            this.float(`CHAIN ×${esc.chained}`, t.x + t.w / 2, t.y + 90, true, 30);
          }
          esc.chain = null;
          esc.lastBreak = this.runTime;
          if (this.stack.length <= 1) {
            this.escaped();
            return;
          }
          esc.hits = esc.heavy.has(top!) ? 2 : 1;
          if (top && esc.bound.has(top)) {
            this.float("BOUND", top.x + top.w / 2, top.y + 70, false, 22);
            this.trauma = Math.min(1, this.trauma + 0.4);
            haptics.heavy();
          }
          this.emit();
          break;
        }
        this.shatter(top);
        esc.chained += 1;
        // The chain quickens as it runs.
        esc.chain += Math.max(ESCAPE_CHAIN_STEP * 0.45, ESCAPE_CHAIN_STEP - esc.chained * 0.004);
        if (esc.chained % 4 === 0) this.emit();
      }
    } else if (this.runTime - esc.lastBreak > ESCAPE_COMBO_GAP) esc.combo = 0;
    // While it watches it holds still: it is looking, not reaching.
    if (esc.gaze !== "watch") {
      esc.speed += esc.accel * dt;
      esc.source -= esc.speed * dt;
    }
    const top = this.stack[this.stack.length - 1]!;
    const light = top.y + SLAB_H;
    const gap = (esc.source - light) / SLAB_H;
    this.strain = Math.max(this.strain, gap < 3 ? 1 - gap / 3 : 0);
    if (esc.source <= light + 6) {
      this.float("THE LIGHT IS TAKEN", top.x + top.w / 2, top.y + 60, false, 24);
      this.taken = true;
      this.escape = null;
      this.die();
    }
  }

  /** The light reaches the ground with you: the sky stays lit. */
  private escaped(): void {
    this.sourceArt?.pause();
    const base = this.stack[0]!;
    this.float("THE LIGHT ESCAPES", base.x + base.w / 2, base.y + 120, true, 28);
    this.escape = null;
    this.escapeTower = null;
    this.win();
  }

  /**
   * The source above: a mass that swallows the sky, with tentacles that reach
   * and curl toward the light and a cluster of eyes that open as it nears,
   * every pupil on the light.
   */
  private drawEscape(ctx: CanvasRenderingContext2D): void {
    const esc = this.escape!;
    // The source's mass is always there, filling the top of the sky; when it
    // is close its edge comes down to meet the light.
    const edge = Math.max(this.worldToScreen(0, esc.source).y, 120);
    const clock = this.reduceMotion ? 0 : this.clock;
    const top = this.stack[this.stack.length - 1]!;
    const light = this.worldToScreen(top.x + top.w / 2, top.y + VISUAL_H / 2);
    const near = clamp01(1 - (light.y - edge) / (this.vh * 0.7));
    // The screen's edges darken as it comes.
    const v = ctx.createRadialGradient(light.x, light.y, this.vw * 0.2, light.x, light.y, this.vh);
    v.addColorStop(0, "rgba(8,3,16,0)");
    v.addColorStop(1, `rgba(8,3,16,${0.35 + near * 0.5})`);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, this.vw, this.vh);
    this.eyeAt = { x: light.x, y: edge - 70, r: 15 };
    if (this.sourceArtReady && this.sourceArt) {
      this.drawSourceArt(ctx, edge, near);
    } else if (edge > -120) {
      const g = ctx.createLinearGradient(0, edge - 320, 0, edge + 30);
      g.addColorStop(0, "rgba(4,2,10,1)");
      g.addColorStop(0.75, "rgba(16,6,30,0.97)");
      g.addColorStop(1, "rgba(16,6,30,0)");
      ctx.fillStyle = g;
      ctx.fillRect(-60, -60, this.vw + 120, edge + 90);
      // Its edge breathes, lit violet from within.
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let band = 0; band < 2; band++) {
        ctx.strokeStyle = `rgba(170,90,255,${0.3 - band * 0.12})`;
        ctx.lineWidth = 2 + band * 3;
        ctx.beginPath();
        for (let x = -20; x <= this.vw + 20; x += 8) {
          const y =
            edge - band * 6 + Math.sin(x * 0.025 + clock * (1.2 + band * 0.5)) * (5 + band * 3);
          if (x === -20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
      // Tentacles: rooted in the mass, tapering, reaching for the light.
      const reach = 60 + near * 170;
      for (let i = 0; i < 7; i++) {
        const root = ((i + 0.5) / 7) * this.vw + Math.sin(i * 7.1) * 18;
        const len =
          reach *
          (0.6 + 0.4 * Math.sin(i * 3.3 + 1) ** 2) *
          (0.85 + 0.15 * Math.sin(clock * 0.8 + i));
        const pull = (light.x - root) * 0.35 * near;
        this.drawTentacle(ctx, root, edge - 6, len, pull, clock + i * 1.9, 18 - (i % 3) * 3);
      }
      // Eyes in the mass; more open the closer it is.
      const eyes = [
        [0, -70, 15],
        [-62, -100, 9],
        [58, -96, 10],
        [-118, -60, 6],
        [112, -64, 7],
        [-30, -150, 7],
        [34, -158, 6],
      ] as const;
      eyes.forEach(([dx, dy, r], k) => {
        const wake = clamp01(near * 1.6 - k * 0.12) || (k === 0 ? 0.6 : 0);
        if (wake <= 0) return;
        const x = light.x + dx;
        const y = edge + dy;
        const blink = Math.max(
          0,
          Math.min(1, Math.abs(Math.sin(esc.eye * (0.45 + k * 0.07) + k)) * 10 - 9),
        );
        const open = wake * (1 - blink);
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2);
        glow.addColorStop(0, `rgba(200,120,255,${0.55 * open})`);
        glow.addColorStop(1, "rgba(200,120,255,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(x - r * 3.2, y - r * 3.2, r * 6.4, r * 6.4);
        ctx.fillStyle = `rgba(240,225,255,${open})`;
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.55 * open + 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // The pupil follows the light.
        const ax = light.x - x;
        const ay = light.y - y;
        const d = Math.hypot(ax, ay) || 1;
        ctx.fillStyle = "rgba(10,3,18,0.95)";
        ctx.beginPath();
        ctx.ellipse(
          x + (ax / d) * r * 0.35,
          y + (ay / d) * r * 0.2,
          r * 0.3,
          r * 0.45 * open + 0.2,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      });
    }
    this.drawGaze(ctx, light);
    // Tendrils wrapped round the slabs they have bound, reaching down from the mass.
    for (const [slab, bind] of esc.bound) {
      const c = this.worldToScreen(slab.x + slab.w / 2, slab.y + VISUAL_H / 2);
      if (c.y > this.vh + 40) continue;
      const grow = bind.at < 0 ? 1 : clamp01((this.clock - bind.at) / 0.45);
      const side = slab.floor % 2 === 0 ? 1 : -1;
      const root = c.x + side * (slab.w * 0.5 + 30);
      const len = (c.y - edge + 10) * grow;
      this.drawTentacle(
        ctx,
        root,
        edge - 6,
        len,
        (c.x + side * slab.w * 0.42 - root) * grow,
        clock + slab.floor,
        17,
      );
      if (grow < 1) continue;
      // Coils round the stone.
      const halfW = (slab.w / 2) * Math.cos(slab.rot);
      ctx.save();
      for (const k of [-0.28, 0.28]) {
        const x = c.x + halfW * k * 2;
        ctx.fillStyle = "rgba(34,14,28,0.96)";
        ctx.beginPath();
        ctx.ellipse(x, c.y, 11, VISUAL_H * 0.8, 0.25 * side, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(170,90,255,0.55)";
        for (let j = -1; j <= 1; j++) {
          ctx.beginPath();
          ctx.arc(x + 2 * side, c.y + j * 6, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Taps left, over a binding the light has reached.
      if (slab === top && this.stack.length > 1) {
        ctx.font = '900 13px "Nunito Variable", system-ui, sans-serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(225,200,255,0.95)";
        ctx.fillText(`TEAR ×${Math.ceil(bind.taps)}`, c.x, c.y - 26);
      }
      ctx.restore();
    }
    // The light, in the slab it will break next.
    if (this.stack.length > 1) {
      const c = this.worldToScreen(top.x + top.w / 2, top.y + VISUAL_H / 2);
      const pulse = 1 + 0.12 * Math.sin(clock * 6);
      const r = 26 * pulse;
      const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r * 2.4);
      glow.addColorStop(0, "rgba(255,250,235,1)");
      glow.addColorStop(0.25, "rgba(255,220,160,0.9)");
      glow.addColorStop(1, "rgba(255,170,90,0)");
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = glow;
      ctx.fillRect(c.x - r * 2.4, c.y - r * 2.4, r * 4.8, r * 4.8);
      ctx.restore();
      // The pulse: a ring closing on the light; tap as it lands.
      {
        const p = esc.beatT / ESCAPE_BEAT;
        const watching = esc.gaze === "watch";
        const ring = 24 + (1 - p) * 70;
        ctx.save();
        ctx.strokeStyle = watching
          ? `rgba(255,70,80,${0.35 + p * 0.4})`
          : `rgba(255,225,170,${0.25 + p * 0.6})`;
        ctx.lineWidth = 2 + p * 2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, ring, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (esc.hits > 1 && !esc.bound.has(top)) {
        ctx.save();
        ctx.font = '800 12px "Nunito Variable", system-ui, sans-serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,245,230,0.9)";
        ctx.fillText("×2", c.x, c.y - 22);
        ctx.restore();
      }
    }
  }

  /** Loads the painted source and the sting quietly; the drawn versions stand in until then. */
  /** Loads the painted Dark quietly; the drawn gradient stands in until then. */
  private loadDarkArt(): void {
    if (typeof document === "undefined") return;
    const v = document.createElement("video");
    v.src = "art/dark-hearth.mp4";
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "auto";
    v.setAttribute("playsinline", "");
    v.style.cssText =
      "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:0;top:0";
    const ready = () => {
      if (v.readyState >= 2) this.darkArtReady = true;
    };
    v.addEventListener("loadeddata", ready);
    v.addEventListener("playing", ready);
    v.addEventListener("timeupdate", ready);
    v.addEventListener("error", () => {
      this.darkArtReady = false;
    });
    document.body.appendChild(v);
    this.darkArt = v;
    v.load();
    // Always ask it to play: iOS loads nothing for a hidden video until it does.
    void v.play().catch(() => undefined);
  }

  /**
   * The painted Dark: its surface (a fifth of the way down the painting) at
   * the Dark's line, the night above it faded out so only the smoke lifts off.
   */
  private drawDarkArt(ctx: CanvasRenderingContext2D, surface: number): void {
    const v = this.darkArt!;
    if (v.paused) void v.play().catch(() => undefined);
    const w = this.vw * 1.1;
    const h = w * (v.videoHeight / Math.max(1, v.videoWidth) || 16 / 9);
    const top = surface - h * DARK_ART_SURFACE;
    if (top > this.vh) return;
    const mask = (this.darkMask ??= document.createElement("canvas"));
    const mw = Math.ceil(w);
    const mh = Math.ceil(h);
    if (mask.width !== mw || mask.height !== mh) {
      mask.width = mw;
      mask.height = mh;
    }
    const m = mask.getContext("2d")!;
    m.globalCompositeOperation = "source-over";
    m.clearRect(0, 0, mw, mh);
    m.drawImage(v, 0, 0, mw, mh);
    m.globalCompositeOperation = "destination-in";
    const fade = m.createLinearGradient(0, 0, 0, mh);
    fade.addColorStop(0, "rgba(0,0,0,0)");
    fade.addColorStop(DARK_ART_SURFACE * 0.45, "rgba(0,0,0,0)");
    fade.addColorStop(DARK_ART_SURFACE * 0.95, "rgba(0,0,0,1)");
    fade.addColorStop(1, "rgba(0,0,0,1)");
    m.fillStyle = fade;
    m.fillRect(0, 0, mw, mh);
    ctx.drawImage(mask, (this.vw - w) / 2, top);
    // Below the painting, the same black: the Dark is bottomless.
    const bottom = top + h - 2;
    if (bottom < this.vh + 160) {
      ctx.fillStyle = "rgb(4,2,8)";
      ctx.fillRect(-120, bottom, this.vw + 240, this.vh - bottom + 160);
    }
  }

  private loadSourceArt(): void {
    if (typeof document === "undefined") return;
    const v = document.createElement("video");
    v.src = "art/source.mp4";
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "auto";
    v.setAttribute("playsinline", "");
    // In the page but invisible: iOS will not decode frames for a detached video.
    v.style.cssText =
      "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:0;top:0";
    const ready = () => {
      if (v.readyState >= 2) this.sourceArtReady = true;
    };
    v.addEventListener("loadeddata", ready);
    v.addEventListener("playing", ready);
    v.addEventListener("timeupdate", ready);
    v.addEventListener("error", () => {
      this.sourceArtReady = false;
    });
    document.body.appendChild(v);
    this.sourceArt = v;
    v.load();
    // The sting is only played by the page; here we only learn whether it exists.
    fetch("art/escape-sting.mp4", { method: "HEAD" })
      .then((r) => {
        this.stingReady = r.ok;
      })
      .catch(() => undefined);
  }

  /**
   * The painted mass, its lower edge at the source's edge, fading out below
   * so it melts into the sky rather than ending in a hard line.
   */
  private drawSourceArt(ctx: CanvasRenderingContext2D, edge: number, near: number): void {
    const v = this.sourceArt!;
    // It grows as it nears; its tentacle tips (three quarters down the
    // painting) hang at the source's edge, so its eyes stay in view above.
    const w = this.vw * (0.8 + near * 0.3);
    const h = w * (v.videoHeight / Math.max(1, v.videoWidth) || 16 / 9);
    const top = edge + 10 - h * 0.75;
    const bottom = top + h;
    if (bottom < -40) return;
    const mask = (this.sourceMask ??= document.createElement("canvas"));
    const mw = Math.ceil(w);
    const mh = Math.ceil(h);
    if (mask.width !== mw || mask.height !== mh) {
      mask.width = mw;
      mask.height = mh;
    }
    const m = mask.getContext("2d")!;
    m.globalCompositeOperation = "source-over";
    m.clearRect(0, 0, mw, mh);
    m.drawImage(v, 0, 0, mw, mh);
    m.globalCompositeOperation = "destination-in";
    const fade = m.createLinearGradient(0, 0, 0, mh);
    fade.addColorStop(0, "rgba(0,0,0,1)");
    fade.addColorStop(0.66, "rgba(0,0,0,1)");
    fade.addColorStop(1, "rgba(0,0,0,0)");
    m.fillStyle = fade;
    m.fillRect(0, 0, mw, mh);
    ctx.drawImage(mask, (this.vw - w) / 2, top);
    this.eyeAt = { x: this.vw / 2, y: top + h * 0.28, r: w * 0.1 };
    // Above the painting, the same dark: the mass is endless.
    if (top > 0) {
      ctx.fillStyle = "rgb(6,3,12)";
      ctx.fillRect(0, 0, this.vw, top + 2);
    }
  }

  /**
   * The great eye: lidded while shut, trembling open as it stirs, and when it
   * watches, a glare that falls on the light and floods the screen violet.
   */
  private drawGaze(ctx: CanvasRenderingContext2D, light: { x: number; y: number }): void {
    const esc = this.escape!;
    const { x, y, r } = this.eyeAt;
    const t = this.reduceMotion ? 0 : this.clock;
    const open =
      esc.gaze === "watch"
        ? 1
        : esc.gaze === "stir"
          ? 1 - esc.gazeT / Math.max(0.01, esc.gazeStir)
          : 0;
    // The lid: dark over the painted eye, drawn back as it opens.
    ctx.save();
    ctx.fillStyle = `rgba(10,4,14,${0.9 * (1 - open)})`;
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      r * 1.6,
      r * (0.95 - open * 0.6) + Math.sin(t * 30) * open * 1.5,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    // Its light.
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    const red = esc.seen > 0;
    glow.addColorStop(
      0,
      red ? `rgba(255,110,90,${0.9 * open})` : `rgba(230,200,255,${0.85 * open})`,
    );
    glow.addColorStop(
      0.3,
      red ? `rgba(220,40,60,${0.5 * open})` : `rgba(170,100,255,${0.45 * open})`,
    );
    glow.addColorStop(1, "rgba(120,60,200,0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = glow;
    ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
    if (esc.gaze === "watch") {
      // The stare: a cone from the eye to the light.
      const g = ctx.createLinearGradient(x, y, light.x, light.y);
      g.addColorStop(0, red ? "rgba(255,90,80,0.35)" : "rgba(190,140,255,0.32)");
      g.addColorStop(1, red ? "rgba(255,90,80,0.12)" : "rgba(190,140,255,0.08)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.6, y);
      ctx.lineTo(light.x - 70, light.y + 20);
      ctx.lineTo(light.x + 70, light.y + 20);
      ctx.lineTo(x + r * 0.6, y);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = red ? "rgba(120,10,30,0.22)" : "rgba(60,20,110,0.2)";
      ctx.fillRect(0, 0, this.vw, this.vh);
    }
    ctx.restore();
  }

  /** One tentacle: a tapering curve from its root, swaying, its tip curling. */
  private drawTentacle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    len: number,
    pull: number,
    t: number,
    width: number,
  ): void {
    const steps = 14;
    const left: [number, number][] = [];
    const right: [number, number][] = [];
    for (let k = 0; k <= steps; k++) {
      const u = k / steps;
      const sway = Math.sin(t * 1.3 - u * 3.2) * 16 * u;
      const curl = Math.sin(t * 0.9 + u * 5) * 10 * u * u;
      const px = x + pull * u * u + sway + curl;
      const py = y + len * u;
      const w = width * (1 - u) ** 1.3 + 0.6;
      const ang = Math.cos(t * 1.3 - u * 3.2) * 0.4;
      left.push([px - w * Math.cos(ang), py + w * Math.sin(ang)]);
      right.push([px + w * Math.cos(ang), py - w * Math.sin(ang)]);
    }
    ctx.beginPath();
    ctx.moveTo(left[0]![0], left[0]![1]);
    for (const p of left) ctx.lineTo(p[0], p[1]);
    for (let k = right.length - 1; k >= 0; k--) ctx.lineTo(right[k]![0], right[k]![1]);
    ctx.closePath();
    const g = ctx.createLinearGradient(x, y, x, y + len);
    // Shaded like the painted ones: near-black plum, lit warm along one side.
    g.addColorStop(0, "rgba(20,8,22,0.98)");
    g.addColorStop(1, "rgba(52,24,40,0.96)");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.strokeStyle = "rgba(255,150,80,0.3)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(right[0]![0], right[0]![1]);
    for (const p of right) ctx.lineTo(p[0], p[1]);
    ctx.stroke();
    ctx.restore();
    // Suckers along the underside, faintly lit.
    ctx.fillStyle = "rgba(255,170,110,0.4)";
    for (let k = 3; k < steps; k += 2) {
      const a = left[k]!;
      const b = right[k]!;
      const r = Math.max(0.8, width * (1 - k / steps) * 0.22);
      ctx.beginPath();
      ctx.arc((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** The summit of a boss sky: the Dark wakes, and the goal changes. */
  private wakeBoss(): void {
    const crown = this.crownY();
    this.boss = { surge: 0, tendril: BOSS_TENDRIL, eye: 0, crown };
    this.dark = crown - SLAB_H * BOSS_START;
    this.darkShown = this.dark;
    // It holds its breath for a beat: time to see it, and to set the first slab.
    this.breather = Math.max(this.breather, 2);
    // The summit's light sets the spire: the fight is about what you build
    // from here, not a hinge left twenty floors down.
    this.setSpire();
    // The fight is with the Dark, not the course: the slab runs plain.
    this.spawnMover();
    this.trauma = 1;
    this.flash = 0.6;
    this.freeze = this.reduceMotion ? 0.05 : 0.25;
    this.float("THE HOLLOW WAKES", this.seat.x, this.seat.y + 90, false, 26);
    this.sfx.fail();
    this.music.setTension(1);
    haptics.heavy();
    this.emit();
  }

  /** One frame of the fight: a surge driven back, a slab taken, the win. */
  private bossTurn(dt: number, top: Slab): void {
    const b = this.boss!;
    b.eye += dt;
    // Driven below the line: the surge is beaten. The line is fixed where
    // it woke, and each surge wants it driven deeper.
    const line = b.crown - SLAB_H * (BOSS_DEPTH + b.surge * 2);
    if (this.dark <= line) {
      b.surge += 1;
      if (b.surge >= BOSS_SURGES) {
        this.boss = null;
        this.dark = DARK_START - 600;
        this.float("THE HOLLOW FALLS", top.x + top.w / 2, this.seat.y + 80, true, 28);
        this.win();
        return;
      }
      this.dark = b.crown - SLAB_H * (BOSS_START - b.surge);
      this.darkShown = this.dark;
      this.breather = Math.max(this.breather, 1.2);
      b.tendril = BOSS_TENDRIL;
      this.float(`SURGE ${b.surge + 1}`, top.x + top.w / 2, this.seat.y + 80, false, 26);
      this.trauma = Math.min(1, this.trauma + 0.7);
      this.flash = 0.5;
      this.sfx.fail();
      haptics.heavy();
      this.emit();
      return;
    }
    // Tendrils: every few seconds it takes the lowest loose slab.
    b.tendril -= dt;
    if (b.tendril <= 0) {
      b.tendril = BOSS_TENDRIL - b.surge * 0.6;
      const prey = [...this.stack].reverse().find((s) => s.floor > 0 && s.loose && s.body !== null);
      if (prey && this.stage && prey.body !== null) {
        const view = this.stage.read(prey.body);
        if (view) {
          this.scraps.push({
            x: view.cx - view.w / 2,
            y: view.cy - view.h / 2,
            w: view.w,
            vx: 0,
            vy: -260,
            rot: view.angle,
            vr: 0,
            rgb: [120, 60, 170],
            life: 0.8,
          });
          this.fx.burst(view.cx, view.cy, [150, 80, 220], 18, 160);
          this.stage.remove(prey.body);
          this.stack.splice(this.stack.indexOf(prey), 1);
          this.float("TAKEN", view.cx, view.cy + 40, false, 20);
          this.trauma = Math.min(1, this.trauma + 0.4);
          this.sfx.hiss();
        }
      }
    }
  }

  /**
   * How much faster the Dark climbs for a run that has outstayed the sky's
   * par time, called out each time it steps up.
   */
  private quickening(): number {
    if (this.mode !== "level") return 1;
    const over = this.runTime - LEVELS[this.levelIndex]!.parTime;
    if (over <= 0) return 1;
    const step = Math.floor(over / QUICKEN_EVERY);
    if (step > this.quickStep) {
      this.quickStep = step;
      const top = this.peak();
      this.float(
        this.plan.descent ? "THEY QUICKEN" : "THE DARK QUICKENS",
        top.x + top.w / 2,
        this.dark + 70,
        false,
        22,
      );
      this.sfx.hiss();
      this.pulse = Math.max(this.pulse, 0.5);
    }
    return 1 + QUICKEN_RATE * over;
  }

  /** A cut-off piece lands on the climbers: they are knocked back down the shaft. */
  private squash(x: number, w: number): void {
    const push = SLAB_H * (SQUASH_PUSH + SQUASH_PER_WIDTH * Math.min(1, w / this.startW));
    this.dark = Math.max(DARK_START, this.dark - push);
    const at = this.climbersY();
    // Those under it die: the near ones within the slab's reach.
    const sx = x - this.camX + this.vw / 2;
    for (let i = 0; i < CLIMBERS; i++) {
      const c = climber(i);
      const cx = c.x * (this.vw + 40) - 20;
      if (c.depth < 0.45 && Math.abs(cx - sx) < w / 2 + 18 && !this.climberDead.has(i)) {
        this.climberDead.set(i, this.clock);
      }
    }
    // The crunch: blood flung out and down, pale chips of them, a stain, a
    // beat of hit-stop and a shove of the camera.
    this.fx.blood(x, at, BLOOD_RGB, 80, 340);
    this.fx.blood(x, at, BLOOD_DEEP_RGB, 18, 180);
    this.fx.burst(x, at, [200, 192, 214], 12, 240);
    this.float(
      "SQUASHED",
      Math.max(60, Math.min(this.vw - 60, x - this.camX + this.vw / 2)) + this.camX - this.vw / 2,
      at - 30,
      true,
      22,
    );
    this.sfx.drop();
    this.freeze = Math.max(this.freeze, this.reduceMotion ? 0.02 : 0.07);
    this.trauma = Math.min(1, this.trauma + 0.32);
    haptics.heavy();
  }

  /** Light pushes the Dark down, never below where it started. */
  private pushDark(px: number): void {
    if (this.plan.darkRate <= 0 || px <= 0) return;
    // Light buys time, never safety: the Dark is held within reach of the top.
    // Not in the boss fight: there the Dark must be driven deep to beat it.
    const floor = this.stage && !this.boss ? this.crownY() - SLAB_H * DARK_REACH : -Infinity;
    this.dark = Math.max(DARK_START, Math.min(this.dark, Math.max(floor, this.dark - px)));
  }

  /** Floors of tower still above the Dark. */
  private darkGap(): number {
    return (this.crownY() - this.dark) / SLAB_H;
  }

  /**
   * The Dark climbs while the run is live. It takes the tower when it reaches
   * the top slab's seat; a near miss is what the music and the edges play on.
   */
  private riseDark(dt: number): void {
    this.breather = Math.max(0, this.breather - dt);
    const practice =
      (this.save.practice && this.mode === "level" && !this.boss) || this.escape !== null;
    if (
      !practice &&
      this.plan.darkRate > 0 &&
      this.phase === "play" &&
      this.freeze <= 0 &&
      this.breather <= 0
    ) {
      const base = this.boss
        ? this.plan.darkRate * (1 + this.boss.surge * 0.25)
        : this.plan.darkRate;
      // Linger past par and the Dark quickens: about 40% faster ten seconds
      // over, more than twice as fast by thirty. Not in the boss fight.
      const rate = base * (this.boss ? 1 : this.quickening());
      this.dark += rate * dt;
      const top = this.peak()!;
      if (this.boss) this.bossTurn(dt, top);
      if (this.phase !== "play") return;
      // The Dark must climb to the highest slab still standing, settled or
      // not, crooked or not.
      const seat = this.crownY();
      if (this.dark >= seat - SLAB_H * 0.5 && this.kit.secondWind && !this.secondWindUsed) {
        // Second Wind: the first time the Dark reaches the top, it is thrown back.
        this.secondWindUsed = true;
        this.pushDark(SLAB_H * 5);
        this.float("SECOND WIND", top.x + top.w / 2, seat + 40, true, 24);
        this.fx.ring(top.x + top.w / 2, this.dark, SHIELD_RGB, 300, 6);
        this.sfx.chime();
      }
      if (this.dark >= seat - SLAB_H * 0.5) {
        this.dark = seat - SLAB_H * 0.5;
        this.float(
          this.plan.descent ? "THEY REACH YOU" : "TAKEN BY THE DARK",
          top.x + top.w / 2,
          seat + 40,
          false,
          24,
        );
        this.taken = true;
        this.die();
        for (const slab of this.stack) {
          slab.vy = -80 - Math.random() * 40;
          slab.vx *= 0.3;
        }
        return;
      }
      const gap = this.darkGap();
      if (gap < 3) this.strain = Math.max(this.strain, 1 - gap / 3);
    }
    // Down the shaft they never fall far behind: outbuild them and they keep pace.
    if (this.plan.descent && this.phase === "play") {
      this.dark = Math.max(this.dark, this.crownY() - SLAB_H * DESCENT_REACH);
    }
    const k = 1 - Math.exp(-(this.darkShown < this.dark ? 4 : 7) * dt);
    this.darkShown += (this.dark - this.darkShown) * k;
  }

  /** Where the slab's left edge will be once it has landed. */
  private landingX(): number {
    const m = this.mover;
    if (m.fallT >= 0) return m.fallFrom + m.wind * m.drift;
    return m.x + m.wind * m.drift;
  }

  /** Whether dropping now would be a perfect. */
  private lined(prev: Slab | undefined): boolean {
    if (!prev || this.mover.fallT >= 0) return false;
    if (this.mover.split) {
      const [l, r] = this.splitOffsets(prev);
      return Math.abs(l) <= this.tol && Math.abs(r) <= this.tol;
    }
    return Math.abs(dropOffset(prev.x, prev.w, this.landingX(), this.mover.w)) <= this.tol;
  }

  /**
   * Whether the game points out the perfect moment. In wind, once the outline
   * is gone, it does not: reading the streamer is the skill.
   */
  private cued(): boolean {
    return this.mover.drift <= 0 || this.mover.guide;
  }

  /** Lets go of a hanging slab. It lands, and is judged, where it comes down. */
  private release(): void {
    const m = this.mover;
    m.fallT = 0;
    m.fallFrom = m.x;
    this.hint = false;
    this.sfx.release();
    haptics.light();
    this.emit();
  }

  private advanceFall(dt: number): void {
    const m = this.mover;
    const prev = this.peak();
    if (!prev) return;
    m.fallT += dt;
    const k = fallShare(m.fallT, m.fallTime);
    m.x = m.fallFrom + m.wind * m.drift * k;
    m.y = prev.y + SLAB_H + m.hover * (1 - k);
    if (k >= 1) this.place();
  }

  private sway(): number {
    return swayOffset(this.mover.course, this.clock, this.mover.w);
  }

  private syncMoverX(): void {
    const m = this.mover;
    const center = m.center + this.sway();
    if (m.split) {
      // Each half runs its own lane, centred on its own side of the stack.
      const hw = m.w / 2;
      const span = m.halfSpan * 0.7;
      const tL = (Math.max(-1, Math.min(1, m.u)) + 1) / 2;
      const tR = (Math.max(-1, Math.min(1, m.u2)) + 1) / 2;
      m.x = center - hw - span + tL * span * 2;
      m.x2 = center - span + tR * span * 2;
      return;
    }
    const leftMin = center - m.halfSpan - m.w / 2;
    const t = (Math.max(-1, Math.min(1, m.u)) + 1) / 2;
    m.x = leftMin + t * (m.halfSpan * 2);
  }

  /** Signed offsets of each half from its home, for a split slab. */
  private splitOffsets(prev: Slab): [number, number] {
    const m = this.mover;
    const hw = m.w / 2;
    const left = m.x + hw / 2 - (prev.x + prev.w / 4);
    const right = m.x2 + hw / 2 - (prev.x + (3 * prev.w) / 4);
    return [left, right];
  }

  /** Where the slab's groove will land: the middle of both halves when split. */
  private landingCenter(): number {
    const m = this.mover;
    if (m.split) return (m.x + m.x2 + m.w / 2) / 2;
    return this.landingX() + m.w / 2;
  }

  private toleranceNow(): number {
    const m = this.mover;
    const base = 2 / Math.max(0.2, m.period);
    const peak = m.course === "beat" ? base * 1.9 : m.course === "breath" ? base * 1.3 : 0;
    const px = Math.max(1, peak > 0 ? m.halfSpan * peak : m.pxSpeed);
    const tol = tolerance(px, this.plan.difficulty + this.floors, m.w);
    return (m.keystone ? tol * 0.68 : tol) * windowFor(this.tune, this.streak);
  }

  private advanceMover(dt: number): void {
    const m = this.mover;
    // Waiting has a price: once the run is live the held slab wastes away.
    // Every few pixels lost, a chunk breaks off one end and tumbles away, so
    // the loss is something you watch. A lit bomb forces the wait, so that
    // time is not held against the slab.
    if (this.phase === "play" && !this.stage && !(this.bomb && this.bomb.fuse > 0)) {
      m.age += dt;
      const w = heldWidth(m.w0, m.age, m.period, 1, 0, m.course);
      if (w < m.w - 0.01) {
        m.crumb += m.w - w;
        m.w = w;
        if (m.crumb >= 4) {
          const side = m.crumbSide;
          m.crumbSide = -side;
          const rgb = this.slabColor(this.floors + 1);
          this.scraps.push({
            x: side < 0 ? m.x - m.crumb : m.x + m.w,
            y: m.y,
            w: m.crumb,
            vx: side * (30 + Math.random() * 50),
            vy: 30 + Math.random() * 40,
            rot: 0,
            vr: side * (3 + Math.random() * 4),
            rgb,
            life: 0.9,
          });
          if (!this.reduceMotion) {
            this.fx.burst(side < 0 ? m.x : m.x + m.w, m.y + VISUAL_H / 2, rgb, 3, 60);
          }
          m.crumb = 0;
        }
      }
    }
    const rate = travelRate(m.course, m.dir, m.wind, m.u, m.period, this.clock);
    m.pxSpeed = m.halfSpan * rate;
    const du = m.dir * rate * dt;
    const steps = Math.min(8, Math.max(1, Math.ceil((Math.abs(du) * m.halfSpan) / 6)));
    const sub = du / steps;
    for (let i = 0; i < steps; i++) {
      m.u += sub;
      if (m.u >= 1) {
        m.u = 1;
        m.dir = -1;
      } else if (m.u <= -1) {
        m.u = -1;
        m.dir = 1;
      }
      this.syncMoverX();
    }
    if (m.split) {
      // The right half keeps a faster clock, so the two only line up now and then.
      const rate2 = (2 / Math.max(0.2, m.period)) * SPLIT_TEMPO;
      m.u2 += m.dir2 * rate2 * dt;
      if (m.u2 >= 1) {
        m.u2 = 1;
        m.dir2 = -1;
      } else if (m.u2 <= -1) {
        m.u2 = -1;
        m.dir2 = 1;
      }
      this.syncMoverX();
    }
    this.tol = this.toleranceNow();
  }

  /**
   * A split slab lands as two halves, each judged on its own side. Both home
   * is a perfect; one off gets that side trimmed; a half with no support
   * falls away and the floor is whatever is left.
   */
  private splitLanding(prev: Slab): {
    result: DropResult;
    landed: number;
    pieces: Piece[] | null;
  } {
    const m = this.mover;
    const hw = m.w / 2;
    const [offL, offR] = this.splitOffsets(prev);
    const halves = [
      { x: m.x, off: offL, homeX: prev.x },
      { x: m.x2, off: offR, homeX: prev.x + prev.w / 2 },
    ].map((h) => ({
      ...h,
      result: resolveDrop({
        prevX: h.homeX,
        prevW: prev.w / 2,
        moverX: h.x,
        moverW: hw,
        tol: this.tol,
        startW: hw,
        streak: 0,
        forgeEvery: 0,
      }),
      landed: dropAccuracy(h.off, hw, this.tol),
    }));
    const kept = halves.filter((h) => h.result.ok);
    if (kept.length === 0) return { result: { ok: false }, landed: 0, pieces: null };
    const rgb = this.slabColor(this.floors + 1);
    for (const h of halves) {
      const r = h.result;
      const dir = h.off < 0 ? -1 : 1;
      if (!r.ok) {
        // Nothing under it: the whole half goes.
        this.scraps.push({
          x: h.x,
          y: m.y,
          w: hw,
          vx: dir * 120,
          vy: 60,
          rot: 0,
          vr: dir * 3,
          rgb,
          life: 1.3,
        });
      } else if (r.scrap && r.scrap.w > 6) {
        const out = r.scrap.x < r.x ? -1 : 1;
        this.scraps.push({
          x: r.scrap.x,
          y: m.y,
          w: r.scrap.w,
          vx: out * (90 + Math.random() * 80),
          vy: 80 + Math.random() * 60,
          rot: 0,
          vr: out * (2 + Math.random() * 3),
          rgb,
          // Down the shaft it has further to fall before it lands on them.
          life: this.plan.descent ? 2.4 : 1.1,
        });
      }
    }
    const pieces: Piece[] = [];
    for (const h of kept) if (h.result.ok) pieces.push({ x: h.result.x, w: h.result.w });
    pieces.sort((a, b) => a.x - b.x);
    const first = pieces[0]!;
    const last = pieces[pieces.length - 1]!;
    const x = first.x;
    const w = last.x + last.w - x;
    const perfect = halves.every((h) => h.result.ok && h.result.perfect);
    const nextStreak = perfect ? this.streak + 1 : 0;
    const touching = pieces.length < 2 || pieces[1]!.x - (first.x + first.w) < 1.5;
    return {
      result: {
        ok: true,
        perfect,
        forged: false,
        close: !perfect && halves.every((h) => h.result.ok && (h.result.perfect || h.result.close)),
        x,
        w,
        streak: nextStreak,
        scrap: null,
        points: perfect ? 10 + 10 * nextStreak : 10,
      },
      landed: halves.reduce((sum, h) => sum + (h.result.ok ? h.landed : 0), 0) / halves.length,
      pieces: touching ? null : pieces,
    };
  }

  private place(): void {
    const prev = this.peak();
    if (!prev) return;
    const dx = dropOffset(prev.x, prev.w, this.mover.x, this.mover.w);
    let pieces: Piece[] | null = null;
    let result: DropResult;
    let landed: number;
    /** The right half of a split slab on the stage, dropped as its own body. */
    let half: { x: number; w: number } | null = null;
    if (this.stage) {
      // On the stage the slab keeps its whole width and falls as it is; a
      // perfect is let go dead centre, anything else lands where it was. A
      // split slab is two halves, each judged on its own side.
      const m = this.mover;
      let perfect: boolean;
      let x: number;
      if (m.split) {
        const [offL, offR] = this.splitOffsets(prev);
        perfect = Math.abs(offL) <= this.tol && Math.abs(offR) <= this.tol;
        x = perfect ? prev.x : m.x;
        half = {
          x: perfect ? prev.x + prev.w / 2 : m.x2,
          w: m.w / 2,
        };
      } else {
        perfect = Math.abs(dx) <= this.tol;
        x = perfect ? prev.x + prev.w / 2 - m.w / 2 : m.x;
      }
      const nextStreak = perfect ? this.streak + 1 : 0;
      result = {
        ok: true,
        perfect,
        forged: false,
        close: !perfect && Math.abs(dx) <= this.tol * 2.15,
        x,
        w: half ? m.w / 2 : m.w,
        streak: nextStreak,
        scrap: null,
        points: perfect ? 10 + 10 * nextStreak : 10,
      };
      landed = dropAccuracy(dx, this.mover.w, this.tol);
    } else if (this.mover.split) {
      const split = this.splitLanding(prev);
      result = split.result;
      landed = split.landed;
      pieces = split.pieces;
    } else {
      result = resolveDrop({
        prevX: prev.x,
        prevW: prev.w,
        moverX: this.mover.x,
        moverW: this.mover.w,
        tol: this.tol,
        startW: this.startW,
        streak: this.streak,
        // Forging is Heat's job now, not the streak's.
        forgeEvery: 0,
      });
      landed = result.ok ? dropAccuracy(dx, this.mover.w, this.tol) : 0;
    }

    this.drops += 1;
    if (!result.ok) {
      if (this.shields > 0) this.spare(prev, "SAVED");
      else if (this.kit.secondWind && !this.secondWindUsed) {
        this.secondWindUsed = true;
        this.spare(prev, "SECOND WIND");
      } else this.die();
      return;
    }
    this.accuracySum += landed;

    const floor = this.stage ? this.floorsNow() + 1 : this.stack.length;
    const slab = this.makeSlab(
      result.x,
      this.stage ? this.mover.y : prev.y + SLAB_H,
      result.w,
      floor,
      this.stage ? 1 : 0,
      1,
    );
    let braced = false;
    if (this.stage) {
      // A perfect sets to the slab beneath it; a miss stays loose, unless a
      // brace is held, which sets it anyway.
      braced = !result.perfect && this.shields > 0;
      if (braced) {
        this.shields -= 1;
        this.shieldAge = 0;
      }
      // Set Stone from a landing: the next few slabs set and count wherever they land.
      const gifted = this.gift.set > 0;
      if (gifted) this.gift.set -= 1;
      const onto = result.perfect || braced || gifted ? prev.body : null;
      slab.body = this.stage.drop(result.x, this.mover.y, result.w, SLAB_H, onto);
      slab.loose = !result.perfect && !braced && !gifted;
      slab.counts = result.perfect || braced || gifted || result.close;
      if (gifted && !result.perfect)
        this.float("SET", result.x + result.w / 2, this.mover.y + 40, true, 20);
    }
    slab.pieces = pieces;
    slab.key = this.mover.keystone && result.perfect;
    let points = result.points;
    if (this.mover.keystone && result.perfect) points += result.points;
    this.stack.push(slab);
    if (braced) {
      this.float("BRACED", result.x + result.w / 2, this.mover.y + 40, true, 22);
      this.fx.ring(result.x + result.w / 2, this.mover.y, SHIELD_RGB, result.w + 40, 5);
    }
    if (this.stage && half) {
      const other = this.makeSlab(half.x, this.mover.y, half.w, floor, 1, 1);
      other.body = this.stage.drop(
        half.x,
        this.mover.y,
        half.w,
        SLAB_H,
        result.perfect || braced ? prev.body : null,
      );
      other.loose = slab.loose;
      other.counts = slab.counts;
      this.stack.push(other);
    }
    this.floors = floor;
    this.score += points;
    this.streak = result.streak;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    if (result.perfect) this.perfects += 1;
    this.hint = false;
    this.phase = "play";

    if (this.mode === "endless") {
      const record = this.save.endless;
      if (this.score > record.best) {
        record.best = this.score;
        this.newBest = true;
      }
      if (this.floors > record.bestFloors) record.bestFloors = this.floors;
      if (!this.crossed && this.ghostFloors > 0 && this.floors > this.ghostFloors) {
        this.crossed = true;
        this.sfx.best();
        this.float("NEW BEST", result.x + result.w / 2, slab.y + 46, true, 24);
      }
    }

    const rgb = slab.rgb;
    const cx = result.x + result.w / 2;
    const seam = slab.y;

    // Heat: what the landing was worth, by the rules of your build.
    const clean = result.perfect || landed >= 0.9;
    const fast =
      clean &&
      this.lastLand >= 0 &&
      this.runTime - this.lastLand <= this.tune.fastWindow + this.kit.fastBonus;
    this.lastLand = this.runTime;
    let gain = 0;
    if (result.perfect) gain += HEAT.perfect * this.tune.heatPerfect;
    else if (clean) gain += HEAT.clean * this.tune.heatClean;
    else gain += HEAT.miss * this.tune.heatMiss;
    if (fast) {
      gain += HEAT.fast * this.tune.heatFast;
      this.fastDrops += 1;
    }
    // Light pushes the Dark back down the tower.
    let push = 0;
    if (result.perfect) push += slab.key ? DARK_PUSH.keystone : DARK_PUSH.perfect;
    else if (clean) push += DARK_PUSH.clean;
    // A split landed home is two perfects, and pushes like it.
    if (result.perfect && this.mover.split) push += DARK_PUSH.perfect;
    if (fast) push += DARK_PUSH.fast;
    if (this.boss) {
      // In the fight only true light tells: a perfect burns it back twice
      // as far, a clean drop barely scratches it, and rubble feeds it.
      push = result.perfect ? push * 3 : clean ? DARK_PUSH.clean * 0.5 : 0;
      if (!slab.counts) {
        this.dark += SLAB_H;
        this.float("IT FEEDS", cx, slab.y + 60, false, 20);
      } else if (result.perfect) {
        this.fx.rayBurst(cx, this.dark, [150, 80, 220], 160, 10);
      }
    }
    this.pushDark(push);
    const heatBefore = this.heat;
    this.heat = clamp01(this.heat + (gain > 0 ? gain * this.kit.charge : gain));
    const struck = this.charged && result.perfect;
    if (struck) {
      this.charges -= 1;
      this.charged = this.charges > 0;
    }

    if (result.perfect) {
      this.rewardPerfect(slab, cx, seam, result.streak, result.forged);
    } else {
      this.sfx.drop();
      if (result.scrap && result.scrap.w > 6) {
        this.sfx.slice();
        this.scraps.push({
          x: result.scrap.x,
          y: slab.y,
          w: result.scrap.w,
          vx: (result.scrap.x < result.x ? -1 : 1) * (90 + Math.random() * 80),
          vy: 80 + Math.random() * 60,
          rot: 0,
          vr: (result.scrap.x < result.x ? -1 : 1) * (2 + Math.random() * 3),
          rgb,
          life: 1.1,
        });
      }
      this.fx.burst(
        result.scrap ? result.scrap.x + result.scrap.w / 2 : result.x,
        slab.y + 8,
        rgb,
        10,
        120,
      );
      if (!this.stage) this.trauma = Math.min(1, this.trauma + 0.28);
      this.freeze = this.reduceMotion ? 0.015 : 0.04;
      haptics.light();
    }

    // Heat multiplies the pay; the build adds its own bonuses on top.
    let pay = dropCoins({
      perfect: result.perfect,
      streak: result.streak,
      forged: false,
      keystone: slab.key,
      accuracy: landed,
    });
    pay *= 1 + heatBefore;
    if (result.perfect) pay *= this.tune.perfectPay * this.kit.perfectPay;
    if (fast) pay += this.tune.fastPay;
    if (struck) pay *= this.kit.chiselPay;
    this.pay(pay, result.x + result.w, slab.y);
    if (struck) {
      this.float(`CHISEL ×${this.kit.chiselPay}`, cx, slab.y + 74, true, 26);
      this.fx.rayBurst(cx, seam + VISUAL_H / 2, BONE, 160, 12);
      this.flash = 0.4;
    } else if (fast) {
      this.float("FAST", slab.x - 30, slab.y + 14, false, 15);
    }
    const grabbed = this.collectMote(cx, slab.y);
    if (!result.perfect && result.close && grabbed === null) {
      this.float("CLOSE", cx, slab.y + 34, false);
    } else if (this.stage && !slab.counts) {
      this.float("RUBBLE", cx, slab.y + 34, false);
    }
    // The other side of wasting away: a clean drop inside the grace grows a little.
    if (
      clean &&
      this.mover.age <= graceFor(this.mover.period, this.mover.course) &&
      slab.w < this.startW
    ) {
      this.widen(slab, Math.min(this.startW, slab.w * QUICK_GROW));
    }
    if (this.heat >= 1) this.fire(slab);
    if (
      this.tune.shieldEvery > 0 &&
      this.floors % this.tune.shieldEvery === 0 &&
      this.shields < MAX_SHIELDS
    ) {
      this.shields += 1;
      this.shieldAge = 0;
      this.sfx.shieldUp();
      this.float("BULWARK", cx, slab.y + 80, false, 18);
    }
    this.camDrop = 64;
    this.music.setTension(tensionFor(slab.w, this.startW));

    if (!this.stage && this.plan.goal > 0 && this.floors >= this.plan.goal) {
      this.win();
      return;
    }
    storeSave(this.save);
    if (grabbed === "ember") {
      // An ember is a gift taken on the move: one of the landing's, at once.
      const [id] = landingOffer(Math.random, this.plan.darkRate > 0, this.plan.sway > 0);
      this.applyGift(id!);
    }
    this.spawnMover();
    // After the next slab is up, so the fresh slab does not wipe the tip.
    if (slab.loose) this.explain("loose");
    this.emit();
  }

  /** Full Heat: the forge fires, and so does the weapon you carry. */
  private fire(slab: Slab): void {
    this.heat = 0;
    this.pushDark(DARK_PUSH.forge);
    const cx = slab.x + slab.w / 2;
    const seam = slab.y;
    const grow = FORGE_GROW + this.tune.forgeBonus;
    if (this.weapon === "buttress" && this.stage) {
      // The wall is made whole: every loose slab in the spire is set.
      const n = this.setSpire();
      if (n > 0) this.float(`${n} SET`, cx, seam + 110, false, 18);
    } else {
      const w = this.weapon === "buttress" ? this.startW : Math.min(this.startW, slab.w * grow);
      this.widen(slab, w);
    }
    if (this.weapon === "chisel") {
      this.charged = true;
      this.charges = this.kit.chiselCharges;
    }
    if (this.weapon === "slipstream") this.slip = this.kit.slipSlabs;
    if (this.kit.fireShield && this.shields < MAX_SHIELDS) {
      this.shields += 1;
      this.shieldAge = 0;
    }
    if (this.kit.fireCoins > 0) this.pay(this.kit.fireCoins, cx + slab.w / 2, seam + 10);
    this.float(WEAPONS[this.weapon].name.toUpperCase(), cx, seam + 74, true, 28);
    this.fx.rayBurst(cx, seam + VISUAL_H / 2, this.theme.accent, 190, 16);
    this.pulse = 1;
    this.flash = Math.max(this.flash, 0.45);
    this.trauma = Math.min(1, this.trauma + 0.45);
    this.freeze = Math.max(this.freeze, this.reduceMotion ? 0.02 : 0.09);
    // The widening runs down the tower as a wave of light.
    for (let i = this.stack.length - 1, n = 0; i >= 0 && n < 14; i--, n++) {
      this.stack[i]!.ripple = n * 0.03;
    }
    this.sfx.forge();
    this.sfx.fire();
    haptics.heavy();
  }

  /** Welds every loose slab to the one beneath it; returns how many were set. */
  private setSpire(): number {
    if (!this.stage) return 0;
    let n = 0;
    for (let i = 1; i < this.stack.length; i++) {
      const s = this.stack[i]!;
      const under = this.stack[i - 1]!;
      if (!s.loose || s.body === null || under.body === null) continue;
      this.stage.weld(s.body, under.body);
      s.loose = false;
      s.flash = 1;
      n++;
    }
    return n;
  }

  /** Rebuilds the top slab to a new width about its centre. */
  private widen(slab: Slab, w: number): void {
    if (w <= slab.w + 0.4) return;
    // Reinforced: the slab is drawn growing out from its centre, with
    // white-hot ends and sparks where the new stone is welded on.
    slab.grow = { from: slab.w, t: 0 };
    slab.x = slab.x + slab.w / 2 - w / 2;
    slab.w = w;
    if (this.stage && slab.body !== null) this.stage.resize(slab.body, w);
    slab.flash = 0.6;
    const hot = mix(this.theme.accent, BONE, 0.6);
    this.fx.sparkle(slab.x + 4, slab.y + VISUAL_H / 2, 8, hot, 8);
    this.fx.sparkle(slab.x + w - 4, slab.y + VISUAL_H / 2, 8, hot, 8);
    this.sfx.slice();
    this.music.setTension(tensionFor(w, this.startW));
    const m = this.mover;
    if (m.fallT < 0 && this.phase !== "pick") {
      m.w = w;
      m.w0 = w;
      m.center = slab.x + w / 2;
      m.halfSpan = Math.max(w * 0.98, 80);
      this.syncMoverX();
    }
  }

  /** Pauses the run with three upgrades to choose from. */
  private openPicks(): void {
    this.phase = "pick";
    this.offers = offer(Math.random, this.picks);
    this.mote = null;
    this.bomb = null;
    this.tip = "";
    this.sfx.chime();
    this.emit();
  }

  /** The payoff for a perfect: it scales with the streak, and a forge tops it. */
  private rewardPerfect(
    slab: Slab,
    cx: number,
    seam: number,
    streak: number,
    forged: boolean,
  ): void {
    const accent = this.theme.accent;
    const heat = Math.min(1, streak / 8);
    const keystone = this.mover.keystone;
    this.fx.burst(cx, slab.y + VISUAL_H / 2, slab.rgb, forged ? 28 : 16, 160);
    this.fx.seam(cx, seam, slab.w * (1.3 + heat * 0.7), mix(accent, BONE, 0.5));
    this.fx.sparkle(cx, seam + 2, slab.w, mix(accent, BONE, 0.55), 8 + Math.round(heat * 14));
    this.pulse = Math.min(1, 0.35 + heat * 0.4);
    this.flash = forged ? 0.45 : 0.22;
    if (!this.stage) this.trauma = Math.min(1, this.trauma + (forged ? 0.45 : 0.22));
    this.freeze = this.reduceMotion ? 0.02 : forged ? 0.09 : 0.055;

    if (forged) {
      this.sfx.forge();
      this.float("FORGE", cx, slab.y + 40, true, 28);
      this.fx.rayBurst(cx, seam + VISUAL_H / 2, accent, 190, 16);
      this.pulse = 1;
      // The widening runs down the tower as a wave of light.
      for (let i = this.stack.length - 1, n = 0; i >= 0 && n < 14; i--, n++) {
        this.stack[i]!.ripple = n * 0.03;
      }
      haptics.heavy();
    } else if (keystone) {
      this.sfx.perfect(streak);
      this.sfx.chime();
      this.float("KEYSTONE", cx, slab.y + 36, true, 24);
      this.fx.rayBurst(cx, seam + VISUAL_H / 2, BONE, 130, 10);
      haptics.medium();
    } else {
      this.sfx.perfect(streak);
      this.float(
        streak >= 2 ? `PERFECT ×${streak}` : "PERFECT",
        cx,
        slab.y + 36,
        true,
        20 + Math.min(8, streak),
      );
      haptics.medium();
    }
  }

  /** Takes the pickup if the slab landed under its line. Returns whether it did. */
  private collectMote(x: number, y: number): PickupKind | null {
    const mote = this.mote;
    if (!mote) return null;
    const center = this.landingCenter();
    if (Math.abs(center - mote.x) > this.kit.reach) {
      // Left behind: it winks out rather than just vanishing.
      this.fx.burst(mote.x, mote.y, [150, 150, 150], 6, 60);
      if (mote.kind === "ember") this.float("EMBER LOST", mote.x, mote.y + 20, false, 15);
      return null;
    }
    this.mote = null;
    this.score += 15;
    this.pay(3, x + this.mover.w / 2, y + 26);
    if (Math.abs(center - mote.x) > BASE_REACH)
      this.float("MAGNET", mote.x, mote.y + 22, false, 15);
    const rgb = pickupRgb(mote.kind);
    this.fx.burst(mote.x, mote.y, rgb, 22, 220);
    this.fx.rayBurst(mote.x, mote.y, rgb, 120, 10);
    this.fx.sparkle(x, y + 2, this.mover.w, mix(rgb, BONE, 0.4), 16);
    this.flash = Math.max(this.flash, 0.3);
    this.pulse = 1;
    this.freeze = Math.max(this.freeze, this.reduceMotion ? 0.02 : 0.08);
    haptics.medium();
    if (mote.kind === "shield") {
      this.shields = Math.min(MAX_SHIELDS, this.shields + 1);
      this.shieldAge = 0;
      this.sfx.shieldUp();
      this.float("BRACE", x, y + 62, false, 24);
    } else if (mote.kind === "lull") {
      this.lull = true;
      this.sfx.slow();
      this.float("SLOWED", x, y + 62, false, 24);
    } else {
      this.sfx.chime();
      this.float("EMBER CLAIMED", x, y + 62, true, 24);
    }
    return mote.kind;
  }

  /** A shield turns a miss into a narrow slab instead of a fall. */
  private spare(prev: Slab, label: string): void {
    if (this.shields > 0) this.shields -= 1;
    this.shieldAge = 0;
    this.heat = clamp01(this.heat + HEAT.saved * this.tune.heatMiss);
    const w = Math.max(MIN_W + 8, prev.w * 0.46);
    const x = prev.x + (prev.w - w) / 2;
    const floor = this.stack.length;
    const slab = this.makeSlab(x, prev.y + SLAB_H, w, floor, 0, 1);
    this.stack.push(slab);
    this.floors = floor;
    this.score += 5;
    this.streak = 0;
    this.hint = false;
    this.phase = "play";
    this.mote = null;
    this.trauma = Math.min(1, this.trauma + 0.45);
    this.flash = 0.2;
    this.freeze = 0.08;
    this.sfx.slice();
    this.sfx.shieldBreak();
    this.float(label, x + w / 2, slab.y + 44, true, 28);
    this.camDrop = 64;
    this.fx.burst(x + w / 2, slab.y + 10, slab.rgb, 16, 150);
    // The bubble bursts: shards outward, and a ring where it stood.
    this.fx.burst(x + w / 2, slab.y, SHIELD_RGB, 40, 320);
    this.fx.ring(x + w / 2, slab.y, SHIELD_RGB, prev.w + 60, 6);
    this.fx.rayBurst(x + w / 2, slab.y, SHIELD_RGB, 200, 14);
    this.flash = 0.45;
    this.freeze = this.reduceMotion ? 0.03 : 0.14;
    haptics.heavy();
    this.music.setTension(tensionFor(slab.w, this.startW));
    if (this.plan.goal > 0 && this.floors >= this.plan.goal) {
      this.win();
      return;
    }
    storeSave(this.save);
    this.spawnMover();
    this.emit();
  }

  /** Price of a rebuild at this height: cheap low down, dear near the summit. */
  private rescuePrice(): number {
    return 20 + 3 * this.floors;
  }

  private rescueOpen(): boolean {
    return !!this.rescue && this.fallAge < this.rescue.until;
  }

  /**
   * Pays to stand the tower back up after a fall. Once per run, never while
   * a free Second Wind is still owed, and it forfeits the pace star.
   */
  rebuild(): boolean {
    const offer = this.rescue;
    if (this.phase !== "fall" || !offer || !this.rescueOpen()) return false;
    if (this.save.coins < offer.price) {
      this.sfx.sputter();
      return false;
    }
    this.wake();
    this.save.coins -= offer.price;
    this.rescue = null;
    this.rebuilt = true;
    this.phase = "play";
    this.scraps = [];
    this.fx.clear();
    for (let i = 0; i < this.stack.length; i++) {
      const slab = this.stack[i]!;
      const was = offer.stack[i]!;
      slab.x = was.x;
      slab.y = was.y;
      slab.rot = 0;
      slab.vx = 0;
      slab.vy = 0;
      slab.vr = 0;
      slab.falling = false;
      slab.fallDelay = 0;
      slab.ripple = (this.stack.length - 1 - i) * 0.03;
    }
    // Stood back up narrower, the way a shield save leaves it.
    const top = this.peak()!;
    if (this.stack.length > 1) {
      const w = Math.max(MIN_W + 8, top.w * 0.6);
      top.x = top.x + top.w / 2 - w / 2;
      top.w = w;
      top.pieces = null;
    }
    this.streak = 0;
    this.heat = 0;
    this.trauma = 0.6;
    this.flash = 0.4;
    this.float("REBUILT", top.x + top.w / 2, top.y + 48, true, 28);
    this.sfx.buy();
    this.sfx.forge();
    haptics.success();
    this.music.setMood("play");
    this.music.setTension(tensionFor(top.w, this.startW));
    this.spawnMover();
    this.commit();
    this.emit();
    return true;
  }

  private die(): void {
    this.phase = "fall";
    this.keepGhost();
    this.fallAge = 0;
    this.hint = false;
    this.bomb = null;
    this.freeze = 0;
    this.rescue = null;
    const rgb = this.slabColor(this.floors + 1);
    this.scraps.push({
      x: this.mover.x,
      y: this.mover.y,
      w: this.mover.w,
      vx: this.mover.dir * 140,
      vy: 40,
      rot: 0,
      vr: this.mover.dir * 3.2,
      rgb,
      life: 1.6,
    });
    for (let i = 0; i < this.stack.length; i++) {
      const slab = this.stack[i]!;
      if (slab.body !== null) continue;
      const fromTop = this.stack.length - 1 - i;
      slab.falling = true;
      slab.fallDelay = fromTop * 0.028;
      slab.vx = (Math.random() - 0.5) * 160;
      slab.vy = 20 + Math.random() * 40;
      slab.vr = (Math.random() - 0.5) * 5;
    }
    this.fx.burst(this.mover.x + this.mover.w / 2, this.mover.y, rgb, 26, 220);
    this.trauma = 1;
    this.flash = 0.35;
    this.sfx.fail();
    this.music.setMood("fallen");
    haptics.failure();
    this.commit();
    this.emit();
  }

  private win(): void {
    const level = LEVELS[this.levelIndex]!;
    const accuracy = this.accuracy();
    const goals = goalsFor(this.runTime, accuracy, level.parTime, level.parAccuracy);
    // A rebuilt run can still light the sky, but it was not a clean climb.
    if (this.rebuilt) goals.swift = false;
    const outcome = recordRun(this.save, level.id, this.runTime, accuracy, goals);
    {
      const world = worldOf(level.id);
      const at = world.levelIds.indexOf(level.id) + 1;
      this.save.progress[world.id] = Math.max(this.save.progress[world.id] ?? 0, at);
    }
    this.result = {
      levelIndex: this.levelIndex,
      time: this.runTime,
      accuracy,
      perfects: this.perfects,
      floors: this.floors,
      bestStreak: this.bestStreak,
      goals,
      outcome,
      coins: this.paySummit(accuracy, goals, outcome),
      rebuilt: this.rebuilt,
      offers: [],
      ghost: this.ghostResult(),
      trace: [],
      feats: [],
      lit: 0,
      boss: this.mode === "level" && isBoss(level.id),
      unranked: this.unranked,
    };
    this.result.lit = skiesLit(this.save);
    this.result.feats = earn(
      this.save.feats,
      featsFor({
        skiesLit: this.result.lit,
        skies: LEVELS.length,
        starsOnThisSky: starCount(this.save.levels[level.id]!),
        totalStars: totalStars(this.save),
        perfects: this.perfects,
        floors: this.floors,
        ghost: this.result.ghost
          ? { beaten: this.result.ghost.beaten, rival: this.result.ghost.name !== "BEST" }
          : null,
      }),
      Date.now(),
    );
    // The ghost summits when the run did, by the official clock.
    this.mark(this.plan.goal);
    this.trace.length = this.plan.goal + 1;
    this.trace[this.plan.goal] = this.runTime;
    this.result.trace = this.trace.slice();
    this.keepGhost();
    this.result.offers = this.offersNow();
    this.phase = "won";
    this.wonAge = 0;
    this.dark = DARK_START - 400;
    this.camAtWin = this.camY;
    this.mote = null;
    this.bomb = null;
    this.freeze = 0;

    const top = this.peak()!;
    const cx = top.x + top.w / 2;
    const crown = top.y + VISUAL_H;
    // Pull back far enough to stand the whole spire above the results card.
    this.fitZoom = Math.max(0.28, Math.min(1, (this.summitHorizon() - 44) / (crown + 60)));

    const accent = this.theme.accent;
    this.fx.rayBurst(cx, crown, accent, 280, 20);
    this.fx.ring(cx, crown, BONE, 220, 6);
    this.fx.sparkle(cx, crown, top.w, mix(accent, BONE, 0.5), 40);
    this.fx.confettiRain(this.viewW, [accent, BONE, ...this.theme.slab], 110);
    for (let i = 0; i < this.stack.length; i++) this.stack[i]!.ripple = i * 0.035;
    this.float("SUMMIT", cx, crown + 44, true, 30);
    this.pulse = 1;
    this.flash = 0.5;
    this.trauma = Math.min(1, this.trauma + 0.5);
    this.shellsLeft = this.reduceMotion ? 3 : 10;
    this.nextShell = 0.3;
    const stars = Number(goals.clear) + Number(goals.precise) + Number(goals.swift);
    this.starCues = [1.05, 1.4, 1.75].slice(0, stars);
    this.sfx.summit();
    this.music.setMood("summit");
    haptics.success();
    this.commit();
    this.emit();
  }

  /** Screen y the ground settles at behind the results card. */
  private summitHorizon(): number {
    return Math.max(this.viewH * 0.3, Math.min(this.viewH * 0.52, this.viewH - CARD_H));
  }

  private accuracy(): number {
    return this.drops > 0 ? this.accuracySum / this.drops : 1;
  }

  private commit(): void {
    storeSave(this.save);
    this.events.onSave(this.save);
  }

  /** Pays for a drop on the spot: the wallet grows and a coin pops off the slab. */
  private pay(base: number, x: number, y: number): void {
    // Coins are retired: nothing is bought any more, so nothing is paid.
    const coins = 0 * Math.round(base * this.kit.coins);
    if (coins <= 0) return;
    this.save.coins += coins;
    this.runCoins += coins;
    this.floaters.push({
      text: `+${coins}`,
      x: x + 26,
      y: y + 12,
      vy: 64,
      life: 0.8,
      max: 0.8,
      hot: false,
      size: 15 + Math.min(7, coins),
      coin: true,
    });
    if (coins >= 5) this.fx.sparkle(x, y + 10, 20, GOLD_RGB, 6);
    this.sfx.coin(coins);
  }

  /** How the summit stands against the ghost; a win pays a little. */
  private ghostResult(): { time: number; beaten: boolean; name: string } | null {
    const g = this.ghost;
    if (!g || g.length <= this.plan.goal) return null;
    const time = g[this.plan.goal]!;
    const beaten = this.runTime < time;
    if (beaten) {
      this.save.coins += GHOST_PURSE;
      this.runCoins += GHOST_PURSE;
    }
    return { time, beaten, name: this.ghostName };
  }

  /** The purse for a summit. Banked here; the results card itemises it. */
  private paySummit(accuracy: number, goals: Goals, outcome: RunOutcome): Payout {
    const purse = summitCoins(this.levelIndex, accuracy, goals, outcome.fresh);
    const scale = (n: number) => Math.round(n * this.kit.coins);
    const clear = scale(purse.clear);
    const acc = scale(purse.accuracy);
    const pace = scale(purse.pace);
    const stars = scale(purse.stars);
    const bonus = clear + acc + pace + stars;
    this.save.coins += bonus;
    const drops = this.runCoins;
    this.runCoins += bonus;
    return { drops, clear, accuracy: acc, pace, stars, total: drops + bonus };
  }

  private float(text: string, x: number, y: number, hot: boolean, size = 20): void {
    // A fast chain would stack call-outs into a smear; the newest one wins.
    const kind = text.split(" ")[0];
    this.floaters = this.floaters.filter((f) => f.text.split(" ")[0] !== kind);
    this.floaters.push({ text, x, y, vy: 42, life: 0.9, max: 0.9, hot, size, coin: false });
  }

  private hudPhase(): HudPhase {
    return this.phase === "fall" ? "over" : this.phase;
  }

  private emit(): void {
    const course = this.mover.course;
    const live = this.phase === "ready" || this.phase === "play";
    this.events.onHud({
      phase: this.hudPhase(),
      paused: this.paused,
      mode: this.mode,
      levelIndex: this.levelIndex,
      floors: this.floors,
      goal: this.plan.goal,
      score: this.score,
      streak: this.streak,
      perfects: this.perfects,
      accuracy: this.accuracy(),
      time: this.runTime,
      best: this.save.endless.best,
      newBest: this.newBest,
      course: live ? courseLabel(course) : "",
      blurb: !live || course === "slide" ? "" : courseHint(course),
      relic: this.shields > 1 ? `Brace ×${this.shields}` : this.shields === 1 ? "Brace" : "",
      hold: !!this.bomb && this.bomb.fuse > 0 && live,
      hint: this.hint && live,
      tip: live ? this.tip : "",
      runCoins: this.runCoins,
      heat: this.heat,
      weapon: this.weapon,
      charged: this.charged,
      slip: this.slip,
      ranks: {
        mason: this.save.tracks.mason ?? 0,
        striker: this.save.tracks.striker ?? 0,
        runner: this.save.tracks.runner ?? 0,
      },
      families: {
        mason: familyCount(this.picks, "mason"),
        striker: familyCount(this.picks, "striker"),
        runner: familyCount(this.picks, "runner"),
      },
      offers: this.offers,
      style:
        this.phase === "fall" || this.phase === "won"
          ? styleOf(this.floors, this.perfects, this.fastDrops)
          : null,
      house: houseOf(this.save.tracks, this.save.weapon),
      coins: this.save.coins,
      darkGap:
        this.plan.darkRate > 0 && live && !this.escape
          ? Math.max(0, Math.floor(this.darkGap()))
          : null,
      descent: !!this.plan.descent,
      accent: rgbCss(this.theme.accent),
      result: this.result,
      rescue: this.rescueOpen()
        ? { price: this.rescue!.price, seconds: Math.ceil(this.rescue!.until - this.fallAge) }
        : null,
      taken: this.taken,
      ghostGap:
        live && this.ghost !== null && this.phase === "play"
          ? Math.round(this.floors - this.ghostNow()!)
          : null,
      ghostName: this.ghostName,
      boss: this.boss ? { surge: this.boss.surge + 1, of: BOSS_SURGES } : null,
      escape: this.escape
        ? {
            left: Math.max(0, this.stack.length - 1),
            combo: this.escape.combo,
            briefing: this.escape.briefing,
            sting: this.escape.sting,
            gaze: this.escape.gaze,
            stirFor: this.escape.gazeStir,
            count: this.escape.count,
            bound: (() => {
              const top = this.stack[this.stack.length - 1];
              return top ? (this.escape!.bound.get(top)?.taps ?? 0) : 0;
            })(),
          }
        : null,
      landing: this.landing,
    });
  }

  /* ---------------------------------------------------------------- loop */

  private frame = (now: number): void => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!this.paused) {
      this.acc += dt;
      let steps = 0;
      while (this.acc >= STEP && steps < 5) {
        this.step(STEP);
        this.acc -= STEP;
        steps++;
      }
      if (steps === 5) this.acc = 0;
    }
    this.render();
    this.raf = requestAnimationFrame(this.frame);
  };

  private step(dt: number): void {
    this.clock += dt;
    if (this.freeze > 0) this.freeze -= dt;
    if (this.fade < 1) {
      this.fade = Math.min(1, this.fade + dt / 0.7);
      if (this.fade >= 1) this.fading = null;
    }
    this.curtain = Math.max(0, this.curtain - dt / 0.32);
    this.pulse = Math.max(0, this.pulse - dt * 2.2);

    const aiming = this.phase === "menu" || this.phase === "ready" || this.phase === "play";
    const prev = this.peak();
    let inZone = false;
    if (aiming && this.freeze <= 0) {
      if (this.mover.fallT >= 0) this.advanceFall(dt);
      else this.advanceMover(dt);
      inZone = this.cued() && this.lined(this.peak());
      if (this.phase !== "menu") {
        if (inZone && !this.wasInZone) this.sfx.tick();
        this.wasInZone = inZone;
        const armed =
          !!this.mote &&
          this.mover.fallT < 0 &&
          Math.abs(this.landingCenter() - this.mote.x) <= this.kit.reach;
        if (armed && !this.moteArmed) this.sfx.lock();
        this.moteArmed = armed;
        if (this.mover.course === "beat") {
          const moving = beatPhase(this.clock, this.mover.period) < 0.58;
          if (moving && !this.beatOn) {
            this.sfx.pulse();
            // Each jump throws a flash under the slab, so the rhythm is something you can see.
            this.fx.seam(
              this.mover.x + this.mover.w / 2,
              this.mover.y,
              this.mover.w * 1.1,
              this.theme.accent,
            );
          }
          this.beatOn = moving;
        } else {
          this.beatOn = false;
        }
      }
    }
    // The clock runs from the first drop, and never during a hit-stop: a
    // perfect must not cost time for the freeze frame that celebrates it.
    if (this.phase === "play" && this.freeze <= 0) this.runTime += dt;
    if (this.phase !== "won") this.settle(dt);
    if (this.escape && this.phase === "play") this.chase(dt);
    this.riseDark(dt);
    this.music.setBoss(this.escape !== null);
    if (this.stage && this.phase === "play") {
      // The score follows the climb: height, the Dark's nearness, the streak.
      const goal = this.plan.goal > 0 ? this.plan.goal : 40;
      this.music.setClimb({
        progress: clamp01(this.floors / goal),
        danger: this.boss ? 1 : clamp01(1 - (this.darkGap() - 2) / 8),
        streak: this.streak,
        landings: this.landed.size,
      });
    }

    const flareGoal = inZone && this.mover.course === "eclipse" && this.phase !== "menu" ? 1 : 0;
    this.flare += (flareGoal - this.flare) * Math.min(1, dt * 14);
    const strainGoal = this.phase === "play" && prev ? tensionFor(prev.w, this.startW) : 0;
    this.strain += (strainGoal - this.strain) * Math.min(1, dt * 3);
    if (this.shields > 0) this.shieldAge += dt;
    const slowGoal = this.mover.slowed && aiming && this.phase !== "menu" ? 1 : 0;
    this.slow += (slowGoal - this.slow) * Math.min(1, dt * 6);

    if (this.bomb && aiming) {
      this.bomb.fuse -= dt;
      this.bomb.flash = Math.max(0, this.bomb.flash - dt * 5);
      if (this.bomb.fuse <= 0) {
        this.fx.burst(this.bomb.x, this.bomb.y, [200, 200, 200], 14, 160);
        this.fx.ring(this.bomb.x, this.bomb.y, BONE, 60, 3);
        this.float("GO", this.bomb.x, this.bomb.y, true, 26);
        this.sfx.hiss();
        this.sfx.go();
        haptics.light();
        this.bomb = null;
        this.tip = "";
        this.emit();
      }
    }

    if (this.phase === "fall") {
      const before = this.fallAge;
      this.fallAge += dt;
      // Keep the countdown on the fall card ticking.
      if (
        this.rescue &&
        Math.ceil(this.rescue.until - before) !== Math.ceil(this.rescue.until - this.fallAge)
      ) {
        this.emit();
      }
      for (const slab of this.stack) {
        if (!slab.falling) continue;
        slab.fallDelay -= dt;
        if (slab.fallDelay > 0) continue;
        slab.vy -= 1500 * dt;
        slab.y += slab.vy * dt;
        slab.x += slab.vx * dt;
        slab.rot += slab.vr * dt;
      }
    } else {
      for (const slab of this.stack) {
        if (slab.anim < 1) slab.anim = Math.min(1, slab.anim + dt / 0.22);
        if (slab.flash > 0) slab.flash = Math.max(0, slab.flash - dt / 0.16);
        if (slab.grow) {
          slab.grow.t += dt / 0.32;
          if (slab.grow.t >= 1) slab.grow = null;
        }
        if (slab.ripple >= 0) {
          slab.ripple -= dt;
          if (slab.ripple < 0) slab.flash = 0.9;
        }
      }
    }

    for (let i = this.scraps.length - 1; i >= 0; i--) {
      const s = this.scraps[i]!;
      if (this.plan.descent) {
        // Down here what is cut off falls away from the ceiling, onto them.
        s.vy += 1400 * dt;
        s.y += s.vy * dt;
        if (!s.squashed && s.y >= this.climbersY() && this.phase === "play") {
          s.squashed = true;
          s.life = Math.min(s.life, 0.25);
          this.squash(s.x + s.w / 2, s.w);
        }
      } else {
        s.vy -= 1400 * dt;
        s.y += s.vy * dt;
      }
      s.x += s.vx * dt;
      s.rot += s.vr * dt;
      s.life -= dt;
      if (s.life <= 0) this.scraps.splice(i, 1);
    }

    this.fx.step(dt);

    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i]!;
      f.y += f.vy * dt;
      f.life -= dt;
      if (f.life <= 0) this.floaters.splice(i, 1);
    }

    if (this.phase === "menu") this.attract(dt);
    if (this.phase === "won") this.celebrate(dt);
    else if (prev && this.phase !== "fall") {
      const seam = this.stage ? this.seat.y : prev.y + SLAB_H;
      const targetY = Math.max(0, seam - this.viewH * LEAD) + this.camDrop;
      const targetX = this.stage ? this.seat.x : prev.x + prev.w / 2;
      const k = 1 - Math.exp(-(this.stage ? 3 : 5.2) * dt);
      this.camY += (targetY - this.camY) * k;
      this.camX += (targetX - this.camX) * k;
      // The far scenery leans a little against the slab's travel.
      const lean =
        this.mover.course === "eclipse" || this.reduceMotion
          ? 0
          : (this.mover.x + this.mover.w / 2 - targetX) * 0.16;
      this.look += (lean - this.look) * Math.min(1, dt * 4);
    }
    this.camDrop = Math.max(0, this.camDrop - dt * 110);

    this.trauma = Math.max(0, this.trauma - dt * 1.7);
    this.flash = Math.max(0, this.flash - dt * 1.8);
  }

  /** The summit: shells go up, stars chime in, and the camera pulls back. */
  private celebrate(dt: number): void {
    const before = this.wonAge;
    this.wonAge += dt;
    for (let i = 0; i < this.starCues.length; i++) {
      const cue = this.starCues[i]!;
      if (before < cue && this.wonAge >= cue) {
        this.sfx.star(i);
        haptics.light();
      }
    }
    const top = this.peak()!;
    if (this.shellsLeft > 0 && this.wonAge >= this.nextShell) {
      this.shellsLeft -= 1;
      this.nextShell += 0.26 + Math.random() * 0.34;
      const palette: RGB[] = [this.theme.accent, BONE, this.theme.slab[1], this.theme.slab[2]];
      const crown = top.y + VISUAL_H;
      this.fx.firework(
        this.camX + (Math.random() - 0.5) * this.vw * 0.8,
        crown * (0.45 + Math.random() * 0.5) + 60 + Math.random() * 120,
        palette[this.shellsLeft % palette.length]!,
        0.8 + Math.random() * 0.6,
      );
      this.sfx.firework();
      this.pulse = Math.max(this.pulse, 0.5);
    }
    const t = this.reduceMotion ? 1 : clamp01((this.wonAge - 0.55) / 1.9);
    this.pull = easeInOut(t);
    this.camY = this.camAtWin * (1 - this.pull);
    const k = 1 - Math.exp(-2.4 * dt);
    this.camX += (top.x / 2 + top.w / 4 - this.camX) * k * this.pull;
    this.look += (0 - this.look) * k;
  }

  /* -------------------------------------------------------------- render */

  private worldToScreen = (x: number, yBottom: number): { x: number; y: number } => {
    if (this.plan.descent) {
      // Built down: the world is mirrored, so higher means further down the
      // screen. Offset by a slab so anything drawn up from its bottom edge
      // (slabs, the mover, scraps) still covers its own floor.
      return {
        x: this.vw / 2 + (x - this.camX),
        y: this.vh * DESCENT_SEAT - this.viewH * LEAD + SLAB_H + VISUAL_H + (yBottom - this.camY),
      };
    }
    return {
      x: this.vw / 2 + (x - this.camX),
      y: this.horizonY - (yBottom - this.camY),
    };
  };

  /** Where the climbers' front is, in world height: as far past the tip as the Dark is below it. */
  private climbersY(): number {
    return 2 * this.crownY() - this.darkShown;
  }

  /** The painted shaft, falling past slowly as the spire goes down. */
  private drawShaft(ctx: CanvasRenderingContext2D, view: BackdropView): void {
    const img = (this.shaftArt ??= Object.assign(new Image(), { src: "art/bg-descent.jpg" }));
    ctx.fillStyle = "rgb(8,5,12)";
    ctx.fillRect(0, 0, view.w, view.h);
    if (!img.complete || img.naturalWidth === 0) return;
    const w = view.w * 1.15;
    const h = w * (img.naturalHeight / img.naturalWidth);
    // It slides up as you go down, a tenth of the pace: far walls.
    const travel = Math.max(0, h - view.h);
    const y = -Math.min(travel, this.camY * 0.12);
    ctx.drawImage(img, (view.w - w) / 2 - (view.camX % 1) * 0, y, w, h);
    // Held back so the slabs read first.
    ctx.fillStyle = "rgba(6,3,10,0.38)";
    ctx.fillRect(0, 0, view.w, view.h);
  }

  /**
   * What climbs: a seething front of pale shapes coming up the shaft at the
   * spire's tip, the deep black beneath them. Where the Dark would be.
   */
  private drawClimbers(ctx: CanvasRenderingContext2D): void {
    const front = this.worldToScreen(0, this.climbersY()).y - VISUAL_H;
    if (front > this.vh + 60) return;
    const clock = this.reduceMotion ? 0 : this.clock;
    // The deep: black rising under them.
    const g = ctx.createLinearGradient(0, front - 10, 0, front + 160);
    g.addColorStop(0, "rgba(6,3,10,0)");
    g.addColorStop(0.35, "rgba(6,3,10,0.82)");
    g.addColorStop(1, "rgba(4,2,8,0.97)");
    ctx.fillStyle = g;
    ctx.fillRect(-120, front - 10, this.vw + 240, this.vh - front + 200);
    // The climbers: painted things crawling up the shaft, far ones fading into the black.
    const order = [...Array(CLIMBERS).keys()].sort((a, b) => climber(b).depth - climber(a).depth);
    for (const i of order) {
      const c = climber(i);
      const sheet = this.sprite(c.kind);
      if (!sheet) continue;
      const dead = this.climberDead.get(i);
      let squash = 1;
      let alpha = 1 - c.depth * 0.45;
      if (dead) {
        const age = this.clock - dead;
        if (age < CLIMBER_SQUASH) {
          // Crushed flat against the slab, then gone.
          squash = 0.25 + 0.75 * (1 - age / CLIMBER_SQUASH) ** 3;
          alpha *= 1 - age / CLIMBER_SQUASH;
        } else if (age < CLIMBER_RESPAWN) continue;
        else if (age < CLIMBER_RESPAWN + 1) alpha *= age - CLIMBER_RESPAWN;
        else this.climberDead.delete(i);
      }
      const x = c.x * (this.vw + 40) - 20;
      const size = CLIMBER_SIZE[c.kind] * (1 - c.depth * 0.4);
      const y =
        front + 8 + size * 0.4 + c.depth ** 1.4 * 170 + Math.sin(clock * (3 + c.r * 3) + i) * 3;
      const fps = CLIMBER_FPS[c.kind];
      const frame = Math.floor(clock * fps + c.r * sheet.frames) % sheet.frames;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.translate(x, y);
      // Side-on crawlers turned a quarter: they scale the shaft head first.
      ctx.rotate(Math.PI / 2 + (c.r - 0.5) * 0.35);
      ctx.scale(squash, c.flip ? -1 : 1);
      ctx.drawImage(
        sheet.img,
        frame * sheet.cell,
        0,
        sheet.cell,
        sheet.cell,
        -size / 2,
        -size / 2,
        size,
        size,
      );
      ctx.restore();
    }
    // The edge stays readable whatever they look like.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(150,80,220,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = -40; x <= this.vw + 40; x += 12) {
      const y = front + Math.sin(x * 0.021 + clock * 1.1) * 5;
      if (x === -40) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  /** Slabs from the top that burn: a streak of four sets the top alight, and it spreads. */
  private burning(): number {
    if (this.phase !== "play" && this.phase !== "ready") return 0;
    return this.streak >= FIRE_STREAK ? Math.min(FIRE_MAX, this.streak - FIRE_STREAK + 1) : 0;
  }

  /** The living look of a slab (or of the mover, for null): fire, frost, charge, or none. */
  private slabLook(slab: Slab | null, hot: boolean): SlabLook | null {
    if (slab && this.escape?.charged.has(slab)) return "charge";
    if (this.theme.id === "glacier") return "ice";
    if (hot) return "fire";
    return null;
  }

  /**
   * The current sky's painted plate, once its loop can be drawn; null keeps
   * the drawn backdrop (and while it loads).
   */
  private paintedSky(): { video: HTMLVideoElement; fg: HTMLImageElement } | null {
    const id = this.theme.id;
    if (!PAINTED_SKIES.includes(id) || this.plan.descent || typeof document === "undefined") {
      return null;
    }
    let sky = this.skies.get(id);
    if (!sky) {
      const video = document.createElement("video");
      video.src = `art/sky/${id}.mp4`;
      video.poster = `art/sky/${id}.jpg`;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "auto";
      video.setAttribute("playsinline", "");
      video.style.cssText =
        "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:0;top:0";
      const made = {
        video,
        fg: Object.assign(new Image(), { src: `art/sky/${id}-fg.webp` }),
        ready: false,
      };
      const ready = () => {
        if (video.readyState >= 2) made.ready = true;
      };
      video.addEventListener("loadeddata", ready);
      video.addEventListener("playing", ready);
      video.addEventListener("timeupdate", ready);
      document.body.appendChild(video);
      video.load();
      this.skies.set(id, made);
      sky = made;
    }
    // Only the sky in view plays.
    for (const [other, s] of this.skies) if (other !== id && !s.video.paused) s.video.pause();
    if (sky.video.paused) void sky.video.play().catch(() => undefined);
    return sky.ready ? sky : null;
  }

  /**
   * The painted sky: the plate covers the view and slides from its ground to
   * its night as the climb goes up; embers drift at two depths over it.
   */
  private drawSky(ctx: CanvasRenderingContext2D, view: BackdropView): void {
    const v = this.paintedSky()!.video;
    const ratio = v.videoHeight / Math.max(1, v.videoWidth) || 16 / 9;
    const w = Math.max(view.w * 1.06, (view.h * 1.22) / ratio);
    const h = w * ratio;
    const climb = clamp01(view.altitude);
    const y = (view.h - h) * (1 - climb);
    const x = (view.w - w) / 2 - view.camX * 0.04;
    ctx.drawImage(v, x, y, w, h);
    // Held back, darkest down the middle, so the tower reads first.
    const shade = ctx.createLinearGradient(0, 0, view.w, 0);
    shade.addColorStop(0, "rgba(8,5,10,0.22)");
    shade.addColorStop(0.5, "rgba(8,5,10,0.5)");
    shade.addColorStop(1, "rgba(8,5,10,0.22)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, view.w, view.h);
    // The far embers, slow.
    this.drawEmbers(ctx, view, 0.25, 26, 1.2, 0.5);
  }

  /** In front of the tower: near embers, quick, and the ruins you rise out of. */
  private drawSkyFront(ctx: CanvasRenderingContext2D, view: BackdropView): void {
    this.drawEmbers(ctx, view, 1.4, 14, 2.4, 0.9);
    const fg = this.paintedSky()!.fg;
    if (!fg.complete || fg.naturalWidth === 0) return;
    const w = view.w * 1.1;
    const h = w * (fg.naturalHeight / fg.naturalWidth);
    // Closer than the tower: it falls away faster than the climb.
    const y = view.h - h * 0.92 + (view.camY - this.anchor) * 1.35;
    if (y > view.h) return;
    ctx.drawImage(fg, (view.w - w) / 2 - view.camX * 0.25, y, w, h);
  }

  /** Embers rising through a layer: depth sets their parallax, size and pace. */
  private drawEmbers(
    ctx: CanvasRenderingContext2D,
    view: BackdropView,
    depth: number,
    count: number,
    size: number,
    alpha: number,
  ): void {
    if (this.reduceMotion) return;
    const accent = this.theme.accent;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < count; i++) {
      const hx = Math.sin(i * 91.7 + depth * 13) * 43758.5453;
      const hy = Math.sin(i * 47.3 + depth * 7) * 24634.6345;
      const rx = hx - Math.floor(hx);
      const ry = hy - Math.floor(hy);
      const span = view.h + 40;
      const rise = this.clock * (14 + rx * 22) * depth;
      const y = ((((ry * span - rise + view.camY * depth * 0.6) % span) + span) % span) - 20;
      const x = rx * view.w + Math.sin(this.clock * (0.6 + ry) + i) * 10 * depth;
      const flick = 0.55 + 0.45 * Math.sin(this.clock * (3 + rx * 4) + i);
      ctx.fillStyle = rgbCss(accent, alpha * flick);
      ctx.fillRect(x, y, size * (0.6 + ry), size * (0.6 + ry));
    }
    ctx.restore();
  }

  /** A living slab's sheet once loaded. */
  private lookSheet(look: SlabLook): HTMLImageElement | null {
    const name = `slab-${look}`;
    let img = this.sprites.get(name);
    if (!img) {
      img = Object.assign(new Image(), { src: `art/sprites/${name}.webp` });
      this.sprites.set(name, img);
    }
    return img.complete && img.naturalWidth > 0 ? img : null;
  }

  /** A sprite sheet once loaded: frames are square, side by side. */
  private sprite(name: string): { img: HTMLImageElement; cell: number; frames: number } | null {
    let img = this.sprites.get(name);
    if (!img) {
      img = Object.assign(new Image(), { src: `art/sprites/${name}.webp` });
      this.sprites.set(name, img);
    }
    if (!img.complete || img.naturalHeight === 0) return null;
    const cell = img.naturalHeight;
    return { img, cell, frames: Math.max(1, Math.round(img.naturalWidth / cell)) };
  }

  /** The ceiling the Descent hangs from: rock above the foundation. */
  private drawCeiling(ctx: CanvasRenderingContext2D): void {
    const y = this.worldToScreen(0, 0).y - VISUAL_H;
    if (y < -80) return;
    const g = ctx.createLinearGradient(0, y - 220, 0, y);
    g.addColorStop(0, "rgb(10,6,8)");
    g.addColorStop(1, "rgb(46,30,24)");
    ctx.fillStyle = g;
    ctx.fillRect(-120, -40, this.vw + 240, y + 40);
    ctx.fillStyle = "rgba(255,170,90,0.35)";
    ctx.fillRect(-120, y - 3, this.vw + 240, 3);
  }

  private render(): void {
    const ctx = this.ctx;
    const zoom = 1 + (this.fitZoom - 1) * this.pull;
    const vw = this.viewW / zoom;
    const vh = this.viewH / zoom;
    this.vw = vw;
    this.vh = vh;
    // At rest the ground sits a fixed distance above the bottom edge. Pulled
    // back for the summit, it rises to mid-view so the card can sit below it.
    const rest = vh - GROUND - (this.phase === "menu" ? MENU_LIFT : 0);
    this.horizonY = rest + (this.summitHorizon() / zoom - rest) * this.pull;

    ctx.setTransform(this.dpr * zoom, 0, 0, this.dpr * zoom, 0, 0);
    ctx.clearRect(0, 0, vw, vh);

    const shakeAmp = this.reduceMotion ? 0.12 : 1;
    const mag = this.trauma * this.trauma * shakeAmp;
    const ox = hashNoise(this.clock * 23) * 11 * mag;
    const oy = hashNoise(this.clock * 19 + 2) * 8 * mag;
    const rot = hashNoise(this.clock * 15 + 5) * 0.012 * mag;

    const view: BackdropView = {
      w: vw,
      h: vh,
      horizon: this.horizonY,
      camX: this.camX + this.look,
      camY: this.camY - this.anchor,
      altitude: clamp01((this.camY - this.anchor) / Math.max(1, this.climb() - this.viewH * LEAD)),
      clock: this.clock,
      pulse: this.pulse,
      flare: this.flare,
      reduceMotion: this.reduceMotion,
    };

    // The sky takes a third of the shake: it is far away.
    ctx.save();
    ctx.translate(ox * 0.3, oy * 0.3);
    this.drawBackdrop(ctx, view, zoom);
    ctx.restore();

    ctx.save();
    ctx.translate(vw / 2 + ox, vh / 2 + oy);
    ctx.rotate(rot);
    ctx.translate(-vw / 2, -vh / 2);
    const aiming = this.phase === "ready" || this.phase === "play" || this.phase === "menu";
    if (this.mover.course === "sway" && aiming && !this.reduceMotion) {
      ctx.translate(vw / 2, vh * 0.72);
      ctx.rotate(Math.sin(this.clock * 1.55) * 0.014);
      ctx.translate(-vw / 2, -vh * 0.72);
    }

    this.fx.down = this.plan.descent ? -1 : 1;
    if (this.plan.descent) this.drawCeiling(ctx);
    else this.drawGround(ctx);
    this.drawGhost(ctx);
    if (!this.escape) this.drawSummitLine(ctx);
    if (this.kit.sight && !this.mover.split) this.drawSight(ctx);
    this.drawPlinth(ctx);
    if (this.phase === "won" || (this.phase === "menu" && this.demoLit)) this.drawBeacon(ctx);
    this.drawAura(ctx);

    const prev = this.peak();
    const inZone = aiming && this.phase !== "menu" && this.cued() && this.lined(prev);

    const burning = this.burning();
    for (let i = 0; i < this.stack.length; i++) {
      const slab = this.stack[i]!;
      this.slabLookNow = this.slabLook(slab, this.stack.length - 1 - i < burning);
      this.drawSlab(ctx, slab, inZone && slab === prev);
    }
    this.slabLookNow = null;
    if (this.stage && aiming && this.phase !== "menu") this.drawPlumb(ctx, prev);
    if (this.phase === "play" && this.ghost) this.drawGhostLine(ctx);
    for (const scrap of this.scraps) this.drawScrap(ctx, scrap);
    const live = aiming && this.phase !== "menu";
    if (this.plan.darkRate > 0 && this.phase !== "menu" && !this.escape) {
      if (this.plan.descent) this.drawClimbers(ctx);
      else this.drawDark(ctx);
    }
    if (this.escape) this.drawEscape(ctx);
    if (this.shields > 0 && prev && this.phase !== "fall") {
      const dome = this.worldToScreen(prev.x + prev.w / 2, prev.y + VISUAL_H / 2);
      drawShieldDome(ctx, dome.x, dome.y, prev.w, this.clock, this.shieldAge);
    }
    if (live && !this.escape) this.drawCourseCues(ctx);
    if (live && this.bomb) this.drawBomb(ctx);
    if (live && !this.escape) {
      this.slabLookNow = this.slabLook(null, burning > 0);
      this.drawMover(ctx, inZone);
      this.slabLookNow = null;
    }
    if (live && this.mote) this.drawMote(ctx);
    this.fx.draw(ctx, this.worldToScreen);
    ctx.restore();

    if (this.paintedSky()) this.drawSkyFront(ctx, view);
    else if (!this.plan.descent) this.backdrop.drawFront(ctx, view);
    this.drawFloaters(ctx);

    // Everything from here is laid over the lens, so it ignores the zoom.
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.fx.drawScreen(ctx);
    this.drawVignette(ctx);
    if (this.slow > 0.01) {
      // A lull cools the whole view, so slowed time is felt, not just read.
      const g = ctx.createRadialGradient(
        this.viewW / 2,
        this.viewH * 0.55,
        this.viewH * 0.12,
        this.viewW / 2,
        this.viewH * 0.55,
        this.viewH * 0.7,
      );
      g.addColorStop(0, rgbCss(LULL_RGB, 0));
      g.addColorStop(1, rgbCss(LULL_RGB, 0.2 * this.slow));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(246,241,232,${this.flash * 0.28})`;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
    }
    if (this.curtain > 0) {
      ctx.fillStyle = `rgba(8,6,5,${this.curtain})`;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
    }
  }

  private drawBackdrop(ctx: CanvasRenderingContext2D, view: BackdropView, zoom: number): void {
    if (this.plan.descent) {
      this.drawShaft(ctx, view);
      return;
    }
    if (this.paintedSky()) {
      this.drawSky(ctx, view);
      return;
    }
    const fading = this.fading;
    if (!fading || this.fade >= 1) {
      this.backdrop.draw(ctx, view);
      return;
    }
    // Cross-fade: the outgoing sky underneath, the incoming one composited on
    // top through an offscreen canvas so its own alpha use stays intact.
    fading.backdrop.draw(ctx, { ...view, camY: this.camY - fading.anchor });
    const main = ctx.canvas;
    if (
      !this.fadeCanvas ||
      this.fadeCanvas.width !== main.width ||
      this.fadeCanvas.height !== main.height
    ) {
      this.fadeCanvas = document.createElement("canvas");
      this.fadeCanvas.width = main.width;
      this.fadeCanvas.height = main.height;
    }
    const off = this.fadeCanvas.getContext("2d");
    if (!off) return;
    off.setTransform(this.dpr * zoom, 0, 0, this.dpr * zoom, 0, 0);
    this.backdrop.draw(off, view);
    ctx.save();
    ctx.globalAlpha = this.fade;
    ctx.drawImage(this.fadeCanvas, 0, 0, view.w, view.h);
    ctx.restore();
  }

  /** Two eyes in the murk, following the top of the tower, blinking slow. */
  private drawEyes(ctx: CanvasRenderingContext2D, surface: number): void {
    const b = this.boss!;
    const top = this.worldToScreen(this.seat.x, 0);
    const y = surface + 46 + Math.sin(b.eye * 0.8) * 4;
    const blink = Math.max(0, Math.min(1, Math.abs(Math.sin(b.eye * 0.45)) * 8 - 6.5));
    const open = 1 - blink;
    ctx.save();
    for (const side of [-1, 1]) {
      const x = top.x + side * (26 + b.surge * 4);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 26);
      glow.addColorStop(0, `rgba(190,120,255,${0.55 * open})`);
      glow.addColorStop(1, "rgba(190,120,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - 26, y - 26, 52, 52);
      ctx.fillStyle = `rgba(240,220,255,${0.95 * open})`;
      ctx.beginPath();
      ctx.ellipse(x, y, 7, 4 * open + 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(14,6,26,0.9)";
      ctx.beginPath();
      ctx.ellipse(x + side * 2, y, 2.4, 3 * open + 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** The Dark: a bank of it, with a lit, restless edge, eating the tower from below. */
  private drawDark(ctx: CanvasRenderingContext2D): void {
    const surface = this.worldToScreen(0, this.darkShown).y;
    if (surface < -120) return;
    const clock = this.reduceMotion ? 0 : this.clock;
    if (this.darkArtReady && this.darkArt) {
      this.drawDarkArt(ctx, surface);
    } else {
      const soft = 70;
      const g = ctx.createLinearGradient(0, surface - soft, 0, surface + 30);
      g.addColorStop(0, "rgba(14,6,26,0)");
      g.addColorStop(0.55, "rgba(14,6,26,0.78)");
      g.addColorStop(1, "rgba(10,4,20,0.96)");
      ctx.fillStyle = g;
      ctx.fillRect(-120, surface - soft, this.vw + 240, this.vh - surface + soft + 160);
    }
    // The edge: a few slow waves of violet light along the surface.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let band = 0; band < 2; band++) {
      ctx.beginPath();
      const amp = 6 + band * 4;
      const lift = band * 9;
      for (let x = -40; x <= this.vw + 40; x += 12) {
        const y =
          surface -
          lift +
          Math.sin(x * 0.021 + clock * (1.1 + band * 0.4)) * amp +
          Math.sin(x * 0.053 - clock * 0.7) * 3;
        if (x === -40) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(150,80,220,${0.35 - band * 0.12})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
    if (this.boss) this.drawEyes(ctx, surface);
    // Motes drifting up off it when it is close to the top.
    if (!this.reduceMotion && this.darkGap() < 4 && Math.random() < 0.3) {
      this.fx.sparkle(
        this.camX + (Math.random() - 0.5) * this.vw * 0.6,
        this.darkShown + 10,
        40,
        [150, 80, 220],
        1,
      );
    }
  }

  private drawGround(ctx: CanvasRenderingContext2D): void {
    const y = this.worldToScreen(0, 0).y;
    if (y > this.vh + 80) return;
    const { top, body, deep } = this.theme.ground;
    const g = ctx.createLinearGradient(0, y, 0, y + 200);
    g.addColorStop(0, body);
    g.addColorStop(1, deep);
    ctx.fillStyle = g;
    ctx.fillRect(-120, y, this.vw + 240, this.vh - y + 160);
    ctx.fillStyle = top;
    ctx.fillRect(-120, y, this.vw + 240, 3);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(-120, y + 3, this.vw + 240, 1);
  }

  private drawGhost(ctx: CanvasRenderingContext2D): void {
    if (this.ghostFloors <= 0 || this.floors > this.ghostFloors) return;
    if (this.phase !== "ready" && this.phase !== "play") return;
    this.drawMarker(
      ctx,
      this.ghostFloors * SLAB_H,
      "BEST",
      "rgba(246,241,232,0.35)",
      "rgba(246,241,232,0.55)",
    );
  }

  /** The line the last slab has to sit on. */
  /** Sight: the perfect window, drawn on the top of the stack. */
  private drawSight(ctx: CanvasRenderingContext2D): void {
    if (this.phase !== "ready" && this.phase !== "play") return;
    const top = this.peak();
    if (!top) return;
    const s = this.worldToScreen(top.x + top.w / 2, top.y + VISUAL_H);
    const half = Math.min(top.w / 2, this.tol);
    const lit = this.lined(top);
    ctx.save();
    ctx.fillStyle = rgbCss(this.theme.accent, lit ? 1 : 0.55);
    ctx.fillRect(s.x - half, s.y - 2, half * 2, 3);
    ctx.fillRect(s.x - half - 1, s.y - 7, 2, 8);
    ctx.fillRect(s.x + half - 1, s.y - 7, 2, 8);
    ctx.restore();
  }

  private drawSummitLine(ctx: CanvasRenderingContext2D): void {
    if (this.plan.goal <= 0 || (this.phase !== "ready" && this.phase !== "play")) return;
    const near = this.plan.goal - this.floors <= 3;
    const beat = near && !this.reduceMotion ? 0.75 + 0.25 * Math.sin(this.clock * 7) : 0.6;
    // On the stage rubble is height without being floors, so the line sits
    // where the count will reach the goal: that many floors above the top.
    const left = Math.max(0, this.plan.goal - this.floors);
    const y = this.stage ? this.seat.y + left * SLAB_H : this.plan.goal * SLAB_H;
    this.drawMarker(
      ctx,
      y,
      this.plan.descent ? "THE DEPTH" : "SUMMIT",
      rgbCss(this.theme.accent, 0.6 * beat),
      rgbCss(this.theme.accent, 0.95 * beat),
    );
  }

  private drawMarker(
    ctx: CanvasRenderingContext2D,
    worldY: number,
    label: string,
    line: string,
    text: string,
  ): void {
    const y = this.worldToScreen(0, worldY).y;
    if (y < -20 || y > this.vh + 20) return;
    ctx.save();
    // Fade out under the HUD rather than run through it.
    ctx.globalAlpha = clamp01((y - 150) / 70);
    ctx.strokeStyle = line;
    ctx.setLineDash([5, 7]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(28, y);
    ctx.lineTo(this.vw - 28, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '600 11px "Nunito Variable", system-ui, -apple-system, sans-serif';
    ctx.fillStyle = text;
    ctx.textAlign = "left";
    ctx.fillText(label, 28, y - 6);
    ctx.restore();
  }

  private drawPlinth(ctx: CanvasRenderingContext2D): void {
    const base = this.stack[0];
    if (!base || base.falling) return;
    const w = this.startW + 36;
    const s = this.worldToScreen(-w / 2, -6);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(s.x + w / 2, s.y + 16, w * 0.55, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    this.paintSlab(ctx, s.x, s.y, w, 16, shade(this.theme.slab[0], -0.45), 1, 0, false);
  }

  /** A column of light off the finished spire. */
  private drawBeacon(ctx: CanvasRenderingContext2D): void {
    const top = this.peak();
    if (!top) return;
    const s = this.worldToScreen(top.x + top.w / 2, top.y + VISUAL_H);
    const flicker = this.reduceMotion ? 1 : 0.8 + 0.2 * Math.sin(this.clock * 5.5);
    const age = this.phase === "menu" ? this.demoAge : this.wonAge;
    const a = Math.min(1, age / 0.45) * flicker;
    const foot = top.w * 0.5;
    const head = top.w * 1.4 + 90;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const beam = ctx.createLinearGradient(0, s.y, 0, -40);
    beam.addColorStop(0, rgbCss(this.theme.accent, 0.5 * a));
    beam.addColorStop(1, rgbCss(this.theme.accent, 0));
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(s.x - foot / 2, s.y);
    ctx.lineTo(s.x - head / 2, -40);
    ctx.lineTo(s.x + head / 2, -40);
    ctx.lineTo(s.x + foot / 2, s.y);
    ctx.closePath();
    ctx.fill();
    const core = ctx.createLinearGradient(0, s.y, 0, -40);
    core.addColorStop(0, `rgba(255,255,255,${0.42 * a})`);
    core.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.moveTo(s.x - foot * 0.1, s.y);
    ctx.lineTo(s.x - head * 0.14, -40);
    ctx.lineTo(s.x + head * 0.14, -40);
    ctx.lineTo(s.x + foot * 0.1, s.y);
    ctx.closePath();
    ctx.fill();
    const bloom = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 90);
    bloom.addColorStop(0, rgbCss(this.theme.accent, 0.55 * a));
    bloom.addColorStop(1, rgbCss(this.theme.accent, 0));
    ctx.fillStyle = bloom;
    ctx.fillRect(s.x - 90, s.y - 90, 180, 180);
    ctx.restore();
  }

  /** Heat behind the top of the stack that builds with the streak. */
  private drawAura(ctx: CanvasRenderingContext2D): void {
    if (this.streak < 2 || this.phase !== "play") return;
    const top = this.peak();
    if (!top) return;
    const s = this.worldToScreen(top.x + top.w / 2, top.y + VISUAL_H / 2);
    const breathe = this.reduceMotion ? 1 : 0.85 + 0.15 * Math.sin(this.clock * 4);
    const reach = Math.min(210, 90 + this.streak * 15);
    const a = Math.min(0.4, 0.07 * this.streak) * breathe;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, reach);
    g.addColorStop(0, rgbCss(this.theme.accent, a));
    g.addColorStop(1, rgbCss(this.theme.accent, 0));
    ctx.fillStyle = g;
    ctx.fillRect(s.x - reach, s.y - reach, reach * 2, reach * 2);
    ctx.restore();
  }

  /**
   * Your best run climbs beside you: a faint line at the height it had
   * reached by now, with its time on it. Ahead of it the line is below the
   * top; behind it, above.
   */
  private drawGhostLine(ctx: CanvasRenderingContext2D): void {
    const h = this.ghostNow();
    if (h === null) return;
    const y = (h + 1) * SLAB_H;
    const p = this.worldToScreen(-this.startW / 2 - 28, y);
    const q = this.worldToScreen(this.startW / 2 + 28, y);
    if (p.y < -20 || p.y > this.vh + 20) return;
    const ahead = this.floors >= h;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = ahead ? "rgba(140,220,255,0.55)" : "rgba(255,180,120,0.75)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '700 11px "Nunito Variable", system-ui, -apple-system, sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = ahead ? "rgba(140,220,255,0.8)" : "rgba(255,180,120,0.95)";
    ctx.fillText(this.ghostName.toUpperCase(), q.x - 34, p.y - 3);
    ctx.restore();
  }

  /**
   * A loose slab shows a dark, broken seam along its underside: it is not
   * set, and the eye should read the hinge before the weight finds it.
   */
  private drawCrack(ctx: CanvasRenderingContext2D, w: number): void {
    const y = SLAB_H / 2 - 1;
    ctx.save();
    ctx.strokeStyle = "rgba(20,10,8,0.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = -w / 2; x < w / 2; x += 9) {
      const dx = Math.min(w / 2, x + 6);
      ctx.moveTo(x, y);
      ctx.lineTo(dx, y - ((x * 7) % 3 === 0 ? 2 : 0));
    }
    ctx.stroke();
    ctx.restore();
  }

  /**
   * A plumb line from the top slab shows the lean: faint while the spire is
   * true, red with the angle once it is tilting enough to matter.
   */
  private drawPlumb(ctx: CanvasRenderingContext2D, top: Slab): void {
    if (top.body === null || top.floor === 0) return;
    const deg = Math.abs((top.rot * 180) / Math.PI);
    const c = this.worldToScreen(top.x + top.w / 2, top.y + SLAB_H / 2);
    const foot = this.worldToScreen(top.x + top.w / 2, 0);
    const tilt = clamp01((deg - 1.5) / 6);
    ctx.save();
    ctx.strokeStyle = tilt > 0 ? `rgba(255,90,60,${0.25 + tilt * 0.6})` : "rgba(255,245,230,0.24)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x, Math.min(foot.y, this.vh + 10));
    ctx.stroke();
    if (deg >= 1.5) {
      ctx.setLineDash([]);
      ctx.font = '700 13px "Nunito Variable", system-ui, -apple-system, sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = `rgba(255,${Math.round(200 - tilt * 120)},${Math.round(170 - tilt * 110)},0.95)`;
      ctx.fillText(`${deg.toFixed(0)}° lean`, c.x + top.w / 2 + 10, c.y);
    }
    ctx.restore();
  }

  private drawSlab(ctx: CanvasRenderingContext2D, slab: Slab, hotGroove: boolean): void {
    if (slab.body !== null && slab.floor > 0) {
      // Bodies are a full floor tall; the stone is painted from the bottom
      // up, leaving the usual seam above it.
      const c = this.worldToScreen(slab.x + slab.w / 2, slab.y + SLAB_H / 2);
      if (c.y < -80 || c.y > this.vh + 120) return;
      // Rubble is drawn dusty and drained of the sky's colour: what still
      // holds its colour is what counts.
      const stone = slab.counts ? slab.rgb : mix(slab.rgb, RUBBLE_RGB, 0.72);
      const body = slab.flash > 0 ? mix(stone, [255, 255, 255], slab.flash * 0.82) : stone;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(-slab.rot);
      this.paintSlab(ctx, -slab.w / 2, SLAB_H / 2, slab.w, VISUAL_H, body, 1, 0, hotGroove);
      if (slab.loose) this.drawCrack(ctx, slab.w);
      ctx.restore();
      return;
    }
    const s = this.worldToScreen(slab.x, slab.y);
    if (s.y < -80 || s.y - VISUAL_H > this.vh + 120) return;
    const settled = slab.anim >= 1 || this.reduceMotion;
    const scaleY = settled ? 1 : 0.74 + 0.26 * easeOutBack(Math.min(1, slab.anim));
    const body = slab.flash > 0 ? mix(slab.rgb, [255, 255, 255], slab.flash * 0.82) : slab.rgb;
    if (slab.pieces && !slab.falling) {
      for (const piece of slab.pieces) {
        const px = s.x + (piece.x - slab.x);
        this.paintSlab(ctx, px, s.y, piece.w, VISUAL_H, body, scaleY, 0, false);
      }
      return;
    }
    if (slab.grow && !this.reduceMotion) {
      // Mid-reinforcement: narrower than its final width, ends glowing.
      const t = 1 - (1 - slab.grow.t) ** 3;
      const w = slab.grow.from + (slab.w - slab.grow.from) * t;
      const x = s.x + (slab.w - w) / 2;
      this.paintSlab(ctx, x, s.y, w, VISUAL_H, body, scaleY, slab.rot, hotGroove);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const glow = ctx.createLinearGradient(x, 0, x + w, 0);
      const a = 0.9 * (1 - slab.grow.t);
      glow.addColorStop(0, `rgba(255,236,200,${a})`);
      glow.addColorStop(0.08, "rgba(255,236,200,0)");
      glow.addColorStop(0.92, "rgba(255,236,200,0)");
      glow.addColorStop(1, `rgba(255,236,200,${a})`);
      ctx.fillStyle = glow;
      ctx.fillRect(x, s.y - VISUAL_H, w, VISUAL_H);
      ctx.restore();
      return;
    }
    this.paintSlab(ctx, s.x, s.y, slab.w, VISUAL_H, body, scaleY, slab.rot, hotGroove);
    if (slab.key && !slab.falling) {
      ctx.fillStyle = "rgba(246,241,232,0.9)";
      ctx.fillRect(s.x + 8, s.y - VISUAL_H + 6, Math.max(8, slab.w - 16), 3);
    }
  }

  private drawMover(ctx: CanvasRenderingContext2D, inZone: boolean): void {
    const m = this.mover;
    const accent = this.theme.accent;
    const phase = beatPhase(this.clock, m.period);
    const kicking = m.course === "beat" && phase < 0.2;
    const base = this.slabColor(this.floors + 1);
    let rgb = m.keystone ? mix(base, BONE, 0.45) : base;
    if (kicking) rgb = mix(rgb, [255, 255, 255], 0.55);
    const hidden = m.course === "eclipse" && !inZone;
    const holding = m.course === "breath" && Math.abs(m.u) > 0.78;
    const squash = holding && !this.reduceMotion ? 0.84 : 1;
    const locked = !!this.bomb && this.bomb.fuse > 0;
    ctx.save();
    ctx.globalAlpha = hidden ? 0.22 : 1;
    const falling = m.fallT >= 0;
    const share = falling ? fallShare(m.fallT, m.fallTime) : 0;
    // Wind tips a falling slab over, then it rights itself as it lands.
    const tilt =
      falling && !this.reduceMotion
        ? m.wind * m.drift * 0.0022 * Math.sin(Math.sqrt(share) * Math.PI)
        : 0;
    if (falling && !this.reduceMotion) {
      for (let i = 3; i >= 1; i--) {
        const s = this.worldToScreen(m.x - m.wind * m.drift * 0.03 * i, m.y + i * 9);
        ctx.globalAlpha = 0.07 * (4 - i);
        this.paintSlab(ctx, s.x, s.y, m.w, VISUAL_H, rgb, 1, tilt, false);
      }
      ctx.globalAlpha = 1;
    } else if (!this.reduceMotion && !hidden) {
      const withWind = m.course === "gust" && m.dir === m.wind;
      const trail = m.course === "rush" || withWind || m.slowed ? 5 : 3;
      for (let i = trail; i >= 1; i--) {
        const ox = -m.dir * Math.min(m.course === "rush" ? 22 : 14, m.pxSpeed * 0.02) * i;
        const s = this.worldToScreen(m.x + ox, m.y);
        ctx.globalAlpha = 0.045 * i;
        this.paintSlab(ctx, s.x, s.y, m.w, VISUAL_H, rgb, 1, 0, false);
      }
      ctx.globalAlpha = 1;
    }
    const s = this.worldToScreen(m.x, m.y);
    if (m.hover > 0 && !falling) {
      const seat = this.worldToScreen(this.landingX(), m.y - m.hover);
      if ((m.guide || this.kit.mark) && m.drift > 0) {
        drawLandingGhost(
          ctx,
          seat.x,
          seat.y,
          m.w,
          VISUAL_H,
          accent,
          this.reduceMotion ? 0 : this.clock,
        );
      }
      drawStreamer(
        ctx,
        s.x + m.w / 2,
        s.y,
        seat.y - 6,
        m.wind * m.drift,
        this.clock,
        accent,
        this.reduceMotion,
      );
    }
    if (m.split) {
      // Two halves, each with the ghost of its own home on the stack.
      const prev = this.peak();
      const hw = m.w / 2;
      if (prev) {
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = "#f6f1e8";
        ctx.setLineDash([4, 4]);
        for (const homeX of [prev.x + prev.w / 4 - hw / 2, prev.x + (3 * prev.w) / 4 - hw / 2]) {
          const h = this.worldToScreen(homeX, m.y);
          ctx.strokeRect(h.x, h.y - VISUAL_H, hw, VISUAL_H);
        }
        ctx.restore();
      }
      const s2 = this.worldToScreen(m.x2, m.y);
      const [offL, offR] = prev ? this.splitOffsets(prev) : [99, 99];
      for (const [sx, off] of [
        [s.x, offL],
        [s2.x, offR],
      ] as const) {
        const home = Math.abs(off) <= this.tol;
        if (home && !this.reduceMotion) {
          ctx.save();
          ctx.shadowColor = rgbCss(accent, 0.8);
          ctx.shadowBlur = 14;
          this.paintSlab(ctx, sx, s.y, hw, VISUAL_H, mix(rgb, [255, 255, 255], 0.35), 1, 0, true);
          ctx.restore();
        } else {
          this.paintSlab(ctx, sx, s.y, hw, VISUAL_H, rgb, 1, 0, false);
        }
      }
      ctx.restore();
      return;
    }
    if (m.course === "sway") {
      const home = this.worldToScreen(m.center - m.w / 2, m.y);
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = "#f6f1e8";
      ctx.strokeRect(home.x, home.y - VISUAL_H, m.w, VISUAL_H);
      ctx.restore();
    }
    if (inZone && !this.reduceMotion) {
      ctx.save();
      ctx.shadowColor = m.course === "eclipse" ? "rgba(246,241,232,0.95)" : rgbCss(accent, 0.8);
      ctx.shadowBlur = m.course === "eclipse" ? 26 : 16;
      this.paintSlab(
        ctx,
        s.x,
        s.y,
        m.w,
        VISUAL_H,
        mix(rgb, [255, 255, 255], 0.35),
        squash,
        0,
        true,
      );
      ctx.restore();
    } else {
      this.paintSlab(ctx, s.x, s.y, m.w, VISUAL_H, rgb, squash, tilt, false);
    }
    if (m.keystone) {
      ctx.fillStyle = "#f6f1e8";
      ctx.fillRect(s.x + 8, s.y - VISUAL_H + 6, Math.max(8, m.w - 16), 3);
    }
    if (this.charged && !falling) {
      // A charged Chisel: the slab carries a white edge until the perfect lands.
      const glow = this.reduceMotion ? 0.8 : 0.65 + 0.35 * Math.sin(this.clock * 9);
      ctx.strokeStyle = `rgba(255,255,255,${glow})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(s.x - 3, s.y - VISUAL_H - 3, m.w + 6, VISUAL_H + 6);
    }
    if (locked) {
      // A lit bomb locks the slab: dim it and bar it, so a tap reads as a risk.
      ctx.fillStyle = "rgba(12,8,6,0.5)";
      ctx.fillRect(s.x, s.y - VISUAL_H, m.w, VISUAL_H);
      ctx.strokeStyle = rgbCss(BOMB_RGB, 0.9);
      ctx.lineWidth = 2;
      ctx.strokeRect(s.x + 1, s.y - VISUAL_H + 1, m.w - 2, VISUAL_H - 2);
    }
    if (m.slowed) drawSlowBadge(ctx, s.x + m.w / 2, s.y - VISUAL_H - 16, this.clock);
    if (m.course === "beat") {
      const fill = phase < 0.58 ? phase / 0.58 : 0;
      const bar = this.worldToScreen(m.x + m.w / 2, m.y + VISUAL_H + 14);
      ctx.fillStyle = "rgba(246,241,232,0.28)";
      ctx.fillRect(bar.x - 22, bar.y, 44, 3);
      ctx.fillStyle = kicking ? "#f6f1e8" : rgbCss(accent);
      ctx.fillRect(bar.x - 22, bar.y, 44 * fill, 3);
    }
    if (m.course === "eclipse" && inZone) {
      ctx.strokeStyle = "rgba(246,241,232,0.75)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(s.x - 7, s.y - VISUAL_H - 6, m.w + 14, VISUAL_H + 12);
    }
    ctx.restore();
  }

  /** What each course does, drawn in the slab's lane before the slab itself. */
  private drawCourseCues(ctx: CanvasRenderingContext2D): void {
    const m = this.mover;
    const accent = this.theme.accent;
    const lane = this.worldToScreen(m.center + this.sway(), m.y);
    // A wide slab travels past the edges of a phone; keep the cues on screen.
    const left = Math.max(30, lane.x - m.halfSpan - m.w / 2);
    const right = Math.min(this.vw - 30, lane.x + m.halfSpan + m.w / 2);
    const clock = this.reduceMotion ? 0.3 : this.clock;
    if (m.course === "gust" && this.floors - this.windTurnedAt < 2) {
      // Shown just after a shift: the streamer carries the reading after that.
      drawWindLane(ctx, left, right, lane.y + m.hover * 0.6, m.wind, clock, accent);
    } else if (m.course === "breath") {
      const held = Math.abs(m.u) > 0.78 ? Math.sign(m.u) : 0;
      drawWalls(ctx, left, right, lane.y, VISUAL_H, held, clock, accent);
    } else if (m.course === "rush") {
      drawRushLane(ctx, lane.x, m.halfSpan * 0.62, lane.y, VISUAL_H, m.dir, clock, accent);
    }
  }

  private drawBomb(ctx: CanvasRenderingContext2D): void {
    const bomb = this.bomb;
    const top = this.peak();
    if (!bomb || !top) return;
    const s = this.worldToScreen(bomb.x, bomb.y);
    drawBomb(ctx, {
      x: s.x,
      y: s.y,
      floorY: this.worldToScreen(0, top.y + VISUAL_H).y,
      w: top.w,
      fuse: bomb.fuse / bomb.max,
      seconds: bomb.fuse,
      flash: bomb.flash,
      clock: this.clock,
      calm: this.reduceMotion,
    });
  }

  private drawMote(ctx: CanvasRenderingContext2D): void {
    const mote = this.mote;
    const top = this.peak();
    if (!mote || !top) return;
    const s = this.worldToScreen(mote.x, mote.y);
    drawPickup(ctx, {
      kind: mote.kind,
      x: s.x,
      y: s.y,
      floorY: this.worldToScreen(0, top.y + VISUAL_H).y,
      w: this.mover.w,
      stackX: this.worldToScreen(top.x, 0).x,
      stackW: top.w,
      armed: this.moteArmed,
      clock: this.clock,
      calm: this.reduceMotion,
    });
  }

  private drawScrap(ctx: CanvasRenderingContext2D, scrap: Scrap): void {
    const s = this.worldToScreen(scrap.x, scrap.y);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, scrap.life));
    this.paintSlab(ctx, s.x, s.y, scrap.w, VISUAL_H, scrap.rgb, 1, scrap.rot, false);
    ctx.restore();
  }

  private paintSlab(
    ctx: CanvasRenderingContext2D,
    sx: number,
    syBottom: number,
    w: number,
    h: number,
    rgb: RGB,
    scaleY: number,
    rot: number,
    hotGroove: boolean,
  ): void {
    if (w < 0.5 || h < 0.5) return;
    const sy = Number.isFinite(scaleY) ? Math.max(0.2, scaleY) : 1;
    const art = (this.slabArt ??= Object.assign(new Image(), { src: "art/slab-hearth.png" }));
    ctx.save();
    ctx.translate(sx + w / 2, syBottom);
    if (rot) ctx.rotate(rot);
    ctx.scale(1 / sy, sy);
    const look = this.slabLookNow ? this.lookSheet(this.slabLookNow) : null;
    if (look) {
      const meta = SLAB_LOOKS[this.slabLookNow!];
      const frame =
        Math.floor((this.reduceMotion ? 0 : this.clock) * SLAB_LOOK_FPS) % SLAB_LOOK_FRAMES;
      this.drawSlabArt(ctx, look, w, h, rgb, hotGroove, {
        sx: (frame * look.naturalWidth) / SLAB_LOOK_FRAMES,
        sw: look.naturalWidth / SLAB_LOOK_FRAMES,
        ...meta,
      });
      ctx.restore();
      return;
    }
    if (art.complete && art.naturalWidth > 0) {
      this.drawSlabArt(ctx, art, w, h, rgb, hotGroove);
      ctx.restore();
      return;
    }
    ctx.fillStyle = rgbCss(rgb);
    ctx.fillRect(-w / 2, -h, w, h);
    ctx.fillStyle = rgbCss(shade(rgb, 0.24));
    ctx.fillRect(-w / 2, -h, w, Math.min(5, h * 0.28));
    ctx.fillStyle = rgbCss(shade(rgb, -0.32));
    ctx.fillRect(-w / 2, -3.5, w, 3.5);
    ctx.fillStyle = rgbCss(shade(rgb, -0.5), 0.85);
    ctx.fillRect(-w / 2, -h, 3, h);
    ctx.fillStyle = rgbCss(shade(rgb, 0.18), 0.45);
    ctx.fillRect(w / 2 - 2, -h, 2, h);
    ctx.fillStyle = hotGroove ? rgbCss(this.theme.accent) : "rgba(18,12,8,0.55)";
    const grooveW = hotGroove ? 3 : 2;
    ctx.fillRect(-grooveW / 2, -h + 5, grooveW, h - 9);
    ctx.restore();
  }

  /**
   * The painted slab, centred on the origin with its bottom at y = 0: end caps
   * and the centre mark kept true, the runs between them stretched. The sky's
   * colour is laid softly over it, so a white flash or a drained rubble still reads.
   */
  private drawSlabArt(
    ctx: CanvasRenderingContext2D,
    art: HTMLImageElement,
    w: number,
    h: number,
    rgb: RGB,
    hotGroove: boolean,
    /**
     * Where the slab sits in the source: a frame of a sheet (sx, sw), and the
     * slab's own box inside it, as shares (flames above, icicles below spill out).
     */
    src: { sx: number; sw: number; l: number; r: number; top: number; bot: number } = {
      sx: 0,
      sw: art.naturalWidth,
      l: 0,
      r: 1,
      top: 0,
      bot: 1,
    },
  ): void {
    const ah = art.naturalHeight;
    // The slab's own box in the source, and the rows above and below it.
    const aw = src.sw * (src.r - src.l);
    const ax = src.sx + src.sw * src.l;
    const slabH = ah * (src.bot - src.top);
    // The painting is a little taller than the slab: its rough top edge stands proud.
    const dh = h * 1.12;
    const k = dh / slabH;
    const cap = SLAB_CAP * aw;
    const mid = SLAB_MID * aw;
    const capW = cap * k;
    const midW = mid * k;
    // Drawn whole height, so what spills above and below the slab comes too.
    const top = -dh - ah * src.top * k;
    const fullH = ah * k;
    const left = -w / 2;
    if (w < capW * 2 + midW + 4) {
      ctx.drawImage(art, ax, 0, aw, ah, left, top, w, fullH);
    } else {
      const run = (w - capW * 2 - midW) / 2;
      const srcRun = (aw - cap * 2 - mid) / 2;
      let sx = ax;
      let dx = left;
      for (const [sw, dw] of [
        [cap, capW],
        [srcRun, run],
        [mid, midW],
        [srcRun, run],
        [cap, capW],
      ] as const) {
        // A hair of overlap so no seam opens between the pieces.
        ctx.drawImage(art, sx, 0, sw, ah, dx - 0.3, top, dw + 0.6, fullH);
        sx += sw;
        dx += dw;
      }
    }
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = rgbCss(rgb, 0.65);
    ctx.fillRect(left + 1, -dh + dh * 0.12, w - 2, dh * 0.84);
    ctx.restore();
    if (hotGroove) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = rgbCss(this.theme.accent, 0.85);
      ctx.fillRect(-1.5, -dh + dh * 0.15, 3, dh * 0.75);
      ctx.restore();
    }
  }

  private drawVignette(ctx: CanvasRenderingContext2D): void {
    if (!this.vignette) {
      const g = ctx.createRadialGradient(
        this.viewW / 2,
        this.viewH * 0.45,
        this.viewH * 0.2,
        this.viewW / 2,
        this.viewH * 0.5,
        this.viewH * 0.78,
      );
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.42)");
      this.vignette = g;
    }
    ctx.fillStyle = this.vignette;
    ctx.fillRect(0, 0, this.viewW, this.viewH);
    // As the slab narrows the edges close in, pulsing faster the less is left.
    if (this.strain > 0.45) {
      const beat = this.reduceMotion
        ? 0.7
        : 0.55 + 0.45 * Math.sin(this.clock * (5 + this.strain * 5));
      const a = ((this.strain - 0.45) / 0.55) * 0.5 * beat;
      const side = Math.min(130, this.viewW * 0.28);
      const cap = Math.min(170, this.viewH * 0.2);
      const bands: [number, number, number, number, number, number][] = [
        [0, 0, side, 0, side, this.viewH],
        [this.viewW, 0, this.viewW - side, 0, side, this.viewH],
        [0, 0, 0, cap, this.viewW, cap],
        [0, this.viewH, 0, this.viewH - cap, this.viewW, cap],
      ];
      for (const [x0, y0, x1, y1, w, h] of bands) {
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, `rgba(255,40,24,${a})`);
        g.addColorStop(1, "rgba(255,40,24,0)");
        ctx.fillStyle = g;
        ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), w, h);
      }
    }
  }

  private drawFloaters(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const accent = rgbCss(this.theme.accent);
    for (const f of this.floaters) {
      const s = this.worldToScreen(f.x, f.y);
      const age = f.max - f.life;
      const pop = this.reduceMotion ? 1 : 1 + 0.45 * Math.max(0, 1 - age / 0.14);
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life / (f.max * 0.6)));
      ctx.font = `800 ${Math.round(f.size * pop)}px "Nunito Variable", system-ui, -apple-system, sans-serif`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(10,8,6,0.55)";
      ctx.strokeText(f.text, s.x, s.y);
      ctx.fillStyle = f.coin ? GOLD : f.hot ? "#f6f1e8" : accent;
      ctx.fillText(f.text, s.x, s.y);
      if (f.coin) {
        const r = f.size * 0.36 * pop;
        const cx = s.x - ctx.measureText(f.text).width / 2 - r - 4;
        ctx.beginPath();
        ctx.arc(cx, s.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(120,80,0,0.7)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, s.y, r * 0.55, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
