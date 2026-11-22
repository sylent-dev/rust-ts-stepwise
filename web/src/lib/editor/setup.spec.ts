// The editor as a whole: what a key and a character do through its bindings and its input
// handlers, in their order. The rules themselves are tested with their commands (typing.spec.ts,
// pairs.spec.ts); here, that each key reaches the right one.

import { EditorState, type Transaction } from '@codemirror/state';
import { beforeAll, describe, expect, it } from 'vitest';
import { check } from '#lib/core/core.ts';
import { loadTestCore } from '#lib/core/test-support.ts';
import { applyEdit, type Edit } from './edits.ts';
import { editorSetup } from './setup.ts';
import {
	explainByCode,
	press,
	pressedChange,
	shown,
	stateOf as markedState,
	type
} from './test-support.ts';
import { isTyped } from './typing.ts';

beforeAll(loadTestCore);

/** A state of the whole editor, from a text where `|` marks the cursor. */
function stateOf(marked: string): EditorState {
	return markedState(marked, editorSetup('Your code', explainByCode));
}

const pressed = (marked: string, key: string, shift = false): string =>
	shown(press(stateOf(marked), key, shift));

const typed = (marked: string, characters: string): string =>
	shown(type(stateOf(marked), characters));

describe('Backspace', () => {
	it('takes a sign and the one that closes it before anything else', () => {
		expect(pressed('forward(|)', 'Backspace')).toBe('forward|');
		expect(pressed('    print("|")', 'Backspace')).toBe('    print(|)');
	});

	it('takes a whole indentation in the spaces that start a line', () => {
		expect(pressed('repeat 2:\n        |forward()', 'Backspace')).toBe('repeat 2:\n    |forward()');
	});

	it('takes one character anywhere else', () => {
		expect(pressed('forward()|', 'Backspace')).toBe('forward(|');
	});

	it('takes one sign where two signs are no pair', () => {
		expect(pressed('print("a"|"b")', 'Backspace')).toBe('print("a|"b")');
		expect(pressed('print("smile (|)")', 'Backspace')).toBe('print("smile |)")');
		expect(pressed('# call (|)', 'Backspace')).toBe('# call |)');
	});

	it('does the same with Shift held, as after a sign typed with it', () => {
		expect(pressed('forward(|)', 'Backspace', true)).toBe('forward|');
		expect(pressed('print("a"|"b")', 'Backspace', true)).toBe('print("a|"b")');
		expect(pressed('        |forward()', 'Backspace', true)).toBe('    |forward()');
	});
});

describe('Tab', () => {
	it('writes spaces at the cursor, and Shift+Tab takes them off', () => {
		expect(pressed('|forward()', 'Tab')).toBe('    |forward()');
		expect(pressed('    |forward()', 'Tab', true)).toBe('|forward()');
	});

	it('moves the selected lines, one way and the other', () => {
		expect(pressed('|forward()\nback()|', 'Tab')).toBe('    |forward()\n    back()|');
		expect(pressed('    |forward()\n    back()|', 'Tab', true)).toBe('|forward()\nback()|');
	});
});

describe('Enter', () => {
	it('indents under a line that opens a block', () => {
		expect(pressed('repeat 2:|', 'Enter')).toBe('repeat 2:\n    |');
	});

	it('finishes a line before the signs that close it, with Shift too', () => {
		expect(pressed('    forward(|)', 'Enter')).toBe('    forward()\n    |');
		expect(pressed('    forward(|)', 'Enter', true)).toBe('    forward()\n    |');
	});
});

describe('the shortcut of a command of the screen', () => {
	it('is no key of the editor, which leaves it to the screen', () => {
		const changed = type(stateOf('|'), 'forward');

		// The screen hears these keys and runs each command by its name (edits.ts). Read here
		// under one name each; level-commands.spec.ts compares every binding of the editor,
		// however it is written, with the shortcuts of the screen.
		for (const key of ['Mod-z', 'Mod-y', 'Mod-Shift-z', 'Mod-/', 'Alt-ArrowUp', 'Alt-ArrowDown']) {
			expect(shown(press(changed, key)), key).toBe('forward|');
		}
	});
});

describe('a sign typed', () => {
	it('comes with the one that closes it, and passes over it', () => {
		expect(typed('|', 'print(')).toBe('print(|)');
		expect(typed('|', 'print("Hi")')).toBe('print("Hi")|');
	});

	it('is decided by the core before CodeMirror guesses', () => {
		expect(typed('print("Done!|)', '"')).toBe('print("Done!"|)');
		expect(typed('# say |', '"')).toBe('# say "|');
	});

	it('is left alone when it is not typed at the cursor', () => {
		const state = stateOf('forward|');

		expect(shown(type(state, '(', { from: 0, to: 0 }))).toBe('(forward|');
	});

	it('closes nothing but a parenthesis and a quote', () => {
		expect(typed('|', "['{")).toBe("['{|");
	});
});

describe('a program typed key by key', () => {
	it('is the program that the learner reads, which the core accepts', () => {
		let state = type(stateOf('|'), 'repeat 4:');
		state = press(state, 'Enter');
		state = type(state, 'forward(');
		state = press(state, 'Enter');
		state = type(state, 'if not front_is_clear():');
		state = press(state, 'Enter');
		state = type(state, 'print("Wall")');
		state = press(state, 'Enter');
		state = press(state, 'Backspace');
		state = type(state, 'turn_right()');

		const program = state.doc.toString();

		expect(program).toBe(
			[
				'repeat 4:',
				'    forward()',
				'    if not front_is_clear():',
				'        print("Wall")',
				'    turn_right()'
			].join('\n')
		);
		expect(check(program)).toStrictEqual([]);
	});
});

describe('a change typed', () => {
	/** Whether a key pressed in a state makes a change that the editor says typed. */
	const typedBy = (marked: string, key: string, shift = false): boolean => {
		const change = pressedChange(stateOf(marked), key, shift);
		return change !== undefined && isTyped(change);
	};

	/** Whether an edit asked of the screen makes a change that the editor says typed. */
	const typedByEdit = (state: EditorState, edit: Edit): boolean => {
		let change: Transaction | undefined;
		applyEdit(edit, {
			state,
			dispatch: (transaction) => {
				change = transaction;
			}
		});
		return change !== undefined && isTyped(change);
	};

	it('is a line broken, an indentation, a character erased', () => {
		expect(typedBy('forward()|', 'Enter')).toBe(true);
		expect(typedBy('|forward()', 'Tab')).toBe(true);
		expect(typedBy('    |forward()', 'Tab', true)).toBe(true);
		expect(typedBy('forward()|', 'Backspace')).toBe(true);
		expect(typedBy('forward(|)', 'Backspace')).toBe(true);
		expect(typedBy('|forward()', 'Delete')).toBe(true);
	});

	it('is no line moved nor a change undone, which the screen asks', () => {
		const state = stateOf('forward()\n|turn_left()');
		expect(typedByEdit(state, 'move-line-up')).toBe(false);
		const changed = press(state, 'Enter');
		expect(typedByEdit(changed, 'undo')).toBe(false);
	});
});
