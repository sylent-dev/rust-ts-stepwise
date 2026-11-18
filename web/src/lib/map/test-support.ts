// What the tests of the map share: a world written as it is drawn. Used by the tests alone.

import type { Cell, Robot, World } from '#lib/core.ts';

/**
 * A world from its rows, one character per cell: `#` a wall, `.` a floor, `o` a floor with an
 * item. The robot stands at the top left, facing east, unless told otherwise.
 */
export function worldOf(
	rows: readonly string[],
	robot: Robot = { position: { x: 0, y: 0 }, direction: 'east', carrying: false }
): World {
	const cells = rows.flatMap((row) =>
		[...row].map((char): Cell =>
			char === '#' ? { type: 'wall' } : { type: 'floor', item: char === 'o' }
		)
	);
	return { width: rows[0]?.length ?? 0, height: rows.length, cells, robot };
}
