import { hasNextSnippetField } from '@codemirror/autocomplete';
import { Compartment, EditorSelection, EditorState, type TransactionSpec } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { beforeAll, describe, expect, it } from 'vitest';
import { vocabulary } from '#lib/core/core.ts';
import { loadTestCore } from '#lib/core/test-support.ts';
import {
	press,
	pressedChange,
	shown,
	stateOf as markedState,
	takes,
	type
} from '#lib/editor/test-support.ts';
import { indentation } from '#lib/editor/typing.ts';
import {
	closeMenu,
	editorMenu,
	menuViewOf,
	openMenu,
	openMenuOf,
	optionId
} from './editor-menu.ts';
import { type Category, type MenuEntry, menuEntries } from './words.ts';

let entries: readonly MenuEntry[] = [];

beforeAll(() => {
	loadTestCore();
	entries = menuEntries(vocabulary());
});

/** Where the code is locked or not, as the editor locks it while its program runs. */
const lockSlot = new Compartment();

/** A state of the editor with the menu, from a text where `|` marks the cursor. */
function stateOf(marked: string): EditorState {
	return markedState(marked, [
		indentation,
		editorMenu(entries, 'menu'),
		lockSlot.of(EditorState.readOnly.of(false))
	]);
}

/** The state after a change. */
function changed(state: EditorState, spec: TransactionSpec): EditorState {
	return state.update(spec).state;
}

/** A state with the menu open at the cursor, on a category. */
function opened(marked: string, category: Category = 'move'): EditorState {
	const state = stateOf(marked);
	return changed(state, openMenu(state, category));
}

/** The letters that filter the words, and the word chosen, while the menu is open. */
function menuOf(state: EditorState): { letters: string; chosen: string | undefined } | undefined {
	const view = menuViewOf(state, entries);
	return view && { letters: view.letters, chosen: view.chosen?.label };
}

/** The state after keys pressed one after the other. */
function pressed(state: EditorState, ...keys: string[]): EditorState {
	return keys.reduce((current, key) => press(current, key), state);
}

describe('openMenu', () => {
	it('opens under the name that the cursor ends, whose letters filter the words', () => {
		const state = opened('let sides = 0\npai|');

		expect(openMenuOf(state)?.from).toBe('let sides = 0\n'.length);
		expect(menuOf(state)).toEqual({ letters: 'pai', chosen: 'start_painting(color)' });
	});

	it('opens on the category given, its first word chosen, where no name ends at the cursor', () => {
		expect(menuOf(opened('forward()\n|', 'logic'))).toEqual({ letters: '', chosen: 'not' });
		expect(menuOf(opened('print(|)', 'colors'))).toEqual({ letters: '', chosen: 'red' });
	});

	it('reads a name in any alphabet, its digits and its underscores', () => {
		expect(menuOf(opened('côté_2|'))?.letters).toBe('côté_2');
	});

	it('gives way to the cursor at the end of a selection', () => {
		const state = opened('|turn|');

		expect(shown(state)).toBe('turn|');
		expect(menuOf(state)?.letters).toBe('turn');
	});
});

describe('the open menu', () => {
	it('stays open while the learner types the letters of a name, the first word chosen again', () => {
		const state = type(pressed(opened('pai|'), 'ArrowDown'), 'nt');

		expect(menuOf(state)).toEqual({ letters: 'paint', chosen: 'start_painting(color)' });
	});

	it('stays open while the letters are erased, down to the start of the name', () => {
		const state = changed(opened('pa|'), { changes: { from: 0, to: 2 } });

		expect(menuOf(state)).toEqual({ letters: '', chosen: 'forward()' });
	});

	it.each([
		['a space typed', (state: EditorState) => type(state, ' ')],
		['a parenthesis typed', (state: EditorState) => type(state, '(')],
		[
			'the cursor before the name',
			(state: EditorState) => changed(state, { selection: { anchor: 0 } })
		],
		['a selection', (state: EditorState) => changed(state, { selection: { anchor: 6, head: 8 } })],
		[
			'a second cursor',
			(state: EditorState) =>
				changed(state, {
					selection: EditorSelection.create([EditorSelection.cursor(2), EditorSelection.cursor(9)])
				})
		],
		[
			'a change before the name',
			(state: EditorState) => changed(state, { changes: { from: 0, insert: '#' } })
		],
		[
			'the code locked',
			(state: EditorState) =>
				changed(state, { effects: lockSlot.reconfigure(EditorState.readOnly.of(true)) })
		],
		['Escape', (state: EditorState) => press(state, 'Escape')],
		['the command again', (state: EditorState) => changed(state, { effects: closeMenu })]
	])('closes on %s, the letters left in the code', (_name, act) => {
		const state = act(opened('x = 1\npai|'));

		expect(openMenuOf(state)).toBeNull();
		expect(state.doc.toString()).toContain('pai');
	});

	it('chooses the first word again once the cursor moves in the name', () => {
		const state = changed(pressed(opened('paint|'), 'ArrowDown'), { selection: { anchor: 3 } });

		expect(menuOf(state)).toEqual({ letters: 'pai', chosen: 'start_painting(color)' });
	});

	it('leaves Escape to the code once it has closed the menu, so that Tab then leaves the code', () => {
		const state = opened('pai|');

		expect(takes(state, 'Escape')).toBe(false);
		expect(openMenuOf(press(state, 'Escape'))).toBeNull();
	});

	it('closes once the keyboard leaves the code', () => {
		const state = opened('pai|');
		const effects = state
			.facet(EditorView.focusChangeEffect)
			.map((effect) => effect(state, false))
			.filter((effect) => effect !== null);

		expect(openMenuOf(changed(state, { effects }))).toBeNull();
	});

	it('says the list and the word chosen to a screen reader, on the code', () => {
		const attributes = (state: EditorState) => {
			const all: Record<string, string> = {};
			for (const set of state.facet(EditorView.contentAttributes)) Object.assign(all, set);
			return all;
		};

		expect(attributes(opened('pai|'))).toMatchObject({
			'aria-controls': 'menu',
			'aria-activedescendant': optionId('menu', 'start_painting')
		});
		expect(attributes(stateOf('pai|'))['aria-controls']).toBeUndefined();
		expect(attributes(opened('pizza|'))).toEqual({
			'aria-autocomplete': 'list',
			'aria-haspopup': 'listbox'
		});
		expect(optionId('menu', 'else if')).toBe('menu-else-if');
	});
});

describe('the keys of the open menu', () => {
	it('choose with ↑ and ↓, and change the category with ← and →', () => {
		expect(menuOf(pressed(opened('|'), 'ArrowDown'))?.chosen).toBe('turn_left()');
		expect(menuOf(pressed(opened('|'), 'ArrowUp'))?.chosen).toBe('turn_right()');
		expect(menuOf(pressed(opened('|'), 'ArrowRight'))?.chosen).toBe('start_painting(color)');
		expect(menuOf(pressed(opened('|'), 'ArrowLeft'))?.chosen).toBe('function');
	});

	it('are left to the code while the menu is closed', () => {
		for (const key of [
			'ArrowUp',
			'ArrowDown',
			'ArrowLeft',
			'ArrowRight',
			'Tab',
			'Enter',
			'Escape'
		]) {
			expect([key, takes(stateOf('pai|'), key)]).toEqual([key, false]);
		}
	});

	it.each(['Tab', 'Enter'])('insert the word chosen in place of the letters with %s', (key) => {
		const state = pressed(opened('let x = 0\npai|'), 'ArrowDown', key);

		expect(shown(state)).toBe('let x = 0\nstop_painting()|');
		expect(openMenuOf(state)).toBeNull();
	});

	it('insert as text written, one step of the history', () => {
		const change = pressedChange(opened('pai|'), 'Enter');

		expect(change?.isUserEvent('input')).toBe(true);
	});

	it('insert nothing while nothing matches the letters, and keep the menu open', () => {
		const state = pressed(opened('pizza|'), 'Enter', 'Tab');

		expect(shown(state)).toBe('pizza|');
		expect(openMenuOf(state)).not.toBeNull();
	});
});

describe('what the menu inserts', () => {
	it('puts the cursor between the parentheses of a function that takes values', () => {
		expect(shown(pressed(opened('here|'), 'Enter'))).toBe('here_is(|)');
		expect(shown(pressed(opened('prin|'), 'Enter'))).toBe('print(|)');
	});

	it('puts the cursor after a word that has nothing to fill in', () => {
		expect(shown(pressed(opened('if x:\n    brea|'), 'Enter'))).toBe('if x:\n    break|');
		expect(shown(pressed(opened('let c = re|'), 'Enter'))).toBe('let c = red|');
	});

	it('opens a block on its first line, one indentation more than the line', () => {
		const state = pressed(opened('repeat 2:\n    whil|'), 'Enter');

		expect(shown(state)).toBe('repeat 2:\n    while |:\n        ');
	});

	it.each(['Enter', 'Tab'])(
		'goes on with %s from the condition to the line of the block',
		(key) => {
			const typed = type(pressed(opened('if|'), 'Enter'), 'front_is_clear()');
			const state = press(typed, key);

			expect(shown(state)).toBe('if front_is_clear():\n    |');
			expect(hasNextSnippetField(state)).toBe(false);
		}
	);

	it('goes from the name of a function to its parameters, then to its block', () => {
		const named = type(pressed(opened('fun|'), 'Enter'), 'paint_side');
		const given = type(press(named, 'Tab'), 'length');

		expect(shown(press(given, 'Enter'))).toBe('function paint_side(length):\n    |');
	});

	it('goes from the name of a variable to its value', () => {
		const named = type(pressed(opened('let|'), 'Enter'), 'sides');

		expect(shown(press(named, 'Tab'))).toBe('let sides = |');
	});

	it('ends the places with Escape, Tab and Enter being the keys of the code again', () => {
		const inserted = pressed(opened('whi|'), 'Enter');
		const state = press(inserted, 'Escape');

		expect(hasNextSnippetField(state)).toBe(false);
		expect(takes(state, 'Tab')).toBe(false);
		// The Escape of the code too, so that Tab then leaves the code.
		expect(takes(inserted, 'Escape')).toBe(false);
	});

	it('chooses a word of the code once a place holds one', () => {
		const inside = pressed(opened('if|'), 'Enter');
		const filled = pressed(changed(inside, openMenu(inside, 'sense')), 'Enter');

		expect(shown(filled)).toBe('if front_is_clear()|:\n    ');
		expect(shown(press(filled, 'Enter'))).toBe('if front_is_clear():\n    |');
	});
});
