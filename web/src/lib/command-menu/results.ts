// What the command menu shows for the letters typed and the choice made (see Command menu in
// specs.md): the categories and their numbers of results, the rows of the middle column, the word
// chosen; and where each arrow takes the choice. Pure, so it is tested without a page.

import { CATEGORIES, type Category, type MenuEntry, type MenuWord } from './words.ts';

/** What the learner chose in the menu: a category, and a word shown in it or among the results. */
export interface Choice {
	readonly category: Category;
	/** The word chosen; the first one shown when it isn't shown, or when none was chosen. */
	readonly word?: MenuWord;
}

/** A category, as the first column shows it. */
export interface ShownCategory {
	readonly category: Category;
	/** Its number of results, while letters filter the words; nothing otherwise. */
	readonly count?: number;
	/** Whether it grows pale: letters filter the words, and none of its words is left. */
	readonly pale: boolean;
	/** Whether it is the category chosen. */
	readonly chosen: boolean;
}

/** The rows of one category in the middle column, under its name while letters filter them. */
export interface ShownGroup {
	readonly category: Category;
	readonly titled: boolean;
	readonly entries: readonly MenuEntry[];
}

/** What the menu shows. */
export interface MenuView {
	/** The letters typed since the start of the name at the cursor, which filter the words. */
	readonly letters: string;
	readonly categories: readonly ShownCategory[];
	/** The rows of the middle column, by category; none when nothing matches the letters. */
	readonly groups: readonly ShownGroup[];
	/** The word chosen: its row lit, its details beside it; nothing when nothing matches. */
	readonly chosen: MenuEntry | undefined;
}

/**
 * Whether a word matches the letters typed: they are found anywhere in it, whatever their case
 * (`paint` keeps `start_painting()` and `is_painting()`).
 */
export function matches(entry: MenuEntry, letters: string): boolean {
	return entry.word.includes(letters.toLowerCase());
}

/**
 * What the menu shows: without letters, the words of the category chosen; with letters, every
 * word that matches them, under the name of its category, the category chosen being the one of
 * the word chosen. Until the learner chooses one, the word chosen is the first that starts with
 * the letters, or else the first that holds them: `re` chooses `red` rather than `here_is`.
 */
export function menuView(entries: readonly MenuEntry[], letters: string, choice: Choice): MenuView {
	if (letters === '') {
		const shown = entries.filter(({ category }) => category === choice.category);
		return {
			letters,
			categories: CATEGORIES.map((category) => ({
				category,
				pale: false,
				chosen: category === choice.category
			})),
			groups: [{ category: choice.category, titled: false, entries: shown }],
			chosen: shown.find(({ word }) => word === choice.word) ?? shown[0]
		};
	}
	const results = entries.filter((entry) => matches(entry, letters));
	const start = letters.toLowerCase();
	const chosen =
		results.find(({ word }) => word === choice.word) ??
		results.find(({ word }) => word.startsWith(start)) ??
		results[0];
	const chosenCategory = chosen?.category ?? choice.category;
	const groups = CATEGORIES.flatMap((category) => {
		const found = results.filter((entry) => entry.category === category);
		return found.length > 0 ? [{ category, titled: true, entries: found }] : [];
	});
	return {
		letters,
		categories: CATEGORIES.map((category) => {
			const count = results.filter((entry) => entry.category === category).length;
			return { category, count, pale: count === 0, chosen: category === chosenCategory };
		}),
		groups,
		chosen
	};
}

/** An arrow pressed in the menu. */
export type MenuMove = 'up' | 'down' | 'left' | 'right';

/** The item `step` places after `current` in `items`, the last one before the first. */
function around<T>(items: readonly T[], current: T | undefined, step: number): T | undefined {
	if (items.length === 0) return undefined;
	const index = current === undefined ? -1 : items.indexOf(current);
	const start = index === -1 && step < 0 ? 0 : index;
	return items.at((start + step) % items.length);
}

/**
 * Where an arrow takes the choice. ↑ and ↓ go from a row to the next, across the categories when
 * letters filter the words, the last before the first. ← and → go to the category beside, the
 * last before the first, on its first word; while letters filter the words, to the next category
 * that has results. Nothing moves while nothing matches the letters.
 */
export function moveChoice(
	entries: readonly MenuEntry[],
	letters: string,
	choice: Choice,
	move: MenuMove
): Choice {
	const view = menuView(entries, letters, choice);
	const step = move === 'up' || move === 'left' ? -1 : 1;
	if (move === 'up' || move === 'down') {
		const rows = view.groups.flatMap((group) => group.entries);
		const next = around(rows, view.chosen, step);
		return next ? { category: next.category, word: next.word } : choice;
	}
	const open = view.categories.filter(({ pale }) => !pale).map(({ category }) => category);
	const current = view.categories.find(({ chosen }) => chosen)?.category;
	const category = around(open, current, step);
	return category === undefined ? choice : chooseCategory(entries, letters, choice, category);
}

/**
 * The choice once a category is clicked: its words, without letters; with letters, its first
 * result, and nothing changes for a category without result.
 */
export function chooseCategory(
	entries: readonly MenuEntry[],
	letters: string,
	choice: Choice,
	category: Category
): Choice {
	if (letters === '') return { category };
	const first = entries.find((entry) => entry.category === category && matches(entry, letters));
	return first ? { category, word: first.word } : choice;
}
