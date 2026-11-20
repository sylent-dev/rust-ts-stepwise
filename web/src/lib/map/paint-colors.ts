// The colors of the paint on the map, as the design tokens that hold them (see Shared by both
// themes in docs/design-system.md). The components that draw paint read them here alone.

import type { Color } from '#lib/core/core.ts';

/** The token of each color of paint: a color of the core without its token doesn't compile. */
export const PAINT_COLORS = {
	red: 'var(--paint-red)',
	yellow: 'var(--paint-yellow)',
	blue: 'var(--paint-blue)'
} as const satisfies Record<Color, string>;

/** What a tool put down is drawn with: the color of a brush, or the gray of the eraser. */
export const TOOL_COLORS = {
	...PAINT_COLORS,
	eraser: 'var(--robot-eyes-dim)'
} as const satisfies Record<Color | 'eraser', string>;
