// The marks of the margin: a breakpoint, the lines of a run, and how they share a line. The click
// that sets a breakpoint is tried in a real browser (e2e/breakpoints.spec.ts).

import { EditorState, type TransactionSpec } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import { breakpoints } from './breakpoints.ts';
import { marginMarks } from './margin.ts';
import { type RunLine, runLinesShown, showLine } from './run-lines.ts';

const CODE = 'forward()\nturn_left()\n\nforward()';

/** A state with the breakpoints `saved`, and the lines of a run shown where `run` says. */
function stateOf(saved: readonly number[], run: Partial<Record<RunLine, number>> = {}) {
	let state = EditorState.create({ doc: CODE, extensions: [breakpoints(saved), runLinesShown] });
	for (const line of ['next', 'failed'] as const) {
		const spec: TransactionSpec | undefined = showLine(state, line, run[line]);
		if (spec) state = state.update(spec).state;
	}
	return state;
}

describe('marginMarks', () => {
	it('is nothing on a code without breakpoint nor run', () => {
		expect(marginMarks(stateOf([]))).toEqual([]);
	});

	it('marks each breakpoint, in the order of the lines', () => {
		expect(marginMarks(stateOf([4, 2]))).toEqual([
			{ line: 2, mark: 'breakpoint' },
			{ line: 4, mark: 'breakpoint' }
		]);
	});

	it('marks the line of the next step, with its breakpoint beside it when it has one', () => {
		expect(marginMarks(stateOf([2], { next: 1 }))).toEqual([
			{ line: 1, mark: 'next' },
			{ line: 2, mark: 'breakpoint' }
		]);
		expect(marginMarks(stateOf([2], { next: 2 }))).toEqual([{ line: 2, mark: 'breakpoint-next' }]);
	});

	it('marks the line of an error by its cross alone, a breakpoint there standing behind it', () => {
		expect(marginMarks(stateOf([2, 4], { failed: 4 }))).toEqual([
			{ line: 2, mark: 'breakpoint' },
			{ line: 4, mark: 'failed' }
		]);
	});

	it('marks no line that the code doesn’t have', () => {
		expect(marginMarks(stateOf([], { failed: 9 }))).toEqual([]);
	});
});
