import { describe, expect, it } from 'vitest';
import type { Outcome, Robot, RuntimeErrorKind, StepEvent } from '#lib/core.ts';
import {
	actionTime,
	isAnimated,
	isRunEnd,
	poseAt,
	restingPose,
	robotFailure,
	runEnd,
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

describe('runEnd', () => {
	it('gives the end of a run on a map of a level, every goal met or not', () => {
		expect(runEnd({ type: 'passed' })).toBe('passed');
		expect(runEnd({ type: 'goals-not-met', goals: [{ type: 'carrying' }] })).toBe('goals-not-met');
		expect(isRunEnd('passed') && isRunEnd('goals-not-met')).toBe(true);
		expect(isRunEnd('moved') || isRunEnd('bump')).toBe(false);
	});

	it('gives nothing for the sandbox, an error, or a run under way', () => {
		const failed: Outcome = {
			type: 'failed',
			error: { span: { line: 1, from: 0, to: 9 }, kind: { code: 'bump' } }
		};
		expect([{ type: 'ended' } as const, failed, undefined].map(runEnd)).toEqual([
			undefined,
			undefined,
			undefined
		]);
	});
});

describe('actionTime', () => {
	const SPEEDS = [1, 2, 5, 20, Infinity];
	const times = (action: Action, lessMotion = false) =>
		SPEEDS.map((rate) => actionTime(action, rate, lessMotion));

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

	it('keeps the whole time of the end of a run at every animated speed', () => {
		expect(times('passed')).toEqual([900, 900, 900, 900, 0]);
		expect(times('goals-not-met')).toEqual([900, 900, 900, 900, 0]);
	});

	it('takes no time with less motion for an action that fails and the end of a run', () => {
		expect(times('item-already-here', true)).toEqual([0, 0, 0, 0, 0]);
		expect(times('passed', true)).toEqual([0, 0, 0, 0, 0]);
		// The moves, the items and the bump keep their time.
		expect(times('turned-left', true)).toEqual([300, 300, 160, 40, 0]);
		expect(times('dropped', true)).toEqual([400, 400, 160, 40, 0]);
		expect(times('bump', true)).toEqual([450, 450, 450, 450, 0]);
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

	it('hops the robot once when every goal is met, then rests it on the floor', () => {
		const motion = still('passed');
		expect(poseAt(robot, motion, 0)).toEqual({ ...restingPose(robot), lift: 0 });
		expect(poseAt(robot, motion, 0.275).lift).toBeCloseTo(1, 9);
		expect(poseAt(robot, motion, 0.7)).toEqual(restingPose(robot));
	});

	it('shakes the head of the robot when a goal is not met, wider than an error', () => {
		const motion = still('goals-not-met');
		const angles = Array.from(
			{ length: 61 },
			(_, index) => poseAt(robot, motion, index / 100).angle
		);
		expect(Math.max(...angles.map(Math.abs))).toBeGreaterThan(8);
		expect(angles.every((angle) => Math.abs(angle) <= 12)).toBe(true);
		expect(poseAt(robot, motion, 0.6).angle).toBeCloseTo(0, 9);
		expect(poseAt(robot, motion, 1)).toEqual(restingPose(robot));
	});

	describe('with less motion', () => {
		const calm = (action: Action, changes: Partial<Robot> = {}): Motion => ({
			action,
			after: after(changes),
			lessMotion: true
		});
		const shares = Array.from({ length: 101 }, (_, index) => index / 100);

		it('turns the robot without going past its end', () => {
			const motion = calm('turned-right', { direction: 'east' });
			const angles = shares.map((t) => poseAt(robot, motion, t).angle);
			expect(angles.every((angle, index) => angle >= (angles[index - 1] ?? 0))).toBe(true);
			expect(Math.max(...angles)).toBeCloseTo(90, 9);
		});

		it('keeps the robot on its cell to pick up an item, or when it fails to', () => {
			for (const action of ['picked-up', 'dropped', 'no-item-here', 'item-already-here'] as const) {
				expect(shares.map((t) => poseAt(robot, calm(action), t))).toEqual(
					shares.map(() => restingPose(robot))
				);
			}
		});

		it('sends the robot against the border of its cell in a bump, without a shake', () => {
			const motion = calm('bump');
			expect(poseAt(robot, motion, 0.3)).toEqual({ x: 1, y: 1.8, angle: 0 });
			expect(shares.every((t) => poseAt(robot, motion, t).angle === 0)).toBe(true);
		});

		it('neither hops nor shakes its head at the end of a run', () => {
			for (const action of ['passed', 'goals-not-met'] as const) {
				expect(shares.map((t) => poseAt(robot, calm(action), t))).toEqual(
					shares.map(() => restingPose(robot))
				);
			}
		});
	});
});
