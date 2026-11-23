// The panel of the keyboard shortcuts of a screen (see Level screen in specs.md): what it lists,
// in groups under their titles, the groups in columns. The screen makes its groups from its
// commands (`commandRow`) and from the keys of its blocks that are no command, as Tab in the
// code; the panel (shortcuts-panel.svelte) draws them.

import type { ScreenCommand, Shortcut } from './commands.ts';

/** A row of the panel: what the keys do, then the keys. */
export interface ShortcutRow {
	/** Its name in the code: the one of its command, or of what the keys do (`indent-lines`). */
	id: string;
	/** What the keys do, as the row of a menu names a command. */
	label: string;
	/**
	 * The keys: a shortcut, or keys pressed one after the other, written as a sentence
	 * (`Esc, then Tab`).
	 */
	keys: Shortcut | string;
}

/** A group of rows under its title, on a gray band: **Run**, **Edit**. */
export interface ShortcutGroup {
	/** Its name in the code: `run`. */
	id: string;
	title: string;
	rows: readonly ShortcutRow[];
}

/** The columns of the panel, from the left, each with its groups from the top. */
export type ShortcutColumns = readonly (readonly ShortcutGroup[])[];

/**
 * The row of a command, with its own text, or another one when its text follows the state of
 * the screen (**Run**, which is also **Pause** and **Resume**). A command without a shortcut has
 * no row.
 */
export function commandRow(command: ScreenCommand, label = command.label): ShortcutRow[] {
	return command.shortcut ? [{ id: command.id, label, keys: command.shortcut }] : [];
}
