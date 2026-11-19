// What the tests of what is saved share: a storage in memory, in place of the one of a browser.
// Used by the tests alone.

import type { Backend } from './store.ts';

/**
 * A storage in memory, which answers as `localStorage` does. It starts with the texts of `held`,
 * by their keys, and `held` follows what is saved and removed.
 */
export function memoryBackend(
	held: Record<string, string> = {}
): Backend & { held: Record<string, string> } {
	return {
		held,
		getItem: (key) => held[key] ?? null,
		setItem: (key, value) => {
			held[key] = value;
		},
		removeItem: (key) => {
			delete held[key];
		}
	};
}
