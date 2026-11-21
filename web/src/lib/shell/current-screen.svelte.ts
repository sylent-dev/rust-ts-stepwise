// The screen of the application, under what may take its place (see Error handling in
// specs.md).

import { currentPage } from '#lib/page/startup.svelte.ts';
import { currentWindow } from './current-window.svelte.ts';

/** The screen of the application. */
export const currentScreen = {
	/**
	 * Whether it shows: no message has taken its place, neither the one of a window too small
	 * nor the one of the page itself. What acts on the screen (a shortcut, a panel over it)
	 * stops while it doesn't show, and reads it here.
	 */
	get shows(): boolean {
		return currentWindow.fit === 'screen' && !currentPage.failed;
	}
};
