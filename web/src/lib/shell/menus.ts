// The menus of a header (see Level screen in specs.md): what a menu is, and what each key does on
// their bar. Nothing here touches the page: the bar (menu-bar.svelte) draws this state and moves
// the focus of the keyboard after it.

import type { Path } from '$app/types';

/** What every row has. */
interface Row {
	/**
	 * Its name in the code, the same in every language and whatever its text says: `all-levels`.
	 * It is what the page knows the row by.
	 */
	id: string;
	/** Its text. */
	label: string;
}

/** A row that leads to a page. */
export interface LinkRow extends Row {
	/** The page, as every address is written: what follows the root of the website, `sandbox`. */
	to: Path;
	/** The tab of the browser that shows the page, when it isn't this one. */
	tab?: string;
}

/** The row of the screen already shown: lit as if already chosen, it can't be chosen again. */
export interface HereRow extends Row {
	here: true;
}

/** A row of a menu. */
export type MenuRow = LinkRow | HereRow;

/** A menu of the bar: its name, and its rows from top to bottom. */
export interface Menu {
	/** Its name in the code, the same in every language: `level`. */
	id: string;
	/** Its name on the bar. */
	name: string;
	rows: readonly MenuRow[];
}

/** Whether a row can be chosen. The keys skip the others. */
export function canChoose(row: MenuRow): row is LinkRow {
	return 'to' in row;
}

/** Where the bar is. The focus of the keyboard follows it: on the lit row, or on the name. */
export interface BarState {
	/** The menu the bar is on, from 0: the one that takes Tab, and the one open if any. */
	menu: number;
	/** Whether this menu shows its rows. */
	open: boolean;
	/** Its lit row, from 0: under the pointer, or chosen with the keys. Always a row to choose. */
	row: number | null;
}

/** The bar on a menu, closed. */
export function closedOn(menu: number): BarState {
	return { menu, open: false, row: null };
}

/** The bar on a menu, open, with no row lit: what a click on its name gives. */
export function openOn(menu: number): BarState {
	return { menu, open: true, row: null };
}

/** What a key does on the bar: it moves the bar, or it runs a row. */
export type KeyOutcome =
	/** Where the bar is after the key. With `passes`, the browser still handles the key: Tab. */
	| { state: BarState; passes?: true }
	/** The row that the key runs, in the menu the bar is on. Running it closes the menu. */
	| { runs: number };

/** The menu `step` menus after this one, the last one before the first. */
function beside(menus: readonly Menu[], menu: number, step: 1 | -1): number {
	return (menu + step + menus.length) % menus.length;
}

/** The rows of a menu that can be chosen, by their index. */
function choices(menu: Menu | undefined): number[] {
	return (menu?.rows ?? []).flatMap((row, index) => (canChoose(row) ? [index] : []));
}

/** The first or the last row to choose of a menu, if it has one. */
function edgeRow(menu: Menu | undefined, edge: 'first' | 'last'): number | null {
	return choices(menu).at(edge === 'first' ? 0 : -1) ?? null;
}

/**
 * The row to choose `step` rows after `row`, the last one before the first. With no row lit, the
 * first one going down and the last one going up.
 */
function rowAfter(menu: Menu | undefined, row: number | null, step: 1 | -1): number | null {
	const rows = choices(menu);
	const at = row === null ? -1 : rows.indexOf(row);
	if (at === -1) return edgeRow(menu, step === 1 ? 'first' : 'last');
	return rows[(at + step + rows.length) % rows.length] ?? null;
}

/**
 * What a key does on the bar, as the menu bar of a code editor; `undefined` for a key that isn't
 * one of its own. `key` is the `key` of the keyboard event, pressed without Ctrl, Alt nor Meta,
 * and `held` says that the key is kept down and repeats.
 */
export function pressKey(
	state: BarState,
	key: string,
	menus: readonly Menu[],
	held = false
): KeyOutcome | undefined {
	const menu = menus[state.menu];
	const openOnRow = (index: number, row: number | null): KeyOutcome => ({
		state: { menu: index, open: true, row }
	});
	const step = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : undefined;

	// Kept down, Enter would open a menu, then run its first row: the bar stays where it is.
	if (held && (key === 'Enter' || key === ' ')) return { state };

	if (!state.open) {
		if (step) return { state: closedOn(beside(menus, state.menu, step)) };
		if (key === 'Enter' || key === ' ' || key === 'ArrowDown') {
			return openOnRow(state.menu, edgeRow(menu, 'first'));
		}
		if (key === 'ArrowUp') return openOnRow(state.menu, edgeRow(menu, 'last'));
		return undefined;
	}

	if (step) {
		const next = beside(menus, state.menu, step);
		return openOnRow(next, edgeRow(menus[next], 'first'));
	}
	switch (key) {
		case 'ArrowDown':
			return openOnRow(state.menu, rowAfter(menu, state.row, 1));
		case 'ArrowUp':
			return openOnRow(state.menu, rowAfter(menu, state.row, -1));
		case 'Home':
			return openOnRow(state.menu, edgeRow(menu, 'first'));
		case 'End':
			return openOnRow(state.menu, edgeRow(menu, 'last'));
		case 'Enter':
		case ' ':
			// With no row lit, the keys enter the menu, as they open it from its name.
			if (state.row === null) return openOnRow(state.menu, edgeRow(menu, 'first'));
			return { runs: state.row };
		case 'Escape':
			return { state: closedOn(state.menu) };
		case 'Tab':
			return { state: closedOn(state.menu), passes: true };
		default:
			return undefined;
	}
}
