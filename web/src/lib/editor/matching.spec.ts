import { beforeAll, describe, expect, it } from 'vitest';
import { loadTestCore } from '#lib/core/test-support.ts';
import { litParentheses, matchingPair, matchingParentheses } from './matching.ts';
import { stateOf } from './test-support.ts';

beforeAll(loadTestCore);

/**
 * The pair found in a line where `|` marks the cursor, shown under the line without the cursor:
 * `^` under each parenthesis of the pair, nothing when there is none. For lines whose characters
 * are one unit of the editor each.
 */
function pairAt(marked: string): string {
	const line = marked.replace('|', '');
	const pair = matchingPair(line, marked.indexOf('|'));
	const under = Array.from({ length: line.length }, (_, at) => (pair?.includes(at) ? '^' : ' '));
	return under.join('').trimEnd();
}

describe('the pair that the cursor touches', () => {
	it('is the one of the parenthesis just before the cursor', () => {
		expect(pairAt('forward(|)')).toBe('       ^^');
		expect(pairAt('forward()|')).toBe('       ^^');
		expect(pairAt('print(count(|red))')).toBe('           ^   ^');
	});

	it('is the one of the parenthesis just after the cursor otherwise', () => {
		expect(pairAt('forward|()')).toBe('       ^^');
		expect(pairAt('print(count(red|))')).toBe('           ^   ^');
	});

	it('is the one before the cursor between two parentheses', () => {
		expect(pairAt('print(count(red)|)')).toBe('           ^   ^');
		expect(pairAt('print(|(1 + 2) * 3)')).toBe('     ^           ^');
	});

	it('goes over the pairs written inside it', () => {
		expect(pairAt('print|((1 + 2) * (3 + 4))')).toBe('     ^                 ^');
		expect(pairAt('print((1 + 2) * (3 + 4))|')).toBe('     ^                 ^');
	});

	it('is none away from a parenthesis', () => {
		expect(pairAt('for|ward()')).toBe('');
		expect(pairAt('|')).toBe('');
		expect(pairAt('forward() |')).toBe('');
	});

	it('is none for a parenthesis that has no match', () => {
		expect(pairAt('print(|')).toBe('');
		expect(pairAt('forward()|)')).toBe('       ^^');
		expect(pairAt('forward())|')).toBe('');
	});

	it('leaves out a parenthesis of a text', () => {
		expect(pairAt('print(|"Done :)")')).toBe('     ^         ^');
		expect(pairAt('print("Done :)|")')).toBe('');
		expect(pairAt('print("(" + name + ")")|')).toBe('     ^                ^');
	});

	it('leaves out a parenthesis of a comment', () => {
		expect(pairAt('forward(|)  # twice (see below)')).toBe('       ^^');
		expect(pairAt('forward()  # twice (|see below)')).toBe('');
	});

	it('counts in the units of the editor, where an emoji is two', () => {
		const line = 'print("🤖" + name())';
		const pair = matchingPair(line, line.indexOf('(', 6) + 1);

		expect(pair).toStrictEqual([17, 18]);
		expect(line.slice(17, 19)).toBe('()');
	});
});

describe('the parentheses lit in the editor', () => {
	it('are the pair of the line of the cursor, placed in the document', () => {
		const state = stateOf('repeat 2:\n    print(count(red)|)', matchingParentheses);

		expect(litParentheses(state).map((at) => state.doc.sliceString(at, at + 1))).toStrictEqual([
			'(',
			')'
		]);
		expect(litParentheses(state)).toStrictEqual([25, 29]);
	});

	it('are never looked for in another line', () => {
		expect(litParentheses(stateOf('print(|\n)'))).toStrictEqual([]);
	});

	it('are none while a text is selected', () => {
		expect(litParentheses(stateOf('forward|()|'))).toStrictEqual([]);
	});

	it('follow the cursor and the code', () => {
		const state = stateOf('forward()|\nback', matchingParentheses);
		const away = state.update({ selection: { anchor: state.doc.length } }).state;
		const typed = away.update(away.replaceSelection('()')).state;

		expect(state.field(matchingParentheses).size).toBe(2);
		expect(away.field(matchingParentheses).size).toBe(0);
		expect(typed.field(matchingParentheses).size).toBe(2);
	});
});
