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

// The tests tell one story, in their order: the module is loaded once for this file, and what it
// remembers never goes back.
describe('what the application tells the page', () => {
	it('says that it runs', () => {
		const page = openPage();
		applicationStarted();
		expect(page.started).toHaveBeenCalledOnce();
		expect(page.failed).not.toHaveBeenCalled();
		expect(currentPage.failed).toBe(false);
	});

	it('remembers that it asked, in a page without its script too, and tells what follows it', () => {
		vi.stubGlobal('window', {});
		const seen: boolean[] = [];
		const leave = $effect.root(() => {
			$effect(() => {
				seen.push(currentPage.failed);
			});
		});
		flushSync();
		expect(seen).toEqual([false]);

		expect(loadFailed).not.toThrow();
		flushSync();
		expect(seen).toEqual([false, true]);
		leave();
	});

	it('asks the page for its message', () => {
		const page = openPage();
		loadFailed();
		expect(page.failed).toHaveBeenCalledOnce();
		expect(page.started).not.toHaveBeenCalled();
	});
});
