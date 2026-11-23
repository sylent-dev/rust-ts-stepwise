// Where a line or a place of the code goes as the code changes: the line of a run that the editor
// shows, and the place of an error that the console lists.

import { type ChangeSpec, EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import { changedBy, followLine, followPlace } from './follow.ts';

/** A program of five lines, the last one empty: lines 1 to 4 and an empty line 5. */
const CODE = 'forward()\nturn_left()\n\nforward()\n';

/** The change that `changes` make in `doc`. */
function change(changes: ChangeSpec, doc = CODE) {
	return changedBy(EditorState.create({ doc }).update({ changes }));
}

/** Where line `number` of `doc` goes once `changes` are made. */
function followed(number: number, changes: ChangeSpec, doc = CODE): number | undefined {
	return followLine(change(changes, doc), number);
}

describe('a line followed as the code changes', () => {
	it('stays on its line when its text changes', () => {
		expect(followed(2, { from: 10, insert: 'x' })).toBe(2);
		expect(followed(2, { from: 15, to: 21 })).toBe(2);
		expect(followed(2, { from: 10, to: 21 })).toBe(2);
	});

	it('goes down with a line added above it, and up with one taken away', () => {
		expect(followed(4, { from: 0, insert: 'turn_right()\n' })).toBe(5);
		expect(followed(4, { from: 0, to: 10 })).toBe(3);
	});

	it('goes down with its text when a line break is typed at its start', () => {
		expect(followed(2, { from: 10, insert: '\n' })).toBe(3);
		expect(followed(1, { from: 0, insert: '\n' })).toBe(2);
	});

	it('goes down with its text when the spaces that start it give way to a break and the same spaces', () => {
		const block = 'repeat 2:\n    forward()\n';
		expect(followed(2, { from: 10, to: 14, insert: '\n    ' }, block)).toBe(3);
		expect(followed(2, { from: 10, to: 12, insert: '\n  ' }, block)).toBe(3);
	});

	it('follows its text written again elsewhere by the same change, as a line moved over it', () => {
		// `turn_left()` on line 2, and line 1 moved down over it as CodeMirror moves it: the line
		// deleted with the break before it, then written again with a break before line 1.
		const moved = [
			{ from: 9, to: 21 },
			{ from: 0, insert: 'turn_left()\n' }
		];
		expect(followed(2, { from: 9, to: 21 })).toBeUndefined();
		expect(followed(2, moved)).toBe(1);
	});

	it('never takes a line break written elsewhere for a line without text that is gone', () => {
		// Line 3 is empty: deleted with the break before it, and a break written at the start.
		const breakWritten = { from: 0, insert: '\n' };
		expect(followed(3, [{ from: 21, to: 22 }, breakWritten])).toBeUndefined();
		// Line 2 holds spaces alone, from 2 to 6: the same.
		expect(followed(2, [{ from: 1, to: 6 }, breakWritten], 'a\n    \nb')).toBeUndefined();
	});

	it('goes with its text onto the line above when it is joined to it', () => {
		expect(followed(2, { from: 9, to: 10 })).toBe(1);
	});

	it('is gone once its text and one of its line breaks are deleted', () => {
		// Line 2, `turn_left()`, from 10 to 21: with the break before it, or with the one after.
		expect(followed(2, { from: 9, to: 21 })).toBeUndefined();
		expect(followed(2, { from: 10, to: 22 })).toBeUndefined();
		expect(followed(2, { from: 0, to: 33 })).toBeUndefined();
	});

	it('is gone once an empty line is taken away, by Backspace at its start', () => {
		expect(followed(3, { from: 21, to: 22 })).toBeUndefined();
	});

	it('keeps the first line and the last one, which have a break on one side alone', () => {
		expect(followed(1, { from: 0, to: 9 })).toBe(1);
		expect(followed(1, { from: 0, to: 10 })).toBeUndefined();
		expect(followed(5, { from: 32, to: 33 })).toBeUndefined();
		expect(followed(1, { from: 0, to: 5 }, 'forward()')).toBe(1);
	});

	it('is nowhere for a line that the code didn’t have', () => {
		expect(followed(9, { from: 0, insert: 'x' })).toBeUndefined();
		expect(followed(0, { from: 0, insert: 'x' })).toBeUndefined();
	});
});

describe('a place followed as the code changes', () => {
	/** Where place `at` of `doc` goes once `changes` are made, and on which line. */
	function placed(at: number, changes: ChangeSpec, doc = CODE): { at: number; line: number } {
		const changed = change(changes, doc);
		const place = followPlace(changed, at);
		return { at: place, line: changed.after.lineAt(place).number };
	}

	it('stays on its character when text is written just before it, or lines above it', () => {
		expect(placed(14, { from: 10, insert: 'x' })).toEqual({ at: 15, line: 2 });
		expect(placed(14, { from: 14, insert: 'x' })).toEqual({ at: 15, line: 2 });
		expect(placed(14, { from: 0, insert: 'turn_right()\n' })).toEqual({ at: 27, line: 3 });
	});

	it('goes with its line moved over by Move line up, at the same column', () => {
		// `foward()` on line 2, and `turn_left()` moved up over it, as CodeMirror moves a line:
		// line 2 deleted with the break after it, then written again after line 3.
		const code = 'forward()\nfoward()\nturn_left()\n';
		const moved = [
			{ from: 10, to: 19 },
			{ from: 30, insert: '\nfoward()' }
		];
		expect(placed(12, moved, code)).toEqual({ at: 24, line: 3 });
	});

	it('stays where its text was, once that text is gone', () => {
		expect(placed(14, { from: 10, to: 21 })).toEqual({ at: 10, line: 2 });
		expect(placed(14, { from: 9, to: 21 })).toEqual({ at: 9, line: 1 });
	});

	it('takes a place past the end of the code as its end', () => {
		expect(placed(100, { from: 0, insert: 'x' })).toEqual({ at: 34, line: 5 });
	});
});
