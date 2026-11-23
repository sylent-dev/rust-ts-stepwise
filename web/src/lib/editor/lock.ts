// The lock of the code (see Code editor in specs.md): while a program runs or is paused, the
// code can't be changed, since the line highlighted and the places of its errors are those of
// the text that started. The cursor still moves and the code can still be selected and copied.
// The editor says when the learner tries to change it all the same, so that the screen can tell
// them why nothing happens.

import {
	Compartment,
	EditorState,
	type Extension,
	Facet,
	type TransactionSpec
} from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';

/** The part of an editor that a lock replaces, as its program starts and stops. */
const lock = new Compartment();

/** What the screen gives to hear that the learner tried to change a locked code. */
const refusals = Facet.define<() => void>();

/** Says to the screen that the learner tried to change a locked code. */
function refuse(view: EditorView): void {
	for (const heard of view.state.facet(refusals)) heard();
}

/** Takes a key of typing in a locked code, which changes nothing, and says it to the screen. */
function refuseKey(view: EditorView): boolean {
	refuse(view);
	return true;
}

/**
 * The keys that a locked code takes itself, and says to the screen. Tab and Shift+Tab belong to
 * the code (see Code editor in specs.md): they change nothing, and the keyboard stays in it. The
 * keys of typing leave a key that has nothing to do to the browser, which would take the focus
 * out of the code with this one; Escape, then Tab, still does, on purpose. The keys of erasing,
 * as the keys of every editor name them (`standardKeymap`), which take them from the browser even
 * in a locked code where they do nothing: the browser would say nothing of them (a test compares
 * the two lists). The other keys of typing reach the browser, which says them (`hears`).
 */
const lockedKeys = keymap.of([
	{ key: 'Tab', run: refuseKey, shift: refuseKey },
	{ key: 'Backspace', run: refuseKey, shift: refuseKey },
	{ key: 'Delete', run: refuseKey },
	{ key: 'Mod-Backspace', mac: 'Alt-Backspace', run: refuseKey },
	{ key: 'Mod-Delete', mac: 'Alt-Delete', run: refuseKey },
	{ mac: 'Mod-Backspace', run: refuseKey },
	{ mac: 'Mod-Delete', run: refuseKey }
]);

/** What the lock puts in its part of the editor, on or off. */
function part(locked: boolean): Extension {
	return locked ? [EditorState.readOnly.of(true), lockedKeys] : EditorState.readOnly.of(false);
}

/**
 * Refuses every change of a locked code, whatever asks for it. The commands and the keys of
 * typing already do nothing in a code that can't be changed, each by its own check: a way to
 * write in the code that a later step adds can't forget it.
 */
const holds = EditorState.changeFilter.of((transaction) => !transaction.startState.readOnly);

/**
 * Whether what the browser is about to do to the text of the code (the `inputType` of its
 * `beforeinput`) is typing: a character written or erased, a line broken, a text pasted, cut or
 * dropped. Not the undo or the redo of the browser, which no key of typing asks for (its menu of
 * a right click does), nor a format, which the code has none of.
 */
export function isTypingInput(inputType: string): boolean {
	return inputType.startsWith('insert') || inputType.startsWith('delete');
}

/**
 * Hears what the learner tries in a locked code, without changing what the editor does with it:
 * a character written or a line broken, which the editor leaves to the browser and then takes
 * back, and a text pasted, cut or dropped, which the editor takes before the browser says
 * anything.
 */
const hears = EditorView.domEventObservers({
	beforeinput(event, view) {
		if (view.state.readOnly && isTypingInput(event.inputType)) refuse(view);
	},
	paste(_event, view) {
		if (view.state.readOnly) refuse(view);
	},
	cut(_event, view) {
		if (view.state.readOnly) refuse(view);
	},
	drop(_event, view) {
		if (view.state.readOnly) refuse(view);
	}
});

/**
 * The lock of an editor as it is made, on or off. `refused` hears the learner try to change the
 * code while it is locked: a character written or erased, a line broken, an indentation (Tab
 * and Shift+Tab), a text pasted, cut or dropped; never an arrow, a selection or a shortcut.
 */
export function lockOf(locked: boolean, refused?: () => void): Extension {
	return [lock.of(part(locked)), holds, hears, refused ? refusals.of(refused) : []];
}

/** What locks the code of an editor, or gives it back: a transaction to give it. */
export function setLock(locked: boolean): TransactionSpec {
	return { effects: lock.reconfigure(part(locked)) };
}
