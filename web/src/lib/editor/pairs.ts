// The signs that close by themselves (see Code editor in specs.md): `(` is typed with its `)`
// and `"` with the quote that closes its text, as in a code editor. Typing the closing sign
// passes over the one that is there, and Backspace between the two takes both.
//
// CodeMirror does it (`closeBrackets`), and guesses where a text starts from the characters
// around the cursor, since it reads no grammar of our language: a quote typed at the end of a
// text that has lost its own would come with one too many. The core knows what a line is made
// of, so the editor asks it first: inside a text or a comment, nothing closes by itself.

import { closeBrackets, closeBracketsKeymap, insertBracket } from '@codemirror/autocomplete';
import {
	EditorSelection,
	EditorState,
	type Extension,
	Prec,
	type Transaction,
	type TransactionSpec
} from '@codemirror/state';
import { EditorView, type KeyBinding } from '@codemirror/view';
import { classifyLine } from '#lib/core/core.ts';

/** The signs that are typed with the one that closes them. */
const OPENING_SIGNS = ['(', '"'];

/**
 * What the cursor is in, from the start of its line up to it: a text that isn't closed yet, a
 * comment, or neither. The core is asked what a letter typed there would belong to, so the rules
 * of a text (its quotes, its escapes) stay its own.
 */
export function insideTextOrComment(before: string): 'text' | 'comment' | undefined {
	const typed = `${before}a`;
	const last = classifyLine(typed).at(-1);
	if (last?.to !== typed.length) return undefined;
	return last.kind === 'text' || last.kind === 'comment' ? last.kind : undefined;
}

/**
 * What typing a sign does inside a text or a comment, where nothing closes by itself: the sign
 * is written alone, and the quote that ends a text passes over the one that is there. Nothing
 * for any other character, on a selection, or anywhere else in the code, which is left to
 * CodeMirror.
 */
function typedInTextOrComment(state: EditorState, typed: string): TransactionSpec | undefined {
	const { main } = state.selection;
	if (!main.empty || !OPENING_SIGNS.includes(typed)) return undefined;
	const line = state.doc.lineAt(main.head);
	const inside = insideTextOrComment(line.text.slice(0, main.head - line.from));
	if (inside === undefined) return undefined;
	const endsItsText =
		inside === 'text' && typed === '"' && state.sliceDoc(main.head, main.head + 1) === '"';
	return endsItsText
		? { selection: EditorSelection.cursor(main.head + 1), scrollIntoView: true }
		: { ...state.replaceSelection(typed), scrollIntoView: true, userEvent: 'input.type' };
}

/**
 * What typing a sign does when the editor doesn't simply write it: the answer of the core
 * first, then the one of CodeMirror (a sign with the one that closes it, a closing sign passed
 * over, a selection put between two signs). Nothing when the sign is written as it is.
 */
export function typedSign(state: EditorState, typed: string): Transaction | undefined {
	const inside = typedInTextOrComment(state, typed);
	return inside ? state.update(inside) : (insertBracket(state, typed) ?? undefined);
}

/**
 * Decides what a sign typed at the cursor does, before CodeMirror would. As CodeMirror does, it
 * leaves alone a text being composed and what isn't typed at the cursor.
 */
const closeSigns = EditorView.inputHandler.of((view, from, to, text) => {
	const { main } = view.state.selection;
	if (view.compositionStarted || view.state.readOnly) return false;
	if (from !== main.from || to !== main.to) return false;
	const transaction = typedSign(view.state, text);
	if (!transaction) return false;
	view.dispatch(transaction);
	return true;
});

/** Backspace between a sign and the one that closes it takes both: before the other keys. */
export const pairKeys: readonly KeyBinding[] = closeBracketsKeymap;

/**
 * The signs that close by themselves. CodeMirror keeps which closing signs it wrote
 * (`closeBrackets`), so that only those are passed over.
 */
export const pairs: Extension = [
	Prec.high(closeSigns),
	closeBrackets(),
	EditorState.languageData.of(() => [{ closeBrackets: { brackets: OPENING_SIGNS } }])
];
