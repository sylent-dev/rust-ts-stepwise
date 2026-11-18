import { describe, expect, it, vi } from 'vitest';
import { keyOf, openStore, type Backend } from './store.ts';

/** A storage in memory, with the keys it holds. */
function memory(held: Record<string, string> = {}): Backend & { held: Record<string, string> } {
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

/** A storage that still reads what it holds, and refuses every save: it is full. */
function full(held: Record<string, string> = {}): Backend {
	return {
		...memory(held),
		setItem: () => {
			throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
		}
	};
}

/** The store of a storage, with the calls that report a refusal. */
function open(backend: Backend) {
	const onRefused = vi.fn();
	return { store: openStore(() => backend, onRefused), onRefused };
}

describe('keyOf', () => {
	it('starts every key with the name of Stepwise', () => {
		expect(keyOf('settings')).toBe('stepwise.settings');
	});
});

describe('a store', () => {
	it('reads back the fields it saved, under the key of their name', () => {
		const backend = memory();
		const { store, onRefused } = open(backend);
		expect(store.write('settings', 1, { theme: 'night-desk' })).toBe(true);
		expect(store.read('settings', 1)).toEqual({ theme: 'night-desk', version: 1 });
		expect(Object.keys(backend.held)).toEqual(['stepwise.settings']);
		expect(onRefused).not.toHaveBeenCalled();
	});

	it('keeps the version it is given, whatever the fields say', () => {
		const { store } = open(memory());
		store.write('settings', 2, { version: 7 });
		expect(store.read('settings', 2)).toEqual({ version: 2 });
	});

	it('leaves nothing behind when it opens', () => {
		const backend = memory();
		open(backend);
		expect(backend.held).toEqual({});
	});

	it('reads nothing where nothing was saved', () => {
		expect(open(memory()).store.read('settings', 1)).toBeUndefined();
	});

	it('ignores what was saved with another version, and leaves it there', () => {
		const backend = memory({ 'stepwise.settings': '{"theme":"night-desk","version":2}' });
		expect(open(backend).store.read('settings', 1)).toBeUndefined();
		expect(backend.held['stepwise.settings']).toBe('{"theme":"night-desk","version":2}');
	});

	it.each([
		['damaged', '{"theme":"night-de'],
		['empty', ''],
		['a text', '"night-desk"'],
		['a list', '[1]'],
		['nothing', 'null'],
		['without version', '{"theme":"night-desk"}'],
		['with a version that is a text', '{"theme":"night-desk","version":"1"}']
	])('ignores a value that is %s', (_, value) => {
		const { store, onRefused } = open(memory({ 'stepwise.settings': value }));
		expect(store.read('settings', 1)).toBeUndefined();
		expect(onRefused).not.toHaveBeenCalled();
	});

	it('replaces what it couldn’t read at the next save', () => {
		const { store } = open(memory({ 'stepwise.settings': '{"theme":"night-de' }));
		store.write('settings', 1, { theme: 'day-desk' });
		expect(store.read('settings', 1)).toEqual({ theme: 'day-desk', version: 1 });
	});
});

describe('a store whose browser refuses to save', () => {
	it('reports a storage that the browser doesn’t hand, reads nothing and saves nothing', () => {
		const onRefused = vi.fn();
		const store = openStore(() => {
			throw new DOMException('The operation is insecure.', 'SecurityError');
		}, onRefused);
		expect(onRefused).toHaveBeenCalledOnce();
		expect(store.read('settings', 1)).toBeUndefined();
		expect(store.write('settings', 1, { theme: 'night-desk' })).toBe(false);
		// Reported once, when it opened: a save says nothing more.
		expect(onRefused).toHaveBeenCalledOnce();
	});

	it('reports a browser without storage', () => {
		const onRefused = vi.fn();
		const store = openStore(() => null as unknown as Backend, onRefused);
		expect(onRefused).toHaveBeenCalledOnce();
		expect(store.read('settings', 1)).toBeUndefined();
		expect(store.write('settings', 1, {})).toBe(false);
	});

	it('reports a storage already full as it opens, and still reads what it holds', () => {
		const { store, onRefused } = open(
			full({ 'stepwise.settings': '{"theme":"night-desk","version":1}' })
		);
		expect(onRefused).toHaveBeenCalledOnce();
		expect(store.read('settings', 1)).toEqual({ theme: 'night-desk', version: 1 });
	});

	it('reports the first save that fails, when the storage fills up during a visit', () => {
		const backend = memory();
		const { store, onRefused } = open(backend);
		backend.setItem = () => {
			throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
		};
		expect(onRefused).not.toHaveBeenCalled();
		expect(store.write('settings', 1, { theme: 'night-desk' })).toBe(false);
		expect(onRefused).toHaveBeenCalledOnce();
	});

	it('reads nothing from a storage that throws when it is read', () => {
		const backend: Backend = {
			...memory(),
			getItem: () => {
				throw new DOMException('The operation is insecure.', 'SecurityError');
			}
		};
		expect(open(backend).store.read('settings', 1)).toBeUndefined();
	});
});
