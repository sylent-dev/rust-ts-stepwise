// The settings as a browser keeps them (see Local files in specs.md): under one name, their
// fields beside the version of their shape:
// `{"theme":"night-desk","speed":5,"sounds":true,"version":1}`. A field that is missing, or that
// can't be read, takes its default: a setting added later needs no new version. A save keeps the
// fields that it doesn't know: a tab still open on the version before, which goes on saving,
// drops no setting added since. The script of `src/app.html` reads the same value before the
// first paint: a test keeps the two in step (lib/page/page-theme.spec.ts).

import { isInstant, nearestSpeed } from '#lib/run/pace.ts';
import { keyOf, type Store } from '#lib/storage/store.ts';
import { DEFAULT_SETTINGS, isTheme, type Settings } from './settings.ts';

/** The name the settings are saved under. */
const NAME = 'settings';

/** The version of the shape of what is saved. */
const VERSION = 1;

/** The key of `localStorage` that holds the settings: another tab that saves them changes it. */
export const SETTINGS_KEY = keyOf(NAME);

/** **Instant** as it is saved: JSON writes no number without end. */
const INSTANT = 'instant';

/**
 * The speed that a value saved names, if it names one. A speed is saved as its steps per second,
 * not as its place in the list: when the list changes, a speed that it no longer holds becomes
 * the nearest one that it does, rather than whichever speed took its place.
 */
function speedFrom(saved: unknown): number | undefined {
	if (saved === INSTANT) return Infinity;
	return typeof saved === 'number' ? nearestSpeed(saved) : undefined;
}

/** The settings saved in a store, each one that is missing or can't be read at its default. */
export function loadSettings(store: Store): Settings {
	const saved = store.read(NAME, VERSION);
	return {
		theme: isTheme(saved?.theme) ? saved.theme : DEFAULT_SETTINGS.theme,
		speed: speedFrom(saved?.speed) ?? DEFAULT_SETTINGS.speed,
		sounds: typeof saved?.sounds === 'boolean' ? saved.sounds : DEFAULT_SETTINGS.sounds
	};
}

/**
 * Saves the settings in a store, over what it holds: a field that a later version of the
 * website saved beside them stays as it is.
 */
export function saveSettings(store: Store, settings: Settings): void {
	const speed = isInstant(settings.speed) ? INSTANT : settings.speed;
	store.write(NAME, VERSION, { ...store.read(NAME, VERSION), ...settings, speed });
}
