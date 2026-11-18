import { describe, expect, it } from 'vitest';
import { fillAt } from './segments.ts';

describe('fillAt', () => {
	it('stands under the first segment, from its left edge', () => {
		expect(fillAt([82, 92.5], 0)).toEqual({ left: 0, width: 82 });
	});

	it('stands after the segments before the one chosen, as wide as it', () => {
		expect(fillAt([82, 92.5], 1)).toEqual({ left: 82, width: 92.5 });
		expect(fillAt([40.25, 30.5, 50], 2)).toEqual({ left: 70.75, width: 50 });
	});

	it('doesn’t wait for the segments after the one chosen', () => {
		expect(fillAt([82, undefined], 0)).toEqual({ left: 0, width: 82 });
	});

	it('is nowhere while the segment chosen, or one before it, isn’t measured', () => {
		expect(fillAt([82, undefined], 1)).toBeUndefined();
		expect(fillAt([undefined, 92.5], 1)).toBeUndefined();
		expect(fillAt([], 0)).toBeUndefined();
	});

	it('is nowhere when no segment is chosen', () => {
		expect(fillAt([82, 92.5], -1)).toBeUndefined();
		expect(fillAt([82, 92.5], 2)).toBeUndefined();
	});
});
