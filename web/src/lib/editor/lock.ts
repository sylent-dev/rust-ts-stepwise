// The lock of the code (see Code editor in specs.md): while a program runs or is paused, the
// code can't be changed, since the line highlighted and the places of its errors are those of
// the text that started. The cursor still moves and the code can still be selected and copied.

import { Compartment, EditorState, type Extension, type TransactionSpec } from '@codemirror/state';

/** The part of an editor that a lock replaces, as its program starts and stops. */
const lock = new Compartment();

/**
 * Refuses every change of a locked code, whatever asks for it. The commands and the keys of
 * typing already do nothing in a code that can't be changed, each by its own check: a way to
 * write in the code that a later step adds can't forget it.
 */
const holds = EditorState.changeFilter.of((transaction) => !transaction.startState.readOnly);

/** The lock of an editor as it is made, on or off. */
export function lockOf(locked: boolean): Extension {
	return [lock.of(EditorState.readOnly.of(locked)), holds];
}

/** What locks the code of an editor, or gives it back: a transaction to give it. */
export function setLock(locked: boolean): TransactionSpec {
	return { effects: lock.reconfigure(EditorState.readOnly.of(locked)) };
}
