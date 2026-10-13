# Handover: the Vigil, a real ghost, a sky that matters

> **Status (13 Oct 2026, build 114):** package 1 is built and shipped, with package 4's checks in `post_vigil` from the start and the first-summit finish (Watch stone). Order agreed by Nick's review: Vigil → ghost tower (2) → share (5) → animation, then passer effects (3, cloud struck, rain deferred) → package 4 back-ported to `post_ghost`. Changes from the spec, found by the bots: a 100-floor welded column crumbles on its own past ~45 floors (a chain of weld joints flexes under the sway course's walk trial until a slab passes the crooked tilt), so the Vigil sets every slab static at each landing (`Stage.petrify`, Vigil only); the swell event is left out of its deck; sway 0.12 and Dark 38 instead of 24; the pace floor measured at 0.65 s/floor. Decisions taken: unlimited attempts, best of the day; UTC; opens once the Foundry is lit. The BACKLOG entry for 114 has the detail.

Written 13 Oct 2026 against `professionalise` at `8766003` (build 113). Read `HANDOFF.md` first; everything there still applies (bots are the verification, `release.mjs` is never run on Nick's behalf, test rows are deleted afterwards).

This is one brief with five work packages. They are ordered so each one ships as its own TestFlight build. Numbers marked **(proposed)** are starting values chosen by the spec author, not decisions Nick has made. Tune them with the bots and tell him what you changed.

## What Nick asked for

1. A daily challenge, about 100 floors tall, the same for everyone.
2. The things you pass in the sky (birds and the rest) should be animated and should affect play. Today they do neither.
3. The features that already exist in thin form should become the professional version. His example: the ghost is a dotted line.
4. Scores people can trust, a fall card that makes you want another go, and a way to send a run to a friend.

Out of scope: live two-player duels, a third world, anything in the parked Descent or Ring code.

## What exists today (verified in the code)

| Thing         | Where                                                                                  | State                                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ghost         | `Ghost = number[]` in `logic.ts`; `mark()`, `keepGhost()`, `ghostNow()` in `engine.ts` | Only the second each floor was reached. Drawn as a dashed line. No positions, so no tower can be drawn from it.                                            |
| Leaderboard   | `board.ts`, Supabase project `eufnyvqsniakpdckkuga`, table `ghosts`, RPC `post_ghost`  | One row per `(player_id, level_id)`, kept only if `time` is lower. Summits only. The RPC checks `0 < time < 3600` and `trace` length ≥ 2 and nothing else. |
| Passers-by    | `passers.ts`, `stepPassers`, `drawPassers`                                             | One static PNG per kind (`public/art/passers/*.png`), drifted, bobbed and rolled. The file header says "No effect on play".                                |
| Events        | `events.ts`, `stepEvents`, `startEvent`, `drawEvents`                                  | Two per climb, with real mechanics (ash, tremor, drag, frost and so on). Their art is also static PNGs. Scheduled with `Math.random`.                      |
| Landings      | `landing.ts` `isLanding`                                                               | Halfway on skies under 30 floors, at thirds on longer ones. Offers dealt with `Math.random`.                                                               |
| Fall card     | `OverPanel` in `panels.tsx`                                                            | Floors out of goal, accuracy, time, Try again.                                                                                                             |
| Sharing       | none                                                                                   | No share sheet, no `@capacitor/share`, no inbound links.                                                                                                   |
| Endless       | `ENDLESS_PLAN`, `startEndless()`                                                       | Hidden from the UI, still in the engine.                                                                                                                   |
| Sprite sheets | `sprite(name)` in `engine.ts`, `tools/sprites.mjs`                                     | Working pipeline (the claw is 24 frames). Passers and events do not use it.                                                                                |

Two facts that shape the design:

- The engine reads `LEVELS[this.levelIndex]` in 14 places and branches on `this.mode === "level"` in 16. A daily sky is not in `LEVELS`, so those sites need one accessor (see package 1).
- Gameplay randomness comes from `Math.random` passed into `pickEvents`, `landingOffer` and `offer`. Those three already take a `rand` argument, so seeding them is a small change. The physics (planck) is driven by frame timing and is not reproducible across devices. The daily therefore gives everyone the same sky, the same event floors and the same card deals. It does not give identical physics, and the server cannot replay a run.

## Package 1: the Vigil

The backlog already calls the daily "the Vigil". One sky a day, 100 floors, the same for every player.

### Rules

- **Day** is the UTC date. Seed string `vigil-YYYY-MM-DD`, hashed to a 32-bit integer, fed to a small seeded generator (mulberry32 or similar) in a new `src/game/rand.ts`.
- **Goal** is 100 floors. `ghosts.floors` allows up to 200 and `trace` up to 201 entries, so the existing limits fit.
- **Attempts** are unlimited and the best run of the day counts **(proposed; see open decisions)**. The board shows how many attempts the best run took.
- **Ranking**: a summit beats any non-summit. Among summits, lower time wins. Among non-summits, more floors wins, then lower time.
- **Opens** once the Foundry is lit **(proposed)**, so nobody meets it before the tutorial sky.
- Practice and tester runs are unranked, as now (`unranked`).

### Building the sky

Add `src/game/vigil.ts` exporting `vigilLevel(day: string): LevelDef` and `vigilPlan(day): Plan`. Everything is drawn from the seeded generator:

- **Theme**: one of the eight Hearth themes. The whole climb keeps it, so the painted sky and stone work unchanged.
- **Courses**: five to seven drawn without immediate repeats from `COURSE_CYCLE`, split evenly after `WARMUP_FLOORS`, as `levelCourseAt` already does. `split` may only appear in the last third.
- **Period**: `[0.9, 0.6]` first to last floor **(proposed)**. Apex runs `[0.77, 0.58]` over 44 floors, so this starts gentler and ends in the same place.
- **Hazards**: keystones, motes and bombs all on.
- **Wind**: set `wind` only when a `gust` course was drawn.
- **Landings**: thirds is too sparse for 100 floors. Add an optional `landingEvery` to `Plan` and have `isLanding` honour it. Vigil uses every 20 floors, so four landings **(proposed)**.
- **Events**: `pickEvents(rand, "hearth", "apex", 100, 6)`. The `apex` theme already takes every Hearth event. Six events **(proposed)**.
- **Passers**: generated from the seed, one roughly every 8 floors, kinds limited to those with art.
- **Dark**: start from `darkRate` 24 **(proposed)**. `QUICKEN_*` and `DARK_REACH` apply as on any sky.

Pass the same seeded generator to `landingOffer` and `offer` while in the Vigil, so every player is dealt the same cards at the same landing. Reset the generator at the start of each attempt so attempt two sees the same sky as attempt one.

### Engine changes

- Add `"vigil"` to `RunMode`, `startVigil(day)`, and a private `level(): LevelDef` accessor that returns the Vigil's definition in that mode and `LEVELS[this.levelIndex]` otherwise. Replace the 14 direct reads with it.
- Go through the 16 `mode === "level"` checks one by one. Passers, events, ghosts and landings should run in the Vigil. Stars, feats that count skies, `save.levels[id]`, world progress and the boss path should not.
- `isBoss` must be false for the Vigil.
- Unit-test `vigilLevel`: the same day gives a deep-equal definition, two different days differ, events never sit within 3 floors of a landing.

### Difficulty target

Existing skies are 20 to 44 floors. Nobody has played 100. Before Nick sees it, run `tools/bots/pace.mjs` (extend it to start the Vigil) across at least ten different days and tune the period, `darkRate` and landing spacing until **(proposed targets)**:

- the "decent" bot (1.2 s between taps, aim 1) is usually taken between floors 55 and 75;
- the "ideal" bot summits on most days;
- no day is unwinnable for the ideal bot and no day lets the decent bot summit routinely.

Report the spread per day. If some themes or course orders are outliers, constrain the generator; do not hand-tune individual days. Per the freeze fix in build 100, include one sound-on run.

### Backend

New table and RPC, written as a migration. Do not reuse `ghosts`: its conflict key and "faster wins" rule are wrong for runs that mostly end short of the summit.

```sql
create table public.vigil (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  player_id uuid not null,
  public_id uuid generated always as (handle_of(player_id)) stored,
  name text not null check (char_length(name) between 1 and 16),
  floors int not null check (floors between 1 and 100),
  summit boolean not null,
  time real not null check (time > 0 and time < 3600),
  accuracy real not null check (accuracy between 0 and 1),
  attempts int not null default 1,
  trace real[] not null,
  shape real[],            -- see package 2
  created_at timestamptz not null default now(),
  unique (day, player_id)
);
```

- RLS on. Public read of every column except `player_id` (match how `ghosts` hides it today; check the existing policy and column grants and copy the approach).
- `post_vigil(p_player, p_day, p_name, p_floors, p_summit, p_time, p_accuracy, p_trace, p_shape)`, security definer, returns boolean. It always increments `attempts`. It replaces the stored run only when the new one ranks higher by the ranking rule above.
- The server decides what day it is. Accept `p_day` only if it equals the current UTC date, or yesterday's date while the UTC time is before 00:30 **(proposed grace, for a run started before midnight)**.
- Index `(day, summit desc, floors desc, time asc)`.

Client additions in `board.ts`: `postVigil`, `fetchVigilBoard(day, limit = 25)`, `vigilRank(day, run)`.

### Save

Add to `Save` (and `parseSave`, `emptySave`, the tests):

```ts
vigil: {
  day: string; // the day these fields describe
  floors: number;
  summit: boolean;
  time: number;
  attempts: number;
  ghost: Ghost; // best attempt today, raced on the next attempt
  history: {
    day: string;
    floors: number;
    summit: boolean;
    rank: number | null;
  }
  []; // last 30
}
```

When the stored `day` is not today, roll the current fields into `history` and clear them.

### Screens

- **Title and world select**: a Vigil card. Before a run it shows the date, the sky's theme and "100 floors". After a run it shows your best today, your rank, and the time until the next sky. One primary button.
- **Ready card**: the sky's name for the day is the theme name plus the date. Do not write new story lines per day.
- **Fall card and summit card**: floors out of 100, time, rank today, and the share button from package 5.
- **Board**: reuse `BoardScreen` with a day's rows. Show rank, name, floors or summit time, attempts.
- House style: `STORY.md` voice, no explanatory copy beyond one line. Nick's standing rule: propose the wording, he approves it.

## Package 2: the ghost becomes a tower

### Record more

A trace of times cannot draw a tower. Record, per floor, where the slab sat and whether it was a perfect.

- Add `GhostShape = number[]` beside `Ghost`: for each floor, the slab's centre offset from the foundation's centre in px, rounded to one decimal, with the sign bit of a second parallel array or a `+ 10000` offset marking a perfect. Keep `Ghost` (times) exactly as it is so every stored ghost and every row in `ghosts` still works.
- Record in the same place `mark()` is called. Store with the ghost in `save.ghosts` (add `save.shapes: Record<string, GhostShape>`), and post it.
- `alter table public.ghosts add column shape real[]`, nullable, with the same length check as `trace`. Extend `post_ghost` with `p_shape real[] default null` so old clients keep working. Add `shape` to the selects in `fetchBoard` and `fetchPlayer`.

### Draw it

Replace the dashed line with a second spire:

- Stands to one side of the player's tower (the side with more room at the current camera), behind the stack, at a fixed parallax depth so it reads as further away.
- Built from the recorded offsets up to `ghostHeight(trace, runTime)`. The floor in progress is drawn as a slab sliding in, so the ghost is visibly dropping slabs in time with its run.
- Translucent, in the sky's colour drained toward white for your own best, and in the rival's worn finish (`finishes.ts`) for a rival. Perfects carry the groove glow.
- Its name floats at its top: "BEST" or the rival's name, as the HUD already says.
- When there is no `shape` (old ghosts), draw a straight translucent column of the right height. Never fall back to the dashed line.
- When the player passes it or is passed, one short cue: a flare on the ghost's top slab and the existing `sfx.best()`.
- Respect `reduceMotion`. Cull slabs off screen. Check the frame rate on the iOS simulator at floor 100 with a ghost present.

Bot: a screenshot run with a known ghost in the save, at three heights, tiled with `side.mjs`.

## Package 3: a sky that is alive and matters

Nick's complaint covers both passers-by and event art: neither moves, and passers do nothing.

His own rule for this (backlog, Oct 10 night): an element is irritating when it is invisible, random and a pure penalty; it is fun when you can see it coming, read its pattern and use it. Half of what the sky does should help a good player.

### Animate

- Move animated kinds to sprite sheets drawn through `sprite(name)`, built with `tools/sprites.mjs` from short clips, the way the claw was. Birds flap, the kite flutters, scraps tumble. Frame is chosen from the passer's age, so each one is offset from the next.
- Painted light kinds (cloud, rain, sun, moon) stay as images but get motion from code: a cloud is two layers drifting at different speeds, the sun and moon breathe in brightness, rain already scrolls.
- Do the same for event art that shows a moving thing: the crane swings on its cable, the event kite flutters, the lanterns bob and flicker individually.
- **All animation is made with Higgsfield**, driven by you through the `higgsfield` CLI as in earlier builds (see `ART.md` and the 108, 109 and 113 entries in `BACKLOG.md`). Do not hand-draw frames or animate procedurally where a clip would do.
- Start each clip from the existing painting so the look holds: image-to-video from `public/art/passers/<kind>.png` or `public/art/events/<art>.png` (build 113 used `kling3_0_turbo` this way for the card ignites). Ask for a loop whose first and last frames match.
- Backgrounds follow the build 108 finding: dark subjects (birds, kite, scraps, crane) on flat magenta, keyed with ffmpeg `colorkey`; light subjects on pure black, drawn with `screen`. Then `tools/sprites.mjs` cuts the sheet.
- Keep sheets small: around 24 frames, cells no wider than the kind's drawn width at depth 1. Check memory and frame rate on the iOS simulator with three passers on screen.

### Make them matter

Each passer gets an optional effect, and every effect reuses a mechanic the engine already has. This is a proposal for Nick to approve before any engine work, per `HANDOFF.md`.

| Passer | What the player sees                                    | Effect                                                                                                                                         | Mechanic reused                                           |
| ------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Birds  | The flock crosses the lane at the hanging slab's height | A perfect dropped while they are in the lane scatters them upward and counts as a "flock-true": an extra Dark push. A miss just scatters them. | `DARK_PUSH.perfect`, as wind-true does                    |
| Cloud  | You climb into it and out again                         | The perfect-moment cue is hidden for the 3 floors inside it                                                                                    | `ashFloors`                                               |
| Sun    | It breaks through beside the tower                      | The cue stays lit for the next 3 slabs                                                                                                         | `mover.guide` / `gift.sight`                              |
| Moon   | It rises behind the tower                               | The Dark lies still for 5 seconds                                                                                                              | `breather`                                                |
| Rain   | A sheet falls across the tower                          | Loose slabs slide more easily for 4 floors; perfects are unaffected                                                                            | new: a friction scale on fixtures created in `physics.ts` |
| Scraps | Cloth blows across before the wind turns                | No rule change: they blow the way the wind will blow next floor                                                                                | information only                                          |
| Kite   | Unchanged as a passer                                   | The drag event already covers it                                                                                                               | none                                                      |

Three helps, two hindrances, one tell. Build birds, cloud and sun first; they need no new physics.

Rules that keep it fair:

- A passer with an effect is announced the way events are: it is on screen at least one full slab before it bites.
- Never within 3 floors of a landing or of a scheduled event (reuse `CLEAR` from `events.ts`). Generate the Vigil's passers with this constraint; for the hand-placed Hearth and Gale lists, add a test that fails when a placement breaks it.
- Passers with effects must be drawn so they read as near the lane, not as backdrop. Purely decorative ones keep their depth.
- `SPOKEN` whitelist: add "FLOCK-TRUE" only if Nick wants words; the default is the visual burst and the chime.
- `passers.ts`: delete "No effect on play" from the header and document the effect field.

Bot: extend `tools/bots/passers.mjs` to force each kind and assert the effect state (`ashFloors`, `breather`, guide, the Dark's position before and after a flock-true).

## Package 4: scores people can trust

The server cannot replay a physics run, so the aim is to reject impossible runs, not to prove honest ones. Say that plainly in the PR; do not describe it as anti-cheat.

Apply the same checks in `post_ghost` and `post_vigil`:

- `trace[1] = 0` (Postgres arrays are 1-based), non-decreasing throughout.
- `array_length(trace) = floors + 1` for a summit.
- `time` equals the last trace entry within 0.05 s.
- Minimum pace: `time >= floors * m`, where `m` is 70% of the ideal bot's seconds per floor on the fastest sky **(measure it; do not guess)**.
- Per-level floor count: `floors` must equal that level's goal for a `ghosts` row. Keep a small `level_goals(level_id, floors)` table, filled from `LEVELS` by a script, so the database does not trust the client's number.
- `shape`, when present, has the same length as `trace` and every offset is within a sane bound.

Also add `reported boolean default false` to both tables and a one-tap "Report" on a board row that calls a `report_row` RPC. It hides nothing by itself; it gives Nick a list to review. Public names are user-generated content, and App Store review looks for a way to flag them.

## Package 5: the fall card and the share

### One more go

`OverPanel` gains one line under the score, chosen in this order, first that applies:

1. Vigil, and one or two more floors would have beaten your best today: "Two floors short of your best today."
2. Vigil, rank known: "Three more floors and you pass {name}." Needs the row ranked just above; fetch it with the board.
3. Any sky, within 5 floors of the summit: "Four floors from the summit."
4. A ghost was in play: "Your ghost was three floors ahead." (`hud.ghostGap` already exists.)
5. Otherwise nothing. Do not invent encouragement.

Add `Hud.near: string` computed in the engine at `die()`. Copy is Nick's to approve.

### Share

- Add `@capacitor/share`; fall back to `navigator.share`, then to copying text.
- Share button on the summit card, the Vigil fall card and the Vigil title card.
- Text only in the first build: "Spire · the Vigil, 13 Oct · 74/100 floors · 2:31 · #12" plus `https://nickparia.github.io/spire/`.
- Web inbound link: `?rival=<publicId>` shows the existing Compete prompt for that player on load, using `fetchPlayer`. On iOS this needs universal links and an associated-domains file; leave that for after the store listing exists.
- A shared image (the tower's silhouette from the canvas) is a follow-up, not part of this build.

## Order and builds

1. Package 2 (ghost tower). Self-contained, visible at once, and the Vigil's ghost depends on it.
2. Package 1 (the Vigil) with package 4's checks in `post_vigil` from the start.
3. Package 5.
4. Package 3 animation, then effects once Nick has approved the table.
5. Package 4's checks back-ported to `post_ghost`.

Each is a `tools/bump.mjs` build with a `RELEASE_NOTES.md` entry and a `BACKLOG.md` update. Run `npx tsc --noEmit && npx eslint . && npm test` before each commit.

## Decisions for Nick

- **Attempts.** Unlimited with best-of-day is the default here because it drives retries. One attempt a day makes each run matter more and each day shorter. A middle path is unlimited play with only the first attempt ranked on a second board.
- **When the day turns.** UTC is simple and fair across countries; it means the sky changes at 01:00 or 02:00 in Amsterdam.
- **The passer effects table.** Approve, change or strike rows before engine work starts.
- **Vigil rewards.** Nothing is specified. A finish or trail for a first summit would fit `finishes.ts`; a streak counter that punishes a missed day is deliberately left out.

## How the game will make money (agreed 13 Oct, not part of this build)

Nothing in these five packages implements purchases or ads. The direction is recorded here so the work does not cut against it:

- Free to download, no forced ads.
- One purchase unlocks everything beyond Hearth.
- The Vigil is free for everyone. Do not gate it behind world progress beyond the Foundry or behind a purchase.
- Possibly later: opt-in rewarded ads that grant a rebuild after a fall, reusing the hidden `rescue` offer. If that is built, a rescued run is never ranked: keep it off the Vigil board and the sky boards. Do not remove the `rescue` code in a dead-systems tidy without asking Nick.

## Not verified

- No build was run and nothing was played. Every tuning number above is a starting point.
- The `ghosts` RLS policies and column grants were not read, only the table shape and the `post_ghost` body.
- The 14 and 16 call-site counts are from `grep` on `engine.ts` at `8766003`.
