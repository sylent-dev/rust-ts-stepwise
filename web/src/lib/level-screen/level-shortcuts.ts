// The panel of the keyboard shortcuts of the level screen and of the sandbox (see Level screen
// in specs.md): the shortcuts of its commands, grouped under **Run** and **Edit**, with the keys
// of the code that are no command. A row arrives with the step that makes its keys work, as a
// row of a menu does: **Commands** at step 20, the group **Manual** at step 22.

import { t } from '#lib/i18n.ts';
import { commandRow, type ShortcutColumns } from '#lib/shell/shortcuts.ts';
import type { LevelCommands } from './level-commands.ts';

/**
 * The groups of the panel, **Run** on the left, **Edit** on the right, as in the mock-up. Each
 * row of a command says its text, as its row of a menu does; **Run**, whose text follows the
 * program, says the three. Tab and Shift+Tab indent and unindent the lines (`editor/typing.ts`),
 * and Escape, then Tab, leaves the code, as CodeMirror lets it while no key of the editor takes
 * Escape: keys of the editor, which the screen doesn't hear.
 */
export function levelShortcuts(commands: LevelCommands): ShortcutColumns {
	return [
		[
			{
				id: 'run',
				title: t('shortcuts-group-run'),
				rows: [
					...commandRow(commands.run, t('shortcuts-run')),
					...commandRow(commands.step),
					...commandRow(commands.reset),
					...commandRow(commands['toggle-breakpoint'])
				]
			}
		],
		[
			{
				id: 'edit',
				title: t('shortcuts-group-edit'),
				rows: [
					...commandRow(commands.undo),
					...commandRow(commands.redo),
					{ id: 'indent-lines', label: t('shortcuts-indent-lines'), keys: { key: 'Tab' } },
					{
						id: 'unindent-lines',
						label: t('shortcuts-unindent-lines'),
						keys: { key: 'Tab', shift: true }
					},
					...commandRow(commands['comment-lines']),
					...commandRow(commands['move-line-up']),
					...commandRow(commands['move-line-down']),
					...commandRow(commands.commands),
					{
						id: 'leave-editor',
						label: t('shortcuts-leave-editor'),
						keys: t('shortcuts-leave-editor-keys')
					}
				]
			}
		]
	];
}
