// The checks as the learner types (see Checks before running and Code editor in specs.md): the
// errors that the core finds, under a wave, and the lines longer than 80 characters, under dots,
// as advice; each says its sentences under the pointer. The core checks the text of the document
// of the editor, so its places are those of the editor (see Positions in
// docs/technical-choices.md).

import {
	type EditorState,
	type Extension,
	Facet,
	type Range,
	StateEffect,
	StateField,
	type Text
} from '@codemirror/state';
import {
	Decoration,
	type DecorationSet,
	EditorView,
	hoverTooltip,
	ViewPlugin,
	type ViewUpdate,
	WidgetType
} from '@codemirror/view';
import { check, type ProgramError } from '#lib/core/core.ts';
import { t } from '#lib/i18n.ts';

/** What the editor says of a stretch it underlines: one sentence in extra-bold, and maybe a rule. */
export interface Note {
	readonly title: string;
	readonly rule?: string;
}

/**
 * Writes the sentences of an error of the checks. The screen gives it, from the messages of the
 * errors, which the editor doesn't know.
 */
export type Explain = (error: ProgramError) => Note;

/** A stretch of the document that the editor underlines, and what it says there. */
export interface Underline {
	/** Its start, an offset of the document. */
	readonly from: number;
	/** Its end: `from` itself for a place between two characters, where something is missing. */
	readonly to: number;
	/** An error of the checks; or a line too long, as advice: the program still runs. */
	readonly kind: 'error' | 'long-line';
	readonly note: Note;
}

/** The longest line that reads well, in characters; the thin line of the editor stands after it. */
export const LINE_LENGTH = 80;

/**
 * The time that the checks wait after the last change, in milliseconds: a word being typed isn't
 * underlined at each key, and the underlines follow the code a moment after the learner stops.
 * Tuned by eye, as no motion of the design system is a wait.
 */
const CHECK_DELAY = 500;

/** The offset after the first `count` characters of a text, or nothing when it has no more. */
function offsetAfter(text: string, count: number): number | undefined {
	let offset = 0;
	let seen = 0;
	for (const character of text) {
		if (seen === count) return offset;
		seen += 1;
		offset += character.length;
	}
	return undefined;
}

/**
 * The lines longer than `LINE_LENGTH` characters, from their first character too many: counted as
 * the learner and the core count, an emoji or an accent being one character.
 */
function longLines(document: Text): Underline[] {
	const note: Note = { title: t('editor-long-line', { length: LINE_LENGTH }) };
	const found: Underline[] = [];
	for (let number = 1; number <= document.lines; number += 1) {
		const line = document.line(number);
		const start = offsetAfter(line.text, LINE_LENGTH);
		if (start !== undefined) {
			found.push({ from: line.from + start, to: line.to, kind: 'long-line', note });
		}
	}
	return found;
}

/** What the editor underlines in a document: the errors of the checks, then the lines too long. */
export function underlinesOf(document: Text, explain: Explain): Underline[] {
	const errors = check(document.toString()).map((error): Underline => ({
		from: error.span.from,
		to: error.span.to,
		kind: 'error',
		note: explain(error)
	}));
	return [...errors, ...longLines(document)];
}

/** The place of an error where something is missing: a wave one character wide, after it. */
class MissingMark extends WidgetType {
	override eq(): boolean {
		return true;
	}

	toDOM(): HTMLElement {
		const mark = document.createElement('span');
		mark.className = 'underline-missing';
		return mark;
	}
}

const MISSING = new MissingMark();

/**
 * What each underline drawn says, by its mark. A mark keeps its object when the editor moves it
 * with the text, so the note follows it until the next check.
 */
const NOTES = new WeakMap<Decoration, Note>();

function markOf({ from, to, kind, note }: Underline): Range<Decoration> {
	const mark =
		from === to
			? Decoration.widget({ widget: MISSING, side: 1 })
			: Decoration.mark({ class: kind === 'error' ? 'underline-error' : 'underline-long' });
	NOTES.set(mark, note);
	return mark.range(from, to);
}

/** The explanation that the screen gives the editor. */
const explainer = Facet.define<Explain, Explain | undefined>({
	combine: (values) => values[0]
});

/**
 * Asks the editor to check its code again at once, as it does by itself a moment after the last
 * change.
 */
export const checkAgain = StateEffect.define();

function underlinesIn(state: EditorState): DecorationSet {
	const explain = state.facet(explainer);
	if (!explain) return Decoration.none;
	return Decoration.set(underlinesOf(state.doc, explain).map(markOf), true);
}

/**
 * The underlines of the code: checked as soon as the editor opens, then moved with the text at
 * each change, and checked again when asked.
 */
const underlines = StateField.define<DecorationSet>({
	create: underlinesIn,
	update(drawn, transaction) {
		if (transaction.effects.some((effect) => effect.is(checkAgain))) {
			return underlinesIn(transaction.state);
		}
		return transaction.docChanged ? drawn.map(transaction.changes) : drawn;
	},
	provide: (field) => EditorView.decorations.from(field)
});

/** Checks the code again once it hasn't changed for `CHECK_DELAY`. */
const scheduler = ViewPlugin.fromClass(
	class {
		private timer: ReturnType<typeof setTimeout> | undefined;
		private readonly view: EditorView;

		constructor(view: EditorView) {
			this.view = view;
		}

		update(update: ViewUpdate): void {
			if (!update.docChanged) return;
			clearTimeout(this.timer);
			this.timer = setTimeout(() => {
				this.view.dispatch({ effects: checkAgain.of(null) });
			}, CHECK_DELAY);
		}

		destroy(): void {
			clearTimeout(this.timer);
		}
	}
);

/** What the underlines say at a place of the document, and the stretch they cover together. */
export interface NotesAt {
	readonly from: number;
	readonly to: number;
	readonly notes: readonly Note[];
}

/**
 * What the underlines under the pointer say: those whose stretch holds the place, on the side
 * of it where the pointer is (`side`, -1 before it, 1 after it), and the marks of what is
 * missing at the place itself.
 */
export function notesAt(state: EditorState, place: number, side: -1 | 1): NotesAt | undefined {
	const notes: Note[] = [];
	let from = place;
	let to = place;
	state.field(underlines).between(place, place, (start, end, mark) => {
		const holds =
			start === end
				? start === place
				: (start < place || (start === place && side > 0)) &&
					(end > place || (end === place && side < 0));
		const note = NOTES.get(mark);
		if (!holds || !note) return;
		notes.push(note);
		from = Math.min(from, start);
		to = Math.max(to, end);
	});
	return notes.length > 0 ? { from, to, notes } : undefined;
}

/** The tip of the underlines under the pointer: each note, its sentence in extra-bold first. */
function tipOf(notes: readonly Note[]): HTMLElement {
	const tip = document.createElement('div');
	tip.className = 'underline-tip';
	for (const { title, rule } of notes) {
		const note = document.createElement('p');
		const strong = document.createElement('strong');
		strong.textContent = title;
		note.append(strong);
		if (rule !== undefined) {
			const sentence = document.createElement('span');
			sentence.textContent = rule;
			note.append(sentence);
		}
		tip.append(note);
	}
	return tip;
}

/** Shows what the underlines say under the pointer, under the line; hidden at a change. */
const tips = hoverTooltip(
	(view, place, side) => {
		const found = notesAt(view.state, place, side);
		if (!found) return null;
		return {
			pos: found.from,
			end: found.to,
			above: false,
			create: () => ({ dom: tipOf(found.notes) })
		};
	},
	{ hideOnChange: true }
);

/**
 * The checks as the learner types: what the core finds wrong, and the lines too long, each
 * underlined with what it says under the pointer. `explain` writes the sentences of an error.
 */
export function checks(explain: Explain): Extension {
	return [explainer.of(explain), underlines, scheduler, tips];
}
