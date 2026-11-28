import { describe, expect, it } from 'vitest';
import {
	isOpen,
	levelsDone,
	levelToPlay,
	mapsPassedWith,
	mapToTry,
	NOT_STARTED,
	passedEvery,
	passMap,
	progressOf,
	withLevel,
	type Progress
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

/** The levels of the tests, by their stable names, in their order: numbered 1 to 6. */
const LEVELS = ['a', 'b', 'c', 'd', 'e', 'f'];

/** A progress where the levels of these names are done. */
function doneWith(...names: string[]): Progress {
	return new Map(names.map((name) => [name, level({ 1: SQUARE }, true)]));
}

/** The numbers of the levels of `LEVELS` that are open. */
function openOnes(progress: Progress): number[] {
	return LEVELS.map((_, index) => index + 1).filter((number) => isOpen(progress, LEVELS, number));
}

describe('the levels open', () => {
	it('are the first one alone, for a learner who has done none', () => {
		expect(openOnes(new Map())).toEqual([1]);
	});

	it('are each level done, and the one after it', () => {
		expect(openOnes(doneWith('a', 'b'))).toEqual([1, 2, 3]);
	});

	it('take no map passed for a level done', () => {
		expect(openOnes(new Map([['a', level({ 1: SQUARE })]]))).toEqual([1]);
	});

	it('let the learner go on when a level is added after a level done', () => {
		// The learner had done a to e; a later version adds c, before the d that they did.
		expect(openOnes(doneWith('a', 'b', 'd', 'e'))).toEqual([1, 2, 3, 4, 5, 6]);
	});

	it('keep a level done open, whatever the level before it', () => {
		expect(openOnes(doneWith('d'))).toEqual([1, 4, 5]);
	});

	it('hold no number outside the list', () => {
		const all = doneWith(...LEVELS);
		expect(isOpen(all, LEVELS, 0)).toBe(false);
		expect(isOpen(all, LEVELS, 7)).toBe(false);
	});
});

describe('the level to play before a level locked', () => {
	it('is the last level open before it', () => {
		expect(levelToPlay(doneWith('a', 'b'), LEVELS, 5)).toBe(3);
		expect(levelToPlay(doneWith('a', 'b'), LEVELS, 4)).toBe(3);
		expect(levelToPlay(new Map(), LEVELS, 6)).toBe(1);
	});

	it('is the level open just before it, even when a level further on is done', () => {
		expect(levelToPlay(doneWith('d'), LEVELS, 3)).toBe(1);
		expect(levelToPlay(doneWith('d'), LEVELS, 6)).toBe(5);
	});

	it('is nothing for a level open, or outside the list', () => {
		expect(levelToPlay(doneWith('a', 'b'), LEVELS, 3)).toBeUndefined();
		expect(levelToPlay(new Map(), LEVELS, 1)).toBeUndefined();
		expect(levelToPlay(new Map(), LEVELS, 0)).toBeUndefined();
		expect(levelToPlay(new Map(), LEVELS, 7)).toBeUndefined();
	});
});

describe('the levels done', () => {
	it('count the levels of the list that are done, among how many there are', () => {
		expect(levelsDone(new Map(), LEVELS)).toEqual({ done: 0, total: 6 });
		expect(levelsDone(doneWith('a', 'c'), LEVELS)).toEqual({ done: 2, total: 6 });
	});

	it('leave out a level that the list no longer has, and a level not done', () => {
		const progress = new Map([...doneWith('a', 'gone'), ['b', level({ 1: SQUARE })]]);
		expect(levelsDone(progress, LEVELS).done).toBe(1);
	});
});
