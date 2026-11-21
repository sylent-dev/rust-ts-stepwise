// The commands of the level screen and of the sandbox (see Level screen and Code editor in
// specs.md): each one once, with its text, its shortcut, its state and what it runs. The rows of
// the menus (level-menus.ts) and the shortcuts of the screen read them here. A command arrives
// with the step that codes it: the edits of the editor first, then **Restore starting code**.

import { EDITS, type Edit, type Editing } from '#lib/editor/edits.ts';
import { t } from '#lib/i18n.ts';
import type { Platform } from '#lib/platform.ts';
import type { ScreenCommand, Shortcut } from '#lib/shell/commands.ts';

/** The names of the commands of the screen. */
export const LEVEL_COMMANDS = ['restore-starting-code', ...EDITS] as const;

/** A command of the level screen, by its name. */
export type LevelCommand = (typeof LEVEL_COMMANDS)[number];

/**
 * What the commands act on, which the screen gives them. Each is asked when a command runs or
 * says whether it can, so a command follows the level shown and its code as it changes.
 */
export interface CommandTarget {
	/** The editor shown; nothing while the screen has none, and its edits can't run then. */
	editing(): Editing | undefined;
	/** Whether the code shown has something to restore: it isn't the starting code. */
	canRestore(): boolean;
	/** Asks the learner to confirm, before the starting code takes the place of theirs. */
	confirmRestore(): void;
}

/** The commands of the screen, each under its name. */
export type LevelCommands = Readonly<Record<LevelCommand, ScreenCommand>>;

/** The name of the message that holds the text of a command: `command-undo`. */
export function commandMessage(command: LevelCommand): string {
	return `command-${command}`;
}

/** The keys of a command: the shortcut shown, and those that are heard without being shown. */
interface Keys {
	shortcut: Shortcut;
	alsoHeard?: readonly Shortcut[];
}

const CTRL_Y: Shortcut = { character: 'y', ctrl: true };
const CTRL_SHIFT_Z: Shortcut = { character: 'z', ctrl: true, shift: true };

/**
 * The keys of each edit, those of a code editor (see Code editor in specs.md). **Redo** is
 * Ctrl+Y, and Ctrl+Shift+Z for those who have the habit. On a computer of Apple it is
 * Cmd+Shift+Z alone: Cmd+Y opens the history of the browser there, and is left to it. Ctrl+: is
 * the one shortcut with a sign, the one of an AZERTY keyboard; Ctrl+/ is heard too.
 */
function editKeys(platform: Platform): Record<Edit, Keys> {
	return {
		undo: { shortcut: { character: 'z', ctrl: true } },
		redo:
			platform === 'mac'
				? { shortcut: CTRL_SHIFT_Z }
				: { shortcut: CTRL_Y, alsoHeard: [CTRL_SHIFT_Z] },
		'comment-lines': {
			shortcut: { character: ':', ctrl: true },
			alsoHeard: [{ character: '/', ctrl: true }]
		},
		'move-line-up': { shortcut: { key: 'ArrowUp', alt: true } },
		'move-line-down': { shortcut: { key: 'ArrowDown', alt: true } }
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
	return {
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
		'move-line-down': edit('move-line-down')
	};
}
