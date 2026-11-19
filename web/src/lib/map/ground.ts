// What the map draws on the ground besides the drawings of the world elements, from its cells
// alone: the faces of the walls, the lines every five cells and the shadows of the walls (see
// Look of the world in specs.md). Everything is in the units of the drawings (geometry.ts).

import type { Point, World } from '#lib/core/core.ts';
import { CELL, isFloor, placedFloors } from './geometry.ts';

/** A rectangle on the map, in the units of the drawings. */
export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * The faces of a wall, a flat hint of height: a light rim at its top when a floor lies above it,
 * a darker edge at its bottom when a floor lies below it. Outside the map counts as a wall.
 */
export function wallFaces(world: World, { x, y }: Point): { rim: boolean; edge: boolean } {
	return { rim: isFloor(world, { x, y: y - 1 }), edge: isFloor(world, { x, y: y + 1 }) };
}

/** The width of a line every five cells: half of it on each side of the edge between two cells. */
const LINE_WIDTH = 4.5;

/**
 * The lines every five cells, counted from the cell at the bottom left, to count the cells more
 * easily: drawn on the floor only, each cell drawing its half of a line along its edge. A line
 * whose fifth cell is the last of the map lies half along its border.
 */
export function fiveLines(world: World): Rect[] {
	const half = LINE_WIDTH / 2;
	return placedFloors(world).flatMap(({ x, y }) => {
		const left = x * CELL;
		const top = y * CELL;
		const fromBottom = world.height - 1 - y;
		const rects: Rect[] = [];
		if (x > 0 && x % 5 === 0) rects.push({ x: left, y: top, width: half, height: CELL });
		if (x % 5 === 4) rects.push({ x: left + CELL - half, y: top, width: half, height: CELL });
		if (fromBottom > 0 && fromBottom % 5 === 0) {
			rects.push({ x: left, y: top + CELL - half, width: CELL, height: half });
		}
		if (fromBottom % 5 === 4) rects.push({ x: left, y: top, width: CELL, height: half });
		return rects;
	});
}

/**
 * How far a wall casts its shadow, 10 units, toward the bottom left: the sun is at the top
 * right, at 45°.
 */
const SHADOW_LENGTH = 10;

/**
 * The shadow of the wall at a place: the wall itself, moved away from the sun. The map keeps it
 * on the floor, and draws the shadows of all the walls as one, so that two of them never make a
 * darker overlap.
 */
export function wallShadow({ x, y }: Point): Rect {
	const offset = SHADOW_LENGTH * Math.SQRT1_2;
	return { x: x * CELL - offset, y: y * CELL + offset, width: CELL, height: CELL };
}
