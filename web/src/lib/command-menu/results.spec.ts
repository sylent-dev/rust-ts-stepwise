import { beforeAll, describe, expect, it } from 'vitest';
import { vocabulary } from '#lib/core/core.ts';
import { loadTestCore } from '#lib/core/test-support.ts';
import { type Choice, chooseCategory, type MenuMove, menuView, moveChoice } from './results.ts';
import { type MenuEntry, menuEntries, type NameEntry } from './words.ts';

let entries: readonly MenuEntry[] = [];

beforeAll(() => {
	loadTestCore();
	entries = menuEntries(vocabulary());
});

/** The rows of the middle column, a title of a group in capitals, the word chosen between `[ ]`. */
function rows(letters: string, choice: Choice): string[] {
	const view = menuView(entries, letters, choice);
	return view.groups.flatMap(({ category, titled, entries: shown }) => [
		...(titled ? [category.toUpperCase()] : []),
		...shown.map((entry) => (entry === view.chosen ? `[${entry.label}]` : entry.label))
	]);
}

/** The categories, the one chosen between `[ ]`, with its number of results, those pale left out. */
function categories(letters: string, choice: Choice): string[] {
	return menuView(entries, letters, choice).categories.flatMap(
		({ category, count, pale, chosen }) => {
			if (pale) return [];
			const name = count === undefined ? category : `${category} ${String(count)}`;
			return [chosen ? `[${name}]` : name];
		}
	);
}

/** The word chosen after the moves, from a choice. */
function after(letters: string, choice: Choice, ...moves: MenuMove[]): string | undefined {
	const moved = moves.reduce(
		(current, move) => moveChoice(entries, letters, current, move),
		choice
	);
	return menuView(entries, letters, moved).chosen?.text;
}

describe('menuView', () => {
	it('shows the words of the category chosen, the first one chosen, without letters', () => {
		expect(rows('', { category: 'move' })).toEqual(['[forward()]', 'turn_left()', 'turn_right()']);
		expect(categories('', { category: 'move' })).toEqual([
			'[move]',
			'paint',
			'carry',
			'sense',
			'write',
			'colors',
			'control',
			'logic',
			'variables',
			'functions',
			'names'
		]);
	});

	it('keeps the word chosen while it is shown', () => {
		expect(rows('', { category: 'move', text: 'turn_left' })).toEqual([
			'forward()',
			'[turn_left()]',
			'turn_right()'
		]);
		expect(rows('', { category: 'move', text: 'red' })[0]).toBe('[forward()]');
	});

	it('keeps the words that hold the letters, under their categories, which give their numbers', () => {
		expect(rows('paint', { category: 'move' })).toEqual([
			'PAINT',
			'[start_painting(color)]',
			'stop_painting()',
			'SENSE',
			'is_painting()'
		]);
		expect(categories('paint', { category: 'move' })).toEqual(['[paint 2]', 'sense 1']);
	});

	it('chooses first the word written as the letters, then one that starts with them, then one that holds them', () => {
		expect(menuView(entries, 'if', { category: 'move' }).chosen?.text).toBe('if');
		expect(menuView(entries, 're', { category: 'move' }).chosen?.text).toBe('red');
		expect(menuView(entries, 'lef', { category: 'move' }).chosen?.text).toBe('left_is_clear');
		expect(menuView(entries, 'ward', { category: 'move' }).chosen?.text).toBe('forward');
	});

	it('reads the letters whatever their case', () => {
		expect(rows('PAI', { category: 'move' })).toEqual(rows('pai', { category: 'move' }));
	});

	it('finds the letters anywhere in a word, else if by its else', () => {
		expect(rows('rasi', { category: 'move' })).toEqual([
			'PAINT',
			'[start_erasing()]',
			'stop_erasing()',
			'SENSE',
			'is_erasing()'
		]);
		expect(rows('else', { category: 'move' })).toEqual(['CONTROL', 'else if', '[else]']);
	});

	it('shows nothing when nothing holds the letters, the category chosen pale', () => {
		const view = menuView(entries, 'pizza', { category: 'move' });

		expect(view.groups).toEqual([]);
		expect(view.chosen).toBeUndefined();
		expect(view.categories.every(({ pale }) => pale)).toBe(true);
		expect(view.categories.find(({ chosen }) => chosen)?.category).toBe('move');
	});
});

describe('moveChoice', () => {
	it('goes from a row to the next with ↑ and ↓, the last before the first', () => {
		const move = { category: 'move' } as const;

		expect(after('', move, 'down')).toBe('turn_left');
		expect(after('', move, 'down', 'down', 'down')).toBe('forward');
		expect(after('', move, 'up')).toBe('turn_right');
	});

	it('goes across the categories with ↑ and ↓ while letters filter the words', () => {
		const paint = { category: 'move' } as const;

		expect(after('paint', paint, 'down', 'down')).toBe('is_painting');
		expect(after('paint', paint, 'up')).toBe('is_painting');
	});

	it('goes to the category beside with ← and →, on its first word, the last before the first', () => {
		const move = { category: 'move', text: 'turn_left' } as const;

		expect(after('', move, 'right')).toBe('start_painting');
		expect(after('', { category: 'functions' }, 'left')).toBe('let');
		// Your names, the last category, has no name here.
		expect(moveChoice(entries, '', move, 'left')).toEqual({ category: 'names' });
		expect(after('', { category: 'names' }, 'right')).toBe('forward');
	});

	it('goes to the next category that has results with ← and →, while letters filter the words', () => {
		const choice = { category: 'move' } as const;

		expect(after('paint', choice, 'right')).toBe('is_painting');
		expect(after('paint', choice, 'right', 'right')).toBe('start_painting');
		expect(after('paint', choice, 'left')).toBe('is_painting');
	});

	it('moves nothing while nothing holds the letters', () => {
		const choice = { category: 'logic' } as const;

		for (const move of ['up', 'down', 'left', 'right'] as const) {
			expect(moveChoice(entries, 'pizza', choice, move)).toBe(choice);
		}
	});
});

describe('chooseCategory', () => {
	it('shows a category clicked, on its first word', () => {
		expect(chooseCategory(entries, '', { category: 'move', text: 'turn_left' }, 'logic')).toEqual({
			category: 'logic'
		});
	});

	it('goes to the first result of a category clicked, and nowhere for one without result', () => {
		const choice = { category: 'paint', text: 'stop_painting' } as const;

		expect(chooseCategory(entries, 'paint', choice, 'sense')).toEqual({
			category: 'sense',
			text: 'is_painting'
		});
		expect(chooseCategory(entries, 'paint', choice, 'logic')).toBe(choice);
	});
});

describe('Your names', () => {
	/** A name of the program, as names.ts makes it. */
	function name(text: string, label = text): NameEntry {
		const snippet = `${text}\${}`;
		return { kind: 'name', text, category: 'names', label, snippet, about: '', declaration: '' };
	}

	const names = [name('paint_side', 'paint_side(length)'), name('sides'), name('turn_count')];
	/** The words, once the core has loaded, then the names. */
	let withNames: readonly MenuEntry[] = [];

	beforeAll(() => {
		withNames = [...entries, ...names];
	});

	/** The labels of the rows, the one chosen between `[ ]`, and what the menu says in their place. */
	function shown(letters: string, choice: Choice, all = withNames, hiddenBy?: number) {
		const view = menuView(all, letters, choice, hiddenBy);
		return {
			rows: view.groups.flatMap(({ category, titled, entries: listed }) => [
				...(titled ? [category.toUpperCase()] : []),
				...listed.map((entry) => (entry === view.chosen ? `[${entry.label}]` : entry.label))
			]),
			empty: view.empty
		};
	}

	it('lists the names of the program, the first one chosen, without letters', () => {
		expect(shown('', { category: 'names' })).toEqual({
			rows: ['[paint_side(length)]', 'sides', 'turn_count'],
			empty: undefined
		});
	});

	it('says that there is no name, or which line hides them, in place of the rows', () => {
		expect(shown('', { category: 'names' }, entries)).toEqual({
			rows: [],
			empty: { kind: 'no-names', hiddenBy: undefined }
		});
		expect(shown('', { category: 'names' }, entries, 3).empty).toEqual({
			kind: 'no-names',
			hiddenBy: 3
		});
	});

	it('keeps the names that hold the letters, among the words, Your names last', () => {
		expect(shown('turn', { category: 'move' }).rows).toEqual([
			'MOVE',
			'[turn_left()]',
			'turn_right()',
			'FUNCTIONS',
			'return',
			'NAMES',
			'turn_count'
		]);
		expect(shown('side', { category: 'move' }).rows).toEqual([
			'NAMES',
			'paint_side(length)',
			'[sides]'
		]);
		expect(shown('SIDES', { category: 'move' }).rows).toEqual(['NAMES', '[sides]']);
	});

	it('says that nothing is found when neither a word nor a name holds the letters', () => {
		expect(shown('pizza', { category: 'names' }).empty).toEqual({ kind: 'nothing-found' });
	});

	it('moves from the words to the names with the arrows', () => {
		const moved = moveChoice(withNames, '', { category: 'move' }, 'left');

		expect(menuView(withNames, '', moved).chosen?.text).toBe('paint_side');
		expect(
			moveChoice(withNames, 'turn', { category: 'functions', text: 'return' }, 'down')
		).toEqual({ category: 'names', text: 'turn_count' });
	});
});
