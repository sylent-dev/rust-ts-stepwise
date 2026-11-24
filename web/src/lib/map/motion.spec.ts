import { describe, expect, it } from 'vitest';
import type { Robot } from '#lib/core/core.ts';
import type { Action } from './actions.ts';
import { poseAt, restingPose, type Motion } from './motion.ts';
import { worldOf } from './test-support.ts';

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
