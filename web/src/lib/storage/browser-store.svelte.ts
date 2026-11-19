// The store of this browser, opened once when the application starts, and what the page knows
// of it.

import { openStore } from './store.ts';

const state = $state({ refused: false });

/**
 * Whether the browser refuses to save: found when the store opens, or at the first save that
 * fails. A banner says so (shell/storage-banner.svelte; see Error handling in specs.md). It
 * changes here alone, when the store reports a refusal.
 */
export const saving: Readonly<{ refused: boolean }> = state;

/** What Stepwise keeps in this browser. */
export const store = openStore(
	() => window.localStorage,
	() => {
		state.refused = true;
	}
);
