// The editor followed for the screen, with its effects run as in a browser (see
// vitest-node-client.ts). The core can't load here, so the editor of these tests has the history
// alone, without the colors nor the rules of typing that ask the core.

import { history } from '@codemirror/commands';
import { EditorState, type Transaction } from '@codemirror/state';
import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';
import { followEditing } from './editing.svelte.ts';

/**
 * What stands for the editor on its page: it keeps its state, and says each change to what
 * follows it, as the editor does.
 */
function editorOf(text: string) {
	let state = EditorState.create({ doc: text, extensions: history() });
	const editor = {
		get state() {
			return state;
		},
		dispatch(transaction: Transaction) {
			state = transaction.state;
			follow(state);
		}
	};
	const { editing, follow } = followEditing(editor);
	return {
		editing,
		text: () => state.doc.toString(),
		/** Types a text at the end of the code. */
		type(typed: string) {
			editor.dispatch(
				state.update({
					changes: { from: state.doc.length, insert: typed },
					userEvent: 'input.type'
				})
			);
		}
	};
}

describe('followEditing', () => {
	it('asks the editor for an edit', () => {
		const editor = editorOf('forward()');

		editor.type('\nback()');
		editor.editing.apply('undo');

		expect(editor.text()).toBe('forward()');
	});

	it('says what the editor can do now', () => {
		const editor = editorOf('forward()');

		expect(editor.editing.can('undo')).toBe(false);
		editor.type('\nback()');
		expect(editor.editing.can('undo')).toBe(true);
		expect(editor.editing.can('redo')).toBe(false);
	});

	it('has what read it read again once the code has changed', () => {
		const editor = editorOf('forward()');
		const seen: boolean[] = [];
		const leave = $effect.root(() => {
			$effect(() => {
				seen.push(editor.editing.can('undo'));
			});
		});
		flushSync();

		editor.type('\nback()');
		flushSync();
		editor.editing.apply('undo');
		flushSync();

		expect(seen).toEqual([false, true, false]);
		leave();
	});
});
