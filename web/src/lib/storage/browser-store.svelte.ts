// The store of this browser, opened once when the application starts, and what the page knows
// of it.

import { openStore } from './store.ts';

/**
 * Whether the browser refuses to save, and whether the learner hid the banner that says so
 * (shell/storage-banner.svelte). That choice can't be saved either: it holds while the page
 * stays open, from a screen to the next (see Error handling in specs.md).
 */
export const saving = $state({ refused: false, bannerHidden: false });

/** What Stepwise keeps in this browser. */
export const store = openStore(
	() => window.localStorage,
	() => {
		saving.refused = true;
	}
);
