import { beforeAll, describe, expect, it } from 'vitest';
import { check, classifyLine, vocabulary } from '#lib/core/core.ts';
import { loadTestCore } from '#lib/core/test-support.ts';
import { t } from '#lib/i18n.ts';
import {
	CATEGORIES,
	categoryMessage,
	givenMessage,
	givenTo,
	MENU_WORDS,
	type MenuEntry,
	menuEntries,
	type MenuWord,
	wordMessage
} from './words.ts';

beforeAll(loadTestCore);

/** The words of the menu, as the core gives them now. */
function entries(): readonly MenuEntry[] {
	return menuEntries(vocabulary());
}

/** The entry of a word. */
function entryOf(word: MenuWord): MenuEntry | undefined {
	return entries().find((entry) => entry.word === word);
}

/** Whether a program writes a word: one of the pieces that the core reads in its lines. */
function writes(program: string, word: MenuWord): boolean {
	if (word === 'else if') return program.includes('else if ');
	return program
		.split('\n')
		.some((line) => classifyLine(line).some(({ from, to }) => line.slice(from, to) === word));
}

describe('menuEntries', () => {
	it('lists every word once, in the order of its categories, each category with a word at least', () => {
		const listed = entries();
		const categories = listed.map(({ category }) => category);

		expect(new Set(listed.map(({ word }) => word)).size).toBe(listed.length);
		expect([...new Set(categories)]).toEqual([...CATEGORIES]);
		expect(categories).toEqual(
			[...categories].sort((a, b) => CATEGORIES.indexOf(a) - CATEGORIES.indexOf(b))
		);
	});

	it('lists every built-in function of the core, in its order', () => {
		const builtins = vocabulary().builtins.map(({ name }) => name);

		expect(MENU_WORDS.filter((word) => builtins.some((name) => name === word))).toEqual(builtins);
	});

	it('lists the words of each category as the specifications do', () => {
		const wordsOf = (category: string) =>
			entries()
				.filter((entry) => entry.category === category)
				.map(({ word }) => word);

		expect(wordsOf('move')).toEqual(['forward', 'turn_left', 'turn_right']);
		expect(wordsOf('colors')).toEqual(['red', 'yellow', 'blue']);
		expect(wordsOf('control')).toEqual(['if', 'else if', 'else', 'while', 'repeat', 'break']);
		expect(wordsOf('logic')).toEqual(['not', 'and', 'or', 'true', 'false']);
		expect(wordsOf('variables')).toEqual(['let']);
		expect(wordsOf('functions')).toEqual(['function', 'return']);
	});

	it('names what a built-in function is given, as the core counts its values', () => {
		for (const { name, parameters } of vocabulary().builtins) {
			const expected = parameters === 0 ? undefined : parameters === 1 ? 'color' : 'values';
			expect([name, givenTo(name)]).toEqual([name, expected]);
		}
	});

	it('shows a built-in function with its parentheses and what it is given', () => {
		expect(entryOf('forward')?.label).toBe('forward()');
		expect(entryOf('start_painting')?.label).toBe('start_painting(color)');
		expect(entryOf('print')?.label).toBe('print(value, …)');
		expect(entryOf('else if')?.label).toBe('else if');
	});

	it('inserts a call with the cursor between its parentheses when it takes values, after them otherwise', () => {
		expect(entryOf('forward')?.snippet).toBe('forward()${}');
		expect(entryOf('here_is')?.snippet).toBe('here_is(${})');
		expect(entryOf('print')?.snippet).toBe('print(${})');
	});

	it('inserts a statement with its places to fill in, a block with its first line, and a word as it is', () => {
		expect(entryOf('if')?.snippet).toBe('if ${}:\n\t${}');
		expect(entryOf('else')?.snippet).toBe('else:\n\t${}');
		expect(entryOf('function')?.snippet).toBe('function ${}(${}):\n\t${}');
		expect(entryOf('let')?.snippet).toBe('let ${} = ${}');
		expect(entryOf('break')?.snippet).toBe('break${}');
		expect(entryOf('not')?.snippet).toBe('not${}');
		expect(entryOf('red')?.snippet).toBe('red${}');
	});
});

describe('the messages of the menu', () => {
	it('name a word as the name of a message is written', () => {
		expect(wordMessage('turn_left', 'text')).toBe('commands-word-turn-left-text');
		expect(wordMessage('else if', 'example')).toBe('commands-word-else-if-example');
		expect(categoryMessage('move')).toBe('commands-category-move');
		expect(givenMessage('values')).toBe('commands-given-values');
	});

	it.each(MENU_WORDS)('describe %s in one sentence', (word) => {
		const text = t(wordMessage(word, 'text'));

		expect(text).toMatch(/^\S.*\.$/);
		expect(text).not.toContain('\n');
		expect(text.split('`').length % 2).toBe(1);
	});

	it.each(MENU_WORDS)('give %s an example that the checks accept, and that writes it', (word) => {
		const example = t(wordMessage(word, 'example'));

		expect(check(example)).toEqual([]);
		expect(writes(example, word)).toBe(true);
	});
});
