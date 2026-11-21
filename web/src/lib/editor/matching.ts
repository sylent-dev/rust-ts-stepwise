// The parenthesis that matches the one at the cursor, lit with it (see Code editor in
// specs.md), so that the learner reads which `)` closes which `(` in calls written one in
// another. The core says which parentheses are code: one in a text or in a comment is none
// (`print("Done :)")`). A statement never spans two lines, so a pair is looked for in the line
// of the cursor alone.

import { type EditorState, StateField } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView } from '@codemirror/view';
import { classifyLine } from '#lib/core/core.ts';

/**
 * The pair that the cursor touches in its line, by the places of its two parentheses: the pair
 * of the parenthesis just before the cursor, or else of the one just after. Nothing when the
 * cursor touches no parenthesis, or only ones that have no match.
 */
export function matchingPair(
	line: string,
	cursor: number
): readonly [opening: number, closing: number] | undefined {
	/** Each parenthesis that has a match, with the place of its match. */
	const matches = new Map<number, number>();
	/** The opening ones that wait for theirs, the last one first to be closed. */
	const waiting: number[] = [];
	for (const { kind, from, to } of classifyLine(line)) {
		if (kind !== 'symbol') continue;
		const sign = line.slice(from, to);
		if (sign === '(') {
			waiting.push(from);
		} else if (sign === ')') {
			const opening = waiting.pop();
			if (opening !== undefined) {
				matches.set(opening, from);
				matches.set(from, opening);
			}
		}
	}
	for (const at of [cursor - 1, cursor]) {
		const match = matches.get(at);
		if (match !== undefined) return [Math.min(at, match), Math.max(at, match)];
	}
	return undefined;
}

/** The mark of each parenthesis of the pair; its look is with the editor's. */
const MARK = Decoration.mark({ class: 'matching-parenthesis' });

/** The places in the document of the two parentheses to light, if any. */
export function litParentheses(state: EditorState): readonly number[] {
	const { main } = state.selection;
	if (!main.empty) return [];
	const line = state.doc.lineAt(main.head);
	const pair = matchingPair(line.text, main.head - line.from);
	return pair ? pair.map((at) => line.from + at) : [];
}

function marksOf(state: EditorState): DecorationSet {
	return Decoration.set(litParentheses(state).map((at) => MARK.range(at, at + 1)));
}

/** Lights the pair of parentheses that the cursor touches, as the cursor moves and the code changes. */
export const matchingParentheses = StateField.define<DecorationSet>({
	create: marksOf,
	update: (marks, transaction) =>
		transaction.docChanged || transaction.selection ? marksOf(transaction.state) : marks,
	provide: (field) => EditorView.decorations.from(field)
});
