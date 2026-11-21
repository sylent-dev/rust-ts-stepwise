// The commands of a screen (see Level screen in specs.md): what the learner asks of the screen
// by a row of a menu or by a shortcut, later by a button and its tip: **Undo**, **Run**. Not the
// commands of the language, which the command menu lists (step 20). A command is written once,
// with its name, its shortcut, its state and what it runs: every place that shows it or hears it
// reads it here. Nothing here touches the page: the screen hears the keys (screen-shortcuts.svelte)
// and asks which command they name.

import type { IconName } from '#lib/icon-name.ts';
import { t } from '#lib/i18n.ts';
import type { Platform } from '#lib/platform.ts';

/** A key that writes no character, named as a keyboard event names it (`key`). */
export type NamedKey = 'ArrowUp' | 'ArrowDown';

/** The keys held with the key of a shortcut. */
interface Held {
	/** The key of the shortcuts: Ctrl, and Cmd on a computer of Apple. */
	ctrl?: true;
	/**
	 * Never written beside a sign or a digit: the keyboard decides whether writing it takes
	 * Shift (`:` alone on an AZERTY keyboard, with Shift on a QWERTY one), and a press is
	 * compared by the character it writes. A limit, read and not tried: with Cmd held, a
	 * computer of Apple gives the character of the key without Shift, so a sign that its
	 * keyboard writes with Shift isn't heard there (see docs/backlog.md).
	 */
	shift?: true;
	alt?: true;
}

/**
 * A shortcut: a key pressed while others are held. The key is the character that it writes, a
 * letter in lowercase (`z`, `:`), or the name of a key that writes none. So that a shortcut is
 * the same on every keyboard, the character is read, never the place of its key.
 */
export type Shortcut = Held & ({ character: string } | { key: NamedKey });

/**
 * A command of a screen. What changes with the screen (`enabled`, and later a text that follows
 * the run) is a getter, read each time: a command is given as it is, never copied, since a copy
 * (`{ ...command }`) would keep the values of the moment.
 */
export interface ScreenCommand {
	/** Its name in the code, the same in every language: `undo`. */
	id: string;
	/** Its text, in a menu as on a tip. */
	label: string;
	/** Its shortcut, the one that the interface shows. */
	shortcut?: Shortcut;
	/** The shortcuts that run it too, shown nowhere: a habit from another editor. */
	alsoHeard?: readonly Shortcut[];
	/**
	 * Whether it can run now: a row greyed otherwise, and a shortcut that does nothing. It
	 * follows the state of the screen: what shows it reads it again.
	 */
	readonly enabled: boolean;
	run(): void;
}

/** What a shortcut reads of a keyboard event. */
export interface KeyPress {
	key: string;
	ctrlKey: boolean;
	shiftKey: boolean;
	altKey: boolean;
	metaKey: boolean;
}

/** Whether a character is the same in lowercase and in capitals: a sign, a digit. */
function hasNoCase(character: string): boolean {
	return character.toLowerCase() === character.toUpperCase();
}

/** Whether a press of the keyboard is this shortcut, on this computer. */
function isPressed(shortcut: Shortcut, press: KeyPress, platform: Platform): boolean {
	// The key of the shortcuts of the other kind of computer names another shortcut. With Alt
	// too: AltGr, which writes `#`, is Ctrl and Alt for Windows.
	const [main, other] =
		platform === 'mac' ? [press.metaKey, press.ctrlKey] : [press.ctrlKey, press.metaKey];
	if (other || main !== (shortcut.ctrl ?? false) || press.altKey !== (shortcut.alt ?? false)) {
		return false;
	}
	const shift = press.shiftKey === (shortcut.shift ?? false);
	if ('key' in shortcut) return press.key === shortcut.key && shift;
	// A letter comes in capitals with Shift, or with the capitals locked.
	if (press.key.toLowerCase() !== shortcut.character) return false;
	return hasNoCase(shortcut.character) || shift;
}

/**
 * The command that a press of the keyboard names, by its shortcut or by one of those that it
 * also hears; `undefined` for a press that is no shortcut of the screen. A command that can't
 * run now is still given: its shortcut stays the one of the screen, and never reaches the
 * browser.
 */
export function commandFor(
	press: KeyPress,
	commands: readonly ScreenCommand[],
	platform: Platform
): ScreenCommand | undefined {
	return commands.find(({ shortcut, alsoHeard = [] }) =>
		[...(shortcut ? [shortcut] : []), ...alsoHeard].some((heard) =>
			isPressed(heard, press, platform)
		)
	);
}

/** The keys that a shortcut names by a word, which a language may write its own way. */
export const KEY_NAMES = ['ctrl', 'cmd', 'shift', 'alt'] as const;

/** A key named by a word. */
export type KeyName = (typeof KEY_NAMES)[number];

/** The name of the message that holds the name of a key: `key-ctrl`. */
export function keyMessage(key: KeyName): string {
	return `key-${key}`;
}

/** A key of a shortcut as the interface shows it: its name or its character, or a drawing. */
export type KeyPart = { text: string } | { icon: IconName };

/**
 * How each key without a character is shown. An arrow is drawn, as the one printed on the key:
 * the character `↑` reads as a circumflex accent in a small text.
 */
const NAMED_KEYS = {
	ArrowUp: { icon: 'arrow-up' },
	ArrowDown: { icon: 'arrow-down' }
} satisfies Record<NamedKey, KeyPart>;

/** The keys held for a shortcut on this computer, in the order they are said: Ctrl, Shift, Alt. */
function heldKeys(shortcut: Shortcut, platform: Platform): KeyName[] {
	const held: KeyName[] = [];
	if (shortcut.ctrl) held.push(platform === 'mac' ? 'cmd' : 'ctrl');
	if (shortcut.shift) held.push('shift');
	if (shortcut.alt) held.push('alt');
	return held;
}

/**
 * A shortcut as the interface shows it, key by key, the held ones first: Ctrl, Shift, Z. The
 * interface writes a `+` between two keys.
 */
export function keyParts(shortcut: Shortcut, platform: Platform): KeyPart[] {
	return [
		...heldKeys(shortcut, platform).map((key) => ({ text: t(keyMessage(key)) })),
		'key' in shortcut ? NAMED_KEYS[shortcut.key] : { text: shortcut.character.toUpperCase() }
	];
}

/** How a screen reader is told each held key (`aria-keyshortcuts`). */
const SPOKEN_KEYS = {
	ctrl: 'Control',
	cmd: 'Meta',
	shift: 'Shift',
	alt: 'Alt'
} satisfies Record<KeyName, string>;

/**
 * A shortcut as a screen reader is told it (`aria-keyshortcuts`): the names of the keys as a
 * keyboard event gives them, in English whatever the language, `Control+Z`.
 */
export function spokenShortcut(shortcut: Shortcut, platform: Platform): string {
	return [
		...heldKeys(shortcut, platform).map((key) => SPOKEN_KEYS[key]),
		'key' in shortcut ? shortcut.key : shortcut.character.toUpperCase()
	].join('+');
}
