import { describe, expect, it } from 'vitest';
import english from '../../../locales/en.ftl?raw';
import { createBundle } from '#lib/i18n.ts';
import { DEFAULT_SETTINGS, isTheme, themeMessage, THEMES } from './settings.ts';

describe('the themes', () => {
	const { bundle } = createBundle('en', english);

	// The name of a theme is a message whose name is built: only a test ties the two lists.
	it.each(THEMES)('%s has its name in the translation file', (theme) => {
		expect(bundle.hasMessage(themeMessage(theme)), themeMessage(theme)).toBe(true);
	});

	it('are told from any other value', () => {
		expect(THEMES.every(isTheme)).toBe(true);
		expect(['dusk-desk', '', 1, null, undefined, ['night-desk']].some(isTheme)).toBe(false);
	});

	it('have Day Desk as the one of a first visit', () => {
		expect(DEFAULT_SETTINGS.theme).toBe('day-desk');
	});
});
