// TRIAL, to remove before the pull request of step 16b: two behaviors of the editor that the
// owner decides by trying them, each behind a switch of `trial-switches.svelte`. What is kept
// moves into `setup.ts` and `typing.ts`, with its tests.

import { indentLess, indentMore } from '@codemirror/commands';
import { bracketMatching } from '@codemirror/language';
import type { Extension, StateCommand } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { INDENT_WIDTH } from './typing.ts';

export interface Trial {
	/** The parenthesis that matches the one at the cursor is lit. */
	matchPairs: boolean;
	/** Tab goes to the next stop of four, rather than writing four spaces whatever the column. */
	tabStops: boolean;
}

/** Tab as the specifications say it to the letter: four spaces, wherever the cursor is. */
const insertFourSpaces: StateCommand = ({ state, dispatch }) => {
	if (state.readOnly) return false;
	if (!state.selection.main.empty) return indentMore({ state, dispatch });
	dispatch(
		state.update(state.replaceSelection(' '.repeat(INDENT_WIDTH)), {
			scrollIntoView: true,
			userEvent: 'input'
		})
	);
	return true;
};

/** What the switches turn on: placed before the rest of the editor, so that its keys win. */
export function trialSetup(trial: Trial): Extension {
	return [
		trial.matchPairs ? bracketMatching({ brackets: '()' }) : [],
		trial.tabStops ? [] : keymap.of([{ key: 'Tab', run: insertFourSpaces, shift: indentLess }])
	];
}
