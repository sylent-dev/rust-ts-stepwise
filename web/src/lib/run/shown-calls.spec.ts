// What the variables panel shows of a program played on the map, through the module the page
// loads: the calls in progress, the one shown and its variables.

import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { Sandbox } from '#lib/core/core.ts';
import { corridor, loadTestCore, sandboxOf } from '#lib/core/test-support.ts';
import { NORMAL_SPEED } from './pace.ts';
import { type Frames, Playback, type PlaybackOptions } from './playback.svelte.ts';

loadTestCore();

const sandbox = new Sandbox(sandboxOf(corridor('....')));
afterAll(() => {
	sandbox.free();
});

/** The speed, which a test makes **Instant**. */
let rate: number;
beforeEach(() => {
	rate = NORMAL_SPEED;
});

/** No frame comes by itself: a test gives each one, by calling `tick`. */
const noFrames: Frames = () => () => {};

/** Plays `program` in the corridor, its frames given by the test. */
function play(program: string, options?: PlaybackOptions): Playback {
	return new Playback(
		{ world: sandbox.world(), start: () => sandbox.start(program) },
		{ rate: () => rate, frames: noFrames, ...options }
	);
}

/** Runs a **Step** at a time, the first one starting the program, until `line` is lit. */
function stepTo(playback: Playback, line: number): void {
	for (let steps = 0; steps < 100; steps += 1) {
		playback.step();
		if (playback.line === line) return;
	}
	throw new Error(`the line ${String(line)} is never lit`);
}

/**
 * What the panel shows, written short: each call as its function and its line, the index of the
 * one shown, and its variables, those that the last step changed after a `*`.
 */
function shown(playback: Playback) {
	const { calls, shown, variables } = playback.calls;
	return {
		calls: calls.map((call) => `${call.function ?? 'main'} · ${String(call.line)}`),
		shown,
		variables: variables.map(
			(variable) => `${variable.changed ? '*' : ''}${variable.name}=${variable.value.text}`
		)
	};
}

/** A square of two sides, each painted by a call. */
const SQUARE = `function paint_side(length):
    let done = 0
    done = done + length

function paint_square(side):
    paint_side(side)
    paint_side(side + 1)

let sides = 4
paint_square(3)
print(sides)
`;

/** Two squares of one side each. */
const SQUARES = `function paint_side(length):
    let done = length

function paint_square(side):
    paint_side(side)

paint_square(3)
paint_square(4)
`;

/** A walk of one cell, the last line of a function. */
const WALK = `function walk(steps):
    let done = steps
    forward()

let n = 1
walk(n)
`;

describe('the calls that the variables panel shows', () => {
	it('are none at rest, then the main program from its first line', () => {
		using playback = play(SQUARE);
		expect(shown(playback)).toEqual({ calls: [], shown: undefined, variables: [] });
		playback.step();
		expect(shown(playback)).toEqual({ calls: ['main · 9'], shown: 0, variables: [] });
		playback.step();
		expect(shown(playback)).toEqual({ calls: ['main · 10'], shown: 0, variables: ['*sides=4'] });
	});

	it('follow the call being run, step after step', () => {
		using playback = play(SQUARE);
		stepTo(playback, 2);
		expect(shown(playback)).toEqual({
			calls: ['main · 10', 'paint_square · 6', 'paint_side · 2'],
			shown: 2,
			variables: ['*length=3']
		});
		playback.step();
		expect(shown(playback).variables).toEqual(['length=3', '*done=0']);
	});

	it('keep the call chosen while it is in progress, then show the call being run again', () => {
		using playback = play(SQUARE);
		stepTo(playback, 2);
		playback.showCall(1);
		expect(shown(playback)).toMatchObject({ shown: 1, variables: ['side=3'] });
		// The program goes on in the first call of `paint_side`, then in the second one.
		stepTo(playback, 3);
		expect(shown(playback)).toMatchObject({ shown: 1, variables: ['side=3'] });
		stepTo(playback, 2);
		expect(shown(playback)).toEqual({
			calls: ['main · 10', 'paint_square · 7', 'paint_side · 2'],
			shown: 1,
			variables: ['side=3']
		});
		// `paint_square` ends: the main program runs, and is shown.
		stepTo(playback, 11);
		expect(shown(playback)).toEqual({ calls: ['main · 11'], shown: 0, variables: ['sides=4'] });
	});

	it('never take a new call for the one chosen, even when it ended between two reads', () => {
		rate = Infinity;
		const breakpoints = new Set<number>();
		using playback = play(SQUARES, { breakpoints: () => breakpoints, now: () => 0 });
		stepTo(playback, 2);
		playback.showCall(1);
		expect(shown(playback)).toMatchObject({ shown: 1, variables: ['side=3'] });
		// One frame of **Instant** runs to the second call of `paint_side`: the first call of
		// `paint_square` has ended meanwhile, and the second one stands where it stood.
		breakpoints.add(2);
		playback.play();
		playback.tick(0);
		expect(playback.atBreakpoint).toBe(true);
		expect(shown(playback)).toEqual({
			calls: ['main · 8', 'paint_square · 5', 'paint_side · 2'],
			shown: 2,
			variables: ['*length=4']
		});
	});

	it('follow the program again into its calls once the call being run is chosen', () => {
		using playback = play(SQUARE);
		stepTo(playback, 2);
		playback.showCall(0);
		// The call being run, which waits on its line before it calls `paint_side`.
		stepTo(playback, 7);
		playback.showCall(1);
		playback.step();
		expect(shown(playback)).toMatchObject({ shown: 2, variables: ['*length=4'] });
	});

	it('answer a click while the robot moves with the state of the line lit', () => {
		using playback = play(WALK);
		stepTo(playback, 3);
		playback.showCall(0);
		expect(shown(playback)).toEqual({
			calls: ['main · 6', 'walk · 3'],
			shown: 0,
			variables: ['n=1']
		});
		// The move of the last line of `walk` plays: the core has run it, and ended the call.
		playback.step();
		expect(playback.motion?.action).toBe('moved');
		playback.showCall(1);
		expect(shown(playback)).toEqual({
			calls: ['main · 6', 'walk · 3'],
			shown: 1,
			variables: ['steps=1', '*done=1']
		});
		playback.showCall(0);
		expect(shown(playback)).toEqual({
			calls: ['main · 6', 'walk · 3'],
			shown: 0,
			variables: ['n=1']
		});
		// The move ends: the line of the call is lit again, `walk` has ended.
		playback.tick(0);
		playback.tick(5000);
		expect(playback.motion).toBeUndefined();
		expect(shown(playback)).toEqual({ calls: ['main · 6'], shown: 0, variables: ['n=1'] });
	});

	it('forget the call chosen once the map is put back, and show none until the program starts', () => {
		using playback = play(SQUARE);
		stepTo(playback, 3);
		playback.showCall(0);
		playback.reset();
		expect(shown(playback)).toEqual({ calls: [], shown: undefined, variables: [] });
		stepTo(playback, 2);
		expect(shown(playback)).toMatchObject({ shown: 2, variables: ['*length=3'] });
	});

	it('forget the call chosen when the program starts again', () => {
		using playback = play(SQUARE);
		stepTo(playback, 3);
		playback.showCall(0);
		rate = Infinity;
		playback.play();
		playback.tick(0);
		expect(playback.status).toBe('ended');
		playback.step();
		stepTo(playback, 2);
		expect(shown(playback)).toMatchObject({ shown: 2, variables: ['*length=3'] });
	});

	it('keep the state of the end once the program has stopped, each call still chosen', () => {
		using playback = play('function divide(n):\n    print(1 / n)\n\nlet n = 0\ndivide(n)\n');
		stepTo(playback, 2);
		playback.step();
		expect(playback.status).toBe('failed');
		expect(shown(playback)).toEqual({
			calls: ['main · 5', 'divide · 2'],
			shown: 1,
			variables: ['n=0']
		});
		playback.showCall(0);
		expect(shown(playback)).toMatchObject({ shown: 0, variables: ['n=0'] });
	});

	it('give a text as a program writes it, its first 200 characters, and say that it is cut', () => {
		using playback = play(`let line = "a\\"b"\nlet long = "${'x'.repeat(300)}"\nprint(1)\n`);
		stepTo(playback, 3);
		const [line, long] = playback.calls.variables;
		expect(line?.value).toEqual({ type: 'text', text: '"a\\"b"', cut: false });
		expect(long?.value).toEqual({ type: 'text', text: `"${'x'.repeat(199)}`, cut: true });
	});
});
