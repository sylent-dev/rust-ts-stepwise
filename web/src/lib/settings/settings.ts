// The settings (see Settings in specs.md): what the learner chooses for the whole application,
// not for a level. A setting arrives with the step that codes it: the speed with the running
// (step 17), **Sounds** with the sounds (step 18). Nothing here knows how they are saved
// (saved-settings.ts).

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
}

/** The settings of a first visit: Day Desk, so that a whole class sees the same screen. */
export const DEFAULT_SETTINGS: Readonly<Settings> = { theme: 'day-desk' };
