import { describe, expect, it } from 'vitest';
import {
	commandFor,
	KEY_NAMES,
	keyMessage,
	keyParts,
	spokenShortcut,
	type KeyPress,
	type ScreenCommand,
	type Shortcut
} from './commands.ts';

/** A command that does nothing, with its keys. */
function command(id: string, keys: Partial<ScreenCommand> = {}): ScreenCommand {
	return { id, label: id, enabled: true, run: () => {}, ...keys };
}

/** A press of a key, with the keys held written as a keyboard event has them. */
function press(key: string, ...held: ('ctrl' | 'shift' | 'alt' | 'meta')[]): KeyPress {
	return {
		key,
		ctrlKey: held.includes('ctrl'),
		shiftKey: held.includes('shift'),
		altKey: held.includes('alt'),
		metaKey: held.includes('meta')
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
const silent = command('silent');
const commands = [silent, undo, redo, comment, lineUp];

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

describe('keyParts', () => {
	const shown = (shortcut: Shortcut, platform: 'mac' | 'other' = 'other') =>
		keyParts(shortcut, platform).map((part) => ('icon' in part ? `<${part.icon}>` : part.text));

	it('names the held keys first, then writes a letter in capitals and a sign as it is', () => {
		expect(shown({ character: 'z', ctrl: true })).toEqual(['Ctrl', 'Z']);
		expect(shown({ character: ':', ctrl: true })).toEqual(['Ctrl', ':']);
		expect(shown({ character: 'z', ctrl: true, shift: true })).toEqual(['Ctrl', 'Shift', 'Z']);
	});

	it('draws an arrow', () => {
		expect(shown({ key: 'ArrowUp', alt: true })).toEqual(['Alt', '<arrow-up>']);
		expect(shown({ key: 'ArrowDown', alt: true })).toEqual(['Alt', '<arrow-down>']);
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
	});
});

describe('keyMessage', () => {
	it('names the message of each key', () => {
		expect(KEY_NAMES.map(keyMessage)).toEqual(['key-ctrl', 'key-cmd', 'key-shift', 'key-alt']);
	});
});
