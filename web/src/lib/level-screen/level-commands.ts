// The commands of the level screen and of the sandbox (see Level screen, Code editor and Running
// a program in specs.md): each one once, with its text, its shortcut, its state and what it
// runs. The rows of the menus (level-menus.ts) and the shortcuts of the screen read them here. A
// command arrives with the step that codes it: the edits of the editor first, then **Restore
// starting code**, then the three of the program, then **Keyboard shortcuts**, then the two of
// the breakpoints, then **Commands**, then **Previous level** and **Next level**.

import { EDITS, type Edit, type Editing } from '#lib/editor/edits.ts';
import { t } from '#lib/i18n.ts';
import type { Platform } from '#lib/platform.ts';
import type { ScreenCommand, Shortcut } from '#lib/shell/commands.ts';
import type { ProgramControls, RunAction } from './program.ts';

/**
 * The names of the commands of the screen. `run` is **Run**, **Pause** and **Resume**: one
 * command, which does what the program allows now.
 */
export const LEVEL_COMMANDS = [
	'previous-level',
	'next-level',
	'restore-starting-code',
	...EDITS,
	'commands',
	'toggle-breakpoint',
	'remove-all-breakpoints',
	'run',
	'step',
	'reset',
	'keyboard-shortcuts'
] as const;

/** A command of the level screen, by its name. */
export type LevelCommand = (typeof LEVEL_COMMANDS)[number];

/**
 * What names a command: its own name, and for `run` what it does now. Each has its message
 * (`commandMessage`).
 */
export const COMMAND_TEXTS = [...LEVEL_COMMANDS, 'pause', 'resume'] as const satisfies readonly (
	LevelCommand | RunAction
)[];

/** What names a command. */
export type CommandText = (typeof COMMAND_TEXTS)[number];

/** A level beside the one shown: the one before it, or the one after it. */
export type Side = 'previous' | 'next';

/**
 * What the commands act on, which the screen gives them. Each is asked when a command runs or
 * says whether it can, so a command follows the level shown and its code as it changes.
 */
export interface CommandTarget {
	/**
	 * Whether the level on `side` of the one shown is open: none in the sandbox, nor before the
	 * first level and after the last one.
	 */
	canGoTo(side: Side): boolean;
	/** Opens the level on `side` of the one shown. */
	goTo(side: Side): void;
	/** The editor shown; nothing while the screen has none, and its edits can't run then. */
	editing(): Editing | undefined;
	/** Whether the code shown has something to restore: it isn't the starting code. */
	canRestore(): boolean;
	/** Asks the learner to confirm, before the starting code takes the place of theirs. */
	confirmRestore(): void;
	/** The program of the screen; nothing until the core has given the map. */
	program(): ProgramControls | undefined;
	/** Opens the panel of the keyboard shortcuts. */
	showShortcuts(): void;
	/** Whether the command menu can open: there is an editor, and its code can be changed. */
	canOpenCommands(): boolean;
	/** Opens the command menu at the cursor of the code, or closes it when it is open. */
	toggleCommands(): void;
}

/** The commands of the screen, each under its name. */
export type LevelCommands = Readonly<Record<LevelCommand, ScreenCommand>>;

/** The name of the message that holds a text of a command: `command-undo`, `command-pause`. */
export function commandMessage(text: CommandText): string {
	return `command-${text}`;
}

/**
 * The keys of a command: the shortcut shown, those that are heard without being shown, and
 * whether the shortcut held down runs the command again.
 */
type Keys = Pick<ScreenCommand, 'alsoHeard' | 'repeats'> & { shortcut: Shortcut };

const CTRL_Y: Shortcut = { character: 'y', ctrl: true };
const CTRL_SHIFT_Z: Shortcut = { character: 'z', ctrl: true, shift: true };

/**
 * The keys of each edit, those of a code editor (see Code editor in specs.md). **Redo** is
 * Ctrl+Y, and Ctrl+Shift+Z for those who have the habit. On a computer of Apple it is
 * Cmd+Shift+Z alone: Cmd+Y opens the history of the browser there, and is left to it. Ctrl+: is
 * the one shortcut with a sign, the one of an AZERTY keyboard; Ctrl+/ is heard too. Held down,
 * a key undoes, redoes or moves a line again and again, as in a code editor; a comment set and
 * taken away at each repeat would only flicker.
 */
function editKeys(platform: Platform): Record<Edit, Keys> {
	return {
		undo: { shortcut: { character: 'z', ctrl: true }, repeats: true },
		redo:
			platform === 'mac'
				? { shortcut: CTRL_SHIFT_Z, repeats: true }
				: { shortcut: CTRL_Y, alsoHeard: [CTRL_SHIFT_Z], repeats: true },
		'comment-lines': {
			shortcut: { character: ':', ctrl: true },
			alsoHeard: [{ character: '/', ctrl: true }]
		},
		'move-line-up': { shortcut: { key: 'ArrowUp', alt: true }, repeats: true },
		'move-line-down': { shortcut: { key: 'ArrowDown', alt: true }, repeats: true }
	};
}

/** The commands of the screen, on what it gives them. */
export function levelCommands(target: CommandTarget, platform: Platform): LevelCommands {
	const keys = editKeys(platform);
	const edit = (name: Edit): ScreenCommand => ({
		id: name,
		label: t(commandMessage(name)),
		...keys[name],
		get enabled() {
			return target.editing()?.can(name) ?? false;
		},
		run() {
			target.editing()?.apply(name);
		}
	});
	const goTo = (side: Side): ScreenCommand => ({
		id: `${side}-level`,
		label: t(commandMessage(`${side}-level`)),
		get enabled() {
			return target.canGoTo(side);
		},
		run() {
			target.goTo(side);
		}
	});
	return {
		// Only in the menu, without a shortcut, so that a click or a key pressed by mistake never
		// changes the level (see Level screen in specs.md); greyed while the level they lead to is
		// locked.
		'previous-level': goTo('previous'),
		'next-level': goTo('next'),
		// It asks before it acts, so it has no shortcut: a key pressed by mistake would open the
		// confirmation for nothing.
		'restore-starting-code': {
			id: 'restore-starting-code',
			label: t(commandMessage('restore-starting-code')),
			get enabled() {
				return target.canRestore();
			},
			run() {
				target.confirmRestore();
			}
		},
		undo: edit('undo'),
		redo: edit('redo'),
		'comment-lines': edit('comment-lines'),
		'move-line-up': edit('move-line-up'),
		'move-line-down': edit('move-line-down'),
		// Ctrl+Space, as in a code editor, with the key Ctrl itself on a computer of Apple too, where
		// Cmd+Space opens Spotlight (see Command menu in specs.md). Held down, it opens the menu
		// once; pressed again, it closes it. Greyed while the code is locked, since the menu writes
		// in the code.
		commands: {
			id: 'commands',
			label: t(commandMessage('commands')),
			shortcut: { character: ' ', ctrl: 'control' },
			get enabled() {
				return target.canOpenCommands();
			},
			run() {
				target.toggleCommands();
			}
		},
		// The breakpoints change no text: they can be set and removed while the code is locked
		// too (see Code editor in specs.md). F9 is the key of the code editors; held down, it
		// sets and removes a breakpoint once.
		'toggle-breakpoint': {
			id: 'toggle-breakpoint',
			label: t(commandMessage('toggle-breakpoint')),
			shortcut: { key: 'F9' },
			get enabled() {
				return target.editing() !== undefined;
			},
			run() {
				target.editing()?.toggleBreakpoint();
			}
		},
		// No shortcut, as in specs.md: few to learn, and a key pressed by mistake would take away
		// what the learner set line by line.
		'remove-all-breakpoints': {
			id: 'remove-all-breakpoints',
			label: t(commandMessage('remove-all-breakpoints')),
			get enabled() {
				return (target.editing()?.breakpoints.length ?? 0) > 0;
			},
			run() {
				target.editing()?.removeBreakpoints();
			}
		},
		// The three of the program (see Running a program in specs.md). None is run again by a
		// key held down: the program would start and pause many times a second, and each step is
		// there to be looked at.
		run: {
			id: 'run',
			get label() {
				const action = target.program()?.action ?? 'run';
				return t(commandMessage(action));
			},
			shortcut: { key: 'Enter', ctrl: true },
			get enabled() {
				return target.program() !== undefined;
			},
			run() {
				target.program()?.runOrPause();
			}
		},
		step: {
			id: 'step',
			label: t(commandMessage('step')),
			shortcut: { key: 'F10' },
			get enabled() {
				return target.program()?.canStep ?? false;
			},
			run() {
				target.program()?.step();
			}
		},
		// Never greyed, as in the mock-up: at rest it changes nothing, and says so by doing it.
		reset: {
			id: 'reset',
			label: t(commandMessage('reset')),
			shortcut: { key: 'Enter', ctrl: true, shift: true },
			get enabled() {
				return target.program() !== undefined;
			},
			run() {
				target.program()?.reset();
			}
		},
		// No shortcut, as the other commands of the menu **Help**: few shortcuts to learn.
		'keyboard-shortcuts': {
			id: 'keyboard-shortcuts',
			label: t(commandMessage('keyboard-shortcuts')),
			enabled: true,
			run() {
				target.showShortcuts();
			}
		}
	};
}
