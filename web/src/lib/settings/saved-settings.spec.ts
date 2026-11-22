import { describe, expect, it } from 'vitest';
import { SPEEDS } from '#lib/run/pace.ts';
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
		saveSettings(store, { ...DEFAULT_SETTINGS, theme });
		expect(loadSettings(store)).toEqual({ ...DEFAULT_SETTINGS, theme });
	});

	it.each(SPEEDS)('come back as they were saved, with the speed %d', (speed) => {
		const { store } = storeWith();
		saveSettings(store, { ...DEFAULT_SETTINGS, speed });
		expect(loadSettings(store)).toEqual({ ...DEFAULT_SETTINGS, speed });
	});

	it('are saved with the version of their shape, the speed as its steps per second', () => {
		const { store, held } = storeWith();
		saveSettings(store, { theme: 'night-desk', speed: 5 });
		expect(JSON.parse(held[SETTINGS_KEY] ?? '')).toEqual({
			theme: 'night-desk',
			speed: 5,
			version: 1
		});
	});

	it('are saved with Instant by its name, which JSON has no number for', () => {
		const { store, held } = storeWith();
		saveSettings(store, { theme: 'day-desk', speed: Infinity });
		expect(JSON.parse(held[SETTINGS_KEY] ?? '')).toMatchObject({ speed: 'instant' });
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
		expect(loadSettings(store)).toEqual({ ...DEFAULT_SETTINGS, theme: 'night-desk' });
	});

	it('keep a speed that the list no longer holds as the nearest one that it does', () => {
		// Saved by a list that had 3 and 10 steps per second.
		expect(loadSettings(storeWith('{"speed":3,"version":1}').store).speed).toBe(2);
		expect(loadSettings(storeWith('{"speed":10,"version":1}').store).speed).toBe(5);
	});

	it.each([
		['no speed', '{"theme":"night-desk","version":1}'],
		['a speed that isn’t a number', '{"speed":"fast","version":1}'],
		['a speed written as a text', '{"speed":"5","version":1}'],
		['a speed of zero', '{"speed":0,"version":1}'],
		['a speed below zero', '{"speed":-5,"version":1}'],
		// What `JSON.stringify` writes for a number without end, or for one that isn't a number.
		['a speed that JSON couldn’t write', '{"speed":null,"version":1}'],
		['another version', '{"speed":5,"version":2}']
	])('take the normal speed with %s', (_, value) => {
		expect(loadSettings(storeWith(value).store).speed).toBe(DEFAULT_SETTINGS.speed);
	});

	it('keep the theme beside a speed they can’t read, and the speed beside such a theme', () => {
		expect(
			loadSettings(storeWith('{"theme":"night-desk","speed":"fast","version":1}').store)
		).toEqual({
			theme: 'night-desk',
			speed: DEFAULT_SETTINGS.speed
		});
		expect(loadSettings(storeWith('{"theme":"dusk-desk","speed":20,"version":1}').store)).toEqual({
			theme: DEFAULT_SETTINGS.theme,
			speed: 20
		});
	});
});
