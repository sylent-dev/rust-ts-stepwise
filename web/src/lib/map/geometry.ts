// Where things stand on the map, in the units of the drawings of the world elements: a cell is
// 64 units wide, as each drawing (see Look of the world in specs.md). The map scales them all to
// the size of its cells.

import type { Cell, Color, Direction, Point, World } from '#lib/core.ts';

/** The side of a cell, in the units of the drawings. */
export const CELL = 64;

/** The middle of a cell, from its top left corner. */
export const MIDDLE = CELL / 2;

/** The neighbor of a cell in each direction, as a column and a row from that cell. */
export const STEPS: Readonly<Record<Direction, Point>> = {
	north: { x: 0, y: -1 },
	east: { x: 1, y: 0 },
	south: { x: 0, y: 1 },
	west: { x: -1, y: 0 }
};

/** A floor cell, which may hold a paint and an item. */
export type Floor = Extract<Cell, { type: 'floor' }>;

/** A cell with its place. */
export interface PlacedCell<Kind extends Cell = Cell> extends Point {
	cell: Kind;
}

/** The cells of a world with their places, row by row from the top left. */
export function placedCells(world: World): PlacedCell[] {
	return world.cells.map((cell, index) => ({
		x: index % world.width,
		y: Math.floor(index / world.width),
		cell
	}));
}

/** The floor cells of a world with their places, row by row from the top left. */
export function placedFloors(world: World): PlacedCell<Floor>[] {
	return placedCells(world).flatMap(({ x, y, cell }) =>
		cell.type === 'floor' ? [{ x, y, cell }] : []
	);
}

/** The cell at a place, or nothing outside the map, which counts as a wall. */
export function cellAt(world: World, { x, y }: Point): Cell | undefined {
	const inside = x >= 0 && y >= 0 && x < world.width && y < world.height;
	return inside ? world.cells[y * world.width + x] : undefined;
}

/** Whether the cell at a place is a floor: a wall, and outside the map, are not. */
export function isFloor(world: World, at: Point): boolean {
	return cellAt(world, at)?.type === 'floor';
}

/** The color of the paint of the cell at a place, if it has some. */
export function paintAt(world: World, at: Point): Color | undefined {
	const cell = cellAt(world, at);
	return cell?.type === 'floor' ? cell.paint?.color : undefined;
}
