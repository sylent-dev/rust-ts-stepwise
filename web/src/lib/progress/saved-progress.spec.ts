import { describe, expect, it } from 'vitest';
import { storeWith } from '#lib/storage/test-support.ts';
import { loadProgress, PROGRESS_KEY, saveLevelProgress } from './saved-progress.ts';
import { level } from './test-support.ts';

/** What the storage holds under the key of the progress, read back as an object. */
function heldProgress(held: Record<string, string>): unknown {
	return JSON.parse(held[PROGRESS_KEY] ?? 'null');
}

describe('the progress saved', () => {
	it('is under the key of the progress', () => {
		expect(PROGRESS_KEY).toBe('stepwise.progress');
	});

	it('is nothing at a first visit', () => {
		expect(loadProgress(storeWith(PROGRESS_KEY).store)).toEqual(new Map());
	});

	it('comes back as it was saved, each level under its stable name', () => {
		const { store, held } = storeWith(PROGRESS_KEY);
		saveLevelProgress(store, 'paint-a-square', level({ 1: 'forward()\n', 2: 'forward()\n' }, true));
		saveLevelProgress(store, 'two-squares', level({ 2: 'turn_left()\n' }));

		expect(loadProgress(store)).toEqual(
			new Map([
				['paint-a-square', level({ 1: 'forward()\n', 2: 'forward()\n' }, true)],
				['two-squares', level({ 2: 'turn_left()\n' })]
			])
		);
		expect(heldProgress(held)).toEqual({
			levels: {
				'paint-a-square': { done: true, passed: { 1: 'forward()\n', 2: 'forward()\n' } },
				'two-squares': { done: false, passed: { 2: 'turn_left()\n' } }
			},
			version: 1
		});
	});

	it('replaces the progress of the same level', () => {
		const { store } = storeWith(PROGRESS_KEY);
		saveLevelProgress(store, 'paint-a-square', level({ 1: 'forward()\n' }));
		saveLevelProgress(store, 'paint-a-square', level({ 1: 'turn_left()\n' }));

		expect(loadProgress(store).get('paint-a-square')).toEqual(level({ 1: 'turn_left()\n' }));
	});

	it.each([
		['damaged', '{"levels":{"paint-a-squ'],
		['of another version', '{"levels":{"paint-a-square":{"done":true,"passed":{}}},"version":2}'],
		['levels that are not an object', '{"levels":["paint-a-square"],"version":1}']
	])('is nothing when it can’t be read: %s', (_, value) => {
		expect(loadProgress(storeWith(PROGRESS_KEY, value).store)).toEqual(new Map());
	});

	it('leaves out a level that is not an object, and keeps the others', () => {
		const { store } = storeWith(
			PROGRESS_KEY,
			'{"levels":{"paint-a-square":true,"two-squares":{"done":true,"passed":{}}},"version":1}'
		);
		expect(loadProgress(store)).toEqual(new Map([['two-squares', level({}, true)]]));
	});

	it.each([
		[
			'a level done that is not a boolean',
			'{"done":"yes","passed":{"1":"forward()"}}',
			level({ 1: 'forward()' })
		],
		['maps passed that are not an object', '{"done":true,"passed":["forward()"]}', level({}, true)],
		['a field missing', '{"passed":{"1":"forward()"}}', level({ 1: 'forward()' })],
		[
			'maps whose number or code can’t be read',
			'{"done":false,"passed":{"0":"a","01":"b","-1":"c","1.5":"d","x":"e","2":3,"3":"forward()"}}',
			level({ 3: 'forward()' })
		]
	])('reads a level with %s', (_, saved, expected) => {
		const { store } = storeWith(PROGRESS_KEY, `{"levels":{"paint-a-square":${saved}},"version":1}`);
		expect(loadProgress(store).get('paint-a-square')).toEqual(expected);
	});

	it('keeps the other levels as they were saved, with the fields that it doesn’t know', () => {
		const { store, held } = storeWith(
			PROGRESS_KEY,
			'{"levels":{"two-squares":{"done":true,"passed":{},"opened":true}},"version":1}'
		);
		saveLevelProgress(store, 'paint-a-square', level({ 1: 'forward()' }));

		expect(heldProgress(held)).toEqual({
			levels: {
				'two-squares': { done: true, passed: {}, opened: true },
				'paint-a-square': { done: false, passed: { 1: 'forward()' } }
			},
			version: 1
		});
	});

	it('keeps beside the level saved the fields that it doesn’t know', () => {
		const { store, held } = storeWith(
			PROGRESS_KEY,
			'{"levels":{"paint-a-square":{"done":false,"passed":{},"opened":true}},"version":1}'
		);
		saveLevelProgress(store, 'paint-a-square', level({ 1: 'forward()' }));

		expect(heldProgress(held)).toEqual({
			levels: { 'paint-a-square': { done: false, passed: { 1: 'forward()' }, opened: true } },
			version: 1
		});
	});

	it('takes the place of what can’t be read at the next save', () => {
		const { store } = storeWith(PROGRESS_KEY, '{"levels":{"paint-a-squ');
		saveLevelProgress(store, 'paint-a-square', level({ 1: 'forward()' }));

		expect(loadProgress(store)).toEqual(new Map([['paint-a-square', level({ 1: 'forward()' })]]));
	});
});
