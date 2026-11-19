import { describe, expect, it } from 'vitest';
import type { Outcome, Robot, RuntimeErrorKind, StepEvent } from '#lib/core.ts';
import {
	actionTime,
	isAnimated,
	poseAt,
	restingPose,
	robotFailure,
	type Action,
	type Motion
} from './motion.ts';
import { worldOf } from './test-support.ts';

describe('isAnimated', () => {
	it('animates a move, a turn, a tool put down and an item', () => {
		const events: StepEvent[] = [
			'moved',
			'turned-left',
			'turned-right',
			'started-painting',
			'started-erasing',
			'picked-up',
			'dropped'
		];
		expect(events.filter(isAnimated)).toEqual(events);
	});

	it('moves the line on at once after a line without action or a tool lifted', () => {
		const events: StepEvent[] = ['nothing', 'printed', 'stopped-painting', 'stopped-erasing'];
		expect(events.filter(isAnimated)).toEqual([]);
	});
});

describe('robotFailure', () => {
	const failed = (kind: RuntimeErrorKind): Outcome => ({
		type: 'failed',
		error: { span: { line: 1, from: 0, to: 9 }, kind }
	});

	it('gives the errors of the robot that the map shows', () => {
		const codes = [
			'bump',
			'already-carrying',
			'no-item-here',
			'not-carrying',
			'item-already-here'
		] as const;
		expect(codes.map((code) => robotFailure(failed({ code })))).toEqual(codes);
	});

	it('gives nothing for another error, a run that ended well, or one that still runs', () => {
		expect(robotFailure(failed({ code: 'division-by-zero' }))).toBeUndefined();
		expect(robotFailure({ type: 'passed' })).toBeUndefined();
		expect(robotFailure(undefined)).toBeUndefined();
	});
});

describe('actionTime', () => {
	const SPEEDS = [1, 2, 5, 20, Infinity];
	const times = (action: Action) => SPEEDS.map((rate) => actionTime(action, rate));

	it('takes 300 ms for a move up to the normal speed, then 80 % of a step', () => {
		expect(times('moved')).toEqual([300, 300, 160, 40, 0]);
	});

	it('takes 400 ms for an item up to the normal speed, then 80 % of a step', () => {
		expect(times('picked-up')).toEqual([400, 400, 160, 40, 0]);
	});

	it('keeps the whole time of an error of the robot at every animated speed', () => {
		expect(times('bump')).toEqual([450, 450, 450, 450, 0]);
		expect(times('no-item-here')).toEqual([650, 650, 650, 650, 0]);
	});
});

describe('poseAt', () => {
	const robot: Robot = { position: { x: 1, y: 2 }, direction: 'north', carrying: false };
	const after = (changes: Partial<Robot>) => worldOf(['...'], { ...robot, ...changes });
	/** The motion of an action that leaves the robot where it stands. */
	const still = (action: Action): Motion => ({ action, after: after({}) });

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
		expect(poseAt(robot, still('started-erasing'), 0.5)).toEqual(restingPose(robot));
	});

	it('steps the robot back a quarter of a cell to pick up an item, then back onto its cell', () => {
		const motion = still('picked-up');
		expect(poseAt(robot, motion, 0)).toEqual(restingPose(robot));
		// Facing north, it steps back toward the south.
		expect(poseAt(robot, motion, 0.5)).toEqual({ x: 1, y: 2.25, angle: 0 });
		expect(poseAt(robot, motion, 1)).toEqual(restingPose(robot));
	});

	it('sends the robot against the border of its cell in a bump, then back shaking', () => {
		const motion = still('bump');
		expect(poseAt(robot, motion, 0.3)).toEqual({ x: 1, y: 1.8, angle: 0 });
		const shaking = [0.4, 0.5, 0.6].map((t) => poseAt(robot, motion, t).angle);
		expect(shaking.some((angle) => Math.abs(angle) > 2)).toBe(true);
		expect(shaking.every((angle) => Math.abs(angle) <= 8)).toBe(true);
		expect(poseAt(robot, motion, 1).y).toBe(2);
		expect(poseAt(robot, motion, 1).angle).toBeCloseTo(0, 9);
	});

	it('steps the robot back on a pick_up() that fails, back onto its cell, then shakes it', () => {
		const motion = still('no-item-here');
		expect(poseAt(robot, motion, 0.3)).toEqual({ x: 1, y: 2.25, angle: 0 });
		expect(poseAt(robot, motion, 0.6)).toEqual(restingPose(robot));
		expect(Math.abs(poseAt(robot, motion, 0.7).angle)).toBeGreaterThan(2);
		expect(poseAt(robot, motion, 1).angle).toBeCloseTo(0, 9);
	});
});
