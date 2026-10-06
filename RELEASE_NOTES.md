# Release notes

Written for testers; paste the newest entry into TestFlight's "What to Test". The
in-app "What's new" window shows the shorter notes in `public/version.json`.

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
