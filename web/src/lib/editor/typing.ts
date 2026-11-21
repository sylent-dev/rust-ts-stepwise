// The rules of typing of the editor (see Code editor and Lines and indentation in specs.md): the
// indentation is four spaces, never a tab, so Tab writes spaces, a new line keeps the indentation
// of its line, four spaces more under a line that opens a block, and Backspace takes an
// indentation back at once. They read and change the state of the editor alone, so they are
// tested without a page.

import { indentLess, indentMore } from '@codemirror/commands';
import { indentService, indentUnit } from '@codemirror/language';
import {
	countColumn,
	EditorSelection,
	EditorState,
	type Extension,
	type StateCommand
} from '@codemirror/state';
import type { KeyBinding } from '@codemirror/view';
import { classifyLine } from '#lib/core/core.ts';

/**
 * The spaces of one indentation: a block is indented by exactly four more spaces than the line
 * that opens it. The core holds the rule; its lists of words will give this width with them
 * (`vocabulary()`, step 20), and a test checks until then that what the editor types under a
 * `:` is a block for the core.
 */
export const INDENT_WIDTH = 4;

/**
 * Whether a line opens a block: its last piece, a comment aside, is `:`. The core says what the
 * pieces are, so a `:` in a text or in a comment opens nothing.
 */
export function opensBlock(line: string): boolean {
	const last = classifyLine(line).findLast((stretch) => stretch.kind !== 'comment');
	return last?.kind === 'symbol' && line.slice(last.from, last.to) === ':';
}

/**
 * The indentation of a new line: the one of the line it is broken from, and one more under a
 * line that opens a block. Enter reads it (`insertNewlineAndIndent`), which also empties a line
 * of spaces alone that it leaves behind.
 */
const newLineIndentation = indentService.of((context, pos) => {
	const before = context.lineAt(pos, -1);
	const indentation = context.lineIndent(before.from, -1);
	return opensBlock(before.text) ? indentation + context.unit : indentation;
});

/**
 * Tab. On a selection, its lines are indented once more. At the cursor, spaces up to the next
 * stop of four: four of them where the indentation is right, fewer where it isn't, so that Tab
 * never writes an indentation that the language refuses.
 */
export const indentOrInsertSpaces: StateCommand = ({ state, dispatch }) => {
	if (state.readOnly) return false;
	if (!state.selection.main.empty) return indentMore({ state, dispatch });
	const change = state.changeByRange(({ head }) => {
		const line = state.doc.lineAt(head);
		const column = countColumn(line.text, state.tabSize, head - line.from);
		const spaces = INDENT_WIDTH - (column % INDENT_WIDTH);
		return {
			changes: { from: head, insert: ' '.repeat(spaces) },
			range: EditorSelection.cursor(head + spaces)
		};
	});
	dispatch(state.update(change, { scrollIntoView: true, userEvent: 'input' }));
	return true;
};

/**
 * The keys of the indentation. Shift+Tab takes one indentation off the selected lines, or off
 * the line of the cursor. Enter and Backspace keep the keys of every editor
 * (`standardKeymap`), which read the indentation set here: Backspace in the spaces that start a
 * line goes back to the stop of four before it.
 */
export const indentationKeys: readonly KeyBinding[] = [
	{ key: 'Tab', run: indentOrInsertSpaces, shift: indentLess }
];

/** What the rules of typing need in the state of the editor. */
export const indentation: Extension = [
	EditorState.tabSize.of(INDENT_WIDTH),
	indentUnit.of(' '.repeat(INDENT_WIDTH)),
	newLineIndentation
];
