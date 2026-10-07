#!/usr/bin/env node
// Releases the current build to testers: copies src/game/build.json into the
// published public/version.json, which is what makes every installed copy of
// the game show "Build N is ready". Run it after attaching the build to the
// testers' group in TestFlight, then commit and push.
// Usage: node tools/release.mjs
import { readFileSync, writeFileSync } from "node:fs";

const own = JSON.parse(readFileSync("src/game/build.json", "utf8"));
writeFileSync("public/version.json", JSON.stringify(own, null, 2) + "\n");
console.log(`released build ${own.build}: ${own.title}`);
