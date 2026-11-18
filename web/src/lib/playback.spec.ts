// A program played on the map through the module the page loads, its frames given by the tests.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { initSync, Sandbox } from '#lib/wasm/stepwise.js';
import { Playback, type PlaybackOptions } from './playback.svelte.ts';

initSync({ module: readFileSync(new URL('./wasm/stepwise_bg.wasm', import.meta.url)) });

/** A corridor of four cells, the robot on the first one, facing east. */
const CORRIDOR = `version = 1
starting_code = ''

[map]
terrain = '....'
robot = { at = [0, 0], facing = "east" }
`;

/** Plays `program` in the corridor, at the normal speed: 2 steps per second, 300 ms an action. */
function play(program: string, options?: PlaybackOptions): Playback {
	const sandbox = new Sandbox(CORRIDOR);
	return new Playback(() => sandbox.start(program), options);
}

describe('a program played on the map', () => {
	it('animates an action, the line staying lit until it has ended', () => {
		const playback = play('forward()\nturn_right()\n');
		playback.play();
		expect(playback.tick(0)).toBe(true);
		expect(playback.motion?.action).toBe('moved');
		expect(playback.world.robot.position).toEqual({ x: 0, y: 0 });
		expect(playback.line).toBe(1);
		playback.tick(150);
		expect(playback.progress).toBe(0.5);
		expect(playback.line).toBe(1);
		playback.tick(300);
		expect(playback.motion).toBeUndefined();
		expect(playback.world.robot.position).toEqual({ x: 1, y: 0 });
		expect(playback.line).toBe(2);
		// The robot rests until the next step, at the first frame 500 ms after the first one.
		playback.tick(450);
		expect(playback.motion).toBeUndefined();
		playback.tick(510);
		expect(playback.motion?.action).toBe('turned-right');
		playback.tick(810);
		expect(playback.world.robot.direction).toBe('south');
		expect({ line: playback.line, ended: playback.ended, steps: playback.steps }).toEqual({
			line: undefined,
			ended: true,
			steps: 2
		});
		expect(playback.tick(826)).toBe(false);
		expect(playback.running).toBe(false);
	});

	it('moves the line on at once after a step without action', () => {
		const playback = play('let steps = 1\nstop_painting()\nforward()\n');
		playback.play();
		playback.tick(0);
		expect({ line: playback.line, motion: playback.motion }).toEqual({
			line: 2,
			motion: undefined
		});
		playback.tick(510);
		expect({ line: playback.line, motion: playback.motion }).toEqual({
			line: 3,
			motion: undefined
		});
	});

	it('lets the action under way end after a pause, and runs nothing more', () => {
		const playback = play('forward()\nforward()\n');
		playback.play();
		playback.tick(0);
		playback.pause();
		expect(playback.tick(100)).toBe(true);
		expect(playback.tick(300)).toBe(false);
		expect(playback.world.robot.position).toEqual({ x: 1, y: 0 });
		expect(playback.tick(1000)).toBe(false);
		expect(playback.steps).toBe(1);
	});

	it('plays the action of Step as at the slowest speed, even at Instant', () => {
		const playback = play('forward()\nforward()\n');
		playback.rate = Infinity;
		playback.step();
		expect(playback.motion?.action).toBe('moved');
		// The action starts at the frame that draws it first.
		playback.tick(1000);
		playback.tick(1150);
		expect(playback.progress).toBe(0.5);
		expect(playback.tick(1300)).toBe(false);
		expect({ line: playback.line, steps: playback.steps }).toEqual({ line: 2, steps: 1 });
	});

	it('ends the action under way at once on another Step', () => {
		const playback = play('forward()\nforward()\n');
		playback.step();
		playback.tick(0);
		playback.step();
		expect(playback.world.robot.position).toEqual({ x: 1, y: 0 });
		expect(playback.motion?.after.robot.position).toEqual({ x: 2, y: 0 });
	});

	it('ends the action under way when the next step is due before it has ended', () => {
		const playback = play('forward()\nforward()\n', { timeAt: () => 800 });
		playback.play();
		playback.tick(0);
		playback.tick(510);
		expect(playback.world.robot.position).toEqual({ x: 1, y: 0 });
		expect(playback.motion?.after.robot.position).toEqual({ x: 2, y: 0 });
	});

	it('runs the steps at Instant without animation', () => {
		const playback = play('repeat 3:\n    forward()\n', { now: () => 0 });
		playback.rate = Infinity;
		playback.play();
		expect(playback.tick(0)).toBe(false);
		expect(playback.motion).toBeUndefined();
		expect(playback.world.robot.position).toEqual({ x: 3, y: 0 });
		expect({ ended: playback.ended, steps: playback.steps }).toEqual({ ended: true, steps: 7 });
	});

	it('puts the map back to its start on Reset, and on Run once ended', () => {
		const playback = play('forward()\n');
		const start = playback.world;
		playback.play();
		playback.tick(0);
		playback.reset();
		expect(playback.world).toEqual(start);
		expect({ line: playback.line, steps: playback.steps, motion: playback.motion }).toEqual({
			line: 1,
			steps: 0,
			motion: undefined
		});
		playback.play();
		playback.tick(0);
		playback.tick(300);
		expect(playback.ended).toBe(true);
		playback.play();
		expect({ position: playback.world.robot.position, line: playback.line }).toEqual({
			position: { x: 0, y: 0 },
			line: 1
		});
	});
});
