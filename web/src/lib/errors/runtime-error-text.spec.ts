import { beforeAll, describe, expect, it, vi } from 'vitest';
import { type RuntimeError, Sandbox } from '#lib/core/core.ts';
import { corridor, loadTestCore, sandboxOf } from '#lib/core/test-support.ts';
import { RUNTIME_ERROR_SUBJECTS, runtimeErrorText } from './runtime-error-text.ts';

beforeAll(loadTestCore);

/** A sandbox of three cells, the robot on the first, an item on each of the first two. */
const SANDBOX = sandboxOf(corridor('...', 'items = [[0, 0], [1, 0]]\n'));

/** The most steps a program of these tests runs. */
const MAX_STEPS = 10_000;

/** As many characters as a text or a line of `print` holds. */
const LONGEST = 'a'.repeat(1000);

/**
 * A program for each error while running, each stopped by it. `internal` has none: the checks
 * rule out what would give it. A code added to the core has no program here until one is
 * written, and the test of the subjects says so.
 */
const PROGRAMS: readonly string[] = [
	'if 3:\n    forward()\n',
	'repeat "twice":\n    forward()\n',
	'repeat 0 - 3:\n    forward()\n',
	'print(-"a")\n',
	'print(not 3)\n',
	'print("Sides: " + 4)\n',
	'print(true < 2)\n',
	'print(1 == "1")\n',
	'print("a" * 2)\n',
	'print(1 and true)\n',
	'print(1 / 0)\n',
	'print(9223372036854775807 + 1)\n',
	`let line = "${LONGEST}" + "x"\n`,
	'let line = print("a")\n',
	'function down(depth):\n    down(depth + 1)\n\ndown(1)\n',
	'turn_left()\nforward()\n',
	'pick_up()\nforward()\npick_up()\n',
	'drop()\n',
	'forward()\nforward()\npick_up()\n',
	'pick_up()\nforward()\ndrop()\n',
	'start_painting(3)\n',
	`print("${LONGEST}", "x")\n`
];

/** The error that stopped a program, run in the sandbox to its end. */
function errorOf(source: string): RuntimeError {
	using sandbox = new Sandbox(SANDBOX);
	using run = sandbox.start(source);
	for (let steps = 0; run.line !== undefined; steps += 1) {
		if (steps >= MAX_STEPS) throw new Error(`${source} still runs after ${MAX_STEPS} steps`);
		run.step();
	}
	const outcome = run.outcome();
	if (outcome?.type !== 'failed') throw new Error(`${source} ends without error`);
	return outcome.error;
}

/** The two sentences of the error that stopped a program. */
function textOf(source: string): string[] {
	const { title, rule } = runtimeErrorText(errorOf(source));
	return [title, rule];
}

describe('runtimeErrorText', () => {
	it('has a program for every error while running but the mistake of the core', () => {
		const found = new Set(PROGRAMS.map((source) => errorOf(source).kind.code));
		expect([...found, 'internal'].sort()).toEqual([...RUNTIME_ERROR_SUBJECTS].sort());
	});

	it('gives every error two sentences, each with its values', () => {
		const warn = vi.spyOn(console, 'warn');
		const internal: RuntimeError = {
			span: { line: 1, from: 0, to: 1 },
			kind: { code: 'internal' }
		};
		for (const error of [...PROGRAMS.map(errorOf), internal]) {
			const { title, rule } = runtimeErrorText(error);
			for (const sentence of [title, rule]) {
				expect(sentence, error.kind.code).toMatch(/^\S.*\.$/u);
				expect(sentence, error.kind.code).not.toMatch(/[{}$]|error-/u);
			}
		}
		expect(warn).not.toHaveBeenCalled();
	});

	it('writes the type of a value in words', () => {
		expect(textOf('if 3:\n    forward()\n')[0]).toBe('This condition is a number, not a boolean.');
		expect(textOf('repeat "twice":\n    forward()\n')[0]).toBe(
			'The count of this repeat is a text, not a number.'
		);
		expect(textOf('start_painting(3)\n')).toEqual([
			'start_painting is given a number, not a color.',
			'start_painting takes a color: red, yellow or blue.'
		]);
		expect(textOf('print(1 and true)\n')).toEqual([
			'This side of and is a number, not a boolean.',
			'and joins two booleans: true or false.'
		]);
	});

	it('writes the operator in front of a value as a sign between quotes, and not as a word', () => {
		expect(textOf('print(-"a")\n')).toEqual([
			"'-' stands in front of a text.",
			"'-' in front of a value takes a number."
		]);
		expect(textOf('print(not 3)\n')).toEqual([
			'not stands in front of a number.',
			'not takes a boolean: true or false.'
		]);
	});

	it('gives the rule of what the operator between two values does', () => {
		expect(textOf('print("Sides: " + 4)\n')).toEqual([
			"'+' has a text on its left and a number on its right.",
			"'+' adds two numbers or joins two texts."
		]);
		expect(textOf('print(true < 2)\n')[1]).toBe("'<' compares two numbers.");
		expect(textOf('print(1 == "1")\n')[1]).toBe("'==' compares two values of the same type.");
		expect(textOf('print("a" * 2)\n')[1]).toBe("'*' takes a number on each side.");
	});

	it('writes the numbers and the limits of the language', () => {
		expect(textOf('repeat 0 - 3:\n    forward()\n')[0]).toBe(
			'The count of this repeat is -3, below 0.'
		);
		expect(textOf('print(9223372036854775807 + 1)\n')[1]).toBe(
			'A number stays between -9223372036854775808 and 9223372036854775807.'
		);
		expect(textOf(`let line = "${LONGEST}" + "x"\n`)[0]).toBe(
			'This text would be longer than 1,000 characters.'
		);
	});

	it('says what the robot can’t do in familiar words, and the rule in exact ones', () => {
		expect(textOf('forward()\nforward()\npick_up()\n')).toEqual([
			'There is nothing to pick up here.',
			'pick_up() needs an item on the cell of the robot.'
		]);
		expect(textOf('drop()\n')[0]).toBe('The robot has nothing to drop.');
		expect(textOf('pick_up()\nforward()\ndrop()\n')[0]).toBe('There is already an item here.');
	});

	it('says that a function returns no value with the word of the language', () => {
		expect(textOf('let line = print("a")\n')).toEqual([
			'print doesn’t return a value.',
			'A call is used as a value only when its function returns one.'
		]);
	});

	it('says the fact of too many calls, without naming a function that may not be the one', () => {
		const source =
			'function show():\n    print(1)\nfunction count(n):\n    show()\n    count(n + 1)\n\ncount(1)\n';
		expect(errorOf(source).kind).toMatchObject({ code: 'too-many-calls', function: 'show' });
		expect(textOf(source)).toEqual([
			'200 calls in progress: the limit is reached.',
			'A function that calls itself needs a case where it doesn’t.'
		]);
	});
});
