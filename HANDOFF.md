# Working on Spire

Read this first, then BACKLOG.md (what is next), STORY.md (the voice), README.md (how the game works), RELEASE_NOTES.md (what testers were told).

## How the user works

- Nick owns the design; he plays every build on his phone and relays tester feedback. He wants proposals before new systems ("keep it simple, propose first"), then a quick build. He values longevity and player growth over purity; variety of level _format_ (the worlds) is the longevity plan.
- Cadence: a change that affects play or fixes a reported bug gets a TestFlight build and a release-notes entry; copy nits ride along with the next build.
- Say what was verified and how. The bots below are the verification; screenshots are tiled with `side.mjs` and read.

## The loop

- `npm run dev` serves on http://localhost:8080 (Vite, port set in vite config). `npx tsc --noEmit && npx eslint . && npm test` before committing. Prettier formats everything (`npx prettier --write`).
- Dev-only `window.__spire` exposes the engine for bots: `startLevel(i)`, `tap()`, `choose(i)`, `probe()` (phase, floors, offset, tol, blocked), and the fields (`stack`, `mover`, `seat`, `dark`, `boss`, `landing`, `runTime`, `phase`).
- Bots live in `tools/bots/` (copied from the session scratchpad): `phys.mjs ideal|lean|sloppy <sky>` plays a sky three ways; `boss.mjs` fights the Hollow; `land.mjs` tests a landing; `spam.mjs` mashes; `shade.mjs`/`chal.mjs` run two-device social flows against the live board (use fake player ids and delete the rows after). They need `puppeteer-core` and Chrome at `/Applications/Google Chrome.app`.
- Don't edit source while a bot runs: Vite's hot reload kills the run.

## Shipping

- `node tools/bump.mjs "Title" "note" "note"` bumps `public/version.json` (the in-app What's new and the update prompt) and the Xcode build number. Add an entry to RELEASE_NOTES.md.
- Commit, push `professionalise` (GitHub Pages deploys the web build and version.json to https://nickparia.github.io/spire/).
- `npm run build && npx cap sync ios`, then from `ios/App`: `xcodebuild -project App.xcodeproj -scheme App -configuration Release -destination "generic/platform=iOS" -archivePath <path> archive -allowProvisioningUpdates`, then `xcodebuild -exportArchive -archivePath <path> -exportOptionsPlist <export.plist> -exportPath <dir> -allowProvisioningUpdates` with a plist of method `app-store-connect`, destination `upload`, teamID `XUKTV95C24`, signingStyle automatic, uploadSymbols true, manageAppVersionAndBuildNumber true. Build numbers so far: 1–29.
- TestFlight: app "Spire: Stack the Sky", bundle `com.nickprince.spire`. Nick attaches new builds to his external group himself.

## Backend

- Supabase project **Spire** (`eufnyvqsniakpdckkuga`, eu-west-1). Tables `ghosts`, `shade`, `challenges`, `players`. All writes go through security-definer RPCs (`post_ghost`, `throw_shade`, `send_challenge`, `answer_challenge`, `end_challenge`, `set_challenges`, `rename_player`); the public handle is `handle_of(player_id)` (half of SHA-256) and the secret `player_id` column is not readable. Client: `src/game/board.ts` with the publishable key.
- Test rows: use ids like `aaaaaaaa-2222-4333-8444-555555555555` and delete them from all four tables afterwards. A bot once threw shade at Nick's real row by clicking the first button on the board.

## Where things are

- Engine: `src/game/engine.ts` (large; phases menu/ready/play/pick/fall/won; the stage in `physics.ts` is Box2D via planck). Rules: a perfect sets (weld), a miss stays loose; only a close drop is a floor; a slab is landed when it rests on something anchored to the base; crooked slabs crumble; the Dark must reach the highest standing slab; landings every eight floors set the stone below.
- Worlds: `src/game/worlds.ts` (Hearth = the eight skies, Apex is its boss), `src/components/star-map.tsx` (the Worlds screen), `src/game/landing.ts`, `src/game/feats.ts`, `src/game/board.ts`, `src/components/{journey,challenge,shade,whats-new,story,ready}.tsx`.
- Save: `src/game/save.ts`, localStorage `spire-v2` mirrored to Capacitor Preferences on the phone.
