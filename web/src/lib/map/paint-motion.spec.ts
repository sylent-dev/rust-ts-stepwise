// The paint of the map while a step runs, from the worlds that the core gives before and after it.

import { describe, expect, it } from 'vitest';
import { Sandbox, type Point, type World } from '#lib/core/core.ts';
import { corridor, loadTestCore, sandboxOf } from '#lib/core/test-support.ts';
import type { Rect } from './ground.ts';
import { isAnimated, poseAt, type Motion } from './motion.ts';
import {
	aheadOfBack,
	fadeOut,
	laidStroke,
	paintMotion,
	paintParts,
	ringAt
} from './paint-motion.ts';

loadTestCore();

/** A row of three floor cells, the robot on the first one, facing east, with these paints. */
function rowOf(paints: string): string {
	return sandboxOf(corridor('...', `paints = [${paints}]\n`));
}

/** The last step of `program` in `sandbox`: the world as it found it, and its motion. */
function lastStep(sandbox: string, program: string): { before: World; motion: Motion } {
	using run = new Sandbox(sandbox).start(program);
	let before = run.world();
	let event = run.step();
	while (run.line !== undefined) {
		before = run.world();
		event = run.step();
	}
	if (!isAnimated(event)) throw new Error(`the last step shows nothing: ${event}`);
	return { before, motion: { action: event, after: run.world() } };
}

const RED_ROW = '{ color = "red", path = [[0, 0], [1, 0], [2, 0]] }';

describe('paintParts', () => {
	it('draws each painted cell whole', () => {
		using sandbox = new Sandbox(rowOf('{ color = "red", path = [[1, 0], [2, 0]] }'));
		expect(paintParts(sandbox.world())).toEqual([
			{ x: 1, y: 0, color: 'red', middle: true, passages: ['east'] },
			{ x: 2, y: 0, color: 'red', middle: true, passages: ['west'] }
		]);
	});
});

describe('paintMotion', () => {
	it('takes the paint the eraser passes over under the robot, the rest of the cell beside it', () => {
		const { before, motion } = lastStep(rowOf(RED_ROW), 'start_erasing()\nforward()\n');
		expect(paintMotion(before, motion.after)).toEqual({
			// The paint ahead stays until the robot reaches it.
			kept: [{ x: 2, y: 0, color: 'red', middle: true, passages: ['west'] }],
			under: [{ x: 1, y: 0, color: 'red', middle: true, passages: ['west'] }],
			beside: [{ x: 1, y: 0, color: 'red', middle: false, passages: ['east'] }],
			repainted: [],
			appearing: []
		});
	});

	it('takes away the paint of a cell put down by the eraser, its middle under the robot', () => {
		const paints = '{ color = "red", path = [[0, 0], [1, 0]] }';
		const { before, motion } = lastStep(rowOf(paints), 'start_erasing()\n');
		expect(paintMotion(before, motion.after)).toEqual({
			kept: [{ x: 1, y: 0, color: 'red', middle: true, passages: ['west'] }],
			under: [{ x: 0, y: 0, color: 'red', middle: true, passages: [] }],
			beside: [{ x: 0, y: 0, color: 'red', middle: false, passages: ['east'] }],
			repainted: [],
			appearing: []
		});
	});

	it('takes away the old color of a cell painted over, its new one beside the robot under it', () => {
		const paints = '{ color = "blue", path = [[1, 0], [2, 0]] }';
		const { before, motion } = lastStep(rowOf(paints), 'start_painting(red)\nforward()\n');
		expect(paintMotion(before, motion.after)).toEqual({
			kept: [
				{ x: 0, y: 0, color: 'red', middle: true, passages: [] },
				{ x: 2, y: 0, color: 'blue', middle: true, passages: ['west'] }
			],
			under: [{ x: 1, y: 0, color: 'blue', middle: true, passages: [] }],
			beside: [{ x: 1, y: 0, color: 'blue', middle: false, passages: ['east'] }],
			// The middle and the passage crossed come with the stroke laid.
			repainted: [{ x: 1, y: 0, color: 'red', middle: false, passages: ['east'] }],
			appearing: []
		});
	});

	it('fades in the halves of a cell erased alone once the brush paints it again', () => {
		const sandbox = sandboxOf(`terrain = '''
....
....
'''
robot = { at = [2, 0], facing = "south" }
paints = [{ color = "red", path = [[1, 0], [2, 0], [3, 0]] }]
`);
		const program =
			'start_erasing()\nforward()\nstart_painting(blue)\nturn_right()\nturn_right()\nforward()\n';
		const { before, motion } = lastStep(sandbox, program);
		expect(paintMotion(before, motion.after).appearing).toEqual([
			{ x: 2, y: 0, color: 'blue', middle: false, passages: ['east', 'west'] }
		]);
	});

	it('keeps the paint a turn or a move without tool passes over', () => {
		for (const program of ['turn_left()\n', 'forward()\n']) {
			const { before, motion } = lastStep(rowOf(RED_ROW), program);
			expect(paintMotion(before, motion.after)).toEqual({
				kept: paintParts(before),
				under: [],
				beside: [],
				repainted: [],
				appearing: []
			});
		}
	});
});

describe('aheadOfBack', () => {
	function contains({ x, y, width, height }: Rect, point: Point): boolean {
		return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;
	}

	it('keeps what lies ahead of the back of the robot, 14 units behind its middle', () => {
		const east = aheadOfBack({ x: 1, y: 0, angle: 90 }, 'east');
		expect(
			[
				{ x: 81, y: 32 },
				{ x: 83, y: 32 },
				{ x: 900, y: -900 }
			].map((point) => contains(east, point))
		).toEqual([false, true, true]);
		const north = aheadOfBack({ x: 0, y: 1.5, angle: 0 }, 'north');
		expect(
			[
				{ x: 32, y: 143 },
				{ x: 32, y: 141 },
				{ x: -900, y: 0 }
			].map((point) => contains(north, point))
		).toEqual([false, true, true]);
	});
});

describe('fadeOut', () => {
	it('fades what goes beside the robot over the last 30 % of the step', () => {
		expect([0, 0.7, 0.85, 1].map(fadeOut)).toEqual([1, 1, expect.closeTo(0.5, 9), 0]);
	});
});

describe('laidStroke', () => {
	it('lays the stroke of the brush from the middle of the cell left to the robot', () => {
		const { before, motion } = lastStep(rowOf(''), 'start_painting(yellow)\nforward()\n');
		const pose = poseAt(before.robot, motion, 0.5);
		expect(laidStroke(before, motion, pose)).toEqual({
			color: 'yellow',
			from: { x: 32, y: 32 },
			to: { x: 64, y: 32 }
		});
	});

	it('lays nothing when the brush is up', () => {
		const { before, motion } = lastStep(rowOf(RED_ROW), 'start_erasing()\nforward()\n');
		expect(laidStroke(before, motion, poseAt(before.robot, motion, 0.5))).toBeUndefined();
	});
});

describe('ringAt', () => {
	it('grows a ring from under the robot as it fades, evenly, in the color of the brush', () => {
		const { before, motion } = lastStep(rowOf(''), 'start_painting(blue)\n');
		expect(ringAt(before, motion, 0.5)).toMatchObject({ radius: 29, width: 3.5, opacity: 0.5 });
		expect(ringAt(before, motion, 0)).toEqual({
			x: 32,
			y: 32,
			tool: 'blue',
			radius: 21,
			width: 6,
			opacity: 1
		});
		expect(ringAt(before, motion, 1)).toEqual({
			x: 32,
			y: 32,
			tool: 'blue',
			radius: 37,
			width: 1,
			opacity: 0
		});
	});

	it('draws the ring of the eraser in its own gray, and none for a move', () => {
		const erasing = lastStep(rowOf(''), 'start_erasing()\n');
		expect(ringAt(erasing.before, erasing.motion, 0.5)?.tool).toBe('eraser');
		const moving = lastStep(rowOf(''), 'forward()\n');
		expect(ringAt(moving.before, moving.motion, 0.5)).toBeUndefined();
	});
});
