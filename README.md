# Spire

One-thumb stacking game with real weight. Tap to drop the slab onto the stack. Land it inside the groove for a perfect and it seats dead centre; land it off and it sits where it fell, and the spire starts to lean. Lean far enough and it topples, but a topple is not the end: the rubble sets where it lands and you build on from there, while the Dark climbs from below. The only way to the summit is a column that stands.

- **Eight levels**, each with its own sky, its own rhythm for the moving slab, and a summit to reach.
- **A clock and an accuracy score** on every run, with your best of each kept per level.
- **Three stars per level**: reach the summit, hit the accuracy target, beat the par time.
- **Endless mode**: the original climb, where the sky changes every five floors.
- **Music that follows the Dark**: calm with a clear gap, faster and harder as it closes.

Runs in a browser and as a native iOS app from the same code.

## The Dark

Once a run is live, the Dark climbs the tower from below, faster on later skies. Perfects, keystones and the forge push it back down; clean drops push a little. If it reaches the top slab, it takes the tower. The gap is shown in the HUD, and the music and the screen's edges tighten as it closes. Rates and pushes are `darkRate` per level and `DARK_PUSH` in `src/game/logic.ts`.

## Weight

Slabs are rigid bodies (Box2D via `planck`, in `src/game/physics.ts`). A slab keeps its whole width; where it lands is where it sits. **A perfect sets, a miss stays loose**: a slab seated in the groove is welded to the one beneath it, so a true column is solid however tall, while an off-centre slab is a loose hinge and everything built on it can tip as a unit. A breath of air (`sway`, stronger each sky) swings sides every few seconds, never enough to move a true column, enough to finish off a lean. A plumb line hangs from the top slab, faint while the spire is true and red with the angle once it tilts. A topple plays in slow motion. Only a slab lying level enough to build on (`LEVEL_TILT`) is a floor; a slab that settles crooked, or on the ground, crumbles. A slab counts as a floor only if it landed close to the groove and still stands level on something anchored to the base (a chain of landed slabs down to the foundation); anything else is rubble, real and buildable but not height, drawn dusty and drained of the sky's colour so what still holds its colour is what counts. The slab enters from well off-centre, so tapping the moment it appears drops it past the edge. A topple costs height and time rather than the run, and the summit counts once the floor count has held at the goal for a moment.

## Heat, weapons and upgrades

Heat is the one meter. A perfect adds a lot, a clean landing a little, a fast drop (within 0.9 s of the last) a little more, and a miss costs some. When it fills, the forge fires and so does the weapon you carry. Heat also multiplies the coins each drop pays.

You carry one weapon, chosen on the title screen; it is your class:

| Weapon     | Class   | At full Heat                                                           |
| ---------- | ------- | ---------------------------------------------------------------------- |
| Buttress   | Mason   | Every loose slab in the spire is set                                   |
| Chisel     | Striker | Charges: the next perfect pays triple, and no bomb can land until then |
| Slipstream | Runner  | Time slows and the wind drops for the next three slabs                 |

From the second sky on, every eight floors or so an ember hangs over the stack. Land with the groove under its line to claim it and the run pauses with three upgrades, one from each class. Miss it and it's gone. Three picks from one class unlock its capstone for the run. Upgrades reset every run; they are the build, not the progression. All of it is data in `src/game/build.ts`.

## Coins, houses and the forge

Every slab that lands pays coins on the spot, multiplied by Heat, and a summit pays a purse. There is no shop to visit: coins are spent where they are earned.

- **The forge, on the summit card.** After lighting a sky you're offered the next rank of each class track and the next level of the weapon you carry. Ranks are quality of life (a starting brace, the Dark thrown back once, the perfect window drawn on the stack, shorter fuses, more coin), never power; power is what the run's picks are for. Ranks and levels open as skies are lit.
- **Houses.** The class you have built most is your house, and anything bought within it costs a quarter less. Focusing pays; spreading across houses costs full price and buys cover against more skies. The weapon you carry (tap it on the title to change) breaks ties and has a creed.
- **The rebuild, on the fall card.** See below.

At the end of a run the game reads how you climbed and names it: a Runner didn't wait, a Striker landed it, a Mason held on.

## Split slabs

On the last stretch of Apex, and late in endless, the slab splits into two halves on two clocks: the left half slides at one speed, the right at another, each over its own side of the stack. One tap drops both halves as two bodies. Both home is a perfect and they seat side by side; anything else lands where it was and leans the spire.

## The journey, feats, and the summit card

Eight beacons, one per sky in that sky's colour, stand on the title screen, the Skies screen and the summit card; lit ones burn, and the sky just lit ignites on the summit card. Feats (`src/game/feats.ts`) are earned once and announced there as medals that slide in: first light, half the sky, every sky, three stars on a sky, every star, a true column of perfects, beating your own ghost or a rival's, and a top-ten board placing. Earned medals line up under the title's beacons. The summit card is paced rather than piled: the ignition, then the stars with their captions, then the numbers and the purse, then ghost and board lines, then any medals; the forge folds into one row that expands on tap.

## Ghosts and the leaderboard

Each sky keeps the trace of your best run: the second every floor was first reached. On a replay that ghost climbs beside you as a dashed line, the HUD says how many floors ahead or behind you are, and beating it pays 25 coins. Summits are posted to a leaderboard (Supabase, `src/game/board.ts`) under a name chosen once on the summit card; each device keeps only its best per sky, written through a server function that only ever improves that device's own row. The board shows the fastest 25 on each sky, and **Compete** on any entry makes that person's ghosts the ones you race on every sky they hold, until you go back to your own best. Devices are identified by a random id; the board shows a one-way hash of it.

## Pickups and hazards

Each keeps the same colour and shape in every sky.

|                  | What to do                                 | What it does                                                                            |
| ---------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| **Brace** (blue) | Drop with the slab's groove under its line | Your next loose drop sets where it lands. A bubble sits over the stack until it is used |
| **Lull** (green) | Drop with the slab's groove under its line | The next slab moves slowly                                                              |
| **Bomb** (red)   | Wait for the fuse to burn out              | Tap early and the blast shoves the top of the spire sideways and ends your streak       |

Pickups hang just outside the perfect window, so taking one costs a sliver of slab. The first three times each appears, a one-line tip explains it.

## Run it

Needs Node 22 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:8080.

| Command             | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Dev server with hot reload                         |
| `npm run build`     | Typecheck, then build the static site into `dist/` |
| `npm test`          | Unit tests for the rules, levels and save data     |
| `npm run lint`      | ESLint                                             |
| `npm run typecheck` | TypeScript only                                    |

## Controls

|                 | Touch                                  | Keyboard       |
| --------------- | -------------------------------------- | -------------- |
| Drop the slab   | Tap anywhere                           | Space or Enter |
| Pause           | Pause button                           | Esc or P       |
| Restart         | Pause, then Restart                    | R              |
| Mute everything | Toggles on the title and pause screens | M              |

## iOS

The iOS app is a [Capacitor](https://capacitorjs.com) shell around the web build. The Xcode project lives in `ios/` and is committed. Needs Xcode; no CocoaPods (plugins come in through Swift Package Manager).

```bash
npm run ios:sync    # build the web app and copy it into the Xcode project
npm run ios:open    # open the project in Xcode
npm run ios:run     # build and launch on a simulator or connected device
npm run ios:assets  # regenerate the icon and launch image from tools/ios-assets.mjs
```

Run `npm run ios:sync` after every change to the web code before building in Xcode.

Settings that matter for the App Store, and where they live:

| Setting         | Value                           | Where                                             |
| --------------- | ------------------------------- | ------------------------------------------------- |
| Bundle ID       | `com.nickprince.spire`          | `capacitor.config.ts` and the App target in Xcode |
| Team            | `XUKTV95C24`                    | App target, Signing & Capabilities                |
| Version / build | `1.0.0` / `1`                   | App target, General                               |
| Orientation     | Portrait on iPhone, any on iPad | `ios/App/App/Info.plist`                          |

To ship a build: open the project in Xcode, select **Any iOS Device**, choose **Product → Archive**, then **Distribute App** to send it to TestFlight. The bundle ID must be registered to the team first; Xcode's automatic signing offers to do that the first time.

## How it is put together

```
src/
  main.tsx                 entry point
  styles.css               all styling
  components/              React: menus, HUD, results
  game/
    logic.ts               the rules, as pure functions
    levels.ts              the eight levels and the endless plan
    themes.ts              each sky: colours, scenery, weather, music key
    engine.ts              simulation, camera and drawing
    backdrop.ts            parallax scenery
    gear.ts                coins: what pays, what the workshop sells, what it does
    props.ts               pickups, the bomb, and the cues that explain each course
    fx.ts                  particles, rings, fireworks, confetti
    music.ts               generative score driven by tension
    sfx.ts, audio.ts       one-shot sounds and the shared audio graph
    save.ts                progress in localStorage
    haptics.ts             Taptic feedback on iOS, vibration elsewhere
```

The game draws to one canvas. React only renders the interface on top and never re-renders per frame; the run clock is written straight to the DOM.

### Tuning

- **Levels**: `src/game/levels.ts`. Length, speed, which hazards appear, and the two star targets are plain numbers per level.
- **Par times** are a flawless bot's time on each sky plus a quarter. Adjust `parTime` if they feel wrong in the hand.
- **Skies**: `src/game/themes.ts`. A theme is data; adding one does not need new drawing code unless it needs a new kind of scenery.
- **Music**: `src/game/music.ts`. Tension comes from `tensionFor()` in `logic.ts`, which maps the slab's remaining width to 0..1.

### Saved data

Progress is stored in `localStorage` under `spire-v2`. A `spire-v1` save from the prototype is read once and its best score carried into endless mode.
