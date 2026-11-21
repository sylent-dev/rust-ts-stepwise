import { deleteCharBackward, indentLess } from '@codemirror/commands';
import { getIndentUnit } from '@codemirror/language';
import { EditorState, type Transaction } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { beforeAll, describe, expect, it } from 'vitest';
import { check } from '#lib/core/core.ts';
import { loadTestCore } from '#lib/core/test-support.ts';
import { after, shown, stateOf as markedState } from './test-support.ts';
import { indentation, indentOrInsertSpaces, insertNewLine, opensBlock } from './typing.ts';

beforeAll(loadTestCore);

/** A state with the rules of the indentation, from a text where `|` marks the cursor. */
function stateOf(marked: string, readOnly = false): EditorState {
	return markedState(marked, [indentation, EditorState.readOnly.of(readOnly)]);
}

const enter = (marked: string): string => shown(after(insertNewLine, stateOf(marked)));
const tab = (marked: string): string => shown(after(indentOrInsertSpaces, stateOf(marked)));
const shiftTab = (marked: string): string => shown(after(indentLess, stateOf(marked)));

/**
 * Backspace, as every editor binds it (`standardKeymap`). The command asks for the editor on its
 * page, which a test doesn't have: it reads its state and gives it a change, nothing else.
 */
function backspace(marked: string): string {
	const state = stateOf(marked);
	let next = state;
	const target = {
		state,
		dispatch: (transaction: Transaction) => {
			next = transaction.state;
		}
	};
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- a test has no page to make the editor on, and the command reads the state of the editor alone
	deleteCharBackward(target as unknown as EditorView);
	return shown(next);
}

describe('a line that opens a block', () => {
	it.each(['repeat 4:', 'if front_is_clear() and not done:', 'else:', 'repeat 4:   ', ':'])(
		'ends with a colon: %s',
		(line) => {
			expect(opensBlock(line)).toBe(true);
		}
	);

	it('may end with a comment after its colon', () => {
		expect(opensBlock('while true:  # until the wall')).toBe(true);
	});

	it.each([
		['a statement', 'forward()'],
		['an empty line', ''],
		['a colon in a text', 'print("Done:")'],
		['a colon in a text that is not closed', 'print("Done:'],
		['a colon in a comment', 'forward()  # then:'],
		['a comment alone', '# repeat 4:'],
		['something after the colon', 'if done: forward()']
	])('is not %s', (_, line) => {
		expect(opensBlock(line)).toBe(false);
	});
});

describe('Enter', () => {
	it('indents four spaces more under a line that opens a block', () => {
		expect(enter('repeat 4:|')).toBe('repeat 4:\n    |');
		expect(enter('    if done:|')).toBe('    if done:\n        |');
	});

	it('indents under a block whose line ends with a comment', () => {
		expect(enter('repeat 4:  # the sides|')).toBe('repeat 4:  # the sides\n    |');
	});

	it('keeps the indentation of the line otherwise', () => {
		expect(enter('forward()|')).toBe('forward()\n|');
		expect(enter('repeat 4:\n    forward()|')).toBe('repeat 4:\n    forward()\n    |');
		expect(enter('    print("Done:")|')).toBe('    print("Done:")\n    |');
	});

	it('reads the line up to the cursor: the colon after it opens nothing yet', () => {
		expect(enter('repeat 4|:')).toBe('repeat 4\n|:');
	});

	it('takes what follows the cursor to the new line, without the spaces between', () => {
		expect(enter('repeat 4:|  forward()')).toBe('repeat 4:\n    |forward()');
	});

	it('leaves no spaces behind on a line of spaces alone', () => {
		expect(enter('repeat 4:\n    |')).toBe('repeat 4:\n\n    |');
	});

	it('replaces a selection by the break', () => {
		expect(enter('repeat 4:\n    for|ward()\n    turn|_right()')).toBe(
			'repeat 4:\n    for\n    |_right()'
		);
	});

	it('does nothing while the code cannot be changed', () => {
		const state = stateOf('forward()|', true);

		expect(after(insertNewLine, state)).toBe(state);
	});

	it('types under a line that opens a block what the core reads as its block', () => {
		const opened = after(insertNewLine, stateOf('repeat 2:|'));
		const typed = opened.update(opened.replaceSelection('forward()')).state;

		expect(typed.doc.toString()).toBe('repeat 2:\n    forward()');
		expect(check(typed.doc.toString())).toStrictEqual([]);
		// The check does see an indentation that is wrong.
		expect(check('repeat 2:\n   forward()')).not.toHaveLength(0);
	});
});

describe('Enter before the signs that close', () => {
	it('finishes the line of a parenthesis that the editor closed', () => {
		expect(enter('forward(|)')).toBe('forward()\n|');
		expect(enter('    print(count(red|))')).toBe('    print(count(red))\n    |');
		expect(enter('if here_is(red|)')).toBe('if here_is(red)\n|');
	});

	it('finishes the line of a text, with its quote and its parenthesis', () => {
		expect(enter('print("Hi|")')).toBe('print("Hi")\n|');
		expect(enter('let name = "Robot|"')).toBe('let name = "Robot"\n|');
	});

	it('breaks the line before a colon, which closes nothing', () => {
		expect(enter('repeat count(red|):')).toBe('repeat count(red\n|):');
	});

	it('keeps the spaces that end the line', () => {
		expect(enter('forward(|)  ')).toBe('forward()  \n|');
	});

	it('breaks the line when anything else follows the cursor', () => {
		expect(enter('print(|"Hi")')).toBe('print(\n|"Hi")');
		expect(enter('print("Hi|", 3)')).toBe('print("Hi\n|", 3)');
		expect(enter('forward(|)  # go')).toBe('forward(\n|)  # go');
		expect(enter('for|ward()')).toBe('for\n|ward()');
	});

	it('breaks the line in a comment, where a parenthesis closes nothing', () => {
		expect(enter('# call (|)')).toBe('# call (\n|)');
	});

	it('breaks the line in a text whose parenthesis is none of the code', () => {
		expect(enter('print("smile (|)")')).toBe('print("smile (\n|)")');
	});
});

describe('Tab', () => {
	it('writes four spaces where a line starts', () => {
		expect(tab('|')).toBe('    |');
		expect(tab('|forward()')).toBe('    |forward()');
		expect(tab('    |forward()')).toBe('        |forward()');
	});

	it('writes spaces up to the next stop of four, never a tab', () => {
		expect(tab('  |forward()')).toBe('    |forward()');
		expect(tab('     |forward()')).toBe('        |forward()');
		expect(tab('let a|= 1')).toBe('let a   |= 1');
		expect(tab('forward()|')).toBe('forward()   |');
		expect(tab('|')).not.toContain('\t');
	});

	it('counts the stops from the start of the line of the cursor', () => {
		expect(tab('repeat 4:\n  |')).toBe('repeat 4:\n    |');
	});

	it('indents the lines of a selection once more', () => {
		expect(tab('repeat 4:\n    for|ward()\n    turn|_right()\nback()')).toBe(
			'repeat 4:\n        for|ward()\n        turn|_right()\nback()'
		);
	});

	it('indents the line of a selection that stays on one line', () => {
		expect(tab('    |forward|()')).toBe('        |forward|()');
	});

	it('leaves a line that the selection only reaches the start of', () => {
		expect(tab('|forward()\n|back()')).toBe('    |forward()\n|back()');
	});

	it('does nothing while the code cannot be changed', () => {
		const state = stateOf('|forward()', true);

		expect(after(indentOrInsertSpaces, state)).toBe(state);
	});
});

describe('Shift+Tab', () => {
	it('takes four spaces off the lines of a selection', () => {
		expect(shiftTab('repeat 4:\n        for|ward()\n        turn|_right()')).toBe(
			'repeat 4:\n    for|ward()\n    turn|_right()'
		);
	});

	it('takes four spaces off the line of the cursor', () => {
		expect(shiftTab('    forward()|')).toBe('forward()|');
	});

	it('takes what there is off a line indented by less', () => {
		expect(shiftTab('  forward()|')).toBe('forward()|');
		expect(shiftTab('forward()|')).toBe('forward()|');
	});
});

describe('Backspace', () => {
	it('takes four spaces at once in the spaces that start a line', () => {
		expect(backspace('        |forward()')).toBe('    |forward()');
		expect(backspace('    |')).toBe('|');
	});

	it('goes back to the stop of four before the cursor', () => {
		expect(backspace('      |forward()')).toBe('    |forward()');
		expect(backspace('     |forward()')).toBe('    |forward()');
	});

	it('takes one character anywhere else', () => {
		expect(backspace('    forward()    |')).toBe('    forward()   |');
		expect(backspace('let a = 1|')).toBe('let a = |');
	});

	it('joins a line to the one above, from its start', () => {
		expect(backspace('forward()\n|back()')).toBe('forward()|back()');
	});
});

describe('the indentation', () => {
	it('is four spaces wide', () => {
		const state = stateOf('|');

		expect(getIndentUnit(state)).toBe(4);
		expect(state.tabSize).toBe(4);
	});
});
