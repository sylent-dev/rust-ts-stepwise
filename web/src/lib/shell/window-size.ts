// The smallest window Stepwise is drawn for, and what a smaller one shows in place of the screen
// (see Error handling in specs.md).

/** The smallest window a screen fits in, in pixels: the size of the windows of the mock-up. */
export const SMALLEST_WINDOW = { width: 1280, height: 720 } as const;

/** Under this width, in pixels, the window is the one of a phone: no zoom makes a screen fit. */
export const PHONE_UNDER = 800;

/**
 * What a window shows: the screen, the message that asks for a larger window, or the one that
 * asks for a computer.
 */
export type WindowFit = 'screen' | 'small' | 'phone';

/** What a window of `width` × `height` pixels shows. */
export function windowFit(width: number, height: number): WindowFit {
	if (width < PHONE_UNDER) return 'phone';
	if (width < SMALLEST_WINDOW.width || height < SMALLEST_WINDOW.height) return 'small';
	return 'screen';
}
