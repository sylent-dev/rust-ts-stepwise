// TRIAL, to remove before the pull request of step 16b: what Enter does between a sign and the
// one that closes it, found by the code review, which the owner decides by trying it. What is
// kept moves into `typing.ts`, with its tests.

import { indentService } from '@codemirror/language';
import { countColumn, EditorSelection, type Extension, type StateCommand } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { classifyLine } from '#lib/core/core.ts';
import { INDENT_WIDTH, opensBlock } from './typing.ts';

/**
 * Enter in `forward(|)`: `spread` over three lines, as VS Code does; `split` in two lines, the
 * closing sign under the opening one; `finish` the line, the new one opened after the closing
 * signs.
 */
export type EnterInPair = 'spread' | 'split' | 'finish';

/** Whether only signs that close follow the cursor on its line: `)`, and the quote of its text. */
function onlyClosingSignsAfter(line: string, cursor: number): boolean {
	if (line.slice(cursor).trim() === '') return false;
	return classifyLine(line).every(({ kind, from, to }) => {
		if (to <= cursor) return true;
		if (from >= cursor) return kind === 'symbol' && line.slice(from, to) === ')';
		return kind === 'text' && line.slice(cursor, to) === '"';
	});
}

/** Enter written here: a new line at the indentation of its line, one more under a `:`. */
function newLine(finish: boolean): StateCommand {
	return ({ state, dispatch }) => {
		if (state.readOnly) return false;
		const change = state.changeByRange((range) => {
			const line = state.doc.lineAt(range.from);
			let { from, to } = range;
			if (finish && range.empty && onlyClosingSignsAfter(line.text, from - line.from)) {
				from = to = line.to;
			}
			const before = line.text.slice(0, from - line.from);
			const column = countColumn(before, state.tabSize, before.search(/\S|$/));
			const indentation = opensBlock(before) ? column + INDENT_WIDTH : column;
			// The spaces around the break go: none is left at the end of a line.
			if (before.trim() === '') from = line.from;
			const last = state.doc.lineAt(to);
			while (to < last.to && /\s/.test(last.text.charAt(to - last.from))) to++;
			const insert = `\n${' '.repeat(indentation)}`;
			return {
				changes: { from, to, insert },
				range: EditorSelection.cursor(from + insert.length)
			};
		});
		dispatch(state.update(change, { scrollIntoView: true, userEvent: 'input' }));
		return true;
	};
}

/** The indentation of the line in the middle of a pair spread over three lines. */
const spreadIndentation = indentService.of((context, pos) => {
	const line = context.state.doc.lineAt(pos);
	const before = line.text.slice(0, pos - line.from);
	const indentation = context.countColumn(before, before.search(/\S|$/));
	return opensBlock(before) ? indentation + context.unit : indentation;
});

/** What the choice turns on: placed before the rest of the editor, so that it wins. */
export function trialSetup(enter: EnterInPair): Extension {
	if (enter === 'spread') return spreadIndentation;
	const command = newLine(enter === 'finish');
	return keymap.of([{ key: 'Enter', run: command, shift: command }]);
}
