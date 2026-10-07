# Release notes

Written for testers; paste the newest entry into TestFlight's "What to Test". The
in-app "What's new" window shows the shorter notes in `public/version.json`.

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
