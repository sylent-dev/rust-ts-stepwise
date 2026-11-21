import { describe, expect, it } from 'vitest';
import { canChoose, type MenuRow } from '#lib/shell/menus.ts';
import { LEVEL_COMMANDS, levelCommands } from './level-commands.ts';
import { levelMenus, type LevelScreenKind } from './level-menus.ts';
import { screenWith } from './test-support.ts';

/** The commands of a screen without an editor: none can run. */
const commands = levelCommands(screenWith(), 'other');

/** The name of a row in the code; `-` for the line between two groups. */
function nameOf(row: MenuRow): string {
	switch (row.kind) {
		case 'link':
		case 'here':
			return row.id;
		case 'command':
			return row.command.id;
		case 'separator':
			return '-';
	}
}

/** The row of a screen, by the name of its menu and its own in the code. */
function row(screen: LevelScreenKind, menu: string, name: string): MenuRow | undefined {
	return levelMenus(screen, commands)
		.find((candidate) => candidate.id === menu)
		?.rows.find((candidate) => nameOf(candidate) === name);
}

describe('levelMenus', () => {
	it('gives a level and the sandbox the same menus and the same rows, in the same order', () => {
		const names = (screen: LevelScreenKind) =>
			levelMenus(screen, commands).map((menu) => [menu.id, ...menu.rows.map(nameOf)]);
		expect(names('level')).toEqual([
			['level', 'all-levels', 'sandbox', '-', 'restore-starting-code'],
			['edit', 'undo', 'redo', '-', 'comment-lines', 'move-line-up', 'move-line-down'],
			['help', 'manual']
		]);
		expect(names('sandbox')).toEqual(names('level'));
	});

	it('leads from a level to the sandbox', () => {
		expect(row('level', 'level', 'sandbox')).toMatchObject({ to: 'sandbox' });
	});

	it('lights the row of the sandbox in the sandbox, where it can’t be chosen', () => {
		const sandbox = row('sandbox', 'level', 'sandbox');
		expect(sandbox).toMatchObject({ kind: 'here' });
		expect(sandbox && canChoose(sandbox)).toBe(false);
	});

	it('opens the manual in a tab of its own, the same from every screen', () => {
		const tab = (screen: LevelScreenKind) => {
			const manual = row(screen, 'help', 'manual');
			return manual?.kind === 'link' ? manual.tab : undefined;
		};
		expect(tab('level')).toBeTruthy();
		expect(tab('sandbox')).toBe(tab('level'));
	});

	it('gives every command of the screen one row, which runs the command that the shortcuts hear', () => {
		const rows = levelMenus('level', commands).flatMap((menu) =>
			menu.rows.flatMap((candidate) => (candidate.kind === 'command' ? [candidate.command] : []))
		);

		expect(rows.map(({ id }) => id).sort((a, b) => a.localeCompare(b))).toEqual(
			[...LEVEL_COMMANDS].sort((a, b) => a.localeCompare(b))
		);
		for (const command of rows) {
			expect(Object.values(commands)).toContain(command);
		}
	});
});
