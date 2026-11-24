// The command menu in the editor (see Command menu in specs.md): where it is open, what is chosen
// in it, the keys that it takes while it is open, and what it inserts, with the places to fill in.
// It reads and changes the state of the editor alone, so it is tested without a page; the panel
// that shows it is given by the screen (`menuPanel`), which mounts it.

import { clearSnippet, nextSnippetField, snippet, snippetKeymap } from '@codemirror/autocomplete';
import {
	type EditorState,
	type Extension,
	Facet,
	Prec,
	StateEffect,
	StateField,
	type Transaction,
	type TransactionSpec
} from '@codemirror/state';
import {
	EditorView,
	keymap,
	type KeyBinding,
	showTooltip,
	type Tooltip,
	type TooltipView
} from '@codemirror/view';
import {
	type Choice,
	chooseCategory,
	type MenuMove,
	type MenuView,
	menuView,
	moveChoice
} from './results.ts';
import type { Category, MenuEntry, MenuWord } from './words.ts';

/** The editor as a command of the menu reads it and changes it: on its page, or in a test. */
type Editor = Pick<EditorView, 'state' | 'dispatch'>;

/** The menu open in the editor. */
export interface OpenMenu {
	/**
	 * Where the name at the cursor starts: the letters typed from there to the cursor filter
	 * the words, and the word inserted takes their place.
	 */
	readonly from: number;
	readonly choice: Choice;
	/** The panel under the name, the same object as long as the menu stays open there. */
	readonly tooltip: Tooltip;
}

/** Opens the menu, changes what is chosen in it, or closes it (`null`). */
export const setMenu = StateEffect.define<OpenMenu | null>();

/** The characters of a name, in any alphabet, as the letters that the menu reads. */
const NAME = /^[\p{L}\p{N}_]*$/u;

/**
 * Whether the menu stays open after a change: while the cursor stays alone after the start of the
 * name, with nothing but the characters of a name between the two, and the code can be changed.
 * Letters typed or erased choose the first word again. The word that the menu inserts closes it.
 */
function stillOpen(menu: OpenMenu, transaction: Transaction): OpenMenu | null {
	const { state, changes, docChanged } = transaction;
	if (state.readOnly || transaction.isUserEvent('input.complete')) return null;
	if (docChanged && changes.mapPos(menu.from, -1) !== menu.from) return null;
	const { ranges, main } = state.selection;
	if (ranges.length > 1 || !main.empty || main.head < menu.from) return null;
	if (!NAME.test(state.sliceDoc(menu.from, main.head))) return null;
	return docChanged ? { ...menu, choice: { category: menu.choice.category } } : menu;
}

/** The menu open in the editor, or nothing. */
export const menuField = StateField.define<OpenMenu | null>({
	create: () => null,
	update(menu, transaction) {
		for (const effect of transaction.effects) {
			if (effect.is(setMenu)) return effect.value;
		}
		return menu && stillOpen(menu, transaction);
	},
	provide: (field) => showTooltip.from(field, (menu) => menu?.tooltip ?? null)
});

/** The menu open in a state of the editor, or nothing. */
export function openMenuOf(state: EditorState): OpenMenu | null {
	return state.field(menuField, false) ?? null;
}

/** The letters typed since the start of the name, which filter the words. */
function lettersOf(state: EditorState, menu: OpenMenu): string {
	return state.sliceDoc(menu.from, state.selection.main.head);
}

/** What the menu open in a state shows, or nothing while it is closed. */
export function menuViewOf(
	state: EditorState,
	entries: readonly MenuEntry[]
): MenuView | undefined {
	const menu = openMenuOf(state);
	return menu ? menuView(entries, lettersOf(state, menu), menu.choice) : undefined;
}

/**
 * Makes the panel of the menu in the editor. The screen gives it, since the editor doesn't know
 * the components; nothing but an empty block in a test.
 */
export const menuPanel = Facet.define<
	(view: EditorView) => TooltipView,
	(view: EditorView) => TooltipView
>({
	combine: (makers) => makers[0] ?? (() => ({ dom: document.createElement('div') }))
});

/**
 * Opens the menu at the cursor, on a category: under the name that the cursor ends, whose letters
 * filter the words; a selection gives way to the cursor at its end.
 */
export function openMenu(state: EditorState, category: Category): TransactionSpec {
	const { head } = state.selection.main;
	const line = state.doc.lineAt(head);
	const before = line.text.slice(0, head - line.from);
	const from = head - (/[\p{L}\p{N}_]*$/u.exec(before)?.[0].length ?? 0);
	const tooltip: Tooltip = {
		pos: from,
		above: false,
		create: (view) => view.state.facet(menuPanel)(view)
	};
	return {
		selection: { anchor: head },
		effects: setMenu.of({ from, choice: { category }, tooltip }),
		scrollIntoView: true
	};
}

/** Closes the menu, leaving the letters typed in the code. */
export const closeMenu: StateEffect<OpenMenu | null> = setMenu.of(null);

/** Gives the open menu another choice; nothing happens while it is closed. */
function choose(editor: Editor, choice: Choice): void {
	const menu = openMenuOf(editor.state);
	if (menu) editor.dispatch(editor.state.update({ effects: setMenu.of({ ...menu, choice }) }));
}

/** Chooses a word of the menu, as the pointer does. */
export function chooseWord(editor: Editor, entry: MenuEntry): void {
	choose(editor, { category: entry.category, word: entry.word });
}

/** Chooses a category of the menu, as a click does. */
export function chooseCategoryOf(
	editor: Editor,
	entries: readonly MenuEntry[],
	category: Category
): void {
	const menu = openMenuOf(editor.state);
	if (!menu) return;
	choose(editor, chooseCategory(entries, lettersOf(editor.state, menu), menu.choice, category));
}

/**
 * Inserts a word in place of the letters typed and closes the menu: a statement with its places
 * to fill in, the cursor on the first one (see `STATEMENTS` in words.ts). One step of the history,
 * which says it as text written (`input.complete`).
 */
export function insertEntry(editor: Editor, entry: MenuEntry): void {
	const menu = openMenuOf(editor.state);
	if (!menu) return;
	snippet(entry.snippet)(
		editor,
		{ label: entry.label },
		menu.from,
		editor.state.selection.main.head
	);
}

/** The keys of the open menu: none of them reaches the code while it is open. */
function menuBindings(entries: readonly MenuEntry[]): KeyBinding[] {
	/** Runs `act` on the open menu, and takes the key; leaves the key to the code otherwise. */
	const whileOpen =
		(act: (editor: Editor, menu: OpenMenu) => void) =>
		(editor: Editor): boolean => {
			const menu = openMenuOf(editor.state);
			if (!menu) return false;
			act(editor, menu);
			return true;
		};
	const move = (direction: MenuMove) =>
		whileOpen((editor, menu) => {
			choose(editor, moveChoice(entries, lettersOf(editor.state, menu), menu.choice, direction));
		});
	// Nothing to insert while nothing matches the letters: the key does nothing.
	const insert = whileOpen((editor, menu) => {
		const chosen = menuView(entries, lettersOf(editor.state, menu), menu.choice).chosen;
		if (chosen) insertEntry(editor, chosen);
	});
	return [
		{ key: 'ArrowUp', run: move('up') },
		{ key: 'ArrowDown', run: move('down') },
		{ key: 'ArrowLeft', run: move('left') },
		{ key: 'ArrowRight', run: move('right') },
		{ key: 'Tab', run: insert },
		{ key: 'Enter', run: insert },
		{
			key: 'Escape',
			run: whileOpen((editor) => {
				editor.dispatch(editor.state.update({ effects: closeMenu }));
			})
		}
	];
}

/**
 * The keys of the places to fill in, once a statement is inserted: Tab or Enter goes on to the next
 * place, and at the last one they are Tab and Enter again; Escape ends the places (decided on
 * 2026-11-24). Shift+Tab keeps its own meaning, which unindents the line.
 */
const PLACES: readonly KeyBinding[] = [
	{ key: 'Tab', run: nextSnippetField },
	{ key: 'Enter', run: nextSnippetField },
	{ key: 'Escape', run: clearSnippet }
];

/** The menu closes once the keyboard leaves the code. */
const closeOnBlur = EditorView.focusChangeEffect.of((state, focusing) =>
	!focusing && openMenuOf(state) ? closeMenu : null
);

/** The id of an option of the list of a menu, for a screen reader. */
export function optionId(listId: string, word: MenuWord): string {
	return `${listId}-${word.replace(' ', '-')}`;
}

/**
 * What a screen reader is told of the open menu, on the code that keeps the keyboard: a list
 * opened from it (`listId`), and the word chosen in it, as the menu of CodeMirror says it.
 */
function spokenMenu(entries: readonly MenuEntry[], listId: string): Extension {
	return EditorView.contentAttributes.compute([menuField], (state) => {
		const chosen = menuViewOf(state, entries)?.chosen;
		if (!openMenuOf(state)) return {};
		return {
			'aria-autocomplete': 'list',
			'aria-haspopup': 'listbox',
			'aria-controls': listId,
			...(chosen ? { 'aria-activedescendant': optionId(listId, chosen.word) } : {})
		};
	});
}

/**
 * The command menu in the editor, on the words that it lists: its state, its keys before every
 * other key of the editor, the keys of the places to fill in, and what a screen reader is told.
 * `listId` names its list in the page.
 */
export function editorMenu(entries: readonly MenuEntry[], listId: string): Extension {
	return [
		menuField,
		Prec.highest(keymap.of(menuBindings(entries))),
		snippetKeymap.of(PLACES),
		closeOnBlur,
		spokenMenu(entries, listId)
	];
}
