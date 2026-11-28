// What the tests of the level screen share: what the screen gives its commands and its menus, and
// an editor that stands for the one on its page. Used by the tests alone.

import { type Edit, type Editing, EDITS } from '#lib/editor/edits.ts';
import type { CommandTarget, Side } from './level-commands.ts';
import type { ProgramControls, RunAction } from './program.ts';
import type { SpeedSetting } from './speeds.ts';

/** What an editor of the tests was asked: an edit, or a change of its breakpoints. */
export type EditorAsk = Edit | 'toggle-breakpoint' | 'remove-breakpoints' | 'settle-breakpoints';

/**
 * An editor that can do the given edits, holds the given breakpoints, and remembers what it was
 * asked.
 */
export function editorFor(
	able: readonly Edit[] = EDITS,
	breakpoints: readonly number[] = []
): Editing & { asked: EditorAsk[] } {
	const asked: EditorAsk[] = [];
	return {
		asked,
		can: (edit) => able.includes(edit),
		apply: (edit) => asked.push(edit),
		text: '',
		cursor: { line: 1, column: 1 },
		errors: 0,
		breakpoints,
		toggleBreakpoint: () => asked.push('toggle-breakpoint'),
		removeBreakpoints: () => asked.push('remove-breakpoints'),
		settleBreakpoints: () => asked.push('settle-breakpoints'),
		reopen: () => {},
		showPlace: () => {},
		focus: () => {}
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
 * to restore, and its program, if any. It counts the confirmations, the panels of the shortcuts
 * and the command menus it was asked to open, and lists the levels it was asked to open; the
 * menu can open while there is an editor, and no level beside it is open.
 */
export function screenWith(
	editing: () => Editing | undefined = () => undefined,
	restorable = false,
	program: () => ProgramControls | undefined = () => undefined
): CommandTarget & {
	confirmations: number;
	shortcutPanels: number;
	commandMenus: number;
	wentTo: Side[];
} {
	const screen = {
		confirmations: 0,
		shortcutPanels: 0,
		commandMenus: 0,
		wentTo: [] as Side[],
		canGoTo: () => false,
		goTo: (side: Side) => {
			screen.wentTo.push(side);
		},
		editing,
		canRestore: () => restorable,
		confirmRestore: () => {
			screen.confirmations += 1;
		},
		program,
		showShortcuts: () => {
			screen.shortcutPanels += 1;
		},
		canOpenCommands: () => editing() !== undefined,
		toggleCommands: () => {
			screen.commandMenus += 1;
		}
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
