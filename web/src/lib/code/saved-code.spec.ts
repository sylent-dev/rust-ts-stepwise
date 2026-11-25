import { describe, expect, it } from 'vitest';
import { openStore } from '#lib/storage/store.ts';
import { memoryBackend, storeWith } from '#lib/storage/test-support.ts';
import { forgetCode, loadCode, saveCode } from './saved-code.ts';

/** The key of `localStorage` that holds the code of the levels. */
const KEY = 'stepwise.code';

/** What the storage holds under the key of the code, read back as an object. */
function heldCode(held: Record<string, string>): unknown {
	return JSON.parse(held[KEY] ?? 'null');
}

describe('the code saved', () => {
	it('is nothing for a level at a first visit', () => {
		expect(loadCode(storeWith(KEY).store, 'paint-a-square')).toBeUndefined();
	});

	it('comes back as it was saved, under the stable name of its level', () => {
		const { store } = storeWith(KEY);
		saveCode(store, 'paint-a-square', { text: 'forward()\n', breakpoints: [] });

		expect(loadCode(store, 'paint-a-square')).toEqual({ text: 'forward()\n', breakpoints: [] });
		expect(loadCode(store, 'two-squares')).toBeUndefined();
	});

	it('is saved under one key, each level by its name, with the version of its shape', () => {
		const { store, held } = storeWith(KEY);
		saveCode(store, 'paint-a-square', { text: 'forward()', breakpoints: [] });
		saveCode(store, 'sandbox', { text: 'turn_left()', breakpoints: [] });

		expect(heldCode(held)).toEqual({
			levels: {
				'paint-a-square': { text: 'forward()', breakpoints: [] },
				sandbox: { text: 'turn_left()', breakpoints: [] }
			},
			version: 1
		});
	});

	it('replaces the code of the same level', () => {
		const { store } = storeWith(KEY);
		saveCode(store, 'paint-a-square', { text: 'forward()', breakpoints: [] });
		saveCode(store, 'paint-a-square', { text: 'turn_left()', breakpoints: [] });

		expect(loadCode(store, 'paint-a-square')).toEqual({ text: 'turn_left()', breakpoints: [] });
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
		saveCode(here, 'paint-a-square', { text: 'forward()', breakpoints: [] });
		saveCode(there, 'two-squares', { text: 'turn_left()', breakpoints: [] });
		saveCode(here, 'paint-a-square', { text: 'back()', breakpoints: [] });

		expect(loadCode(here, 'two-squares')).toEqual({ text: 'turn_left()', breakpoints: [] });
	});

	it('forgets the code of a level, and keeps the others', () => {
		const { store, held } = storeWith(KEY);
		saveCode(store, 'paint-a-square', { text: 'forward()', breakpoints: [] });
		saveCode(store, 'sandbox', { text: 'turn_left()', breakpoints: [] });
		forgetCode(store, 'paint-a-square');

		expect(loadCode(store, 'paint-a-square')).toBeUndefined();
		expect(heldCode(held)).toEqual({
			levels: { sandbox: { text: 'turn_left()', breakpoints: [] } },
			version: 1
		});
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
		expect(loadCode(storeWith(KEY, value).store, 'paint-a-square')).toBeUndefined();
	});

	it('keeps the code of the other levels beside one that can’t be read', () => {
		const { store } = storeWith(
			KEY,
			'{"levels":{"paint-a-square":{"text":42},"sandbox":{"text":"forward()"}},"version":1}'
		);

		expect(loadCode(store, 'sandbox')).toEqual({ text: 'forward()', breakpoints: [] });
		saveCode(store, 'two-squares', { text: 'turn_left()', breakpoints: [] });
		expect(loadCode(store, 'sandbox')).toEqual({ text: 'forward()', breakpoints: [] });
	});

	it('comes back with its breakpoints', () => {
		const { store, held } = storeWith(KEY);
		saveCode(store, 'paint-a-square', { text: 'forward()\nforward()', breakpoints: [1, 2] });

		expect(loadCode(store, 'paint-a-square')).toEqual({
			text: 'forward()\nforward()',
			breakpoints: [1, 2]
		});
		expect(heldCode(held)).toEqual({
			levels: { 'paint-a-square': { text: 'forward()\nforward()', breakpoints: [1, 2] } },
			version: 1
		});
	});

	// The code saved before step 19 has no breakpoints: the field was added without a new version
	// of the shape, and is read alone.
	it.each([
		['no breakpoints', ''],
		['breakpoints that aren’t a list', ',"breakpoints":3'],
		['breakpoints that are no lines', ',"breakpoints":["2",0,-1,1.5,null]']
	])('comes back without breakpoints from a level with %s', (_, field) => {
		const { store } = storeWith(
			KEY,
			`{"levels":{"paint-a-square":{"text":"forward()"${field}}},"version":1}`
		);

		expect(loadCode(store, 'paint-a-square')).toEqual({ text: 'forward()', breakpoints: [] });
	});

	it('keeps the lines of the breakpoints alone, each once and in order', () => {
		const { store } = storeWith(
			KEY,
			'{"levels":{"paint-a-square":{"text":"forward()","breakpoints":[3,"x",1,3,0]}},"version":1}'
		);

		expect(loadCode(store, 'paint-a-square')).toEqual({ text: 'forward()', breakpoints: [1, 3] });
	});

	// A later version of the website may add a field to a level without a new version of the
	// shape, as the breakpoints were: a tab still open on this version keeps it in the other levels.
	it('keeps what it doesn’t know of the other levels', () => {
		const { store, held } = storeWith(
			KEY,
			'{"levels":{"paint-a-square":{"text":"forward()","folded":[2]}},"version":1}'
		);

		expect(loadCode(store, 'paint-a-square')).toEqual({ text: 'forward()', breakpoints: [] });
		saveCode(store, 'sandbox', { text: 'turn_left()', breakpoints: [] });
		expect(heldCode(held)).toEqual({
			levels: {
				'paint-a-square': { text: 'forward()', folded: [2] },
				sandbox: { text: 'turn_left()', breakpoints: [] }
			},
			version: 1
		});
	});

	it('writes the level saved whole, as this version knows it', () => {
		const { store, held } = storeWith(
			KEY,
			'{"levels":{"paint-a-square":{"text":"forward()","folded":[2]}},"version":1}'
		);
		saveCode(store, 'paint-a-square', { text: 'back()', breakpoints: [] });

		expect(heldCode(held)).toEqual({
			levels: { 'paint-a-square': { text: 'back()', breakpoints: [] } },
			version: 1
		});
	});

	it('takes the place of what can’t be read at the next save', () => {
		const { store, held } = storeWith(KEY, '{"levels":{"paint-a-squ');
		saveCode(store, 'paint-a-square', { text: 'forward()', breakpoints: [] });

		expect(heldCode(held)).toEqual({
			levels: { 'paint-a-square': { text: 'forward()', breakpoints: [] } },
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
		saveCode(store, 'paint-a-square', { text: 'forward()', breakpoints: [] });

		expect(refused).toBe(1);
		expect(loadCode(store, 'paint-a-square')).toBeUndefined();
	});
});
