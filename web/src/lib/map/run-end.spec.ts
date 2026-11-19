import { describe, expect, it } from 'vitest';
import type { Outcome } from '#lib/core/core.ts';
import type { Motion } from './motion.ts';
import { eyesOf, flagSize, hopShadow, missedCells } from './run-end.ts';
import { worldOf } from './test-support.ts';

describe('eyesOf', () => {
	it('lights the eyes when every goal is met, and dims them when one is not', () => {
		expect(eyesOf({ type: 'passed' })).toBe('eyesLit');
		expect(eyesOf({ type: 'goals-not-met', goals: [{ type: 'carrying' }] })).toBe('eyesDim');
	});

	it('leaves the eyes as they are in the sandbox, on an error, and while the run goes on', () => {
		const failed: Outcome = {
			type: 'failed',
			error: { span: { line: 1, from: 0, to: 9 }, kind: { code: 'bump' } }
		};
		expect([{ type: 'ended' } as const, failed, undefined].map(eyesOf)).toEqual([
			undefined,
			undefined,
			undefined
		]);
	});
});

describe('missedCells', () => {
	it('gives each cell of a goal not met once, in the order of the goals', () => {
		const outcome: Outcome = {
			type: 'goals-not-met',
			goals: [
				{ type: 'robot-not-at', at: { x: 3, y: 1 } },
				{ type: 'paint-missing', at: { x: 2, y: 1 }, color: 'red' },
				{ type: 'paint-missing', at: { x: 3, y: 1 }, color: 'red' },
				{ type: 'painted-elsewhere', at: { x: 0, y: 0 } },
				{ type: 'item-missing', at: { x: 1, y: 2 } },
				{ type: 'not-carrying' }
			]
		};
		expect(missedCells(outcome)).toEqual([
			{ x: 3, y: 1 },
			{ x: 2, y: 1 },
			{ x: 0, y: 0 },
			{ x: 1, y: 2 }
		]);
	});

	it('plants no flag for what the robot carries, nor for a run that met its goals', () => {
		expect(missedCells({ type: 'goals-not-met', goals: [{ type: 'carrying' }] })).toEqual([]);
		expect(missedCells({ type: 'passed' })).toEqual([]);
		expect(missedCells(undefined)).toEqual([]);
	});
});

describe('flagSize', () => {
	const notMet: Motion = { action: 'goals-not-met', after: worldOf(['..']) };

	it('plants the flags one after the other, once the head has shaken', () => {
		const sizes = (t: number) => [0, 1].map((index) => flagSize(notMet, t, index, 2));
		expect(sizes(0.6)).toEqual([0, 0]);
		const [first = 0, second = 0] = sizes(0.7);
		expect({ first: first > 0, second }).toEqual({ first: true, second: 0 });
		expect(sizes(0.95)[0]).toBeCloseTo(1, 9);
		expect(sizes(0.95)[1]).toBeCloseTo(1, 9);
	});

	it('bounces a flag a little past its size as it is planted', () => {
		const sizes = Array.from({ length: 36 }, (_, index) =>
			flagSize(notMet, 0.6 + index / 100, 0, 1)
		);
		expect(Math.max(...sizes)).toBeGreaterThan(1);
		expect(Math.max(...sizes)).toBeLessThan(1.1);
	});

	it('plants many flags in a wave, each long enough for its bounce to show', () => {
		const count = 12;
		const size = (t: number, index: number) => flagSize(notMet, t, index, count);
		// The first starts once the head has shaken, and takes 150 ms of the 900 of the end.
		expect(size(0.6, 0)).toBe(0);
		expect(size(0.6 + 1 / 12, 0)).toBeGreaterThan(0.5);
		expect(size(0.6 + 1 / 6, 0)).toBeCloseTo(1, 9);
		// The next ones start before it has ended, and the last one ends with the others.
		expect(size(0.6 + 1 / 12, 1)).toBeGreaterThan(0);
		expect(size(0.75, count - 1)).toBe(0);
		expect(size(0.95, count - 1)).toBeCloseTo(1, 9);
	});

	it.each([1, 2, 3, 12, 40])(
		'plants %i flags after the head has shaken, each in 150 ms at least, all by 95 %%',
		(count) => {
			const indexes = Array.from({ length: count }, (_, index) => index);
			const size = (t: number, index: number) => flagSize(notMet, t, index, count);
			expect(indexes.map((index) => size(0.6, index))).toEqual(indexes.map(() => 0));
			for (const index of indexes) expect(size(0.95, index)).toBeCloseTo(1, 9);
			expect(indexes.map((index) => size(1, index))).toEqual(indexes.map(() => 1));
			// The first flag, as each one, takes 150 ms of the 900 of the end at least.
			expect(size(0.6 + 1 / 6 - 0.01, 0)).toBeLessThan(1.06);
			expect(size(0.6 + 1 / 6 - 0.01, 0)).not.toBe(1);
			// From three flags, the next one starts before the one before it has ended.
			if (count >= 3) expect(size(0.6 + 1 / 6 - 0.01, 1)).toBeGreaterThan(0);
		}
	);

	it('shows every flag at rest, during another action, and with less motion', () => {
		expect(flagSize(undefined, 0, 2, 3)).toBe(1);
		expect(flagSize({ ...notMet, action: 'passed' }, 0, 2, 3)).toBe(1);
		expect(flagSize({ ...notMet, lessMotion: true }, 0, 2, 3)).toBe(1);
	});
});

describe('hopShadow', () => {
	it('moves the shadow away toward the bottom left as the robot rises, lighter', () => {
		expect(hopShadow({ x: 0, y: 0, angle: 0, lift: 1 })).toEqual({ reach: 7, opacity: 0.22 * 0.7 });
		const low = hopShadow({ x: 0, y: 0, angle: 0, lift: 0.5 });
		expect(low?.reach).toBe(3.5);
	});

	it('draws no shadow on the floor, where the robot covers it', () => {
		expect(hopShadow({ x: 0, y: 0, angle: 0 })).toBeUndefined();
		expect(hopShadow({ x: 0, y: 0, angle: 0, lift: 0 })).toBeUndefined();
	});
});
