import { describe, expect, it } from 'vitest';
import type { ScreenCommand } from './commands.ts';
import {
	canChoose,
	choicesOn,
	closedOn,
	litChoice,
	openOn,
	pointerLeft,
	pressKey,
	showsChoices,
	type BarState,
	type Choice,
	type Menu,
	type MenuRow
} from './menus.ts';

/** A menu of rows named by their letters: an uppercase one can't be chosen. */
function menu(name: string, rows: string): Menu {
	return {
		id: name.toLowerCase(),
		name,
		// eslint-disable-next-line @typescript-eslint/no-misused-spread -- the rows are written in ASCII: one letter, one row
		rows: [...rows].map((label) =>
			label === label.toUpperCase()
				? { kind: 'here', id: label, label }
				: { kind: 'link', id: label, label, to: 'sandbox' }
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
		if ('runs' in outcome) throw new Error(`${key} runs the row ${outcome.runs}`);
		return outcome.state;
	}, state);
}

/** A row that runs a command, which can run or not. */
function commandRow(id: string, enabled = true): MenuRow {
	const command: ScreenCommand = { id, label: id, enabled, run: () => {} };
	return { kind: 'command', command };
}

describe('canChoose', () => {
	it('tells a row that leads to a page from the row of the screen already shown', () => {
		expect(canChoose({ kind: 'link', id: 'sandbox', label: 'Sandbox', to: 'sandbox' })).toBe(true);
		expect(canChoose({ kind: 'here', id: 'sandbox', label: 'Sandbox' })).toBe(false);
	});

	it('tells a row whose command can run from a greyed one', () => {
		expect(canChoose(commandRow('undo'))).toBe(true);
		expect(canChoose(commandRow('undo', false))).toBe(false);
	});

	it('follows the command as its state changes', () => {
		let enabled = false;
		const row: MenuRow = {
			kind: 'command',
			command: {
				id: 'undo',
				label: 'Undo',
				get enabled() {
					return enabled;
				},
				run: () => {}
			}
		};

		expect(canChoose(row)).toBe(false);
		enabled = true;
		expect(canChoose(row)).toBe(true);
	});

	it('never chooses the line between two groups of rows', () => {
		expect(canChoose({ kind: 'separator' })).toBe(false);
	});

	it('always chooses a row that offers choices', () => {
		expect(canChoose({ kind: 'choices', id: 'speed', label: 'Speed', choices: [] })).toBe(true);
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

	it.each(['Enter', ' '])('stays closed while %j is held down and repeats', (key) => {
		expect(pressKey(closedOn(1), key, menus, true)).toEqual({ state: closedOn(1) });
	});

	it('still follows an arrow held down', () => {
		expect(pressKey(closedOn(0), 'ArrowRight', menus, true)).toEqual({ state: closedOn(1) });
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

	it.each(['Enter', ' '])('runs the lit row with %j', (key) => {
		expect(pressKey(on(1, 2), key, menus)).toEqual({ runs: 2 });
	});

	it.each(['Enter', ' '])('runs nothing while %j is held down and repeats', (key) => {
		// The press opened the menu on its first row: its repeats must not run that row.
		expect(pressKey(on(1, 0), key, menus, true)).toEqual({ state: on(1, 0) });
	});

	it.each(['Enter', ' ', 'ArrowDown', 'ArrowUp', 'Home', 'End'])(
		'lights nothing and runs nothing with %j in a menu without a row to choose',
		(key) => {
			expect(pressKey(openOn(2), key, menus)).toEqual({ state: on(2, null) });
		}
	);

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
		const chosen = press(closedOn(0), 'ArrowUp', 'ArrowRight', 'End');
		expect(chosen).toEqual(on(1, 2));
		expect(pressKey(chosen, 'Enter', menus)).toEqual({ runs: 2 });
	});

	it('walks a whole bar: go beside, open, choose, close', () => {
		expect(press(closedOn(0), 'ArrowRight', 'ArrowDown', 'ArrowDown', 'Escape')).toEqual(
			closedOn(1)
		);
	});
});

describe('pressKey, a menu of commands', () => {
	// Undo greyed, Redo, a line, Comment lines, then a greyed row at the end.
	const edit: Menu = {
		id: 'edit',
		name: 'Edit',
		rows: [
			commandRow('undo', false),
			commandRow('redo'),
			{ kind: 'separator' },
			commandRow('comment-lines'),
			commandRow('move-line-up', false)
		]
	};
	const bar = [edit];

	it('opens on the first row whose command can run, and on the last one going up', () => {
		expect(pressKey(closedOn(0), 'ArrowDown', bar)).toEqual({ state: on(0, 1) });
		expect(pressKey(closedOn(0), 'ArrowUp', bar)).toEqual({ state: on(0, 3) });
	});

	it('skips the line and the greyed rows, the last row to choose before the first', () => {
		expect(pressKey(on(0, 1), 'ArrowDown', bar)).toEqual({ state: on(0, 3) });
		expect(pressKey(on(0, 3), 'ArrowDown', bar)).toEqual({ state: on(0, 1) });
		expect(pressKey(on(0, 1), 'ArrowUp', bar)).toEqual({ state: on(0, 3) });
		expect(pressKey(on(0, 3), 'Home', bar)).toEqual({ state: on(0, 1) });
		expect(pressKey(on(0, 1), 'End', bar)).toEqual({ state: on(0, 3) });
	});

	it.each(['Enter', ' '])('runs the command of the lit row with %j', (key) => {
		expect(pressKey(on(0, 3), key, bar)).toEqual({ runs: 3 });
	});

	it.each(['Enter', ' '])(
		'runs nothing with %j on a row greyed while it was lit, and stays open on it',
		(key) => {
			expect(pressKey(on(0, 0), key, bar)).toEqual({ state: on(0, 0) });
			expect(pressKey(on(0, 4), key, bar)).toEqual({ state: on(0, 4) });
		}
	);

	it('goes on from the place of a row greyed while it was lit', () => {
		expect(pressKey(on(0, 0), 'ArrowDown', bar)).toEqual({ state: on(0, 1) });
		expect(pressKey(on(0, 0), 'ArrowUp', bar)).toEqual({ state: on(0, 3) });
		expect(pressKey(on(0, 4), 'ArrowUp', bar)).toEqual({ state: on(0, 3) });
		expect(pressKey(on(0, 4), 'ArrowDown', bar)).toEqual({ state: on(0, 1) });
	});

	it('goes on from a row greyed between two rows to choose, not from an end of the menu', () => {
		const between: Menu[] = [
			{ id: 'run', name: 'Run', rows: [commandRow('a'), commandRow('b', false), commandRow('c')] }
		];

		expect(pressKey(on(0, 1), 'ArrowDown', between)).toEqual({ state: on(0, 2) });
		expect(pressKey(on(0, 1), 'ArrowUp', between)).toEqual({ state: on(0, 0) });
	});
});

describe('pressKey, a row of choices', () => {
	/** Choices named by their letters, the one at `inUse` marked, if any. */
	function choices(letters: string, inUse?: number): Choice[] {
		// eslint-disable-next-line @typescript-eslint/no-misused-spread -- the choices are written in ASCII: one letter, one choice
		return [...letters].map((label, index) => ({
			id: label,
			label,
			chosen: index === inUse,
			choose: () => {}
		}));
	}

	/** Run, a line, then Speed with five speeds, the second one in use; and Help beside. */
	const speeds = (inUse?: number): Menu[] => [
		{
			id: 'run',
			name: 'Run',
			rows: [
				commandRow('run'),
				{ kind: 'separator' },
				{ kind: 'choices', id: 'speed', label: 'Speed', choices: choices('abcde', inUse) }
			]
		},
		menu('Help', 'g')
	];
	const bar = speeds(1);
	const SPEED = 2;

	it('reaches the row with the arrows, as any row to choose, its choices closed', () => {
		expect(pressKey(on(0, 0), 'ArrowDown', bar)).toEqual({ state: on(0, SPEED) });
		expect(pressKey(closedOn(0), 'ArrowUp', bar)).toEqual({ state: on(0, SPEED) });
		expect(on(0, SPEED).choice).toBeUndefined();
	});

	it.each(['ArrowRight', 'Enter', ' '])('opens its choices on the one in use with %j', (key) => {
		expect(pressKey(on(0, SPEED), key, bar)).toEqual({ state: choicesOn(0, SPEED, 1) });
	});

	it('opens its choices on the first one when none is in use', () => {
		expect(pressKey(on(0, SPEED), 'ArrowRight', speeds())).toEqual({
			state: choicesOn(0, SPEED, 0)
		});
	});

	it.each(['ArrowRight', 'Enter', ' '])(
		'enters with %j the choices that the pointer opened, none lit yet',
		(key) => {
			expect(pressKey(choicesOn(0, SPEED, null), key, bar)).toEqual({
				state: choicesOn(0, SPEED, 1)
			});
		}
	);

	it.each(['Enter', ' '])('opens nothing while %j is held down and repeats', (key) => {
		// The press opened the menu on this row: its repeats must not open the choices, then take one.
		expect(pressKey(on(0, SPEED), key, bar, true)).toEqual({ state: on(0, SPEED) });
		expect(pressKey(choicesOn(0, SPEED, 1), key, bar, true)).toEqual({
			state: choicesOn(0, SPEED, 1)
		});
	});

	it('goes down and up the choices, the last one before the first', () => {
		expect(pressKey(choicesOn(0, SPEED, 1), 'ArrowDown', bar)).toEqual({
			state: choicesOn(0, SPEED, 2)
		});
		expect(pressKey(choicesOn(0, SPEED, 4), 'ArrowDown', bar)).toEqual({
			state: choicesOn(0, SPEED, 0)
		});
		expect(pressKey(choicesOn(0, SPEED, 0), 'ArrowUp', bar)).toEqual({
			state: choicesOn(0, SPEED, 4)
		});
	});

	it('goes to the first and the last choice with Home and End', () => {
		expect(pressKey(choicesOn(0, SPEED, 2), 'Home', bar)).toEqual({
			state: choicesOn(0, SPEED, 0)
		});
		expect(pressKey(choicesOn(0, SPEED, 2), 'End', bar)).toEqual({
			state: choicesOn(0, SPEED, 4)
		});
	});

	it.each(['Enter', ' '])('takes the lit choice with %j', (key) => {
		expect(pressKey(choicesOn(0, SPEED, 3), key, bar)).toEqual({ runs: SPEED, choice: 3 });
	});

	it.each(['ArrowLeft', 'Escape'])(
		'leaves the choices for their row with %j, the menu staying open',
		(key) => {
			expect(pressKey(choicesOn(0, SPEED, 3), key, bar)).toEqual({ state: on(0, SPEED) });
		}
	);

	it('opens the menu beside with the arrow right, from a choice', () => {
		expect(pressKey(choicesOn(0, SPEED, 3), 'ArrowRight', bar)).toEqual({ state: on(1, 0) });
	});

	it('closes everything with Tab, which the browser still handles', () => {
		expect(pressKey(choicesOn(0, SPEED, 3), 'Tab', bar)).toEqual({
			state: closedOn(0),
			passes: true
		});
	});

	it('acts on the row while no choice is lit: the pointer only opened them', () => {
		const shown = choicesOn(0, SPEED, null);

		expect(pressKey(shown, 'ArrowUp', bar)).toEqual({ state: on(0, 0) });
		expect(pressKey(shown, 'ArrowDown', bar)).toEqual({ state: on(0, 0) });
		expect(pressKey(shown, 'Home', bar)).toEqual({ state: on(0, 0) });
		expect(pressKey(shown, 'ArrowLeft', bar)).toEqual({ state: on(1, 0) });
		expect(pressKey(shown, 'Escape', bar)).toEqual({ state: closedOn(0) });
	});

	it('closes the choices when the keys leave their row', () => {
		const left = pressKey(choicesOn(0, SPEED, null), 'ArrowUp', bar);
		expect(left && 'state' in left ? left.state.choice : null).toBeUndefined();
	});

	it('leaves the other keys to the browser, among the choices too', () => {
		expect(pressKey(choicesOn(0, SPEED, 3), 'a', bar)).toBeUndefined();
	});

	it('opens a row without a choice on none, and takes none', () => {
		const empty: Menu[] = [
			{
				id: 'run',
				name: 'Run',
				rows: [{ kind: 'choices', id: 'speed', label: 'Speed', choices: [] }]
			}
		];

		expect(pressKey(on(0, 0), 'ArrowRight', empty)).toEqual({ state: choicesOn(0, 0, null) });
		expect(pressKey(choicesOn(0, 0, null), 'Enter', empty)).toEqual({
			state: choicesOn(0, 0, null)
		});
	});

	it('walks the speeds: open the menu, reach the row, enter, choose, take', () => {
		const states = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowDown'].reduce((from, key) => {
			const outcome = pressKey(from, key, bar);
			if (!outcome || 'runs' in outcome) throw new Error(`${key} moves nothing`);
			return outcome.state;
		}, closedOn(0));

		expect(states).toEqual(choicesOn(0, SPEED, 3));
		expect(pressKey(states, 'Enter', bar)).toEqual({ runs: SPEED, choice: 3 });
	});
});

describe('the choices of a row, as the bar holds them', () => {
	it('show once their row is lit with them, one of them lit or none', () => {
		expect(showsChoices(choicesOn(0, 2, null))).toBe(true);
		expect(showsChoices(choicesOn(0, 2, 0))).toBe(true);
		expect(showsChoices(on(0, 2))).toBe(false);
		expect(showsChoices(openOn(0))).toBe(false);
		expect(showsChoices(closedOn(0))).toBe(false);
	});

	it('never show on a bar that is closed, or without a lit row', () => {
		expect(showsChoices({ menu: 0, open: false, row: null, choice: 1 })).toBe(false);
		expect(showsChoices({ menu: 0, open: true, row: null, choice: 1 })).toBe(false);
	});

	it('have one lit, the first one too, or none', () => {
		expect(litChoice(choicesOn(0, 2, 0))).toBe(0);
		expect(litChoice(choicesOn(0, 2, 3))).toBe(3);
		expect(litChoice(choicesOn(0, 2, null))).toBeUndefined();
		expect(litChoice(on(0, 2))).toBeUndefined();
		expect(litChoice({ menu: 0, open: false, row: null, choice: 1 })).toBeUndefined();
	});
});

describe('pointerLeft', () => {
	it('leaves no row lit in a menu', () => {
		expect(pointerLeft(on(1, 2))).toEqual(openOn(1));
	});

	it('keeps the choices open, their row lit and none of them lit', () => {
		expect(pointerLeft(choicesOn(0, 2, 3))).toEqual(choicesOn(0, 2, null));
		expect(pointerLeft(choicesOn(0, 2, 0))).toEqual(choicesOn(0, 2, null));
	});

	it('changes nothing where nothing is lit to put out: the same state', () => {
		for (const state of [closedOn(1), openOn(1), choicesOn(0, 2, null)]) {
			expect(pointerLeft(state)).toBe(state);
		}
	});
});
