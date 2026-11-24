// The breakpoints of the code: where they go when they are asked, how they follow the code as it
// changes (follow.spec.ts tests the rule of a line), and that they are no step of the history.

import { history, moveLineUp, undo } from '@codemirror/commands';
import { EditorState, type TransactionSpec } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import { loadTestCore } from '#lib/core/test-support.ts';
import {
	breakpointLine,
	breakpoints,
	breakpointsOf,
	removeBreakpoints,
	toggleBreakpoint,
	toggleBreakpointAt
} from './breakpoints.ts';
import { after } from './test-support.ts';

loadTestCore();

/** Four lines: two calls, a blank line, and a call. */
const CODE = 'forward()\nturn_left()\n\nforward()';

/** A state of the editor on `doc`, with the breakpoints `saved`, and its history. */
function stateOf(saved: readonly number[], doc = CODE): EditorState {
	return EditorState.create({ doc, extensions: [breakpoints(saved), history()] });
}

/** The state once a transaction is given, or the same state when there is none. */
function given(state: EditorState, spec: TransactionSpec | undefined): EditorState {
	return spec ? state.update(spec).state : state;
}

describe('the breakpoints of an editor', () => {
	it('open as they were saved, those on a line that the code doesn’t have left out', () => {
		expect(breakpointsOf(stateOf([4, 1, 9, 0]))).toEqual([1, 4]);
		expect(breakpointsOf(stateOf([]))).toEqual([]);
	});

	it('are none in an editor that has no place for them', () => {
		expect(breakpointsOf(EditorState.create({ doc: CODE }))).toEqual([]);
	});

	it('follow their lines as lines are added above them', () => {
		const state = stateOf([2, 4]);
		const changed = given(state, { changes: { from: 0, insert: 'print(1)\n' } });
		expect(breakpointsOf(changed)).toEqual([3, 5]);
	});

	it('go with their line', () => {
		const state = stateOf([2, 4]);
		const line = state.doc.line(2);
		const changed = given(state, { changes: { from: line.from, to: line.to + 1 } });
		expect(breakpointsOf(changed)).toEqual([3]);
	});

	it('are one once a line is joined to the one above it', () => {
		const state = stateOf([1, 2]);
		const second = state.doc.line(2);
		const joined = given(state, { changes: { from: second.from - 1, to: second.from } });
		expect(breakpointsOf(joined)).toEqual([1]);
	});

	it('move with a line moved', () => {
		const state = EditorState.create({
			doc: CODE,
			selection: { anchor: CODE.indexOf('turn_left') },
			extensions: [breakpoints([2])]
		});
		expect(breakpointsOf(after(moveLineUp, state))).toEqual([1]);
	});

	it('are no step of the history: Undo gives back the text alone', () => {
		const typed = given(stateOf([]), {
			changes: { from: 0, insert: 'print(1)\n' },
			userEvent: 'input.type'
		});
		const set = given(typed, toggleBreakpoint(typed, 5, [1, 2, 3, 5]));
		expect(breakpointsOf(set)).toEqual([5]);
		const undone = after(undo, set);
		expect(undone.doc.toString()).toBe(CODE);
		expect(breakpointsOf(undone)).toEqual([4]);
	});
});

describe('breakpointLine', () => {
	it('is the line asked when a step starts there', () => {
		expect(breakpointLine(2, [1, 2, 4])).toBe(2);
	});

	it('is the next line where a step starts, or none after the last one', () => {
		expect(breakpointLine(3, [1, 2, 4])).toBe(4);
		expect(breakpointLine(5, [1, 2, 4])).toBeUndefined();
		expect(breakpointLine(1, [])).toBeUndefined();
	});

	it('is the line asked when the checks refuse the code', () => {
		expect(breakpointLine(3, undefined)).toBe(3);
	});
});

describe('toggleBreakpoint', () => {
	const STEPS = [1, 2, 4];

	it('sets a breakpoint, and takes it away when asked again', () => {
		const set = given(stateOf([]), toggleBreakpoint(stateOf([]), 2, STEPS));
		expect(breakpointsOf(set)).toEqual([2]);
		expect(breakpointsOf(given(set, toggleBreakpoint(set, 2, STEPS)))).toEqual([]);
	});

	it('sets on the next line where a step starts one asked on a line where none does', () => {
		const set = given(stateOf([1]), toggleBreakpoint(stateOf([1]), 3, STEPS));
		expect(breakpointsOf(set)).toEqual([1, 4]);
		// Asked there again, it takes away what it set.
		expect(breakpointsOf(given(set, toggleBreakpoint(set, 3, STEPS)))).toEqual([1]);
	});

	it('takes away a breakpoint of a line where no step starts any longer', () => {
		const state = stateOf([3]);
		expect(breakpointsOf(given(state, toggleBreakpoint(state, 3, STEPS)))).toEqual([]);
	});

	it('sets nothing when no step starts after the line asked', () => {
		expect(toggleBreakpoint(stateOf([]), 3, [1, 2])).toBeUndefined();
	});

	it('sets where it is asked when the checks refuse the code', () => {
		const state = stateOf([]);
		expect(breakpointsOf(given(state, toggleBreakpoint(state, 3, undefined)))).toEqual([3]);
	});
});

describe('toggleBreakpointAt', () => {
	it('asks the core where a step starts', () => {
		const code = '# Go\nfunction go():\n    forward()\n\ngo()';
		const state = stateOf([], code);
		expect(breakpointsOf(given(state, toggleBreakpointAt(state, 2)))).toEqual([3]);
		expect(breakpointsOf(given(state, toggleBreakpointAt(state, 1)))).toEqual([3]);
		expect(breakpointsOf(given(state, toggleBreakpointAt(state, 4)))).toEqual([5]);
	});

	it('sets where it is asked in a code with an error', () => {
		const state = stateOf([], '\nforward(\n');
		expect(breakpointsOf(given(state, toggleBreakpointAt(state, 1)))).toEqual([1]);
	});
});

describe('removeBreakpoints', () => {
	it('takes every breakpoint away', () => {
		const state = stateOf([1, 4]);
		expect(breakpointsOf(given(state, removeBreakpoints(state)))).toEqual([]);
	});

	it('changes nothing when there is none', () => {
		expect(removeBreakpoints(stateOf([]))).toBeUndefined();
	});
});
