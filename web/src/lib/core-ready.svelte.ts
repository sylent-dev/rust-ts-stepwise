// The core, for a screen that needs it (see core.ts).

import { loadCore } from './core.ts';
import { loadFailed } from './startup.ts';

/**
 * Starts loading the core and says when it is ready: `ready` is false until then, and follows it
 * in a component. A core that can't load: the page itself says so, in place of the screen.
 */
export function coreReady(): { readonly ready: boolean } {
	let ready = $state(false);
	loadCore().then(() => (ready = true), loadFailed);
	return {
		get ready() {
			return ready;
		}
	};
}
