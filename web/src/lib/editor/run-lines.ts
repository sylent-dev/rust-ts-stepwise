// The lines of a run in the editor (see Running a program in specs.md): the line of the next
// step, lit with an arrow in the margin, and the line where an error stopped the program, marked
// with a cross (the marks of the margin are in margin.ts). The screen says which lines they are
// as its program goes; the editor shows each one as it comes, the code scrolled just enough for
// it to be seen, and keeps it on its line while the code changes, until the screen takes it away.

import {
	type EditorState,
	type Extension,
	RangeSet,
	StateEffect,
	StateField,
	type TransactionSpec
} from '@codemirror/state';
import { Decoration, EditorView, GutterMarker, gutterLineClass } from '@codemirror/view';
import { changedBy, followLine } from './follow.ts';

/** A line of a run: the one of the next step, or the one of the error that stopped it. */
export type RunLine = 'next' | 'failed';

/** Where each line of a run stands, by its number from 1; nothing when it doesn't show. */
export type RunLines = Readonly<Record<RunLine, number | undefined>>;

const NO_LINES: RunLines = { next: undefined, failed: undefined };

/** Shows a line of a run on another line, or takes it away. */
const show = StateEffect.define<{ line: RunLine; at: number | undefined }>();

/** The lines of the run, as the screen showed them and the changes of the code carried them. */
const runLines = StateField.define<RunLines>({
	create: () => NO_LINES,
	update(lines, transaction) {
		let moved = lines;
		if (transaction.docChanged) {
			const follow = (at: number | undefined) =>
				at === undefined ? undefined : followLine(changedBy(transaction), at);
			moved = { next: follow(lines.next), failed: follow(lines.failed) };
		}
		for (const effect of transaction.effects) {
			if (effect.is(show)) moved = { ...moved, [effect.value.line]: effect.value.at };
		}
		return moved;
	}
});

/** Where each line of a run stands now in an editor. */
export function runLinesOf(state: EditorState): RunLines {
	return state.field(runLines, false) ?? NO_LINES;
}

/**
 * What shows a line of a run on another line, or takes it away: a transaction to give the
 * editor, which scrolls the code just enough for the line to be seen. Nothing when the line
 * already stands there. A line that the code doesn't have shows nowhere.
 */
export function showLine(
	state: EditorState,
	line: RunLine,
	at: number | undefined
): TransactionSpec | undefined {
	if (runLinesOf(state)[line] === at) return undefined;
	const effects: StateEffect<unknown>[] = [show.of({ line, at })];
	if (at !== undefined && at >= 1 && at <= state.doc.lines) {
		effects.push(EditorView.scrollIntoView(state.doc.line(at).from, { y: 'nearest' }));
	}
	return { effects };
}

/**
 * The lines of a run that the code has, each at the start of its line, in the order of the
 * code. The line of the next step and the one of an error never show together: the program has
 * no next step once an error has stopped it.
 */
function placed(state: EditorState): { line: RunLine; from: number }[] {
	const lines = runLinesOf(state);
	const at = (line: RunLine) => {
		const number = lines[line];
		return number !== undefined && number >= 1 && number <= state.doc.lines
			? [{ line, from: state.doc.line(number).from }]
			: [];
	};
	return [...at('failed'), ...at('next')].sort((first, second) => first.from - second.from);
}

/**
 * The class of a line of a run, on its code and on its place in each gutter, and on its icon in
 * the margin of the marks (margin.ts).
 */
export const RUN_LINE_CLASSES = {
	next: 'run-next',
	failed: 'run-failed'
} as const satisfies Record<RunLine, string>;

/** The tone of the place of a line of a run in each gutter: its number takes it too. */
class LineTone extends GutterMarker {
	override readonly elementClass: string;

	constructor(line: RunLine) {
		super();
		this.elementClass = RUN_LINE_CLASSES[line];
	}

	override eq(other: GutterMarker): boolean {
		return other instanceof LineTone && other.elementClass === this.elementClass;
	}
}

const TONES = {
	next: new LineTone('next'),
	failed: new LineTone('failed')
} as const satisfies Record<RunLine, LineTone>;
const LINE_LOOKS = {
	next: Decoration.line({ class: RUN_LINE_CLASSES.next }),
	failed: Decoration.line({ class: RUN_LINE_CLASSES.failed })
} as const satisfies Record<RunLine, Decoration>;

/**
 * The lines of a run in the editor: the line lit on its whole width, and its place in each
 * gutter, its number included, in the tone of the line; its icon stands in the margin of the
 * marks (margin.ts). The look is with the editor's.
 */
export const runLinesShown: Extension = [
	runLines,
	// Each reads where the lines of the code start, which the document says.
	EditorView.decorations.compute(['doc', runLines], (state) =>
		Decoration.set(placed(state).map(({ line, from }) => LINE_LOOKS[line].range(from)))
	),
	gutterLineClass.compute(['doc', runLines], (state) =>
		RangeSet.of(placed(state).map(({ line, from }) => TONES[line].range(from)))
	)
];
