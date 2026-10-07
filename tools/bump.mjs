#!/usr/bin/env node
// Bumps the build: src/game/build.json (with a title and notes passed in) and
// the Xcode build number. Usage: node tools/bump.mjs "Title" "note one" "note two" ...
import { readFileSync, writeFileSync } from "node:fs";

const [title, ...notes] = process.argv.slice(2);
const file = "src/game/build.json";
const v = JSON.parse(readFileSync(file, "utf8"));
v.build += 1;
if (title) v.title = title;
if (notes.length > 0) v.notes = notes;
writeFileSync(file, JSON.stringify(v, null, 2) + "\n");

const pbx = "ios/App/App.xcodeproj/project.pbxproj";
const text = readFileSync(pbx, "utf8").replace(
  /CURRENT_PROJECT_VERSION = \d+;/g,
  `CURRENT_PROJECT_VERSION = ${v.build};`,
);
writeFileSync(pbx, text);
console.log(`build ${v.build}: ${v.title}`);
