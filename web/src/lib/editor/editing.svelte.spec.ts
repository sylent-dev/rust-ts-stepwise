// The editor followed for the screen, with its effects run as in a browser (see
// vitest-node-client.ts). The editor of these tests has the history and the breakpoints alone,
// without the colors nor the rules of typing; the core says where a breakpoint goes.

import { history } from '@codemirror/commands';
import { EditorState, type Transaction } from '@codemirror/state';
import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';
import { loadTestCore } from '#lib/core/test-support.ts';
import { breakpoints } from './breakpoints.ts';
import { followEditing } from './editing.svelte.ts';

loadTestCore();

/**
 * What stands for the editor on its page: it keeps its state, and says each change to what
 * follows it, as the editor does. Opened again, it takes a new state, which it says to nothing.
 * It counts the times it was given the keyboard.
 */
function editorOf(text: string) {
	let focused = 0;
	let state = EditorState.create({ doc: text, extensions: [history(), breakpoints([])] });
	const editor = {
		get state() {
			return state;
		},
		dispatch(transaction: Transaction) {
			state = transaction.state;
			follow(state);
		}
	};
	const { editing, follow } = followEditing(
		editor,
		(reopened) => {
			state = EditorState.create({ doc: reopened, extensions: [history(), breakpoints([])] });
		},
		() => {
			focused += 1;
		}
	);
	return {
		editing,
		text: () => state.doc.toString(),
		selection: () => state.selection.main,
		focused: () => focused,
		/** Puts the cursor at a place of the code. */
		moveTo(place: number) {
			editor.dispatch(state.update({ selection: { anchor: place } }));
		},
		/** Writes a text at a place of the code. */
		write(at: number, written: string) {
			editor.dispatch(state.update({ changes: { from: at, insert: written } }));
		},
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

	it('gives the code as it is now', () => {
		const editor = editorOf('forward()');

		expect(editor.editing.text).toBe('forward()');
		editor.type('\nback()');
		expect(editor.editing.text).toBe('forward()\nback()');
	});

	it('opens the editor again on a text, with nothing to undo', () => {
		const editor = editorOf('forward()');
		editor.type('\nback()');

		editor.editing.reopen('turn_left()');

		expect(editor.text()).toBe('turn_left()');
		expect(editor.editing.text).toBe('turn_left()');
		expect(editor.editing.can('undo')).toBe(false);
		expect(editor.editing.can('redo')).toBe(false);
	});

	it('has what read the code read it again once the editor has opened again', () => {
		const editor = editorOf('forward()');
		const seen: string[] = [];
		const leave = $effect.root(() => {
			$effect(() => {
				seen.push(editor.editing.text);
			});
		});
		flushSync();

		editor.type('\nback()');
		flushSync();
		editor.editing.reopen('forward()');
		flushSync();

		expect(seen).toEqual(['forward()', 'forward()\nback()', 'forward()']);
		leave();
	});

	it('has what read the cursor read it again once the cursor has moved', () => {
		const editor = editorOf('forward()\nback()');
		const seen: string[] = [];
		const leave = $effect.root(() => {
			$effect(() => {
				const { line, column } = editor.editing.cursor;
				seen.push(`${String(line)}:${String(column)}`);
			});
		});
		flushSync();

		editor.moveTo(12);
		flushSync();

		expect(seen).toEqual(['1:1', '2:3']);
		leave();
	});

	it('counts no error in an editor without the checks', () => {
		expect(editorOf('print(sidse)').editing.errors).toBe(0);
	});

	it('puts the cursor at a place, and gives the code the keyboard', () => {
		const editor = editorOf('forward()\nfoward()\n');

		editor.editing.showPlace(10);

		expect(editor.selection()).toMatchObject({ anchor: 10, head: 10 });
		expect(editor.editing.cursor).toEqual({ line: 2, column: 1 });
		expect(editor.focused()).toBe(1);
	});

	it('gives the code the keyboard, the cursor where it is', () => {
		const editor = editorOf('forward()\nfoward()\n');
		editor.moveTo(4);

		editor.editing.focus();

		expect(editor.selection()).toMatchObject({ anchor: 4, head: 4 });
		expect(editor.focused()).toBe(1);
	});

	it('sets and removes a breakpoint on the line of the cursor, and takes them all away', () => {
		const editor = editorOf('forward()\n\nturn_right()\nturn_left()');

		editor.moveTo(10);
		editor.editing.toggleBreakpoint();
		expect(editor.editing.breakpoints).toEqual([3]);
		editor.moveTo(0);
		editor.editing.toggleBreakpoint();
		expect(editor.editing.breakpoints).toEqual([1, 3]);
		editor.editing.toggleBreakpoint();
		expect(editor.editing.breakpoints).toEqual([3]);
		editor.editing.removeBreakpoints();
		expect(editor.editing.breakpoints).toEqual([]);
	});

	it('puts each breakpoint on a line where a step starts, as the program starts', () => {
		const editor = editorOf('forward()\nturn_right()\nturn_left()');
		editor.moveTo(10);
		editor.editing.toggleBreakpoint();
		expect(editor.editing.breakpoints).toEqual([2]);
		// The line becomes a comment: its breakpoint stays with it.
		editor.write(10, '# ');
		expect(editor.editing.breakpoints).toEqual([2]);

		editor.editing.settleBreakpoints();
		expect(editor.editing.breakpoints).toEqual([3]);
	});

	it('has what read the breakpoints read them again once they have changed', () => {
		const editor = editorOf('forward()');
		const seen: (readonly number[])[] = [];
		const leave = $effect.root(() => {
			$effect(() => {
				seen.push(editor.editing.breakpoints);
			});
		});
		flushSync();

		editor.editing.toggleBreakpoint();
		flushSync();
		editor.editing.removeBreakpoints();
		flushSync();

		expect(seen).toEqual([[], [1], []]);
		leave();
	});

	it('puts the cursor at the end of the code for a place past it', () => {
		const editor = editorOf('forward()');

		editor.editing.showPlace(50);

		expect(editor.selection().anchor).toBe(9);
	});
});
