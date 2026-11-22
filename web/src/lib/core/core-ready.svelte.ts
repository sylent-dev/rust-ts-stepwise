// The core, for a screen that needs it (see core.ts).

import { loadFailed } from '#lib/page/startup.svelte.ts';
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
 * An object to free (a level, the program of a screen and its run), kept for the component that
 * calls this as it starts: `current` is what `make` gives, made again when what `make` reads
 * changes, and nothing while it gives nothing. Every object that `make` gave is freed: once
 * another one has replaced it, the next time the effects run, and once the component leaves.
 * Nothing may call it afterwards.
 *
 * A `$derived` makes its object when it is read, and an effect runs once per batch: an object
 * read, then replaced before the effects ran, is one that no effect ever saw. So what `make` gave
 * is remembered here, rather than left to what an effect read.
 *
 * A cleanup reads no signal: the function an `$effect` returns, or `onDestroy`. Svelte gives a
 * signal there the value it had before the changes of the batch, so that a cleanup undoes what
 * its effect did with that value (tried with Svelte 5.57). Two rules follow. One cleanup reads a
 * signal all the same, and says why it may: the one of the editor (editor/code-editor.svelte).
 *
 * - Never read `current`, nor what is derived from it (the playground of a screen), in a
 *   cleanup: Svelte computes it again, from the values of before. `make` runs once more, for an
 *   object that nothing frees, and `current` may stop following what `make` reads. An effect
 *   reads first what its cleanup will need: a value taken from the object (a name, a text), not
 *   the object, which may be freed by the time that cleanup runs.
 * - The `free` of an object kept here runs in such a cleanup: it reads plain fields alone,
 *   never a `$state` nor a `$derived`, by itself or by what it calls. What it frees has no value
 *   of before: read in a signal, it would be freed twice, or never (`Playback` keeps its run in
 *   a plain field, and what the screen follows of it in a signal of its own).
 */
export function kept<T extends { free(): void }>(
	make: () => T | undefined
): { readonly current: T | undefined } {
	/** What `make` gave that nothing freed yet. */
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- a cleanup reads it, where a signal gives its value of before the batch: it must be plain
	const made = new Set<T>();
	const object = $derived.by(() => {
		const next = make();
		if (next) made.add(next);
		return next;
	});
	// Once the screen follows: every object but the one it shows now has been replaced.
	$effect(() => {
		const current = object;
		for (const one of made) {
			if (one === current) continue;
			made.delete(one);
			one.free();
		}
	});
	// Once the component leaves: the one it showed, and any that came after the last effect.
	$effect(() => () => {
		for (const one of made) one.free();
		made.clear();
	});
	return {
		get current() {
			return object;
		}
	};
}

/**
 * An object that stays in the module of the core (a level, the sandbox), for the component that
 * calls this as it starts: `current` is nothing until the core is ready, then what `make` gives,
 * kept and freed as `kept` says, with its two rules.
 */
export function fromCore<T extends { free(): void }>(
	make: () => T
): { readonly current: T | undefined } {
	const core = coreReady();
	return kept(() => (core.ready ? make() : undefined));
}
