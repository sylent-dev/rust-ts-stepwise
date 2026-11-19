import { describe, expect, it } from 'vitest';
import { levelMenus, type LevelScreenKind } from './level-menus.ts';
import { canChoose, type MenuRow } from './shell/menus.ts';

/** The row of a screen, by the name of its menu and its own in the code. */
function row(screen: LevelScreenKind, menu: string, id: string): MenuRow | undefined {
	return levelMenus(screen)
		.find((candidate) => candidate.id === menu)
		?.rows.find((candidate) => candidate.id === id);
}

describe('levelMenus', () => {
	it('gives a level and the sandbox the same menus and the same rows, in the same order', () => {
		const names = (screen: LevelScreenKind) =>
			levelMenus(screen).map((menu) => [menu.id, ...menu.rows.map(({ id }) => id)]);
		expect(names('level')).toEqual([
			['level', 'all-levels', 'sandbox'],
			['help', 'manual']
		]);
		expect(names('sandbox')).toEqual(names('level'));
	});

	it('leads from a level to the sandbox', () => {
		expect(row('level', 'level', 'sandbox')).toMatchObject({ to: 'sandbox' });
	});

	it('lights the row of the sandbox in the sandbox, where it can’t be chosen', () => {
		const sandbox = row('sandbox', 'level', 'sandbox');
		expect(sandbox).toMatchObject({ here: true });
		expect(sandbox && canChoose(sandbox)).toBe(false);
	});

	it('opens the manual in a tab of its own, the same from every screen', () => {
		const tab = (screen: LevelScreenKind) => {
			const manual = row(screen, 'help', 'manual');
			return manual && canChoose(manual) ? manual.tab : undefined;
		};
		expect(tab('level')).toBeTruthy();
		expect(tab('sandbox')).toBe(tab('level'));
	});
});
