// The settings (see Settings in specs.md): what the learner chooses for the whole application,
// not for a level. A setting arrives with the step that codes it. Nothing here knows how they are
// saved (saved-settings.ts).

import { NORMAL_SPEED } from '#lib/run/pace.ts';

/** The themes, each by the name the page takes (`data-theme`, see lib/styles/colors.css). */
export const THEMES = ['day-desk', 'night-desk'] as const;

/** A theme of the interface. The map keeps the same look in both. */
export type Theme = (typeof THEMES)[number];

/** Whether a value is the name of a theme. */
export function isTheme(value: unknown): value is Theme {
	return THEMES.some((theme) => theme === value);
}

/** The name of the message that holds the name of a theme: `theme-night-desk`. */
export function themeMessage(theme: Theme): string {
	return `theme-${theme}`;
}

/** The settings of the application. */
export interface Settings {
	theme: Theme;
	/**
	 * The speed of a program, in steps per second, one of the list (`SPEEDS` in run/pace.ts):
	 * `Infinity` for **Instant**. The panel of the settings doesn't show it: the menu **Run** and
	 * the status bar of a level choose it (see Running a program in specs.md).
	 */
	speed: number;
	/** Whether a run plays its sounds (see Sounds in specs.md). */
	sounds: boolean;
}

/**
 * The settings of a first visit: Day Desk, so that a whole class sees the same screen, the normal
 * speed, and no sound, so that a classroom stays quiet.
 */
export const DEFAULT_SETTINGS: Readonly<Settings> = {
	theme: 'day-desk',
	speed: NORMAL_SPEED,
	sounds: false
};

/** The two values of **Sounds**, as its segments show them, from left to right. */
export const SOUNDS = ['off', 'on'] as const;

/** A value of **Sounds**, as its segments show it. */
export type SoundsValue = (typeof SOUNDS)[number];

/** The name of the message that holds a value of **Sounds**: `sounds-on`. */
export function soundsMessage(value: SoundsValue): string {
	return `sounds-${value}`;
}
