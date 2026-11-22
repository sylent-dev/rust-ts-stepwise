// The settings in use (see Settings in specs.md): read from the browser when the application
// starts, then saved at each change, without a button to save.

import { store } from '#lib/storage/browser-store.svelte.ts';
import { loadSettings, saveSettings } from './saved-settings.ts';
import type { Settings, Theme } from './settings.ts';

const current: Settings = $state(loadSettings(store));

/** The settings in use. They change through the functions of this module, which save them. */
export const settings: Readonly<Settings> = current;

/** Chooses a theme: it applies at once and is saved. */
export function chooseTheme(theme: Theme): void {
	current.theme = theme;
	saveSettings(store, current);
}

/**
 * Chooses a speed, in steps per second, one of the list (`SPEEDS` in run/pace.ts): a program
 * that runs follows it at its next frame, and it is saved.
 */
export function chooseSpeed(speed: number): void {
	current.speed = speed;
	saveSettings(store, current);
}

/** Takes the settings as the browser holds them now: another tab has just saved them. */
export function followSavedSettings(): void {
	Object.assign(current, loadSettings(store));
}
