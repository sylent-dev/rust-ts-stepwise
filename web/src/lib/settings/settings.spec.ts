import { describe, expect, it } from 'vitest';
import { NORMAL_SPEED, SPEEDS } from '#lib/run/pace.ts';
import { DEFAULT_SETTINGS, isTheme, SOUNDS, soundsMessage, THEMES } from './settings.ts';

describe('the themes', () => {
	it('are told from any other value', () => {
		expect(THEMES.every(isTheme)).toBe(true);
		expect(['dusk-desk', '', 1, null, undefined, ['night-desk']].some(isTheme)).toBe(false);
	});

	it('have Day Desk as the one of a first visit', () => {
		expect(DEFAULT_SETTINGS.theme).toBe('day-desk');
	});
});

describe('the speed', () => {
	it('is the normal one at a first visit, a speed of the list', () => {
		expect(DEFAULT_SETTINGS.speed).toBe(NORMAL_SPEED);
		expect(SPEEDS).toContain(DEFAULT_SETTINGS.speed);
	});
});

describe('the sounds', () => {
	it('are off at a first visit, so that a classroom stays quiet', () => {
		expect(DEFAULT_SETTINGS.sounds).toBe(false);
	});

	it('show Off then On, each by its message', () => {
		expect(SOUNDS.map(soundsMessage)).toEqual(['sounds-off', 'sounds-on']);
	});
});
