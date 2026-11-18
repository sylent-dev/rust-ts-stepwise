// The size of the cells of a map in its block: as large as the block allows, up to the size the
// drawings were made for (see Level screen in specs.md: no zoom, no scrolling).

import type { World } from '#lib/core.ts';

/** The largest side of a cell, in pixels: the drawings at their own size, 64 units. */
export const LARGEST_CELL = 64;

/**
 * The side of a cell, in whole pixels, for the whole map to fit in a box of `width` by `height`
 * pixels: whole pixels put the edges of the cells on the pixels of the screen, so that two walls
 * side by side meet without a seam. Nothing fits in a box too small for a cell of one pixel.
 */
export function cellSide(
	{ width, height }: { width: number; height: number },
	map: Pick<World, 'width' | 'height'>
): number {
	const side = Math.min(width / map.width, height / map.height, LARGEST_CELL);
	return Math.max(Math.floor(side), 0);
}
