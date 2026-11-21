// What the tests of the editor share: a state of the editor written as its text, with the
// cursor in it, and a command run on it without a page. Used by the tests alone.

import { EditorSelection, EditorState, type Extension, type StateCommand } from '@codemirror/state';

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
