// What the tests of what is saved share: a storage in memory, in place of the one of a browser.
// Used by the tests alone.

import { openStore, type Backend, type Store } from './store.ts';

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
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a test hands and reads what is held as an object, key by key, as `localStorage` shows it
			delete held[key];
		}
	};
}

/**
 * A store over a storage in memory that holds `value` under `key`, or nothing, and what the storage
 * holds, by its keys, as it follows the saves.
 */
export function storeWith(
	key: string,
	value?: string
): { store: Store; held: Record<string, string> } {
	const backend = memoryBackend(value === undefined ? {} : { [key]: value });
	return {
		store: openStore(
			() => backend,
			() => {}
		),
		held: backend.held
	};
}
