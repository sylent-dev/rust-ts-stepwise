// The programs of the bench, run on their maps through the module the page loads: the page
// deployed must never start a program that has errors, nor show one that stops on an error it
// isn't made for.

import { readFileSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import { hasMessage } from '#lib/i18n.ts';
import { check, initSync, Level, Sandbox, type Run } from '#lib/wasm/stepwise.js';
import { benchPrograms } from './bench-programs.ts';

initSync({ module: readFileSync(new URL('../wasm/stepwise_bg.wasm', import.meta.url)) });

/** The text of a file of `web/levels/`. */
function levelFile(name: string): string {
	return readFileSync(new URL(`../../../levels/${name}.toml`, import.meta.url), 'utf8');
}

/** The steps a program that never ends runs in these tests. */
const FOREVER = 500;

/** Runs a program up to its end, or up to `FOREVER` steps for one that never ends. */
function finish(run: Run): void {
	for (let step = 0; step < FOREVER && run.line !== undefined; step += 1) {
		run.step();
	}
}

const level = new Level(levelFile('paint-a-square'));
const sandbox = new Sandbox(levelFile('sandbox'));
afterAll(() => {
	level.free();
	sandbox.free();
});

const MAPS: Record<string, (text: string) => Run> = {
	'paint-a-square': (text) => level.start(0, text),
	sandbox: (text) => sandbox.start(text)
};

describe.each(Object.entries(MAPS))('the programs of the bench on the map of %s', (map, start) => {
	it.each(benchPrograms(map).map((program) => [program.name, program]))(
		'%s has no error, a title, and stops on no error but the one it shows',
		(name, { text, fails }) => {
			expect(check(text)).toEqual([]);
			expect(hasMessage(`bench-program-${name}`)).toBe(true);
			using run = start(text);
			finish(run);
			const outcome = run.outcome();
			if (fails) {
				expect(outcome?.type === 'failed' && outcome.error.kind.code).toBe(fails);
			} else {
				expect(outcome?.type).not.toBe('failed');
			}
			if (name === 'walk') expect(run.line).toBeDefined();
		}
	);
});

it('gives the programs that fit any map to the map of another level', () => {
	expect(benchPrograms('another-level').map(({ name }) => name)).toEqual(['turns', 'walk']);
});
