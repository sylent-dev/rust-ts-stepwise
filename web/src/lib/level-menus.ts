// The menus of the level screen and of the sandbox (see Level screen in specs.md). A row arrives
// with the step that codes its command, never greyed before it (see roadmap.md).

import { t } from '#lib/i18n.ts';
import type { Menu, MenuRow } from '#lib/shell/menus.ts';

/**
 * The tab of the browser that shows the manual when a level opens it: always the same one, so
 * that the code and the map stay open in the tab of the level (see Manual in specs.md).
 */
const MANUAL_TAB = 'stepwise-manual';

/** The menus of the header of a level, or of the sandbox, the level screen without goal. */
export function levelMenus(screen: 'level' | 'sandbox'): Menu[] {
	const sandbox: MenuRow =
		screen === 'sandbox'
			? { id: 'sandbox', label: t('sandbox'), here: true }
			: { id: 'sandbox', label: t('sandbox'), to: 'sandbox' };
	return [
		{
			id: 'level',
			name: t('menu-level'),
			rows: [{ id: 'all-levels', label: t('all-levels'), to: '' }, sandbox]
		},
		{
			id: 'help',
			name: t('menu-help'),
			rows: [{ id: 'manual', label: t('manual'), to: 'manual', tab: MANUAL_TAB }]
		}
	];
}
