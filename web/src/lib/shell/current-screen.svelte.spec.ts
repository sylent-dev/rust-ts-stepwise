import { beforeEach, describe, expect, it, vi } from 'vitest';
import { currentPage } from '#lib/page/startup.svelte.ts';
import { currentScreen } from './current-screen.svelte.ts';
import { currentWindow } from './current-window.svelte.ts';

vi.mock('./current-window.svelte.ts', () => ({ currentWindow: { fit: 'screen' } }));
vi.mock('#lib/page/startup.svelte.ts', () => ({ currentPage: { failed: false } }));

/** The window and the page as the test sets them. */
const shown = vi.mocked<{ fit: string }>(currentWindow);
const page = vi.mocked<{ failed: boolean }>(currentPage);

describe('currentScreen', () => {
	beforeEach(() => {
		shown.fit = 'screen';
		page.failed = false;
	});

	it('shows in a window large enough, on a page that loaded', () => {
		expect(currentScreen.shows).toBe(true);
	});

	it.each(['small', 'phone'])('doesn’t show under the message of a window too small: %s', (fit) => {
		shown.fit = fit;

		expect(currentScreen.shows).toBe(false);
	});

	it('doesn’t show under the message of the page itself', () => {
		page.failed = true;

		expect(currentScreen.shows).toBe(false);
	});
});
