import { afterEach, describe, expect, it, vi } from 'vitest';
import { currentPlatform, platformOf } from './platform.ts';

const CHROME =
	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
const CHROMEBOOK =
	'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';

describe('platformOf', () => {
	it.each(['MacIntel', 'MacPPC', 'iPhone', 'iPad'])('knows %s as a computer of Apple', (name) => {
		expect(platformOf(name, CHROME)).toBe('mac');
	});

	it('knows a Chromebook by the name its browser gives itself', () => {
		expect(platformOf('Linux x86_64', CHROMEBOOK)).toBe('chromeos');
		expect(platformOf('Linux armv81', CHROMEBOOK)).toBe('chromeos');
	});

	it.each(['Win32', 'Linux x86_64', 'Linux armv81', ''])('knows %j as another computer', (name) => {
		expect(platformOf(name, CHROME)).toBe('other');
	});
});

describe('currentPlatform', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('asks the browser for the computer that the page runs on', () => {
		vi.stubGlobal('navigator', { platform: 'MacIntel', userAgent: CHROME });
		expect(currentPlatform()).toBe('mac');

		vi.stubGlobal('navigator', { platform: 'Linux x86_64', userAgent: CHROMEBOOK });
		expect(currentPlatform()).toBe('chromeos');
	});
});
