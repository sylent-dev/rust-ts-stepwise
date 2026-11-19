// The programs of the bench, run on their maps through the module the page loads: the page
// deployed must never start a program that has errors, nor show one that stops on an error it
// isn't made for.

import { afterAll, describe, expect, it } from 'vitest';
import { check, Level, Sandbox, type Run } from '#lib/core/core.ts';
import { levelFile, loadTestCore } from '#lib/core/test-support.ts';
import { benchPrograms } from './bench-programs.ts';

loadTestCore();

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
		'%s has no error and stops on no error but the one it shows',
		(name, { text, fails, ends }) => {
			expect(check(text)).toEqual([]);
			using run = start(text);
			finish(run);
			const outcome = run.outcome();
			if (fails) {
				expect(outcome?.type === 'failed' && outcome.error.kind.code).toBe(fails);
			} else {
				expect(outcome?.type).not.toBe('failed');
			}
			if (ends) expect(outcome?.type).toBe(ends);
			if (name === 'walk') expect(run.line).toBeDefined();
		}
	);
});

it('gives the programs that fit any map to the map of another level', () => {
	expect(benchPrograms('another-level').map(({ name }) => name)).toEqual(['turns', 'walk']);
});
