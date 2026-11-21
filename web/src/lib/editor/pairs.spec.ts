import type { EditorState } from '@codemirror/state';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadTestCore } from '#lib/core/test-support.ts';
import { deletePair, insideTextOrComment, pairs, typedSign } from './pairs.ts';
import { after, shown, stateOf as markedState } from './test-support.ts';

beforeAll(loadTestCore);

/** A state with the signs that close by themselves, from a text where `|` marks the cursor. */
function stateOf(marked: string): EditorState {
	return markedState(marked, pairs);
}

/**
 * The state after each character is typed in turn: a sign does what the editor decides for it,
 * and anything else is written as it is.
 */
function typing(state: EditorState, characters: string): EditorState {
	let next = state;
	for (const character of characters) {
		const transaction = typedSign(next, character) ?? next.update(next.replaceSelection(character));
		next = transaction.state;
	}
	return next;
}

/** The text after the characters are typed at the cursor. */
const typed = (marked: string, characters: string): string =>
	shown(typing(stateOf(marked), characters));

describe('what the cursor is in', () => {
	it.each([
		['a text that is not closed', 'print("Hi'],
		['a text that is not closed, after one that is', 'print("a" + "b'],
		['a text just opened', 'print("'],
		['a text after an escaped quote', String.raw`print("say \"`],
		['a text after a backslash', 'print("say \\']
	])('is %s', (_, before) => {
		expect(insideTextOrComment(before)).toBe('text');
	});

	it.each([
		['a comment', '# a note'],
		['a comment after a statement', 'forward()  # then'],
		['a comment that holds a quote', '# say "hi']
	])('is %s', (_, before) => {
		expect(insideTextOrComment(before)).toBe('comment');
	});

	it.each([
		['the start of a line', ''],
		['after a name', 'forward'],
		['after an opening parenthesis', 'print('],
		['after a text that is closed', 'print("Hi"'],
		['after a text closed behind an escaped backslash', String.raw`print("a\\"`]
	])('is neither at %s', (_, before) => {
		expect(insideTextOrComment(before)).toBeUndefined();
	});
});

describe('a parenthesis', () => {
	it('is typed with the one that closes it', () => {
		expect(typed('forward|', '(')).toBe('forward(|)');
		expect(typed('print(count|)', '(')).toBe('print(count(|))');
	});

	it('passes over the closing one that the editor wrote', () => {
		expect(typed('forward|', '()')).toBe('forward()|');
		expect(typed('print|', '(count(red))')).toBe('print(count(red))|');
	});

	it('is written alone before a name', () => {
		expect(typedSign(stateOf('print|red'), '(')).toBeUndefined();
	});

	it('is written beside a closing one that the learner wrote', () => {
		expect(typedSign(stateOf('forward(|)'), ')')).toBeUndefined();
	});

	it('is written alone in a text and in a comment', () => {
		expect(typed('print("Done |")', '(')).toBe('print("Done (|")');
		expect(typed('# call forward|', '(')).toBe('# call forward(|');
	});
});

describe('a quote', () => {
	it('is typed with the one that closes its text', () => {
		expect(typed('print(|)', '"')).toBe('print("|")');
		expect(typed('let name = |', '"')).toBe('let name = "|"');
	});

	it('passes over the closing one, so that a text is typed as it is read', () => {
		expect(typed('|', 'print("Hi")')).toBe('print("Hi")|');
		expect(typed('|', 'print("")')).toBe('print("")|');
	});

	it('passes over the one that ends its text, whoever wrote it', () => {
		expect(typed('print("Hi|")', '"')).toBe('print("Hi"|)');
	});

	it('comes alone at the end of a text that has lost its own', () => {
		expect(typed('print("Done!|)', '"')).toBe('print("Done!"|)');
		expect(typed('print("Done |', '"')).toBe('print("Done "|');
	});

	it('is written alone before a word, then closes the text after it', () => {
		const opened = typing(stateOf('print(|Hi)'), '"');

		expect(shown(opened)).toBe('print("|Hi)');
		expect(typedSign(stateOf('print("Hi|)'), '"')?.state.doc.toString()).toBe('print("Hi")');
	});

	it('is one more character of its text after a backslash, and ends nothing', () => {
		expect(typed(String.raw`print("say \|")`, '"')).toBe(String.raw`print("say \"|")`);
	});

	it('follows a backslash into its text', () => {
		expect(typed('|', String.raw`print("say \"hi\"")`)).toBe(String.raw`print("say \"hi\"")|`);
	});

	it('is written alone in a comment', () => {
		expect(typed('# say |', '"')).toBe('# say "|');
	});
});

describe('a selection', () => {
	it('goes between two parentheses or two quotes', () => {
		expect(typed('print |red|', '(')).toBe('print (|red|)');
		expect(typed('print(|Hi|)', '"')).toBe('print("|Hi|")');
	});
});

describe('any other sign', () => {
	it.each(['[', ']', '{', "'", 'a', ' '])('is written as it is: %s', (sign) => {
		expect(typedSign(stateOf('print(|)'), sign)).toBeUndefined();
	});
});

describe('Backspace between a sign and the one that closes it', () => {
	it('takes both', () => {
		expect(shown(after(deletePair, stateOf('forward(|)')))).toBe('forward|');
		expect(shown(after(deletePair, stateOf('print("|")')))).toBe('print(|)');
		expect(shown(after(deletePair, stateOf('(|)')))).toBe('|');
	});

	it('is left to the other keys anywhere else', () => {
		const state = stateOf('forward()|');

		expect(after(deletePair, state)).toBe(state);
	});

	it.each([
		['the quote that ends a text and the one that opens the next', 'print("a"|"b")'],
		['two parentheses in a text', 'print("smile (|)")'],
		['two parentheses in a comment', '# call (|)'],
		['two quotes in a comment', '# say "|"']
	])('leaves %s, which are no pair', (_, marked) => {
		const state = stateOf(marked);

		expect(after(deletePair, state)).toBe(state);
	});
});
