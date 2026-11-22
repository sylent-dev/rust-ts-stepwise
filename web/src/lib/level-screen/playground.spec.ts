// What a level screen plays on, read from a level and from the sandbox through the module the
// page loads.

import { afterAll, describe, expect, it } from 'vitest';
import { Level, Sandbox, type Outcome, type Run } from '#lib/core/core.ts';
import { loadTestCore } from '#lib/core/test-support.ts';
import { SANDBOX } from '#lib/levels/levels.ts';
import { levelPlayground, sandboxPlayground } from './playground.ts';

loadTestCore();

/**
 * A level of two corridors whose goal is to stand on a cell: two steps east of the robot on the
 * first map, one step west of it on the second.
 */
const level = new Level(`version = 1
starting_code = '''
# Walk to the mark
'''

[[maps]]
terrain = '....'
robot = { at = [0, 0], facing = "east" }

[maps.goals]
robot_at = [2, 0]

[[maps]]
terrain = '.....'
robot = { at = [4, 0], facing = "west" }

[maps.goals]
robot_at = [3, 0]
`);
/** A corridor without goal. */
const sandbox = new Sandbox(`version = 1
starting_code = '''
# Try anything
'''

[map]
terrain = '...'
robot = { at = [0, 0], facing = "east" }
`);
afterAll(() => {
	level.free();
	sandbox.free();
});

/** Runs a program up to its end, and says how it ended. */
function finish(run: Run): Outcome | undefined {
	while (run.line !== undefined) run.step();
	return run.outcome();
}

describe('the playground of a map of a level', () => {
	it('holds the name given, the starting code of the level, and the world and the goals of the map', () => {
		const second = levelPlayground('walk-to-the-mark', level, 1);
		expect(second?.name).toBe('walk-to-the-mark');
		expect(second?.startingCode).toBe('# Walk to the mark\n');
		expect(second?.world).toEqual(level.maps()[1]?.world);
		expect(second?.world.width).toBe(5);
		expect(second?.goals?.robotAt).toEqual({ x: 3, y: 0 });
	});

	it('starts a program on its map, with the goals of that map', () => {
		// One step forward meets the goal of the second map, not the one of the first.
		using onFirst = levelPlayground('walk-to-the-mark', level, 0)?.start('forward()\n');
		using onSecond = levelPlayground('walk-to-the-mark', level, 1)?.start('forward()\n');
		expect(onFirst && finish(onFirst)?.type).toBe('goals-not-met');
		expect(onSecond && finish(onSecond)?.type).toBe('passed');
		expect(onSecond?.world().robot.position).toEqual({ x: 3, y: 0 });
	});

	it('starts a program when `start` is called on its own, away from the playground', () => {
		const first = levelPlayground('walk-to-the-mark', level, 0);
		if (!first) throw new Error('the level has a first map');
		const { start } = first;
		using run = start('forward()\nforward()\n');
		expect(finish(run)?.type).toBe('passed');
	});

	it('keeps its world at rest while a program runs', () => {
		const first = levelPlayground('walk-to-the-mark', level, 0);
		using run = first?.start('forward()\n');
		run?.step();
		expect(run?.world().robot.position).toEqual({ x: 1, y: 0 });
		expect(first?.world.robot.position).toEqual({ x: 0, y: 0 });
	});

	it('gives nothing for a place without map', () => {
		for (const place of [2, -1, 0.5, Number.NaN]) {
			expect(levelPlayground('walk-to-the-mark', level, place), String(place)).toBeUndefined();
		}
	});
});

describe('the playground of the sandbox', () => {
	const playground = sandboxPlayground(sandbox);

	it('holds the name of the sandbox, its starting code and its world, without goal', () => {
		expect(playground.name).toBe(SANDBOX);
		expect(playground.startingCode).toBe('# Try anything\n');
		expect(playground.world).toEqual(sandbox.world());
		expect(playground.goals).toBeUndefined();
	});

	it('starts a program on its map, which ends without goal to meet', () => {
		// On its own, as the program of the screen calls it.
		const { start } = playground;
		using run = start('forward()\n');
		expect(finish(run)?.type).toBe('ended');
		expect(run.world().robot.position).toEqual({ x: 1, y: 0 });
		expect(playground.world.robot.position).toEqual({ x: 0, y: 0 });
	});
});
