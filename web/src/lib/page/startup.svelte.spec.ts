// What the application tells the page, and what it remembers of it (see startup.svelte.ts). The
// script of the page that answers has its own tests (page-startup.spec.ts).

import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applicationStarted, currentPage, loadFailed } from './startup.svelte.ts';

/** A page whose script handed `stepwisePage` to the application. */
function openPage() {
	const stepwisePage = { started: vi.fn(), failed: vi.fn() };
	vi.stubGlobal('window', { stepwisePage });
	return stepwisePage;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('what the application tells the page', () => {
	it('says that it runs', () => {
		const page = openPage();
		applicationStarted();
		expect(page.started).toHaveBeenCalledOnce();
		expect(page.failed).not.toHaveBeenCalled();
		expect(currentPage.failed).toBe(false);
	});

	// One test for the whole story: what the module remembers never goes back.
	it('asks for the message of the page, and what follows it knows at once', () => {
		const page = openPage();
		const seen: boolean[] = [];
		const leave = $effect.root(() => {
			$effect(() => {
				seen.push(currentPage.failed);
			});
		});
		flushSync();
		expect(seen).toEqual([false]);

		loadFailed();
		flushSync();
		expect(page.failed).toHaveBeenCalledOnce();
		expect(seen).toEqual([false, true]);
		leave();
	});

	it('remembers that it asked, even in a page without its script', () => {
		vi.stubGlobal('window', {});
		expect(loadFailed).not.toThrow();
		expect(currentPage.failed).toBe(true);
	});
});
