import { describe, expect, it } from 'vitest';
import {
	mapsPassedWith,
	mapToTry,
	NOT_STARTED,
	passedEvery,
	passMap,
	progressOf,
	withLevel
} from './progress.ts';
import { level } from './test-support.ts';

const SQUARE = 'repeat 4:\n    forward()\n';
const OTHER = 'forward()\n';

describe('the progress of a level', () => {
	it('is not started for a level that no map has passed', () => {
		expect(progressOf(new Map(), 'paint-a-square')).toBe(NOT_STARTED);
		expect(NOT_STARTED).toEqual({ done: false, passed: new Map() });
	});

	it('keeps the code that passed a map', () => {
		expect(passMap(NOT_STARTED, 2, SQUARE, 3)).toEqual(level({ 2: SQUARE }));
	});

	it('replaces the code that passed a map before', () => {
		expect(passMap(level({ 1: OTHER }), 1, SQUARE, 2)).toEqual(level({ 1: SQUARE }));
	});

	it('is done once every map has passed with the same code', () => {
		const first = passMap(NOT_STARTED, 1, SQUARE, 2);
		expect(first.done).toBe(false);
		expect(passMap(first, 2, SQUARE, 2).done).toBe(true);
	});

	it('is done at once for a level of one map', () => {
		expect(passMap(NOT_STARTED, 1, SQUARE, 1).done).toBe(true);
	});

	it('is not done while a map passed with another code', () => {
		expect(passMap(level({ 1: OTHER }), 2, SQUARE, 2).done).toBe(false);
	});

	it('stays done once a map passes with another code', () => {
		const done = level({ 1: SQUARE, 2: SQUARE }, true);
		expect(passMap(done, 1, OTHER, 2)).toEqual(level({ 1: OTHER, 2: SQUARE }, true));
	});
});

describe('the progress with a level', () => {
	it('holds the level in place of what it held, the others kept', () => {
		const before = new Map([
			['paint-a-square', level({ 1: OTHER })],
			['two-squares', level({ 2: SQUARE })]
		]);
		const after = withLevel(before, 'paint-a-square', level({ 1: SQUARE }));
		expect(after).toEqual(
			new Map([
				['paint-a-square', level({ 1: SQUARE })],
				['two-squares', level({ 2: SQUARE })]
			])
		);
		expect(before.get('paint-a-square')).toEqual(level({ 1: OTHER }));
	});
});

describe('the maps passed with a code', () => {
	it('are those whose code is the very same text', () => {
		const passed = level({ 1: SQUARE, 2: OTHER, 3: SQUARE });
		expect(mapsPassedWith(passed, SQUARE)).toEqual(new Set([1, 3]));
		expect(mapsPassedWith(passed, OTHER)).toEqual(new Set([2]));
	});

	it('are none once the code has changed, even by a space or a comment', () => {
		const passed = level({ 1: SQUARE });
		expect(mapsPassedWith(passed, `${SQUARE} `)).toEqual(new Set());
		expect(mapsPassedWith(passed, `# Four sides\n${SQUARE}`)).toEqual(new Set());
	});
});

describe('every map passed with a code', () => {
	it('is true once each map of the level has passed with this very code', () => {
		expect(passedEvery(level({ 1: SQUARE, 2: SQUARE }), SQUARE, 2)).toBe(true);
		expect(passedEvery(level({ 1: SQUARE, 2: OTHER }), SQUARE, 2)).toBe(false);
		expect(passedEvery(level({ 1: SQUARE }), SQUARE, 2)).toBe(false);
	});

	it('follows the code, not the level done', () => {
		expect(passedEvery(level({ 1: SQUARE, 2: SQUARE }, true), OTHER, 2)).toBe(false);
	});
});

describe('the map to try', () => {
	it('is the first map not passed', () => {
		expect(mapToTry(new Set([1]), 3)).toBe(2);
		expect(mapToTry(new Set([1, 2]), 3)).toBe(3);
		expect(mapToTry(new Set([3]), 3)).toBe(1);
		expect(mapToTry(new Set([2]), 3)).toBe(1);
	});

	it('is none once every map has passed', () => {
		expect(mapToTry(new Set([1, 2, 3]), 3)).toBeUndefined();
		expect(mapToTry(new Set([1]), 1)).toBeUndefined();
	});
});
