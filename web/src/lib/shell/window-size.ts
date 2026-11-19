// The smallest window Stepwise is drawn for, what a smaller one shows in place of the screen, and
// what its message tells to do about it (see Error handling in specs.md).

import type { Platform } from '#lib/platform.ts';

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

/**
 * Where a window stands on its screen, as the browser says it: the window with its bars, the
 * room that the system leaves to a window, and whether the page is alone in full screen.
 */
export interface WindowPlace {
	outerWidth: number;
	outerHeight: number;
	availWidth: number;
	availHeight: number;
	fullScreen: boolean;
}

/**
 * What the message of a window too small tells to do: make the window grow, zoom out or go to
 * the full screen, or zoom out alone.
 */
export const WINDOW_ADVICES = ['grow', 'full-screen', 'zoom'] as const;

/** One thing that the message of a window too small tells to do. */
export type WindowAdvice = (typeof WINDOW_ADVICES)[number];

/** The name of the message that tells what to do: `window-advice-full-screen`. */
export function adviceMessage(advice: WindowAdvice): string {
	return `window-advice-${advice}`;
}

/** A browser may round the sizes of a window that fills its screen a pixel or two apart. */
const ROUNDING = 2;

/**
 * What can work for a window too small, and nothing else. A window that already fills its screen
 * can't grow: on a laptop of 1366 × 768, the bars of the browser and of the system leave about
 * 1366 × 650 to the page, and only the zoom and the full screen help. The full screen is told
 * where a sentence can name its key, F11: neither on a Mac nor on a Chromebook, and not once the
 * page is in full screen.
 */
export function windowAdvice(place: WindowPlace, platform: Platform): WindowAdvice {
	if (place.fullScreen) return 'zoom';
	const fills =
		place.outerWidth >= place.availWidth - ROUNDING &&
		place.outerHeight >= place.availHeight - ROUNDING;
	if (!fills) return 'grow';
	return platform === 'other' ? 'full-screen' : 'zoom';
}
