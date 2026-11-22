import { describe, expect, it } from 'vitest';
import { loadTestCore } from '#lib/core/test-support.ts';
import { applyEdit, canEdit, EDITS } from './edits.ts';
import { lockOf, setLock } from './lock.ts';
import { editorSetup } from './setup.ts';
import { explainByCode, press, shown, stateOf, type } from './test-support.ts';

loadTestCore();

/** The whole editor on a text, `|` at the cursor, its code locked or not. */
function editor(marked: string, locked: boolean) {
	return stateOf(marked, [editorSetup('Code', explainByCode), lockOf(locked)]);
}

/** The state after an edit of the screen, or the same state when the edit does nothing. */
function edited(state: ReturnType<typeof editor>, edit: (typeof EDITS)[number]) {
	let next = state;
	applyEdit(edit, {
		state,
		dispatch: (transaction) => {
			next = transaction.state;
		}
	});
	return next;
}

describe('a locked code', () => {
	it('keeps its text under every key of typing', () => {
		const locked = editor('forward()\n    turn|_left()\n', true);
		for (const key of ['Enter', 'Tab', 'Backspace', 'Delete']) {
			expect(shown(press(locked, key)), key).toBe(shown(locked));
		}
		expect(shown(press(locked, 'Tab', true))).toBe(shown(locked));
		expect(type(locked, 'x(').doc).toEqual(locked.doc);
	});

	it('refuses every edit of the screen, which says that it can’t run', () => {
		// A change then undone: an open code could redo it, comment its line and move it.
		const open = edited(type(editor('forward()\nturn|_left()\n', false), 'x'), 'undo');
		const locked = open.update(setLock(true)).state;
		for (const edit of EDITS) {
			expect(canEdit(edit, locked), edit).toBe(false);
			expect(edited(locked, edit).doc, edit).toEqual(locked.doc);
		}
		expect(canEdit('redo', open)).toBe(true);
	});

	it('refuses a change that nothing checked', () => {
		const locked = editor('forward()|\n', true);
		const written = locked.update({ changes: { from: 0, insert: '# ' } }).state;
		expect(written.doc).toEqual(locked.doc);
	});

	it('still moves its cursor', () => {
		const locked = editor('|forward()\n', true);
		expect(shown(locked.update({ selection: { anchor: 9 } }).state)).toBe('forward()|\n');
	});

	it('can be changed again once the lock is off, its history kept', () => {
		const typed = type(editor('forward()|\n', false), 'x');
		const locked = typed.update(setLock(true)).state;
		const open = locked.update(setLock(false)).state;
		expect(shown(type(open, 'y'))).toBe('forward()xy|\n');
		expect(canEdit('undo', open)).toBe(true);
		expect(shown(edited(open, 'undo'))).toBe('forward()|\n');
	});
});
