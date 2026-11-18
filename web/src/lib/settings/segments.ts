// Where the fill of a row of segments stands (segments.svelte): under the segment of the value
// chosen, from the widths that the browser gives. Nothing here touches the page.

/** The place of the fill, in pixels. */
export interface Fill {
	/** Its distance from the left edge of the first segment. */
	left: number;
	width: number;
}

/**
 * The place of the fill under the segment `chosen` (from 0), from the widths of the segments
 * from left to right. Nothing when no segment is chosen, or while the browser hasn't measured
 * that segment and the ones before it.
 */
export function fillAt(widths: readonly (number | undefined)[], chosen: number): Fill | undefined {
	let left = 0;
	for (const [index, width] of widths.entries()) {
		if (width === undefined) return undefined;
		if (index === chosen) return { left, width };
		left += width;
	}
	return undefined;
}
