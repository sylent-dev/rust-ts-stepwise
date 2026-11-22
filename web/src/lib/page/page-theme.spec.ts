// The script of `src/app.html` that gives the page the theme saved, before its first paint. It
// can't share the code of the application, which loads after it: these tests run it against
// what the application saves, so that the two stay in step.

import { describe, expect, it } from 'vitest';
import { loadSettings, saveSettings, SETTINGS_KEY } from '#lib/settings/saved-settings.ts';
import { DEFAULT_SETTINGS, THEMES } from '#lib/settings/settings.ts';
import { openStore, type Backend } from '#lib/storage/store.ts';
import { memoryBackend } from '#lib/storage/test-support.ts';
import page from '../../app.html?raw';
import { pageScripts, runPageScript } from './test-support.ts';

/** The theme the page is written with: the one it keeps when the script changes nothing. */
const WRITTEN = /<html[^>]* data-theme="([^"]+)"/.exec(page)?.[1];

/** The scripts written in the page itself. */
const scripts = pageScripts(page);

/** A storage in memory that holds `value` as the settings. */
function storageWith(value?: string): Backend {
	return memoryBackend(value === undefined ? {} : { [SETTINGS_KEY]: value });
}

/**
 * The theme of the page once its script has run, in a browser that hands `storage` as its
 * `localStorage`, or that throws when the page asks for it.
 */
function themeAfter(storage: Backend | Error): string | undefined {
	let theme = WRITTEN;
	const browser = {
		get localStorage() {
			if (storage instanceof Error) throw storage;
			return storage;
		},
		document: {
			documentElement: {
				setAttribute(name: string, value: string) {
					if (name === 'data-theme') theme = value;
				}
			}
		}
	};
	runPageScript(scripts[0] ?? '', browser);
	return theme;
}

describe('the script of the page', () => {
	it('is the first of the page, which is written in the default theme', () => {
		expect(scripts[0]).toContain('data-theme');
		expect(WRITTEN).toBe(
			loadSettings(
				openStore(
					() => storageWith(),
					() => {}
				)
			).theme
		);
	});

	it('is written for an old browser', () => {
		expect(scripts[0]).not.toMatch(/=>|\b(const|let|class)\b|`|\?\.|\?\?|\.\.\.|catch\s*\{/);
	});

	it('keeps the default theme at a first visit', () => {
		expect(themeAfter(storageWith())).toBe(WRITTEN);
	});

	it.each(THEMES)('gives the page the theme %s that the application saved', (theme) => {
		const storage = storageWith();
		saveSettings(
			openStore(
				() => storage,
				() => {}
			),
			{ ...DEFAULT_SETTINGS, theme }
		);
		expect(themeAfter(storage)).toBe(theme);
	});

	it.each([
		['a theme that doesn’t exist', '{"theme":"dusk-desk","version":1}'],
		['no theme', '{"version":1}'],
		['another version', '{"theme":"night-desk","version":2}'],
		['damaged data', '{"theme":"night-de'],
		['a text', '"night-desk"'],
		[
			'a known theme beside a field it doesn’t know',
			'{"theme":"night-desk","volume":11,"version":1}'
		]
	])('gives the page the theme of the application with %s', (_, value) => {
		const storage = storageWith(value);
		expect(themeAfter(storage)).toBe(
			loadSettings(
				openStore(
					() => storage,
					() => {}
				)
			).theme
		);
	});

	it('keeps the default theme when the browser blocks the storage', () => {
		expect(themeAfter(new DOMException('The operation is insecure.', 'SecurityError'))).toBe(
			WRITTEN
		);
	});
});
