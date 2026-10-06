import version from "../../public/version.json";

/**
 * The build this bundle is. The same file is published with the web build,
 * so a running app can see when a newer one exists. Bumped by tools/bump.mjs.
 */
export const BUILD: number = version.build;
export const TITLE: string = version.title;
export const NOTES: string[] = version.notes;
