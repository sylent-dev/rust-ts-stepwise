// What Stepwise keeps in a browser (see Local files in specs.md): everything is in its
// `localStorage`, under keys starting with `stepwise.`, each value with the version of its shape.
// Nothing here throws: a browser that refuses to save is reported, and Stepwise goes on without
// it (see Error handling in specs.md). Nothing here knows what is saved either: each kind of data
// reads its own fields (lib/settings/saved-settings.ts).

/** What a store needs of `localStorage`; a test gives its own. */
export type Backend = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** What is saved under a name: its fields, beside the version of their shape. */
export type Saved = Readonly<Record<string, unknown>>;

/** The data of Stepwise in a browser, each kind under its name: `settings`. */
export interface Store {
	/**
	 * What is saved under a name, when it has this version. Nothing saved, a value that can't be
	 * read and a value of another version all give `undefined`: the defaults are then used, and
	 * the value stays where it is until the next save replaces it.
	 */
	read(name: string, version: number): Saved | undefined;
	/**
	 * Saves fields under a name, with the version of their shape. A browser that refuses is
	 * reported by the store (`onRefused` of `openStore`), never to the caller.
	 */
	write(name: string, version: number, fields: object): void;
}

/** The key of `localStorage` that holds what is saved under a name: `stepwise.settings`. */
export function keyOf(name: string): string {
	return `stepwise.${name}`;
}

/** A key written then removed when the store opens, to know whether the browser saves. */
const PROBE = keyOf('probe');

/** Whether a value read is an object with fields, as every value saved is. */
function isSaved(value: unknown): value is Saved {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Opens the store of a browser. `open` gives its `localStorage`, and may throw: a browser that
 * blocks the storage refuses even to hand it. `onRefused` is called when the browser refuses to
 * save: while the store opens, when the storage is blocked or already full, then at each save
 * that fails. What was saved before the storage filled up is still read.
 */
export function openStore(open: () => Backend, onRefused: () => void): Store {
	let backend: Backend | undefined;
	try {
		backend = open();
		backend.setItem(PROBE, '');
		backend.removeItem(PROBE);
	} catch {
		onRefused();
	}
	return {
		read(name, version) {
			try {
				const saved: unknown = JSON.parse(backend?.getItem(keyOf(name)) ?? 'null');
				return isSaved(saved) && saved.version === version ? saved : undefined;
			} catch {
				return undefined;
			}
		},
		write(name, version, fields) {
			// Without a storage at all, the refusal was reported when the store opened.
			if (!backend) return;
			try {
				// The version last: no field can take its place.
				backend.setItem(keyOf(name), JSON.stringify({ ...fields, version }));
			} catch {
				onRefused();
			}
		}
	};
}
