// What the editor is made of (see Code editor in specs.md and in docs/technical-choices.md): the
// parts of CodeMirror that it takes, one by one, rather than its ready-made set, which brings
// what the specifications leave out (several cursors, find and replace, folding).

import { history, standardKeymap } from '@codemirror/commands';
import { type Extension, Prec } from '@codemirror/state';
import { drawSelection, dropCursor, EditorView, keymap, lineNumbers } from '@codemirror/view';
import { checks, type Explain } from './checks.ts';
import { codeColors } from './code-colors.ts';
import { comments } from './edits.ts';
import { matchingParentheses } from './matching.ts';
import { pairKeys, pairs } from './pairs.ts';
import { runLinesShown } from './run-lines.ts';
import { indentation, indentationKeys } from './typing.ts';

/**
 * The undo and the redo of the browser itself (its menu, the menu of a right click) reach the
 * code through the history of the editor. A browser also sends them for Ctrl+Z pressed anywhere
 * on the page, to the code out of reach under a panel or a message in place of the screen
 * (Chromium): they are followed only while the keyboard is in the code. Anywhere else, the screen
 * hears the shortcut, or nothing does.
 */
const browserHistory: Extension = Prec.highest(
	EditorView.domEventHandlers({
		beforeinput(event, view) {
			if (event.inputType !== 'historyUndo' && event.inputType !== 'historyRedo') return false;
			if (view.hasFocus) return false;
			event.preventDefault();
			return true;
		}
	})
);

/**
 * The editor: the rules of typing, the signs that close by themselves, the history, the keys of
 * every text field (the arrows, Home and End, Backspace, select all), the numbers of the lines,
 * the colors of the code, the pair of parentheses at the cursor, the checks as the learner types
 * (whose errors `explain` writes), the lines of a run that the screen shows, whose marks stand
 * in the margin before the numbers. A key is tried in the order of the list: Backspace takes a
 * pair of signs before it takes an indentation or a character, and Enter is ours before it is
 * the one of every text field. The selection and the cursor are drawn by the editor rather than
 * by the browser, so that they take our look. `label` names the code for a screen reader.
 *
 * The editor has the keys of typing alone. The shortcut of a command (Ctrl+Z, Ctrl+:, Alt+↑) is
 * heard by the screen, wherever the keyboard is on it, and run by its name (edits.ts): the
 * editor keeps the history and the sign of a comment that those commands read.
 */
export function editorSetup(label: string, explain: Explain): Extension {
	return [
		indentation,
		pairs,
		browserHistory,
		history(),
		comments,
		keymap.of([...pairKeys, ...indentationKeys, ...standardKeymap]),
		runLinesShown,
		lineNumbers(),
		drawSelection(),
		dropCursor(),
		codeColors,
		matchingParentheses,
		checks(explain),
		EditorView.contentAttributes.of({ 'aria-label': label })
	];
}
