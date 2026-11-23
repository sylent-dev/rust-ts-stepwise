// The checks as the learner types, without a page: what the editor underlines, how the underlines
// follow the text until the next check, and what they say at a place. The wait after the last
// change and the tip under the pointer need a page, and are tried in a browser.

import { EditorState, Text } from '@codemirror/state';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadTestCore } from '#lib/core/test-support.ts';
import { checkAgain, checks, errorCount, LINE_LENGTH, notesAt, underlinesOf } from './checks.ts';
import { explainByCode } from './test-support.ts';

beforeAll(loadTestCore);

/** What is underlined in a text, each as its kind, what it says and the text it covers. */
function underlined(text: string): string[] {
	const document = Text.of(text.split('\n'));
	return underlinesOf(document, explainByCode).map(
		({ from, to, kind, note }) => `${kind} ${note.title} “${document.sliceString(from, to)}”`
	);
}

/** A state of the editor with its checks, on a text. */
function stateOf(text: string): EditorState {
	return EditorState.create({ doc: text, extensions: checks(explainByCode) });
}

/** What the underlines say at a place, on a side of it, by their sentences in extra-bold. */
function saidAt(state: EditorState, place: number, side: -1 | 1 = 1): string[] {
	return notesAt(state, place, side)?.notes.map(({ title }) => title) ?? [];
}

describe('underlinesOf', () => {
	it('underlines nothing in a program that can run', () => {
		expect(underlined('let sides = 4\nrepeat sides:\n    forward()')).toEqual([]);
	});

	it('underlines each error of the checks on its stretch, with what explain writes', () => {
		expect(underlined('print(sidse)\nturn()')).toEqual([
			'error unknown-name “sidse”',
			'error unknown-function “turn”'
		]);
	});

	it('gives an error where something is missing the place between two characters', () => {
		const document = Text.of(['let sides =']);
		const [missing] = underlinesOf(document, explainByCode);
		expect(missing).toMatchObject({ from: 11, to: 11, kind: 'error' });
	});

	it('underlines a line longer than 80 characters from its 81st character, as advice', () => {
		// A comment of 80 characters, then of 82.
		const comment = `# ${'a'.repeat(LINE_LENGTH - 2)}`;
		expect(underlined(`${comment}\n${comment}xy`)).toEqual([
			'long-line Lines are easier to read under 80 characters. “xy”'
		]);
	});

	it('counts the characters of a line as the learner does, an emoji being one', () => {
		const emojis = `print("${'🤖'.repeat(LINE_LENGTH - 9)}")`;
		expect(underlined(emojis)).toEqual([]);
		expect(underlined(`${emojis}  # ok`)).toEqual([
			'long-line Lines are easier to read under 80 characters. “  # ok”'
		]);
	});

	it('gives the places of the document, a text with \\r\\n included', () => {
		// The editor counts one unit for every line break: the core checks its document.
		const state = stateOf('forward()\r\nprint(sidse)\r\n');
		expect(state.doc.lines).toBe(3);
		const [error] = underlinesOf(state.doc, explainByCode);
		expect(error && state.doc.sliceString(error.from, error.to)).toBe('sidse');
	});
});

describe('the underlines of the editor', () => {
	it('are checked as soon as the editor opens', () => {
		expect(saidAt(stateOf('print(sidse)'), 8)).toEqual(['unknown-name']);
	});

	it('move with the text until the next check, then follow the code', () => {
		// `sidse` goes from 6 to 11, then from 7 to 12 once a line is added above it.
		const typed = stateOf('print(sidse)').update({ changes: { from: 0, insert: '\n' } }).state;
		expect(saidAt(typed, 7, -1)).toEqual([]);
		expect(saidAt(typed, 12, -1)).toEqual(['unknown-name']);
		// Declared above, `sidse` stays underlined until the next check.
		const declared = typed.update({ changes: { from: 0, insert: 'let sidse = 4' } }).state;
		expect(saidAt(declared, 21)).toEqual(['unknown-name']);
		expect(saidAt(declared.update({ effects: checkAgain.of(null) }).state, 21)).toEqual([]);
	});
});

describe('errorCount', () => {
	it('counts the errors underlined, not the lines too long, which are advice', () => {
		const long = `print("${'a'.repeat(LINE_LENGTH)}")`;
		expect(errorCount(stateOf(`print(sidse)\nturn()\n${long}`))).toBe(2);
		expect(errorCount(stateOf(long))).toBe(0);
	});

	it('follows the underlines: the same number until the next check, as the waves stay', () => {
		const typed = stateOf('print(sidse)').update({
			changes: { from: 0, insert: 'let sidse = 4\n' }
		}).state;
		expect(errorCount(typed)).toBe(1);
		const checked = typed.update({ effects: checkAgain.of(null) }).state;
		expect(errorCount(checked)).toBe(0);
		const broken = checked.update({ changes: { from: 0, insert: 'turn()\n' } }).state;
		expect(errorCount(broken)).toBe(0);
		expect(errorCount(broken.update({ effects: checkAgain.of(null) }).state)).toBe(1);
	});

	it('finds nothing in an editor without the checks', () => {
		expect(errorCount(EditorState.create({ doc: 'print(sidse)' }))).toBe(0);
	});
});

describe('notesAt', () => {
	it('says the note of a stretch from inside it, and from its ends on their side', () => {
		const state = stateOf('print(sidse)');
		// `sidse` goes from 6 to 11.
		expect(saidAt(state, 6, 1)).toEqual(['unknown-name']);
		expect(saidAt(state, 6, -1)).toEqual([]);
		expect(saidAt(state, 11, -1)).toEqual(['unknown-name']);
		expect(saidAt(state, 11, 1)).toEqual([]);
		expect(notesAt(state, 8, 1)).toMatchObject({ from: 6, to: 11 });
	});

	it('says the note of a place where something is missing, on both sides of it', () => {
		const missing = stateOf('let sides =');
		expect(saidAt(missing, 11, -1)).toEqual(['expected-value']);
		expect(saidAt(missing, 11, 1)).toEqual(['expected-value']);
		expect(saidAt(missing, 10, 1)).toEqual([]);
	});

	it('says every note of a place, an error on a line too long included', () => {
		const name = 'a'.repeat(LINE_LENGTH + 5);
		const both = stateOf(`print(${name})`);
		expect(saidAt(both, LINE_LENGTH + 2)).toEqual([
			'unknown-name',
			'Lines are easier to read under 80 characters.'
		]);
		expect(notesAt(both, LINE_LENGTH + 2, 1)).toMatchObject({ from: 6, to: 6 + name.length + 1 });
	});
});
