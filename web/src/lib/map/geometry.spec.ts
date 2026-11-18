import { describe, expect, it } from 'vitest';
import { cellAt, isFloor, paintAt, placedCells, placedFloors } from './geometry.ts';
import { worldOf } from './test-support.ts';

describe('placedCells', () => {
	it('places the cells row by row from the top left', () => {
		const places = placedCells(worldOf(['.#', 'o.', '..'])).map(({ x, y, cell }) => [
			x,
			y,
			cell.type
		]);
		expect(places).toEqual([
			[0, 0, 'floor'],
			[1, 0, 'wall'],
			[0, 1, 'floor'],
			[1, 1, 'floor'],
			[0, 2, 'floor'],
			[1, 2, 'floor']
		]);
	});
});

describe('placedFloors', () => {
	it('keeps the floor cells alone, with their places', () => {
		const places = placedFloors(worldOf(['.#', '#o'])).map(({ x, y, cell }) => [x, y, cell.item]);
		expect(places).toEqual([
			[0, 0, false],
			[1, 1, true]
		]);
	});
});

describe('cellAt', () => {
	const world = worldOf(['..#', '.o.']);

	it('finds a cell by its column and its row', () => {
		expect(cellAt(world, { x: 2, y: 0 })).toEqual({ type: 'wall' });
		expect(cellAt(world, { x: 1, y: 1 })).toEqual({ type: 'floor', item: true });
	});

	it('finds nothing outside the map, on each side', () => {
		for (const at of [
			{ x: -1, y: 0 },
			{ x: 3, y: 0 },
			{ x: 0, y: -1 },
			{ x: 0, y: 2 }
		]) {
			expect(cellAt(world, at)).toBeUndefined();
		}
	});
});

describe('isFloor', () => {
	it('tells a floor from a wall, outside the map counting as a wall', () => {
		const world = worldOf(['.#']);
		expect(isFloor(world, { x: 0, y: 0 })).toBe(true);
		expect(isFloor(world, { x: 1, y: 0 })).toBe(false);
		expect(isFloor(world, { x: 2, y: 0 })).toBe(false);
	});
});

describe('paintAt', () => {
	it('gives the color of a painted cell, and nothing for another cell', () => {
		const world = worldOf(['..#']);
		world.cells[0] = { type: 'floor', item: false, paint: { color: 'blue', passages: [] } };
		expect(paintAt(world, { x: 0, y: 0 })).toBe('blue');
		expect(paintAt(world, { x: 1, y: 0 })).toBeUndefined();
		expect(paintAt(world, { x: 2, y: 0 })).toBeUndefined();
		expect(paintAt(world, { x: 9, y: 0 })).toBeUndefined();
	});
});
