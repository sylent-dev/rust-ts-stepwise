import { standardKeymap } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { describe, expect, it } from 'vitest';
import { loadTestCore } from '#lib/core/test-support.ts';
import { applyEdit, canEdit, EDITS } from './edits.ts';
import { isTypingInput, lockOf, setLock } from './lock.ts';
import { editorSetup } from './setup.ts';
import { explainByCode, press, shown, stateOf, takes, type } from './test-support.ts';

loadTestCore();

/**
 * The whole editor on a text, `|` at the cursor, its code locked or not; `refused` hears the
 * learner try to change it while it is locked.
 */
function editor(marked: string, locked: boolean, refused?: () => void) {
	return stateOf(marked, [editorSetup('Code', explainByCode), lockOf(locked, refused)]);
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

	it('keeps Tab and Shift+Tab, so that the keyboard stays in the code', () => {
		const locked = editor('forward()|\n', true);
		expect([takes(locked, 'Tab'), takes(locked, 'Tab', true)]).toEqual([true, true]);
		// Given back, the code takes Tab by writing with it, as before.
		const open = locked.update(setLock(false)).state;
		expect(shown(press(open, 'Tab'))).toBe('forward()   |\n');
	});

	it('says that the learner tried to erase in it, with every key of erasing', () => {
		let refusals = 0;
		const locked = editor('forward()\n    turn|_left()\n', true, () => {
			refusals += 1;
		});
		for (const key of ['Backspace', 'Delete', 'Mod-Backspace', 'Mod-Delete']) {
			expect(shown(press(locked, key)), key).toBe(shown(locked));
		}
		press(locked, 'Backspace', true);
		expect(refusals).toBe(5);
	});

	it('hears each key of erasing that the keys of every editor take from the browser', () => {
		// Taken even in a locked code, where they do nothing: the browser says nothing of them.
		const erasing = standardKeymap.filter(
			({ preventDefault, run }) =>
				preventDefault === true && run?.name.startsWith('delete') === true
		);
		const heard = stateOf('|', lockOf(true)).facet(keymap).flat();
		expect(erasing.length).toBeGreaterThan(0);
		for (const { key, mac, shift } of erasing) {
			const found = heard.find((binding) => binding.key === key && binding.mac === mac);
			expect(found, `${key ?? ''} ${mac ?? ''}`).toBeDefined();
			expect(found?.shift !== undefined, `${key ?? ''} with Shift`).toBe(shift !== undefined);
		}
	});

	it('says that the learner tried to indent it, with Tab or Shift+Tab', () => {
		let refusals = 0;
		const locked = editor('forward()|\n', true, () => {
			refusals += 1;
		});
		press(locked, 'Tab');
		press(locked, 'Tab', true);
		expect(refusals).toBe(2);
		// Given back, the code is indented, and nothing is refused.
		press(locked.update(setLock(false)).state, 'Tab');
		expect(refusals).toBe(2);
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

describe('isTypingInput', () => {
	it('tells typing from what the browser does to a text otherwise', () => {
		const typing = [
			'insertText',
			'insertParagraph',
			'insertFromPaste',
			'insertFromDrop',
			'insertCompositionText',
			'deleteContentBackward',
			'deleteWordBackward',
			'deleteByCut'
		];
		expect(typing.filter(isTypingInput)).toEqual(typing);
		expect(['historyUndo', 'historyRedo', 'formatBold'].filter(isTypingInput)).toEqual([]);
	});
});
