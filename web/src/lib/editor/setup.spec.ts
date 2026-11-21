// The editor as a whole: what a key and a character do through its bindings and its input
// handlers, in their order. The rules themselves are tested with their commands (typing.spec.ts,
// pairs.spec.ts); here, that each key reaches the right one.

import { EditorState } from '@codemirror/state';
import { beforeAll, describe, expect, it } from 'vitest';
import { check } from '#lib/core/core.ts';
import { loadTestCore } from '#lib/core/test-support.ts';
import { editorSetup } from './setup.ts';
import { press, shown, stateOf as markedState, type } from './test-support.ts';

beforeAll(loadTestCore);

/** A state of the whole editor, from a text where `|` marks the cursor. */
function stateOf(marked: string): EditorState {
	return markedState(marked, editorSetup('Your code'));
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

describe('the history', () => {
	it('undoes with Ctrl+Z, and redoes with Ctrl+Y or Ctrl+Shift+Z', () => {
		const changed = type(stateOf('|'), 'forward');
		const undone = press(changed, 'Mod-z');

		expect(shown(undone)).toBe('|');
		expect(shown(press(undone, 'Mod-y'))).toBe('forward|');
		expect(shown(press(undone, 'Mod-Shift-z'))).toBe('forward|');
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
