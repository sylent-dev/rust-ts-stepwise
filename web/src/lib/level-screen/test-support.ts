// What the tests of the level screen share: what the screen gives its commands and its menus, and
// an editor that stands for the one on its page. Used by the tests alone.

import { type Edit, type Editing, EDITS } from '#lib/editor/edits.ts';
import type { CommandTarget } from './level-commands.ts';
import type { ProgramControls, RunAction } from './program.ts';
import type { SpeedSetting } from './speeds.ts';

/** An editor that can do the given edits, and remembers the ones it was asked. */
export function editorFor(able: readonly Edit[] = EDITS): Editing & { asked: Edit[] } {
	const asked: Edit[] = [];
	return {
		asked,
		can: (edit) => able.includes(edit),
		apply: (edit) => asked.push(edit),
		text: '',
		cursor: { line: 1, column: 1 },
		errors: 0,
		reopen: () => {}
	};
}

/**
 * A program that stands where a test puts it (`action`, `canStep`), and remembers what it was
 * asked.
 */
export function programFor(
	action: RunAction = 'run',
	canStep = true
): ProgramControls & { action: RunAction; canStep: boolean; asked: string[] } {
	const asked: string[] = [];
	return {
		asked,
		action,
		canStep,
		runOrPause: () => asked.push('runOrPause'),
		step: () => asked.push('step'),
		reset: () => asked.push('reset')
	};
}

/**
 * What a screen gives its commands: the editor shown, if any, whether its code has something
 * to restore, and its program, if any. It counts the confirmations it was asked to open.
 */
export function screenWith(
	editing: () => Editing | undefined = () => undefined,
	restorable = false,
	program: () => ProgramControls | undefined = () => undefined
): CommandTarget & { confirmations: number } {
	const screen = {
		confirmations: 0,
		editing,
		canRestore: () => restorable,
		confirmRestore: () => {
			screen.confirmations += 1;
		},
		program
	};
	return screen;
}

/** A speed that stands for the setting: it starts at `speed`, and keeps the one chosen. */
export function speedAt(speed: number): SpeedSetting & { current: number } {
	const setting = {
		current: speed,
		choose: (chosen: number) => {
			setting.current = chosen;
		}
	};
	return setting;
}
