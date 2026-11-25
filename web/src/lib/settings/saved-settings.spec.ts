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

	it.each([true, false])('come back as they were saved, with the sounds %s', (sounds) => {
		const { store } = storeWith();
		saveSettings(store, { ...DEFAULT_SETTINGS, sounds });
		expect(loadSettings(store)).toEqual({ ...DEFAULT_SETTINGS, sounds });
	});

	it('are saved with the version of their shape, the speed as its steps per second', () => {
		const { store, held } = storeWith();
		saveSettings(store, { theme: 'night-desk', speed: 5, sounds: true });
		expect(JSON.parse(held[SETTINGS_KEY] ?? '')).toEqual({
			theme: 'night-desk',
			speed: 5,
			sounds: true,
			version: 1
		});
	});

	it('keep beside them a field that a later version saved', () => {
		const { store, held } = storeWith('{"theme":"day-desk","language":"fr","version":1}');
		saveSettings(store, { theme: 'night-desk', speed: 5, sounds: false });
		expect(JSON.parse(held[SETTINGS_KEY] ?? '')).toEqual({
			theme: 'night-desk',
			language: 'fr',
			speed: 5,
			sounds: false,
			version: 1
		});
	});

	it('replace what they can’t read, and what an older version saved', () => {
		for (const value of [
			'{"theme":"night-de',
			'{"theme":"day-desk","language":"fr","version":0}'
		]) {
			const { store, held } = storeWith(value);
			saveSettings(store, { theme: 'night-desk', speed: 5, sounds: false });
			expect(JSON.parse(held[SETTINGS_KEY] ?? '')).toEqual({
				theme: 'night-desk',
				speed: 5,
				sounds: false,
				version: 1
			});
		}
	});

	it('leave what a newer version saved, which they can’t read', () => {
		const newer = '{"theme":"day-desk","language":"fr","version":2}';
		const { store, held } = storeWith(newer);
		saveSettings(store, { theme: 'night-desk', speed: 5, sounds: false });
		expect(held[SETTINGS_KEY]).toBe(newer);
	});

	it('are saved with Instant by its name, which JSON has no number for', () => {
		const { store, held } = storeWith();
		saveSettings(store, { ...DEFAULT_SETTINGS, speed: Infinity });
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

	it.each([
		['no sounds', '{"theme":"night-desk","version":1}'],
		['sounds written as a text', '{"sounds":"true","version":1}'],
		['sounds written as a number', '{"sounds":1,"version":1}'],
		['sounds that JSON couldn’t write', '{"sounds":null,"version":1}'],
		['another version', '{"sounds":true,"version":2}']
	])('take no sound with %s', (_, value) => {
		expect(loadSettings(storeWith(value).store).sounds).toBe(false);
	});

	it('keep each setting beside one they can’t read', () => {
		expect(
			loadSettings(
				storeWith('{"theme":"night-desk","speed":"fast","sounds":true,"version":1}').store
			)
		).toEqual({
			theme: 'night-desk',
			speed: DEFAULT_SETTINGS.speed,
			sounds: true
		});
		expect(
			loadSettings(storeWith('{"theme":"dusk-desk","speed":20,"sounds":"on","version":1}').store)
		).toEqual({
			theme: DEFAULT_SETTINGS.theme,
			speed: 20,
			sounds: false
		});
	});
});
