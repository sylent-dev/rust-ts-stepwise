// The breakpoints of the code (see Code editor in specs.md): a click in the margin, left of the
// numbers (margin.ts), or **Toggle breakpoint** at the line of the cursor, sets or removes one.
// A breakpoint belongs to a line: it follows it as the code changes, by the rules of the marks of
// a run (follow.ts), and goes with it. It changes no text, so it can be set or removed at any
// moment, while the code is locked too, and it is no step of the history: **Undo** undoes a change
// of the text alone. As the program starts, each goes to a line where a step starts, by the rule
// of a breakpoint asked. The screen saves them with the code, and the program that runs reads
// them.

import {
	type EditorState,
	type Extension,
	StateEffect,
	StateField,
	type TransactionSpec
} from '@codemirror/state';
import { stepLines } from '#lib/core/core.ts';
import { changedBy, followLine } from './follow.ts';

/** No breakpoint. */
const NONE: readonly number[] = [];

/** Replaces the breakpoints of the code with these lines, in order and each once. */
const replace = StateEffect.define<readonly number[]>();

/** Lines in order, each once. */
function ordered(lines: Iterable<number>): readonly number[] {
	return [...new Set(lines)].sort((first, second) => first - second);
}

/**
 * The breakpoints of the code, by the numbers of their lines, in order and each once. Two of them
 * meet on one line when a line is joined to the one above it: they are then one.
 */
const breakpointLines = StateField.define<readonly number[]>({
	create: () => NONE,
	update(lines, transaction) {
		let moved = lines;
		if (transaction.docChanged && lines.length > 0) {
			const changed = changedBy(transaction);
			moved = ordered(
				lines.flatMap((line) => {
					const followed = followLine(changed, line);
					return followed === undefined ? [] : [followed];
				})
			);
		}
		for (const effect of transaction.effects) {
			if (effect.is(replace)) moved = effect.value;
		}
		return moved;
	}
});

/**
 * The breakpoints of an editor that opens on its code: the ones saved with it, those on a line
 * that the code doesn't have left out.
 */
export function breakpoints(saved: readonly number[]): Extension {
	return breakpointLines.init((state) =>
		ordered(saved.filter((line) => line >= 1 && line <= state.doc.lines))
	);
}

/** The breakpoints of an editor, by the numbers of their lines, in order. */
export function breakpointsOf(state: EditorState): readonly number[] {
	return state.field(breakpointLines, false) ?? NONE;
}

/**
 * The line where a breakpoint asked on a line goes: that line when a step starts there, or else
 * the next one where a step starts (on the line of a `function`, the first line of its block,
 * where the program stops as the function is entered); nothing when no step starts after it.
 * `steps` are the lines where a step starts, nothing when the checks refuse the code: the
 * breakpoint stays on the line asked then, since nothing can run.
 */
export function breakpointLine(
	asked: number,
	steps: readonly number[] | undefined
): number | undefined {
	return steps ? steps.find((line) => line >= asked) : asked;
}

/**
 * What sets or removes a breakpoint asked on a line, `steps` being where a step starts
 * (`breakpointLine`): the breakpoint of that line, when it has one, goes away, even on a line
 * where no step starts any longer; otherwise the breakpoint of the line where it goes is set, or
 * taken away when it is there already, so that asking twice gives back what was. Nothing when
 * it goes nowhere.
 */
export function toggleBreakpoint(
	state: EditorState,
	asked: number,
	steps: readonly number[] | undefined
): TransactionSpec | undefined {
	const lines = breakpointsOf(state);
	const line = lines.includes(asked) ? asked : breakpointLine(asked, steps);
	if (line === undefined) return undefined;
	const toggled = lines.includes(line)
		? lines.filter((other) => other !== line)
		: ordered([...lines, line]);
	return { effects: replace.of(toggled) };
}

/**
 * What sets or removes a breakpoint asked on a line of the code as it is now: the core says
 * where a step starts.
 */
export function toggleBreakpointAt(state: EditorState, asked: number): TransactionSpec | undefined {
	const steps = stepLines(state.doc.toString());
	return toggleBreakpoint(state, asked, steps && Array.from(steps));
}

/**
 * What puts each breakpoint on a line where a step starts, by the rule of a breakpoint asked
 * (`breakpointLine`), `steps` being where a step starts: the code may have changed since one
 * was set, and a breakpoint on a line commented since, become an `else:`, or set while the code
 * had an error, would never pause the program. One that no step follows goes. Nothing when each
 * stands on a line where a step starts, or when the checks refuse the code.
 */
export function settleBreakpoints(
	state: EditorState,
	steps: readonly number[] | undefined
): TransactionSpec | undefined {
	if (!steps) return undefined;
	const lines = breakpointsOf(state);
	const settled = ordered(
		lines.flatMap((line) => {
			const to = breakpointLine(line, steps);
			return to === undefined ? [] : [to];
		})
	);
	const same = settled.length === lines.length && settled.every((line, at) => line === lines[at]);
	return same ? undefined : { effects: replace.of(settled) };
}

/** What puts each breakpoint on a line where a step starts in the code as it is now. */
export function settleBreakpointsNow(state: EditorState): TransactionSpec | undefined {
	if (breakpointsOf(state).length === 0) return undefined;
	const steps = stepLines(state.doc.toString());
	return settleBreakpoints(state, steps && Array.from(steps));
}

/** What takes every breakpoint away; nothing when there is none. */
export function removeBreakpoints(state: EditorState): TransactionSpec | undefined {
	return breakpointsOf(state).length > 0 ? { effects: replace.of(NONE) } : undefined;
}
