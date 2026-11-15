// The program of the probe, run on the map of the sandbox through the module the page loads:
// the page deployed must never start a program that has errors, nor show one that stops.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import sandboxFile from '../../levels/sandbox.toml?raw';
import { check, initSync, Sandbox, type StepEvent } from '#lib/wasm/stepwise.js';
import { PROBE_PROGRAM } from './probe-program.ts';

initSync({ module: readFileSync(new URL('./wasm/stepwise_bg.wasm', import.meta.url)) });

describe('the program of the probe', () => {
	it('has no error', () => {
		expect(check(PROBE_PROGRAM)).toEqual([]);
	});

	it('walks the robot around the map of the sandbox, back to its start, and goes on', () => {
		using sandbox = new Sandbox(sandboxFile);
		using run = sandbox.start(PROBE_PROGRAM);
		const start = run.world();
		// A lap of the border: a move into each of its cells and a turn at each corner, each
		// of them three steps of the program.
		const moves = 2 * (start.width + start.height) - 4;
		const events: StepEvent[] = [];
		for (let step = 0; step < 3 * (moves + 4); step += 1) {
			events.push(run.step());
		}
		expect(events.filter((event) => event === 'moved')).toHaveLength(moves);
		expect(events.filter((event) => event === 'turned-right')).toHaveLength(4);
		expect(run.world()).toEqual(start);
		expect(run.line).toBe(1);
	});
});
