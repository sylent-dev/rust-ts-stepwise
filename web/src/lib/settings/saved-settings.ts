// The settings as a browser keeps them (see Local files in specs.md): under one name, their
// fields beside the version of their shape, `{"theme":"night-desk","version":1}`. A field that is
// missing, or that can't be read, takes its default: a setting added later needs no new version.
// The script of `src/app.html` reads the same value before the first paint: a test keeps the two
// in step (lib/page-theme.spec.ts).

import { keyOf, type Store } from '#lib/storage/store.ts';
import { DEFAULT_SETTINGS, isTheme, type Settings } from './settings.ts';

/** The name the settings are saved under. */
const NAME = 'settings';

/** The version of the shape of what is saved. */
const VERSION = 1;

/** The key of `localStorage` that holds the settings: another tab that saves them changes it. */
export const SETTINGS_KEY = keyOf(NAME);

/** The settings saved in a store, each one that is missing or can't be read at its default. */
export function loadSettings(store: Store): Settings {
	const saved = store.read(NAME, VERSION);
	return { theme: isTheme(saved?.theme) ? saved.theme : DEFAULT_SETTINGS.theme };
}

/** Saves the settings in a store. */
export function saveSettings(store: Store, settings: Settings): void {
	store.write(NAME, VERSION, settings);
}
