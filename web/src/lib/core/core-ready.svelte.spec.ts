// The core for a screen, with its effects run as in a browser (see vitest-node-client.ts).

import { flushSync } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { loadFailed } from '#lib/page/startup.ts';
import { loadCore } from './core.ts';
import { coreReady, fromCore } from './core-ready.svelte.ts';

vi.mock('./core.ts', () => ({ loadCore: vi.fn() }));
vi.mock('#lib/page/startup.ts', () => ({ loadFailed: vi.fn() }));

describe('coreReady', () => {
	it('says that the core is ready once it has loaded', async () => {
		vi.mocked(loadCore).mockResolvedValue();
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

/** An object as the module keeps them, made from a text, which counts the times it is freed. */
class Kept {
	readonly text: string;
	freed = 0;

	constructor(text: string) {
		this.text = text;
	}

	free(): void {
		this.freed += 1;
	}
}

describe('fromCore', () => {
	it('gives nothing until the core is ready, then what `make` gives', async () => {
		vi.mocked(loadCore).mockResolvedValue();
		const make = vi.fn(() => new Kept('one'));
		let kept: { readonly current: Kept | undefined } | undefined;
		const leave = $effect.root(() => {
			kept = fromCore(make);
		});
		flushSync();
		expect(kept?.current).toBeUndefined();
		expect(make).not.toHaveBeenCalled();

		await vi.waitFor(() => expect(kept?.current?.text).toBe('one'));
		flushSync();
		expect(make).toHaveBeenCalledOnce();
		expect(kept?.current?.freed).toBe(0);
		leave();
	});

	it('frees the object once another replaces it, and once the component leaves', async () => {
		vi.mocked(loadCore).mockResolvedValue();
		let text = $state('one');
		const make = vi.fn(() => new Kept(text));
		let kept: { readonly current: Kept | undefined } | undefined;
		const leave = $effect.root(() => {
			kept = fromCore(make);
		});
		await vi.waitFor(() => expect(kept?.current?.text).toBe('one'));
		flushSync();
		const first = kept?.current;

		text = 'two';
		flushSync();
		const second = kept?.current;
		expect(second?.text).toBe('two');
		expect([first?.freed, second?.freed]).toEqual([1, 0]);

		leave();
		expect([first?.freed, second?.freed]).toEqual([1, 1]);
		expect(make).toHaveBeenCalledTimes(2);
	});

	it('makes one object for two changes before the screen follows', async () => {
		vi.mocked(loadCore).mockResolvedValue();
		let text = $state('one');
		const make = vi.fn(() => new Kept(text));
		let kept: { readonly current: Kept | undefined } | undefined;
		const leave = $effect.root(() => {
			kept = fromCore(make);
		});
		await vi.waitFor(() => expect(kept?.current?.text).toBe('one'));
		flushSync();
		const first = kept?.current;

		text = 'two';
		text = 'three';
		flushSync();
		expect(kept?.current?.text).toBe('three');
		expect(first?.freed).toBe(1);
		expect(make).toHaveBeenCalledTimes(2);
		leave();
	});

	it('makes nothing more for an effect whose cleanup uses what the effect read first', async () => {
		vi.mocked(loadCore).mockResolvedValue();
		let text = $state('one');
		const made: Kept[] = [];
		const left: string[] = [];
		const leave = $effect.root(() => {
			const kept = fromCore(() => {
				const object = new Kept(text);
				made.push(object);
				return object;
			});
			$effect(() => {
				// Read while the object is the one of the screen: a value, not the object.
				const name = kept.current?.text;
				return () => {
					if (name) left.push(name);
				};
			});
		});
		await vi.waitFor(() => expect(made).toHaveLength(1));
		flushSync();

		text = 'two';
		flushSync();
		leave();
		expect(left).toEqual(['one', 'two']);
		expect(made.map((object) => [object.text, object.freed])).toEqual([
			['one', 1],
			['two', 1]
		]);
	});

	it('makes nothing when the core can’t load', async () => {
		vi.mocked(loadCore).mockRejectedValue(new Error('offline'));
		const make = vi.fn(() => new Kept('one'));
		let kept: { readonly current: Kept | undefined } | undefined;
		const leave = $effect.root(() => {
			kept = fromCore(make);
		});
		await vi.waitFor(() => expect(loadFailed).toHaveBeenCalledOnce());
		flushSync();
		expect(kept?.current).toBeUndefined();
		leave();
		expect(make).not.toHaveBeenCalled();
	});
});
