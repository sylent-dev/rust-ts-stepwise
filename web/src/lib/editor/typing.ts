// The rules of typing of the editor (see Code editor and Lines and indentation in specs.md): the
// indentation is four spaces, never a tab, so Tab writes spaces, a new line keeps the indentation
// of its line, four spaces more under a line that opens a block, and Backspace takes an
// indentation back at once. A statement never spans two lines, so Enter never leaves a
// parenthesis or a text open behind it when only their closing signs follow the cursor. They
// read and change the state of the editor alone, so they are tested without a page.

import { indentLess, indentMore } from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
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
 * Whether only signs that close follow the cursor on its line: the `)` of the code and, when
 * the cursor is in a text, the quote that ends it. The core says what the signs are.
 */
function onlyClosingSignsAfter(line: string, cursor: number): boolean {
	if (line.slice(cursor).trim() === '') return false;
	return classifyLine(line).every(({ kind, from, to }) => {
		if (to <= cursor) return true;
		if (from >= cursor) return kind === 'symbol' && line.slice(from, to) === ')';
		return kind === 'text' && line.slice(cursor, to) === '"';
	});
}

/**
 * Enter. A new line at the indentation of the line it is broken from, and four spaces more
 * under a line that opens a block. Where only closing signs follow the cursor (`forward(|)`,
 * `print("Hi|")`, as the editor leaves it once it has closed a sign by itself), the line is
 * finished rather than broken: the new line opens under it. The spaces around the break go, so
 * a line of spaces alone is left empty.
 *
 * The command of CodeMirror (`insertNewlineAndIndent`) isn't used: between two parentheses it
 * spreads them over three lines, as a language whose calls span several lines wants it.
 */
export const insertNewLine: StateCommand = ({ state, dispatch }) => {
	if (state.readOnly) return false;
	const change = state.changeByRange((range) => {
		const line = state.doc.lineAt(range.from);
		let { from, to } = range;
		if (range.empty && onlyClosingSignsAfter(line.text, from - line.from)) {
			from = line.to;
			to = line.to;
		}
		const before = line.text.slice(0, from - line.from);
		const column = countColumn(before, state.tabSize, before.search(/\S|$/));
		const indentation = opensBlock(before) ? column + INDENT_WIDTH : column;
		if (before.trim() === '') from = line.from;
		const last = state.doc.lineAt(to);
		while (to < last.to && /\s/.test(last.text.charAt(to - last.from))) to++;
		const insert = `\n${' '.repeat(indentation)}`;
		return { changes: { from, to, insert }, range: EditorSelection.cursor(from + insert.length) };
	});
	dispatch(state.update(change, { scrollIntoView: true, userEvent: 'input' }));
	return true;
};

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
 * The keys of the indentation, tried before those of every editor (`standardKeymap`). Shift+Tab
 * takes one indentation off the selected lines, or off the line of the cursor. Backspace keeps
 * the key of every editor, which reads the indentation set here: in the spaces that start a
 * line, it goes back to the stop of four before it.
 */
export const indentationKeys: readonly KeyBinding[] = [
	{ key: 'Tab', run: indentOrInsertSpaces, shift: indentLess },
	{ key: 'Enter', run: insertNewLine, shift: insertNewLine }
];

/** What the rules of typing need in the state of the editor. */
export const indentation: Extension = [
	EditorState.tabSize.of(INDENT_WIDTH),
	indentUnit.of(' '.repeat(INDENT_WIDTH))
];
