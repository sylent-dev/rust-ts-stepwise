// The window of the browser as it is now, followed as it changes: its size, and what it shows.

import { innerHeight, innerWidth } from 'svelte/reactivity/window';
import { windowFit, type WindowFit } from './window-size.ts';

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
	}
};
