import { describe, expect, it } from 'vitest';
import { isApple } from './platform.ts';

describe('isApple', () => {
	it.each(['MacIntel', 'MacPPC', 'iPhone', 'iPad'])('knows %s as a computer of Apple', (name) => {
		expect(isApple(name)).toBe(true);
	});

	it.each(['Win32', 'Linux x86_64', 'Linux armv81', 'CrOS x86_64', ''])(
		'knows %j as another computer',
		(name) => {
			expect(isApple(name)).toBe(false);
		}
	);
});
