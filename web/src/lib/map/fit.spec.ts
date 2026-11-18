import { describe, expect, it } from 'vitest';
import { cellSide, LARGEST_CELL } from './fit.ts';

describe('cellSide', () => {
	const map = { width: 12, height: 8 };

	it('fills the box along the side that limits the map', () => {
		expect(cellSide({ width: 480, height: 1000 }, map)).toBe(40);
		expect(cellSide({ width: 1000, height: 320 }, map)).toBe(40);
	});

	it('keeps whole pixels', () => {
		expect(cellSide({ width: 599, height: 1000 }, map)).toBe(49);
	});

	it('stops at the size of the drawings', () => {
		expect(cellSide({ width: 4000, height: 4000 }, map)).toBe(LARGEST_CELL);
	});

	it('gives nothing to a box too small for a cell of one pixel', () => {
		expect(cellSide({ width: 11, height: 100 }, map)).toBe(0);
		expect(cellSide({ width: 0, height: 0 }, map)).toBe(0);
	});
});
