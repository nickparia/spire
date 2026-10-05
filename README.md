# Spire

One-thumb stacking game. Tap to drop the slab onto the stack. Land it inside the groove for a perfect; five perfects in a row forge the slab wider. Miss by a little and the overhang is cut off. Miss by a lot and the spire falls.

- **Eight levels**, each with its own sky, its own rhythm for the moving slab, and a summit to reach.
- **A clock and an accuracy score** on every run, with your best of each kept per level.
- **Three stars per level**: reach the summit, hit the accuracy target, beat the par time.
- **Endless mode**: the original climb, where the sky changes every five floors.
- **Music that follows the slab**: calm at full width, faster and harder as it narrows.

Runs in a browser and as a native iOS app from the same code.

## Holding a slab

A slab keeps its full width for a short grace, long enough for its first pass, then wastes away at about 7% a second, never below half. A clean drop inside the grace grows it 3% instead, up to its starting width. Waiting is a choice with a price.

## Heat, weapons and upgrades

Heat is the one meter. A perfect adds a lot, a clean landing a little, a fast drop (within 0.9 s of the last) a little more, and a miss costs some. When it fills, the forge fires and so does the weapon you carry. Heat also multiplies the coins each drop pays.

You carry one weapon, chosen on the title screen; it is your class:

| Weapon | Class | At full Heat |
| --- | --- | --- |
| Buttress | Mason | The slab is rebuilt to full width |
| Chisel | Striker | Charges: the next perfect pays triple, and no bomb can land until then |
| Slipstream | Runner | Time slows and the wind drops for the next three slabs |

From the second sky on, every eight floors or so an ember hangs over the stack. Land with the groove under its line to claim it and the run pauses with three upgrades, one from each class. Miss it and it's gone. Three picks from one class unlock its capstone for the run. Upgrades reset every run; they are the build, not the progression. All of it is data in `src/game/build.ts`.

## Coins and the workshop

Every slab that lands pays coins on the spot: more for a perfect, more again for a streak, a forge or a keystone, and all of it multiplied by Heat. Reaching a summit pays a purse on top. A fall keeps whatever the run had already paid.

Coins go two places:

- **Class tracks.** Mason, Striker and Runner each have five ranks, bought in order and always on. Ranks are quality of life, never power: a starting shield, a forgiven fall, the perfect window drawn on the stack, shorter fuses, more coin. How the slab moves and how Heat builds belong to the run's picks alone. Ranks open up as skies are lit (rank one from the start, then after one, two, four and six skies).
- **Weapon levels.** Each weapon climbs five levels, gated the same way. Levels two and four make Heat build faster; three and five add a perk. The weapon you carry is chosen in the workshop; it is your class, and each has a creed.

At the end of a run the game reads how you climbed and names it: a Runner didn't wait, a Striker landed it, a Mason held on.

Prices, ranks and perks are data in `src/game/gear.ts`.

## Falling slabs and wind

On Gale Ridge (the fifth sky), in Apex's wind stretch and in every gust of endless, the slab hangs three floors above the stack and falls when you tap. Wind carries it sideways on the way down, so you release upwind. A streamer under the slab is blown the same way and its tip shows where the slab will land. The first three windy floors of Gale Ridge also outline the landing spot; after that you read the streamer. Wind holds its direction for three floors, and gets stronger as the level goes on.

## Pickups and hazards

Each keeps the same colour and shape in every sky.

| | What to do | What it does |
| --- | --- | --- |
| **Shield** (blue) | Drop with the slab's groove under its line | Saves one miss. A bubble sits over the stack until it is used |
| **Lull** (green) | Drop with the slab's groove under its line | The next slab moves slowly |
| **Bomb** (red) | Wait for the fuse to burn out | Tap early and it blows a fifth off the top slab and ends your streak |

Pickups hang just outside the perfect window, so taking one costs a sliver of slab. The first three times each appears, a one-line tip explains it.

## Run it

Needs Node 22 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:8080.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck, then build the static site into `dist/` |
| `npm test` | Unit tests for the rules, levels and save data |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript only |

## Controls

| | Touch | Keyboard |
| --- | --- | --- |
| Drop the slab | Tap anywhere | Space or Enter |
| Pause | Pause button | Esc or P |
| Restart | Pause, then Restart | R |
| Mute everything | Toggles on the title and pause screens | M |

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

| Setting | Value | Where |
| --- | --- | --- |
| Bundle ID | `com.nickprince.spire` | `capacitor.config.ts` and the App target in Xcode |
| Team | `XUKTV95C24` | App target, Signing & Capabilities |
| Version / build | `1.0.0` / `1` | App target, General |
| Orientation | Portrait on iPhone, any on iPad | `ios/App/App/Info.plist` |

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
- **Par times** were set by running a bot through every level: three quarters of the way from a flawless first-pass run to one that always waits for the second pass. Adjust `parTime` if they feel wrong in the hand.
- **Skies**: `src/game/themes.ts`. A theme is data; adding one does not need new drawing code unless it needs a new kind of scenery.
- **Music**: `src/game/music.ts`. Tension comes from `tensionFor()` in `logic.ts`, which maps the slab's remaining width to 0..1.

### Saved data

Progress is stored in `localStorage` under `spire-v2`. A `spire-v1` save from the prototype is read once and its best score carried into endless mode.
