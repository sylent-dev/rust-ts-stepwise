import { EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { beforeAll, describe, expect, it } from 'vitest';
import { editorMenu } from '#lib/command-menu/editor-menu.ts';
import { menuEntries } from '#lib/command-menu/words.ts';
import { vocabulary } from '#lib/core/core.ts';
import { loadTestCore } from '#lib/core/test-support.ts';
import { type Editing, EDITS } from '#lib/editor/edits.ts';
import { editorSetup } from '#lib/editor/setup.ts';
import { errorText } from '#lib/errors/error-text.ts';
import type { Platform } from '#lib/platform.ts';
import {
	commandFor,
	type KeyPress,
	keyParts,
	type ScreenCommand,
	type Shortcut
} from '#lib/shell/commands.ts';
import { commandMessage, LEVEL_COMMANDS, levelCommands } from './level-commands.ts';
import type { ProgramControls } from './program.ts';
import { type EditorAsk, editorFor, programFor, screenWith } from './test-support.ts';

/** A new press of a key, with the keys held written as a keyboard event has them. */
function press(key: string, ...held: ('ctrl' | 'shift' | 'alt' | 'meta')[]): KeyPress {
	return {
		key,
		ctrlKey: held.includes('ctrl'),
		shiftKey: held.includes('shift'),
		altKey: held.includes('alt'),
		metaKey: held.includes('meta'),
		repeat: false
	};
}

const PLATFORMS: readonly Platform[] = ['other', 'chromeos', 'mac'];

/** The shortcut of a command as its row shows it: `Ctrl+Z`, an arrow by the name of its icon. */
function shownKeys(command: ScreenCommand, platform: Platform): string | undefined {
	return (
		command.shortcut &&
		keyParts(command.shortcut, platform)
			.map((part) => ('icon' in part ? part.icon : part.text))
			.join('+')
	);
}

/** Every shortcut that a command hears, shown or not. */
const heard = ({ shortcut, alsoHeard = [] }: ScreenCommand): Shortcut[] => [
	...(shortcut ? [shortcut] : []),
	...alsoHeard
];

/**
 * A key as CodeMirror names it in a binding, its held keys in one order and the key of the
 * shortcuts under one name: `Mod-Shift-z`, `Cmd-z` and `Ctrl-z` name it three ways.
 */
function normalized(name: string): string {
	const parts = name.split(/-(?!$)/);
	const key = parts.pop() ?? '';
	const held = new Set(
		parts.map((part) => (/^(mod|cmd|meta|ctrl|control)$/i.test(part) ? 'main' : part.toLowerCase()))
	);
	return [...['main', 'shift', 'alt'].filter((part) => held.has(part)), key.toLowerCase()].join(
		'-'
	);
}

/** A shortcut of the screen, written the same way; the space by its name, as CodeMirror names it. */
function written(shortcut: Shortcut): string {
	const key =
		'key' in shortcut ? shortcut.key : shortcut.character === ' ' ? 'Space' : shortcut.character;
	return normalized(
		[shortcut.ctrl && 'Mod', shortcut.shift && 'Shift', shortcut.alt && 'Alt', key]
			.filter(Boolean)
			.join('-')
	);
}

describe('levelCommands', () => {
	it('gives each command of the screen under its name, with its text', () => {
		const commands = levelCommands(screenWith(), 'other');

		expect(Object.keys(commands)).toEqual([...LEVEL_COMMANDS]);
		expect(Object.entries(commands).map(([name, { id }]) => [name, id])).toEqual(
			LEVEL_COMMANDS.map((name) => [name, name])
		);
		expect(Object.values(commands).map(({ label }) => label)).toEqual([
			'Restore starting code…',
			'Undo',
			'Redo',
			'Comment lines',
			'Move line up',
			'Move line down',
			'Commands',
			'Toggle breakpoint',
			'Remove all breakpoints',
			'Run',
			'Step',
			'Reset',
			'Keyboard shortcuts'
		]);
	});

	it('names the message of a command', () => {
		expect(commandMessage('move-line-up')).toBe('command-move-line-up');
		expect(commandMessage('pause')).toBe('command-pause');
	});

	it('names Run by what it does now: Run, Pause while a program runs, Resume once paused', () => {
		const program = programFor();
		const { run } = levelCommands(
			screenWith(undefined, false, () => program),
			'other'
		);

		expect(run.label).toBe('Run');
		program.action = 'pause';
		expect(run.label).toBe('Pause');
		program.action = 'resume';
		expect(run.label).toBe('Resume');
	});

	it('asks the program of the screen for Run, Step and Reset', () => {
		const program = programFor();
		const commands = levelCommands(
			screenWith(undefined, false, () => program),
			'other'
		);

		commands.run.run();
		commands.step.run();
		commands.reset.run();

		expect(program.asked).toEqual(['runOrPause', 'step', 'reset']);
	});

	it('can step unless the program runs, and can always run and reset', () => {
		const program = programFor('pause', false);
		const commands = levelCommands(
			screenWith(undefined, false, () => program),
			'other'
		);
		const able = () => (['run', 'step', 'reset'] as const).filter((name) => commands[name].enabled);

		expect(able()).toEqual(['run', 'reset']);
		program.canStep = true;
		expect(able()).toEqual(['run', 'step', 'reset']);
	});

	it('follows the program of the map shown', () => {
		let shown: (ProgramControls & { asked: string[] }) | undefined;
		const commands = levelCommands(
			screenWith(undefined, false, () => shown),
			'other'
		);
		const first = programFor();

		expect(commands.run.enabled).toBe(false);
		shown = first;
		expect(commands.run.enabled).toBe(true);
		shown = programFor();
		commands.run.run();

		expect(first.asked).toEqual([]);
		expect(shown.asked).toEqual(['runOrPause']);
	});

	it.each(PLATFORMS)(
		'runs again, at a key held down, what a code editor repeats on %s',
		(platform) => {
			const commands = levelCommands(screenWith(), platform);

			expect(LEVEL_COMMANDS.filter((name) => commands[name].repeats)).toEqual([
				'undo',
				'redo',
				'move-line-up',
				'move-line-down'
			]);
		}
	);

	it.each(EDITS)('asks the editor shown for %s', (name) => {
		const editor = editorFor();
		const commands = levelCommands(
			screenWith(() => editor),
			'other'
		);

		commands[name].run();

		expect(editor.asked).toEqual([name]);
	});

	it('can run what the editor has something to do for, and nothing else without a program', () => {
		const commands = levelCommands(
			screenWith(() => editorFor(['redo', 'comment-lines'])),
			'other'
		);

		expect(LEVEL_COMMANDS.filter((name) => commands[name].enabled)).toEqual([
			'redo',
			'comment-lines',
			'commands',
			'toggle-breakpoint',
			'keyboard-shortcuts'
		]);
	});

	it('can toggle a breakpoint whenever the screen has an editor, and remove them while it has some', () => {
		const editor = editorFor([], [3]);
		const commands = levelCommands(
			screenWith(() => editor),
			'other'
		);

		expect(commands['toggle-breakpoint'].enabled).toBe(true);
		expect(commands['remove-all-breakpoints'].enabled).toBe(true);
		commands['toggle-breakpoint'].run();
		commands['remove-all-breakpoints'].run();
		expect(editor.asked).toEqual(['toggle-breakpoint', 'remove-breakpoints']);
		const none = levelCommands(
			screenWith(() => editorFor([], [])),
			'other'
		);
		expect(none['remove-all-breakpoints'].enabled).toBe(false);
	});

	it('gives Toggle breakpoint F9, and Remove all breakpoints no shortcut', () => {
		const commands = levelCommands(screenWith(), 'other');
		const all = Object.values(commands);

		expect(commandFor(press('F9'), all, 'other')).toBe(commands['toggle-breakpoint']);
		expect(commandFor(press('F9', 'ctrl'), all, 'other')).toBeUndefined();
		expect(commands['remove-all-breakpoints'].shortcut).toBeUndefined();
	});

	it('can only show the shortcuts while the screen has neither editor nor program', () => {
		const commands = levelCommands(screenWith(), 'other');

		expect(LEVEL_COMMANDS.filter((name) => commands[name].enabled)).toEqual(['keyboard-shortcuts']);
		expect(() => {
			for (const name of LEVEL_COMMANDS) commands[name].run();
		}).not.toThrow();
	});

	it('follows the editor of the level shown', () => {
		let shown: (Editing & { asked: EditorAsk[] }) | undefined;
		const commands = levelCommands(
			screenWith(() => shown),
			'other'
		);
		const first = editorFor(['undo']);
		const second = editorFor([]);

		shown = first;
		expect(commands.undo.enabled).toBe(true);
		shown = second;
		expect(commands.undo.enabled).toBe(false);
		commands.undo.run();

		expect(first.asked).toEqual([]);
		expect(second.asked).toEqual(['undo']);
	});

	it('can restore the starting code while the code shown is another one', () => {
		let canRestore = false;
		const screen = { ...screenWith(), canRestore: () => canRestore };
		const commands = levelCommands(screen, 'other');

		expect(commands['restore-starting-code'].enabled).toBe(false);
		canRestore = true;
		expect(commands['restore-starting-code'].enabled).toBe(true);
	});

	it('asks the learner to confirm before it restores the starting code', () => {
		const screen = screenWith(() => editorFor(), true);
		const commands = levelCommands(screen, 'other');

		commands['restore-starting-code'].run();

		expect(screen.confirmations).toBe(1);
	});

	it('opens the panel of the shortcuts, at any moment, without a shortcut of its own', () => {
		const screen = screenWith(
			() => editorFor(),
			false,
			() => programFor('pause')
		);
		const shortcuts = levelCommands(screen, 'other')['keyboard-shortcuts'];

		expect(shortcuts.enabled).toBe(true);
		shortcuts.run();

		expect(screen.shortcutPanels).toBe(1);
		expect([shortcuts.shortcut, shortcuts.alsoHeard]).toEqual([undefined, undefined]);
	});

	it('gives Restore starting code no shortcut, since it asks before it acts', () => {
		const restore = levelCommands(screenWith(), 'other')['restore-starting-code'];

		expect([restore.shortcut, restore.alsoHeard]).toEqual([undefined, undefined]);
	});

	it('shows the shortcuts of a code editor', () => {
		const commands = levelCommands(screenWith(), 'other');

		expect(LEVEL_COMMANDS.map((name) => shownKeys(commands[name], 'other'))).toEqual([
			undefined,
			'Ctrl+Z',
			'Ctrl+Y',
			'Ctrl+:',
			'Alt+arrow-up',
			'Alt+arrow-down',
			'Ctrl+Space',
			'F9',
			undefined,
			'Ctrl+Enter',
			'F10',
			'Ctrl+Shift+Enter',
			undefined
		]);
	});

	it('hears Ctrl+Enter for Run and Ctrl+Shift+Enter for Reset, Cmd on a computer of Apple', () => {
		const commands = levelCommands(screenWith(), 'other');
		const all = Object.values(commands);

		expect(commandFor(press('Enter', 'ctrl'), all, 'other')).toBe(commands.run);
		expect(commandFor(press('Enter', 'ctrl', 'shift'), all, 'other')).toBe(commands.reset);
		expect(commandFor(press('F10'), all, 'other')).toBe(commands.step);
		expect(commandFor(press('Enter'), all, 'other')).toBeUndefined();
		expect(shownKeys(levelCommands(screenWith(), 'mac').run, 'mac')).toBe('Cmd+Enter');
	});

	it('opens the command menu with Ctrl+Space, the key Ctrl itself on a computer of Apple', () => {
		for (const platform of PLATFORMS) {
			const commands = levelCommands(screenWith(), platform);
			const all = Object.values(commands);

			expect(shownKeys(commands.commands, platform)).toBe('Ctrl+Space');
			expect(commandFor(press(' ', 'ctrl'), all, platform)).toBe(commands.commands);
			expect(commandFor(press(' ', 'meta'), all, platform)).toBeUndefined();
		}
	});

	it('asks the screen to open or close the command menu, while it has an editor', () => {
		const screen = screenWith(() => editorFor());
		const { commands } = levelCommands(screen, 'other');

		expect(commands.enabled).toBe(true);
		commands.run();
		expect(screen.commandMenus).toBe(1);
		expect(commands.repeats).toBeUndefined();
		expect(levelCommands(screenWith(), 'other').commands.enabled).toBe(false);
	});

	it('hears Ctrl+Y and Ctrl+Shift+Z for Redo', () => {
		const commands = levelCommands(screenWith(), 'other');
		const all = Object.values(commands);

		expect(commandFor(press('y', 'ctrl'), all, 'other')).toBe(commands.redo);
		expect(commandFor(press('Z', 'ctrl', 'shift'), all, 'other')).toBe(commands.redo);
	});

	it('shows Cmd+Shift+Z for Redo on a computer of Apple, and leaves Cmd+Y to its browser', () => {
		const commands = levelCommands(screenWith(), 'mac');
		const all = Object.values(commands);

		expect(shownKeys(commands.undo, 'mac')).toBe('Cmd+Z');
		expect(shownKeys(commands.redo, 'mac')).toBe('Cmd+Shift+Z');
		expect(commandFor(press('z', 'meta', 'shift'), all, 'mac')).toBe(commands.redo);
		expect(commandFor(press('y', 'meta'), all, 'mac')).toBeUndefined();
	});

	it('hears Ctrl+/ for Comment lines, without showing it', () => {
		const commands = levelCommands(screenWith(), 'other');
		const all = Object.values(commands);

		expect(commandFor(press(':', 'ctrl'), all, 'other')).toBe(commands['comment-lines']);
		expect(commandFor(press('/', 'ctrl'), all, 'other')).toBe(commands['comment-lines']);
	});

	it.each(PLATFORMS)('gives no shortcut to two commands on %s', (platform) => {
		const shortcuts = Object.values(levelCommands(screenWith(), platform)).flatMap(heard);
		const names = shortcuts.map(written);

		expect(new Set(names).size).toBe(names.length);
	});

	it.each(PLATFORMS)('writes Shift beside no sign nor digit on %s', (platform) => {
		// The keyboard decides whether writing a sign takes Shift: a shortcut can't ask for it.
		const shortcuts = Object.values(levelCommands(screenWith(), platform)).flatMap(heard);
		const signs = shortcuts.filter(
			(shortcut) =>
				'character' in shortcut &&
				shortcut.character.toLowerCase() === shortcut.character.toUpperCase()
		);

		expect(signs.length).toBeGreaterThan(0);
		expect(signs.filter(({ shift }) => shift)).toEqual([]);
	});

	it.each(PLATFORMS)('writes a letter in lowercase on %s, as a press is compared', (platform) => {
		const shortcuts = Object.values(levelCommands(screenWith(), platform)).flatMap(heard);
		const characters = shortcuts.flatMap((shortcut) =>
			'character' in shortcut ? [shortcut.character] : []
		);

		expect(characters.filter((character) => character !== character.toLowerCase())).toEqual([]);
	});

	it.each(PLATFORMS)('uses Ctrl and Alt together in no shortcut on %s: AltGr', (platform) => {
		const shortcuts = Object.values(levelCommands(screenWith(), platform)).flatMap(heard);

		expect(shortcuts.filter(({ ctrl, alt }) => ctrl && alt)).toEqual([]);
	});
});

describe('the keys of the editor', () => {
	// The editor asks the core what its code is, and checks it, as soon as it is made.
	beforeAll(loadTestCore);

	it('are none of the shortcuts of the commands, which the screen alone hears, those of the command menu included', () => {
		const bindings = EditorState.create({
			extensions: [
				editorSetup('Your code', errorText),
				editorMenu(menuEntries(vocabulary()), 'command-menu')
			]
		})
			.facet(keymap)
			.flat();
		// A binding names its key for every computer, or for one; with `shift`, it takes the key
		// with Shift held too.
		const taken = new Set(
			bindings.flatMap((binding) =>
				[binding.key, binding.mac, binding.win, binding.linux]
					.filter((name) => name !== undefined)
					.flatMap((name) => (binding.shift ? [name, `Shift-${name}`] : [name]))
					.map(normalized)
			)
		);
		const shortcuts = PLATFORMS.flatMap((platform) =>
			Object.values(levelCommands(screenWith(), platform)).flatMap(heard)
		);

		expect(taken.size).toBeGreaterThan(10);
		expect(shortcuts.map(written).filter((shortcut) => taken.has(shortcut))).toEqual([]);
	});
});
