// The colors of the code in the editor (see Colors of the code in docs/technical-choices.md): the
// core says what each stretch of a line is, and each kind takes its class here. A line is read
// alone, since nothing in the language spans two lines, so only the lines that the editor shows
// are read, again at each change.

import { RangeSetBuilder, type Text } from '@codemirror/state';
import {
	Decoration,
	type DecorationSet,
	type EditorView,
	ViewPlugin,
	type ViewUpdate
} from '@codemirror/view';
import { classifyLine, type StretchKind } from '#lib/core/core.ts';

/**
 * The class of each kind of stretch, one of `styles/code.css`; none for what keeps the color of
 * the text. `true`, `false` and a color are values, written as a number is (see Editor and code
 * in docs/design-system.md). What the language doesn't read keeps the color of the text: the
 * checks underline it.
 */
export const STRETCH_CLASSES = {
	keyword: 'code-keyword',
	boolean: 'code-number',
	number: 'code-number',
	text: 'code-string',
	color: 'code-number',
	function: 'code-function',
	name: undefined,
	symbol: undefined,
	comment: 'code-comment',
	invalid: undefined
} satisfies Record<StretchKind, string | undefined>;

/** A part of the document, by the offsets of its two ends. */
interface DocumentRange {
	readonly from: number;
	readonly to: number;
}

/** A stretch of the document that takes a class of `styles/code.css`. */
export interface ColoredStretch extends DocumentRange {
	/** Its class. */
	readonly name: string;
}

/**
 * The stretches that take a color in the lines that the ranges touch, each line read whole, from
 * the start of the document to its end. The ranges are given in that order, as the editor gives
 * the ones it shows.
 */
export function coloredStretches(
	document: Text,
	ranges: readonly DocumentRange[]
): ColoredStretch[] {
	const colored: ColoredStretch[] = [];
	// Where the next line to read starts: two ranges may touch the same line, read once.
	let next = 0;
	for (const { from, to } of ranges) {
		next = Math.max(next, from);
		while (next <= to) {
			const line = document.lineAt(next);
			for (const stretch of classifyLine(line.text)) {
				const name = STRETCH_CLASSES[stretch.kind];
				if (name !== undefined) {
					colored.push({ from: line.from + stretch.from, to: line.from + stretch.to, name });
				}
			}
			next = line.to + 1;
		}
	}
	return colored;
}

/** One mark per class, made once: the editor compares the marks to keep what didn't change. */
const MARKS = new Map<string, Decoration>();

function markOf(name: string): Decoration {
	let mark = MARKS.get(name);
	if (!mark) {
		mark = Decoration.mark({ class: name });
		MARKS.set(name, mark);
	}
	return mark;
}

function colorsOf(view: EditorView): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();
	for (const { from, to, name } of coloredStretches(view.state.doc, view.visibleRanges)) {
		builder.add(from, to, markOf(name));
	}
	return builder.finish();
}

/** Gives the code its colors: those of the lines shown, read again when they change. */
export const codeColors = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;

		constructor(view: EditorView) {
			this.decorations = colorsOf(view);
		}

		update(update: ViewUpdate): void {
			if (update.docChanged || update.viewportChanged) {
				this.decorations = colorsOf(update.view);
			}
		}
	},
	{ decorations: (plugin) => plugin.decorations }
);
