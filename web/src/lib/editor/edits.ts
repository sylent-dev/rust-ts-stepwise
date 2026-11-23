// What the screen asks of the editor (see Level screen and Code editor in specs.md): the edits
// of the menu **Edit**, each by its name. The editor knows neither the menus nor the shortcuts:
// the level screen gives each edit its row and its keys (level-screen/level-commands.ts), and
// the editor keeps no key for them. They read and change the state of the editor alone, so they
// are tested without a page.

import {
	moveLineDown,
	moveLineUp,
	redo,
	redoDepth,
	toggleLineComment,
	undo,
	undoDepth
} from '@codemirror/commands';
import { EditorState, type Extension, type StateCommand } from '@codemirror/state';
import type { Cursor } from './cursor.ts';

/** The edits, in the order of their menu. */
export const EDITS = ['undo', 'redo', 'comment-lines', 'move-line-up', 'move-line-down'] as const;

/** An edit that the screen asks of the editor. */
export type Edit = (typeof EDITS)[number];

/**
 * The sign that starts a comment, as the commands of CodeMirror ask for it. The core holds the
 * rule; a test checks that a line commented here is a comment for the core.
 */
export const comments: Extension = EditorState.languageData.of(() => [
	{ commentTokens: { line: '#' } }
]);

/**
 * **Comment lines**: comments the lines that the selection touches, or the line of the cursor,
 * with `# ` at the smallest of their indentations, and uncomments them once they all are; a
 * line that holds nothing is left out of several. The command of CodeMirror gives its change no
 * name, and the history joins such a change to the one before it: two of them in a row would be
 * one step that changes nothing. Named, each is a step of its own, and the cursor is shown.
 */
const commentLines: StateCommand = ({ state, dispatch }) =>
	toggleLineComment({
		state,
		dispatch: ({ changes, selection }) => {
			dispatch(
				state.update({ changes, selection, scrollIntoView: true, userEvent: 'input.comment' })
			);
		}
	});

/**
 * The command behind each edit. A line moved keeps its indentation, into a block as out of it,
 * and several selected lines move together.
 */
const COMMANDS = {
	undo,
	redo,
	'comment-lines': commentLines,
	'move-line-up': moveLineUp,
	'move-line-down': moveLineDown
} satisfies Record<Edit, StateCommand>;

/**
 * Whether an edit has something to do in this state: nothing to undo before the first change,
 * and nothing at all in a code that can't be changed, while its program runs or is paused
 * (lock.ts).
 */
export function canEdit(edit: Edit, state: EditorState): boolean {
	if (state.readOnly) return false;
	switch (edit) {
		case 'undo':
			return undoDepth(state) > 0;
		case 'redo':
			return redoDepth(state) > 0;
		case 'comment-lines':
		case 'move-line-up':
		case 'move-line-down':
			return true;
	}
}

/** Runs an edit on the editor: on its page, or on what stands for it in a test. */
export function applyEdit(edit: Edit, editor: Parameters<StateCommand>[0]): void {
	COMMANDS[edit](editor);
}

/** The editor shown, as the screen asks it. */
export interface Editing {
	/** Whether the edit has something to do now. It follows the code as it changes. */
	can(edit: Edit): boolean;
	apply(edit: Edit): void;
	/** The code as it is now. It follows the code as it changes. */
	readonly text: string;
	/** The place of the cursor. It follows the cursor as it moves. */
	readonly cursor: Cursor;
	/**
	 * The number of errors that the checks underline: it follows them, a moment after the last
	 * change (checks.ts).
	 */
	readonly errors: number;
	/**
	 * Opens the editor again on a text, as the first time: the code is replaced for good, and its
	 * history starts again, with nothing to undo. It isn't a change that the learner made: the
	 * editor doesn't say it as one (`onchange` of code-editor.svelte).
	 */
	reopen(text: string): void;
}
