# Spire — art brief (Higgsfield)

What to generate, at what size, and where to put it. Every file goes in `public/art/` with the exact name below; the game uses it when it is there and falls back to the procedural version when it is not. Nothing else needs changing.

## The look (put this at the start of every prompt)

> Cinematic dark fantasy with cosmic horror, painterly and atmospheric. A dead world under a lightless sky. Palette: deep violet-black night, ember orange and warm gold light, faint violet glow from the void. Soft volumetric light, haze, drifting embers. No text, no logos, no people's faces visible. Vertical 9:16 unless stated.

Keep the same seed / style reference across a batch so the worlds feel like one place. Generate stills first, pick the best, then animate the chosen still (image-to-video) so the loop matches it.

## Shot list

| #            | File                                                           | Format                                                                          | What                                                                      |
| ------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1            | `title.mp4` + `title.jpg`                                      | 9:16, 1080×1920, 8–10 s, seamless loop, no audio. `title.jpg` = its first frame | The title screen behind the wordmark                                      |
| 2            | `world-hearth.jpg` (+ optional `world-hearth.mp4`, 4–6 s loop) | 3:4, 1200×1600                                                                  | Hearth's world panel                                                      |
| 3            | `world-descent.jpg`                                            | 3:4, 1200×1600                                                                  | The Descent's panel (locked teaser)                                       |
| 4            | `world-wheel.jpg`                                              | 3:4, 1200×1600                                                                  | The Wheel's panel (locked teaser)                                         |
| 5            | `end-hearth.jpg`                                               | 9:16, 1080×1920                                                                 | Background of the world-end scene; the stars are drawn by the game on top |
| 6            | `source-ref.jpg`                                               | 9:16, any size                                                                  | Reference only: the thing above. I match the in-game boss to it           |
| 7 (optional) | `escape-sting.mp4`                                             | 9:16, 2–3 s, no audio                                                           | Played once when the sky is lit at the summit, before the countdown       |

## Prompts

**1 · Title** — _[the look]_ A lone stone tower of stacked slabs rises out of an ember-lit industrial ruin at the bottom of the frame and climbs into a black, starless sky. At its tip a column of warm golden light breaks upward into the darkness, and faint embers drift up around it. The upper third of the frame is empty dark sky (the game's title sits there). Slow push-in. Loop: the light pulses gently, embers drift, nothing cuts.

**2 · Hearth** — _[the look]_ An old foundry at dusk, chimneys and furnaces glowing ember orange under a dark violet sky; at the centre a tall stone tower of stacked slabs, its top lost in the dark. Loop: furnace glow flickers, smoke drifts, a few embers rise.

**3 · The Descent** — _[the look]_ Looking down into a vast chasm in the earth, a tower of stone hanging downward from its lip into the dark; far below, countless small pale shapes climb the walls toward the light. Darker and colder than Hearth; only a thin ember light at the top.

**4 · The Wheel** — _[the look]_ A colossal ancient millwheel of stone and iron turning slowly in the void, a ring of slabs around a single small lamp at its hub; dark sky, violet haze. Ominous and quiet.

**5 · World end** — _[the look]_ Seen from behind and far away, a small family of three (two adults and a child between them, holding hands, the child pointing up) stands on a dark grassy hill at night, silhouetted. The sky above them is completely empty and dark, filling the top two thirds of the frame. A faint glow on the far horizon. Still, tender, wistful.

**6 · The source** — _[the look]_ An impossibly vast shape descending from the black sky over a lone stone tower: a mass of darkness with many glowing violet eyes of different sizes, long tentacles reaching down and curling toward a small light at the tower's top. Lovecraftian, awe and dread, seen from below.

**7 · Escape sting** (optional) — _[the look]_ From the tip of a stone tower a column of golden light bursts into the sky; the sky above ripples, and a multitude of violet eyes open in the dark.

## Status

Made with the Higgsfield CLI (GPT Image 2.5 for stills, Seedance 2.5 for video, 1080p): `title.jpg`/`title.mp4` (loop made seamless by cross-fading its last 1.5 s into its start), `world-hearth.jpg`, `world-descent.jpg`, `world-wheel.jpg`, `end-hearth.mp4` (12 s film: wind, stars igniting, the galaxy; plays once and holds) with `end-hearth.jpg` its last frame, and `source-ref.jpg`. Also `bg-hearth`, `bg-descent`, `bg-wheel` (.mp4 + .jpg): full-screen world-select backgrounds, 9:16, seamless 720p loops. Also `source.mp4` (the living mass, a seamless 720p loop the engine draws into the chase, its tentacle line at the source's edge) and `escape-sting.mp4` (5 s: the beam flares, the sky tears, the source descends; plays once when the sky is first lit). Still to make: panel loops; a caught sting and a victory sting. Videos are re-encoded to H.264 (Seedance returns HEVC, which some browsers can't play): `ffmpeg -i in.mp4 -an -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -movflags +faststart out.mp4`.

## Music

`public/music/*.m4a`, made with Higgsfield's `sonilo_music` (120 s, about 7.5 credits each): `menu`, `hearth-1`…`hearth-5` (the climb, played in a shuffled rotation with 4 s crossfades) and `boss` (beatless dread for the escape, so it never fights the tap pulse). Prompts name the world, the instruments, a tempo and key, and "no vocals". Check each for dead air (`ffmpeg -af silencedetect=n=-45dB:d=0.6`) and cut it, then encode: `ffmpeg -i in -af "silenceremove=stop_periods=-1:stop_duration=0.5:stop_threshold=-50dB,loudnorm=I=-20:TP=-2:LRA=11" -ar 44100 -ac 2 -c:a aac -b:a 128k -movflags +faststart out.m4a`. A new world adds its own climb set and a line in `RECORDED` (`music.ts`).

## Order

Make 1, 5 and 6 first (the title, the world-end scene, the source), then 2–4. If time allows, 7.
