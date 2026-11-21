// The edits that the screen asks of the editor, on the whole editor: the history and the sign
// of a comment are parts of it (setup.ts).

import type { EditorState } from '@codemirror/state';
import { beforeAll, describe, expect, it } from 'vitest';
import { check, classifyLine } from '#lib/core/core.ts';
import { loadTestCore } from '#lib/core/test-support.ts';
import { applyEdit, canEdit, type Edit, EDITS } from './edits.ts';
import { editorSetup } from './setup.ts';
import { shown, stateOf as markedState, type } from './test-support.ts';

beforeAll(loadTestCore);

/** A state of the whole editor, from a text where `|` marks the cursor or the selection. */
function stateOf(marked: string): EditorState {
	return markedState(marked, editorSetup('Your code'));
}

/** The state after edits, one after the other. */
function edit(state: EditorState, ...edits: Edit[]): EditorState {
	return edits.reduce((from, name) => {
		let next = from;
		applyEdit(name, {
			state: from,
			dispatch: (transaction) => {
				next = transaction.state;
			}
		});
		return next;
	}, state);
}

const edited = (marked: string, ...edits: Edit[]): string => shown(edit(stateOf(marked), ...edits));

/** The edits that have something to do in a state. */
const possible = (state: EditorState): Edit[] => EDITS.filter((name) => canEdit(name, state));

describe('undo and redo', () => {
	it('take back the last change, and bring it again', () => {
		const changed = type(stateOf('|'), 'forward');

		expect(shown(edit(changed, 'undo'))).toBe('|');
		expect(shown(edit(changed, 'undo', 'redo'))).toBe('forward|');
	});

	it('have nothing to do before the first change', () => {
		expect(possible(stateOf('forward()|'))).toEqual([
			'comment-lines',
			'move-line-up',
			'move-line-down'
		]);
	});

	it('follow the history: undo after a change, redo after an undo', () => {
		const changed = type(stateOf('|'), 'forward');

		expect(canEdit('undo', changed)).toBe(true);
		expect(canEdit('redo', changed)).toBe(false);

		const undone = edit(changed, 'undo');

		expect(canEdit('undo', undone)).toBe(false);
		expect(canEdit('redo', undone)).toBe(true);
	});

	it('leave nothing to redo once the code has changed after an undo', () => {
		const changed = type(edit(type(stateOf('|'), 'forward'), 'undo'), 'back');

		expect(canEdit('redo', changed)).toBe(false);
	});

	it('take back one edit at a time, two made in a row too', () => {
		const twice = edit(stateOf('for|ward()'), 'comment-lines', 'comment-lines');

		expect(shown(twice)).toBe('for|ward()');
		expect(shown(edit(twice, 'undo'))).toBe('# for|ward()');
		expect(shown(edit(twice, 'undo', 'undo'))).toBe('for|ward()');

		const down = edit(stateOf('for|ward()\nback()\nleft()'), 'move-line-down', 'move-line-down');

		expect(shown(edit(down, 'undo'))).toBe('back()\nfor|ward()\nleft()');
	});

	it('take back an edit of the menu as a change typed', () => {
		const commented = edit(stateOf('|forward()\nback()|'), 'comment-lines');

		expect(shown(edit(commented, 'undo'))).toBe('|forward()\nback()|');
		expect(shown(edit(stateOf('forward()\nba|ck()'), 'move-line-up', 'undo'))).toBe(
			'forward()\nba|ck()'
		);
	});
});

describe('comment-lines', () => {
	it('comments the line of the cursor at its indentation, and uncomments it', () => {
		expect(edited('repeat 2:\n    for|ward()', 'comment-lines')).toBe(
			'repeat 2:\n    # for|ward()'
		);
		expect(edited('repeat 2:\n    # for|ward()', 'comment-lines')).toBe(
			'repeat 2:\n    for|ward()'
		);
	});

	it('uncomments a line written without a space after its sign', () => {
		expect(edited('#forward()|', 'comment-lines')).toBe('forward()|');
	});

	it('comments the selected lines at the smallest of their indentations', () => {
		expect(
			edited(
				'repeat 4:\n    |forward()\n    if front_is_clear():\n        turn_right()|',
				'comment-lines'
			)
		).toBe('repeat 4:\n    # |forward()\n    # if front_is_clear():\n    #     turn_right()|');
	});

	it('gives the lines back as they were when it runs twice', () => {
		const lines = 'repeat 4:\n    |forward()\n    if front_is_clear():\n        turn_right()|';

		expect(edited(lines, 'comment-lines', 'comment-lines')).toBe(lines);
	});

	it('comments them all when one of them is code', () => {
		expect(edited('|# go\nforward()|', 'comment-lines')).toBe('# |# go\n# forward()|');
		expect(edited('# |# go\n# forward()|', 'comment-lines')).toBe('|# go\nforward()|');
	});

	it('keeps the cursor and the ends of the selection beside the same characters', () => {
		expect(edited('|forward()', 'comment-lines')).toBe('# |forward()');
		expect(edited('for|ward()\nba|ck()', 'comment-lines')).toBe('# for|ward()\n# ba|ck()');
	});

	it('leaves out a line that holds nothing among several, but comments it alone', () => {
		expect(edited('for|ward()\n\nback()|', 'comment-lines')).toBe('# for|ward()\n\n# back()|');
		expect(edited('forward()\n|', 'comment-lines')).toBe('forward()\n# |');
	});

	it('leaves a line that the selection only reaches the start of', () => {
		expect(edited('for|ward()\n|back()', 'comment-lines')).toBe('# for|ward()\n|back()');
	});

	it('shows the cursor, which may be out of sight when the shortcut is pressed', () => {
		const state = stateOf('for|ward()');
		const asked: boolean[] = [];
		applyEdit('comment-lines', {
			state,
			dispatch: (transaction) => asked.push(transaction.scrollIntoView)
		});

		expect(asked).toEqual([true]);
	});

	it('writes lines that are comments for the core, which then reads the rest alone', () => {
		const commented = edit(
			stateOf('repeat 4:\n    |forward()\n    print("# no comment")|\nturn_left()'),
			'comment-lines'
		);
		const lines = commented.doc.toString().split('\n');

		expect(lines.map((line) => classifyLine(line).map(({ kind }) => kind))).toEqual([
			['keyword', 'number', 'symbol'],
			['comment'],
			['comment'],
			['function', 'symbol', 'symbol']
		]);
		// A block that holds only comments is an error of its own: the core read them as such.
		expect(check(commented.doc.toString()).map(({ kind }) => kind.code)).toEqual([
			'comment-only-block'
		]);
	});
});

describe('move-line-up and move-line-down', () => {
	it('move the line of the cursor, which stays in it', () => {
		expect(edited('forward()\nturn_|right()', 'move-line-up')).toBe('turn_|right()\nforward()');
		expect(edited('for|ward()\nturn_right()', 'move-line-down')).toBe('turn_right()\nfor|ward()');
	});

	it('keep the indentation of the line, into a block as out of it', () => {
		expect(edited('repeat 2:\n    forward()\nba|ck()', 'move-line-up')).toBe(
			'repeat 2:\nba|ck()\n    forward()'
		);
		expect(edited('repeat 2:\n    for|ward()\nback()', 'move-line-down')).toBe(
			'repeat 2:\nback()\n    for|ward()'
		);
	});

	it('move the selected lines together', () => {
		expect(edited('one()\ntw|o()\nthr|ee()\nfour()', 'move-line-up')).toBe(
			'tw|o()\nthr|ee()\none()\nfour()'
		);
		expect(edited('one()\ntw|o()\nthr|ee()\nfour()', 'move-line-down')).toBe(
			'one()\nfour()\ntw|o()\nthr|ee()'
		);
	});

	it('leave the first line where it is going up, and the last one going down', () => {
		expect(edited('for|ward()\nback()', 'move-line-up')).toBe('for|ward()\nback()');
		expect(edited('forward()\nba|ck()', 'move-line-down')).toBe('forward()\nba|ck()');
	});
});
