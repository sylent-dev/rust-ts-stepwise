import { beforeAll, describe, expect, it } from 'vitest';
import { loadTestCore } from '#lib/core/test-support.ts';
import { stateOf } from '#lib/editor/test-support.ts';
import { type MenuNames, namesAtCursor } from './names.ts';

beforeAll(loadTestCore);

/** The names at the `|` of `marked`, as the menu lists them. */
function namesOf(marked: string): MenuNames {
	return namesAtCursor(stateOf(marked));
}

const PROGRAM = [
	'# Paint a square of side 3',
	'function paint_side(length):',
	'    start_painting(red)',
	'    repeat length:',
	'        forward()',
	'    stop_painting()',
	'',
	'function turn_around():',
	'    turn_left()',
	'    turn_left()',
	'',
	'let sides = 0  # The sides painted',
	'while sides < 4:',
	'    paint_side(3)'
];

/** The program, with the cursor on a new line under its line `line`, indented by `indent`. */
function withCursor(line: number, indent: number): string {
	const lines = [...PROGRAM];
	lines.splice(line, 0, `${' '.repeat(indent)}|`);
	return lines.join('\n');
}

/** In the block of the `repeat` of `paint_side`, and at the end of the block of the `while`. */
const IN_FUNCTION = withCursor(5, 8);
const IN_MAIN = withCursor(PROGRAM.length, 4);

describe('namesAtCursor', () => {
	it('lists the functions defined above the cursor, then the variables that exist there', () => {
		const { entries, hiddenBy } = namesOf(IN_FUNCTION);

		expect(entries.map(({ label }) => label)).toEqual(['paint_side(length)', 'length']);
		expect(hiddenBy).toBeUndefined();
		expect(namesOf(IN_MAIN).entries.map(({ label }) => label)).toEqual([
			'paint_side(length)',
			'turn_around()',
			'sides'
		]);
	});

	it('inserts a function as a built-in function, and a variable as it is written', () => {
		const { entries } = namesOf(IN_MAIN);

		expect(entries.map(({ snippet }) => snippet)).toEqual([
			'paint_side(${})',
			'turn_around()${}',
			'sides${}'
		]);
	});

	it('says what each name is and the line where it is declared, then shows that line', () => {
		expect(
			namesOf(IN_FUNCTION).entries.map(({ about, declaration }) => [about, declaration])
		).toEqual([
			['A function of your program, defined on line 2.', 'function paint_side(length):'],
			['A parameter of `paint_side()`, on line 2.', 'function paint_side(length):']
		]);
		expect(namesOf(IN_MAIN).entries.at(-1)).toMatchObject({
			about: 'A variable of your program, declared on line 12.',
			declaration: 'let sides = 0  # The sides painted'
		});
	});

	it('gives the line of a syntax error above the cursor, which hides the names', () => {
		expect(namesOf('let sides = 0\nforward(\n|')).toEqual({ entries: [], hiddenBy: 2 });
	});

	it('reads nothing of the line of the cursor, nor under it', () => {
		const names = namesOf('let sides = 0\nlet total = |\nforward(\n');

		expect(names).toMatchObject({ entries: [{ text: 'sides' }] });
		expect(names.hiddenBy).toBeUndefined();
	});
});
