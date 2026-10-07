import version from "./build.json";

/**
 * The build this bundle is, with its notes for the What's new window. Bumped
 * by tools/bump.mjs. The published public/version.json names only the build
 * released to testers (tools/release.mjs), which is what prompts an update.
 */
export const BUILD: number = version.build;
export const TITLE: string = version.title;
export const NOTES: string[] = version.notes;
