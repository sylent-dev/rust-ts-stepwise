import { describe, expect, it } from 'vitest';
import type { Robot, StepEvent } from '#lib/core.ts';
import { actionTime, isAnimated, poseAt, restingPose, type Motion } from './motion.ts';
import { worldOf } from './test-support.ts';

describe('isAnimated', () => {
	it('animates a move, a turn and a tool put down', () => {
		const events: StepEvent[] = [
			'moved',
			'turned-left',
			'turned-right',
			'started-painting',
			'started-erasing'
		];
		expect(events.filter(isAnimated)).toEqual(events);
	});

	it('moves the line on at once after a line without action or a tool lifted', () => {
		const events: StepEvent[] = ['nothing', 'printed', 'stopped-painting', 'stopped-erasing'];
		expect(events.filter(isAnimated)).toEqual([]);
	});
});

describe('actionTime', () => {
	it('takes 300 ms up to the normal speed, then 80 % of a step, and nothing at Instant', () => {
		expect([1, 2, 5, 20, Infinity].map(actionTime)).toEqual([300, 300, 160, 40, 0]);
	});
});

describe('poseAt', () => {
	const robot: Robot = { position: { x: 1, y: 2 }, direction: 'north', carrying: false };
	const after = (changes: Partial<Robot>) => worldOf(['...'], { ...robot, ...changes });

	it('rests the robot on its cell, facing its direction', () => {
		expect(restingPose({ ...robot, direction: 'west' })).toEqual({ x: 1, y: 2, angle: 270 });
	});

	it('slides the robot to the next cell', () => {
		const motion: Motion = { action: 'moved', after: after({ position: { x: 1, y: 1 } }) };
		expect(poseAt(robot, motion, 0)).toEqual({ x: 1, y: 2, angle: 0 });
		expect(poseAt(robot, motion, 0.5)).toEqual({ x: 1, y: 1.5, angle: 0 });
		expect(poseAt(robot, motion, 1)).toEqual({ x: 1, y: 1, angle: 0 });
	});

	it('turns the robot a quarter, either way, past north', () => {
		const left: Motion = { action: 'turned-left', after: after({ direction: 'west' }) };
		const right: Motion = { action: 'turned-right', after: after({ direction: 'east' }) };
		expect(poseAt(robot, left, 1).angle).toBeCloseTo(-90, 9);
		expect(poseAt(robot, right, 1).angle).toBeCloseTo(90, 9);
		expect(poseAt({ ...robot, direction: 'west' }, right, 1).angle).toBeCloseTo(360, 9);
	});

	it('keeps the robot on its cell while it puts a tool down', () => {
		const motion: Motion = { action: 'started-erasing', after: after({}) };
		expect(poseAt(robot, motion, 0.5)).toEqual(restingPose(robot));
	});
});
