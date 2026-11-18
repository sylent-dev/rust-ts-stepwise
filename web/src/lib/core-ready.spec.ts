import { describe, expect, it, vi } from 'vitest';
import { loadCore } from './core.ts';
import { coreReady } from './core-ready.svelte.ts';
import { loadFailed } from './startup.ts';

vi.mock('./core.ts', () => ({ loadCore: vi.fn() }));
vi.mock('./startup.ts', () => ({ loadFailed: vi.fn() }));

describe('coreReady', () => {
	it('says that the core is ready once it has loaded', async () => {
		vi.mocked(loadCore).mockResolvedValue({ version: '0.1.0' });
		const core = coreReady();
		expect(core.ready).toBe(false);
		await vi.waitFor(() => expect(core.ready).toBe(true));
		expect(loadFailed).not.toHaveBeenCalled();
	});

	it('lets the page say that the core couldn’t load', async () => {
		vi.mocked(loadCore).mockRejectedValue(new Error('offline'));
		const core = coreReady();
		await vi.waitFor(() => expect(loadFailed).toHaveBeenCalledOnce());
		expect(core.ready).toBe(false);
	});
});
