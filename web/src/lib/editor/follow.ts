// Where a line or a place of the code goes as the code changes (see Running a program in
// specs.md): the line of a run that the editor shows (run-lines.ts), and the place of each error
// that the console lists, which the editor says with each change (`codeChange` of edits.ts). Both
// follow the text that they stand on, so that the console and the margin never part.

import type { ChangeSet, Line, Text, Transaction } from '@codemirror/state';

/** A change of the code, with the code before it and after it. */
export interface Changed {
	readonly changes: ChangeSet;
	readonly before: Text;
	readonly after: Text;
}

/** The change that a transaction makes. */
export function changedBy(transaction: Transaction): Changed {
	return {
		changes: transaction.changes,
		before: transaction.startState.doc,
		after: transaction.newDoc
	};
}

/**
 * Where a line stands once the code has changed: on the line that holds its text now, lines
 * added or taken away above it, and a line break typed before its text, which carries its text
 * down. Nothing once the line itself is gone: its text and one of its breaks deleted, which
 * Backspace at its start does to an empty line, unless the same change writes it again
 * elsewhere, as a line moved over it does. A line joined to the one above it keeps its text
 * there, and the mark follows it.
 */
export function followLine(changed: Changed, number: number): number | undefined {
	const { before, after, changes } = changed;
	if (number < 1 || number > before.lines) return undefined;
	const line = before.line(number);
	if (deletes(changed, line)) return writtenAgain(changed, line.text);
	// The first character of its text, and after what is written there: Enter in the spaces that
	// start a line replaces them with a break and the same spaces (`insertNewLine`), a change
	// that starts at the start of the line, where a place stays whatever its side.
	const text = line.to - line.text.trimStart().length;
	return after.lineAt(changes.mapPos(text, 1)).number;
}

/**
 * Where a place of the code stands once the code has changed, as its line does (`followLine`):
 * on its character, text written just before it carrying it along, and with its line when the
 * change writes that line again elsewhere, as a line moved over it, at the same column. Once its
 * text is gone, where that text was. A place past the end of the code is its end.
 */
export function followPlace(changed: Changed, at: number): number {
	const { before, after, changes } = changed;
	const place = Math.min(Math.max(at, 0), before.length);
	const line = before.lineAt(place);
	const again = deletes(changed, line) ? writtenAgain(changed, line.text) : undefined;
	if (again === undefined) return changes.mapPos(place, 1);
	const moved = after.line(again);
	return Math.min(moved.from + place - line.from, moved.to);
}

/**
 * Whether a change deletes a line: its text and one of its breaks, which Backspace at its start
 * does to an empty line. The first line and the last one have a break on one side alone.
 */
function deletes({ before, changes }: Changed, line: Line): boolean {
	let gone = false;
	changes.iterChangedRanges((from, to) => {
		gone ||=
			(line.number > 1 && from <= line.from - 1 && to >= line.to) ||
			(line.number < before.lines && from <= line.from && to >= line.to + 1);
	});
	return gone;
}

/**
 * The line where a change writes the text of a line again, with its break: **Move line up**
 * and **Move line down** delete the line that the lines moved pass over, and write it on their
 * other side (`moveLineUp`, `moveLineDown` of CodeMirror), as their undo does. Nothing when the
 * change doesn't write it again, nor for a line without text: any line break written by the
 * change would pass for it, and a mark on another line would be worse than none.
 */
function writtenAgain({ after, changes }: Changed, text: string): number | undefined {
	if (text.trim() === '') return undefined;
	const written: number[] = [];
	changes.iterChanges((_fromA, _toA, fromB, toB, inserted) => {
		const insert = inserted.toString();
		if (insert === `${text}\n`) written.push(after.lineAt(fromB).number);
		else if (insert === `\n${text}`) written.push(after.lineAt(toB).number);
	});
	return written[0];
}
