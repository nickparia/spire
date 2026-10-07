# Backlog

The one list. Ordered within each section; move items as they go. Keep it current with every change.

## In progress

- **The Descent** (world two). Design agreed: build _down_ from a ceiling; a slab that lands in or near the groove sets and the spire grows a floor downward; a miss cannot hang and falls into the chasm, squashing what it lands on. The menagerie climbs the chasm walls toward your lowest slab (this world's Dark); you race into each other. No topples in this world. Landings every eight floors. Voice is quieter (see STORY.md). Engineering sketch: the stack grows in −y with the foundation at y = 0 as a ceiling; the Dark comes from below as now but the "crown" is the lowest slab; physics gravity stays −y so misses fall away; place() welds close drops at once; the ground is drawn as a ceiling; backdrop and camera need a downward mode. Not started in code.

## Next, in order

- **Unlocks from stars and feats** (agreed Oct 7, replaces the forge): e.g. three stars on a sky unlocks a stone finish for your slabs, finishing a world a beacon style, a feat a slab trail; chosen under Achievements.
- **Painted art (Higgsfield)**: brief and prompts in `ART.md`; slots are built (`src/components/art.tsx`), files go in `public/art/` by name and replace the procedural version when present. Claude drives it via the Higgsfield CLI (`higgsfield generate create …`, workspace selected; Ultra plan). Still to do: panel loops; a caught sting and a victory sting.
- **Pixel-art side test**: decide the in-game style (toggle in Options) before generating art in volume.
- **Tidy the dead systems**: coins, ranks (`gear.ts` tracks), the forge offers, rescue and Endless are hidden but still in the engine and save; remove them once unlocks replace them.
- **Music per world**: each new world gets its own recorded climb set (5 pieces), boss piece and menu piece; see ART.md › Music. Replaces the old "motif per world" idea.

1. **Tester read on builds 27–29**: the Hollow's three surges (target ~2, 4, 5 perfects), landing spacing (8) and whether any gift is a dud, the Foundry's fairness for a newcomer, Apex's fairness at the top, whether the "Update in TestFlight" button works on a real phone.
2. **The Descent** (above), then its boss (what was buried).
3. **The Wheel** (world three): a turning hub, gravity to the centre, slabs seated on the rim. Boss: **the Siege** — a ring of slabs with a notch around the light; the ring turns, things fly in; tap when the notch faces one and it feeds the light; misses crack plates; repair gaps between waves by dropping slabs.
4. **The title screen**: procedural, the Spire building itself out of the Dark as the title settles, lit skies burning on the horizon, the premise in three lines. (Instead of generated video.)
5. **Pixel-art side test**: a render mode behind an Options toggle — quarter-resolution canvas, nearest-neighbour upscale, palette crush and a touch of dither — so testers can compare; redraw properly only if it wins.
6. **Cosmetic forge**: coins buy stone finishes and beacon styles instead of the quality-of-life ranks, which read as nothing; the few ranks that matter (Brace, Second Wind, Breather) move into landings or run picks.
7. **Catch and dodge**: embers that fall to be caught under the slab, rocks to dodge, all through the drop tap.
8. **App Store groundwork**: screenshots, a preview video (one month of a video tool then), the privacy form (display name and scores, not linked to identity), listing copy.

## Pinned ideas (not scheduled)

- **The solar system arc** (Nick): each world is a planet with its own source-boss; a mega boss in the black hole at the centre; through it into their dimension as the next arc. Recorded in STORY.md.
- **Cosmic horror theme** (user, Oct 7): lean into it — the source above is Lovecraftian (eyes, tentacles, the sky swallowed). Every world's boss is an inversion of its climb and shows more of the source.
- **More worlds** from the four dials (direction, slab behaviour, enemy, goal): low moon (slow falling, the tender world), heavy world (double gravity), the deep (underwater, currents), twin suns (gravity tilts through the run), ice (slabs slide to a lip), seed (slabs sprout ledges), the tide (waves surge and pull back), the watcher (the Dark drawn to loose slabs), hold-out and squash goals.
- **The Trial**: the old precision game (shrinking slabs) as a special sky with milestone scoring. Only if it is missed.
- **Over-the-air web updates** (Capgo or similar), only if build churn annoys testers.
- **Resume a half-built run** after the app is killed (save every slab's position and weld). Only if testers ask.

## Done (most recent first)

- 51 Living painted skies: `PAINTED_SKIES` (theme ids with `art/sky/<id>.mp4` loop, `.jpg` poster, `-fg.webp` keyed foreground); `drawSky` slides the plate by `altitude` with a centre shade, `drawSkyFront` draws near embers and the foreground at 1.35× parallax, `drawEmbers` at two depths. Foundry done (Seedance loop from `hf/plate-foundry-2.png`, start = end image; foreground made on chroma green and keyed). Title reveal (`TitleSplash`: veil, drift, ember rise, name forms, tap → `engine.awaken()` = `sfx.awaken` sting + `music.swellIn`, flare and push for `TITLE_LEAVE`). `ArtLoop` sets muted and calls play itself (iOS autoplay). Bot: `tools/bots/title.mjs`.
- 50 Painted slabs: `slab-hearth.png` drawn 5-slice (`drawSlabArt`, `SLAB_CAP`/`SLAB_MID`) with the sky's colour soft-lit over it; living looks from sprite sheets (`art/sprites/slab-{fire,ice,charge}.webp`, `SLAB_LOOKS`): fire on the top `burning()` slabs from a streak of `FIRE_STREAK`, ice on the Glacier, charge on escape-charged slabs. Climbers are sprite sheets (`swarm`, `mite`, `brute`, `lantern`; `climber(i)`, `CLIMBER_SIZE/FPS`), rotated a quarter to climb, crushed ones flatten and respawn (`climberDead`); squash sprays blood (`fx.blood`, stains) with hit-stop. `fx.down` flips particle gravity in the Descent. Pipeline: `tools/sprites.mjs` turns a clip on black into a sheet with alpha (edge flood fill). Not done yet: brute taking two hits, lantern ones only in the dark sky.
- 49 Descent test sky "The Roots" (`roots`, world `descent`, `tier`/`descent` on LevelDef): non-physics stacking drawn mirrored (`worldToScreen` flips when `plan.descent`, tip at `DESCENT_SEAT`), ceiling (`drawCeiling`), painted shaft backdrop (`drawShaft`, bg-descent.jpg with slow parallax), the Dark's logic reused as climbers (`climbersY` = 2·crown − darkShown, `drawClimbers` placeholder figures, held within `DESCENT_REACH` floors), cut-off scraps fall down the shaft and `squash` them (`SQUASH_PUSH`, `SQUASH_PER_WIDTH`). Descent boss not built (`isBoss` false). Bot: `tools/bots/dark.mjs <out> 8`.
- 48 Painted Dark: `dark-hearth.mp4` (seamless 720p loop, ink-and-ash sea, ember edge) drawn under the Dark's line (`drawDarkArt`, surface at `DARK_ART_SURFACE` = 0.2 of the painting, night above faded out, solid black below); the drawn violet edge lines stay on top for readability; gradient fallback. A violet take (scratch `hf/dark-2.png`) could suit cool-toned skies. Released to external testers (version.json → 48). Bot: `tools/bots/dark.mjs`.
- 47 Recorded score: composed pieces (`public/music/`, Higgsfield `sonilo_music`) replace the synth, which stays as the fallback if they fail to load. `RECORDED` playlists menu/climb/boss on two crossfading decks (MediaElementSource → lowpass → level); the climb rotates 5 Hearth pieces shuffled, a retry keeps the piece playing, returning to a playlist within 90 s resumes it. The game still shapes it: lowpass opens with tension, sinks after a fall, dips on a topple; the landing swell is kept. Bot: `tools/bots/score.mjs`.
- 46 Run/stop cue: `GazeCue` in `escape-brief.tsx` (RUN gold / IT STIRS amber with a bar draining over `stirFor` / STOP red with eye, plus amber/red screen-edge glows); pulse ring turns red while watching; in-canvas BE STILL/RUN floats removed. Fix: `.chapter` z-index above the world-end film, so tapping the end scene reaches Chapter I. Bot: `tools/bots/cue.mjs`.
- 45 Boss rework: the great eye stirs then watches (`gaze`), tapping while it watches makes it lunge (`ESCAPE_LUNGE`); taps on the light's pulse break slabs, off-pulse taps only chip (`ESCAPE_BEAT/_WINDOW/_OFFBEAT`); the source holds still while it watches. Hearth tuned: smart player escapes a sloppy tower in ~1 min, eye-ignorers and spammers are caught. Story as chapters (`ChapterPlayer`, prologue on first Begin, chapter after each world's film, chapter list from Story) with 8 painted vignettes. Fix: the painted source now plays on iOS (play before load). Bot: `tools/bots/gaze.mjs <spam|rhythm|smart>`.
- 44 Painted boss: `source.mp4` drawn into the chase (`drawSourceArt`, grows as it nears, eyes kept in view), `escape-sting.mp4` on the first lighting (`ESCAPE_STING`), binding tendrils restyled to match. Pattern for later worlds: Higgsfield for watched beats (stings) and living layers (the mass), code for anything that reacts to taps.
- 43 Full-screen per-world background loops on the world select (`bg-<world>.mp4/.jpg`, crossfade), IM Fell English SC as `--font-display`, story on the first Begin only, new bottom bar, no what's-new for new players.
- 42 Painted art from Higgsfield: title loop, Hearth/Descent/Wheel panels, the world-end film (plays once, holds, then the line; tap skips), source reference. See ART.md.
- 41 Escape bindings (`ESCAPE_BIND_EVERY/INTERVAL/TAPS`, stop chains, tear with taps), the cloud always in view, first-time briefing + 3-2-1 (`escape-brief.tsx`, tip key `escape`). Hearth: perfect tower escapes at 2.5 taps/s, sloppy (40% perfect, 40% heavy) needs 5.
- 40 Tester Boss button on each world panel (`home.tsx` `onBoss` → `engine.startBoss`).
- 39 Escape chains: consecutive charged slabs detonate in a cascade (`ESCAPE_CHAIN_STEP`). Later worlds may need seals or caps so a perfect climb isn't always a one-tap escape.
- 38 The Escape (Apex's boss): sky lit at the summit, tower frozen, the source descends (tentacles, tracking eyes), tap to break floors, perfects are charged light, heavy slabs two taps, six-quick-tap surge, retry from the summit. Tuning `ESCAPE_*` in engine.ts; difficulty rises per world. Bots: `escape.mjs <rate> [charged] [heavy]`, `fullboss.mjs`. Old Hollow fight code (`wakeBoss`, `bossTurn`, `drawEyes`) is unused; remove with the dead-systems tidy.
- 37 The app shell: title splash (`home.tsx` TitleSplash), world select with per-world constellation panels and Continue/New (per-world active game in `save.progress`, `progress.ts`), bottom bar (Options, Leaderboard, Achievements, Story), Achievements = star map + feats; coins/forge/rescue/Endless removed from the UI; weapon and new game moved to Options. House style: the story's ember ground, rising text, glowing pill and constellations.
- (next build) Update prompt only for builds released with `tools/release.mjs`; the build's own info moved to `src/game/build.json`.
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
