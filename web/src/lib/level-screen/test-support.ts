// What the tests of the level screen share: what the screen gives its commands, and an editor
// that stands for the one on its page. Used by the tests alone.

import { type Edit, type Editing, EDITS } from '#lib/editor/edits.ts';
import type { CommandTarget } from './level-commands.ts';

/** An editor that can do the given edits, and remembers the ones it was asked. */
export function editorFor(able: readonly Edit[] = EDITS): Editing & { asked: Edit[] } {
	const asked: Edit[] = [];
	return {
		asked,
		can: (edit) => able.includes(edit),
		apply: (edit) => asked.push(edit),
		text: '',
		reopen: () => {}
	};
}

/**
 * What a screen gives its commands: the editor shown, if any, and whether its code has something
 * to restore. It counts the confirmations it was asked to open.
 */
export function screenWith(
	editing: () => Editing | undefined = () => undefined,
	canRestore = false
): CommandTarget & { confirmations: number } {
	const screen = {
		confirmations: 0,
		editing,
		canRestore: () => canRestore,
		confirmRestore: () => {
			screen.confirmations += 1;
		}
	};
	return screen;
}
