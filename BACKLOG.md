# Backlog

The one list. Ordered within each section; move items as they go. Keep it current with every change.

## In progress

- **The Descent** (world two). Design agreed: build _down_ from a ceiling; a slab that lands in or near the groove sets and the spire grows a floor downward; a miss cannot hang and falls into the chasm, squashing what it lands on. The menagerie climbs the chasm walls toward your lowest slab (this world's Dark); you race into each other. No topples in this world. Landings every eight floors. Voice is quieter (see STORY.md). Engineering sketch: the stack grows in −y with the foundation at y = 0 as a ceiling; the Dark comes from below as now but the "crown" is the lowest slab; physics gravity stays −y so misses fall away; place() welds close drops at once; the ground is drawn as a ceiling; backdrop and camera need a downward mode. Not started in code.

## Next, in order

- **Motif per world** (music idea 3): a short theme for Hearth that each sky varies, the Hollow breaks and the world-end scene resolves; world two arrives with its own.

1. **Tester read on builds 27–29**: the Hollow's three surges (target ~2, 4, 5 perfects), landing spacing (8) and whether any gift is a dud, the Foundry's fairness for a newcomer, Apex's fairness at the top, whether the "Update in TestFlight" button works on a real phone.
2. **The Descent** (above), then its boss (what was buried).
3. **The Wheel** (world three): a turning hub, gravity to the centre, slabs seated on the rim. Boss: **the Siege** — a ring of slabs with a notch around the light; the ring turns, things fly in; tap when the notch faces one and it feeds the light; misses crack plates; repair gaps between waves by dropping slabs.
4. **The title screen**: procedural, the Spire building itself out of the Dark as the title settles, lit skies burning on the horizon, the premise in three lines. (Instead of generated video.)
5. **Pixel-art side test**: a render mode behind an Options toggle — quarter-resolution canvas, nearest-neighbour upscale, palette crush and a touch of dither — so testers can compare; redraw properly only if it wins.
6. **Cosmetic forge**: coins buy stone finishes and beacon styles instead of the quality-of-life ranks, which read as nothing; the few ranks that matter (Brace, Second Wind, Breather) move into landings or run picks.
7. **Catch and dodge**: embers that fall to be caught under the slab, rocks to dodge, all through the drop tap.
8. **App Store groundwork**: screenshots, a preview video (one month of a video tool then), the privacy form (display name and scores, not linked to identity), listing copy.

## Pinned ideas (not scheduled)

- **"Tear it down" / the escape** — after the summit the light becomes your cursor; tap each slab of the spire you built, in whatever shape you left it; each explodes as you race back down through the worlds having escaped with the light. A sloppy tower is a harder escape. A fallback boss, or a world twist.
- **More worlds** from the four dials (direction, slab behaviour, enemy, goal): low moon (slow falling, the tender world), heavy world (double gravity), the deep (underwater, currents), twin suns (gravity tilts through the run), ice (slabs slide to a lip), seed (slabs sprout ledges), the tide (waves surge and pull back), the watcher (the Dark drawn to loose slabs), hold-out and squash goals.
- **The Trial**: the old precision game (shrinking slabs) as a special sky with milestone scoring. Only if it is missed.
- **Over-the-air web updates** (Capgo or similar), only if build churn annoys testers.
- **Resume a half-built run** after the app is killed (save every slab's position and weld). Only if testers ask.

## Done (most recent first)

- 36 Tester tools in Options (`save.tester`, `save.practice`; `engine.startBoss`); unranked runs not posted; boss fight exempt from `DARK_REACH` (the cap made the Hollow unbeatable in 35). `tools/bots/tester.mjs`.
- 35 Music driven by the climb (form A/B/A/break, earned layers, landing swell, topple strip; `music.ts` `setClimb`, `tools/bots/music.mjs`); the Dark quickens past par (`QUICKEN_RATE`, `QUICKEN_EVERY`) and light can push it at most `DARK_REACH` = 12 floors below the top (`tools/bots/linger.mjs`).
- 34 Audio heals after backgrounding: a stuck or interrupted context is rebuilt on the next gesture and the music graph follows it (`audio.ts`, `music.ts`; `tools/bots/audio.mjs`).
- 33 Nunito everywhere: CSS `--font-sans` and the canvas fonts in `engine.ts`/`props.ts`.
- 32 Landing gifts as animated cards with lore emblems (`src/components/gifts.tsx`); begin text alone, first tap drops; the story as a full-screen reveal; Nunito for these surfaces. Design canvas: https://claude.ai/artifact/KRFrf2VYJx2qi3vXDP9hYr
- 31 The world-end scene: a family on a hill watches the world's stars return, then the revelation, then the map (`src/components/world-end.tsx`).
- 29 Landings: checkpoints every eight floors with two gifts; embers grant a gift on the move.
- 28 Ready card under the HUD, first tap dismisses; End button beside pause; wind holds six floors.
- 27 The Hollow (Apex's boss), worlds and the star map, the story and a line before each sky.
- 26 Native save mirror; End run on the pause sheet; Board button.
- 25 Challenges by invitation; Options (name, challenges on/off).
- 24 Shade on the sky it was earned; version window and update prompt.
- 23 Journey beacons, feats, the paced summit card.
- 19–22 Leaderboards, ghosts, rubble rules, the anti-mash fixes.
- 14–18 Physics on every sky; a perfect sets, a miss stays loose; the Dark judges the highest standing slab.
- 30 The story card on first launch; the Worlds screen (map + a card per world with locks); BACKLOG, HANDOFF and the bots in the repo.

## Tuning knobs (where the numbers live)

- `src/game/levels.ts`: floors, periods, par times, `darkRate`, `sway` per sky.
- `src/game/engine.ts`: `QUICKEN_RATE`, `QUICKEN_EVERY`, `DARK_REACH`, `BOSS_SURGES/DEPTH/START/TENDRIL`, `SUMMIT_HOLD`, `GHOST_PURSE`, `DARK_PUSH` use.
- `src/game/landing.ts`: `LANDING_EVERY`, the gifts.
- `src/game/physics.ts`: friction, damping, `LEVEL_TILT`, `CROOKED_TIME`, `SWAY_REACH`.
- `src/game/logic.ts`: `DARK_START`, `DARK_PUSH`.
