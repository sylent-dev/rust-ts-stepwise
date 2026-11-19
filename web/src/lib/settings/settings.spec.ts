import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, isTheme, THEMES } from './settings.ts';

describe('the themes', () => {
	it('are told from any other value', () => {
		expect(THEMES.every(isTheme)).toBe(true);
		expect(['dusk-desk', '', 1, null, undefined, ['night-desk']].some(isTheme)).toBe(false);
	});

	it('have Day Desk as the one of a first visit', () => {
		expect(DEFAULT_SETTINGS.theme).toBe('day-desk');
	});
});
