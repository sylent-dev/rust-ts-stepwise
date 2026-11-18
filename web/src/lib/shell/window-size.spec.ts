import { describe, expect, it } from 'vitest';
import {
	PHONE_UNDER,
	SMALLEST_WINDOW,
	windowAdvice,
	windowFit,
	type WindowPlace
} from './window-size.ts';

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

describe('windowAdvice', () => {
	/** A laptop of 1366 × 768 whose system keeps a bar of 40 pixels. */
	const laptop = { availWidth: 1366, availHeight: 728, fullScreen: false };
	const floating: WindowPlace = { ...laptop, outerWidth: 1100, outerHeight: 700 };
	const maximized: WindowPlace = { ...laptop, outerWidth: 1366, outerHeight: 728 };

	it('tells a window that can still grow on its screen to grow', () => {
		expect(windowAdvice(floating, 'other')).toBe('grow');
		expect(windowAdvice(floating, 'mac')).toBe('grow');
	});

	it('tells a window as wide as its screen, but not as high, to grow', () => {
		expect(windowAdvice({ ...laptop, outerWidth: 1366, outerHeight: 600 }, 'other')).toBe('grow');
	});

	it('tells a window that fills its screen the zoom and the full screen', () => {
		expect(windowAdvice(maximized, 'other')).toBe('full-screen');
	});

	it('knows a maximized window whose edges go past the screen, as Windows sizes it', () => {
		expect(windowAdvice({ ...laptop, outerWidth: 1382, outerHeight: 744 }, 'other')).toBe(
			'full-screen'
		);
	});

	it('knows a window that fills its screen a pixel short, as a rounded size', () => {
		expect(windowAdvice({ ...laptop, outerWidth: 1365, outerHeight: 727 }, 'other')).toBe(
			'full-screen'
		);
	});

	it.each(['mac', 'chromeos'] as const)(
		'tells the zoom alone on %s, whose keyboard has no F11',
		(platform) => {
			expect(windowAdvice(maximized, platform)).toBe('zoom');
		}
	);

	it('tells the zoom alone once the page is in full screen', () => {
		const fullScreen = { ...laptop, outerWidth: 1366, outerHeight: 768, fullScreen: true };
		expect(windowAdvice(fullScreen, 'other')).toBe('zoom');
	});
});
