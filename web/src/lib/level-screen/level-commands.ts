// The commands of the level screen and of the sandbox (see Level screen and Code editor in
// specs.md): each one once, with its text, its shortcut, its state and what it runs. The rows of
// the menus (level-menus.ts) and the shortcuts of the screen read them here. A command arrives
// with the step that codes it: the edits of the editor first.

import { EDITS, type Edit, type Editing } from '#lib/editor/edits.ts';
import { t } from '#lib/i18n.ts';
import type { Platform } from '#lib/platform.ts';
import type { ScreenCommand, Shortcut } from '#lib/shell/commands.ts';

/** The names of the commands of the screen. */
export const LEVEL_COMMANDS = EDITS;

/** A command of the level screen, by its name. */
export type LevelCommand = Edit;

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
 * The keys of each edit, those of a code editor (see Code editor in specs.md). Both shortcuts
 * of **Redo** work everywhere, and the one shown is the habit of the computer: Cmd+Shift+Z on
 * one of Apple, where Cmd+Y opens the history of the browser. Ctrl+: is the one shortcut with a
 * sign, the one of an AZERTY keyboard; Ctrl+/ is heard for those who have the habit.
 */
function editKeys(platform: Platform): Record<Edit, Keys> {
	return {
		undo: { shortcut: { character: 'z', ctrl: true } },
		redo:
			platform === 'mac'
				? { shortcut: CTRL_SHIFT_Z, alsoHeard: [CTRL_Y] }
				: { shortcut: CTRL_Y, alsoHeard: [CTRL_SHIFT_Z] },
		'comment-lines': {
			shortcut: { character: ':', ctrl: true },
			alsoHeard: [{ character: '/', ctrl: true }]
		},
		'move-line-up': { shortcut: { key: 'ArrowUp', alt: true } },
		'move-line-down': { shortcut: { key: 'ArrowDown', alt: true } }
	};
}

/**
 * The commands of the screen. `editing` gives the editor shown, or nothing while the screen has
 * none: its commands can't run then. It is asked each time, so a command follows the editor of
 * the level shown and the code as it changes.
 */
export function levelCommands(
	editing: () => Editing | undefined,
	platform: Platform
): LevelCommands {
	const keys = editKeys(platform);
	const edit = (name: Edit): ScreenCommand => ({
		id: name,
		label: t(commandMessage(name)),
		...keys[name],
		get enabled() {
			return editing()?.can(name) ?? false;
		},
		run() {
			editing()?.apply(name);
		}
	});
	return {
		undo: edit('undo'),
		redo: edit('redo'),
		'comment-lines': edit('comment-lines'),
		'move-line-up': edit('move-line-up'),
		'move-line-down': edit('move-line-down')
	};
}
