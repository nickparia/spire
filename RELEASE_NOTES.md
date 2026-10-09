# Release notes

Written for testers; paste the newest entry into TestFlight's "What to Test". The
in-app "What's new" window shows the shorter notes in `public/version.json`.

## Build 78 — The chain (internal)

- **The roots hang on real chains now.** Each slab hangs on two short chains hooked onto the slab above where you caught it, so it stays level and its weight sits where you put it: an off-centre catch shifts the whole column's balance, the column leans and swings as one articulated thing, and slabs knock against the rock (which costs you). It's physics all the way down.
- **The drill is the stake.** It sits in the opening at the top; every true catch its weight drags it a step deeper into the rock, the broken lip rising over it; every miss the Dark hauls it back. At the limit it tears through the floor and drops with the chain.
- **The Dark fights physically.** From Depth 3 its **claws burst from the walls** and shove the chain; from Depth 4 it **strikes the rock** and the mount whips. (Painted claws for now; the Higgsfield arms come next.)
- Pay-out per catch rebalanced for the chain's pitch (off-centre catches earn more; the limit is 14 + depth slabs' worth).
- Checked on an iPhone simulator.

## Build 77 — The battle (internal)

- **The Dark has a face.** It's painted now (a mass of violet eyes, tendrils reaching down the shaft) and it never quite lets go of the machine. When it holds stones its tendrils wrap over them; when you drag it off, it clings — strands stretch and part as the line is pulled back. Miss, and its eyes flare.
- **Weight.** A true catch jolts the tower down with sparks off the winch; misses and the Dark's surges shake rubble off the shaft walls; embers drift off the machine; dust and the odd stone fall past all the time.
- **A floor to break.** A seam of the depth's rock seals the shaft below the tower and nears as the wire strains, cracking and glowing from beneath. At 100% the wire parts and the roots go through it: rock and light burst up, thunder, and the tower falls through the hole to the next depth.
- Checked on an iPhone simulator.

## Build 76 — The tug of war (internal)

- **The Descent, rebuilt around one fight.** The Spire's roots hang from the machine on a wire, down into the Dark, which grips the tower from above and hauls on it.
  - A stone slides below the tip; **tap to fix it to the tip**.
  - **A true catch drags the tower down a step**, out of the Dark. **A miss lets the Dark suck it back up**, and it coats the stones it holds. An off-centre stone hangs over, leans the tower and widens its swing; a stone caught against the swing throws it.
  - Swing wide enough to strike the shaft walls and the bottom stone breaks off. The Dark also pulls gently all the time, so you can't wait it out.
  - **The wire is the gauge:** it reddens and frays as you win. At 100% it **snaps** and the roots fall through to the next depth. Let the Dark haul the whole tower up, and the light is buried.
  - All eight depths play it; the deeper ones are tighter (narrower shafts, longer swings, a harder pull), the Ossuary's Dark heaves in surges, and the Quiet's machine sways on its mount. The way back up (the boss) is unchanged.
- The drill, the crew and the pendulum chain are gone.
- Checked on an iPhone simulator.

## Build 75 — The pendulum (rough test, internal)

- **The Descent's first three depths are back on Hearth's engine**, with one dial changed: **the stone swings on a chain** from a pivot above, fastest through the bottom of its arc, hanging and rising at the ends. Tap to let it go; it drops onto the tower with Hearth's physics (landings, gifts, fire on a streak, the Dark below).
  - **Depth 1 · The Roots:** the plain pendulum.
  - **Depth 2 · The Ossuary:** the winch pays out and reels in: the swing's pace keeps changing.
  - **Depth 3 · The Drowned Halls:** the chain heats as it swings (it glows); hold too long and the stone is let go for you.
- Rough on purpose: no new art, built up not down, and Hearth's Dark for now. It's to judge whether the pendulum has Hearth's feel. Depths 4–8 are still the old drill.
- **Fixed:** the big perfect burst showed a faint square edge.

## Build 74 — The expedition (Depth 1 playable, internal)

- **A crew goes down with the machine.** Hooded miners stand on ledges either side and one hangs on a chain from the machine, their lanterns (painted with Higgsfield, like them) sweeping the rock below.
- **Only what's lit can be struck.** Seams sit dark in the rock until a lamp's beam crosses them: you fire when the head's swing and a lit seam meet. Two rhythms, like Hearth's slab over the stack.
- **Things hunt the crew.** Pale, many-legged creatures (Higgsfield) crawl out of the dark toward a miner. When one lunges it's caught in the miner's lamp for a moment: strike it and the miner lives (and the ooze is pushed back); miss the moment and the miner, and their light, are gone. Fewer miners, fewer lights, harder seams.
- **The drill kicks.** Each shot knocks the head's aim; a run of quick shots is harder to control.
- The ooze, the veins and everything else as before. Depth 1 is a little forgiving to learn on.
- Checked on an iPhone simulator.

## Build 73 — Every tap fires (internal)

- **Fixed:** after each shot the drill ignored taps for about 0.7 s while the bolt and lurch played, so quick taps did nothing. Now the way opens at once and every tap fires; the machine still visibly lurches down.

## Build 72 — The world kit: the Descent (internal)

- **The Descent, rebuilt.** You've stolen the light; now the machine takes it down into the earth.
  - **One fixed shaft.** The colossal machine stands on the surface at the start; its armoured body comes down the shaft to the drill head, always in view. The painted depth scrolls past as you go.
  - **The head is the weapon.** It swings (each depth with its own rhythm, like Hearth's skies) and a tap fires a bolt of the stolen light.
  - **Seams** (rock split with molten light) burst open and the machine **lurches deeper**; **veins** of crystallised light recharge you and **drive the ooze back**. Hit dead centre for more.
  - **The ooze** re-formed above you and fills the shaft, coming down. **Every miss cracks the walls**: it seeps in and gathers momentum; it churns faster and its edge burns hotter. Veins calm it. Let it reach the head and the light is buried.
  - Deeper depths: smaller targets, faster swings, hard rock that takes two blows.
- Under the hood this is the **world kit**: one engine for "something moves, targets wait, a tap commits, a chaser closes in", so later worlds (the Wheel's cogs) are a definition and an art pass.
- Checked on an iPhone simulator.

## Build 71 — Closer, calmer (prototype, internal)

- **Bigger.** The Descent's world is drawn 1.6× closer, so the machine, the head and the oil fill the screen; the camera keeps the head centred.
- **Calmer.** A slower pendulum, slower and heavier bores and softer shakes, nearer Hearth's rhythm. A depth now takes about 20 seconds of steady play.
- **No text on the targets.** Seams and ore speak for themselves; the lock-on ring and the ghosted tunnel show what a tap will do.
- **The oil sits in the tunnel** as thick black liquid, fixed to the rock and creeping down it, with a wet sheen along the walls and a swollen front, rather than a moving picture seen through a hole.
- Checked on an iPhone simulator.

## Build 70 — The machine (prototype, internal)

- **The machine.** A colossal clawed engine of brass, bone and violet eyes squats on the surface over the hole. Its ribbed brass spine runs down the tunnel behind the drill, and at every turn it drives jointed mechanical tendrils into the walls. Only the drill head swings. The head is bigger.
- **The oil, painted.** The Dark fills the tunnel with the animated Higgsfield oil, thicker the more leaks you've let in; when it's still above the view, it drips in from the top edge.
- **Clear targets.** Each says what it does: _SEAM ▾ deeper_ (a molten crack that a blow bursts open) and _ORE ✦ light, oil back_. When your aim is in a target's groove, a ring locks onto it and the tunnel you'd cut is ghosted in.
- Checked on an iPhone simulator.

## Build 69 — The drill head (prototype, internal)

- **The drill is painted** (Higgsfield): a steampunk cosmic horror of brass and blackened iron, its spiral crown of fang-teeth spinning, bone claws gripping its collar, violet eyes glowing in its portholes. It spins faster as it bores. It pivots at the end of the tunnel to aim, so while you aim sideways it swings out across the rock.
- **A longer head start** before the oil reaches you, so the first careless taps don't end it at once.
- The rest is still placeholder art while we judge the feel.

## Build 68 — The drill (prototype, internal)

- **A new way to play the Descent** (Depth 1 for now; the other depths use the same, untuned). Simple placeholder visuals: this is to judge the feel before the Higgsfield art.
  - **The drill head swings** back and forth like a pendulum, its aim a beam of light.
  - **Targets each have a groove**: a seam below (a glowing fissure) takes you deeper; veins of gold ore to either side feed your light and drive the oil back up the tunnel. The aim brightens when it's in a target's groove; dead centre is a perfect.
  - **Tap fires the drill** along its aim, and it bores straight to what it was pointing at. Your tunnel is the path you've cut.
  - **The oil follows down your tunnel.** Fire at nothing and the drill breaks into oil-soaked rock: **a leak opens** and more of the Dark pours in, and more Dark runs faster. The wilder the shot, the bigger the leak. Leaks stay open.
  - Reach the bottom and you've **broken through**; let the oil reach the drill and **the light is buried**.
- Checked on an iPhone simulator.

## Build 67 — The bore (internal)

- **A real hole.** Solid rock fills the screen and the Spire sits in the shaft it has bored, its walls ragged and organic. Each blow lands in a crater under the tip and drives cracks out into the stone; a perfect makes the rock jump and the light at the bottom flare.
- **The Spire is a drill down here**: bronze-bound boring segments with cutting teeth, not Hearth's stone.
- **The Dark follows as oil.** Black, glossy, violet-sheened oil pours into the hole behind you, clinging to the walls and running down them in drips, burying the drill as it comes. The soil around it dies as it passes: drained of colour and blackened.
- Checked on an iPhone simulator with real taps.

## Build 66 — Breaking through (internal)

- **The Descent, rebuilt.** You drive the Spire down through solid rock so Hearth's light can follow you to the roots. It's the same tap and groove as Hearth:
  - **Every slab is a blow** on the rock face below the tip: stone chips and dust.
  - **A perfect bursts through**: rock flies, and the light pouring down the shaft behind you grows stronger.
  - **The shaft caves in behind you**: a wall of rubble comes down the hole you've dug, closing over the light. Build steadily to stay ahead; if it reaches you, _the light is buried_.
  - **The rock gets harder** the deeper you go (each depth has its own: roots, bone, wet slate, crystal, magma, carved stone…). On hard rock a sloppy blow shakes more earth loose behind you; strike it true.
- **The creatures are gone.**
- **Depths, not skies.** "Depth 1 · The Roots", "Depth 3 of 8", "Next depth", and finishing one says **Broken through**. The way back up (the boss) is unchanged.
- Checked on an iPhone simulator with real taps.

## Build 65 — Chapter II (internal)

- **Chapter II · What Was Buried.** Relight the Descent and the story goes on: the builders followed the Spire's roots down, found a door no one had built, and painted what it showed them — many worlds, each with a dark thing above it, all turning around one black centre. Then they stopped. Four pages, each over its own living painting (lanterns down the stairs, the door breathing violet, the mural of the worlds, a hall of builders lying in rows). Read it again any time from **Story**. Checked on an iPhone simulator with real taps.

## Build 64 — The title answers at once (internal)

- **Fixed (again): tapping the title did nothing until its button appeared.** Build 62 started the game's painted videos behind the title, which got in the way of the first taps on iPhone. They now start only when a sky does, and the title goes in the moment your finger touches it. Checked with real taps on an iPhone 17 Pro Max simulator, at 1 and 2.5 seconds, before the button shows. From now on every build is checked on the simulator before it ships.

## Build 63 — Split, unstuck (internal)

- **Fixed: the split slab couldn't be dropped.** The first time a new rule appears, a ghost slab shows the move once and your taps wait for it; for the split slab it never lined up, so it waited forever. It now lines the split up properly, and no demo ever holds your taps for more than a few seconds.

## Build 62 — The Dark, moving and clean (internal)

- **The Dark keeps moving.** On iPhone its video stopped after a while (iOS pauses videos it thinks are hidden, and ours were) and it froze on a still. Every painted video is now a real full-size element behind the game, so iOS keeps it playing; and if it stops the Dark's anyway, the Dark carries on from a painted sprite sheet of the same loop rather than freezing.
- **No more violet line.** The Dark's edge is its own painted surface, with a low haze of smoke off it so you can still read it up close. The Descent's climbers lose their line too.
- **Cleaner splashes.** Things falling into the Dark throw up black ink droplets, scaled to their size; no violet ring, no flat stains. Motes rising off a near Dark are embers.

## Build 61 — Painted, always (internal)

- **Fixed: the Dark showed only its line, with nothing underneath.** When the phone won't play a painted video (Low Power Mode does this), iOS draws nothing for it at all. Now each painted video falls back to a painted still of itself: the Dark, the skies, the Hearth source and the Descent's blind thing. If Low Power Mode is on, you'll see them still rather than moving.

## Build 60 — No more bands (internal)

- **Fixed: the band at the top of the summit** on iPhone (Tidewater especially). The pillar of light's frames carried a faint haze to their edges, which lit a hard-edged rectangle over the sky as they flickered. Each frame now fades to black at its edges. Checked on an iPhone 17 Pro Max simulator.
- The shadow at the tower's foot is a soft pool under the tower, not a line across the screen.

## Build 59 — Tap the title any time (internal)

- **Fixed:** tapping the title did nothing until its "Tap to begin" button appeared. The painting behind no longer takes taps, and the title goes in as your finger lifts.

## Build 58 — Sound, for real (internal)

- **Fixed: no new sound on iPhone.** The app serves its own files in a way the loader read as "failed", so the new sound effects never loaded and the music fell back to the old synth. Both work now: the composed tracks and every effect from build 57 (checked on an iPhone 17 Pro Max simulator: all 22 effects load).
- **Fixed: the Hearth boss's opening scene** (the sky tearing and the source descending) never played on iPhone, for the same reason.

## Build 57 — The way back up (internal)

- **The Descent's boss.** Reach the Floor of the World and the sealed door bursts open: something blind and enormous, all mouths and reaching arms, comes up out of it. Now you build _up_, fast, back up the shaft, with it rising behind you. It never falls far behind; every perfect vaults you clear of it (further on a streak). Reach the top and you're **out of the deep**. Testers: the Descent's last sky has a Boss button that goes straight to it.
- **Real sound effects** (made with Higgsfield): stone thuds and cracks, a singing-bowl chime for perfects that climbs with your streak, a magical swoosh for the cards, wet crunches for squashed climbers, thunder for Starfall, ice for Rime, grinding stone for Bedrock, a door bursting, a summit swell, and more. The old synth blips only play if a sound can't load.
- **Falling has weight.** A slab or cut-off piece that falls into the Dark splashes black ink with a gloop; one that comes to rest on the ground crumbles in dust; in the Descent, cut-off pieces tumble away down the shaft.
- **Fixed: the music.** Build 56 fell back to the old synth on iPhone; your composed tracks play again, from memory, at full quality. Testers: Options › Tester tools shows what the music is doing.
- **Subtler side scenery.** The ruins and rocks in front are smaller, keep to the bottom corners and slip away sooner as you climb.
- Skies are numbered within their world (the Floor of the World is sky 8, not 16).

## Build 56 — The Descent, all eight depths (internal)

- **The Descent is a full world.** Eight depths down the shaft, each a living painting with its own stone and its own climbers:
  - **The Roots**: colossal roots grip the walls, faint daylight far above. The starved builders climb.
  - **The Ossuary**: walls of skull niches and guttering candles; the groove walks. Mites join them.
  - **The Drowned Halls**: waterfalls pour down carved stairways; the beat.
  - **Crystal Veins**: violet crystals throw shafts of light; the rush. The first **brutes**: their stone backs take a blow before they break.
  - **The Furnace Below**: rivers of molten rock; breathe at the walls.
  - **The Quiet**: grey walls of faded murals; the split.
  - **The Hollow**: no light at all. You only see the **lantern-bearers** by the violet glow in their chests.
  - **The Floor of the World**: a sealed door below leaking violet light; every depth's rule in turn.
- The Descent's boss (the climb back up) and its chapter come next.
- **Fixed: the music warped** on iPhone (like a slowing record). Pieces now play from memory instead of streaming.
- **Fixed: the summit's black band.** iPhones drew the pillar of light's black frame solid over the sky; it's now drawn the way the phone blends properly. The Dark no longer shows when the camera pulls back.
- **Fixed:** the summit card and skies list counted every world's skies together.

## Build 55 — A clean summit (internal)

- **Fixed: the summit's background.** When the camera pulled back to show your tower, a flat band of old ground rose across the painted sky, the pillar of light laid a grey box over everything, and the ruins slid back in front. Now it is one painted scene: the pillar rises over the sky, the ruins step aside.
- **No more fireworks.** They looked cheap; the pillar of light is the moment.
- **Why the slabs go red.** Four perfects in a row set the top slab alight, and the fire spreads down with each perfect after. Now, when the streak breaks, the fire goes out where you can see it: the slabs hiss and give off steam and smoke.

## Build 54 — Carved in stone (internal)

- **Every sky has its own stone.** The Foundry's ember stone; Tidewater's wet sea-stone with barnacles and weed; Pulse City's brass-bound slabs with a clockwork gear; Red Canyon's layered sandstone; Gale Ridge's wind-scoured granite with a red prayer cloth; the Glacier's blue ice-stone; Eclipse's obsidian with a gold seam; Apex's star-marble veined with violet. Fire, frost, charge and keystone gold still play over them.
- **Every menu is carved stone.** Pause, the fall, the summit card, Options, What's new, the story list: all framed in painted carved stone with ember-lit inlays. The main button on each is a painted ember plaque; earned stars are painted; toggles glow ember; the leaderboard, achievements and skies list are stone strips (each sky's tile is a crop of its own living painting). Old leftovers (the weapon you "carried", the build line) are gone from the fall panel, and the ready card no longer spells out the sky's rules.
- **The summit, painted.** Relighting a sky raises a painted pillar of light from the top of your tower, with painted starbursts above; the drawn rays and confetti are gone.
- **Softer perfects.** An ordinary perfect is now a quick glint along the seam; the full burst of light is saved for keystones and every fifth perfect in a streak.

## Build 53 — No more signposts (internal)

- **The world tells you, not labels.** The sky name and its rule line are gone from under the score, and so are the play-by-play words (Perfect, Fast, Close, Rubble, Braced, Keystone, Wind shifts, lean degrees). What's left:
  - **Wind** blows streaks of dust past the slab, and a falling slab casts its **shadow** on the stack where the wind will set it down (no more outline or streamer).
  - **The beat** pulses in the groove.
  - **Breath**: frost blooms on the slab while it holds at the wall.
  - **Perfects** burst with a painted flare of light out of the groove; the streak is only called out every ten.
  - **Keystones** gleam with gold inlay.
  - **The bomb** is a painted iron charge with a sizzling fuse; a ring of fire burning down around it is the fuse left. No "WAIT" or "DON'T TAP".
- **No more text lessons.** The first time you meet a new kind of sky, time slows and the slab turns ghostly and makes the move by itself, once.
- **No more pickups** on the climb (the brace and slow orbs): gifts come from the landings.
- Story moments still speak: the sky lit, taken by the Dark, the Dark quickening, new best, summit.

## Build 52 — Living skies, elemental gifts (internal)

- **All eight Hearth skies are living paintings.** Tidewater's swells break on a drowned colossus; Pulse City's clocks tick; dust blows through Red Canyon; flags whip on Gale Ridge; the aurora ripples over the Glacier; the corona flares round the Eclipse; and at Apex the stars die out one by one while something watches. Each has ruins sliding past in front as you climb.
- **New gifts, and fewer of them.** A landing now comes once a sky (twice on the long ones) and deals two painted cards from five elements. Each one changes the world:
  - **Forge-fire**: your next six slabs blaze, and each one burns the Dark back a floor.
  - **Rime**: the Dark freezes over for ten seconds and your next five slabs freeze to whatever they land on.
  - **Starfall**: your next three perfects call down lightning that blasts the Dark three floors down.
  - **Bedrock**: buttresses rise to brace the tower's foot; the sway is halved and your next four slabs are broad.
  - **Stillness**: time thickens, and the world (sky included) slows for six slabs.
- **The card you take wakes in its element**: fire engulfs it, frost seals and shatters it, lightning strikes it, stone sets it, shadow dissolves it. Then it flies into the tower, and the other crumbles away. Gifts you've had come round less often.
- Embers no longer appear on the climb; brace and slow pickups stay.

## Build 51 — A living sky, a title that wakes (internal)

- **The Foundry's sky is alive.** A painted foundry city burning under an ember sky: smoke rolls from the chimneys, furnace windows flicker, violet lightning crawls through the clouds. It slides from the city up into the night as you climb, ruins and hanging chains pass in front of you, and embers drift at two depths. (The other skies follow once this one is approved.)
- **The title wakes.** It rises out of black: the painting fades up, the name forms out of embers, then "Tap to begin". Tapping plays a deep sting, the music swells in, and the view pushes into the light before the worlds open.
- **Fixed:** the title's animation (and other painted loops) didn't play on iPhone.

## Build 50 — Painted stone, living slabs (internal)

- **Painted slabs.** Every slab is now carved dark stone with runes and a molten groove; the centre mark is the perfect mark.
- **They come alive.** A streak of four perfects sets the top slab alight, and the fire spreads down with every perfect after. On the Glacier the whole tower is frozen, rimed and dripping icicles. In the escape the charged slabs pour starlight.
- **The Descent's creatures.** The stick figures are gone: the climbers are painted things that crawl up the shaft (the starved builders in their rags, bone-white mites, root-armed brutes, and a few with a violet glow in their chests). When a cut-off piece lands on them they are crushed flat and burst in blood.

## Build 49 — Test sky: The Roots (internal)

- **The Descent, first test.** Choose **The Descent** on the world select (testers can open it now). In **The Roots** you build _down_: the spire hangs from the ceiling of a vast shaft and grows a floor at a time beneath it.
- **Things climb up.** A swarm of pale shapes comes up the shaft toward your lowest slab. Build steadily to stay ahead; stall and they reach you.
- **Misses are weapons.** Whatever you cut off falls into the shaft and squashes them, knocking them back.
- To feel out: does building down read clearly? Is the race tense? The climbers are placeholder drawings; painted ones come later.

## Build 48 — The boss, the story, the score

- **The Dark is painted.** A slow, heaving sea of black ink and ash with an ember-lit surface. Smoke lifts off it, and faint violet light and sparks sink inside it. It swallows what falls. Its edge is still marked by the violet line, so you can judge how close it is.
- First release to everyone since build 43. It also includes builds 44–47: the new boss fight (tap on the pulse, be still when the eye opens, with RUN / IT STIRS / STOP signals), the story in chapters with living paintings, and the new composed music.

## Build 47 — A real score

- **New music.** The repeating synth tune is gone. Hearth now has five composed pieces that play in a shuffled order and crossfade into each other, so you'll hear about 10 minutes before anything repeats. The title screen and the boss fight have their own pieces.
- **The game still shapes the music.** It's muffled near the ground, opens up as you climb or the Dark gets close, sinks after a fall and rises on a landing. A retry doesn't restart the piece.

## Build 46 — Run and stop

- **Clear signals in the boss fight.** A sign at the top tells you when to move:
  - **RUN** (gold): tap on the pulse.
  - **IT STIRS** (amber): a bar runs down to when the eye opens. Get ready to stop.
  - **STOP** (red, with an eye): the screen's edges glow red and the pulse ring turns red. Don't tap until it says RUN again.
- **Fixed:** tapping the Hearth end scene did nothing. Chapter I had opened behind it; now it opens on top.

## Build 45 — Be still

- **A new boss fight.** Spamming no longer works:
  - **Tap on the pulse**: a ring closes on the light; tap as it lands to break a slab. Off-pulse taps only chip at it.
  - **Be still**: every few seconds the creature stirs, then its great eye opens and stares down at the light. While it watches, don't move — tap and it sees you, lunging closer. It holds still while it looks.
  - Chains, bindings and the summit sting are as before.
- **The story in chapters.** A prologue before your first game, and **Chapter I · What the Foundry Remembered** after Hearth is relit — each paragraph over its own living painting. Read them again from **Story**.
- **Fixed:** the painted source didn't appear on iPhone in build 44.

## Build 44 — It comes for the light

- **The sky is lit** — the first time you reach Apex's summit, a painted scene: the beam flares, the black sky ripples and tears open, and the source descends with its eyes opening. Retries go straight to the countdown.
- **The source is painted and alive** during the escape: a churning mass of eyes and tentacles that grows as it closes in, its great eye bearing down on the light. Its tentacles bind your tower, heavier and darker than before.

## Build 43 — A living world select

- **Each world plays its own painted scene** full-screen behind its panel: Hearth's burning foundry city, the Descent's chasm, the Wheel turning in the void. Swiping crossfades between them.
- **A weathered typeface** (IM Fell English) for the title, world and sky names and headings; Nunito stays for body text and buttons.
- **The story plays once**, when you press Begin for your very first game, then the first sky starts. It no longer pops up on the menus.
- **A richer bottom bar** for Options, Leaderboard, Achievements and Story.
- A brand-new player is no longer shown "What's new".

## Build 42 — Painted

- **A painted title**: the Spire rising out of the burning ruins, its light breaking into the black sky, embers drifting — a living loop behind the title.
- **Painted worlds**: Hearth's foundry city, the Descent's chasm and the Wheel on the world select, with Hearth's constellation over its painting.
- **A world relit** is now a film: wind through the grass on the hill, the family watching, and the stars coming back one by one until a band of galaxy sweeps across the sky. Then the line. Tap to skip.

## Build 41 — Bound

- **The thing above binds the tower.** Its dark fills the top of the sky and tentacles snake down to wrap slabs: some before you start, and new ones every few seconds just below the light. A bound slab **stops a chain** and takes **three taps** to tear free ("TEAR ×3"). A perfect tower is now a rhythm of cascades and hard stops, not one tap.
- **Before the run**: the first time, a short frame with the three rules (tap to break, perfects in a row go off together, bound slabs take three taps), then a big **3 · 2 · 1 · RUN**. Retries go straight to the countdown.
- Tuned on the first world: a perfect tower escapes at a relaxed pace; a sloppy one needs fast tapping.

## Build 40 — Boss button

- With **Options → Unlock every sky** on, each world's panel on the world screen has a **Boss · tester** button that starts that world's boss straight away, without playing its skies. The run isn't posted.

## Build 39 — Chain reaction

- In the escape, **perfect slabs laid in a row are one fuse**. Break the first and the whole run detonates down the tower on its own, quickening as it goes and blasting the thing above back. A loose or rubble slab stops the chain. A climb with no misses is one tap and a cascade all the way to the ground.

## Build 38 — The Escape

- **A new boss for Apex.** Reach the summit and the sky is lit — and that wakes what put the skies out: not the Dark below, but something vast above, all eyes and reaching tentacles. It comes down for the light.
- **Run.** The light drops into the top slab of your tower. Tap anywhere to break the slab it's in; it falls to the next. Race the light down the tower you built, floor by floor, before the thing above reaches it. Reach the ground and the light escapes.
- **Your climb is your ammo.** Every perfect slab you built is stored light: breaking it drives the source back. Loose and rubble slabs take two taps. Six quick taps in a row **surge** through the next three floors at once.
- **The tower holds still** for the escape — it may sway, but nothing falls.
- **Caught?** _Try again_ starts the escape from the summit on the same tower; you don't climb Apex again.
- The first world's escape is the gentlest; later worlds' sources will come faster.

**Please try**: tester tools → Apex → Fight the boss. Is the pace exciting? Too easy at a normal tapping speed?

## Build 37 — A new home

- **New title**: the Spire rising behind, a column of light released into the sky, and _Tap to begin_.
- **Choose your world**: swipe through the worlds. Each panel carries that world's constellation, which lights up star by star as you relight its skies (the next sky pulses). **Continue** picks up at your next sky in that world; **New** starts the world again from sky 1 — your stars, records and other worlds are untouched. Worlds to come are shown locked. Tap a panel's picture to see all its skies.
- **Along the bottom**: Options, Leaderboard, Achievements (the star map and your feats) and the Story.
- **Options** gains your weapon and _Start a new game_ (moved off the title).
- **Removed**: coins, the forge and the paid rebuild; Endless is put away for now.

## Build 36 — Tester tools

- **Options → Tester tools**:
  - **Unlock every sky** — play any sky in any order. Apex's card gets a **Fight the boss** button that starts you at its summit on a finished tower, straight into the Hollow.
  - **No Dark (practice)** — the Dark stays away so you can learn a sky. Practice runs and boss-only runs say "Practice run · not posted" and don't reach the leaderboard or your ghosts.
- **Fixed:** in build 35 the Hollow could not be beaten (the new limit on pushing the Dark back also applied to the boss fight). Use this build to test it.

## Build 35 — A score that climbs with you, and a Dark that won't wait

**Music**

- The score follows your climb instead of looping: it moves through sections (A, B, A and a breakdown) with a second chord progression and drum fills between them.
- Layers are earned: the bass comes in at your first landing, the drums at your second, and the melody joins on a streak of three perfects and drops out if you break it.
- A landing plays a rising swell into a new section; a topple strips everything back to a bare pad for a few bars. Tension rises with your height and as the Dark closes in.

**The Dark quickens**

- Stay on a sky past its par time and the Dark climbs faster, stepping up every ten seconds ("THE DARK QUICKENS") — about 40% faster ten seconds over, more than twice as fast by thirty.
- Perfect drops still push it back, but never more than twelve floors below your top, so it can no longer fall so far behind that it stops mattering.

**Please try**: play a sky slowly or carelessly and tell us when the Dark started to feel dangerous — too soon, or not soon enough?

## Build 34 — Sound that comes back

- Fixed: after switching to another app and coming back, the sound could stay off. Your next tap now brings it back; if iOS has shut the audio down entirely, the game rebuilds it and the music picks up again.
- Includes everything in builds 32 and 33.

## Build 33 — One typeface

- The whole game uses one typeface, Nunito: the title and wordmark, the HUD, the callouts on the tower (PERFECT, LANDING…), the cards, the summit card and the menus.

## Build 32 — Cards and a quieter start

- **Landing gifts are cards.** Two cards deal up with a flip and a flare and sit bobbing in the light, each with an emblem from the world: the weld seam of Set Stone, the clamps of Two Braces, the plumb line of Keel, the lamp of Lantern, a Pulse City clock for Slow Stone. Amber cards (Stone) help the tower stand; violet cards (Light) hold the Dark back. Take one and it lifts, ignites and breaks into light that pours down the tower.
- **Before each sky** its line sits over the sky on its own, clear of the stack, with no button. Your first tap drops the slab and the words fade away.
- **The story** rises out of the dark line by line, centred, with a glowing _Tap to begin_.
- One typeface (Nunito) for all three.

## Build 31 — A world relit

- When the Hollow falls and you press **The sky**, a scene plays before the map: far away, on a hill, a family looks up at a dark sky as Hearth's eight stars come back one by one, each in its sky's colour, and join into the constellation. Then the world's line. Tap to go on.

**Please try**: beat the Hollow and watch the scene. Does it land, and is it the right length (about seven seconds before the line)?

## Build 30 — The story and the worlds

- **The story**, told once on first launch in four lines, and kept behind "The story" on the Worlds screen.
- **Worlds**: the title's Skies button is now **Worlds**. It opens the star map with a card per world — what it is, how many skies you've relit, Continue — and the worlds to come, locked, with what opens them.

## Build 29 — Landings

- **Every eight floors the climb stops at a landing.** The stone below sets for good — a topple can never take you under it — and you choose one of two gifts whose effect you feel at once: _Set Stone_ (the next five slabs set and count wherever they land), _Lantern_ (the Dark holds for twelve seconds), _Broad Stone_ (three wider slabs), _Two Braces_, _Ember_ (Heat to full), _Slow Stone_ (six slow slabs), _Keel_ (half the sway for the sky), _Light_ (the Dark driven down six floors).
- An **ember** caught on the climb hands you one of those gifts on the spot, instead of the old pick list.

**Please try**: reach a landing, take a gift, then deliberately play badly — your floors below the landing should stand whatever happens.

## Build 28 — Clearer starts and exits

- The line before each sky now sits up under the HUD, clear of the stack, and your **first tap only puts it away**; the next tap is your first drop.
- An **✕ next to pause** ends the run. It asks first ("End the run?"), and says what's kept: your skies, stars and coins are always saved.
- **Wind** holds for six floors instead of flipping every three, and the wind lane is drawn only for two floors after a shift; the streamer carries the reading the rest of the time.

## Build 27 — The Hollow

**What's new**

- **Apex has a boss.** Reach its summit and the Dark wakes with eyes. The goal changes: drive it down three times. Perfect drops burn it back, clean drops barely scratch it, rubble feeds it, and every few seconds it takes a loose slab from your tower. Three surges, each faster. Beat it and the whole sky relights.
- **Worlds and the star map.** The eight skies are world one, _Hearth_. Tap the beacons on the title to open the sky: every relit sky is a star, and the constellation completes with the world's name when the Hollow falls. Two dark patches show the worlds to come.
- **The story.** A line before each sky says where you are and what the slab will do there (this is also the answer to "what is going on on the Eclipse").
- A **Board** button on the title, with arrows to browse every sky's leaderboard.

**Please try**

1. Climb Apex to the top and fight the Hollow. Tell us how long it took and whether the three surges felt fair (we expect roughly 2, 4 and 5 perfects each).
2. After it falls, press **The sky** and watch the constellation draw.
3. Read the line before each sky — does the voice feel right?

## Build 26 — Saved as you go

- Progress is now kept in the phone's own storage as well as the game's, so it survives the app being closed hard. If a save ever went missing, this is the fix.
- The pause sheet's exit is now **End run**, with a line saying what that keeps: your skies, stars and coins are saved as you go; only the climb ends.
- A **Board** button on the title opens the leaderboard on your current sky, with arrows to browse every sky.

**Please try**: play a sky, press pause → End run, close the app fully (swipe it away), reopen — your skies and coins should be exactly as they were.

## Build 25 — Challenges

**What's new**

- **Options** (gear on the title): set your leaderboard name, and switch **Challenges** on or off.
- **Competing is by invitation.** On any sky's leaderboard, tap **Challenge** next to someone. You race their ghost straight away; they get "X challenges you" on their title and can accept or decline. Once accepted you both race each other's ghosts on every sky. One challenge at a time; end it from Options.
- **Throw shade.** Beat the person you're competing with and the summit card lets you throw shade. They'll see a small mark on that sky, with the margin, and can race you straight back. Shade only ever comes from your challenger.
- **The journey.** Eight beacons, one per sky, on the title, the Skies screen and the summit card. The sky you've just lit ignites.
- **Feats.** Medals for First Light, Half the Sky, Three Stars, True Column (every drop perfect), beating your ghost, a top-ten board placing and more. They line up under the title.
- **A calmer summit card**, one beat at a time; the forge folds into a single row — tap to open it.
- **Builds announce themselves.** A "What's new" window opens once after each update, and the game tells you when a newer build is ready.

**Please try**

1. Post a time, then challenge a friend from the Foundry leaderboard and ask them to accept.
2. Beat their ghost and throw shade; check they see it on that sky and can race you back.
3. Open Options, switch Challenges off, and ask a friend to challenge you — they should be told you're not taking challenges.
4. Tell us whether "rubble" (grey slabs that don't count) is clear when it happens.

**Known**

- The "Update in TestFlight" button is untested on a real device — if it does nothing, say so.
- Apex (sky 8) is tight even for a clean run; tell us if it feels unfair.

## Build 22 — Rubble you can see

- Slabs that land too far off the groove are rubble: real, buildable, but not floors. They're drawn grey and cracked so what still holds its colour is what counts.
- The summit line sits where the floor count will reach the goal, so rubble can't lift you "past" it.
- Fixed: perfects landing on a toppled heap sometimes never counted.

## Build 19 — Leaderboards and ghosts

- Your best run on each sky is kept as a ghost that climbs beside you on replays; the HUD shows how far ahead or behind you are, and beating it pays coins.
- Summits post to a per-sky leaderboard under a name you choose once.
- Fixed: tapping as fast as possible could build a floating lattice and summit in seconds. The slab now enters from well off-centre, only slabs resting on something anchored count, and only drops close to the groove are floors.

## Build 17 — The Dark must reach the top

- The slab you build on no longer flips between floors while the stack sways.
- The Dark has to climb to the highest slab still standing, settled or not.
- The Dark is faster on every sky.

## Build 16 — Read your tower

- Loose slabs (landed off the groove) wear a cracked seam; a tip explains them the first three times.
- Shields are braces: your next loose drop sets anyway. Buttress sets every loose slab in the spire. Second Wind throws the Dark back once; Keel softens the sway; Breather holds the Dark after a topple.

## Build 14 — Weight on every sky

- Every sky is physics now: slabs have weight, lean, and topple. A perfect sets; a miss stays loose.
- Height is dangerous: a breath of air swings the spire, never enough to move a true column, enough to finish a lean.
- Goals are taller, slabs faster, the Dark starts lower and climbs faster.
