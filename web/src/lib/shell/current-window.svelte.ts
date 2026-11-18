// The window of the browser as it is now, followed as it changes: its size, what it shows, and
// where it stands on its screen.

import { on } from 'svelte/events';
import { createSubscriber, MediaQuery } from 'svelte/reactivity';
import { innerHeight, innerWidth } from 'svelte/reactivity/window';
import { windowFit, type WindowFit, type WindowPlace } from './window-size.ts';

/** Whether the browser shows the page alone, without its bars. */
const fullScreen = new MediaQuery('(display-mode: fullscreen)');

/**
 * How long after a window changed the browser knows its new size with its bars, in
 * milliseconds. Measured in Chromium: the old size while the browser says that the window
 * changed, the new one from the next task on; a little more is left to a slower computer.
 */
const PLACE_SETTLES = 100;

/**
 * Follows the place of the window on its screen: read when the window changes, then once more
 * a moment later, when the browser has caught up. Nothing else says that it has.
 */
const followPlace = createSubscriber((update) => {
	let settled: ReturnType<typeof setTimeout> | undefined;
	const stop = on(window, 'resize', () => {
		update();
		clearTimeout(settled);
		settled = setTimeout(update, PLACE_SETTLES);
	});
	return () => {
		stop();
		clearTimeout(settled);
	};
});

/**
 * The window of the browser. Its sizes are in pixels of the page: the zoom of the browser counts,
 * as it does for what fits in the window.
 */
export const currentWindow = {
	get width(): number {
		return innerWidth.current ?? 0;
	},
	get height(): number {
		return innerHeight.current ?? 0;
	},
	/**
	 * What it shows: the screen, or the message of a window too small. What acts on the screen
	 * (a run, a shortcut, a panel over it) stops while the screen doesn't show.
	 */
	get fit(): WindowFit {
		return windowFit(this.width, this.height);
	},
	/** Where it stands on its screen: whether it can still grow there. */
	get place(): WindowPlace {
		followPlace();
		return {
			outerWidth: window.outerWidth,
			outerHeight: window.outerHeight,
			availWidth: screen.availWidth,
			availHeight: screen.availHeight,
			fullScreen: fullScreen.current
		};
	}
};
