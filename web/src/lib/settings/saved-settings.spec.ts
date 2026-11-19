import { describe, expect, it } from 'vitest';
import { openStore } from '#lib/storage/store.ts';
import { memoryBackend } from '#lib/storage/test-support.ts';
import { loadSettings, saveSettings, SETTINGS_KEY } from './saved-settings.ts';
import { DEFAULT_SETTINGS, THEMES } from './settings.ts';

/** A store over a storage in memory that holds `value` as the settings. */
function storeWith(value?: string) {
	const backend = memoryBackend(value === undefined ? {} : { [SETTINGS_KEY]: value });
	return {
		store: openStore(
			() => backend,
			() => {}
		),
		held: backend.held
	};
}

describe('the settings saved', () => {
	it('are under the key of the settings', () => {
		expect(SETTINGS_KEY).toBe('stepwise.settings');
	});

	it('are the defaults at a first visit', () => {
		expect(loadSettings(storeWith().store)).toEqual(DEFAULT_SETTINGS);
	});

	it.each(THEMES)('come back as they were saved, with the theme %s', (theme) => {
		const { store } = storeWith();
		saveSettings(store, { theme });
		expect(loadSettings(store)).toEqual({ theme });
	});

	it('are saved with the version of their shape', () => {
		const { store, held } = storeWith();
		saveSettings(store, { theme: 'night-desk' });
		expect(JSON.parse(held[SETTINGS_KEY] ?? '')).toEqual({ theme: 'night-desk', version: 1 });
	});

	it.each([
		['a theme that doesn’t exist', '{"theme":"dusk-desk","version":1}'],
		['a theme that isn’t a name', '{"theme":["night-desk"],"version":1}'],
		['no theme', '{"version":1}'],
		['another version', '{"theme":"night-desk","version":2}'],
		['damaged data', '{"theme":"night-de']
	])('take the default theme with %s', (_, value) => {
		expect(loadSettings(storeWith(value).store)).toEqual(DEFAULT_SETTINGS);
	});

	it('keep what they know beside a field they don’t', () => {
		const { store } = storeWith('{"theme":"night-desk","volume":11,"version":1}');
		expect(loadSettings(store)).toEqual({ theme: 'night-desk' });
	});
});
