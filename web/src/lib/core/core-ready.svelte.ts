// The core, for a screen that needs it (see core.ts).

import { loadFailed } from '#lib/page/startup.ts';
import { loadCore } from './core.ts';

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
 *
 * Never read `current`, nor what is derived from it (the playground of a screen), in a cleanup:
 * the function an `$effect` returns, or `onDestroy`. Svelte computes it again there, from the
 * values of before: `make` runs once more, for an object that nothing frees, and `current` may
 * stop following what `make` reads (tried with Svelte 5.57). An effect reads first what its
 * cleanup will need: a value taken from the object (a name, a text), not the object, which may
 * be freed by the time that cleanup runs.
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
