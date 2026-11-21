import { describe, expect, it } from 'vitest';
import { openStore } from '#lib/storage/store.ts';
import { memoryBackend } from '#lib/storage/test-support.ts';
import { forgetCode, loadCode, saveCode } from './saved-code.ts';

/** The key of `localStorage` that holds the code of the levels. */
const KEY = 'stepwise.code';

/** A store over a storage in memory that holds `value` as the code of the levels. */
function storeWith(value?: string) {
	const backend = memoryBackend(value === undefined ? {} : { [KEY]: value });
	return {
		store: openStore(
			() => backend,
			() => {}
		),
		held: backend.held
	};
}

/** What the storage holds under the key of the code, read back as an object. */
function heldCode(held: Record<string, string>): unknown {
	return JSON.parse(held[KEY] ?? 'null');
}

describe('the code saved', () => {
	it('is nothing for a level at a first visit', () => {
		expect(loadCode(storeWith().store, 'paint-a-square')).toBeUndefined();
	});

	it('comes back as it was saved, under the stable name of its level', () => {
		const { store } = storeWith();
		saveCode(store, 'paint-a-square', { text: 'forward()\n' });

		expect(loadCode(store, 'paint-a-square')).toEqual({ text: 'forward()\n' });
		expect(loadCode(store, 'two-squares')).toBeUndefined();
	});

	it('is saved under one key, each level by its name, with the version of its shape', () => {
		const { store, held } = storeWith();
		saveCode(store, 'paint-a-square', { text: 'forward()' });
		saveCode(store, 'sandbox', { text: 'turn_left()' });

		expect(heldCode(held)).toEqual({
			levels: { 'paint-a-square': { text: 'forward()' }, sandbox: { text: 'turn_left()' } },
			version: 1
		});
	});

	it('replaces the code of the same level', () => {
		const { store } = storeWith();
		saveCode(store, 'paint-a-square', { text: 'forward()' });
		saveCode(store, 'paint-a-square', { text: 'turn_left()' });

		expect(loadCode(store, 'paint-a-square')).toEqual({ text: 'turn_left()' });
	});

	it('keeps the code that another tab saved for another level', () => {
		const backend = memoryBackend();
		const here = openStore(
			() => backend,
			() => {}
		);
		const there = openStore(
			() => backend,
			() => {}
		);
		saveCode(here, 'paint-a-square', { text: 'forward()' });
		saveCode(there, 'two-squares', { text: 'turn_left()' });
		saveCode(here, 'paint-a-square', { text: 'back()' });

		expect(loadCode(here, 'two-squares')).toEqual({ text: 'turn_left()' });
	});

	it('forgets the code of a level, and keeps the others', () => {
		const { store, held } = storeWith();
		saveCode(store, 'paint-a-square', { text: 'forward()' });
		saveCode(store, 'sandbox', { text: 'turn_left()' });
		forgetCode(store, 'paint-a-square');

		expect(loadCode(store, 'paint-a-square')).toBeUndefined();
		expect(heldCode(held)).toEqual({ levels: { sandbox: { text: 'turn_left()' } }, version: 1 });
	});

	it.each([
		['a text that isn’t one', '{"levels":{"paint-a-square":{"text":42}},"version":1}'],
		['no text', '{"levels":{"paint-a-square":{}},"version":1}'],
		['a level that isn’t an object', '{"levels":{"paint-a-square":"forward()"},"version":1}'],
		['levels that aren’t an object', '{"levels":["forward()"],"version":1}'],
		['no levels', '{"version":1}'],
		['another version', '{"levels":{"paint-a-square":{"text":"forward()"}},"version":2}'],
		['damaged data', '{"levels":{"paint-a-squ']
	])('is nothing for a level with %s', (_, value) => {
		expect(loadCode(storeWith(value).store, 'paint-a-square')).toBeUndefined();
	});

	it('keeps the code of the other levels beside one that can’t be read', () => {
		const { store } = storeWith(
			'{"levels":{"paint-a-square":{"text":42},"sandbox":{"text":"forward()"}},"version":1}'
		);

		expect(loadCode(store, 'sandbox')).toEqual({ text: 'forward()' });
		saveCode(store, 'two-squares', { text: 'turn_left()' });
		expect(loadCode(store, 'sandbox')).toEqual({ text: 'forward()' });
	});

	// A version of the website may add a field to a level, as its breakpoints, without a new
	// version of the shape: a tab still open on the version before keeps it.
	it('keeps what it doesn’t know of a level beside its text', () => {
		const { store, held } = storeWith(
			'{"levels":{"paint-a-square":{"text":"forward()","breakpoints":[2]}},"version":1}'
		);

		expect(loadCode(store, 'paint-a-square')).toEqual({ text: 'forward()' });
		saveCode(store, 'sandbox', { text: 'turn_left()' });
		expect(heldCode(held)).toEqual({
			levels: {
				'paint-a-square': { text: 'forward()', breakpoints: [2] },
				sandbox: { text: 'turn_left()' }
			},
			version: 1
		});
	});

	it('takes the place of what can’t be read at the next save', () => {
		const { store, held } = storeWith('{"levels":{"paint-a-squ');
		saveCode(store, 'paint-a-square', { text: 'forward()' });

		expect(heldCode(held)).toEqual({
			levels: { 'paint-a-square': { text: 'forward()' } },
			version: 1
		});
	});

	it('says that the browser refuses to save it', () => {
		let refused = 0;
		const store = openStore(
			() => ({
				...memoryBackend(),
				setItem: () => {
					throw new Error('QuotaExceededError');
				}
			}),
			() => (refused += 1)
		);
		refused = 0;
		saveCode(store, 'paint-a-square', { text: 'forward()' });

		expect(refused).toBe(1);
		expect(loadCode(store, 'paint-a-square')).toBeUndefined();
	});
});
