import { describe, expect, it } from 'vitest';
import { canChoose, closedOn, openOn, pressKey, type BarState, type Menu } from './menus.ts';

/** A menu of rows named by their letters: an uppercase one can't be chosen. */
function menu(name: string, rows: string): Menu {
	return {
		name,
		rows: [...rows].map((label) =>
			label === label.toUpperCase() ? { label, here: true } : { label, to: 'sandbox' }
		)
	};
}

// Three menus: every row to choose, one that can't be in the middle, none to choose.
const menus = [menu('Level', 'abc'), menu('Edit', 'dEf'), menu('Help', 'G')];

const on = (index: number, row: number | null): BarState => ({ menu: index, open: true, row });

/** The state after each key, from `state`; fails on a key that the bar ignores. */
function press(state: BarState, ...keys: string[]): BarState {
	return keys.reduce((from, key) => {
		const outcome = pressKey(from, key, menus);
		if (!outcome) throw new Error(`the bar ignores ${key}`);
		return outcome.state;
	}, state);
}

describe('canChoose', () => {
	it('tells a row that leads to a page from the row of the screen already shown', () => {
		expect(canChoose({ label: 'Sandbox', to: 'sandbox' })).toBe(true);
		expect(canChoose({ label: 'Sandbox', here: true })).toBe(false);
	});
});

describe('pressKey, the bar closed', () => {
	it('goes from a menu to the next with the arrows, the last one before the first', () => {
		expect(press(closedOn(0), 'ArrowRight')).toEqual(closedOn(1));
		expect(press(closedOn(2), 'ArrowRight')).toEqual(closedOn(0));
		expect(press(closedOn(0), 'ArrowLeft')).toEqual(closedOn(2));
	});

	it.each(['Enter', ' ', 'ArrowDown'])('opens the menu on its first row with %j', (key) => {
		expect(press(closedOn(1), key)).toEqual(on(1, 0));
	});

	it('opens the menu on its last row with the arrow up', () => {
		expect(press(closedOn(1), 'ArrowUp')).toEqual(on(1, 2));
	});

	it('opens a menu without a row to choose with no row lit', () => {
		expect(press(closedOn(2), 'ArrowDown')).toEqual(on(2, null));
		expect(press(closedOn(2), 'ArrowUp')).toEqual(on(2, null));
	});

	it.each(['Escape', 'Tab', 'Home', 'End', 'a'])('leaves %j to the browser', (key) => {
		expect(pressKey(closedOn(0), key, menus)).toBeUndefined();
	});
});

describe('pressKey, a menu open', () => {
	it('goes down and up its rows, the last one before the first', () => {
		expect(press(on(0, 0), 'ArrowDown')).toEqual(on(0, 1));
		expect(press(on(0, 2), 'ArrowDown')).toEqual(on(0, 0));
		expect(press(on(0, 0), 'ArrowUp')).toEqual(on(0, 2));
	});

	it('skips a row that can’t be chosen', () => {
		expect(press(on(1, 0), 'ArrowDown')).toEqual(on(1, 2));
		expect(press(on(1, 2), 'ArrowUp')).toEqual(on(1, 0));
	});

	it('goes to its first and its last row with Home and End', () => {
		expect(press(on(0, 1), 'Home')).toEqual(on(0, 0));
		expect(press(on(0, 1), 'End')).toEqual(on(0, 2));
	});

	it('enters a menu that the mouse opened: no row lit yet', () => {
		expect(press(openOn(0), 'ArrowDown')).toEqual(on(0, 0));
		expect(press(openOn(0), 'ArrowUp')).toEqual(on(0, 2));
		expect(press(openOn(0), 'Enter')).toEqual(on(0, 0));
		expect(press(openOn(0), ' ')).toEqual(on(0, 0));
	});

	it('opens the menu beside on its first row with the arrows', () => {
		expect(press(on(0, 2), 'ArrowRight')).toEqual(on(1, 0));
		expect(press(on(0, 2), 'ArrowLeft')).toEqual(on(2, null));
		expect(press(openOn(2), 'ArrowRight')).toEqual(on(0, 0));
	});

	it.each(['Enter', ' '])('runs the lit row with %j and closes', (key) => {
		expect(pressKey(on(1, 2), key, menus)).toEqual({ state: closedOn(1), runs: 2 });
	});

	it('closes with Escape and stays on the menu', () => {
		expect(pressKey(on(1, 2), 'Escape', menus)).toEqual({ state: closedOn(1) });
	});

	it('closes with Tab, which the browser still handles', () => {
		expect(pressKey(on(1, 2), 'Tab', menus)).toEqual({ state: closedOn(1), passes: true });
	});

	it('leaves the other keys to the browser', () => {
		expect(pressKey(on(0, 0), 'a', menus)).toBeUndefined();
	});

	it('walks a whole bar: open, go beside, choose, run', () => {
		expect(press(closedOn(0), 'ArrowRight', 'ArrowDown', 'ArrowDown')).toEqual(on(1, 2));
		expect(press(closedOn(0), 'ArrowUp', 'ArrowRight', 'End', 'Escape')).toEqual(closedOn(1));
	});
});
