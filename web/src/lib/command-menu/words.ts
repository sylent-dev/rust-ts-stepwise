// The words that the command menu lists (see Command menu in specs.md), each in its category, with
// what the menu inserts for it. The categories and their order belong to the interface; the words
// belong to the core: the table is keyed by them, so that a word added to the core is refused here
// until it has its category. The text of each word, its description and its example, are messages.

import type { Builtin, BuiltinFunction, Color, Keyword, Vocabulary } from '#lib/core/core.ts';
import { t } from '#lib/i18n.ts';

/** The categories of the menu, in their order. */
export const CATEGORIES = [
	'move',
	'paint',
	'carry',
	'sense',
	'write',
	'colors',
	'control',
	'logic',
	'variables',
	'functions'
] as const;

/** A category of the menu. */
export type Category = (typeof CATEGORIES)[number];

/**
 * A word that the menu lists: a built-in function, a keyword, a color, or `else if`, two keywords
 * that the menu lists as one.
 */
export type MenuWord = Builtin | Keyword | Color | 'else if';

/**
 * The category of each word, in the order of the menu, which is the one of the specifications:
 * the menu lists the words in the order of the keys of this table.
 */
const CATEGORY_OF = {
	forward: 'move',
	turn_left: 'move',
	turn_right: 'move',
	start_painting: 'paint',
	stop_painting: 'paint',
	start_erasing: 'paint',
	stop_erasing: 'paint',
	pick_up: 'carry',
	drop: 'carry',
	front_is_clear: 'sense',
	left_is_clear: 'sense',
	right_is_clear: 'sense',
	here_is: 'sense',
	front_is: 'sense',
	left_is: 'sense',
	right_is: 'sense',
	item_here: 'sense',
	item_in_front: 'sense',
	is_carrying: 'sense',
	is_painting: 'sense',
	is_erasing: 'sense',
	print: 'write',
	red: 'colors',
	yellow: 'colors',
	blue: 'colors',
	if: 'control',
	'else if': 'control',
	else: 'control',
	while: 'control',
	repeat: 'control',
	break: 'control',
	not: 'logic',
	and: 'logic',
	or: 'logic',
	true: 'logic',
	false: 'logic',
	let: 'variables',
	function: 'functions',
	return: 'functions'
} satisfies Record<MenuWord, Category>;

/** Whether a text is a word of the menu. */
function isMenuWord(text: string): text is MenuWord {
	return Object.hasOwn(CATEGORY_OF, text);
}

/** Every word of the menu, in its order. */
export const MENU_WORDS: readonly MenuWord[] = Object.keys(CATEGORY_OF).filter(isMenuWord);

/**
 * What the menu inserts for a statement, as a snippet of CodeMirror: `${}` is a place to fill in,
 * which Tab or Enter leaves for the next one, and a tab after a line break an indentation more
 * than the line of the cursor. The statements that open a block come with their first line,
 * the last place; the other words are inserted as they are written, the cursor after them.
 */
const STATEMENTS: Readonly<Partial<Record<MenuWord, string>>> = {
	if: 'if ${}:\n\t${}',
	'else if': 'else if ${}:\n\t${}',
	else: 'else:\n\t${}',
	while: 'while ${}:\n\t${}',
	repeat: 'repeat ${}:\n\t${}',
	let: 'let ${} = ${}',
	function: 'function ${}(${}):\n\t${}'
};

/**
 * What a built-in function that takes values is given, as the menu names it between its
 * parentheses: a color, or any number of values. The core says how many values each one takes
 * (`vocabulary()`); a test checks that the two agree.
 */
const GIVEN: Readonly<Partial<Record<Builtin, Given>>> = {
	start_painting: 'color',
	here_is: 'color',
	front_is: 'color',
	left_is: 'color',
	right_is: 'color',
	print: 'values'
};

/** What a built-in function is given, as the menu names it. */
export const GIVEN_NAMES = ['color', 'values'] as const;

/** What a built-in function is given. */
export type Given = (typeof GIVEN_NAMES)[number];

/** A word of the menu, as it shows it and inserts it. */
export interface MenuEntry {
	readonly word: MenuWord;
	readonly category: Category;
	/** As the menu shows it: `forward()`, `start_painting(color)`, `else if`. */
	readonly label: string;
	/** What the menu inserts, a snippet of CodeMirror (see `STATEMENTS`). */
	readonly snippet: string;
}

/** The name of the message of a category: `commands-category-move`. */
export function categoryMessage(category: Category): string {
	return `commands-category-${category}`;
}

/** The parts of the messages of a word: its description on one line, and its example. */
export const WORD_PARTS = ['text', 'example'] as const;

/** A part of the messages of a word. */
export type WordPart = (typeof WORD_PARTS)[number];

/**
 * The name of a message of a word, each space and each underscore written `-`, as the name of a
 * message is: `commands-word-turn-left-text`, `commands-word-else-if-example`.
 */
export function wordMessage(word: MenuWord, part: WordPart): string {
	return `commands-word-${word.replaceAll(/[ _]/g, '-')}-${part}`;
}

/** The name of the message of what a built-in function is given: `commands-given-color`. */
export function givenMessage(given: Given): string {
	return `commands-given-${given}`;
}

/** What the call of a built-in function inserts and shows, by the number of its values. */
function callOf({ name, parameters }: BuiltinFunction): Pick<MenuEntry, 'label' | 'snippet'> {
	const given = GIVEN[name];
	return {
		label: `${name}(${given === undefined ? '' : t(givenMessage(given))})`,
		snippet: parameters === 0 ? `${name}()\${}` : `${name}(\${})`
	};
}

/**
 * Every word of the menu, in its order, as it shows it and inserts it. A built-in function is
 * inserted with its parentheses, the cursor between them when it takes values, after them
 * otherwise, as the core says (`vocabulary`).
 */
export function menuEntries(vocabulary: Vocabulary): readonly MenuEntry[] {
	return MENU_WORDS.map((word) => {
		const category = CATEGORY_OF[word];
		const builtin = vocabulary.builtins.find(({ name }) => name === word);
		if (builtin) return { word, category, ...callOf(builtin) };
		return { word, category, label: word, snippet: STATEMENTS[word] ?? `${word}\${}` };
	});
}

/** What a built-in function is given, as the menu names it; nothing for one that takes no value. */
export function givenTo(name: Builtin): Given | undefined {
	return GIVEN[name];
}
