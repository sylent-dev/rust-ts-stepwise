import { beforeAll, describe, expect, it } from 'vitest';
import { vocabulary } from '#lib/core/core.ts';
import { loadTestCore } from '#lib/core/test-support.ts';
import { type Choice, chooseCategory, type MenuMove, menuView, moveChoice } from './results.ts';
import { type MenuEntry, menuEntries } from './words.ts';

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
	return menuView(entries, letters, moved).chosen?.word;
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
			'functions'
		]);
	});

	it('keeps the word chosen while it is shown', () => {
		expect(rows('', { category: 'move', word: 'turn_left' })).toEqual([
			'forward()',
			'[turn_left()]',
			'turn_right()'
		]);
		expect(rows('', { category: 'move', word: 'red' })[0]).toBe('[forward()]');
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

	it('chooses first a word that starts with the letters, or else the first that holds them', () => {
		expect(menuView(entries, 're', { category: 'move' }).chosen?.word).toBe('red');
		expect(menuView(entries, 'lef', { category: 'move' }).chosen?.word).toBe('left_is_clear');
		expect(menuView(entries, 'ward', { category: 'move' }).chosen?.word).toBe('forward');
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
		expect(rows('else', { category: 'move' })).toEqual(['CONTROL', '[else if]', 'else']);
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
		const move = { category: 'move', word: 'turn_left' } as const;

		expect(after('', move, 'right')).toBe('start_painting');
		expect(after('', move, 'left')).toBe('function');
		expect(after('', { category: 'functions' }, 'right')).toBe('forward');
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
		expect(chooseCategory(entries, '', { category: 'move', word: 'turn_left' }, 'logic')).toEqual({
			category: 'logic'
		});
	});

	it('goes to the first result of a category clicked, and nowhere for one without result', () => {
		const choice = { category: 'paint', word: 'stop_painting' } as const;

		expect(chooseCategory(entries, 'paint', choice, 'sense')).toEqual({
			category: 'sense',
			word: 'is_painting'
		});
		expect(chooseCategory(entries, 'paint', choice, 'logic')).toBe(choice);
	});
});
