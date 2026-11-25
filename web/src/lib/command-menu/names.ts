// The names of the program that the command menu lists under Your names (see Command menu in
// specs.md): those that a line written at the cursor may use, as the core gives them (`namesAt`),
// the functions first, then the variables, each in the order of the program, with what it is and
// the line where it is declared.

import type { EditorState, Text } from '@codemirror/state';
import { namesAt, type ProgramFunction, type ProgramVariable } from '#lib/core/core.ts';
import { t } from '#lib/i18n.ts';
import { callSnippet, type NameEntry } from './words.ts';

/** The names of the menu at the cursor. */
export interface MenuNames {
	readonly entries: readonly NameEntry[];
	/** The line of the syntax error above the cursor that hides them, when there is one. */
	readonly hiddenBy?: number;
}

/** The text of a line of `doc`, without its indentation nor the blanks at its end. */
function lineOf(doc: Text, line: number): string {
	return line >= 1 && line <= doc.lines ? doc.line(line).text.trim() : '';
}

/**
 * A function of the program, shown with its parameters (`paint_side(length)`) and inserted as a
 * built-in function is.
 */
function functionEntry({ name, parameters, defined }: ProgramFunction, doc: Text): NameEntry {
	return {
		kind: 'name',
		text: name,
		category: 'names',
		label: `${name}(${parameters.join(', ')})`,
		snippet: callSnippet(name, parameters.length > 0),
		about: t('commands-name-function', { line: defined.line }),
		declaration: lineOf(doc, defined.line)
	};
}

/** A variable of the program, or a parameter of the function that holds the cursor. */
function variableEntry({ name, declared, parameterOf }: ProgramVariable, doc: Text): NameEntry {
	const { line } = declared;
	return {
		kind: 'name',
		text: name,
		category: 'names',
		label: name,
		snippet: `${name}\${}`,
		about:
			parameterOf === undefined
				? t('commands-name-variable', { line })
				: t('commands-name-parameter', { function: parameterOf, line }),
		declaration: lineOf(doc, line)
	};
}

/**
 * The names that a line written at the cursor of `state` may use, as the menu lists them: the core
 * reads them in the text of the editor (`namesAt`), where the line of each declaration is read too.
 */
export function namesAtCursor(state: EditorState): MenuNames {
	const { doc } = state;
	const found = namesAt(doc.toString(), state.selection.main.head);
	if (found.kind === 'hidden') return { entries: [], hiddenBy: found.line };
	return {
		entries: [
			...found.functions.map((programFunction) => functionEntry(programFunction, doc)),
			...found.variables.map((variable) => variableEntry(variable, doc))
		]
	};
}
