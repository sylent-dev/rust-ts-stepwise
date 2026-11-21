import { Text } from '@codemirror/state';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadTestCore } from '#lib/core/test-support.ts';
import sheet from '#lib/styles/code.css?raw';
import { coloredStretches, STRETCH_CLASSES } from './code-colors.ts';

beforeAll(loadTestCore);

/** The stretches that take a color in the whole text, each as its class and what it holds. */
function colorsOf(lines: string[]): string[] {
	const document = Text.of(lines);
	return coloredStretches(document, [{ from: 0, to: document.length }]).map(
		({ from, to, name }) => `${name} ${document.sliceString(from, to)}`
	);
}

describe('the colors of the code', () => {
	it('gives each kind of stretch its class, and none to a name or a symbol', () => {
		expect(colorsOf(['let side = 3  # the side', 'if is_painting() and not done:'])).toStrictEqual([
			'code-keyword let',
			'code-number 3',
			'code-comment # the side',
			'code-keyword if',
			'code-function is_painting',
			'code-keyword and',
			'code-keyword not'
		]);
	});

	it('writes true, false and a color as a number, and a text in its own color', () => {
		expect(colorsOf(['paint(red)', 'print("Done", true, false)'])).toStrictEqual([
			'code-function paint',
			'code-number red',
			'code-function print',
			'code-string "Done"',
			'code-number true',
			'code-number false'
		]);
	});

	it('keeps its colors on a line that the language refuses', () => {
		expect(colorsOf(['repeat 4 ? print("not closed'])).toStrictEqual([
			'code-keyword repeat',
			'code-number 4',
			'code-function print',
			'code-string "not closed'
		]);
	});

	it('places a stretch in the document, after the lines above it', () => {
		const document = Text.of(['forward()', '', '    turn_left()']);

		expect(coloredStretches(document, [{ from: 0, to: document.length }])).toStrictEqual([
			{ from: 0, to: 7, name: 'code-function' },
			{ from: 15, to: 24, name: 'code-function' }
		]);
	});

	it('reads only the lines that the ranges touch, each one whole', () => {
		const document = Text.of(['forward()', 'repeat 2:', '    paint(red)', 'back()']);
		// From the middle of the second line to the start of the third.
		const second = document.line(2);
		const third = document.line(3);

		const colored = coloredStretches(document, [{ from: second.from + 3, to: third.from }]);

		expect(colored.map(({ from, to }) => document.sliceString(from, to))).toStrictEqual([
			'repeat',
			'2',
			'paint',
			'red'
		]);
	});

	it('reads once a line that two ranges touch', () => {
		const document = Text.of(['forward()', 'turn_left()']);

		const colored = coloredStretches(document, [
			{ from: 0, to: 2 },
			{ from: 4, to: 6 },
			{ from: 12, to: 14 }
		]);

		expect(colored.map(({ from, to }) => document.sliceString(from, to))).toStrictEqual([
			'forward',
			'turn_left'
		]);
	});

	it('reads nothing of an empty document', () => {
		expect(colorsOf([''])).toStrictEqual([]);
	});
});

describe('the classes of the colors', () => {
	/** The classes that the style sheet gives a color to. */
	const styled = [...sheet.matchAll(/^\.(?<name>[a-z-]+) \{/gm)].flatMap(
		(rule) => rule.groups?.name ?? []
	);

	it('are the classes of the style sheet of the code, each one used', () => {
		const used = Object.values(STRETCH_CLASSES).filter((name) => name !== undefined);

		expect(new Set(used)).toStrictEqual(new Set(styled));
	});

	it('take a color of the design system each', () => {
		expect(styled).not.toHaveLength(0);
		for (const name of styled) {
			const rule = new RegExp(`^\\.${name} \\{\\n\\tcolor: var\\(--code-[a-z]+\\);\\n\\}`, 'm');

			expect(sheet).toMatch(rule);
		}
	});
});
