// The store of this browser, opened once when the application starts, and what the page knows
// of it.

import { openStore } from './store.ts';

/**
 * Whether the browser refuses to save: found when the store opens, or at the first save that
 * fails. A banner says so (shell/storage-banner.svelte; see Error handling in specs.md).
 */
export const saving = $state({ refused: false });

/** What Stepwise keeps in this browser. */
export const store = openStore(
	() => window.localStorage,
	() => {
		saving.refused = true;
	}
);
