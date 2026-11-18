import { describe, expect, it } from 'vitest';
import { overshoot, smooth } from './easing.ts';

/** The largest value of a curve, sampled every thousandth of its time. */
function peak(curve: (t: number) => number): number {
	return Math.max(...Array.from({ length: 1001 }, (_, index) => curve(index / 1000)));
}

describe('the curves of the animations', () => {
	it('start at 0 and end at 1', () => {
		for (const curve of [smooth, overshoot]) {
			expect(curve(0)).toBeCloseTo(0, 9);
			expect(curve(1)).toBeCloseTo(1, 9);
		}
	});

	it('move smoothly, as fast at the end as at the start, and never past the end', () => {
		expect(smooth(0.5)).toBe(0.5);
		expect(smooth(0.2)).toBeCloseTo(1 - smooth(0.8), 9);
		expect(peak(smooth)).toBe(1);
	});

	it('overshoot a turn by 5 %, 4.5° of a quarter turn', () => {
		expect(peak(overshoot)).toBeCloseTo(1.05, 3);
		// It leaves at once.
		expect(overshoot(0.1)).toBeGreaterThan(0.2);
	});
});
