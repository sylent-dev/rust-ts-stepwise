// The menus of a header (see Level screen in specs.md): what a menu is, and what each key does on
// their bar. Nothing here touches the page: the bar (menu-bar.svelte) draws this state and moves
// the focus of the keyboard after it.

import type { Path } from '$app/types';
import type { ScreenCommand } from './commands.ts';

/** What a row that names a screen has. */
interface ScreenRow {
	/**
	 * Its name in the code, the same in every language and whatever its text says: `all-levels`.
	 * A test knows the row by it; a row that runs a command takes the name of its command.
	 */
	id: string;
	/** Its text. */
	label: string;
}

/** A row that leads to a page. */
export interface LinkRow extends ScreenRow {
	kind: 'link';
	/** The page, as every address is written: what follows the root of the website, `sandbox`. */
	to: Path;
	/** The tab of the browser that shows the page, when it isn't this one. */
	tab?: string;
}

/** The row of the screen already shown: lit as if already chosen, it can't be chosen again. */
export interface HereRow extends ScreenRow {
	kind: 'here';
}

/**
 * A row that runs a command of the screen (commands.ts), which gives it its text, its shortcut
 * and its state: greyed while the command can't run.
 */
export interface CommandRow {
	kind: 'command';
	command: ScreenCommand;
}

/** One of the values that a row of choices offers: a speed. */
export interface Choice {
	/** Its name in the code, the same in every language: `speed-5`. */
	id: string;
	/** Its text. */
	label: string;
	/**
	 * Whether it is the one in use, which the menu marks. It follows what is chosen: what shows
	 * it reads it again.
	 */
	readonly chosen: boolean;
	/** Takes it as the one in use. */
	choose(): void;
}

/**
 * A row that opens a menu beside it, with the values of one thing to choose from, the one in
 * use marked: **Speed** and its speeds. It runs nothing itself, and can always be chosen.
 */
export interface ChoicesRow extends ScreenRow {
	kind: 'choices';
	choices: readonly Choice[];
}

/** A thin line between two groups of rows. */
export interface SeparatorRow {
	kind: 'separator';
}

/** A row of a menu. */
export type MenuRow = LinkRow | HereRow | CommandRow | ChoicesRow | SeparatorRow;

/** A menu of the bar: its name, and its rows from top to bottom. */
export interface Menu {
	/** Its name in the code, the same in every language: `level`. */
	id: string;
	/** Its name on the bar. */
	name: string;
	rows: readonly MenuRow[];
}

/**
 * Whether a row can be chosen now: one that leads to a page, that opens its choices, or whose
 * command can run. The keys skip the others. It says nothing of the kind of the row, which
 * `kind` tells: a row that runs a command can be chosen at one moment and not at the next.
 */
export function canChoose(row: MenuRow): boolean {
	switch (row.kind) {
		case 'link':
		case 'choices':
			return true;
		case 'command':
			return row.command.enabled;
		case 'here':
		case 'separator':
			return false;
	}
}

/** Where the bar is. The focus of the keyboard follows it: on the lit row, or on the name. */
export interface BarState {
	/** The menu the bar is on, from 0: the one that takes Tab, and the one open if any. */
	menu: number;
	/** Whether this menu shows its rows. */
	open: boolean;
	/**
	 * Its lit row, from 0: under the pointer, or chosen with the keys. A row to choose when it
	 * was lit; the command of a row may stop being able to run while its row is lit.
	 */
	row: number | null;
	/**
	 * While the lit row shows its choices beside it: the choice lit there, from 0, which holds
	 * the focus; or `null` when none is, the pointer having only opened them: the row keeps the
	 * focus, and the keys act on it. Absent while no choices show.
	 */
	choice?: number | null;
}

/** The bar on a menu, closed. */
export function closedOn(menu: number): BarState {
	return { menu, open: false, row: null };
}

/** The bar on a menu, open, with no row lit: what a click on its name gives. */
export function openOn(menu: number): BarState {
	return { menu, open: true, row: null };
}

/** The bar on a row whose choices show beside it, with one of them lit or none. */
export function choicesOn(menu: number, row: number, choice: number | null): BarState {
	return { menu, open: true, row, choice };
}

/** What a key does on the bar: it moves the bar, or it runs a row. */
export type KeyOutcome =
	/** Where the bar is after the key. With `passes`, the browser still handles the key: Tab. */
	| { state: BarState; passes?: true }
	/**
	 * The row that the key runs, in the menu the bar is on; with `choice`, the choice that it
	 * takes among those of that row. Running it closes the menu.
	 */
	| { runs: number; choice?: number };

/** The menu `step` menus after this one, the last one before the first. */
function beside(menus: readonly Menu[], menu: number, step: 1 | -1): number {
	return (menu + step + menus.length) % menus.length;
}

/** The rows of a menu that can be chosen, by their index. */
function rowsToChoose(menu: Menu | undefined): number[] {
	return (menu?.rows ?? []).flatMap((row, index) => (canChoose(row) ? [index] : []));
}

/** The first or the last of the rows to choose, if there is one. */
function edgeOf(rows: readonly number[], edge: 'first' | 'last'): number | null {
	return rows.at(edge === 'first' ? 0 : -1) ?? null;
}

/** The first or the last row to choose of a menu, if it has one. */
function edgeRow(menu: Menu | undefined, edge: 'first' | 'last'): number | null {
	return edgeOf(rowsToChoose(menu), edge);
}

/**
 * Among the rows to choose, the next one after `row` going down (`step` 1) or up (-1), the last
 * one before the first. With no row lit, the first one going down and the last one going up.
 * The lit row itself may have been greyed since: the search starts from its place.
 */
function rowAfter(rows: readonly number[], row: number | null, step: 1 | -1): number | null {
	const next =
		row === null
			? undefined
			: step === 1
				? rows.find((index) => index > row)
				: rows.findLast((index) => index < row);
	return next ?? edgeOf(rows, step === 1 ? 'first' : 'last');
}

/** The choices of a row, when it is a row that offers some. */
function choicesOf(menu: Menu | undefined, row: number | null): readonly Choice[] | undefined {
	const lit = row === null ? undefined : menu?.rows[row];
	return lit?.kind === 'choices' ? lit.choices : undefined;
}

/**
 * What a key does among the choices of a row, one of them lit: the arrows choose one, the last
 * one before the first, Enter or Space takes it, and the arrow left or Escape leaves them for
 * their row, their menu staying open. `undefined` for a key that the menu itself answers: the
 * arrow right, which opens the menu beside, and Tab.
 */
function pressAmongChoices(
	menu: number,
	row: number,
	lit: number,
	choices: readonly Choice[],
	key: string
): KeyOutcome | undefined {
	const all = choices.map((_, index) => index);
	const light = (choice: number | null): KeyOutcome => ({ state: choicesOn(menu, row, choice) });
	switch (key) {
		case 'ArrowDown':
			return light(rowAfter(all, lit, 1));
		case 'ArrowUp':
			return light(rowAfter(all, lit, -1));
		case 'Home':
			return light(edgeOf(all, 'first'));
		case 'End':
			return light(edgeOf(all, 'last'));
		case 'Enter':
		case ' ':
			return { runs: row, choice: lit };
		case 'ArrowLeft':
		case 'Escape':
			return { state: { menu, open: true, row } };
		default:
			return undefined;
	}
}

/**
 * What a key does on the bar, as the menu bar of a code editor; `undefined` for a key that isn't
 * one of its own. `key` is the `key` of the keyboard event, pressed without Ctrl, Alt nor Meta,
 * and `held` says that the key is kept down and repeats. On a row that offers choices, the arrow
 * right, Enter or Space opens them, or enters them when the pointer had opened them; every other
 * key acts on the row and its menu, and the choices close.
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

	const choices = choicesOf(menu, state.row);
	if (choices && state.row !== null) {
		if (typeof state.choice === 'number') {
			const outcome = pressAmongChoices(state.menu, state.row, state.choice, choices, key);
			if (outcome) return outcome;
		} else if (key === 'ArrowRight' || key === 'Enter' || key === ' ') {
			// The keys enter the choices on the one in use, as a list opens on its value.
			const inUse = choices.findIndex(({ chosen }) => chosen);
			return {
				state: choicesOn(state.menu, state.row, choices.length === 0 ? null : Math.max(inUse, 0))
			};
		}
	}

	if (step) {
		const next = beside(menus, state.menu, step);
		return openOnRow(next, edgeRow(menus[next], 'first'));
	}
	const rows = rowsToChoose(menu);
	switch (key) {
		case 'ArrowDown':
			return openOnRow(state.menu, rowAfter(rows, state.row, 1));
		case 'ArrowUp':
			return openOnRow(state.menu, rowAfter(rows, state.row, -1));
		case 'Home':
			return openOnRow(state.menu, edgeOf(rows, 'first'));
		case 'End':
			return openOnRow(state.menu, edgeOf(rows, 'last'));
		case 'Enter':
		case ' ':
			// With no row lit, the keys enter the menu, as they open it from its name.
			if (state.row === null) return openOnRow(state.menu, edgeOf(rows, 'first'));
			// A row greyed while lit runs nothing, and its menu stays open, as under a click.
			if (!rows.includes(state.row)) return { state };
			return { runs: state.row };
		case 'Escape':
			return { state: closedOn(state.menu) };
		case 'Tab':
			return { state: closedOn(state.menu), passes: true };
		default:
			return undefined;
	}
}
