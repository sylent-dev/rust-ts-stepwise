import { describe, expect, it } from 'vitest';
import { NORMAL_SPEED, SPEEDS } from '#lib/run/pace.ts';
import { canChoose, type MenuRow } from '#lib/shell/menus.ts';
import { LEVEL_COMMANDS, levelCommands } from './level-commands.ts';
import { levelMenus, type LevelScreenKind } from './level-menus.ts';
import { screenWith, speedAt } from './test-support.ts';

/** The commands of a screen without an editor: none can run. */
const commands = levelCommands(screenWith(), 'other');

/** The speed of a first visit. */
const speed = speedAt(NORMAL_SPEED);

/** The name of a row in the code; `-` for the line between two groups. */
function nameOf(row: MenuRow): string {
	switch (row.kind) {
		case 'link':
		case 'here':
		case 'choices':
			return row.id;
		case 'command':
			return row.command.id;
		case 'separator':
			return '-';
	}
}

/** The row of a screen, by the name of its menu and its own in the code. */
function row(screen: LevelScreenKind, menu: string, name: string): MenuRow | undefined {
	return levelMenus(screen, commands, speed)
		.find((candidate) => candidate.id === menu)
		?.rows.find((candidate) => nameOf(candidate) === name);
}

describe('levelMenus', () => {
	it('gives a level and the sandbox the same menus and the same rows, in the same order', () => {
		const names = (screen: LevelScreenKind) =>
			levelMenus(screen, commands, speed).map((menu) => [menu.id, ...menu.rows.map(nameOf)]);
		expect(names('level')).toEqual([
			['level', 'all-levels', 'sandbox', '-', 'restore-starting-code'],
			[
				'edit',
				'undo',
				'redo',
				'-',
				'comment-lines',
				'move-line-up',
				'move-line-down',
				'-',
				'toggle-breakpoint',
				'remove-all-breakpoints'
			],
			['run', 'run', 'step', 'reset', '-', 'speed'],
			['help', 'manual', '-', 'keyboard-shortcuts']
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
		const rows = levelMenus('level', commands, speed).flatMap((menu) =>
			menu.rows.flatMap((candidate) => (candidate.kind === 'command' ? [candidate.command] : []))
		);

		expect(rows.map(({ id }) => id).sort((a, b) => a.localeCompare(b))).toEqual(
			[...LEVEL_COMMANDS].sort((a, b) => a.localeCompare(b))
		);
		for (const command of rows) {
			expect(Object.values(commands)).toContain(command);
		}
	});

	it('offers every speed beside the row Speed, which no state of the program greys', () => {
		const offered = row('level', 'run', 'speed');
		expect(offered && canChoose(offered)).toBe(true);
		expect(offered?.kind === 'choices' ? offered.choices : []).toHaveLength(SPEEDS.length);
	});

	it('chooses the speed of the screen, and marks the one in use', () => {
		const setting = speedAt(NORMAL_SPEED);
		const offered = levelMenus('sandbox', commands, setting)
			.find((menu) => menu.id === 'run')
			?.rows.find((candidate) => candidate.kind === 'choices');
		const choices = offered?.choices ?? [];

		expect(choices.filter(({ chosen }) => chosen).map(({ id }) => id)).toEqual(['speed-2']);
		choices.at(-1)?.choose();
		expect(setting.current).toBe(Infinity);
		expect(choices.filter(({ chosen }) => chosen).map(({ id }) => id)).toEqual(['speed-instant']);
	});
});
