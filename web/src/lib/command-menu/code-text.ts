// The code in the texts of the command menu (see Code in a message in docs/design-system.md): a
// description, where code is written between backticks, shown in the font of the code; and an
// example, each line colored as the editor colors it, by what the core reads of it.

import { classifyLine } from '#lib/core/core.ts';
import { STRETCH_CLASSES } from '#lib/editor/code-colors.ts';

/** A piece of a sentence: code, or the text around it. */
export interface TextPiece {
	readonly text: string;
	readonly code: boolean;
}

/** The pieces of a sentence where code is written between backticks, in their order. */
export function textPieces(sentence: string): TextPiece[] {
	return sentence
		.split('`')
		.map((text, index) => ({ text, code: index % 2 === 1 }))
		.filter(({ text }) => text !== '');
}

/** A piece of a line of code, with the class of its color (`styles/code.css`) when it takes one. */
export interface CodePiece {
	readonly text: string;
	readonly color?: string;
}

/**
 * The pieces of a line of code, from left to right, the whole line: each stretch that the core
 * reads, with its color, and what lies between two of them, the spaces, without one.
 */
export function codePieces(line: string): CodePiece[] {
	const pieces: CodePiece[] = [];
	let at = 0;
	for (const { kind, from, to } of classifyLine(line)) {
		if (from > at) pieces.push({ text: line.slice(at, from) });
		const color = STRETCH_CLASSES[kind];
		const text = line.slice(from, to);
		pieces.push(color === undefined ? { text } : { text, color });
		at = to;
	}
	if (at < line.length) pieces.push({ text: line.slice(at) });
	return pieces;
}
