// The lines of a run in the editor (see Running a program in specs.md): the line of the next
// step, lit with an arrow in the margin, and the line where an error stopped the program, marked
// with a cross. The screen says which lines they are as its program goes; the editor shows each
// one as it comes, the code scrolled just enough for it to be seen, and keeps it on its line
// while the code changes, until the screen takes it away.

import {
	type EditorState,
	type Extension,
	RangeSet,
	StateEffect,
	StateField,
	type Transaction,
	type TransactionSpec
} from '@codemirror/state';
import { Decoration, EditorView, GutterMarker, gutter, gutterLineClass } from '@codemirror/view';
import { mount, unmount } from 'svelte';
import type { IconName } from '#lib/icon-name.ts';
import Icon from '#lib/icon.svelte';

/** A line of a run: the one of the next step, or the one of the error that stopped it. */
export type RunLine = 'next' | 'failed';

/** Where each line of a run stands, by its number from 1; nothing when it doesn't show. */
export type RunLines = Readonly<Record<RunLine, number | undefined>>;

const NO_LINES: RunLines = { next: undefined, failed: undefined };

/** Shows a line of a run on another line, or takes it away. */
const show = StateEffect.define<{ line: RunLine; at: number | undefined }>();

/**
 * Where a line stands once the code has changed: on the line that holds its text now, lines
 * added or taken away above it, and a line break typed at its start, which carries its text
 * down. Nothing once the line itself is gone: its text and one of its breaks deleted, which
 * Backspace at its start does to an empty line, unless the same change writes it again
 * elsewhere, as a line moved over it does. A line joined to the one above it keeps its text
 * there, and the mark follows it.
 */
export function followLine(transaction: Transaction, number: number): number | undefined {
	const before = transaction.startState.doc;
	if (number < 1 || number > before.lines) return undefined;
	const line = before.line(number);
	const replaced: { from: number; to: number }[] = [];
	transaction.changes.iterChangedRanges((from, to) => {
		replaced.push({ from, to });
	});
	const gone = replaced.some(
		({ from, to }) =>
			(number > 1 && from <= line.from - 1 && to >= line.to) ||
			(number < before.lines && from <= line.from && to >= line.to + 1)
	);
	if (gone) return writtenAgain(transaction, line.text);
	// The first character of its text, and after what is written there: Enter in the spaces that
	// start a line replaces them with a break and the same spaces (`insertNewLine`), a change
	// that starts at the start of the line, where a place stays whatever its side.
	const text = line.to - line.text.trimStart().length;
	return transaction.newDoc.lineAt(transaction.changes.mapPos(text, 1)).number;
}

/**
 * The line where a change writes the text of a line again, with its break: **Move line up**
 * and **Move line down** delete the line that the lines moved pass over, and write it on their
 * other side (`moveLineUp`, `moveLineDown` of CodeMirror), as their undo does. Nothing when the
 * change doesn't write it again.
 */
function writtenAgain(transaction: Transaction, text: string): number | undefined {
	const written: number[] = [];
	transaction.changes.iterChanges((_fromA, _toA, fromB, toB, inserted) => {
		const insert = inserted.toString();
		if (insert === `${text}\n`) written.push(transaction.newDoc.lineAt(fromB).number);
		else if (insert === `\n${text}`) written.push(transaction.newDoc.lineAt(toB).number);
	});
	return written[0];
}

/** The lines of the run, as the screen showed them and the changes of the code carried them. */
const runLines = StateField.define<RunLines>({
	create: () => NO_LINES,
	update(lines, transaction) {
		let moved = lines;
		if (transaction.docChanged) {
			const follow = (at: number | undefined) =>
				at === undefined ? undefined : followLine(transaction, at);
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

/** The class of a line of a run, on its code and on its place in each gutter. */
const CLASSES = {
	next: 'run-next',
	failed: 'run-failed'
} as const satisfies Record<RunLine, string>;

/** The icon of a line of a run in the margin: the arrow of the next step, the cross of an error. */
const ICONS = {
	next: 'next',
	failed: 'close'
} as const satisfies Record<RunLine, IconName>;

/** The tone of the place of a line of a run in each gutter: its number takes it too. */
class LineTone extends GutterMarker {
	override readonly elementClass: string;

	constructor(line: RunLine) {
		super();
		this.elementClass = CLASSES[line];
	}

	override eq(other: GutterMarker): boolean {
		return other instanceof LineTone && other.elementClass === this.elementClass;
	}
}

/** The icons drawn in the margin, each by the box it was drawn in, to take it away with it. */
const drawn = new WeakMap<Node, ReturnType<typeof mount>>();

/** The icon of a line of a run, in the gutter of the marks. */
class LineMark extends GutterMarker {
	readonly #line: RunLine;

	constructor(line: RunLine) {
		super();
		this.#line = line;
	}

	override eq(other: GutterMarker): boolean {
		return other instanceof LineMark && other.#line === this.#line;
	}

	override toDOM(): Node {
		const box = document.createElement('span');
		box.className = `run-mark ${CLASSES[this.#line]}`;
		drawn.set(box, mount(Icon, { target: box, props: { name: ICONS[this.#line], size: 13 } }));
		return box;
	}

	override destroy(dom: Node): void {
		const icon = drawn.get(dom);
		drawn.delete(dom);
		if (icon) void unmount(icon);
	}
}

const MARKS = {
	next: new LineMark('next'),
	failed: new LineMark('failed')
} as const satisfies Record<RunLine, LineMark>;
const TONES = {
	next: new LineTone('next'),
	failed: new LineTone('failed')
} as const satisfies Record<RunLine, LineTone>;
const LINE_LOOKS = {
	next: Decoration.line({ class: CLASSES.next }),
	failed: Decoration.line({ class: CLASSES.failed })
} as const satisfies Record<RunLine, Decoration>;

/**
 * The lines of a run in the editor: the line lit on its whole width, its number in the tone of
 * the line, and its icon in a gutter of its own, before the numbers, where the breakpoints of
 * step 19 come too. The look is with the editor's.
 */
export const runLinesShown: Extension = [
	runLines,
	// Each reads where the lines of the code start, which the document says.
	EditorView.decorations.compute(['doc', runLines], (state) =>
		Decoration.set(placed(state).map(({ line, from }) => LINE_LOOKS[line].range(from)))
	),
	gutterLineClass.compute(['doc', runLines], (state) =>
		RangeSet.of(placed(state).map(({ line, from }) => TONES[line].range(from)))
	),
	gutter({
		class: 'run-marks',
		markers: (view) =>
			RangeSet.of(placed(view.state).map(({ line, from }) => MARKS[line].range(from)))
	})
];
