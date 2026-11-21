// The editor shown, as the screen asks it (see edits.ts): what joins CodeMirror, whose state is
// no signal of Svelte, to a screen that reads again what it showed once a signal has changed.
// Without a page, so that this link is tested (editing.svelte.spec.ts).

import type { EditorState, StateCommand } from '@codemirror/state';
import { applyEdit, canEdit, type Editing } from './edits.ts';

/** An editor followed for the screen. */
export interface FollowedEditing {
	/** What the screen asks the editor by. */
	editing: Editing;
	/**
	 * Says the state of the editor after one of its changes: the editor calls it at each one. A
	 * function of its own, given to the editor without its object.
	 */
	follow: (state: EditorState) => void;
}

/**
 * Follows an editor for the screen: the editor on its page, or what stands for it in a test.
 * `can` reads the state last said to `follow`, kept as a signal, never the editor itself: a row
 * of a menu that read it is then drawn again once the code has changed, greyed or not.
 */
export function followEditing(editor: Parameters<StateCommand>[0]): FollowedEditing {
	let latest = $state.raw(editor.state);
	return {
		editing: {
			can: (edit) => canEdit(edit, latest),
			apply: (edit) => {
				applyEdit(edit, editor);
			}
		},
		follow: (state) => {
			latest = state;
		}
	};
}
