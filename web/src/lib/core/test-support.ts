// What the tests that call the core share: the module loaded as a test loads it, and the small
// files of levels they play on. Used by the tests alone.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initSync } from '#lib/wasm/stepwise.js';

/**
 * The path of a file, from the folder of this module. Joined by hand: in a test compiled as for
 * a browser (`*.svelte.spec.ts`), Vite turns `new URL('…', import.meta.url)` into the address of
 * a file of the website, which Node can't read.
 */
function fileFromHere(...parts: string[]): string {
	return join(dirname(fileURLToPath(import.meta.url)), ...parts);
}

/**
 * Loads the WebAssembly module, before the tests of a file call anything of the core. A browser
 * fetches the module (`loadCore`); a test reads its file, built by `npm run wasm`, which
 * `npm test` runs first.
 */
export function loadTestCore(): void {
	initSync({ module: readFileSync(fileFromHere('..', 'wasm', 'stepwise_bg.wasm')) });
}

/** The text of a file of `web/levels/`, by its stable name: a level, or `sandbox`. */
export function levelFile(name: string): string {
	return readFileSync(fileFromHere('..', '..', '..', 'levels', `${name}.toml`), 'utf8');
}

/** The file of a level without starting code, from the body of each of its `[[maps]]` tables. */
export function levelOf(...maps: string[]): string {
	return `version = 1\nstarting_code = ''\n${maps.map((map) => `\n[[maps]]\n${map}`).join('')}`;
}

/** The file of a sandbox without starting code, from the body of its `[map]` table. */
export function sandboxOf(map: string): string {
	return `version = 1\nstarting_code = ''\n\n[map]\n${map}`;
}

/**
 * The body of a map of one row, written as it is drawn (`'....'`: four floor cells), the robot on
 * its first cell, facing east. `more` holds the lines that follow, each ended by a line break:
 * the items and the paints, then the goals in their table (`[maps.goals]` in a level).
 */
export function corridor(terrain: string, more = ''): string {
	return `terrain = '${terrain}'\nrobot = { at = [0, 0], facing = "east" }\n${more}`;
}
