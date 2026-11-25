import { beforeAll, describe, expect, it, vi } from 'vitest';
import { check, type ProgramError } from '#lib/core/core.ts';
import { loadTestCore } from '#lib/core/test-support.ts';
import { ERROR_SUBJECTS, type ErrorSubject, errorText } from './error-text.ts';

beforeAll(loadTestCore);

/** The blocks nested one in another, `count` of them, around one call. */
function nested(count: number): string {
	const lines = Array.from({ length: count }, (_, level) => `${'    '.repeat(level)}if true:\n`);
	return `${lines.join('')}${'    '.repeat(count)}forward()\n`;
}

/**
 * A program for each error of the checks, each the first error of its program. A code added to
 * the core has no program here until one is written, and the test of the subjects says so.
 */
const PROGRAMS: readonly string[] = [
	'\tforward()\n',
	'if true:\n      forward()\n',
	'print("Hi)\n',
	'print("a\\q")\n',
	"print('Hi')\n",
	'let a = 9223372036854775808\n',
	'let 2nd = 1\n',
	'if a && b:\n    forward()\n',
	'let a = @\n',
	'let a =\n',
	'print(1,)\n',
	'let a = 1 == not true\n',
	'forward() forward()\n',
	'forward(\n',
	'forward())\n',
	'if x = 3:\n    forward()\n',
	'let a = 1 < 2 < 3\n',
	...['elif', 'def', 'var', 'const', 'for', 'continue', 'pass', 'none', 'null'].map(
		(word) => `${word}\n`
	),
	'let = 3\n',
	'let repeat = 3\n',
	'let a 3\n',
	'forward()\n    forward()\n',
	'if true\n    forward()\n',
	'if true: forward()\n',
	'if true:\nforward()\n',
	'if true:\n    # nothing yet\nforward()\n',
	'else:\n    forward()\n',
	'if true:\n    forward()\nelse:\n    forward()\nelse:\n    forward()\n',
	'function ():\n    forward()\n',
	'function walk:\n    forward()\n',
	'function walk(3):\n    forward()\n',
	`print(${'('.repeat(300)}1${')'.repeat(300)})\n`,
	nested(60),
	'break\n',
	'return\n',
	'if true:\n    function walk():\n        forward()\n',
	'let paintSide = 3\n',
	'let red = 3\nlet forward = 4\n',
	'function paint(side, side):\n    forward()\n',
	'print(sidse)\n',
	'sidse = 1\n',
	'print(sides)\nlet sides = 4\n',
	'if true:\n    let sides = 4\nprint(sides)\n',
	'let sides = 4\nfunction show():\n    print(sides)\n',
	'let sides = 4\nlet sides = 5\n',
	'function walk():\n    forward()\nfunction walk():\n    forward()\n',
	'function walk():\n    forward()\nlet walk = 3\n',
	'walk()\nfunction walk():\n    forward()\n',
	'forward(3)\n',
	'let go = forward\n',
	'let sides = 4\nsides()\n',
	'turn()\n',
	'3 + 4\n'
];

/** The errors of all the programs. */
function allErrors(): ProgramError[] {
	return PROGRAMS.flatMap((program) => check(program));
}

/** The subject of an error, as its messages are named. */
function subjectOf({ kind }: ProgramError): ErrorSubject {
	return kind.code === 'foreign-word' ? `foreign-word-${kind.word}` : kind.code;
}

/** The two sentences of the first error of a program. */
function textOf(program: string): string[] {
	const [first] = check(program);
	if (!first) return [];
	const { title, rule } = errorText(first);
	return [title, rule];
}

describe('errorText', () => {
	it('has a program for every subject of an error, so that each is read here', () => {
		const found = new Set(allErrors().map(subjectOf));
		expect([...found].sort()).toEqual([...ERROR_SUBJECTS].sort());
	});

	it('gives every error two sentences, each with its values', () => {
		const warn = vi.spyOn(console, 'warn');
		for (const error of allErrors()) {
			const { title, rule } = errorText(error);
			for (const sentence of [title, rule]) {
				expect(sentence, error.kind.code).toMatch(/^\S.*\.$/u);
				expect(sentence, error.kind.code).not.toMatch(/[{}$]|error-/u);
			}
		}
		expect(warn).not.toHaveBeenCalled();
	});

	it('writes the names, the words and the numbers of the error', () => {
		expect(textOf('print(sidse)\n')).toEqual([
			'The name sidse does not exist.',
			'A variable is declared with let before it is used.'
		]);
		expect(textOf('let paintSide = 3\n')[0]).toBe('paintSide is not in snake_case.');
		expect(textOf('if a && b:\n    forward()\n')).toEqual([
			'&& is not a sign of Stepwise.',
			'Stepwise writes and instead of &&.'
		]);
		expect(textOf('let a = 9223372036854775808\n')[1]).toBe(
			'A number is written up to 9223372036854775807.'
		);
		expect(textOf('print("a\\q")\n')).toEqual([
			'\\q means nothing in a text.',
			'In a text, \\" writes a quote, \\\\ a backslash and \\n a new line.'
		]);
	});

	it('says a number of values, or none, in the plural that it takes', () => {
		const counted = (program: string) => textOf(program)[0];
		expect(counted('forward(3)\n')).toBe('forward takes no value, not 1.');
		expect(counted('turn_left(1, 2)\n')).toBe('turn_left takes no value, not 2.');
		expect(counted('start_painting()\n')).toBe('start_painting takes 1 value, not 0.');
		const two = 'function go(a, b):\n    forward()\ngo(1)\n';
		expect(counted(two)).toBe('go takes 2 values, not 1.');
		expect(counted('if true:\n     forward()\n')).toBe(
			'This line is indented by 5 spaces, not 0 or 4.'
		);
		expect(counted('if true:\n    if true:\n        forward()\n forward()\n')).toBe(
			'This line is indented by 1 space, not 0 or 4.'
		);
	});

	it('gives the lines that an error names: its own, and the one of a let or a definition', () => {
		expect(textOf('walk()\n\nfunction walk():\n    forward()\n')[0]).toBe(
			'walk is called on line 1 but defined on line 3.'
		);
		expect(textOf('print(sides)\nlet sides = 4\n')[0]).toBe(
			'sides is used before its let, on line 2.'
		);
		expect(textOf('let sides = sides + 1\n')[0]).toBe('sides is used before its let, on line 1.');
		expect(textOf('let sides = 4\n\nlet sides = 5\n')[0]).toBe(
			'sides is already declared, on line 1.'
		);
	});

	it('says what a reserved word belongs to', () => {
		const [color, builtin] = check('let red = 3\nlet forward = 4\n').map(
			(error) => errorText(error).title
		);
		expect(color).toBe('red is a color of Stepwise.');
		expect(builtin).toBe('forward is a built-in function of Stepwise.');
	});

	it('shows the way of Stepwise for a word of another language', () => {
		expect(textOf('elif\n')).toEqual([
			'elif is not a word of Stepwise.',
			'Stepwise writes else if.'
		]);
		expect(textOf('def\n')[1]).toBe('Stepwise defines a function with function.');
	});

	it('names every place where a value is missing, a count of repeat included', () => {
		expect(textOf('repeat:\n    forward()\n')).toEqual([
			'A value is missing here.',
			"A value is expected after an operator, a ',' or a '=', and after if, while and repeat."
		]);
	});

	it('says that the blocks around an expression count in its depth', () => {
		expect(textOf(`print(${'('.repeat(300)}1${')'.repeat(300)})\n`)[1]).toBe(
			'An expression nests up to 200 levels, the blocks around it included.'
		);
	});
});
