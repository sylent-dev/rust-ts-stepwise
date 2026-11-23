import { beforeAll, describe, expect, it } from 'vitest';
import { check, type RuntimeError } from '#lib/core/core.ts';
import { loadTestCore } from '#lib/core/test-support.ts';
import type { CodeChange } from '#lib/editor/edits.ts';
import { ConsoleLog, KEPT_LINES } from './console-log.svelte.ts';

beforeAll(loadTestCore);

/** The error of a robot that bumped into a wall, on a line of a code. */
function bumpAt(line: number, from: number): RuntimeError {
	return { span: { line, from, to: from + 9 }, kind: { code: 'bump' } };
}

/** A change that writes `written` characters, all on new lines, before every place. */
function linesAbove(written: number, lines: number): CodeChange {
	return { map: (at) => at + written, lineAt: (at) => (at >= written ? lines + 1 : 1) };
}

describe('the log of a console', () => {
	it('keeps the lines printed in order, an empty one included', () => {
		const log = new ConsoleLog();
		log.start();
		log.print('Sides: 1');
		log.print('');
		log.print('Sides: 2');
		expect({ kind: log.kind, lines: log.lines, cut: log.cut }).toEqual({
			kind: 'ran',
			lines: ['Sides: 1', '', 'Sides: 2'],
			cut: false
		});
	});

	it('keeps the last 1,000 lines of a program that never ends, and says that some are gone', () => {
		const log = new ConsoleLog();
		log.start();
		for (let turn = 1; turn <= KEPT_LINES; turn += 1) log.print(`Turns: ${String(turn)}`);
		expect({ count: log.lines.length, cut: log.cut }).toEqual({ count: KEPT_LINES, cut: false });
		for (let turn = KEPT_LINES + 1; turn <= 5 * KEPT_LINES + 17; turn += 1) {
			log.print(`Turns: ${String(turn)}`);
		}
		expect({
			count: log.lines.length,
			first: log.lines[0],
			last: log.lines.at(-1),
			cut: log.cut
		}).toEqual({ count: KEPT_LINES, first: 'Turns: 4018', last: 'Turns: 5017', cut: true });
	});

	it('writes the error that stopped the program after its lines', () => {
		const log = new ConsoleLog();
		log.start();
		log.print('Sides: 1');
		log.fail(bumpAt(5, 40));
		expect({ lines: log.lines, errors: log.errors }).toEqual({
			lines: ['Sides: 1'],
			errors: [{ found: 'run', error: bumpAt(5, 40), at: 40, line: 5 }]
		});
	});

	it('lists the errors of the checks in place of the last run, which starts a new report', () => {
		const log = new ConsoleLog();
		log.start();
		for (let turn = 0; turn <= KEPT_LINES; turn += 1) log.print('again');
		const report = log.report;
		const errors = check('print(sidse)\nfoward()\n');
		log.list(errors);
		expect({
			kind: log.kind,
			lines: log.lines,
			cut: log.cut,
			places: log.errors.map(({ found, at, line }) => ({ found, at, line })),
			renewed: log.report > report
		}).toEqual({
			kind: 'checked',
			lines: [],
			cut: false,
			places: [
				{ found: 'checks', at: 6, line: 1 },
				{ found: 'checks', at: 13, line: 2 }
			],
			renewed: true
		});
	});

	it('follows the code as it changes: each error stays at its place, on its line', () => {
		const log = new ConsoleLog();
		log.list(check('print(sidse)\nfoward()\n'));
		log.follow(linesAbove(12, 1));
		expect(log.errors.map(({ at, line }) => ({ at, line }))).toEqual([
			{ at: 18, line: 2 },
			{ at: 25, line: 2 }
		]);
	});

	it('is back to its state before any Run once cleared', () => {
		const log = new ConsoleLog();
		log.start();
		log.print('Sides: 1');
		log.fail(bumpAt(5, 40));
		log.clear();
		expect({ kind: log.kind, lines: log.lines, errors: log.errors }).toEqual({
			kind: 'empty',
			lines: [],
			errors: []
		});
	});
});
