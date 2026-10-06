# Release notes

Written for testers; paste the newest entry into TestFlight's "What to Test". The
in-app "What's new" window shows the shorter notes in `public/version.json`.

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
