import { describe, expect, it } from 'vitest';
import {
	commandFor,
	KEY_NAMES,
	keyMessage,
	keyParts,
	runsOn,
	spokenShortcut,
	type KeyPress,
	type ScreenCommand,
	type Shortcut
} from './commands.ts';

/** A command that does nothing, with its keys. */
function command(id: string, keys: Partial<ScreenCommand> = {}): ScreenCommand {
	return { id, label: id, enabled: true, run: () => {}, ...keys };
}

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

const undo = command('undo', { shortcut: { character: 'z', ctrl: true } });
const redo = command('redo', {
	shortcut: { character: 'y', ctrl: true },
	alsoHeard: [{ character: 'z', ctrl: true, shift: true }]
});
const comment = command('comment', {
	shortcut: { character: ':', ctrl: true },
	alsoHeard: [{ character: '/', ctrl: true }]
});
const lineUp = command('line-up', { shortcut: { key: 'ArrowUp', alt: true } });
const run = command('run', { shortcut: { key: 'Enter', ctrl: true } });
const reset = command('reset', { shortcut: { key: 'Enter', ctrl: true, shift: true } });
const step = command('step', { shortcut: { key: 'F10' } });
const silent = command('silent');
const commands = [silent, undo, redo, comment, lineUp, run, reset, step];

/** The name of the command that a press names on a computer that isn't one of Apple. */
const named = (pressed: KeyPress) => commandFor(pressed, commands, 'other')?.id;

describe('commandFor', () => {
	it('finds a command by its shortcut', () => {
		expect(named(press('z', 'ctrl'))).toBe('undo');
		expect(named(press('ArrowUp', 'alt'))).toBe('line-up');
	});

	it('finds it by a shortcut that it also hears', () => {
		expect(named(press('y', 'ctrl'))).toBe('redo');
		expect(named(press('Z', 'ctrl', 'shift'))).toBe('redo');
		expect(named(press('/', 'ctrl'))).toBe('comment');
	});

	it('reads a letter in capitals as the letter: Shift held, or the capitals locked', () => {
		expect(named(press('Z', 'ctrl'))).toBe('undo');
		expect(named(press('z', 'ctrl', 'shift'))).toBe('redo');
	});

	it('hears the key Ctrl itself for a shortcut that keeps it, on every computer', () => {
		const space: ScreenCommand = {
			id: 'menu',
			label: 'Menu',
			shortcut: { character: ' ', ctrl: 'control' },
			enabled: true,
			run: () => undefined
		};
		for (const platform of ['other', 'mac'] as const) {
			expect(commandFor(press(' ', 'ctrl'), [space], platform)).toBe(space);
			expect(commandFor(press(' ', 'meta'), [space], platform)).toBeUndefined();
			expect(commandFor(press(' ', 'ctrl', 'meta'), [space], platform)).toBeUndefined();
		}
	});

	it('tells a letter with Shift from the letter alone', () => {
		expect(named(press('y', 'ctrl', 'shift'))).toBeUndefined();
	});

	it('hears a sign whether its keyboard writes it with Shift or without', () => {
		// `:` alone on an AZERTY keyboard, with Shift on a QWERTY one; `/` the other way round.
		expect(named(press(':', 'ctrl'))).toBe('comment');
		expect(named(press(':', 'ctrl', 'shift'))).toBe('comment');
		expect(named(press('/', 'ctrl', 'shift'))).toBe('comment');
	});

	it('compares Shift for a key that writes no character', () => {
		expect(named(press('ArrowUp', 'alt', 'shift'))).toBeUndefined();
		expect(named(press('Enter', 'ctrl'))).toBe('run');
		expect(named(press('Enter', 'ctrl', 'shift'))).toBe('reset');
	});

	it('hears a function key pressed alone, and Enter only with its held keys', () => {
		expect(named(press('F10'))).toBe('step');
		expect(named(press('F10', 'ctrl'))).toBeUndefined();
		expect(named(press('Enter'))).toBeUndefined();
		expect(named(press('Enter', 'shift'))).toBeUndefined();
	});

	it('hears nothing in a key pressed alone, nor with another key held than its own', () => {
		expect(named(press('z'))).toBeUndefined();
		expect(named(press('z', 'alt'))).toBeUndefined();
		expect(named(press('ArrowUp'))).toBeUndefined();
		expect(named(press('ArrowUp', 'ctrl'))).toBeUndefined();
	});

	it('hears nothing with AltGr, which is Ctrl and Alt for Windows', () => {
		expect(named(press('z', 'ctrl', 'alt'))).toBeUndefined();
		expect(named(press('ArrowUp', 'ctrl', 'alt'))).toBeUndefined();
	});

	it('takes Cmd for the key of the shortcuts on a computer of Apple, and Ctrl elsewhere', () => {
		expect(commandFor(press('z', 'meta'), commands, 'mac')?.id).toBe('undo');
		expect(commandFor(press('z', 'ctrl'), commands, 'mac')).toBeUndefined();
		expect(commandFor(press('ArrowUp', 'alt'), commands, 'mac')?.id).toBe('line-up');
		expect(named(press('z', 'meta'))).toBeUndefined();
		expect(commandFor(press('z', 'ctrl'), commands, 'chromeos')?.id).toBe('undo');
	});

	it('refuses the key of the shortcuts of the other kind of computer, held too', () => {
		expect(named(press('z', 'ctrl', 'meta'))).toBeUndefined();
		expect(commandFor(press('z', 'ctrl', 'meta'), commands, 'mac')).toBeUndefined();
		expect(named(press('ArrowUp', 'alt', 'meta'))).toBeUndefined();
	});

	it('still gives a command that can’t run now: its shortcut stays the one of the screen', () => {
		const off = command('undo', { shortcut: { character: 'z', ctrl: true }, enabled: false });

		expect(commandFor(press('z', 'ctrl'), [off], 'other')).toBe(off);
	});

	it('gives the first of two commands that would hear the same press', () => {
		const second = command('second', { shortcut: { character: 'z', ctrl: true } });

		expect(commandFor(press('z', 'ctrl'), [undo, second], 'other')).toBe(undo);
	});
});

describe('runsOn', () => {
	const held: KeyPress = { ...press('z', 'ctrl'), repeat: true };

	it('runs a command at a new press of its shortcut', () => {
		expect(runsOn(press('z', 'ctrl'), undo)).toBe(true);
	});

	it('runs a command once, however long its shortcut is held down', () => {
		expect(runsOn(held, undo)).toBe(false);
	});

	it('runs a command made to be repeated at each repeat of a key held down', () => {
		expect(runsOn(held, command('undo', { repeats: true }))).toBe(true);
	});

	it('runs no command that can’t run now, repeated or not', () => {
		const off = command('undo', { enabled: false, repeats: true });

		expect(runsOn(press('z', 'ctrl'), off)).toBe(false);
		expect(runsOn(held, off)).toBe(false);
	});
});

describe('keyParts', () => {
	const shown = (shortcut: Shortcut, platform: 'mac' | 'other' = 'other') =>
		keyParts(shortcut, platform).map((part) => ('icon' in part ? `<${part.icon}>` : part.text));

	it('names the held keys first, then writes a letter in capitals and a sign as it is', () => {
		expect(shown({ character: 'z', ctrl: true })).toEqual(['Ctrl', 'Z']);
		expect(shown({ character: ':', ctrl: true })).toEqual(['Ctrl', ':']);
		expect(shown({ character: 'z', ctrl: true, shift: true })).toEqual(['Ctrl', 'Shift', 'Z']);
	});

	it('draws an arrow, which a screen reader reads as the character of the arrow', () => {
		expect(shown({ key: 'ArrowUp', alt: true })).toEqual(['Alt', '<arrow-up>']);
		expect(shown({ key: 'ArrowDown', alt: true })).toEqual(['Alt', '<arrow-down>']);
		expect(keyParts({ key: 'ArrowUp', alt: true }, 'other')[1]).toEqual({
			icon: 'arrow-up',
			spoken: '↑'
		});
		expect(keyParts({ key: 'ArrowDown', alt: true }, 'other')[1]).toEqual({
			icon: 'arrow-down',
			spoken: '↓'
		});
	});

	it('names Enter and Tab, and writes a function key as it is printed', () => {
		expect(shown({ key: 'Enter', ctrl: true, shift: true })).toEqual(['Ctrl', 'Shift', 'Enter']);
		expect(shown({ key: 'Tab', shift: true })).toEqual(['Shift', 'Tab']);
		expect(shown({ key: 'Enter', ctrl: true }, 'mac')).toEqual(['Cmd', 'Enter']);
		expect(shown({ key: 'F10' })).toEqual(['F10']);
	});

	it('names the space, and Ctrl on a computer of Apple too for a shortcut that keeps it', () => {
		expect(shown({ character: ' ', ctrl: 'control' })).toEqual(['Ctrl', 'Space']);
		expect(shown({ character: ' ', ctrl: 'control' }, 'mac')).toEqual(['Ctrl', 'Space']);
		expect(spokenShortcut({ character: ' ', ctrl: 'control' }, 'mac')).toBe('Control+Space');
	});

	it('names Cmd in place of Ctrl on a computer of Apple', () => {
		expect(shown({ character: 'z', ctrl: true, shift: true }, 'mac')).toEqual([
			'Cmd',
			'Shift',
			'Z'
		]);
		expect(shown({ key: 'ArrowUp', alt: true }, 'mac')).toEqual(['Alt', '<arrow-up>']);
	});
});

describe('spokenShortcut', () => {
	it('names the keys as a keyboard event does, for a screen reader', () => {
		expect(spokenShortcut({ character: 'z', ctrl: true }, 'other')).toBe('Control+Z');
		expect(spokenShortcut({ character: 'z', ctrl: true, shift: true }, 'mac')).toBe('Meta+Shift+Z');
		expect(spokenShortcut({ character: ':', ctrl: true }, 'other')).toBe('Control+:');
		expect(spokenShortcut({ key: 'ArrowDown', alt: true }, 'other')).toBe('Alt+ArrowDown');
		expect(spokenShortcut({ key: 'Enter', ctrl: true, shift: true }, 'other')).toBe(
			'Control+Shift+Enter'
		);
		expect(spokenShortcut({ key: 'F10' }, 'mac')).toBe('F10');
	});
});

describe('keyMessage', () => {
	it('names the message of each key', () => {
		expect(KEY_NAMES.map(keyMessage)).toEqual([
			'key-ctrl',
			'key-cmd',
			'key-shift',
			'key-alt',
			'key-enter',
			'key-tab',
			'key-space',
			'key-escape'
		]);
	});
});
