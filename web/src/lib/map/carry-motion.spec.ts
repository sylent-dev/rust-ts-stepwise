import { describe, expect, it } from 'vitest';
import type { Robot } from '#lib/core.ts';
import { BAY, carryAt, IN_BAY } from './carry-motion.ts';
import { worldOf } from './test-support.ts';

/** The robot on the middle cell of a row, carrying or not, on an item or not. */
function world(carrying: boolean, item: boolean) {
	const robot: Robot = { position: { x: 1, y: 0 }, direction: 'east', carrying };
	return worldOf([item ? '.o.' : '...'], robot);
}

describe('carryAt', () => {
	it('rests the pincer in, the bay and the cell as the world says', () => {
		expect(carryAt(world(true, false), undefined, 0)).toEqual({
			pincer: 0,
			bay: IN_BAY,
			floor: false
		});
		expect(carryAt(world(false, true), 'moved', 0.5)).toEqual({
			pincer: 0,
			bay: undefined,
			floor: true
		});
	});

	it('takes the item of the cell over the robot into the bay, the pincer out', () => {
		const before = world(false, true);
		const at = (t: number) => carryAt(before, 'picked-up', t);
		expect(at(0.2)).toMatchObject({ floor: true, bay: undefined, held: undefined });
		expect(at(0.2).pincer).toBeGreaterThan(0.5);
		// Taken from the cell, ahead of the robot that stepped back, larger as if lifted.
		expect(at(0.4)).toMatchObject({ floor: false, held: { along: -16, size: 1 } });
		expect(at(0.6).held?.size).toBeGreaterThan(0.75);
		expect(at(0.8)).toMatchObject({ floor: false, bay: IN_BAY, held: undefined });
		expect(at(1)).toEqual({ pincer: 0, bay: IN_BAY, floor: false });
	});

	it('brings the item back from the bay and sets it down on the cell', () => {
		const before = world(true, false);
		const at = (t: number) => carryAt(before, 'dropped', t);
		expect(at(0.2)).toMatchObject({ floor: false, bay: IN_BAY, held: undefined });
		expect(at(0.25)).toMatchObject({ bay: undefined, held: { along: BAY, size: IN_BAY } });
		expect(at(0.65)).toMatchObject({ floor: true, bay: undefined, held: undefined });
		expect(at(1)).toEqual({ pincer: 0, bay: undefined, floor: true });
	});

	it('brings the pincer out empty when there is nothing to pick up or to drop', () => {
		for (const action of ['no-item-here', 'not-carrying'] as const) {
			const at = (t: number) => carryAt(world(false, false), action, t);
			expect(at(0.3)).toEqual({ pincer: 1, bay: undefined, floor: false });
			expect(at(0.6).pincer).toBe(0);
		}
	});

	it('swells the full bay when the robot carries an item already', () => {
		const before = world(true, true);
		const at = (t: number) => carryAt(before, 'already-carrying', t);
		expect(at(0.29).bay).toBeCloseTo(IN_BAY * 1.3, 9);
		expect(at(0.29).floor).toBe(true);
		expect(at(0.5).bay).toBe(IN_BAY);
	});

	it('brings the item out of the bay and back into it when the cell has one already', () => {
		const before = world(true, true);
		const at = (t: number) => carryAt(before, 'item-already-here', t);
		expect(at(0.29)).toMatchObject({ bay: undefined, floor: true });
		expect(at(0.29).held?.along).toBeLessThan(0);
		expect(at(0.5)).toMatchObject({ bay: IN_BAY, held: undefined, floor: true });
	});
});
