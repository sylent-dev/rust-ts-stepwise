// The window of the browser as it is now, followed as it changes: its size, what it shows, and
// where it stands on its screen.

import { MediaQuery } from 'svelte/reactivity';
import { innerHeight, innerWidth, outerHeight, outerWidth } from 'svelte/reactivity/window';
import { windowFit, type WindowFit, type WindowPlace } from './window-size.ts';

/** Whether the browser shows the page alone, without its bars. */
const fullScreen = new MediaQuery('(display-mode: fullscreen)');

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
		return {
			outerWidth: outerWidth.current ?? 0,
			outerHeight: outerHeight.current ?? 0,
			availWidth: screen.availWidth,
			availHeight: screen.availHeight,
			fullScreen: fullScreen.current
		};
	}
};
