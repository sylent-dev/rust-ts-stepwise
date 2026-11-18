import { describe, expect, it } from 'vitest';
import { PHONE_UNDER, SMALLEST_WINDOW, windowFit } from './window-size.ts';

const { width, height } = SMALLEST_WINDOW;

describe('windowFit', () => {
	it('shows the screen from the smallest window', () => {
		expect(windowFit(width, height)).toBe('screen');
		expect(windowFit(1920, 1080)).toBe('screen');
	});

	it('asks for a larger window when one side is too short', () => {
		expect(windowFit(width - 1, height)).toBe('small');
		expect(windowFit(width, height - 1)).toBe('small');
		expect(windowFit(1024, 640)).toBe('small');
	});

	it('asks for a larger window at the zoom that makes the pixels larger', () => {
		// At 125 %, a window of 1280 × 720 has 1024 × 576 pixels of the page.
		expect(windowFit(width / 1.25, height / 1.25)).toBe('small');
	});

	it('asks for a computer under the width of a phone, whatever the height', () => {
		expect(windowFit(PHONE_UNDER - 1, 2000)).toBe('phone');
		expect(windowFit(390, 844)).toBe('phone');
	});

	it('still asks for a larger window at the width where a phone ends', () => {
		expect(windowFit(PHONE_UNDER, 600)).toBe('small');
	});
});
