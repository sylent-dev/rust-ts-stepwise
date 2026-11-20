// The colors of the paint on the map, as the design tokens that hold them (see Shared by both
// themes in docs/design-system.md). The components that draw paint read them here alone.

import type { Color } from '#lib/core/core.ts';
import type { Ring } from './paint-motion.ts';

/**
 * The token of each color of paint, named after it: a color of the core without its token
 * doesn't compile, nor one that reads the token of another color.
 */
export const PAINT_COLORS = {
	red: 'var(--paint-red)',
	yellow: 'var(--paint-yellow)',
	blue: 'var(--paint-blue)'
} as const satisfies { [Name in Color]: `var(--paint-${Name})` };

/**
 * What the ring of a tool put down is drawn with: the color of a brush, or the gray of the
 * eraser. Its keys are what a ring may hold.
 */
export const TOOL_COLORS = {
	...PAINT_COLORS,
	eraser: 'var(--robot-eyes-dim)'
} as const satisfies Record<Ring['tool'], string>;
