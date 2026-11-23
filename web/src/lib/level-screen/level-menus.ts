// The menus of the level screen and of the sandbox (see Level screen in specs.md). A row arrives
// with the step that codes its command, never greyed before it (see roadmap.md).

import { t } from '#lib/i18n.ts';
import type { Menu, MenuRow } from '#lib/shell/menus.ts';
import type { LevelCommand, LevelCommands } from './level-commands.ts';
import { speedChoices, type SpeedSetting } from './speeds.ts';

/**
 * The tab of the browser that shows the manual when a level opens it: always the same one, so
 * that the code and the map stay open in the tab of the level (see Manual in specs.md).
 */
const MANUAL_TAB = 'stepwise-manual';

/**
 * Which level screen it is: the one of a level, or the sandbox, the level screen without goal.
 * Not the stable name of the sandbox (`SANDBOX` in levels/levels.ts), which happens to read the
 * same.
 */
export type LevelScreenKind = 'level' | 'sandbox';

const SEPARATOR: MenuRow = { kind: 'separator' };

/**
 * The menus of the header of a level, or of the sandbox. A row that runs a command takes it
 * from the commands of the screen, which the shortcuts read too; **Speed** offers the speeds of
 * `speed`, the setting as the screen reads it and chooses it.
 */
export function levelMenus(
	screen: LevelScreenKind,
	commands: LevelCommands,
	speed: SpeedSetting
): Menu[] {
	const command = (name: LevelCommand): MenuRow => ({ kind: 'command', command: commands[name] });
	const sandbox: MenuRow =
		screen === 'sandbox'
			? { kind: 'here', id: 'sandbox', label: t('screen-sandbox') }
			: { kind: 'link', id: 'sandbox', label: t('screen-sandbox'), to: 'sandbox' };
	return [
		{
			id: 'level',
			name: t('menu-level'),
			rows: [
				{ kind: 'link', id: 'all-levels', label: t('screen-home'), to: '' },
				sandbox,
				SEPARATOR,
				command('restore-starting-code')
			]
		},
		{
			id: 'edit',
			name: t('menu-edit'),
			rows: [
				command('undo'),
				command('redo'),
				SEPARATOR,
				command('comment-lines'),
				command('move-line-up'),
				command('move-line-down')
			]
		},
		{
			id: 'run',
			name: t('menu-run'),
			rows: [
				command('run'),
				command('step'),
				command('reset'),
				SEPARATOR,
				{ kind: 'choices', id: 'speed', label: t('speed-name'), choices: speedChoices(speed) }
			]
		},
		{
			id: 'help',
			name: t('menu-help'),
			rows: [
				{
					kind: 'link',
					id: 'manual',
					label: t('screen-manual'),
					to: 'manual',
					tab: MANUAL_TAB
				},
				SEPARATOR,
				command('keyboard-shortcuts')
			]
		}
	];
}
