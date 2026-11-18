import { describe, expect, it } from 'vitest';
import { fiveLines, wallFaces, wallShadow, type Rect } from './ground.ts';
import { worldOf } from './test-support.ts';

describe('wallFaces', () => {
	it('gives a wall a rim under a floor and an edge above one', () => {
		const world = worldOf(['#.#', '###', '..#']);
		expect(wallFaces(world, { x: 1, y: 1 })).toEqual({ rim: true, edge: true });
		expect(wallFaces(world, { x: 0, y: 1 })).toEqual({ rim: false, edge: true });
		expect(wallFaces(world, { x: 2, y: 1 })).toEqual({ rim: false, edge: false });
	});

	it('takes outside the map for a wall', () => {
		const world = worldOf(['#', '.', '#']);
		expect(wallFaces(world, { x: 0, y: 0 })).toEqual({ rim: false, edge: true });
		expect(wallFaces(world, { x: 0, y: 2 })).toEqual({ rim: true, edge: false });
	});
});

describe('fiveLines', () => {
	/** The lines of a map as the cells that draw them and the side each draws. */
	function sides(rows: string[]): string[] {
		return fiveLines(worldOf(rows)).map(({ x, y, width, height }: Rect) => {
			const [column, row] = [Math.floor(x / 64), Math.floor(y / 64)];
			const side =
				height === 64 ? (x % 64 === 0 ? 'west' : 'east') : y % 64 === 0 ? 'north' : 'south';
			expect(Math.min(width, height)).toBe(2.25);
			return `${column},${row} ${side}`;
		});
	}

	it('draws a line between the fifth and the sixth columns, half on each', () => {
		expect(sides(['......'])).toEqual(['4,0 east', '5,0 west']);
	});

	it('counts the rows from the bottom', () => {
		const rows = ['.', '.', '.', '.', '.', '.'];
		expect(sides(rows)).toEqual(['0,0 south', '0,1 north']);
	});

	it('lays the line of a fifth cell that ends the map along its border', () => {
		expect(sides(['.....'])).toEqual(['4,0 east']);
		expect(sides(['.', '.', '.', '.', '.'])).toEqual(['0,0 north']);
	});

	it('draws nothing on a wall', () => {
		expect(sides(['....#.'])).toEqual(['5,0 west']);
	});

	it('draws nothing on a map smaller than five cells', () => {
		expect(sides(['....', '....'])).toEqual([]);
	});
});

describe('wallShadow', () => {
	it('moves the wall 10 units toward the bottom left', () => {
		const { x, y, width, height } = wallShadow({ x: 2, y: 1 });
		expect(Math.hypot(128 - x, y - 64)).toBeCloseTo(10);
		expect(128 - x).toBeCloseTo(y - 64);
		expect([width, height]).toEqual([64, 64]);
	});
});
