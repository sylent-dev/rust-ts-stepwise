// TRIAL, to remove before the pull request of step 16b: a behavior of the editor that the owner
// decides by trying it, behind a switch of `trial-switches.svelte`. What is kept moves into
// `typing.ts`, with its tests.

import { indentLess, indentMore } from '@codemirror/commands';
import type { Extension, StateCommand } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { INDENT_WIDTH } from './typing.ts';

export interface Trial {
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
		trial.tabStops ? [] : keymap.of([{ key: 'Tab', run: insertFourSpaces, shift: indentLess }])
	];
}
