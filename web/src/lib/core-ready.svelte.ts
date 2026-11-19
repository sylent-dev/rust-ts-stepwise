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

/**
 * An object that stays in the module of the core (a level, the sandbox), for the component that
 * calls this as it starts: `current` is nothing until the core is ready, then what `make` gives,
 * made again when what `make` reads changes. The object is freed once another one replaces it,
 * and once the component leaves: nothing may call it afterwards.
 */
export function fromCore<T extends { free(): void }>(
	make: () => T
): { readonly current: T | undefined } {
	const core = coreReady();
	const object = $derived(core.ready ? make() : undefined);
	$effect(() => {
		const made = object;
		return () => made?.free();
	});
	return {
		get current() {
			return object;
		}
	};
}
