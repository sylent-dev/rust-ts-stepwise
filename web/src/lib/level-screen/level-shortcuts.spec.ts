import { EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadTestCore } from '#lib/core/test-support.ts';
import { editorSetup } from '#lib/editor/setup.ts';
import { errorText } from '#lib/errors/error-text.ts';
import type { Platform } from '#lib/platform.ts';
import { keyParts } from '#lib/shell/commands.ts';
import type { ShortcutRow } from '#lib/shell/shortcuts.ts';
import { LEVEL_COMMANDS, levelCommands } from './level-commands.ts';
import { levelShortcuts } from './level-shortcuts.ts';
import { editorFor, programFor, screenWith } from './test-support.ts';

/** A row as the panel shows it: its text, then its keys, an arrow by the name of its icon. */
function shown({ label, keys }: ShortcutRow, platform: Platform = 'other'): string {
	const written =
		typeof keys === 'string'
			? keys
			: keyParts(keys, platform)
					.map((part) => ('icon' in part ? part.icon : part.text))
					.join('+');
	return `${label}: ${written}`;
}

/** The groups of the panel, column by column, each with its rows as the panel shows them. */
function panel(platform: Platform = 'other', screen = screenWith()) {
	return levelShortcuts(levelCommands(screen, platform)).map((column) =>
		column.map(({ title, rows }) => [title, ...rows.map((row) => shown(row, platform))])
	);
}

describe('levelShortcuts', () => {
	it('lists the shortcuts under Run on the left and Edit on the right, as the menus name them', () => {
		expect(panel()).toEqual([
			[['Run', 'Run, Pause, Resume: Ctrl+Enter', 'Step: F10', 'Reset: Ctrl+Shift+Enter']],
			[
				[
					'Edit',
					'Undo: Ctrl+Z',
					'Redo: Ctrl+Y',
					'Indent lines: Tab',
					'Unindent lines: Shift+Tab',
					'Comment lines: Ctrl+:',
					'Move line up: Alt+arrow-up',
					'Move line down: Alt+arrow-down',
					'Leave the editor: Esc, then Tab'
				]
			]
		]);
	});

	it('names Cmd on a computer of Apple, and its own shortcut for Redo', () => {
		expect(panel('mac')).toEqual([
			[['Run', 'Run, Pause, Resume: Cmd+Enter', 'Step: F10', 'Reset: Cmd+Shift+Enter']],
			[
				[
					'Edit',
					'Undo: Cmd+Z',
					'Redo: Cmd+Shift+Z',
					'Indent lines: Tab',
					'Unindent lines: Shift+Tab',
					'Comment lines: Cmd+:',
					'Move line up: Alt+arrow-up',
					'Move line down: Alt+arrow-down',
					'Leave the editor: Esc, then Tab'
				]
			]
		]);
	});

	it('names Run by its three texts, whatever the program does now', () => {
		const paused = screenWith(
			() => editorFor(),
			false,
			() => programFor('resume')
		);

		expect(panel('other', paused)).toEqual(panel());
	});

	it('lists every command that has a shortcut, once', () => {
		const commands = levelCommands(screenWith(), 'other');
		const listed = levelShortcuts(commands)
			.flat()
			.flatMap(({ rows }) => rows.map(({ id }) => id));

		expect(listed).toEqual([...new Set(listed)]);
		expect(LEVEL_COMMANDS.filter((name) => commands[name].shortcut)).toEqual(
			LEVEL_COMMANDS.filter((name) => listed.includes(name))
		);
	});

	describe('the keys of the code', () => {
		// The editor asks the core what its code is, and checks it, as soon as it is made.
		beforeAll(loadTestCore);

		it('are Tab and Shift+Tab in the editor, which the panel lists without a command', () => {
			const tab = EditorState.create({ extensions: editorSetup('Your code', errorText) })
				.facet(keymap)
				.flat()
				.filter((binding) => binding.key === 'Tab');

			expect(tab.some((binding) => binding.run && binding.shift)).toBe(true);
		});
	});
});
