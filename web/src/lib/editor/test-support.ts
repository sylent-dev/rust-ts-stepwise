// What the tests of the editor share: a state of the editor written as its text, with the
// cursor in it, and what a learner does to it, run without a page: a command, a key pressed, a
// character typed. Used by the tests alone.

import {
	EditorSelection,
	EditorState,
	type Extension,
	type StateCommand,
	type Transaction
} from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import type { Explain } from './checks.ts';

/**
 * A state of the editor from a text where `|` marks the cursor, or the two ends of the
 * selection, with the parts of the editor that the test is about.
 */
export function stateOf(marked: string, extensions: Extension = []): EditorState {
	const [before = '', ...rest] = marked.split('|');
	const selected = rest.length > 1 ? (rest[0] ?? '') : '';
	return EditorState.create({
		doc: before + rest.join(''),
		selection: EditorSelection.single(before.length, before.length + selected.length),
		extensions
	});
}

/** The text of a state, with `|` at the cursor, or at the two ends of the selection. */
export function shown(state: EditorState): string {
	const { from, to } = state.selection.main;
	const text = state.doc.toString();
	const mark = from === to ? '' : '|';
	return `${text.slice(0, from)}|${text.slice(from, to)}${mark}${text.slice(to)}`;
}

/** The state after a command, or the same state when the command does nothing. */
export function after(command: StateCommand, state: EditorState): EditorState {
	let next = state;
	command({
		state,
		dispatch: (transaction) => {
			next = transaction.state;
		}
	});
	return next;
}

/**
 * What stands for the editor on its page, which a test doesn't have: a key and an input handler
 * ask for it, and read its state and give it a change, nothing else. `next` is the state after
 * the changes it was given.
 */
function standIn(state: EditorState): { view: EditorView; next: () => EditorState } {
	let next = state;
	const target = {
		state,
		compositionStarted: false,
		dispatch: (transaction: Transaction) => {
			next = transaction.state;
		}
	};
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- a test has no page to make the editor on, and its keys read the state of the editor alone
	return { view: target as unknown as EditorView, next: () => next };
}

/**
 * The state after a key is pressed: its bindings are tried in the order of the editor until one
 * takes the key, as CodeMirror does, so the order is tested with the commands. `key` is written
 * as a binding names it (`Tab`, `Backspace`, `Mod-z`).
 */
export function press(state: EditorState, key: string, shift = false): EditorState {
	const { view, next } = standIn(state);
	for (const binding of state.facet(keymap).flat()) {
		if (binding.key !== key) continue;
		const command = shift ? binding.shift : binding.run;
		if (command?.(view)) break;
	}
	return next();
}

/**
 * The state after characters are typed one by one: each is given to the input handlers in the
 * order of the editor, and written as it is when none takes it. `at` places one text elsewhere
 * than at the selection, as a text that isn't typed at the cursor arrives.
 */
export function type(
	state: EditorState,
	characters: string,
	at?: { from: number; to: number }
): EditorState {
	let typed = state;
	for (const character of at ? [characters] : characters) {
		const { view, next } = standIn(typed);
		const { from, to } = at ?? typed.selection.main;
		// As the editor writes a character: at the cursor, which goes after it, or elsewhere.
		const insert = (): Transaction =>
			typed.update(
				at ? { changes: { from, to, insert: character } } : typed.replaceSelection(character)
			);
		const taken = typed
			.facet(EditorView.inputHandler)
			.some((handler) => handler(view, from, to, character, insert));
		typed = taken ? next() : insert().state;
	}
	return typed;
}

/**
 * Writes an error as its code alone, where the screen writes its sentences: the tests of the
 * editor read which error it underlines, not what it says.
 */
export const explainByCode: Explain = ({ kind }) => ({ title: kind.code });
