// The lines of a run in the editor: where the screen shows them, and that they follow the code
// as it changes (follow.spec.ts tests how).

import { EditorState, RangeSet } from '@codemirror/state';
import { type Decoration, EditorView, gutterLineClass } from '@codemirror/view';
import { describe, expect, it } from 'vitest';
import { type RunLine, runLinesOf, runLinesShown, showLine } from './run-lines.ts';

/** A program of five lines, the last one empty: lines 1 to 4 and an empty line 5. */
const CODE = 'forward()\nturn_left()\n\nforward()\n';

function stateOf(doc = CODE): EditorState {
	return EditorState.create({ doc, extensions: runLinesShown });
}

/** The state once a line of the run shows on line `at`, or is taken away. */
function shown(state: EditorState, line: RunLine, at: number | undefined): EditorState {
	const spec = showLine(state, line, at);
	return spec ? state.update(spec).state : state;
}

/** The lines lit in the code, by their number, each with its class. */
function litLines(state: EditorState): { line: number; look: string }[] {
	const lit: { line: number; look: string }[] = [];
	for (const source of state.facet(EditorView.decorations)) {
		if (typeof source === 'function') continue;
		const set: RangeSet<Decoration> = source;
		set.between(0, state.doc.length, (from, _to, decoration) => {
			// What a decoration was made with is given untyped: its class is read with a check.
			const spec: unknown = decoration.spec;
			const look =
				typeof spec === 'object' &&
				spec !== null &&
				'class' in spec &&
				typeof spec.class === 'string'
					? spec.class
					: '';
			lit.push({ line: state.doc.lineAt(from).number, look });
		});
	}
	return lit;
}

/** The lines whose place in each gutter takes a class, by their number, each with its class. */
function tonedLines(state: EditorState): { line: number; look: string }[] {
	const toned: { line: number; look: string }[] = [];
	for (const set of state.facet(gutterLineClass)) {
		set.between(0, state.doc.length, (from, _to, marker) => {
			toned.push({ line: state.doc.lineAt(from).number, look: marker.elementClass });
		});
	}
	return toned;
}

describe('the lines of a run', () => {
	it('shows nothing before the screen gives a line', () => {
		const state = stateOf();
		expect(runLinesOf(state)).toEqual({ next: undefined, failed: undefined });
		expect(litLines(state)).toEqual([]);
	});

	it('lights the line of the next step, in the code and in its margin', () => {
		const state = shown(stateOf(), 'next', 2);
		expect(litLines(state)).toEqual([{ line: 2, look: 'run-next' }]);
		expect(tonedLines(state)).toEqual([{ line: 2, look: 'run-next' }]);
	});

	it('moves the line of the next step as the program goes, and takes it away', () => {
		const second = shown(stateOf(), 'next', 2);
		const fourth = shown(second, 'next', 4);
		expect(litLines(fourth)).toEqual([{ line: 4, look: 'run-next' }]);
		expect(litLines(shown(fourth, 'next', undefined))).toEqual([]);
	});

	it('marks the line where an error stopped the program', () => {
		const state = shown(stateOf(), 'failed', 4);
		expect(litLines(state)).toEqual([{ line: 4, look: 'run-failed' }]);
		expect(tonedLines(state)).toEqual([{ line: 4, look: 'run-failed' }]);
	});

	it('changes nothing when the line already stands there', () => {
		const state = shown(stateOf(), 'next', 2);
		expect(showLine(state, 'next', 2)).toBeUndefined();
		expect(showLine(stateOf(), 'failed', undefined)).toBeUndefined();
	});

	it('scrolls the code to a line shown, and not to a line taken away', () => {
		expect(showLine(stateOf(), 'next', 4)?.effects).toHaveLength(2);
		expect(showLine(shown(stateOf(), 'next', 4), 'next', undefined)?.effects).toHaveLength(1);
	});

	it('shows nowhere a line that the code doesn’t have', () => {
		const state = shown(stateOf(), 'failed', 9);
		expect(runLinesOf(state).failed).toBe(9);
		expect(litLines(state)).toEqual([]);
		expect(showLine(stateOf(), 'failed', 0)?.effects).toHaveLength(1);
	});

	it('keeps the mark of an error on its line while the code changes around it', () => {
		const state = shown(stateOf(), 'failed', 4);
		const changed = state.update({ changes: { from: 0, insert: 'turn_right()\n' } }).state;
		expect(runLinesOf(changed).failed).toBe(5);
		expect(litLines(changed)).toEqual([{ line: 5, look: 'run-failed' }]);
	});

	it('keeps a line in its place when a character is typed above it', () => {
		const state = shown(stateOf(), 'failed', 4);
		const changed = state.update({ changes: { from: 0, insert: '#' } }).state;
		expect(litLines(changed)).toEqual([{ line: 4, look: 'run-failed' }]);
		expect(tonedLines(changed)).toEqual([{ line: 4, look: 'run-failed' }]);
	});

	it('takes the mark of an error away with its line', () => {
		const state = shown(stateOf(), 'failed', 2);
		const line = state.doc.line(2);
		const changed = state.update({ changes: { from: line.from, to: line.to + 1 } }).state;
		expect(runLinesOf(changed).failed).toBeUndefined();
		expect(litLines(changed)).toEqual([]);
	});
});
