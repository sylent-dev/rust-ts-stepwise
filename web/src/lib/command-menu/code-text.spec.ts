import { beforeAll, describe, expect, it } from 'vitest';
import { loadTestCore } from '#lib/core/test-support.ts';
import { codePieces, textPieces } from './code-text.ts';

beforeAll(loadTestCore);

describe('textPieces', () => {
	it('tells the code written between backticks from the text around it', () => {
		expect(textPieces('`true` when the cell in front is clear.')).toEqual([
			{ text: 'true', code: true },
			{ text: ' when the cell in front is clear.', code: false }
		]);
		expect(textPieces('After an `if`: runs its block.')).toEqual([
			{ text: 'After an ', code: false },
			{ text: 'if', code: true },
			{ text: ': runs its block.', code: false }
		]);
		expect(textPieces('Moves the robot.')).toEqual([{ text: 'Moves the robot.', code: false }]);
	});
});

describe('codePieces', () => {
	it('gives the whole line, each stretch with the color of its kind, the spaces without one', () => {
		const pieces = codePieces('    print("Sides:", 4) # done');

		expect(pieces.map(({ text }) => text).join('')).toBe('    print("Sides:", 4) # done');
		expect(pieces).toEqual([
			{ text: '    ' },
			{ text: 'print', color: 'code-function' },
			{ text: '(' },
			{ text: '"Sides:"', color: 'code-string' },
			{ text: ',' },
			{ text: ' ' },
			{ text: '4', color: 'code-number' },
			{ text: ')' },
			{ text: ' ' },
			{ text: '# done', color: 'code-comment' }
		]);
	});

	it('colors a keyword and a color as the editor does', () => {
		expect(codePieces('if here_is(red):')).toEqual([
			{ text: 'if', color: 'code-keyword' },
			{ text: ' ' },
			{ text: 'here_is', color: 'code-function' },
			{ text: '(' },
			{ text: 'red', color: 'code-number' },
			{ text: ')' },
			{ text: ':' }
		]);
	});
});
