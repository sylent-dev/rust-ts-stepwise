// The place of the cursor, as the status bar of the screen writes it (`Ln 7, Col 12`; see Level
// screen in specs.md): its line and its column, both from 1. The column counts characters, as
// the core and the learner count them, an emoji or an accent being one, where CodeMirror counts
// the units of a JavaScript text, two for an emoji (see Positions in docs/technical-choices.md).

import type { EditorState } from '@codemirror/state';

/** The place of the cursor: its line and its column, both from 1. */
export interface Cursor {
	readonly line: number;
	/** In characters from the start of the line, the first one being 1. */
	readonly column: number;
}

/**
 * The place of the cursor of a state: the end of the selection that moves, as a code editor
 * shows it while the learner selects.
 */
export function cursorOf(state: EditorState): Cursor {
	const { head } = state.selection.main;
	const line = state.doc.lineAt(head);
	// eslint-disable-next-line @typescript-eslint/no-misused-spread -- the core counts the Unicode scalar values of a line, which a spread gives, not what a reader sees as one sign: an emoji made of several counts for each, in the column as in the messages
	const before = [...line.text.slice(0, head - line.from)];
	return { line: line.number, column: before.length + 1 };
}
