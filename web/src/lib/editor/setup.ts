// What the editor is made of (see Code editor in specs.md and in docs/technical-choices.md): the
// parts of CodeMirror that it takes, one by one, rather than its ready-made set, which brings
// what the specifications leave out (several cursors, find and replace, folding).

import { history, redo, standardKeymap, undo } from '@codemirror/commands';
import type { Extension } from '@codemirror/state';
import {
	drawSelection,
	dropCursor,
	EditorView,
	type KeyBinding,
	keymap,
	lineNumbers
} from '@codemirror/view';
import { codeColors } from './code-colors.ts';
import { pairKeys, pairs } from './pairs.ts';
import { indentation, indentationKeys } from './typing.ts';

/**
 * Undo and redo, until the commands of the screen bring their shortcuts (step 16c): Ctrl+Z,
 * then Ctrl+Y, and Ctrl+Shift+Z, the habit of a Mac; Ctrl is Cmd there. The other keys of the
 * history of CodeMirror are left out: Ctrl+U shows the source of the page in a browser.
 */
const historyKeys: readonly KeyBinding[] = [
	{ key: 'Mod-z', run: undo, preventDefault: true },
	{ key: 'Mod-y', run: redo, preventDefault: true },
	{ key: 'Mod-Shift-z', run: redo, preventDefault: true }
];

/**
 * The editor: the rules of typing, the signs that close by themselves, the history, the keys of
 * every text field (the arrows, Home and End, Enter, Backspace, select all), the numbers of the
 * lines, the colors of the code. A key is tried in the order of the list: Backspace takes a pair
 * of signs before it takes an indentation or a character.
 * The selection and the cursor are drawn by the editor rather than by the browser, so that
 * they take our look. `label` names the code for a screen reader.
 */
export function editorSetup(label: string): Extension {
	return [
		indentation,
		pairs,
		history(),
		keymap.of([...pairKeys, ...indentationKeys, ...historyKeys, ...standardKeymap]),
		lineNumbers(),
		drawSelection(),
		dropCursor(),
		codeColors,
		EditorView.contentAttributes.of({ 'aria-label': label })
	];
}
